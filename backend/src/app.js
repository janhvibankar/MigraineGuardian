import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { db } from './config/firebaseAdmin.js';
import userRoutes from './routes/userRoutes.js';
import checkinRoutes from './routes/checkinRoutes.js';
import pssRoutes from './routes/pssRoutes.js';
import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler.js';

const app = express();

// Disable default ETag caching to prevent 304 Not Modified on dynamic authenticated API endpoints
app.set('etag', false);

// Explicit trusted origins for production and development
const explicitTrustedOrigins = [
  'https://migraineguardian-frontend.onrender.com',
  'https://migraineguardian.vercel.app',
  'https://migraineguardian-frontend.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

// Configured origins from environment variable (comma-separated, sanitized, no bare wildcards)
const configuredOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter((o) => o && o !== '*');

const trustedOrigins = new Set([...explicitTrustedOrigins, ...configuredOrigins]);

const standardAllowedHeaders = [
  'Content-Type',
  'Authorization',
  'X-Request-Id',
  'Cache-Control',
  'Pragma',
  'Accept',
  'If-Modified-Since',
  'If-None-Match',
  'X-Requested-With',
];

const corsOptionsDelegate = (req, callback) => {
  const origin = req.headers.origin;
  let isAllowed = false;

  if (!origin) {
    // Non-browser or same-origin requests (e.g. server-side health checks, curl)
    isAllowed = true;
  } else {
    const cleanOrigin = origin.trim().replace(/\/+$/, '');
    isAllowed = trustedOrigins.has(cleanOrigin);
  }

  if (!isAllowed) {
    // Disallow untrusted origin — passes through without Access-Control-Allow-Origin header
    return callback(null, { origin: false });
  }

  // When origin is trusted, allow requested headers or fallback to standard set
  const requestedHeaders = req.headers['access-control-request-headers'];
  callback(null, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: requestedHeaders || standardAllowedHeaders,
    exposedHeaders: ['X-Request-Id'],
    maxAge: 86400,
  });
};

app.use(cors(corsOptionsDelegate));

// Structured Observability Logging Middleware
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  const start = Date.now();

  res.on('finish', () => {
    // Avoid noisy logging of frequent polling health checks when healthy
    const isHealth = req.path.includes('/health');
    if (isHealth && res.statusCode === 200) return;

    const elapsed = Date.now() - start;
    const cleanUrl = req.originalUrl ? req.originalUrl.split('?')[0] : req.url;
    console.log(
      `[HTTP] reqId=${req.id} method=${req.method} path=${cleanUrl} status=${res.statusCode} elapsed=${elapsed}ms`
    );
  });

  next();
});

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint (Public & Readiness Aware) — supports both /health and /api/health
app.get(['/health', '/api/health'], (req, res) => {
  const firebaseReady = Boolean(db);
  const isHealthy = firebaseReady;
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'OK' : 'DEGRADED',
    service: 'MigraineGuardian Express API Gateway',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: Math.round(process.uptime()),
    dependencies: {
      firebase: firebaseReady ? 'connected' : 'uninitialized',
    },
  });
});

import { getMlServiceUrl, sanitizeUrl } from './services/mlInferenceService.js';

// ML Service Health Proxy (Public) — proxies FastAPI /health, no auth required
// Dynamically resolves ML URL via getMlServiceUrl() and handles cold starts / verification
app.get(['/ml-health', '/api/ml-health'], async (req, res) => {
  const mlBase = getMlServiceUrl();
  const safeHost = sanitizeUrl(mlBase);

  if (!mlBase) {
    return res.status(503).json({
      status: 'unavailable',
      ml_host: safeHost,
      ml_error: 'config_missing',
      message: 'ML_SERVICE_URL is not configured.',
    });
  }

  const requestedTimeout = parseInt(req.query.timeout, 10);
  const timeoutMs = (!isNaN(requestedTimeout) && requestedTimeout >= 1000 && requestedTimeout <= 60000)
    ? requestedTimeout
    : 10000;

  const checkInference = req.query.check_inference === 'true';
  const targetUrl = `${mlBase}/health${checkInference ? '?check_inference=true' : ''}`;

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const r = await fetch(targetUrl, { signal: ctrl.signal });
    clearTimeout(timer);

    let body = {};
    try {
      body = await r.json();
    } catch {
      body = { raw_status: r.status };
    }

    // Check if cloud gateway warming (502/503/504/524)
    if ([502, 503, 504, 408, 520, 521, 522, 523, 524].includes(r.status)) {
      return res.status(503).json({
        status: 'warming',
        gateway: 'ok',
        ml_host: safeHost,
        ml_error: 'cold_start_warming',
        http_status: r.status,
        message: 'FastAPI ML microservice is waking up from idle state. Please retry shortly.',
      });
    }

    // Check if model failed to load or inference verification failed
    if (!r.ok || body.model_loaded === false || body.status === 'degraded') {
      return res.status(503).json({
        status: 'degraded',
        gateway: 'ok',
        ml_host: safeHost,
        ml_error: body.inference_verified === false ? 'inference_failure' : 'model_load_failure',
        model_loaded: Boolean(body.model_loaded),
        model_load_error: body.model_load_error || body.inference_error || 'ML pipeline degraded',
        message: body.model_load_error || body.inference_error || 'Model is not ready for predictions',
      });
    }

    return res.status(200).json({
      ...body,
      gateway: 'ok',
      ml_host: safeHost,
      status: 'ok',
    });
  } catch (err) {
    const isTimeout = err.name === 'AbortError';
    return res.status(503).json({
      status: 'unavailable',
      gateway: 'ok',
      ml_host: safeHost,
      ml_error: isTimeout ? 'timeout' : 'connection_refused',
      message: isTimeout
        ? `FastAPI ML service request timed out after ${timeoutMs}ms.`
        : `FastAPI ML service unreachable at ${safeHost}. Service may be stopped.`,
    });
  }
});

// RAG Chatbot Service Health Proxy (Public) — proxies external RAG /health without browser CORS issues
app.get(['/chat-health', '/rag-health', '/api/chat-health', '/api/rag-health'], async (req, res) => {
  const rawUrl = process.env.RAG_SERVICE_URL || 'https://migraine-rag-chatbot.onrender.com';
  const ragBase = rawUrl.replace(/\/api\/chat\/?$/, '').replace(/\/+$/, '');
  const safeHost = sanitizeUrl(ragBase);

  const requestedTimeout = parseInt(req.query.timeout, 10);
  const timeoutMs = (!isNaN(requestedTimeout) && requestedTimeout >= 1000 && requestedTimeout <= 60000)
    ? requestedTimeout
    : 10000;

  const targetUrl = `${ragBase}/health`;

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const r = await fetch(targetUrl, { signal: ctrl.signal });
    clearTimeout(timer);

    let body = {};
    try {
      body = await r.json();
    } catch {
      body = { raw_status: r.status };
    }

    if ([502, 503, 504, 408, 520, 521, 522, 523, 524].includes(r.status)) {
      return res.status(503).json({
        status: 'warming',
        gateway: 'ok',
        rag_host: safeHost,
        rag_error: 'cold_start_warming',
        http_status: r.status,
        message: 'RAG Chatbot microservice is waking up from idle state. Please retry shortly.',
      });
    }

    if (!r.ok || body.status !== 'ok') {
      return res.status(503).json({
        status: 'degraded',
        gateway: 'ok',
        rag_host: safeHost,
        message: body.message || 'RAG Chatbot returned non-healthy status.',
      });
    }

    return res.status(200).json({
      status: 'ok',
      gateway: 'ok',
      rag_host: safeHost,
      ...body,
    });
  } catch (err) {
    const isTimeout = err.name === 'AbortError';
    return res.status(503).json({
      status: 'unavailable',
      gateway: 'ok',
      rag_host: safeHost,
      rag_error: isTimeout ? 'timeout' : 'connection_refused',
      message: isTimeout
        ? `RAG Chatbot request timed out after ${timeoutMs}ms.`
        : `RAG Chatbot unreachable at ${safeHost}. Service may be stopped.`,
    });
  }
});

import predictionRoutes from './routes/predictionRoutes.js';
import weatherRoutes from './routes/weatherRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

// Protected API Domain Routes (Canonical /api prefix)
app.use('/api/user', userRoutes);
app.use('/api/checkins', checkinRoutes);
app.use('/api/pss', pssRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/chat', chatRoutes);

// Compatibility aliases without /api prefix (prevents 404s if client calls relative paths)
app.use('/user', userRoutes);
app.use('/checkins', checkinRoutes);
app.use('/pss', pssRoutes);
app.use('/predictions', predictionRoutes);
app.use('/weather', weatherRoutes);
app.use('/chat', chatRoutes);

// Legacy/Compatibility direct aliases for routes reported in network audits:
// 1. /today & /api/today -> checkin/prediction daily endpoints
app.use(['/today', '/api/today'], (req, res, next) => {
  // If requesting with prediction query or header, forward to predictions, else checkins
  req.url = '/today' + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '');
  checkinRoutes(req, res, next);
});

// 2. /latest & /api/latest -> PSS latest assessment
app.use(['/latest', '/api/latest'], (req, res, next) => {
  req.url = '/latest';
  pssRoutes(req, res, next);
});

// 3. /usual-location & /api/usual-location -> Weather usual location
app.use(['/usual-location', '/api/usual-location'], (req, res, next) => {
  req.url = '/usual-location';
  weatherRoutes(req, res, next);
});

// 404 & Global Error Handling
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
