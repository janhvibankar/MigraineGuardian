import { apiClient } from './apiClient.js';
import { storageService } from './storageService.js';

export function syncRiskForecastState(forecast) {
  if (typeof window === 'undefined') return;

  if (forecast && forecast.score !== undefined && forecast.score !== null) {
    storageService.setItem('migraineguardian_today_forecast', forecast);

    const currentUser = storageService.getItem('migraineguardian_user', null);
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        currentRiskScore: forecast.score,
        riskCategory: forecast.level ? forecast.level.toUpperCase() : currentUser.riskCategory,
      };
      storageService.setItem('migraineguardian_user', updatedUser);
      window.dispatchEvent(new CustomEvent('migraineguardian_user_updated', { detail: updatedUser }));
    }
    window.dispatchEvent(new CustomEvent('migraineguardian_forecast_updated', { detail: forecast }));
  } else if (forecast === null) {
    storageService.removeItem('migraineguardian_today_forecast');
    const currentUser = storageService.getItem('migraineguardian_user', null);
    if (currentUser && currentUser.currentRiskScore !== null) {
      const updatedUser = {
        ...currentUser,
        currentRiskScore: null,
      };
      storageService.setItem('migraineguardian_user', updatedUser);
      window.dispatchEvent(new CustomEvent('migraineguardian_user_updated', { detail: updatedUser }));
    }
    window.dispatchEvent(new CustomEvent('migraineguardian_forecast_updated', { detail: null }));
  }
}

export const predictionService = {
  /**
   * Fetches today's AI risk forecast from Node.js Express API gateway (`GET /api/predictions/today`).
   * Returns `null` if no forecast exists for the current user today.
   */
  getTodayPrediction: async (targetDate = null) => {
    const query = targetDate ? `?date=${encodeURIComponent(targetDate)}` : '';
    const res = await apiClient.get(`/predictions/today${query}`);
    if (res.ok) {
      if (res.data) {
        syncRiskForecastState(res.data);
        return res.data;
      }
      // Explicitly clear stale cached forecast if backend returned null for user
      syncRiskForecastState(null);
      return null;
    }

    const cachedForecast = storageService.getItem('migraineguardian_today_forecast', null);
    return cachedForecast;
  },

  submitMorningPrediction: async (predictionData) => {
    const res = await apiClient.post('/predictions/morning', predictionData);
    if (res.ok && res.data) {
      const forecast = res.data.forecast || res.data;
      syncRiskForecastState(forecast);
      return forecast;
    }
    return null;
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
