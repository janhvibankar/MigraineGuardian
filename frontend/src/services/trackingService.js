import { apiClient } from './apiClient.js';
import { storageService } from './storageService.js';

export const trackingService = {
  /**
   * Retrieves check-in history from Express API Gateway / Firestore for authenticated user.
   */
  getDailyLogs: async (limit = 30) => {
    const res = await apiClient.get(`/checkins/history?limit=${limit}`);
    if (res.ok && Array.isArray(res.data)) {
      storageService.setItem('migraineguardian_daily_logs', res.data);
      return res.data;
    }

    const cachedLogs = storageService.getItem('migraineguardian_daily_logs', []);
    return Array.isArray(cachedLogs) ? cachedLogs.slice(0, limit) : [];
  },

  /**
   * Retrieves today's check-in entry from Express API Gateway or cached local storage.
   */
  getTodayLog: () => {
    const localDraft = storageService.getItem('daily_checkin_today', null);
    return localDraft || null;
  },

  /**
   * Asynchronously fetches today's check-in record from Express API Gateway for authenticated user.
   */
  fetchTodayLog: async () => {
    const res = await apiClient.get('/checkins/today');
    if (res.ok) {
      if (res.data) {
        storageService.setItem('daily_checkin_today', res.data);
        return res.data;
      }
      storageService.removeItem('daily_checkin_today');
      return null;
    }
    return trackingService.getTodayLog();
  },

  /**
   * Submits today's check-in payload to Express API Gateway (`POST /api/checkins/today`).
   * Triggers Node -> Firestore -> FastAPI -> ML/SHAP/Recommendations -> Firestore forecast.
   */
  saveDailyCheckin: async (logData) => {
    const newEntry = {
      ...logData,
      date: logData.date || new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
    };

    storageService.setItem('daily_checkin_today', newEntry);

    const res = await apiClient.post('/checkins/today', newEntry);

    if (!res.ok) {
      console.warn('[trackingService] Backend error submitting checkin:', res.error);
      return {
        success: false,
        error: res.error,
        entry: newEntry,
      };
    }

    if (res.raw?.forecast) {
      storageService.setItem('migraineguardian_today_forecast', res.raw.forecast);
    }

    return {
      success: true,
      entry: res.raw?.entry || newEntry,
      forecast: res.raw?.forecast || null,
      message: res.raw?.message,
    };
  },

  getTrackingFactors: () => {
    return [
      { id: 'sleep', label: 'Sleep & Circadian Rhythm', active: true },
      { id: 'stress', label: 'Daily Stress & Strain', active: true },
      { id: 'screen', label: 'Screen & Optical Exposure', active: true },
      { id: 'hydration', label: 'Fluid Intake & Hydration', active: true },
      { id: 'weather', label: 'Barometric & Weather Fronts', active: true },
      { id: 'caffeine', label: 'Caffeine Timing', active: true },
      { id: 'exercise', label: 'Physical Activity & Movement', active: true },
      { id: 'meals', label: 'Blood Sugar & Skipped Meals', active: true },
    ];
  },
};
