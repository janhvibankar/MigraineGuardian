import { firestoreService } from '../services/firestoreService.js';

export async function getTodayPredictionController(req, res, next) {
  try {
    const userId = req.user.uid;
    const targetDate = req.query.date || new Date().toISOString().split('T')[0];

    const forecast = await firestoreService.getLatestRiskForecast(userId, targetDate);

    if (!forecast) {
      return res.status(200).json({
        success: true,
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      data: forecast,
    });
  } catch (error) {
    next(error);
  }
}
