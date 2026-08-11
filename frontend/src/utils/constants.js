export const APP_NAME = "MigraineGuardian";
export const APP_TAGLINE = "Calm, Predictive Migraine Wellness";

export const ROUTES = {
  HOME: '/',
  HOW_IT_WORKS: '/how-it-works',
  LOGIN: '/login',
  SIGNUP: '/signup',
  ONBOARDING: '/onboarding',
  PSS_ASSESSMENT: '/pss-assessment',
  DASHBOARD: '/dashboard',
  DAILY_CHECKIN: '/daily-checkin',
  RISK_ANALYSIS: '/risk-analysis',
  INSIGHTS: '/insights',
  ANALYTICS: '/analytics',
  REPORTS: '/reports',
  CHAT: '/chat',
  PROFILE: '/profile',
  SETTINGS: '/settings',
};

export const RISK_LEVELS = {
  LOW: {
    label: 'Low Likelihood',
    description: 'Environmental & physical patterns suggest a stable, calm window.',
    color: 'brand-sage',
    bgColor: 'bg-brand-sage/15',
    textColor: 'text-brand-dark',
    borderColor: 'border-brand-sage/40',
  },
  MODERATE: {
    label: 'Moderate Sensitivity',
    description: 'Subtle stress and sleep variance detected. Hydration and rest advised.',
    color: 'brand-teal',
    bgColor: 'bg-brand-teal/15',
    textColor: 'text-brand-dark',
    borderColor: 'border-brand-teal/40',
  },
  ELEVATED: {
    label: 'Elevated Watch',
    description: 'Multiple trigger co-occurrences. Consider dimming lights and preventive routine.',
    color: 'alert-muted',
    bgColor: 'bg-alert-muted/15',
    textColor: 'text-brand-dark',
    borderColor: 'border-alert-muted/40',
  },
};
