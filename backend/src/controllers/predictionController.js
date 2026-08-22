import { firestoreService } from '../services/firestoreService.js';
import { mlInferenceService } from '../services/mlInferenceService.js';
import { weatherApiService } from '../services/weatherApiService.js';

export async function getTodayPredictionController(req, res, next) {
  try {
    const userId = req.user.uid;
    const targetDate = req.query.date || new Date().toISOString().split('T')[0];

    const forecast = await firestoreService.getLatestRiskForecast(userId, targetDate);

    if (!forecast) {
      return res.status(200).json({
        success: true,
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      data: forecast,
    });
  } catch (error) {
    next(error);
  }
}

export async function submitMorningPredictionController(req, res, next) {
  try {
    const userId = req.user.uid;
    const {
      sleep_hours,
      sleep_quality,
      morning_stress,
      morning_mood,
      latitude,
      longitude,
      date,
    } = req.body;

    const targetDate = date || new Date().toISOString().split('T')[0];

    // 1. Duplicate Prediction Protection
    const existingInput = await firestoreService.getMorningPredictionInput(userId, targetDate);
    if (existingInput) {
      const existingForecast = await firestoreService.getLatestRiskForecast(userId, targetDate);
      if (existingForecast) {
        return res.status(200).json({
          success: true,
          message: 'Morning prediction already calculated for today.',
          alreadyExists: true,
          forecast: existingForecast,
          entry: existingInput,
        });
      }
    }

    // 2. Validate lifestyle inputs
    const errors = [];
    if (sleep_hours === undefined || sleep_hours === null || typeof Number(sleep_hours) !== 'number' || isNaN(Number(sleep_hours))) {
      errors.push('sleep_hours is required and must be a valid number.');
    } else if (Number(sleep_hours) < 0 || Number(sleep_hours) > 24) {
      errors.push('sleep_hours must be between 0 and 24 hours.');
    }

    if (sleep_quality === undefined || sleep_quality === null || !Number.isInteger(Number(sleep_quality))) {
      errors.push('sleep_quality is required and must be an integer.');
    } else if (Number(sleep_quality) < 1 || Number(sleep_quality) > 5) {
      errors.push('sleep_quality must be between 1 and 5.');
    }

    if (morning_stress === undefined || morning_stress === null || !Number.isInteger(Number(morning_stress))) {
      errors.push('morning_stress is required and must be an integer.');
    } else if (Number(morning_stress) < 0 || Number(morning_stress) > 10) {
      errors.push('morning_stress must be between 0 and 10.');
    }

    if (morning_mood === undefined || morning_mood === null || !Number.isInteger(Number(morning_mood))) {
      errors.push('morning_mood is required and must be an integer.');
    } else if (Number(morning_mood) < 1 || Number(morning_mood) > 5) {
      errors.push('morning_mood must be between 1 and 5.');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Morning prediction validation failed.',
          details: errors,
        },
      });
    }

    // 3. Resolve location coordinates
    let lat = latitude;
    let lon = longitude;

    if (lat === undefined || lon === undefined || lat === null || lon === null) {
      const usualLoc = await firestoreService.getUsualLocation(userId);
      if (usualLoc) {
        lat = usualLoc.latitude;
        lon = usualLoc.longitude;
      }
    }

    // 4. Retrieve valid weather information available at prediction time
    let weatherTodayBlock = null;
    let weatherYesterdayBlock = null;
    let fetchedForecast = null;
    let fetchedYesterdayObserved = null;

    if (lat !== undefined && lon !== undefined && lat !== null && lon !== null) {
      try {
        // Fetch weather forecast today (T)
        fetchedForecast = await weatherApiService.fetchForecastWeather(lat, lon, targetDate);
        // Save forecast weather record to Firestore
        await firestoreService.saveWeatherRecord(userId, targetDate, fetchedForecast);

        weatherTodayBlock = {
          temperature: Number(fetchedForecast.temperature),
          humidity: Number(fetchedForecast.humidity),
          pressure: Number(fetchedForecast.pressure),
          precipitation: Number(fetchedForecast.precipitation || 0),
          wind_speed: Number(fetchedForecast.windSpeed || 0),
        };

        // Fetch observed weather yesterday (T-1)
        const checkinDateObj = new Date(`${targetDate}T12:00:00Z`);
        checkinDateObj.setDate(checkinDateObj.getDate() - 1);
        const previousDate = checkinDateObj.toISOString().split('T')[0];

        let yesterdayRec = await firestoreService.getTodayWeatherRecord(userId, previousDate, 'observed');
        if (!yesterdayRec) {
          try {
            // Fetch and save yesterday's observed weather (days=1)
            const histResult = await weatherApiService.fetchHistoricalWeather(lat, lon, 1);
            if (histResult.dailyRecords && histResult.dailyRecords.length > 0) {
              await firestoreService.saveHistoricalWeatherRecords(userId, histResult.dailyRecords);
              yesterdayRec = histResult.dailyRecords[0];
            }
          } catch (histErr) {
            console.warn('[morningPrediction] Failed to fetch historical weather for yesterday:', histErr.message);
          }
        }

        if (yesterdayRec) {
          fetchedYesterdayObserved = yesterdayRec;
          weatherYesterdayBlock = {
            pressure: Number(yesterdayRec.pressure),
            temperature: Number(yesterdayRec.temperature),
          };
        }
      } catch (wErr) {
        console.warn('[morningPrediction] Weather retrieval skipped:', wErr.message);
      }
    }

    // 5. Fetch baseline stats & recent 7-day episode count from Firestore
    const baselineStats = await firestoreService.getUserBaselineStats(userId);
    const recentEpisodesCount = await firestoreService.getRecentEpisodesCount(userId, 7);

    // 6. Construct FastAPI ML payload
    const mlPayload = {
      user_id: userId,
      latest_log: {
        sleep_hours: Number(sleep_hours),
        sleep_quality: Number(sleep_quality),
        daily_stress: Number(morning_stress), // Map morning stress as stress proxy
        mood: Number(morning_mood), // Map morning mood as mood proxy
        screen_time: 0.0, // Morning prediction does not use end-of-day screen time
        hydration: 0.0, // Morning prediction does not use end-of-day hydration
      },
      baseline_stats: {
        avg_sleep: Number(baselineStats.avg_sleep),
        avg_stress: Number(baselineStats.avg_stress),
        pss_score: Number(baselineStats.pss_score),
      },
      recent_episodes_count_7d: Number(recentEpisodesCount),
    };

    if (weatherTodayBlock && weatherYesterdayBlock) {
      mlPayload.weather_today = weatherTodayBlock;
      mlPayload.weather_yesterday = weatherYesterdayBlock;
    }

    // 7. Call the ML service (/predict)
    const mlResult = await mlInferenceService.predictMigraineRisk(mlPayload);

    let forecastDoc = null;
    let forecastSaved = false;

    if (mlResult.success && mlResult.data) {
      // 8. Save resulting forecast to Firestore
      const forecastSaveResult = await firestoreService.saveRiskForecast(userId, targetDate, mlResult.data);
      forecastDoc = forecastSaveResult.forecast;
      forecastSaved = true;
    }

    // 9. Save morning prediction input document to Firestore
    const predictionInputData = {
      prediction_timestamp: new Date().toISOString(),
      sleep_hours: Number(sleep_hours),
      sleep_quality: Number(sleep_quality),
      morning_stress: Number(morning_stress),
      morning_mood: Number(morning_mood),
      weather_forecast: fetchedForecast,
      weather_yesterday: fetchedYesterdayObserved,
    };
    const inputSaveResult = await firestoreService.saveMorningPredictionInput(userId, targetDate, predictionInputData);

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      message: forecastSaved ? 'Morning prediction input and risk forecast recorded.' : 'Morning prediction input recorded; ML prediction service unavailable.',
      entry: inputSaveResult.input,
      forecastAvailable: forecastSaved,
      forecast: forecastDoc,
      mlWarning: !forecastSaved ? (mlResult.error?.message || 'ML prediction service unavailable') : null,
    });
  } catch (error) {
    next(error);
  }
}
