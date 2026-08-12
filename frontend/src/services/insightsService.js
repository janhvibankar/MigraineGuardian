import { trackingService } from './trackingService.js';
import { predictionService } from './predictionService.js';

export const insightsService = {
  /**
   * Dynamically retrieves weekly pattern insights computed from current user's actual check-in records.
   */
  getWeeklyInsights: async () => {
    const logs = await trackingService.getDailyLogs(7);
    const prediction = await predictionService.getTodayPrediction();

    if (!logs || logs.length === 0) {
      return {
        hasData: false,
        summary: {
          migraineDays: 0,
          avgSleep: 'No data',
          avgStress: 'No data',
        },
        noticedPatterns: [],
        nextWeekFocus: [],
      };
    }

    let totalSleep = 0;
    let totalStress = 0;
    let migraineDays = 0;
    const count = logs.length;

    logs.forEach((log) => {
      if (log.migraine_occurrence) migraineDays++;
      totalSleep += Number(log.sleep_hours || 0);
      totalStress += Number(log.daily_stress || 0);
    });

    const avgSleep = (totalSleep / count).toFixed(1);
    const avgStress = (totalStress / count).toFixed(1);

    const noticedPatterns = [];
    if (avgSleep < 6.5) {
      noticedPatterns.push({
        title: 'Sleep Rest Deficit',
        description: `Average sleep over your past ${count} log(s) was ${avgSleep} hours (target: 7.5 hrs).`,
        impact: 'High',
      });
    }

    if (avgStress > 6.0) {
      noticedPatterns.push({
        title: 'Elevated Daily Stress',
        description: `Average daily stress was ${avgStress} / 10. Consider 5-minute breathing breaks.`,
        impact: 'Moderate',
      });
    }

    const nextWeekFocus = prediction?.focusAreas || [
      {
        title: 'Daily Check-in Consistency',
        description: 'Log your daily signals before 8:00 PM to improve baseline sensitivity accuracy.',
      },
    ];

    return {
      hasData: true,
      summary: {
        migraineDays,
        avgSleep: `${avgSleep} hrs`,
        avgStress: `${avgStress} / 10`,
      },
      noticedPatterns,
      nextWeekFocus,
    };
  },
};
