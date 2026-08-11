/**
 * Centralized Mock Predictions Dataset for MigraineGuardian
 *
 * NOTE: Simulated mock statistical data for awareness modeling. Not real medical diagnoses.
 */

export const MOCK_TODAY_PREDICTION = {
  score: 72,
  level: 'High',
  title: "Today's Risk Estimate",
  subtext: 'Estimated probability based on your recent tracked patterns.',
  headline: 'Elevated Sensitivity Window',
  summary: 'Your recent risk estimate is higher alongside reduced sleep and increased stress compared with your personal baseline.',
  elevatedReasonHeading: 'Why your estimate is elevated',
  elevatedFactors: [
    {
      factor: 'Sleep',
      value: '5.8 h',
      comparison: '1.2 h below personal average (7.6h baseline)',
      description: 'Shorter sleep duration reduces neural recovery, lowering your threshold to environmental triggers.',
      statusType: 'alert',
    },
    {
      factor: 'Stress',
      value: '8 / 10',
      comparison: 'Higher than recent average (4/10 baseline)',
      description: 'Stress is contributing to your current risk estimate by increasing sympathetic nervous system tone.',
      statusType: 'alert',
    },
    {
      factor: 'Screen time',
      value: '8.2 h',
      comparison: 'Above recent average (6.0h baseline)',
      description: 'Elevated screen exposure is contributing to your current risk estimate through continuous optical glare.',
      statusType: 'alert',
    },
    {
      factor: 'Recent migraine pattern',
      value: '2 migraine days',
      comparison: 'in the past week (Wed & Sat)',
      description: 'Recent episodes can leave the trigeminal vascular system in a temporarily sensitized state.',
      statusType: 'alert',
    },
  ],
  focusAreas: [
    {
      title: 'Sleep consistency',
      description: 'Aim for a consistent bedtime tonight. Dim overhead lights 1 hour before sleep to encourage natural melatonin release.',
    },
    {
      title: 'Stress management',
      description: 'Integrate two 5-minute breathing pauses into your afternoon. Gentle shoulder rolls help release accumulated tension.',
    },
    {
      title: 'Regular hydration',
      description: 'Keep a water bottle within reach and sip steadily to reach 2.2L before 4:00 PM to maintain a physiological buffer.',
    },
    {
      title: 'Screen breaks',
      description: 'Apply the 20-20-20 rule and reduce monitor brightness to relieve ocular strain.',
    },
  ],
  disclaimer: 'This risk estimate is for wellness and awareness. It does not diagnose migraine or replace medical advice.',
};
