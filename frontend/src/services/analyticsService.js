import { trackingService } from './trackingService.js';
import { predictionService } from './predictionService.js';

export const analyticsService = {
  /**
   * Dynamically retrieves analytics metrics computed from current user's actual check-in records.
   */
  getAnalyticsData: async (timeframe = '7days') => {
    const limit = timeframe === '30days' ? 30 : 7;
    const logs = await trackingService.getDailyLogs(limit);
    const prediction = await predictionService.getTodayPrediction();

    if (!logs || logs.length === 0) {
      return {
        hasData: false,
        timeframe,
        totalLogs: 0,
        summary: {
          avgSleep: 'No data',
          avgStress: 'No data',
          avgHydration: 'No data',
          migraineCount: 0,
        },
        riskTrend: [],
        sleepTrend: [],
        stressTrend: [],
        hydrationTrend: [],
        screenTimeTrend: [],
      };
    }

    const validLogs = logs.slice(0, limit);
    let totalSleep = 0;
    let totalStress = 0;
    let totalHydration = 0;
    let totalScreen = 0;
    let migraineCount = 0;

    const riskTrend = [];
    const sleepTrend = [];
    const stressTrend = [];
    const hydrationTrend = [];
    const screenTimeTrend = [];

    validLogs.forEach((log) => {
      const isMigraine = Boolean(log.migraine_occurrence);
      if (isMigraine) migraineCount++;

      const sleep = Number(log.sleep_hours || 0);
      const stress = Number(log.daily_stress || 0);
      const hydration = Number(log.hydration || 0);
      const screen = Number(log.screen_time || 0);

      totalSleep += sleep;
      totalStress += stress;
      totalHydration += hydration;
      totalScreen += screen;

      const dateObj = new Date(log.date);
      const dayLabel = isNaN(dateObj.getTime())
        ? log.date
        : dateObj.toLocaleDateString('en-US', { weekday: 'short' });

      const estRisk = Math.min(
        100,
        Math.max(
          10,
          Math.round((10 - sleep) * 8 + stress * 6 + screen * 4 - hydration * 3)
        )
      );

      riskTrend.push({ date: log.date, day: dayLabel, risk: estRisk, isMigraineDay: isMigraine });
      sleepTrend.push({ date: log.date, day: dayLabel, hours: sleep });
      stressTrend.push({ date: log.date, day: dayLabel, level: stress });
      hydrationTrend.push({ date: log.date, day: dayLabel, liters: hydration });
      screenTimeTrend.push({ date: log.date, day: dayLabel, hours: screen });
    });

    // Chronological order
    riskTrend.reverse();
    sleepTrend.reverse();
    stressTrend.reverse();
    hydrationTrend.reverse();
    screenTimeTrend.reverse();

    const count = validLogs.length;

    return {
      hasData: true,
      timeframe,
      totalLogs: count,
      summary: {
        avgSleep: count > 0 ? `${(totalSleep / count).toFixed(1)} hrs` : 'No data',
        avgStress: count > 0 ? `${(totalStress / count).toFixed(1)} / 10` : 'No data',
        avgHydration: count > 0 ? `${(totalHydration / count).toFixed(1)} L` : 'No data',
        migraineCount,
      },
      riskTrend,
      sleepTrend,
      stressTrend,
      hydrationTrend,
      screenTimeTrend,
    };
  },
};
