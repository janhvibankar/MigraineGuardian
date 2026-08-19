import { weatherApiService } from '../services/weatherApiService.js';
import { firestoreService } from '../services/firestoreService.js';

/**
 * Controller to handle POST /api/weather/current
 * Receives { latitude, longitude, date } in request body.
 * Authenticated user ID is obtained strictly from req.user.uid.
 */
export async function getCurrentWeatherController(req, res, next) {
  try {
    const userId = req.user.uid;
    const { latitude, longitude, date } = req.body;

    if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Latitude and longitude coordinates are required.',
        },
      });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lon) || lon < -180 || lon > 180) {
      return res.status(400).json({
        error: {
          code: 'INVALID_COORDINATES',
          message: 'Coordinates must be valid numbers: latitude (-90 to 90), longitude (-180 to 180).',
        },
      });
    }

    const targetDate = date || new Date().toISOString().split('T')[0];

    console.log('[Weather Debug] controller UID:', userId);
    console.log('[Weather] authenticated UID:', userId);
    console.log('[Weather] received coordinates:', { latitude: lat, longitude: lon });

    // Fetch weather metrics from API provider (with keyless fallback)
    const weatherData = await weatherApiService.fetchCurrentWeather(lat, lon);
    console.log('[Weather] weather provider response:', weatherData.weatherCondition, `${weatherData.temperature}°C (Source: ${weatherData.source})`);

    // Store under authenticated user's Firestore path: users/{userId}/weather_records/{date}
    const firestorePath = `users/${userId}/weather_records/${targetDate}`;
    console.log('[Weather] saving Firestore record...');
    console.log('[Weather] Firestore path:', firestorePath);

    let recordResult = null;
    try {
      recordResult = await firestoreService.saveWeatherRecord(userId, targetDate, weatherData);
      console.log('[Weather] save successful to path:', firestorePath);
    } catch (fsErr) {
      console.warn('[Weather] Error saving weather to Firestore:', fsErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Weather data fetched and saved to user profile.',
      data: recordResult?.record || weatherData,
    });
  } catch (error) {
    console.warn('[Weather] Weather fetch error:', error.message);
    // Non-blocking error response for client resilience
    return res.status(200).json({
      success: false,
      message: 'Weather data was unavailable.',
      error: error.message,
      data: null,
    });
  }
}

/**
 * Controller to handle GET /api/weather/today
 */
export async function getTodayWeatherController(req, res, next) {
  try {
    const userId = req.user.uid;
    const targetDate = req.query.date || new Date().toISOString().split('T')[0];

    const record = await firestoreService.getTodayWeatherRecord(userId, targetDate);

    return res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller to handle GET /api/weather/history
 */
export async function getWeatherHistoryController(req, res, next) {
  try {
    const userId = req.user.uid;
    const limit = parseInt(req.query.limit, 10) || 30;

    const records = await firestoreService.getWeatherHistory(userId, limit);

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller to handle GET /api/weather/geocode?query=...
 */
export async function searchLocationController(req, res, next) {
  try {
    const query = req.query.query || '';
    if (!query.trim()) {
      return res.status(200).json({ success: true, data: [] });
    }

    const results = await weatherApiService.searchLocationGeocode(query);
    return res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller to handle POST /api/weather/historical
 * Body: { latitude, longitude, days, locationName }
 */
export async function getHistoricalWeatherController(req, res, next) {
  try {
    const userId = req.user.uid;
    const { latitude, longitude, days = 3, locationName = null } = req.body;

    if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Latitude and longitude are required for historical weather fetch.',
        },
      });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lon) || lon < -180 || lon > 180) {
      return res.status(400).json({
        error: {
          code: 'INVALID_COORDINATES',
          message: 'Invalid coordinates provided.',
        },
      });
    }

    const result = await weatherApiService.fetchHistoricalWeather(lat, lon, days);

    // Save daily records to Firestore users/{userId}/weather_records/{date}
    if (result.dailyRecords && result.dailyRecords.length > 0) {
      try {
        await firestoreService.saveHistoricalWeatherRecords(userId, result.dailyRecords);
      } catch (fsErr) {
        console.warn('[Weather] Firestore save historical records error:', fsErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      locationName: locationName || `${lat}, ${lon}`,
      summary: result.summary,
      records: result.dailyRecords,
    });
  } catch (error) {
    console.warn('[Weather] Historical fetch error:', error.message);
    return res.status(200).json({
      success: false,
      message: 'Historical weather data was unavailable.',
      error: error.message,
      summary: null,
      records: [],
    });
  }
}

/**
 * Controller to handle GET /api/weather/usual-location
 */
export async function getUsualLocationController(req, res, next) {
  try {
    const userId = req.user.uid;
    const usualLocation = await firestoreService.getUsualLocation(userId);
    return res.status(200).json({
      success: true,
      data: usualLocation,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller to handle POST /api/weather/usual-location
 * Body: { name, latitude, longitude }
 */
export async function updateUsualLocationController(req, res, next) {
  try {
    const userId = req.user.uid;
    const { name, latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name, latitude, and longitude are required for usual location.',
        },
      });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lon) || lon < -180 || lon > 180) {
      return res.status(400).json({
        error: {
          code: 'INVALID_COORDINATES',
          message: 'Invalid latitude or longitude.',
        },
      });
    }

    const result = await firestoreService.updateUsualLocation(userId, {
      name: name || 'Home Location',
      latitude: lat,
      longitude: lon,
    });

    return res.status(200).json({
      success: true,
      message: 'Usual location updated successfully.',
      data: result.usualLocation,
    });
  } catch (error) {
    next(error);
  }
}
