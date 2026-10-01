import { firestoreService } from '../services/firestoreService.js';
import { mlInferenceService } from '../services/mlInferenceService.js';

export async function submitDailyCheckinController(req, res, next) {
  try {
    const userId = req.user.uid;
    const {
      sleep_hours,
      sleep_quality,
      daily_stress,
      mood,
      screen_time,
      hydration,
      meal_skipped,
      caffeine,
      exercise,
      migraine_occurrence,
      migraine_severity,
      migraine_duration,
      symptoms,
    } = req.body;

    const errors = [];

    // Sleep hours validation
    if (sleep_hours === undefined || sleep_hours === null || typeof Number(sleep_hours) !== 'number' || isNaN(Number(sleep_hours))) {
      errors.push('sleep_hours is required and must be a valid number.');
    } else if (Number(sleep_hours) < 0 || Number(sleep_hours) > 24) {
      errors.push('sleep_hours must be between 0 and 24 hours.');
    }

    // Sleep quality validation (1-5)
    if (sleep_quality === undefined || sleep_quality === null || !Number.isInteger(Number(sleep_quality))) {
      errors.push('sleep_quality is required and must be an integer.');
    } else if (Number(sleep_quality) < 1 || Number(sleep_quality) > 5) {
      errors.push('sleep_quality must be between 1 and 5.');
    }

    // Daily stress validation (0-10)
    if (daily_stress === undefined || daily_stress === null || !Number.isInteger(Number(daily_stress))) {
      errors.push('daily_stress is required and must be an integer.');
    } else if (Number(daily_stress) < 0 || Number(daily_stress) > 10) {
      errors.push('daily_stress must be between 0 and 10.');
    }

    // Mood validation (1-5)
    if (mood !== undefined && mood !== null) {
      if (!Number.isInteger(Number(mood)) || Number(mood) < 1 || Number(mood) > 5) {
        errors.push('mood must be an integer between 1 and 5.');
      }
    }

    // Screen time validation
    if (screen_time === undefined || screen_time === null || isNaN(Number(screen_time))) {
      errors.push('screen_time is required and must be a number.');
    } else if (Number(screen_time) < 0 || Number(screen_time) > 24) {
      errors.push('screen_time must be between 0 and 24 hours.');
    }

    // Hydration validation
    if (hydration === undefined || hydration === null || isNaN(Number(hydration))) {
      errors.push('hydration is required and must be a number.');
    } else if (Number(hydration) < 0 || Number(hydration) > 20) {
      errors.push('hydration must be between 0 and 20 Litres.');
    }

    // Migraine episode validation
    const isMigraine = Boolean(migraine_occurrence);
    if (isMigraine) {
      if (migraine_severity === undefined || migraine_severity === null || !Number.isInteger(Number(migraine_severity))) {
        errors.push('migraine_severity is required when migraine_occurrence is true and must be an integer.');
      } else if (Number(migraine_severity) < 0 || Number(migraine_severity) > 10) {
        errors.push('migraine_severity must be between 0 and 10.');
      }

      if (!migraine_duration || typeof migraine_duration !== 'string') {
        errors.push('migraine_duration is required when migraine_occurrence is true.');
      }

      if (symptoms !== undefined && !Array.isArray(symptoms)) {
        errors.push('symptoms must be an array of strings.');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Check-in validation failed.',
          details: errors,
        },
      });
    }

    // 1. Save check-in document to Firestore
    const result = await firestoreService.saveDailyCheckin(userId, req.body);
    const date = result.entry.date || new Date().toISOString().split('T')[0];
    console.log(`[PREDICTION] CheckIn saved for user ${userId} on date ${date}`);

    // 2. Fetch baseline stats & recent 7-day episode count from Firestore
    const baselineStats = await firestoreService.getUserBaselineStats(userId);
    const recentEpisodesCount = await firestoreService.getRecentEpisodesCount(userId, 7);

    // 3. Attempt weather records retrieval for target date (date) and previous date (date - 1)
    let weatherTodayBlock = null;
    let weatherYesterdayBlock = null;

    try {
      const checkinDateObj = new Date(`${date}T12:00:00Z`);
      checkinDateObj.setDate(checkinDateObj.getDate() - 1);
      const previousDate = checkinDateObj.toISOString().split('T')[0];

      let todayRec = await firestoreService.getTodayWeatherRecord(userId, date, 'observed');
      if (!todayRec) {
        todayRec = await firestoreService.getTodayWeatherRecord(userId, date, 'forecast');
      }
      let yesterdayRec = await firestoreService.getTodayWeatherRecord(userId, previousDate, 'observed');
      if (!yesterdayRec) {
        yesterdayRec = await firestoreService.getTodayWeatherRecord(userId, previousDate, 'forecast');
      }

      const isValidNum = (v) => v !== undefined && v !== null && !isNaN(Number(v)) && isFinite(Number(v));

      if (todayRec && yesterdayRec &&
          isValidNum(todayRec.temperature) && isValidNum(todayRec.humidity) && isValidNum(todayRec.pressure) &&
          isValidNum(yesterdayRec.pressure) && isValidNum(yesterdayRec.temperature)) {
        weatherTodayBlock = {
          temperature: Number(todayRec.temperature),
          humidity: Number(todayRec.humidity),
          pressure: Number(todayRec.pressure),
          precipitation: Number(todayRec.precipitation || 0),
          wind_speed: Number(todayRec.windSpeed || todayRec.wind_speed || 0),
        };
        weatherYesterdayBlock = {
          pressure: Number(yesterdayRec.pressure),
          temperature: Number(yesterdayRec.temperature),
        };
      }
    } catch (wErr) {
      console.warn('[PREDICTION] Weather retrieval for ML payload skipped:', wErr.message);
    }

    const safeNum = (val, fallback) => {
      if (val === undefined || val === null) return fallback;
      const n = Number(val);
      return isNaN(n) || !isFinite(n) ? fallback : n;
    };

    // 4. Construct FastAPI ML payload with safe numeric coercion
    const mlPayload = {
      user_id: userId,
      latest_log: {
        sleep_hours: safeNum(req.body.sleep_hours ?? req.body.sleepHours, 7.5),
        sleep_quality: safeNum(req.body.sleep_quality ?? req.body.sleepQuality, 3),
        daily_stress: safeNum(req.body.daily_stress ?? req.body.dailyStress, 4),
        mood: safeNum(req.body.mood, 3),
        screen_time: safeNum(req.body.screen_time ?? req.body.screenHours, 6.0),
        hydration: safeNum(req.body.hydration ?? req.body.hydrationLiters, 2.0),
      },
      baseline_stats: {
        avg_sleep: safeNum(baselineStats.avg_sleep, 7.5),
        avg_stress: safeNum(baselineStats.avg_stress, 4.0),
        pss_score: safeNum(baselineStats.pss_score, 14),
      },
      recent_episodes_count_7d: safeNum(recentEpisodesCount, 0),
    };

    if (weatherTodayBlock && weatherYesterdayBlock) {
      mlPayload.weather_today = weatherTodayBlock;
      mlPayload.weather_yesterday = weatherYesterdayBlock;
    }

    // 5. Send request to FastAPI ML service (/predict)
    console.log(`[PREDICTION] Starting forecast for user check-in`);
    console.log(`[PREDICTION] Current UID: ${userId}`);
    console.log(`[PREDICTION] Request payload:`, JSON.stringify(mlPayload));
    const mlResult = await mlInferenceService.predictMigraineRisk(mlPayload);

    let forecastDoc = null;
    let forecastSaved = false;

    if (mlResult.success && mlResult.data) {
      try {
        // 6. Save prediction, elevatedFactors, xai, and focusAreas to Firestore users/{userId}/risk_forecasts/{date}
        const forecastSaveResult = await firestoreService.saveRiskForecast(userId, date, mlResult.data);
        forecastDoc = forecastSaveResult.forecast;
        forecastSaved = true;
        console.log(`[PREDICTION] Final prediction result: score=${forecastDoc.score}%, level=${forecastDoc.level}`);
        console.log(`[PREDICTION] Firestore persistence succeeded for date ${date}`);
      } catch (persistErr) {
        console.error(`[PREDICTION] Firestore persistence failure:`, persistErr.message);
      }
    } else {
      console.warn(`[PREDICTION] ML request failed:`, mlResult.error?.message || 'ML service unavailable');
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      message: forecastSaved ? 'Check-in and risk forecast recorded.' : 'Check-in recorded; ML prediction service unavailable.',
      entry: result.entry,
      checkinSaved: true,
      forecastAvailable: forecastSaved,
      forecast: forecastDoc,
      mlWarning: !forecastSaved ? (mlResult.error?.message || 'ML prediction service unavailable') : null,
    });
  } catch (error) {
    next(error);
  }
}


export async function getDailyLogsController(req, res, next) {
  try {
    const userId = req.user.uid;
    const limit = parseInt(req.query.limit, 10) || 30;
    const maxLimit = Math.min(limit, 100);

    const logs = await firestoreService.getDailyLogs(userId, maxLimit);

    return res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
}

export async function getTodayCheckinController(req, res, next) {
  try {
    const userId = req.user.uid;
    const targetDate = req.query.date || null;

    const checkin = await firestoreService.getTodayCheckin(userId, targetDate);

    return res.status(200).json({
      success: true,
      data: checkin,
    });
  } catch (error) {
    next(error);
  }
}
