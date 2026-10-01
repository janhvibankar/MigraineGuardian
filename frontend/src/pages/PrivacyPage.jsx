import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ROUTES } from '../utils/constants';
import { useTranslation } from '../hooks/useTranslation';
import {
  ShieldCheck,
  Lock,
  Eye,
  Database,
  UserX,
  Trash2,
  Heart,
  ArrowRight,
  Info,
} from 'lucide-react';

export function PrivacyPage() {
  const { t } = useTranslation();

  const sections = [
    {
      icon: Database,
      title: t('privacy.sec1Title'),
      content: (
        <div className="space-y-3 text-body-md text-[#555B55] leading-relaxed">
          <p>
            {t('privacy.sec1P1')}
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-meta-md">
            <li>{t('privacy.sec1Li1')}</li>
            <li>{t('privacy.sec1Li2')}</li>
            <li>{t('privacy.sec1Li3')}</li>
            <li>{t('privacy.sec1Li4')}</li>
          </ul>
        </div>
      ),
    },
    {
      icon: Lock,
      title: t('privacy.sec2Title'),
      content: (
        <div className="space-y-3 text-body-md text-[#555B55] leading-relaxed">
          <p>
            {t('privacy.sec2P1')}
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-meta-md">
            <li>{t('privacy.sec2Li1')}</li>
            <li>{t('privacy.sec2Li2')}</li>
            <li>{t('privacy.sec2Li3')}</li>
          </ul>
        </div>
      ),
    },
    {
      icon: UserX,
      title: t('privacy.sec3Title'),
      content: (
        <div className="space-y-3 text-body-md text-[#555B55] leading-relaxed">
          <p>
            {t('privacy.sec3P1')}
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-meta-md">
            <li>{t('privacy.sec3Li1')}</li>
            <li>{t('privacy.sec3Li2')}</li>
            <li>{t('privacy.sec3Li3')}</li>
          </ul>
        </div>
      ),
    },
    {
      icon: Trash2,
      title: t('privacy.sec4Title'),
      content: (
        <div className="space-y-3 text-body-md text-[#555B55] leading-relaxed">
          <p>
            {t('privacy.sec4P1')}
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-meta-md">
            <li>{t('privacy.sec4Li1')}</li>
            <li>{t('privacy.sec4Li2')}</li>
            <li>{t('privacy.sec4Li3')}</li>
          </ul>
        </div>
      ),
    },
    {
      icon: Info,
      title: t('privacy.sec5Title'),
      content: (
        <div className="space-y-3 text-body-md text-[#555B55] leading-relaxed">
          <p>
            {t('privacy.sec5P1')}
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-10 animate-in fade-in duration-200 text-left">
      <PageHeader
        title={t('privacy.title', 'Privacy Policy & Data Protection')}
        subtitle={t('privacy.subtitle', 'How MigraineGuardian safeguards your personal wellness data, maintains strict user isolation, and respects your privacy.')}
        badge={t('privacy.badge', 'Confidential & Protected')}
        actions={
          <Link to={ROUTES.HOME}>
            <Button variant="secondary" size="md">
              {t('auth.backToOverview', 'Back to Overview')}
            </Button>
          </Link>
        }
      />

      {/* Reassurance Banner */}
      <div className="p-6 rounded-[22px] bg-gradient-to-r from-[#FAF9F5] via-white to-[#FAF9F5] border-2 border-brand-sage/55 flex items-start gap-4 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-brand-teal/20 border border-brand-teal/40 flex items-center justify-center text-brand-dark flex-shrink-0 mt-0.5">
          <ShieldCheck className="w-5 h-5 text-brand-teal" />
        </div>
        <div className="space-y-1">
          <h2 className="text-section-md font-bold text-brand-dark">
            {t('auth.confidentialPromiseTitle', 'Our Core Privacy Commitment')}
          </h2>
          <p className="text-meta-md text-[#555B55] leading-relaxed">
            {t('auth.confidentialPromiseDesc', 'Your migraine patterns, stress ratings, and daily check-ins belong exclusively to you. We enforce verified Firebase UID ownership on every request and never monetize your health records.')}
          </p>
        </div>
      </div>

      {/* Policy Sections */}
      <div className="space-y-6">
        {sections.map((sec, idx) => {
          const Icon = sec.icon;
          return (
            <Card key={idx} variant="warm" className="p-7 sm:p-8 space-y-4 border-2 border-brand-sage/50 rounded-[22px] shadow-sm">
              <div className="flex items-center gap-3 pb-3 border-b border-brand-sage/30">
                <div className="w-8 h-8 rounded-lg bg-brand-sage/25 border border-brand-sage/45 flex items-center justify-center text-brand-dark flex-shrink-0">
                  <Icon className="w-4 h-4 text-brand-teal" />
                </div>
                <h3 className="text-section-md font-bold text-brand-dark">
                  {sec.title}
                </h3>
              </div>
              {sec.content}
            </Card>
          );
        })}
      </div>

      {/* Bottom Navigation CTA */}
      <div className="pt-4 border-t border-muted-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-meta-sm text-muted-text">
          {t('common.appName')} • {t('auth.confidentialPromiseTitle')}
        </span>
        <div className="flex items-center gap-3">
          <Link to={ROUTES.TERMS}>
            <Button variant="ghost" size="sm">
              {t('footer.terms', 'Terms of Service')}
            </Button>
          </Link>
          <Link to={ROUTES.ONBOARDING}>
            <Button variant="primary" size="sm" iconRight={ArrowRight}>
              {t('nav.beginJourney', 'Begin Journey')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPage;
