import { Router } from 'express';
import { verifyFirebaseToken } from '../middleware/verifyFirebaseToken.js';
import {
  submitDailyCheckinController,
  getDailyLogsController,
  getTodayCheckinController,
} from '../controllers/checkinController.js';

const router = Router();

// Enforce Firebase Authentication Token for all check-in routes
router.use(verifyFirebaseToken);

// POST /api/checkins/today — Submit or update today's check-in
router.post('/today', submitDailyCheckinController);

// GET /api/checkins/today — Retrieve today's check-in draft or entry
router.get('/today', getTodayCheckinController);

// GET /api/checkins/history — Retrieve 30-day check-in history
router.get('/history', getDailyLogsController);

export default router;
