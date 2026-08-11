export const MOCK_OVERVIEW_METRICS = {
  currentRisk: {
    score: 18,
    status: 'Low Likelihood',
    trend: 'stable',
    summary: 'Weather conditions are calm, and your sleep pattern from last night (7.8 hrs) provides a steady physiological baseline.',
  },
  streaks: {
    daysLogged: 14,
    daysMigraineFree: 19,
    avgSleepHours: 7.6,
    avgWaterIntake: '2.4 L',
  },
  recentFactors: [
    { name: 'Sleep Quality', status: 'Optimal', value: '7h 45m', score: 92, statusType: 'sage' },
    { name: 'Barometric Pressure', status: 'Stable', value: '1014 hPa (0.2 hPa/hr)', score: 88, statusType: 'sage' },
    { name: 'Stress (PSS-10 baseline)', status: 'Mild variance', value: 'Level 2/5', score: 74, statusType: 'teal' },
    { name: 'Screen & Brightness exposure', status: 'Moderate', value: '6.2 hrs', score: 65, statusType: 'teal' },
    { name: 'Hydration', status: 'Adequate', value: '2.2 L', score: 85, statusType: 'sage' },
  ],
  upcomingForecast: [
    { day: 'Today', date: 'Oct 12', risk: 'Low', score: 18, highlight: 'Optimal serenity' },
    { day: 'Tomorrow', date: 'Oct 13', risk: 'Low', score: 22, highlight: 'Mild humidity change' },
    { day: 'Monday', date: 'Oct 14', risk: 'Moderate', score: 48, highlight: 'Incoming low pressure front' },
    { day: 'Tuesday', date: 'Oct 15', risk: 'Low', score: 24, highlight: 'Pressure stabilizes' },
    { day: 'Wednesday', date: 'Oct 16', risk: 'Low', score: 15, highlight: 'Quiet window' },
  ],
  recentInsights: [
    {
      id: 'ins_1',
      title: 'Gentle hydration buffer',
      category: 'Protective Factor',
      date: 'Yesterday',
      content: 'Consistently reaching 2.0L+ before 3:00 PM correlates with a 40% reduction in late afternoon prodrome signals.',
    },
    {
      id: 'ins_2',
      title: 'Barometric front alert on Monday',
      category: 'Proactive Advisory',
      date: '2 days ahead',
      content: 'A subtle pressure drop is modeled for Monday evening. Plan a quiet evening and avoid late screen fatigue.',
    },
  ],
};
