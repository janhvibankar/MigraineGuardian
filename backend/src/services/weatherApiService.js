/**
 * Weather API Service (Stage 1 Weather Integration)
 *
 * Fetches real-time weather metrics using coordinates (latitude, longitude).
 * Uses OpenWeather API if WEATHER_API_KEY or OPENWEATHER_API_KEY is configured in backend/.env.
 * Gracefully falls back to Open-Meteo API (free, no API key required) if no OpenWeather key is provided.
 */

const WMO_WEATHER_CODES = {
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
  96: { condition: 'Thunderstorm', description: 'Thunderstorm with slight hail' },
  99: { condition: 'Thunderstorm', description: 'Thunderstorm with heavy hail' },
};

export const weatherApiService = {
  /**
   * Fetches current weather for given latitude and longitude.
   *
   * @param {number} latitude Latitude coordinate (-90 to 90)
   * @param {number} longitude Longitude coordinate (-180 to 180)
   * @returns {Promise<Object>} Formatted weather data record
   */
  fetchCurrentWeather: async (latitude, longitude) => {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      throw new Error('Invalid latitude parameter. Must be a number between -90 and 90.');
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      throw new Error('Invalid longitude parameter. Must be a number between -180 and -180.');
    }

    const openWeatherKey = process.env.WEATHER_API_KEY || process.env.OPENWEATHER_API_KEY;

    // 1. Try OpenWeather API if key is provided
    if (openWeatherKey && openWeatherKey.trim() !== '') {
      try {
        const owUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${openWeatherKey.trim()}&units=metric`;
        const res = await fetch(owUrl, { signal: AbortSignal.timeout(6000) });

        if (res.ok) {
          const data = await res.json();
          return {
            temperature: Math.round(data.main.temp * 10) / 10,
            feelsLike: Math.round(data.main.feels_like * 10) / 10,
            humidity: Math.round(data.main.humidity),
            pressure: Math.round(data.main.pressure),
            weatherCondition: data.weather[0]?.main || 'Clear',
            weatherDescription: data.weather[0]?.description || 'clear sky',
            windSpeed: Math.round(data.wind?.speed * 10) / 10 || 0,
            precipitation: data.rain ? (data.rain['1h'] || data.rain['3h'] || 0) : 0,
            latitude: Math.round(lat * 10000) / 10000,
            longitude: Math.round(lon * 10000) / 10000,
            timestamp: new Date().toISOString(),
            source: 'openweather',
          };
        }
        console.warn(`[weatherApiService] OpenWeather API returned HTTP ${res.status}, falling back to Open-Meteo`);
      } catch (err) {
        console.warn('[weatherApiService] OpenWeather fetch error, falling back to Open-Meteo:', err.message);
      }
    }

    // 2. Open-Meteo Fallback (Free, No API key required)
    try {
      const omUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,weather_code,wind_speed_10m,apparent_temperature,precipitation`;
      const res = await fetch(omUrl, { signal: AbortSignal.timeout(6000) });

      if (!res.ok) {
        throw new Error(`Open-Meteo returned HTTP status ${res.status}`);
      }

      const data = await res.json();
      const current = data.current || {};
      const weatherCode = current.weather_code ?? 0;
      const wmoMeta = WMO_WEATHER_CODES[weatherCode] || { condition: 'Clear', description: 'Clear sky' };

      return {
        temperature: Math.round((current.temperature_2m ?? 22.0) * 10) / 10,
        feelsLike: Math.round((current.apparent_temperature ?? current.temperature_2m ?? 22.0) * 10) / 10,
        humidity: Math.round(current.relative_humidity_2m ?? 60),
        pressure: Math.round(current.surface_pressure ?? 1013),
        weatherCondition: wmoMeta.condition,
        weatherDescription: wmoMeta.description,
        windSpeed: Math.round((current.wind_speed_10m ?? 0) * 10) / 10,
        precipitation: current.precipitation ?? 0,
        latitude: Math.round(lat * 10000) / 10000,
        longitude: Math.round(lon * 10000) / 10000,
        timestamp: new Date().toISOString(),
        source: 'openmeteo',
      };
    } catch (err) {
      console.error('[weatherApiService] Weather API fetch failed:', err.message);
      throw new Error(`Failed to fetch weather data: ${err.message}`);
    }
  },

  /**
   * Geocodes a city/location name query to coordinates via Open-Meteo Geocoding API.
   * @param {string} query Search string (e.g. "Seattle" or "London, UK")
   * @returns {Promise<Array<{id: string|number, name: string, admin1: string, country: string, latitude: number, longitude: number, label: string}>>}
   */
  searchLocationGeocode: async (query) => {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return [];
    }
    const cleanQuery = encodeURIComponent(query.trim());
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${cleanQuery}&count=5&language=en&format=json`;

    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) {
        throw new Error(`Open-Meteo Geocoding returned HTTP ${res.status}`);
      }
      const data = await res.json();
      if (!data.results || !Array.isArray(data.results)) {
        return [];
      }
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
    } catch (err) {
      console.warn('[weatherApiService] Geocoding search failed:', err.message);
      return [];
    }
  },

  /**
   * Fetches past 1 to 3 days of historical weather metrics for given coordinates.
   * @param {number} latitude
   * @param {number} longitude
   * @param {number} [days=3] Number of past days (1 to 3)
   * @returns {Promise<{dailyRecords: Array<Object>, summary: Object}>}
   */
  fetchHistoricalWeather: async (latitude, longitude, days = 3) => {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const numDays = Math.min(Math.max(parseInt(days, 10) || 3, 1), 3);

    if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lon) || lon < -180 || lon > 180) {
      throw new Error('Invalid coordinates for historical weather fetch.');
    }

    try {
      const omUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&past_days=${numDays}&daily=weather_code,temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,surface_pressure_mean,precipitation_sum,wind_speed_10m_max&timezone=auto`;
      const res = await fetch(omUrl, { signal: AbortSignal.timeout(8000) });

      if (!res.ok) {
        throw new Error(`Open-Meteo Forecast/Historical returned HTTP ${res.status}`);
      }

      const data = await res.json();
      const daily = data.daily || {};
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
        const code = weatherCodeArr[i] ?? 0;
        const wmoMeta = WMO_WEATHER_CODES[code] || { condition: 'Clear', description: 'Clear sky' };
        const tempMax = Math.round((tempMaxArr[i] ?? 22) * 10) / 10;
        const tempMin = Math.round((tempMinArr[i] ?? 18) * 10) / 10;
        const tempAvg = Math.round(((tempMax + tempMin) / 2) * 10) / 10;
        const pressure = Math.round(pressureArr[i] ?? 1013);
        const humidity = Math.round(humidityArr[i] ?? 60);

        dailyRecords.push({
          weatherRecordId: dateStr,
          date: dateStr,
          timestamp: new Date(`${dateStr}T12:00:00Z`).toISOString(),
          latitude: Math.round(lat * 10000) / 10000,
          longitude: Math.round(lon * 10000) / 10000,
          temperature: tempAvg,
          tempMax,
          tempMin,
          feelsLike: tempAvg,
          humidity,
          pressure,
          weatherCondition: wmoMeta.condition,
          weatherDescription: wmoMeta.description,
          windSpeed: Math.round((windArr[i] ?? 0) * 10) / 10,
          precipitation: Math.round((precipArr[i] ?? 0) * 10) / 10,
          source: 'openmeteo_historical',
        });
      }

      // Sort by date ASC
      dailyRecords.sort((a, b) => a.date.localeCompare(b.date));

      let pressureDelta = 0;
      if (dailyRecords.length >= 2) {
        const firstP = dailyRecords[0].pressure;
        const lastP = dailyRecords[dailyRecords.length - 1].pressure;
        pressureDelta = Math.round((lastP - firstP) * 10) / 10;
      }

      const todayRecord = dailyRecords[dailyRecords.length - 1] || null;

      const summary = {
        daysFetched: dailyRecords.length,
        avgTemperature: todayRecord ? todayRecord.temperature : 22,
        avgHumidity: todayRecord ? todayRecord.humidity : 60,
        latestPressure: todayRecord ? todayRecord.pressure : 1013,
        pressureDelta,
        pressureTrend: pressureDelta < -3 ? 'dropping' : pressureDelta > 3 ? 'rising' : 'steady',
        latestCondition: todayRecord ? todayRecord.weatherCondition : 'Clear',
        latestDescription: todayRecord ? todayRecord.weatherDescription : 'clear sky',
      };

      return {
        dailyRecords,
        summary,
      };
    } catch (err) {
      console.error('[weatherApiService] Historical weather fetch failed:', err.message);
      throw new Error(`Failed to fetch historical weather: ${err.message}`);
    }
  },
};
