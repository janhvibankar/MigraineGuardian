/**
 * Analytics Service (Mock Frontend Architecture)
 *
 * Provides longitudinal datasets, factor distributions, frequency metrics, and calendar-matrix views.
 */

import { MOCK_ANALYTICS_DATA, MOCK_CALENDAR_DAYS } from '../data/mockAnalytics';

export const analyticsService = {
  getAnalyticsData: (timeframe = '7days') => {
    return MOCK_ANALYTICS_DATA[timeframe] || MOCK_ANALYTICS_DATA['7days'];
  },

  getCalendarDays: () => {
    return MOCK_CALENDAR_DAYS;
  },

  getSummaryMetrics: (timeframe = '7days') => {
    const data = analyticsService.getAnalyticsData(timeframe);
    return data.summary;
  },

  getPatternContributions: (timeframe = '7days') => {
    const data = analyticsService.getAnalyticsData(timeframe);
    return data.patternAnalysis;
  },
};
