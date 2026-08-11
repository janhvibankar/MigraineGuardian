/**
 * Centralized Mock Data for MigraineGuardian Dashboard
 */

export const MOCK_DASHBOARD_DATA = {
  userName: 'Elena',
  subtext: "Here's your migraine wellness overview.",

  // Main Risk Card
  todayRisk: {
    title: "Today's Risk Estimate",
    score: 72,
    level: 'High',
    subtext: 'Estimated from your recent patterns',
    elevatedReasonHeading: 'Why your estimate is elevated',
    elevatedFactors: [
      {
        factor: 'Sleep',
        value: '5.8 h',
        comparison: 'Below your recent average',
        description: 'Shorter sleep duration is contributing to your current risk estimate.',
      },
      {
        factor: 'Stress',
        value: '8 / 10',
        comparison: 'Higher than your recent average',
        description: 'Stress is contributing to your current risk estimate.',
      },
      {
        factor: 'Screen time',
        value: '8.2 h',
        comparison: 'Above your recent average',
        description: 'Elevated screen exposure is contributing to your current risk estimate.',
      },
    ],
  },

  // Today's Four Factors
  todayFactors: [
    {
      id: 'sleep',
      label: 'Sleep',
      value: '5.8 h',
      comparison: 'Below average (7.6h baseline)',
      type: 'alert',
      status: 'Shorter rest',
    },
    {
      id: 'stress',
      label: 'Stress',
      value: '8 / 10',
      comparison: 'Higher than average (4/10 baseline)',
      type: 'alert',
      status: 'Elevated load',
    },
    {
      id: 'screen_time',
      label: 'Screen time',
      value: '8.2 h',
      comparison: 'Above average (6.0h baseline)',
      type: 'alert',
      status: 'High exposure',
    },
    {
      id: 'hydration',
      label: 'Hydration',
      value: '1.5 L',
      comparison: 'Below target (2.2L target)',
      type: 'teal',
      status: 'Buffer needed',
    },
  ],

  // Weekly Snapshot
  weeklySnapshot: {
    migraineDays: {
      value: '2',
      label: 'Migraine days',
      subtext: 'This past week',
    },
    avgSleep: {
      value: '6.4 h',
      label: 'Average sleep',
      subtext: '7-day rolling average',
    },
    avgStress: {
      value: '6.2 / 10',
      label: 'Average stress',
      subtext: 'PSS daily tracking',
    },
    avgScreenTime: {
      value: '7.1 h',
      label: 'Average screen time',
      subtext: 'Optical exposure',
    },
  },

  // Recent 7-Day Risk Trend for Recharts
  riskTrend: [
    { day: 'Mon', risk: 24, sleep: 7.5, stress: 3, label: 'Mon: 24% (Stable)' },
    { day: 'Tue', risk: 30, sleep: 7.2, stress: 4, label: 'Tue: 30% (Low)' },
    { day: 'Wed', risk: 68, sleep: 5.5, stress: 8, isMigraineDay: true, label: 'Wed: 68% (Migraine Day)' },
    { day: 'Thu', risk: 42, sleep: 6.8, stress: 5, label: 'Thu: 42% (Moderate)' },
    { day: 'Fri', risk: 35, sleep: 7.0, stress: 4, label: 'Fri: 35% (Calm)' },
    { day: 'Sat', risk: 75, sleep: 5.2, stress: 9, isMigraineDay: true, label: 'Sat: 75% (Migraine Day)' },
    { day: 'Today', risk: 72, sleep: 5.8, stress: 8, label: 'Today: 72% (High Estimate)' },
  ],

  // Personal Contributing Patterns
  personalPatterns: [
    {
      id: 'stress',
      factor: 'Stress',
      insight: 'Stress is contributing significantly to your sensitivity threshold when exceeding 7/10.',
      metric: '3.2x correlation',
      badge: 'High Impact',
      badgeVariant: 'alert',
    },
    {
      id: 'sleep',
      factor: 'Sleep',
      insight: 'Nights with under 6.0 hours of rest frequently precede elevated risk windows within 24 hours.',
      metric: '68% recurrence',
      badge: 'Moderate Impact',
      badgeVariant: 'teal',
    },
    {
      id: 'screen_time',
      factor: 'Screen time',
      insight: 'Screen sessions extending past 7.5 continuous hours without a rest break increase evening sensory strain.',
      metric: '+18% sensitivity',
      badge: 'Sensory Trigger',
      badgeVariant: 'sage',
    },
  ],

  // Weekly Insight
  weeklyInsight: {
    quote:
      'Your migraine days this week were more frequently preceded by shorter sleep and higher stress than your recent baseline.',
    label: 'Insight based on tracked patterns',
    observation:
      'Compound trigger co-occurrence detected on Wednesday and Saturday. Prioritizing 8 hours of restorative sleep tonight will help reset autonomic balance.',
  },
};
