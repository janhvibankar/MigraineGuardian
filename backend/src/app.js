import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes.js';
import checkinRoutes from './routes/checkinRoutes.js';
import pssRoutes from './routes/pssRoutes.js';
import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler.js';

const app = express();

// CORS Configuration
const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
app.use(
  cors({
    origin: allowedOrigin === '*' ? '*' : [allowedOrigin, 'http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint (Public)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'MigraineGuardian Express API Gateway',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ML Service Health Proxy (Public) — proxies FastAPI /health, no auth required
// Single source of truth for ML URL: process.env.FASTAPI_BASE_URL (see backend .env)
app.get('/api/ml-health', async (req, res) => {
  const mlBase = process.env.ML_SERVICE_URL || process.env.FASTAPI_BASE_URL;
  if (!mlBase) {
    return res.status(503).json({ status: 'unavailable', message: 'ML_SERVICE_URL not configured.' });
  }
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const r = await fetch(`${mlBase}/health`, { signal: ctrl.signal });
    clearTimeout(timer);
    const body = await r.json();
    res.status(r.ok ? 200 : 503).json({ ...body, gateway: 'ok' });
  } catch (err) {
    res.status(503).json({
      status: 'unavailable',
      gateway: 'ok',
      ml_error: err.name === 'AbortError' ? 'timeout' : 'connection_refused',
      message: `FastAPI ML service unreachable at ${mlBase}`,
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
