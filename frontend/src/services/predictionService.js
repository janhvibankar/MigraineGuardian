import { apiClient } from './apiClient.js';
import { storageService } from './storageService.js';

export function getForecastCacheKey(uid = null) {
  const currentUid = uid || storageService.getItem('migraineguardian_user', null)?.uid;
  return currentUid ? `migraineguardian_forecast_${currentUid}` : 'migraineguardian_today_forecast';
}

export function syncRiskForecastState(forecast, uid = null) {
  if (typeof window === 'undefined') return;
  const cacheKey = getForecastCacheKey(uid);

  if (forecast && forecast.score !== undefined && forecast.score !== null) {
    storageService.setItem(cacheKey, forecast);
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
    storageService.removeItem(cacheKey);
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
   * Retrieves today's cached forecast instantly from local storage if valid.
   */
  getCachedTodayForecast: (targetDate = null, uid = null) => {
    const dateQuery = targetDate || new Date().toLocaleDateString('en-CA');
    const cacheKey = getForecastCacheKey(uid);
    const cachedForecast = storageService.getItem(cacheKey, null) || storageService.getItem('migraineguardian_today_forecast', null);
    if (cachedForecast) {
      const forecastDate = cachedForecast.forecastDate || cachedForecast.date || cachedForecast.id;
      const isValidDate = !forecastDate || forecastDate === dateQuery;
      const isValidScore = typeof cachedForecast.score === 'number' && !isNaN(cachedForecast.score);
      if (isValidDate && isValidScore) {
        return cachedForecast;
      }
      storageService.removeItem(cacheKey);
      storageService.removeItem('migraineguardian_today_forecast');
    }
    return null;
  },

  /**
   * Fetches today's AI risk forecast from Node.js Express API gateway (`GET /api/predictions/today`).
   * Pass `recalculate = true` to force an on-demand recalculation even if an older forecast exists.
   * Returns `null` if no forecast exists for the current user today.
   */
  getTodayPrediction: async (targetDate = null, recalculate = false) => {
    const reqStart = Date.now();
    const dateQuery = targetDate || new Date().toLocaleDateString('en-CA');
    const recalcQuery = recalculate ? '&recalculate=true' : '';
    const query = `?date=${encodeURIComponent(dateQuery)}${recalcQuery}`;
    console.log(`[Prediction] Request start: date=${dateQuery}, recalculate=${recalculate} at ${new Date().toISOString()}`);
    console.time('[Prediction] getTodayPrediction');
    const res = await apiClient.get(`/predictions/today${query}`, null, { bypassCache: true });
    console.timeEnd('[Prediction] getTodayPrediction');
    const elapsed = Date.now() - reqStart;
    console.log(`[Prediction] Request completed in ${elapsed}ms: ok=${res.ok}, status=${res.status}`);

    if (res.ok) {
      if (res.data) {
        const forecastDate = res.data.forecastDate || res.data.date || res.data.id;
        const isValidDate = !forecastDate || forecastDate === dateQuery;
        const isValidScore = typeof res.data.score === 'number' && !isNaN(res.data.score);

        if (isValidDate && isValidScore) {
          console.log(`[Prediction] Valid forecast received: score=${res.data.score}%, level=${res.data.level}`);
          syncRiskForecastState(res.data);
          return res.data;
        }
      }

      // Do NOT clear cached forecast if service is in transient warming/pending state
      const isTransient = res.raw && (
        res.raw.forecastStatus === 'warming' ||
        res.raw.forecastStatus === 'pending' ||
        res.raw.errorCategory === 'FASTAPI_SERVICE_WARMING'
      );
      if (!isTransient) {
        syncRiskForecastState(null);
      }

      if (res.raw && (res.raw.mlError || res.raw.message || res.raw.forecastStatus)) {
        return {
          score: null,
          mlError: res.raw.mlError || res.raw.message,
          message: res.raw.message || res.raw.mlError,
          errorCategory: res.raw.errorCategory,
          forecastStatus: res.raw.forecastStatus || (res.raw.canRetry !== false ? 'warming' : 'error'),
          canRetry: res.raw.canRetry !== false,
          checkinExists: Boolean(res.raw.checkinExists),
          retryAfterMs: res.raw.retryAfterMs || 8000,
        };
      }
      return null;
    }

    // Only return cached forecast if it strictly matches dateQuery and has a valid score
    const cachedForecast = predictionService.getCachedTodayForecast(dateQuery);
    if (cachedForecast) {
      return cachedForecast;
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
      if (res.data.forecast && typeof res.data.forecast.score === 'number') {
        syncRiskForecastState(res.data.forecast);
        return res.data.forecast;
      }
      return {
        score: null,
        forecastAvailable: false,
        forecastStatus: res.data.forecastStatus || (res.data.canRetry !== false ? 'warming' : 'error'),
        errorCategory: res.data.errorCategory,
        canRetry: res.data.canRetry !== false,
        retryAfterMs: res.data.retryAfterMs || 8000,
        message: res.data.message || res.data.mlWarning || null,
        entry: res.data.entry || null,
      };
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
