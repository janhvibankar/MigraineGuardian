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

import predictionRoutes from './routes/predictionRoutes.js';

// Protected API Domain Routes
app.use('/api/user', userRoutes);
app.use('/api/checkins', checkinRoutes);
app.use('/api/pss', pssRoutes);
app.use('/api/predictions', predictionRoutes);




// 404 & Global Error Handling
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
