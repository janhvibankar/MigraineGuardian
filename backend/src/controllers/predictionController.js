import { firestoreService } from '../services/firestoreService.js';
import { mlInferenceService, sanitizeUrl, getMlServiceUrl } from '../services/mlInferenceService.js';
import { weatherApiService } from '../services/weatherApiService.js';

/**
 * Builds a strictly normalized payload conforming to FastAPI's Pydantic schema.
 */
export function buildNormalizedMlPayload(userId, checkinData, baselineStats, recentEpisodesCount, weatherToday = null, weatherYesterday = null) {
  const safeNum = (val, fallback) => {
    if (val === undefined || val === null) return fallback;
    const n = Number(val);
    return isNaN(n) || !isFinite(n) ? fallback : n;
  };

  const payload = {
    user_id: String(userId),
    latest_log: {
      sleep_hours: Number(safeNum(checkinData.sleep_hours ?? checkinData.sleepHours, 7.5).toFixed(1)),
      sleep_quality: Math.min(5, Math.max(1, Math.round(safeNum(checkinData.sleep_quality ?? checkinData.sleepQuality, 3)))),
      daily_stress: Math.min(10, Math.max(0, Math.round(safeNum(checkinData.daily_stress ?? checkinData.dailyStress, 4)))),
      mood: Math.min(5, Math.max(1, Math.round(safeNum(checkinData.mood, 3)))),
      screen_time: Number(safeNum(checkinData.screen_time ?? checkinData.screenHours, 6.0).toFixed(1)),
      hydration: Number(safeNum(checkinData.hydration ?? checkinData.hydrationLiters, 2.0).toFixed(1)),
    },
    baseline_stats: {
      avg_sleep: Number(safeNum(baselineStats?.avg_sleep, 7.5).toFixed(1)),
      avg_stress: Number(safeNum(baselineStats?.avg_stress, 4.0).toFixed(1)),
      pss_score: Number(safeNum(baselineStats?.pss_score, 14).toFixed(0)),
    },
    recent_episodes_count_7d: Math.max(0, Math.round(safeNum(recentEpisodesCount, 0))),
  };

  if (weatherToday && weatherYesterday) {
    payload.weather_today = weatherToday;
    payload.weather_yesterday = weatherYesterday;
  }

  return payload;
}

// Per-user in-flight promise map to prevent race conditions and duplicate ML inference
export const activeInferenceMap = new Map();

export async function getTodayPredictionController(req, res, next) {
  const startTime = Date.now();
  try {
    const userId = req.user.uid;
    const targetDate = req.query.date || new Date().toLocaleDateString('en-CA');
    const forceRecalculate = req.query.recalculate === 'true' || req.query.force === 'true';
    const userPrefix = String(userId).slice(0, 8);
    const lockKey = `${userId}_${targetDate}`;

    console.log(`[PREDICTION-GET] User: ${userPrefix}... | Date: ${targetDate} | ForceRecalc: ${forceRecalculate}`);

    // Helper to race in-flight pipeline with bounded wait budget (20s)
    const awaitInFlightPipeline = async () => {
      if (!activeInferenceMap.has(lockKey)) return { inFlightTimedOut: false, pipelineResult: null };
      console.log(`[PREDICTION-GET] [reqId: ${req.id || 'N/A'}] User: ${userPrefix}... | Awaiting in-flight ML pipeline for ${targetDate} (max 20s budget)`);
      let inFlightTimedOut = false;
      let inFlightTimer = null;
      let pipelineResult = null;
      try {
        const inFlightPromise = activeInferenceMap.get(lockKey);
        const timeoutPromise = new Promise((resolve) => {
          inFlightTimer = setTimeout(() => resolve('IN_FLIGHT_TIMEOUT'), 20000);
        });
        const raceResult = await Promise.race([inFlightPromise, timeoutPromise]);
        if (raceResult === 'IN_FLIGHT_TIMEOUT') {
          inFlightTimedOut = true;
        } else {
          pipelineResult = raceResult;
        }
      } catch (_) {
      } finally {
        if (inFlightTimer) {
          clearTimeout(inFlightTimer);
          inFlightTimer = null;
        }
      }
      return { inFlightTimedOut, pipelineResult };
    };

    // If an on-demand calculation is already in-flight for this user and date, await it with bounded 20s budget
    if (!forceRecalculate && activeInferenceMap.has(lockKey)) {
      const { inFlightTimedOut } = await awaitInFlightPipeline();
      if (inFlightTimedOut) {
        console.log(`[PREDICTION-GET] [reqId: ${req.id || 'N/A'}] In-flight pipeline still processing in background after 20s. Returning warming status to client.`);
        return res.status(200).json({
          success: true,
          data: null,
          checkinExists: true,
          forecastStatus: 'warming',
          errorCategory: 'FASTAPI_SERVICE_WARMING',
          canRetry: true,
          retryAfterMs: 8000,
          mlError: 'AI prediction service is warming up. Forecast calculation in progress...',
          message: 'AI prediction service is warming up. Forecast calculation in progress...',
        });
      }
    }

    let forecast = forceRecalculate ? null : await firestoreService.getLatestRiskForecast(userId, targetDate);

    // Verify existing forecast belongs strictly to authenticated user and targetDate
    if (forecast) {
      const forecastDateMatches = !forecast.forecastDate || forecast.forecastDate === targetDate || forecast.id === targetDate;
      const forecastScoreValid = typeof forecast.score === 'number' && !isNaN(forecast.score);
      if (!forecastDateMatches || !forecastScoreValid) {
        console.warn(`[PREDICTION-GET] Stale or invalid forecast rejected for targetDate: ${targetDate}`);
        forecast = null;
      }
    }

    // If no forecast exists yet for targetDate (or recalculate requested), check if daily check-in exists
    if (!forecast) {
      const todayCheckin = await firestoreService.getTodayCheckin(userId, targetDate);
      console.log(`[PREDICTION-GET] User: ${userPrefix}... | Check-in found: ${Boolean(todayCheckin)}`);

      if (todayCheckin) {
        // Only launch a new task if one is not already actively running
        if (!activeInferenceMap.has(lockKey)) {
          console.log(`[PREDICTION-GET] Running on-demand async ML pipeline for ${targetDate}...`);
          const asyncPipeline = (async () => {
            try {
              // 1. Fetch baseline stats & recent 7-day episode count
              const [baselineStats, recentEpisodesCount] = await Promise.all([
                firestoreService.getUserBaselineStats(userId),
                firestoreService.getRecentEpisodesCount(userId, 7),
              ]);

              // 2. Attempt weather records retrieval for target date and previous date
              let weatherTodayBlock = null;
              let weatherYesterdayBlock = null;

              try {
                const checkinDateObj = new Date(`${targetDate}T12:00:00Z`);
                checkinDateObj.setDate(checkinDateObj.getDate() - 1);
                const previousDate = checkinDateObj.toISOString().split('T')[0];

                let [todayRec, yesterdayRec] = await Promise.all([
                  firestoreService.getTodayWeatherRecord(userId, targetDate, 'observed')
                    .then((r) => r || firestoreService.getTodayWeatherRecord(userId, targetDate, 'forecast')),
                  firestoreService.getTodayWeatherRecord(userId, previousDate, 'observed')
                    .then((r) => r || firestoreService.getTodayWeatherRecord(userId, previousDate, 'forecast')),
                ]);

                const isValidNum = (v) => v !== undefined && v !== null && !isNaN(Number(v)) && isFinite(Number(v));

                if (
                  todayRec &&
                  yesterdayRec &&
                  isValidNum(todayRec.temperature) &&
                  isValidNum(todayRec.humidity) &&
                  isValidNum(todayRec.pressure) &&
                  isValidNum(yesterdayRec.pressure) &&
                  isValidNum(yesterdayRec.temperature)
                ) {
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
                console.warn('[PREDICTION-GET] Weather retrieval skipped:', wErr.message);
              }

              // 3. Construct normalized FastAPI ML payload
              const mlPayload = buildNormalizedMlPayload(
                userId,
                todayCheckin,
                baselineStats,
                recentEpisodesCount,
                weatherTodayBlock,
                weatherYesterdayBlock
              );

              // 4. Send request to FastAPI ML service (/predict) with bounded 75s deadline
              const mlResult = await mlInferenceService.predictMigraineRisk(mlPayload, null, {
                deadlineMs: 75000,
                reqId: req.id,
              });

              if (mlResult.success && mlResult.data) {
                try {
                  const forecastSaveResult = await firestoreService.saveRiskForecast(userId, targetDate, mlResult.data);
                  const totalElapsed = Date.now() - startTime;
                  console.log(
                    `[PREDICTION-GET] Success: score=${forecastSaveResult.forecast.score}%, level=${forecastSaveResult.forecast.level} | Saved: true | Elapsed: ${totalElapsed}ms`
                  );
                  return forecastSaveResult.forecast;
                } catch (persistErr) {
                  console.error(`[PREDICTION-GET] Firestore persistence failure:`, persistErr.message);
                  return { error: { message: 'Failed to save risk forecast to database.' } };
                }
              } else {
                console.warn(`[PREDICTION-GET] ML request failed:`, mlResult.error);
                return { error: mlResult.error, transient: mlResult.transient };
              }
            } catch (genErr) {
              console.error('[PREDICTION-GET] Error executing on-demand prediction:', genErr.message);
              return { error: { message: genErr.message } };
            } finally {
              activeInferenceMap.delete(lockKey);
            }
          })();

          activeInferenceMap.set(lockKey, asyncPipeline);
        }

        // Await the pipeline for up to 20s
        const { inFlightTimedOut, pipelineResult } = await awaitInFlightPipeline();
        if (inFlightTimedOut) {
          console.log(`[PREDICTION-GET] [reqId: ${req.id || 'N/A'}] Pipeline still running in background. Returning warming status.`);
          return res.status(200).json({
            success: true,
            data: null,
            checkinExists: true,
            forecastStatus: 'warming',
            errorCategory: 'FASTAPI_SERVICE_WARMING',
            canRetry: true,
            retryAfterMs: 8000,
            mlError: 'AI prediction service is warming up. Forecast calculation in progress...',
            message: 'AI prediction service is warming up. Forecast calculation in progress...',
          });
        }

        if (pipelineResult?.error) {
          const err = pipelineResult.error;
          const isWarming = Boolean(
            pipelineResult.transient ||
            err?.code === 'FASTAPI_SERVICE_WARMING' ||
            pipelineResult.timeout
          );
          const errCategory = isWarming
            ? 'The AI model service is warming up. Please click Calculate Forecast in a moment.'
            : (err?.message || 'Prediction service error. Please try again.');
          const errorCode = err?.code || (isWarming ? 'FASTAPI_SERVICE_WARMING' : 'ML_PREDICTION_FAILED');

          return res.status(200).json({
            success: true,
            data: null,
            checkinExists: true,
            forecastStatus: isWarming ? 'warming' : 'error',
            mlError: errCategory,
            errorCategory: errorCode,
            canRetry: isWarming || errorCode === 'FASTAPI_TIMEOUT' || errorCode === 'FASTAPI_UNAVAILABLE',
            retryAfterMs: isWarming ? 8000 : null,
          });
        }

        // Pipeline resolved within budget — re-check Firestore for forecast
        forecast = await firestoreService.getLatestRiskForecast(userId, targetDate);
      }
    } else {
      console.log(`[PREDICTION-GET] Existing forecast found: score=${forecast.score}%, level=${forecast.level}`);
    }

    if (!forecast) {
      const todayCheckin = await firestoreService.getTodayCheckin(userId, targetDate);
      if (!todayCheckin) {
        return res.status(200).json({
          success: true,
          data: null,
          checkinExists: false,
          forecastStatus: 'no_checkin',
        });
      }

      // Check-in exists but forecast not yet available (service warming up in background)
      return res.status(200).json({
        success: true,
        data: null,
        checkinExists: true,
        forecastStatus: 'warming',
        errorCategory: 'FASTAPI_SERVICE_WARMING',
        canRetry: true,
        retryAfterMs: 8000,
        mlError: 'AI prediction service is warming up. Forecast calculation in progress...',
        message: 'AI prediction service is warming up. Forecast calculation in progress...',
      });
    }

    return res.status(200).json({
      success: true,
      data: forecast,
      checkinExists: true,
      forecastStatus: 'ready',
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

    const targetDate = date || new Date().toLocaleDateString('en-CA');

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

    // 7. Call the ML service (/predict) with request correlation
    const mlResult = await mlInferenceService.predictMigraineRisk(mlPayload, null, {
      reqId: req.id,
      deadlineMs: 70000,
    });

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

    const isWarming = Boolean(
      mlResult.transient ||
      mlResult.error?.code === 'FASTAPI_SERVICE_WARMING' ||
      mlResult.timeout
    );

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      message: forecastSaved
        ? 'Morning prediction input and risk forecast recorded.'
        : isWarming
        ? 'AI prediction service is warming up. Your morning check-in has been saved. Please check back shortly.'
        : 'Morning prediction input recorded; ML prediction service unavailable.',
      entry: inputSaveResult.input,
      forecastAvailable: forecastSaved,
      forecastStatus: forecastSaved ? 'ready' : isWarming ? 'warming' : 'error',
      errorCategory: forecastSaved ? null : (mlResult.error?.code || (isWarming ? 'FASTAPI_SERVICE_WARMING' : 'FASTAPI_UNAVAILABLE')),
      canRetry: !forecastSaved,
      retryAfterMs: isWarming ? 8000 : null,
      forecast: forecastDoc,
      mlWarning: !forecastSaved ? (mlResult.error?.message || 'ML prediction service unavailable') : null,
    });
  } catch (error) {
    next(error);
  }
}
