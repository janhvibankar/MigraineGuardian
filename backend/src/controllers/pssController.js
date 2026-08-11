import { firestoreService } from '../services/firestoreService.js';

const PSS_REVERSE_SCORED_QUESTIONS = [4, 5, 7, 8];

const PSS_QUESTIONS = [
  { id: 1, text: 'In the last month, how often have you been upset because of something that happened unexpectedly?', isReverse: false },
  { id: 2, text: 'In the last month, how often have you felt that you were unable to control the important things in your life?', isReverse: false },
  { id: 3, text: 'In the last month, how often have you felt nervous and stressed?', isReverse: false },
  { id: 4, text: 'In the last month, how often have you felt confident about your ability to handle your personal problems?', isReverse: true },
  { id: 5, text: 'In the last month, how often have you felt that things were going your way?', isReverse: true },
  { id: 6, text: 'In the last month, how often have you found that you could not cope with all the things that you had to do?', isReverse: false },
  { id: 7, text: 'In the last month, how often have you been able to control irritations in your life?', isReverse: true },
  { id: 8, text: 'In the last month, how often have you felt that you were on top of things?', isReverse: true },
  { id: 9, text: 'In the last month, how often have you been angered because of things that were outside of your control?', isReverse: false },
  { id: 10, text: 'In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?', isReverse: false },
];

const PSS_RESPONSE_OPTIONS = [
  { value: 0, label: 'Never' },
  { value: 1, label: 'Almost Never' },
  { value: 2, label: 'Sometimes' },
  { value: 3, label: 'Fairly Often' },
  { value: 4, label: 'Very Often' },
];

export function getScoreInterpretation(score) {
  if (score <= 13) {
    return {
      category: 'Low Perceived Stress',
      color: 'teal',
      interpretation: 'Your autonomic stress load is in a calm, balanced range.',
    };
  }
  if (score <= 26) {
    return {
      category: 'Moderate Stress Load',
      color: 'sage',
      interpretation: 'Mild-to-moderate autonomic strain detected. Consider scheduling regular sensory pauses.',
    };
  }
  return {
    category: 'Elevated Perceived Stress',
    color: 'alert',
    interpretation: 'Significant physiological strain. Stress management protocols are highly recommended.',
  };
}

export function calculatePssScore(answers) {
  let total = 0;
  for (let qNum = 1; qNum <= 10; qNum++) {
    const rawVal = Array.isArray(answers) ? answers[qNum - 1] : answers[qNum] ?? answers[String(qNum)];
    const val = Number(rawVal);
    if (PSS_REVERSE_SCORED_QUESTIONS.includes(qNum)) {
      total += (4 - val);
    } else {
      total += val;
    }
  }
  return Math.max(0, Math.min(40, total));
}

export async function getPssQuestionsController(req, res, next) {
  try {
    return res.status(200).json({
      success: true,
      questions: PSS_QUESTIONS,
      options: PSS_RESPONSE_OPTIONS,
    });
  } catch (error) {
    next(error);
  }
}

export async function submitPssAssessmentController(req, res, next) {
  try {
    const userId = req.user.uid;
    const { answers } = req.body;

    if (!answers || (typeof answers !== 'object' && !Array.isArray(answers))) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid answers payload. Must provide an object or array of responses for questions 1 through 10.',
        },
      });
    }

    const errors = [];
    const normalizedAnswers = {};

    // Validate that exactly 10 questions (1 to 10) are answered and in range 0-4
    for (let qNum = 1; qNum <= 10; qNum++) {
      const rawVal = Array.isArray(answers) ? answers[qNum - 1] : answers[qNum] ?? answers[String(qNum)];

      if (rawVal === undefined || rawVal === null || rawVal === '') {
        errors.push(`Missing answer for question ${qNum}.`);
        continue;
      }

      const numVal = Number(rawVal);
      if (!Number.isInteger(numVal) || isNaN(numVal)) {
        errors.push(`Question ${qNum} value must be a valid integer.`);
      } else if (numVal < 0 || numVal > 4) {
        errors.push(`Question ${qNum} value (${numVal}) is out of valid range 0–4.`);
      } else {
        normalizedAnswers[qNum] = numVal;
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'PSS-10 assessment validation failed.',
          details: errors,
        },
      });
    }

    // Calculate score using validated PSS-10 rules
    const score = calculatePssScore(normalizedAnswers);
    const { category, interpretation } = getScoreInterpretation(score);
    const completedAt = new Date().toISOString();

    const record = await firestoreService.savePssAssessment(userId, {
      score,
      category,
      interpretation,
      answers: normalizedAnswers,
      completedAt,
    });

    return res.status(200).json({
      success: true,
      assessmentId: record.assessmentId,
      score,
      category,
      interpretation,
      completedAt,
      answers: normalizedAnswers,
    });
  } catch (error) {
    next(error);
  }
}

export async function getLatestPssAssessmentController(req, res, next) {
  try {
    const userId = req.user.uid;
    const latest = await firestoreService.getLatestPssAssessment(userId);

    return res.status(200).json({
      success: true,
      data: latest,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPssAssessmentHistoryController(req, res, next) {
  try {
    const userId = req.user.uid;
    const limit = parseInt(req.query.limit, 10) || 10;
    const history = await firestoreService.getPssAssessmentHistory(userId, limit);

    return res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    next(error);
  }
}
