import { firestoreService } from '../services/firestoreService.js';

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

    const result = await firestoreService.saveDailyCheckin(userId, req.body);

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Check-in gently recorded in Firestore.',
      entry: result.entry,
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
