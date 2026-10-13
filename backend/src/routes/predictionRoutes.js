import { Router } from 'express';
import { verifyFirebaseToken } from '../middleware/verifyFirebaseToken.js';
import {
  getTodayPredictionController,
  submitMorningPredictionController,
} from '../controllers/predictionController.js';

const router = Router();

// GET /api/predictions/today (supports ?recalculate=true)
router.get('/today', verifyFirebaseToken, getTodayPredictionController);

// POST /api/predictions/recalculate & POST /api/predictions/today/recalculate
const handleRecalculate = (req, res, next) => {
  req.query.recalculate = 'true';
  return getTodayPredictionController(req, res, next);
};
router.post('/recalculate', verifyFirebaseToken, handleRecalculate);
router.post('/today/recalculate', verifyFirebaseToken, handleRecalculate);

// POST /api/predictions/morning
router.post('/morning', verifyFirebaseToken, submitMorningPredictionController);

export default router;
