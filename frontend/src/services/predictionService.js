import { apiClient } from './apiClient.js';
import { storageService } from './storageService.js';

export const predictionService = {
  /**
   * Fetches today's AI risk forecast from Node.js Express API gateway (`GET /api/predictions/today`).
   * Returns `null` if no forecast exists for the current user today.
   */
  getTodayPrediction: async () => {
    const res = await apiClient.get('/predictions/today');
    if (res.ok) {
      if (res.data) {
        storageService.setItem('migraineguardian_today_forecast', res.data);
        return res.data;
      }
      // Explicitly clear stale cached forecast if backend returned null for user
      storageService.removeItem('migraineguardian_today_forecast');
      return null;
    }

    const cachedForecast = storageService.getItem('migraineguardian_today_forecast', null);
    return cachedForecast;
  },

  getElevatedFactors: async () => {
    const prediction = await predictionService.getTodayPrediction();
    return prediction?.elevatedFactors || [];
  },

  getFocusAreas: async () => {
    const prediction = await predictionService.getTodayPrediction();
    return prediction?.focusAreas || [];
  },
};
