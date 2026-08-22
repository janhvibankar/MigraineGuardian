import { Router } from 'express';
import { verifyFirebaseToken } from '../middleware/verifyFirebaseToken.js';
import {
  getTodayPredictionController,
  submitMorningPredictionController,
} from '../controllers/predictionController.js';

const router = Router();

// GET /api/predictions/today
router.get('/today', verifyFirebaseToken, getTodayPredictionController);

// POST /api/predictions/morning
router.post('/morning', verifyFirebaseToken, submitMorningPredictionController);

export default router;
