import { apiClient } from './apiClient.js';
import { storageService } from './storageService.js';
import { calculatePssScore } from '../utils/pssCalculator.js';

export const pssService = {
  /**
   * Retrieves PSS-10 question definitions.
   */
  getPssQuestions: async () => {
    const res = await apiClient.get('/pss/questions');
    if (res.ok && res.raw && Array.isArray(res.raw.questions)) {
      return res.raw.questions;
    }

    return [
      { id: 1, text: 'In the last month, how often have you been upset because of something that happened unexpectedly?' },
      { id: 2, text: 'In the last month, how often have you felt that you were unable to control the important things in your life?' },
      { id: 3, text: 'In the last month, how often have you felt nervous and stressed?' },
      { id: 4, text: 'In the last month, how often have you felt confident about your ability to handle your personal problems?', isReverse: true },
      { id: 5, text: 'In the last month, how often have you felt that things were going your way?', isReverse: true },
      { id: 6, text: 'In the last month, how often have you found that you could not cope with all the things that you had to do?' },
      { id: 7, text: 'In the last month, how often have you been able to control irritations in your life?', isReverse: true },
      { id: 8, text: 'In the last month, how often have you felt that you were on top of things?', isReverse: true },
      { id: 9, text: 'In the last month, how often have you been angered because of things that were outside of your control?' },
      { id: 10, text: 'In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?' },
    ];
  },

  /**
   * Submits completed 10-item answers to Express API Gateway (`POST /api/pss/submit`).
   */
  submitAssessment: async (answers) => {
    const calculatedScore = calculatePssScore(answers);
    const completedAt = new Date().toISOString();

    const localRecord = {
      score: calculatedScore,
      completedAt,
      answers,
    };

    storageService.setItem('pss_score_latest', localRecord);

    const res = await apiClient.post('/pss/submit', { answers });

    if (!res.ok) {
      console.warn('[pssService] Backend error submitting PSS assessment:', res.error);
      return {
        success: false,
        score: calculatedScore,
        error: res.error,
      };
    }

    const json = res.raw || {};
    return {
      success: true,
      assessmentId: json.assessmentId,
      score: json.score !== undefined ? json.score : calculatedScore,
      category: json.category || 'Standard Assessment',
      interpretation: json.interpretation || '',
      completedAt: json.completedAt || completedAt,
    };
  },

  /**
   * Retrieves user's latest PSS assessment record.
   */
  getLatestAssessment: async () => {
    const res = await apiClient.get('/pss/latest');
    if (res.ok && res.data) {
      storageService.setItem('pss_score_latest', res.data);
      return res.data;
    }

    return storageService.getItem('pss_score_latest', null);
  },
};
