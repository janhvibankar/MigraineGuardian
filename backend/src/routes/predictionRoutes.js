import { Router } from 'express';
import { verifyFirebaseToken } from '../middleware/verifyFirebaseToken.js';
import { getTodayPredictionController } from '../controllers/predictionController.js';

const router = Router();

// GET /api/predictions/today
router.get('/today', verifyFirebaseToken, getTodayPredictionController);

export default router;
