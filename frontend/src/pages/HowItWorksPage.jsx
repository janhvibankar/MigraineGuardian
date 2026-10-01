import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ROUTES } from '../utils/constants';
import { useTranslation } from '../hooks/useTranslation';
import {
  ClipboardList,
  Compass,
  ArrowRight,
  ShieldCheck,
  Activity,
  HeartHandshake,
} from 'lucide-react';

export function HowItWorksPage() {
  const { t } = useTranslation();

  const steps = [
    {
      step: '01',
      title: t('howItWorks.step1Title'),
      desc: t('howItWorks.step1Desc'),
      badge: t('howItWorks.step1Badge'),
      icon: ClipboardList,
    },
    {
      step: '02',
      title: t('howItWorks.step2Title'),
      desc: t('howItWorks.step2Desc'),
      badge: t('howItWorks.step2Badge'),
      icon: Activity,
    },
    {
      step: '03',
      title: t('howItWorks.step3Title'),
      desc: t('howItWorks.step3Desc'),
      badge: t('howItWorks.step3Badge'),
      icon: Compass,
    },
    {
      step: '04',
      title: t('howItWorks.step4Title'),
      desc: t('howItWorks.step4Desc'),
      badge: t('howItWorks.step4Badge'),
      icon: HeartHandshake,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-12 text-left">
      <PageHeader
        title={t('howItWorks.title')}
        subtitle={t('howItWorks.subtitle')}
        badge={t('howItWorks.badge')}
        actions={
          <Link to={ROUTES.ONBOARDING}>
            <Button variant="primary" size="md" iconRight={ArrowRight}>
              {t('common.startOnboarding')}
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
            {t('auth.secureBadge')}
          </h3>
        </div>
        <p className="text-body-md text-muted-text leading-relaxed max-w-3xl">
          {t('auth.privacyNote')}
        </p>
        <div className="pt-2 flex flex-wrap items-center gap-4">
          <Link to={ROUTES.ONBOARDING}>
            <Button variant="primary" size="md" iconRight={ArrowRight}>
              {t('nav.beginJourney')}
            </Button>
          </Link>
          <Link to={ROUTES.LOGIN}>
            <Button variant="secondary" size="md">
              {t('nav.signIn')}
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default HowItWorksPage;
