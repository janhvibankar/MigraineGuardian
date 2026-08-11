/**
 * Centralized Mock Insights Dataset for MigraineGuardian
 *
 * NOTE: Simulated mock dataset for research prototyping. Phrased strictly with non-causal terminology.
 */

export const MOCK_WEEKLY_INSIGHTS = {
  periodLabel: 'Aug 3 – Aug 9, 2024 (Past 7 Days)',
  summary: {
    migraineDays: 2,
    avgRisk: '54%',
    avgSleep: '6.4 h',
    avgStress: '6.2 / 10',
    avgScreenTime: '7.1 h',
    avgHydration: '2.2 L',
  },
  noticedPatterns: [
    {
      id: 'pattern_sleep',
      category: 'SLEEP PATTERN',
      title: 'Shorter sleep preceding occurrences',
      quote: 'Your migraine days were more frequently preceded by shorter sleep than your recent baseline.',
      detail: 'Nights before logged episodes averaged 5.4 hours compared to your 7.6-hour baseline rest duration.',
      stat: '5.4h vs 7.6h baseline',
      badge: 'High Association',
      badgeVariant: 'alert',
      accentColor: 'border-alert-muted/40',
    },
    {
      id: 'pattern_stress',
      category: 'STRESS PATTERN',
      title: 'Elevated mental strain prior to onset',
      quote: 'Your stress levels were higher on several days before migraine occurrences.',
      detail: 'Stress ratings averaged 8.2 / 10 on the 24-hour windows leading up to Wednesday and Saturday.',
      stat: '8.2/10 preceding episodes',
      badge: 'Contributing Pattern',
      badgeVariant: 'alert',
      accentColor: 'border-alert-muted/40',
    },
    {
      id: 'pattern_screen',
      category: 'SCREEN TIME',
      title: 'Above-average display exposure',
      quote: 'Your screen time was above your recent average on two migraine-associated days.',
      detail: 'Continuous screen sessions reached 8.2 hours without a dedicated 20-minute visual rest interval.',
      stat: '+1.1h above normal',
      badge: 'Sensory Pattern',
      badgeVariant: 'teal',
      accentColor: 'border-brand-teal/40',
    },
    {
      id: 'pattern_hydration',
      category: 'IMPROVEMENT',
      title: 'Hydration consistency progress',
      quote: 'Your hydration improved compared with the previous week.',
      detail: 'You reached an average of 2.2L daily, building a beneficial buffer against afternoon sensory fatigue.',
      stat: '+0.6 L/day increase',
      badge: 'Protective Habit',
      badgeVariant: 'sage',
      accentColor: 'border-brand-sage/50',
    },
  ],
  nextWeekFocus: {
    primaryQuote: 'Try maintaining a more consistent sleep schedule and continue monitoring stress.',
    actionableSteps: [
      {
        step: 1,
        title: 'Sleep Consistency',
        description: 'Keep bedtime within a 30-minute window, even on weekends, to stabilize your circadian threshold.',
      },
      {
        step: 2,
        title: 'Stress Tracking',
        description: 'Continue logging daily mental strain to understand which tasks contribute to evening tension.',
      },
      {
        step: 3,
        title: 'Maintain Hydration',
        description: 'Keep up this week\'s 2.2L fluid intake before 3:00 PM to preserve your physiological buffer.',
      },
    ],
  },
  disclaimer: 'These insights describe patterns in your tracked data and do not establish medical causation.',
};
