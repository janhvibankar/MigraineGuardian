export const MOCK_USER = {
  id: 'usr_84719',
  name: 'Sakshi',
  email: 'sakshi@serene-health.org',
  avatar: null,
  initials: 'SA',
  joinedDate: 'November 2024',
  diagnosis: 'Migraine with sensory aura (episodic)',
  baselineTriggers: [
    'Barometric drops (>6 hPa)',
    'Sleep disruption (<6.5 hrs)',
    'Bright fluorescent lighting',
    'High sensory overload',
    'Skipped meals / dehydration',
  ],
  currentRiskScore: 18, // 0 - 100 scale (18 is low/stable)
  riskCategory: 'LOW',
  lastCheckinTime: 'Today at 8:15 AM',
  consecutiveTrackingDays: 14,
  pssScore: {
    score: 14,
    category: 'Moderate Perceived Stress',
    lastTaken: '3 days ago',
  },
  emergencyProtocol: {
    prescribedMedication: 'Rizatriptan 10mg orally at onset',
    secondaryAction: 'Cold compress, dark room, 500ml electrolyte water',
    emergencyContact: 'Dr. Sarah Jenkins (Neurology Clinic) - (555) 392-8110',
  },
};
