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
   * If backend provider is rate-limited (e.g. cloud IP 429), transparently falls back to
   * direct client browser fetch and syncs the record back to Firestore.
   */
  fetchCurrentWeather: async (latitude, longitude, date = null) => {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const payload = {
      latitude,
      longitude,
      date: targetDate,
    };

    const uid = auth?.currentUser?.uid || 'guest';
    console.log('[Weather Debug] frontend Firebase UID:', uid);
    console.log('[Weather] requesting backend weather...');

    try {
      const res = await apiClient.post('/weather/current', payload);
      console.log('[Weather] backend response:', res.data);

      if (res.ok && res.data && res.data.temperature !== undefined) {
        storageService.setItem(`migraineguardian_today_weather_${uid}`, res.data);
        return {
          success: true,
          data: res.data,
        };
      }
    } catch (apiErr) {
      console.warn('[Weather] Gateway call error, attempting direct client fallback:', apiErr.message);
    }

    // Direct client-side browser fallback (Open-Meteo free tier without shared cloud IP limits)
    try {
      console.log('[Weather] attempting browser direct weather fetch fallback...');
      const omUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,surface_pressure,weather_code,wind_speed_10m,apparent_temperature,precipitation`;
      const directRes = await fetch(omUrl);
      if (directRes.ok) {
        const omData = await directRes.json();
        const cur = omData.current || {};
        const code = cur.weather_code ?? 0;
        const wmo = {
          0: { condition: 'Clear', description: 'Clear sky' },
          1: { condition: 'Clear', description: 'Mainly clear' },
          2: { condition: 'Clouds', description: 'Partly cloudy' },
          3: { condition: 'Clouds', description: 'Overcast' },
          45: { condition: 'Atmosphere', description: 'Fog' },
          48: { condition: 'Atmosphere', description: 'Depositing rime fog' },
          51: { condition: 'Drizzle', description: 'Light drizzle' },
          53: { condition: 'Drizzle', description: 'Moderate drizzle' },
          55: { condition: 'Drizzle', description: 'Dense drizzle' },
          61: { condition: 'Rain', description: 'Slight rain' },
          63: { condition: 'Rain', description: 'Moderate rain' },
          65: { condition: 'Rain', description: 'Heavy rain' },
          71: { condition: 'Snow', description: 'Slight snow fall' },
          73: { condition: 'Snow', description: 'Moderate snow fall' },
          75: { condition: 'Snow', description: 'Heavy snow fall' },
          80: { condition: 'Rain', description: 'Slight rain showers' },
          81: { condition: 'Rain', description: 'Moderate rain showers' },
          82: { condition: 'Rain', description: 'Violent rain showers' },
          95: { condition: 'Thunderstorm', description: 'Thunderstorm' },
        }[code] || { condition: 'Clear', description: 'Clear sky' };

        const fallbackData = {
          temperature: Math.round((cur.temperature_2m ?? 22.0) * 10) / 10,
          feelsLike: Math.round((cur.apparent_temperature ?? cur.temperature_2m ?? 22.0) * 10) / 10,
          humidity: Math.round(cur.relative_humidity_2m ?? 60),
          pressure: Math.round(cur.surface_pressure ?? 1013),
          weatherCondition: wmo.condition,
          weatherDescription: wmo.description,
          windSpeed: Math.round((cur.wind_speed_10m ?? 0) * 10) / 10,
          precipitation: cur.precipitation ?? 0,
          latitude: Math.round(latitude * 10000) / 10000,
          longitude: Math.round(longitude * 10000) / 10000,
          timestamp: new Date().toISOString(),
          source: 'openmeteo_client_fallback',
        };

        storageService.setItem(`migraineguardian_today_weather_${uid}`, fallbackData);

        // Async sync back to backend gateway to persist to Firestore
        apiClient.post('/weather/current', { ...payload, weatherData: fallbackData }).catch((syncErr) => {
          console.warn('[Weather] Background sync to backend failed:', syncErr.message);
        });

        return {
          success: true,
          data: fallbackData,
        };
      }
    } catch (clientErr) {
      console.warn('[Weather] Client fallback error:', clientErr.message);
    }

    return {
      success: false,
      message: 'Weather data was temporarily unavailable.',
      data: null,
    };
  },

  /**
   * Retrieves today's cached or saved weather record for current authenticated user.
   */
  fetchTodayWeather: async () => {
    const uid = auth?.currentUser?.uid || 'guest';
    const res = await apiClient.get('/weather/today');
    if (res.ok && res.data) {
      storageService.setItem(`migraineguardian_today_weather_${uid}`, res.data);
      return res.data;
    }
    // If backend returns null explicitly (authenticated user has no check-in today), clear local key
    if (res.ok && res.data === null) {
      storageService.removeItem(`migraineguardian_today_weather_${uid}`);
      return null;
    }
    // Network failure fallback
    return storageService.getItem(`migraineguardian_today_weather_${uid}`, null);
  },

  /**
   * Searches city/location by query string using backend geocoding endpoint with client fallback.
   */
  searchLocation: async (query) => {
    if (!query || typeof query !== 'string' || !query.trim()) {
      return [];
    }
    const clean = query.trim();
    try {
      const res = await apiClient.get(`/weather/geocode?query=${encodeURIComponent(clean)}`);
      if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch (e) {
      console.warn('[weatherService] Backend geocode call failed, trying client search:', e.message);
    }

    // Direct client fallback to Open-Meteo Geocoding
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(clean)}&count=5&language=en&format=json`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.results && Array.isArray(data.results)) {
          return data.results.map((r) => {
            const parts = [r.name, r.admin1, r.country].filter(Boolean);
            return {
              id: r.id || `${r.latitude}_${r.longitude}`,
              name: r.name,
              admin1: r.admin1 || '',
              country: r.country || '',
              latitude: Math.round(r.latitude * 10000) / 10000,
              longitude: Math.round(r.longitude * 10000) / 10000,
              label: parts.join(', '),
            };
          });
        }
      }
    } catch (err) {
      console.warn('[weatherService] Client geocode search failed:', err.message);
    }

    return [];
  },

  /**
   * Fetches past 1 to 3 days of historical weather records for coordinates.
   */
  fetchHistoricalWeather: async (latitude, longitude, days = 3, locationName = null) => {
    const payload = { latitude, longitude, days, locationName };

    try {
      const res = await apiClient.post('/weather/historical', payload);

      if (res.ok && res.raw?.success && Array.isArray(res.raw.records) && res.raw.records.length > 0) {
        const uid = auth?.currentUser?.uid || 'guest';
        const latestRecord = res.raw.records[res.raw.records.length - 1];
        storageService.setItem(`migraineguardian_today_weather_${uid}`, latestRecord);
        return {
          success: true,
          summary: res.raw.summary,
          records: res.raw.records,
          locationName: res.raw.locationName || locationName,
        };
      }
    } catch (apiErr) {
      console.warn('[Weather] Backend historical call error, trying direct client fallback:', apiErr.message);
    }

    // Direct client-side historical fetch from Open-Meteo
    try {
      const now = new Date();
      const numDays = Math.min(Math.max(parseInt(days, 10) || 3, 1), 3);
      const endDateObj = new Date(now);
      endDateObj.setDate(endDateObj.getDate() - 1);
      const endDateStr = endDateObj.toISOString().split('T')[0];

      const startDateObj = new Date(now);
      startDateObj.setDate(startDateObj.getDate() - numDays);
      const startDateStr = startDateObj.toISOString().split('T')[0];

      const omUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&start_date=${startDateStr}&end_date=${endDateStr}&daily=weather_code,temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,surface_pressure_mean,precipitation_sum,wind_speed_10m_max&timezone=auto`;
      const directRes = await fetch(omUrl);

      if (directRes.ok) {
        const omData = await directRes.json();
        const daily = omData.daily || {};
        const dates = daily.time || [];
        const tempMaxArr = daily.temperature_2m_max || [];
        const tempMinArr = daily.temperature_2m_min || [];
        const humidityArr = daily.relative_humidity_2m_mean || [];
        const pressureArr = daily.surface_pressure_mean || [];
        const weatherCodeArr = daily.weather_code || [];
        const windArr = daily.wind_speed_10m_max || [];
        const precipArr = daily.precipitation_sum || [];

        const dailyRecords = [];
        for (let i = 0; i < dates.length; i++) {
          const dateStr = dates[i];
          const tempMax = Math.round((tempMaxArr[i] ?? 22) * 10) / 10;
          const tempMin = Math.round((tempMinArr[i] ?? 18) * 10) / 10;
          const tempAvg = Math.round(((tempMax + tempMin) / 2) * 10) / 10;
          const pressure = Math.round(pressureArr[i] ?? 1013);
          const humidity = Math.round(humidityArr[i] ?? 60);

          dailyRecords.push({
            weatherRecordId: dateStr,
            date: dateStr,
            timestamp: new Date(`${dateStr}T12:00:00Z`).toISOString(),
            latitude: Math.round(latitude * 10000) / 10000,
            longitude: Math.round(longitude * 10000) / 10000,
            temperature: tempAvg,
            tempMax,
            tempMin,
            feelsLike: tempAvg,
            humidity,
            pressure,
            weatherCondition: 'Clear',
            weatherDescription: 'Historical record',
            windSpeed: Math.round((windArr[i] ?? 0) * 10) / 10,
            precipitation: Math.round((precipArr[i] ?? 0) * 10) / 10,
            source: 'openmeteo_client_historical',
          });
        }

        dailyRecords.sort((a, b) => a.date.localeCompare(b.date));
        let pressureDelta = 0;
        if (dailyRecords.length >= 2) {
          pressureDelta = Math.round((dailyRecords[dailyRecords.length - 1].pressure - dailyRecords[0].pressure) * 10) / 10;
        }

        const latestRecord = dailyRecords[dailyRecords.length - 1] || null;
        const summary = {
          daysFetched: dailyRecords.length,
          startDate: startDateStr,
          endDate: endDateStr,
          avgTemperature: latestRecord ? latestRecord.temperature : 22,
          avgHumidity: latestRecord ? latestRecord.humidity : 60,
          latestPressure: latestRecord ? latestRecord.pressure : 1013,
          pressureDelta,
          pressureTrend: pressureDelta < -3 ? 'dropping' : pressureDelta > 3 ? 'rising' : 'steady',
          latestCondition: latestRecord ? latestRecord.weatherCondition : 'Clear',
          locationName: locationName || `${Math.round(latitude * 100) / 100}°, ${Math.round(longitude * 100) / 100}°`,
        };

        return {
          success: true,
          summary,
          records: dailyRecords,
          locationName: summary.locationName,
        };
      }
    } catch (clientErr) {
      console.warn('[Weather] Direct client historical fetch failed:', clientErr.message);
    }

    return {
      success: false,
      message: 'Historical weather data was unavailable.',
      summary: null,
      records: [],
    };
  },

  /**
   * Retrieves saved usual location for authenticated user.
   */
  getUsualLocation: async () => {
    const uid = auth?.currentUser?.uid || 'guest';
    const res = await apiClient.get('/weather/usual-location');
    if (res.ok && res.data) {
      storageService.setItem(`migraineguardian_usual_location_${uid}`, res.data);
      return res.data;
    }
    // Strict isolation: if backend explicitly returns null, clear cached location for this user UID
    if (res.ok && res.data === null) {
      storageService.removeItem(`migraineguardian_usual_location_${uid}`);
      return null;
    }
    // If request failed or 304, fallback to cached location if available
    const cached = storageService.getItem(`migraineguardian_usual_location_${uid}`, null);
    if (cached) return cached;
    return null;
  },

  /**
   * Saves or updates usual location for authenticated user.
   */
  saveUsualLocation: async (locationData) => {
    const uid = auth?.currentUser?.uid || 'guest';
    const res = await apiClient.post('/weather/usual-location', locationData);
    if (res.ok && res.data) {
      storageService.setItem(`migraineguardian_usual_location_${uid}`, res.data);
      return { success: true, data: res.data };
    }
    return {
      success: false,
      message: res.raw?.message || res.error?.message || 'Failed to save usual location.',
    };
  },
};
