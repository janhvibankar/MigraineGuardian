import { MOCK_USER } from '../data/mockUser';
import { MOCK_OVERVIEW_METRICS } from '../data/mockOverview';

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockApiService = {
  async getUserProfile() {
    await delay(150);
    return { ...MOCK_USER };
  },

  async getOverviewMetrics() {
    await delay(200);
    return { ...MOCK_OVERVIEW_METRICS };
  },

  async submitCheckin(data) {
    await delay(350);
    return {
      success: true,
      timestamp: new Date().toISOString(),
      updatedRiskScore: 16,
      message: 'Check-in gently recorded.',
      data,
    };
  },

  async getPssQuestions() {
    await delay(100);
    return [
      {
        id: 1,
        question: 'In the last month, how often have you been upset because of something that happened unexpectedly?',
        options: ['Never', 'Almost Never', 'Sometimes', 'Fairly Often', 'Very Often'],
      },
      {
        id: 2,
        question: 'In the last month, how often have you felt that you were unable to control the important things in your life?',
        options: ['Never', 'Almost Never', 'Sometimes', 'Fairly Often', 'Very Often'],
      },
      {
        id: 3,
        question: 'In the last month, how often have you felt nervous and stressed?',
        options: ['Never', 'Almost Never', 'Sometimes', 'Fairly Often', 'Very Often'],
      },
      {
        id: 4,
        question: 'In the last month, how often have you felt confident about your ability to handle your personal problems?',
        options: ['Never', 'Almost Never', 'Sometimes', 'Fairly Often', 'Very Often'],
        reversed: true,
      },
    ];
  },
};
