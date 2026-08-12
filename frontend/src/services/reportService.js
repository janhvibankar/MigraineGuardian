import { trackingService } from './trackingService.js';
import { predictionService } from './predictionService.js';

function formatPeriodLabel(daysCount) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - (daysCount - 1));

  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  const startStr = startDate.toLocaleDateString('en-US', options);
  const endStr = endDate.toLocaleDateString('en-US', options);

  return `${startStr} – ${endStr}`;
}

export const reportService = {
  /**
   * Dynamically generates report summary metrics and historical risk trajectory
   * strictly from authenticated user's check-in logs and forecasts.
   */
  getReportSummary: async (timeframe = 'weekly') => {
    const daysLimit = timeframe === 'monthly' ? 30 : 7;
    const periodLabel = formatPeriodLabel(daysLimit);
    const logs = await trackingService.getDailyLogs(daysLimit);
    const prediction = await predictionService.getTodayPrediction();

    if (!logs || logs.length === 0) {
      return {
        hasData: false,
        timeframe,
        periodLabel,
        recordId: null,
        migraineDays: 0,
        avgRisk: prediction?.score ?? null,
        avgSeverity: null,
        trackingCompletion: 0,
        totalLogs: 0,
        expectedDays: daysLimit,
        riskTrend: [],
        primaryTriggers: [],
        keyTakeaway: 'No check-in records logged for this period. Complete your first daily check-in to build personalized report metrics.',
      };
    }

    // Filter logs within timeframe
    const validLogs = logs.slice(0, daysLimit);
    const totalLogs = validLogs.length;
    const trackingCompletion = Math.round((totalLogs / daysLimit) * 100);

    // Count migraine days & severity
    let migraineDays = 0;
    let totalSeverity = 0;
    let severityCount = 0;

    const riskTrend = validLogs.map((log) => {
      const isMigraine = Boolean(log.migraine_occurrence);
      if (isMigraine) {
        migraineDays++;
        if (log.migraine_severity !== null && log.migraine_severity !== undefined) {
          totalSeverity += Number(log.migraine_severity);
          severityCount++;
        }
      }

      // Compute estimated risk index from log signals or prediction
      const estRisk = Math.min(
        100,
        Math.max(
          10,
          Math.round(
            (10 - Number(log.sleep_hours || 7)) * 8 +
              Number(log.daily_stress || 4) * 6 +
              Number(log.screen_time || 5) * 4 -
              Number(log.hydration || 2) * 3
          )
        )
      );

      const dateObj = new Date(log.date);
      const dayLabel = isNaN(dateObj.getTime())
        ? log.date
        : dateObj.toLocaleDateString('en-US', { weekday: 'short' });

      return {
        date: log.date,
        day: dayLabel,
        risk: estRisk,
        isMigraineDay: isMigraine,
        sleep: log.sleep_hours,
        stress: log.daily_stress,
        screen: log.screen_time,
        hydration: log.hydration,
      };
    }).reverse(); // Chronological order

    const avgSeverity = severityCount > 0 ? (totalSeverity / severityCount).toFixed(1) : null;
    const avgRisk = prediction?.score ?? (riskTrend.length > 0 ? Math.round(riskTrend.reduce((acc, r) => acc + r.risk, 0) / riskTrend.length) : null);

    return {
      hasData: true,
      timeframe,
      periodLabel,
      recordId: `MG-REP-${Date.now().toString(36).toUpperCase()}`,
      migraineDays,
      avgRisk,
      avgSeverity,
      trackingCompletion,
      totalLogs,
      expectedDays: daysLimit,
      riskTrend,
      keyTakeaway: migraineDays > 0
        ? `Logged ${migraineDays} migraine episode(s) across ${totalLogs} check-ins. Maintain consistent sleep and hydration routines.`
        : `Zero migraine episodes logged across ${totalLogs} check-ins. Baseline metrics remain stable.`,
    };
  },

  generatePdfReport: async (type = 'weekly') => {
    await new Promise((res) => setTimeout(res, 400));
    return {
      success: true,
      filename: `MigraineGuardian_${type}_report_${new Date().toISOString().split('T')[0]}.pdf`,
      downloadUrl: '#',
    };
  },

  generateShareLink: async (type = 'weekly') => {
    await new Promise((res) => setTimeout(res, 300));
    return {
      success: true,
      shareUrl: `https://migraineguardian.app/share/rep_${Date.now()}_ev`,
      expiresIn: '7 days',
    };
  },
};
