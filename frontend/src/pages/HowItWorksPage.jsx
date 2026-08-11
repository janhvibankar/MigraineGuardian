import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ROUTES } from '../utils/constants';
import {
  Sparkles,
  ClipboardList,
  Compass,
  ArrowRight,
  ShieldCheck,
  Activity,
  HeartHandshake,
} from 'lucide-react';

export function HowItWorksPage() {
  const steps = [
    {
      step: '01',
      title: 'Establish Your Personal Baseline',
      desc: 'Complete an initial 3-minute onboarding and clinical PSS (Perceived Stress Scale) evaluation to map your historical trigger thresholds.',
      badge: 'Baseline Setup',
      icon: ClipboardList,
    },
    {
      step: '02',
      title: 'Daily Micro-Checkins',
      desc: 'Each morning or evening, spend 60 seconds logging rest, water intake, screen intensity, and any subtle prodrome sensations.',
      badge: '60 Seconds',
      icon: Activity,
    },
    {
      step: '03',
      title: 'Continuous Weather & Barometric Tracking',
      desc: 'The platform quietly monitors localized atmospheric pressure variations and light intensity to anticipate environmental friction.',
      badge: 'Passive Context',
      icon: Compass,
    },
    {
      step: '04',
      title: 'Calm Insights & Care Protocols',
      desc: 'Receive non-intrusive, protective recommendations (hydration prompts, lighting dimming, rescue medication reminders) before symptoms intensify.',
      badge: 'Gentle Foresight',
      icon: HeartHandshake,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-12">
      <PageHeader
        title="How MigraineGuardian Works"
        subtitle="A respectful, evidence-grounded approach to understanding subtle physiological patterns and regaining peace of mind."
        badge="System Methodology"
        actions={
          <Link to={ROUTES.ONBOARDING}>
            <Button variant="primary" size="md" iconRight={ArrowRight}>
              Start Onboarding
            </Button>
          </Link>
        }
      />

      {/* Steps List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {steps.map((item, idx) => {
          const Icon = item.icon;
          return (
            <Card key={idx} className="p-6 md:p-8 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-app-xl font-bold text-brand-sage-dark tracking-wider">
                  {item.step}
                </span>
                <Badge variant="teal" size="sm">
                  {item.badge}
                </Badge>
              </div>

              <div className="flex items-start gap-4 pt-2">
                <div className="w-10 h-10 rounded-lg bg-brand-sage/20 border border-brand-sage/40 flex items-center justify-center text-brand-dark flex-shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <CardTitle as="h3">{item.title}</CardTitle>
                  <CardDescription>{item.desc}</CardDescription>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Trust & Clinical Foundation Banner */}
      <Card variant="white" className="p-8 border-muted-border space-y-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-brand-teal" />
          <h3 className="text-section-lg font-medium text-brand-dark">
            Our Clinical & Human Promise
          </h3>
        </div>
        <p className="text-body-md text-muted-text leading-relaxed max-w-3xl">
          We never design for alarmist notifications or high-stress alert rings. Migraine management is about calming the autonomic nervous system. Every color, font, and interaction in MigraineGuardian is chosen to avoid sensory stimulation and cognitive strain.
        </p>
        <div className="pt-2 flex items-center gap-4">
          <Link to={ROUTES.PSS_ASSESSMENT}>
            <Button variant="secondary" size="md">
              Take the PSS Stress Assessment
            </Button>
          </Link>
          <Link to={ROUTES.DASHBOARD}>
            <Button variant="ghost" size="md">
              Preview Dashboard →
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
