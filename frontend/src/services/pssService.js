/**
 * PSS Service (Phase 3 - Firebase & Express Backend Integration)
 *
 * Manages PSS-10 standardized questions retrieval, assessment submission,
 * and latest evaluation scores from Express API Gateway / Cloud Firestore.
 */

import { storageService } from './storageService';
import { calculatePssScore } from '../utils/pssCalculator';

const API_BASE_URL = 'http://localhost:5000/api/pss';

function getAuthHeaders() {
  const token = storageService.getItem('migraineguardian_token', null) || localStorage.getItem('mg_v1_migraineguardian_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const pssService = {
  /**
   * Retrieves PSS-10 question definitions.
   */
  getPssQuestions: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/questions`);
      if (response.ok) {
        const json = await response.json();
        if (json.success && Array.isArray(json.questions)) {
          return json.questions;
        }
      }
    } catch (e) {
      console.warn('[pssService] Network error fetching PSS questions:', e.message);
    }

    // Default static question items
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
    const finalScore = calculatePssScore(answers);
    const completedAt = new Date().toISOString();

    const localRecord = {
      score: finalScore,
      completedAt,
      answers,
    };

    // Cache locally for instantaneous offline support
    storageService.setItem('pss_score_latest', localRecord);

    try {
      const response = await fetch(`${API_BASE_URL}/submit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ answers }),
      });

      const json = await response.json();

      if (!response.ok) {
        console.warn('[pssService] Server validation or auth error:', json);
        return {
          success: false,
          score: finalScore,
          error: json.error || { message: `Server error (${response.status})` },
        };
      }

      return {
        success: true,
        assessmentId: json.assessmentId,
        score: json.score,
        category: json.category,
        interpretation: json.interpretation,
        completedAt: json.completedAt,
      };
    } catch (e) {
      console.warn('[pssService] Network error submitting PSS assessment, saved locally:', e.message);
      return { success: true, score: finalScore, offline: true };
    }
  },

  /**
   * Retrieves user's latest PSS assessment record.
   */
  getLatestAssessment: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/latest`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          storageService.setItem('pss_score_latest', json.data);
          return json.data;
        }
      }
    } catch (e) {
      console.warn('[pssService] Network error fetching latest PSS result:', e.message);
    }

    return storageService.getItem('pss_score_latest', null);
  },
};
