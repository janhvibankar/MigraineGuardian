/**
 * PSS-10 Perceived Stress Scale Calculation Utility
 * 
 * Validated PSS-10 rules:
 * - 10 questions with values 0 (Never) to 4 (Very Often).
 * - Questions 4, 5, 7, and 8 are reverse-scored: (4 - answer).
 * - Questions 1, 2, 3, 6, 9, and 10 are direct-scored.
 * - Total Score Range: 0 to 40.
 */

export const PSS_REVERSE_SCORED_QUESTIONS = [4, 5, 7, 8];

export const PSS_RESPONSE_OPTIONS = [
  { value: 0, label: 'Never' },
  { value: 1, label: 'Almost Never' },
  { value: 2, label: 'Sometimes' },
  { value: 3, label: 'Fairly Often' },
  { value: 4, label: 'Very Often' },
];

/**
 * Calculates the total PSS-10 score from answers.
 * @param {Record<number, number> | number[]} answers Map of question numbers (1-10) to selected value (0-4)
 * @returns {number} Total calculated PSS score (0-40)
 */
export function calculatePssScore(answers) {
  let total = 0;

  for (let qNum = 1; qNum <= 10; qNum++) {
    const rawVal = Array.isArray(answers) ? answers[qNum - 1] : answers[qNum];
    if (typeof rawVal === 'number' && !isNaN(rawVal)) {
      if (PSS_REVERSE_SCORED_QUESTIONS.includes(qNum)) {
        total += (4 - rawVal);
      } else {
        total += rawVal;
      }
    }
  }

  return Math.max(0, Math.min(40, total));
}
