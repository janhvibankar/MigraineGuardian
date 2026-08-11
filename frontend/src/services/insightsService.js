/**
 * Insights Service (Mock Frontend Architecture)
 *
 * Provides weekly discovered pattern summaries, correlation analyses, and supportive next-week focus guidance.
 */

import { MOCK_WEEKLY_INSIGHTS } from '../data/mockInsights';

export const insightsService = {
  getWeeklyInsights: () => {
    return MOCK_WEEKLY_INSIGHTS;
  },

  getNoticedPatterns: () => {
    return MOCK_WEEKLY_INSIGHTS.noticedPatterns;
  },

  getNextWeekFocus: () => {
    return MOCK_WEEKLY_INSIGHTS.nextWeekFocus;
  },
};
