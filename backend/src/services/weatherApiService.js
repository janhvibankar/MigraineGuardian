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
        const res = await fetch(owUrl, {
          signal: AbortSignal.timeout(6000),
          headers: { 'User-Agent': 'MigraineGuardian/1.0 (HealthApp)' },
        });

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
      const res = await fetch(omUrl, {
        signal: AbortSignal.timeout(6000),
        headers: { 'User-Agent': 'MigraineGuardian/1.0 (HealthApp; +https://migraineguardian-frontend.onrender.com)' },
      });

      if (res.ok) {
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
      }
      console.warn(`[weatherApiService] Open-Meteo returned HTTP ${res.status}, falling back to wttr.in`);
    } catch (err) {
      console.warn('[weatherApiService] Open-Meteo fetch failed, falling back to wttr.in:', err.message);
    }

    // 3. Resilient wttr.in Fallback (Keyless, independent IP rate limits)
    try {
      const wttrUrl = `https://wttr.in/${lat},${lon}?format=j1`;
      const res = await fetch(wttrUrl, {
        signal: AbortSignal.timeout(6000),
        headers: { 'User-Agent': 'MigraineGuardian/1.0' },
      });

      if (res.ok) {
        const data = await res.json();
        const cc = data.current_condition?.[0] || {};
        const temp = parseFloat(cc.temp_C) || 22.0;
        const feels = parseFloat(cc.FeelsLikeC) || temp;
        const hum = parseInt(cc.humidity, 10) || 60;
        const press = parseInt(cc.pressure, 10) || 1013;
        const windKmph = parseFloat(cc.windspeedKmph) || 0;
        const precip = parseFloat(cc.precipMM) || 0;
        const desc = cc.weatherDesc?.[0]?.value || 'Clear';

        return {
          temperature: Math.round(temp * 10) / 10,
          feelsLike: Math.round(feels * 10) / 10,
          humidity: hum,
          pressure: press,
          weatherCondition: desc.toLowerCase().includes('rain') ? 'Rain' : desc.toLowerCase().includes('cloud') ? 'Clouds' : 'Clear',
          weatherDescription: desc,
          windSpeed: Math.round((windKmph / 3.6) * 10) / 10,
          precipitation: precip,
          latitude: Math.round(lat * 10000) / 10000,
          longitude: Math.round(lon * 10000) / 10000,
          timestamp: new Date().toISOString(),
          source: 'wttr_in_fallback',
        };
      }
    } catch (wttrErr) {
      console.warn('[weatherApiService] wttr.in fallback failed:', wttrErr.message);
    }

    throw new Error('All weather providers temporarily unavailable for coordinates.');
  },

  /**
   * Geocodes a city/location name query to coordinates via Open-Meteo Geocoding API with Nominatim fallback.
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
      const res = await fetch(url, {
        signal: AbortSignal.timeout(6000),
        headers: { 'User-Agent': 'MigraineGuardian/1.0 (HealthApp; +https://migraineguardian-frontend.onrender.com)' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.results && Array.isArray(data.results) && data.results.length > 0) {
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
      console.warn('[weatherApiService] Geocoding search primary failed, trying Nominatim fallback:', err.message);
    }

    // Fallback to Nominatim OpenStreetMap
    try {
      const nomUrl = `https://nominatim.openstreetmap.org/search?q=${cleanQuery}&format=json&limit=5&addressdetails=1`;
      const res = await fetch(nomUrl, {
        signal: AbortSignal.timeout(6000),
        headers: { 'User-Agent': 'MigraineGuardian/1.0 (contact: info@migraineguardian.internal)' },
      });
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          return list.map((item) => {
            const itemLat = Math.round(parseFloat(item.lat) * 10000) / 10000;
            const itemLon = Math.round(parseFloat(item.lon) * 10000) / 10000;
            return {
              id: item.place_id || `${itemLat}_${itemLon}`,
              name: item.name || item.display_name.split(',')[0],
              admin1: item.address?.state || item.address?.county || '',
              country: item.address?.country || '',
              latitude: itemLat,
              longitude: itemLon,
              label: item.display_name,
            };
          });
        }
      }
    } catch (nomErr) {
      console.warn('[weatherApiService] Nominatim geocode fallback failed:', nomErr.message);
    }

    return [];
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

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Compute date range for completed historical calendar days (excluding today and future dates)
    const endDateObj = new Date(now);
    endDateObj.setDate(endDateObj.getDate() - 1);
    const endDateStr = endDateObj.toISOString().split('T')[0];

    const startDateObj = new Date(now);
    startDateObj.setDate(startDateObj.getDate() - numDays);
    const startDateStr = startDateObj.toISOString().split('T')[0];

    console.log(`[weatherApiService] Requesting historical weather range: ${startDateStr} to ${endDateStr} (${numDays} completed days)`);

    // 1. Try Open-Meteo
    try {
      const omUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&start_date=${startDateStr}&end_date=${endDateStr}&daily=weather_code,temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,surface_pressure_mean,precipitation_sum,wind_speed_10m_max&timezone=auto`;
      const res = await fetch(omUrl, {
        signal: AbortSignal.timeout(8000),
        headers: { 'User-Agent': 'MigraineGuardian/1.0 (HealthApp; +https://migraineguardian-frontend.onrender.com)' },
      });

      if (res.ok) {
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

          // Safety gate: NEVER process today or future dates as historical exposure
          if (dateStr >= todayStr) {
            continue;
          }

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

        const latestCompletedRecord = dailyRecords[dailyRecords.length - 1] || null;

        const summary = {
          daysFetched: dailyRecords.length,
          startDate: startDateStr,
          endDate: endDateStr,
          avgTemperature: latestCompletedRecord ? latestCompletedRecord.temperature : 22,
          avgHumidity: latestCompletedRecord ? latestCompletedRecord.humidity : 60,
          latestPressure: latestCompletedRecord ? latestCompletedRecord.pressure : 1013,
          pressureDelta,
          pressureTrend: pressureDelta < -3 ? 'dropping' : pressureDelta > 3 ? 'rising' : 'steady',
          latestCondition: latestCompletedRecord ? latestCompletedRecord.weatherCondition : 'Clear',
          latestDescription: latestCompletedRecord ? latestCompletedRecord.weatherDescription : 'clear sky',
        };

        return {
          dailyRecords,
          summary,
        };
      }
      console.warn(`[weatherApiService] Open-Meteo historical returned HTTP ${res.status}, attempting wttr.in fallback`);
    } catch (err) {
      console.warn('[weatherApiService] Open-Meteo historical fetch failed, attempting wttr.in fallback:', err.message);
    }

    // 2. Fallback to wttr.in multi-day weather
    try {
      const wttrUrl = `https://wttr.in/${lat},${lon}?format=j1`;
      const res = await fetch(wttrUrl, {
        signal: AbortSignal.timeout(8000),
        headers: { 'User-Agent': 'MigraineGuardian/1.0' },
      });

      if (res.ok) {
        const data = await res.json();
        const weatherList = data.weather || [];
        const dailyRecords = [];

        for (let i = 0; i < Math.min(weatherList.length, numDays); i++) {
          const w = weatherList[i];
          const recDate = new Date(now);
          recDate.setDate(recDate.getDate() - (numDays - i));
          const dateStr = recDate.toISOString().split('T')[0];

          const avgTemp = parseFloat(w.avgtempC) || 22.0;
          const maxTemp = parseFloat(w.maxtempC) || avgTemp + 2;
          const minTemp = parseFloat(w.mintempC) || avgTemp - 2;
          const hourlyMid = w.hourly?.[Math.floor((w.hourly?.length || 1) / 2)] || {};
          const press = parseInt(hourlyMid.pressure, 10) || 1013;
          const hum = parseInt(hourlyMid.humidity, 10) || 60;
          const desc = hourlyMid.weatherDesc?.[0]?.value || 'Clear';

          dailyRecords.push({
            weatherRecordId: dateStr,
            date: dateStr,
            timestamp: new Date(`${dateStr}T12:00:00Z`).toISOString(),
            latitude: Math.round(lat * 10000) / 10000,
            longitude: Math.round(lon * 10000) / 10000,
            temperature: avgTemp,
            tempMax: maxTemp,
            tempMin: minTemp,
            feelsLike: avgTemp,
            humidity: hum,
            pressure: press,
            weatherCondition: desc.toLowerCase().includes('rain') ? 'Rain' : desc.toLowerCase().includes('cloud') ? 'Clouds' : 'Clear',
            weatherDescription: desc,
            windSpeed: Math.round((parseFloat(hourlyMid.windspeedKmph || 0) / 3.6) * 10) / 10,
            precipitation: parseFloat(hourlyMid.precipMM || 0),
            source: 'wttr_in_historical_fallback',
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
          latestDescription: latestRecord ? latestRecord.weatherDescription : 'clear sky',
        };

        return { dailyRecords, summary };
      }
    } catch (wttrErr) {
      console.warn('[weatherApiService] wttr.in historical fallback failed:', wttrErr.message);
    }

    throw new Error('Historical weather unavailable across providers.');
  },

  /**
   * Fetches weather forecast for today (T) for coordinates.
   * Uses Open-Meteo forecast API for targetDate.
   */
  fetchForecastWeather: async (latitude, longitude, targetDate = null) => {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const dateStr = targetDate || new Date().toISOString().split('T')[0];

    if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lon) || lon < -180 || lon > 180) {
      throw new Error('Invalid coordinates for forecast weather fetch.');
    }

    try {
      const omUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&start_date=${dateStr}&end_date=${dateStr}&daily=weather_code,temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,surface_pressure_mean,precipitation_sum,wind_speed_10m_max&timezone=auto`;
      const res = await fetch(omUrl, { signal: AbortSignal.timeout(6000) });

      if (!res.ok) {
        throw new Error(`Open-Meteo forecast API returned HTTP status ${res.status}`);
      }

      const data = await res.json();
      const daily = data.daily || {};
      const dates = daily.time || [];

      if (dates.length === 0) {
        throw new Error('No daily forecast data returned by Open-Meteo.');
      }

      const code = daily.weather_code[0] ?? 0;
      const wmoMeta = WMO_WEATHER_CODES[code] || { condition: 'Clear', description: 'Clear sky' };
      const tempMax = Math.round((daily.temperature_2m_max[0] ?? 22) * 10) / 10;
      const tempMin = Math.round((daily.temperature_2m_min[0] ?? 18) * 10) / 10;
      const tempAvg = Math.round(((tempMax + tempMin) / 2) * 10) / 10;
      const pressure = Math.round(daily.surface_pressure_mean[0] ?? 1013);
      const humidity = Math.round(daily.relative_humidity_2m_mean[0] ?? 60);

      return {
        weatherRecordId: `${dateStr}_forecast`,
        date: dateStr,
        timestamp: new Date().toISOString(),
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
        windSpeed: Math.round((daily.wind_speed_10m_max[0] ?? 0) * 10) / 10,
        precipitation: Math.round((daily.precipitation_sum[0] ?? 0) * 10) / 10,
        source: 'openmeteo_forecast',
        data_type: 'forecast',
      };
    } catch (err) {
      console.error('[weatherApiService] Forecast fetch failed:', err.message);
      throw new Error(`Failed to fetch forecast weather: ${err.message}`);
    }
  },
};
