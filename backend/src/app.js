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

// Protected API Domain Routes
app.use('/api/user', userRoutes);
app.use('/api/checkins', checkinRoutes);
app.use('/api/pss', pssRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/weather', weatherRoutes);





// 404 & Global Error Handling
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
