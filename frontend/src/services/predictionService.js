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
   * Pass `recalculate = true` to force an on-demand recalculation even if an older forecast exists.
   * Returns `null` if no forecast exists for the current user today.
   */
  getTodayPrediction: async (targetDate = null, recalculate = false) => {
    const dateQuery = targetDate || new Date().toLocaleDateString('en-CA');
    const recalcQuery = recalculate ? '&recalculate=true' : '';
    const query = `?date=${encodeURIComponent(dateQuery)}${recalcQuery}`;
    const res = await apiClient.get(`/predictions/today${query}`);
    if (res.ok) {
      if (res.data) {
        const forecastDate = res.data.forecastDate || res.data.date || res.data.id;
        const isValidDate = !forecastDate || forecastDate === dateQuery;
        const isValidScore = typeof res.data.score === 'number' && !isNaN(res.data.score);

        if (isValidDate && isValidScore) {
          syncRiskForecastState(res.data);
          return res.data;
        }
      }

      // Explicitly clear stale cached forecast if backend returned null for user
      syncRiskForecastState(null);
      if (res.raw && (res.raw.mlError || res.raw.message || res.raw.forecastStatus)) {
        return {
          score: null,
          mlError: res.raw.mlError || res.raw.message,
          errorCategory: res.raw.errorCategory,
          forecastStatus: res.raw.forecastStatus,
          canRetry: Boolean(res.raw.canRetry),
          checkinExists: Boolean(res.raw.checkinExists),
        };
      }
      return null;
    }

    // Only return cached forecast if it strictly matches dateQuery and has a valid score
    const cachedForecast = storageService.getItem('migraineguardian_today_forecast', null);
    if (cachedForecast) {
      const forecastDate = cachedForecast.forecastDate || cachedForecast.date || cachedForecast.id;
      const isValidDate = !forecastDate || forecastDate === dateQuery;
      const isValidScore = typeof cachedForecast.score === 'number' && !isNaN(cachedForecast.score);
      if (isValidDate && isValidScore) {
        return cachedForecast;
      }
      storageService.removeItem('migraineguardian_today_forecast');
    }
    return null;
  },

  /**
   * Forces on-demand recalculation of today's risk forecast from saved check-in.
   */
  recalculateTodayPrediction: async (targetDate = null) => {
    return predictionService.getTodayPrediction(targetDate, true);
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
