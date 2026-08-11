/**
 * Prediction Service (Mock Frontend Architecture)
 *
 * Provides risk likelihood estimates, elevated factor breakdowns, and recent trend trajectories.
 */

import { MOCK_TODAY_PREDICTION } from '../data/mockPredictions';
import { MOCK_ANALYTICS_DATA } from '../data/mockAnalytics';

export const predictionService = {
  getTodayPrediction: () => {
    return MOCK_TODAY_PREDICTION;
  },

  getRiskTrend: (timeframe = '7days') => {
    const dataset = MOCK_ANALYTICS_DATA[timeframe] || MOCK_ANALYTICS_DATA['7days'];
    return dataset.riskTrend;
  },

  getElevatedFactors: () => {
    return MOCK_TODAY_PREDICTION.elevatedFactors;
  },

  getFocusAreas: () => {
    return MOCK_TODAY_PREDICTION.focusAreas;
  },
};
