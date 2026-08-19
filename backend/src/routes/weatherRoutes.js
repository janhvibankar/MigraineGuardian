import { Router } from 'express';
import { verifyFirebaseToken } from '../middleware/verifyFirebaseToken.js';
import {
  getCurrentWeatherController,
  getTodayWeatherController,
  getWeatherHistoryController,
} from '../controllers/weatherController.js';

const router = Router();

// Enforce Firebase Authentication Token for all weather routes
router.use(verifyFirebaseToken);

// POST /api/weather/current — Fetch weather for coordinates & save to user's weather_records
router.post('/current', getCurrentWeatherController);

// GET /api/weather/today — Retrieve today's weather record for user
router.get('/today', getTodayWeatherController);

// GET /api/weather/history — Retrieve weather history for user
router.get('/history', getWeatherHistoryController);

export default router;
