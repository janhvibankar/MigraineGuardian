/**
 * Centralized Mock Clinical Reports Dataset for MigraineGuardian
 *
 * NOTE: Simulated mock dataset for clinical consultation export. Not a medical diagnosis.
 */

import { MOCK_ANALYTICS_DATA } from './mockAnalytics';
import { MOCK_USER } from './mockUser';

export const MOCK_REPORTS_DATA = {
  weekly: {
    type: 'weekly',
    title: 'Personal Health & Pattern Report (Weekly)',
    periodLabel: 'Aug 3 – Aug 9, 2024',
    patient: {
      name: MOCK_USER.name,
      id: MOCK_USER.id,
      completionRate: '100% Tracking Completion',
    },
    overview: {
      migraineDays: '2 days',
      migraineDaysSubtext: 'Wednesday & Saturday',
      avgRisk: '54%',
      avgRiskSubtext: 'Mean period probability',
      avgSeverity: '7.0 / 10',
      avgSeveritySubtext: 'Moderate to severe intensity',
    },
    lifestyle: {
      sleep: '6.4 h',
      stress: '6.2 / 10',
      screenTime: '7.1 h',
      hydration: '2.2 L',
    },
    patterns: [
      { factor: 'Stress', contribution: 34, description: 'High daily stress levels' },
      { factor: 'Sleep', contribution: 28, description: 'Rest deficit under 6 hours' },
      { factor: 'Screen time', contribution: 22, description: 'Continuous exposure >7.5h' },
      { factor: 'Hydration', contribution: 16, description: 'Fluid intake under 1.8L' },
    ],
    insightsSummary:
      'During this tracking period, migraine episodes occurred on days preceded by short sleep duration (<6 hours) combined with elevated self-reported daily stress. Hydration improved significantly (+0.6L/day) compared to the prior baseline, providing a beneficial physiological buffer.',
    whatChanged: [
      { label: 'Migraine Frequency', value: '2 episodes vs 3 prior', change: '-33% Decrease', variant: 'sage' },
      { label: 'Hydration Volume', value: '2.2 L vs 1.6 L prior', change: '+38% Improved', variant: 'sage' },
      { label: 'Average Sleep Duration', value: '6.4 hrs vs 6.8 hrs prior', change: '-0.4h Deficit', variant: 'alert' },
      { label: 'Daily Stress Index', value: '6.2 / 10 vs 5.4 prior', change: '+0.8 Elevated', variant: 'alert' },
    ],
    doctorQuestions: [
      'Given that episodes clustered following nights with less than 6 hours of rest, what circadian sleep routines or supplements might support a higher threshold?',
      'Should we adjust the timing of acute rescue medication (Rizatriptan 10mg) to earlier prodrome stages, such as at initial neck tension onset?',
      'Are there additional non-pharmacological preventive protocols to pair with my afternoon hydration routine during anticipated weather fronts?',
    ],
  },

  monthly: {
    type: 'monthly',
    title: 'Personal Health & Pattern Report (Monthly)',
    periodLabel: 'July 10 – Aug 9, 2024',
    patient: {
      name: MOCK_USER.name,
      id: MOCK_USER.id,
      completionRate: '96% Tracking Completion',
    },
    overview: {
      migraineDays: '5 days',
      migraineDaysSubtext: 'Recorded in 30-day window',
      avgRisk: '42%',
      avgRiskSubtext: '30-day mean probability',
      avgSeverity: '6.8 / 10',
      avgSeveritySubtext: 'Episodic severity baseline',
    },
    lifestyle: {
      sleep: '7.1 h',
      stress: '5.1 / 10',
      screenTime: '6.6 h',
      hydration: '2.3 L',
    },
    patterns: [
      { factor: 'Stress', contribution: 36, description: 'High daily stress levels' },
      { factor: 'Sleep', contribution: 30, description: 'Rest deficit under 6 hours' },
      { factor: 'Screen time', contribution: 20, description: 'Continuous exposure >7.5h' },
      { factor: 'Hydration', contribution: 14, description: 'Fluid intake under 1.8L' },
    ],
    insightsSummary:
      'Over the 30-day evaluation, 5 discrete migraine episodes were documented. A consistent co-factor across 80% of episodes was acute sleep disruption (<6h) coupled with elevated mental strain. Overall monthly baseline remains stable with steady hydration improvements.',
    whatChanged: [
      { label: 'Monthly Headache Days', value: '5 days vs 7 previous month', change: '-28% Reduction', variant: 'sage' },
      { label: 'Hydration Consistency', value: '2.3 L vs 1.8 L previous month', change: '+27% Improved', variant: 'sage' },
      { label: 'Average Rest Duration', value: '7.1 hrs vs 7.3 hrs previous', change: '-0.2h Variance', variant: 'teal' },
      { label: 'Rescue Medication Efficacy', value: '45 min average relief time', change: 'Stable', variant: 'sage' },
    ],
    doctorQuestions: [
      'How does my 5-day monthly frequency align with current preventive criteria vs continuing acute episodic treatment?',
      'Are there recommended circadian adjustments for travel or high-stress work transitions to safeguard against sleep debt spikes?',
      'Should we schedule a follow-up PSS stress index assessment alongside our next quarterly appointment?',
    ],
  },
};
