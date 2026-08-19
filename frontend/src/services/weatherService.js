import { apiClient } from './apiClient.js';
import { storageService } from './storageService.js';
import { auth } from '../config/firebase.js';

export const weatherService = {
  /**
   * Safely requests one-time browser location coordinates using navigator.geolocation.
   * Handles 5 error states gracefully without blocking application flow.
   *
   * @returns {Promise<{success: boolean, coords?: {latitude: number, longitude: number}, error?: string, message?: string}>}
   */
  requestBrowserLocation: () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        return resolve({
          success: false,
          error: 'NOT_SUPPORTED',
          message: 'Browser does not support location access.',
        });
      }

      const options = {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 600000, // Cache position for up to 10 mins
      };

      console.log('[Weather] requesting location...');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('[Weather] location obtained');
          console.log('[Weather] latitude:', position.coords.latitude);
          console.log('[Weather] longitude:', position.coords.longitude);

          resolve({
            success: true,
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
          });
        },
        (err) => {
          console.log('[Weather] location denied or unavailable:', err.message);
          let errorType = 'UNKNOWN';
          let message = "Location access was not provided. Today's risk assessment can continue without local weather data.";

          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorType = 'PERM_DENIED';
              message = "Location access was not provided. Today's risk assessment can continue without local weather data.";
              break;
            case err.POSITION_UNAVAILABLE:
              errorType = 'POSITION_UNAVAILABLE';
              message = 'Location position is currently unavailable.';
              break;
            case err.TIMEOUT:
              errorType = 'TIMEOUT';
              message = 'Location request timed out. Local weather data could not be retrieved.';
              break;
            default:
              message = err.message || 'Unable to retrieve location coordinates.';
          }

          resolve({
            success: false,
            error: errorType,
            message,
          });
        },
        options
      );
    });
  },

  /**
   * Sends coordinates to Node.js Express API Gateway (`POST /api/weather/current`)
   * to retrieve current weather and store it under authenticated user's Firestore path.
   */
  fetchCurrentWeather: async (latitude, longitude, date = null) => {
    const payload = {
      latitude,
      longitude,
      date: date || new Date().toISOString().split('T')[0],
    };

    console.log('[Weather Debug] frontend Firebase UID:', auth?.currentUser?.uid || 'Not Signed In');
    console.log('[Weather Debug] request UID/session present:', !!auth?.currentUser?.uid);
    console.log('[Weather] requesting backend weather...');
    const res = await apiClient.post('/weather/current', payload);
    console.log('[Weather] backend response:', res.data);

    if (res.ok && res.data) {
      storageService.setItem('migraineguardian_today_weather', res.data);
      return {
        success: true,
        data: res.data,
      };
    }

    return {
      success: false,
      message: res.raw?.message || res.error?.message || 'Weather data was unavailable.',
      data: null,
    };
  },

  /**
   * Retrieves today's cached or saved weather record for current authenticated user.
   */
  fetchTodayWeather: async () => {
    const res = await apiClient.get('/weather/today');
    if (res.ok && res.data) {
      storageService.setItem('migraineguardian_today_weather', res.data);
      return res.data;
    }

    return storageService.getItem('migraineguardian_today_weather', null);
  },
};
