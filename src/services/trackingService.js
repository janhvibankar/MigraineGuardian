/**
 * Tracking Service (Phase 2 - Firebase & Express Backend Integration)
 *
 * Manages daily micro-checkin logging, historical logs retrieval from Express API Gateway,
 * and tracking factor configurations with client-side fallback caching.
 */

import { MOCK_DAILY_LOGS } from '../data/mockDailyLogs';
import { storageService } from './storageService';

const API_BASE_URL = 'http://localhost:5000/api/checkins';

function getAuthHeaders() {
  const token = storageService.getItem('migraineguardian_token', null) || localStorage.getItem('mg_v1_migraineguardian_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const trackingService = {
  /**
   * Retrieves 30-day check-in history from Express API Gateway / Firestore.
   */
  getDailyLogs: async (limit = 30) => {
    try {
      const response = await fetch(`${API_BASE_URL}/history?limit=${limit}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          storageService.setItem('migraineguardian_daily_logs', json.data);
          return json.data;
        }
      }
    } catch (e) {
      console.warn('[trackingService] Network error fetching history logs, using fallback data:', e.message);
    }

    // Fallback to local storage or mock daily logs
    const customLogs = storageService.getItem('migraineguardian_daily_logs', null);
    const logs = customLogs || MOCK_DAILY_LOGS;
    return logs.slice(-limit);
  },

  /**
   * Retrieves today's check-in entry from Express API Gateway / Firestore or local storage.
   */
  getTodayLog: () => {
    const localDraft = storageService.getItem('daily_checkin_today', null);
    if (localDraft) return localDraft;

    const customLogs = storageService.getItem('migraineguardian_daily_logs', null);
    const logs = customLogs || MOCK_DAILY_LOGS;
    return logs[logs.length - 1];
  },

  /**
   * Asynchronously fetches today's check-in record from Express API Gateway.
   */
  fetchTodayLog: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/today`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          storageService.setItem('daily_checkin_today', json.data);
          return json.data;
        }
      }
    } catch (e) {
      console.warn('[trackingService] Network error fetching today log:', e.message);
    }

    return trackingService.getTodayLog();
  },

  /**
   * Submits today's check-in payload to Express API Gateway (`POST /api/checkins/today`).
   */
  saveDailyCheckin: async (logData) => {
    const newEntry = {
      ...logData,
      date: logData.date || new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
    };

    // Always persist to client storage for instantaneous UI responsiveness
    storageService.setItem('daily_checkin_today', newEntry);

    try {
      const response = await fetch(`${API_BASE_URL}/today`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newEntry),
      });

      const json = await response.json();

      if (!response.ok) {
        console.warn('[trackingService] Server validation or authorization response:', json);
        return {
          success: false,
          error: json.error || { message: `Server error (${response.status})` },
          entry: newEntry,
        };
      }

      return {
        success: true,
        entry: json.entry || newEntry,
        message: json.message,
      };
    } catch (e) {
      console.warn('[trackingService] Network error saving checkin, saved locally:', e.message);
      return { success: true, entry: newEntry, offline: true };
    }
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
