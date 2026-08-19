import { Router } from 'express';
import { verifyFirebaseToken } from '../middleware/verifyFirebaseToken.js';
import {
  getCurrentWeatherController,
  getTodayWeatherController,
  getWeatherHistoryController,
  searchLocationController,
  getHistoricalWeatherController,
  getUsualLocationController,
  updateUsualLocationController,
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

// GET /api/weather/geocode — Search city/location by name
router.get('/geocode', searchLocationController);

// POST /api/weather/historical — Retrieve & store past 1-3 days historical weather
router.post('/historical', getHistoricalWeatherController);

// GET /api/weather/usual-location — Get user's saved usual location
router.get('/usual-location', getUsualLocationController);

// POST /api/weather/usual-location — Save user's usual location
router.post('/usual-location', updateUsualLocationController);

export default router;
