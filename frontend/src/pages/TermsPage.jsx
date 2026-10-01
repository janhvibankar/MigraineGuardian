import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ROUTES } from '../utils/constants';
import { useTranslation } from '../hooks/useTranslation';
import {
  FileText,
  AlertTriangle,
  HeartHandshake,
  UserCheck,
  Scale,
  ArrowRight,
  Shield,
} from 'lucide-react';

export function TermsPage() {
  const { t } = useTranslation();

  const sections = [
    {
      icon: HeartHandshake,
      title: t('terms.sec1Title'),
      content: (
        <div className="space-y-3 text-body-md text-[#555B55] leading-relaxed">
          <p>
            {t('terms.sec1P1')}
          </p>
          <div className="p-4 rounded-xl bg-alert-muted/10 border border-alert-muted/30 text-brand-dark text-meta-md">
            <strong>{t('common.appName')}:</strong> {t('terms.sec1Disclaimer')}
          </div>
          <p>
            {t('terms.sec1P2')}
          </p>
        </div>
      ),
    },
    {
      icon: UserCheck,
      title: t('terms.sec2Title'),
      content: (
        <div className="space-y-3 text-body-md text-[#555B55] leading-relaxed">
          <p>
            {t('terms.sec2P1')}
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-meta-md">
            <li>{t('terms.sec2Li1')}</li>
            <li>{t('terms.sec2Li2')}</li>
            <li>{t('terms.sec2Li3')}</li>
          </ul>
        </div>
      ),
    },
    {
      icon: Scale,
      title: t('terms.sec3Title'),
      content: (
        <div className="space-y-3 text-body-md text-[#555B55] leading-relaxed">
          <p>
            {t('terms.sec3P1')}
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-meta-md">
            <li>{t('terms.sec3Li1')}</li>
            <li>{t('terms.sec3Li2')}</li>
          </ul>
        </div>
      ),
    },
    {
      icon: Shield,
      title: t('terms.sec4Title'),
      content: (
        <div className="space-y-3 text-body-md text-[#555B55] leading-relaxed">
          <p>
            {t('terms.sec4P1')}
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-10 animate-in fade-in duration-200 text-left">
      <PageHeader
        title={t('terms.title', 'Terms of Service')}
        subtitle={t('terms.subtitle', 'The terms governing your use of MigraineGuardian for daily wellness tracking, pattern insights, and risk forecasting.')}
        badge={t('terms.badge', 'Terms of Use')}
        actions={
          <Link to={ROUTES.HOME}>
            <Button variant="secondary" size="md">
              {t('auth.backToOverview', 'Back to Overview')}
            </Button>
          </Link>
        }
      />

      {/* Overview Banner */}
      <div className="p-6 rounded-[22px] bg-gradient-to-r from-[#FAF9F5] via-white to-[#FAF9F5] border-2 border-brand-sage/55 flex items-start gap-4 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-brand-sage/25 border border-brand-sage/45 flex items-center justify-center text-brand-dark flex-shrink-0 mt-0.5">
          <FileText className="w-5 h-5 text-brand-teal" />
        </div>
        <div className="space-y-1">
          <h2 className="text-section-md font-bold text-brand-dark">
            {t('terms.title', 'Terms of Service')}
          </h2>
          <p className="text-meta-md text-[#555B55] leading-relaxed">
            {t('auth.privacyNote', 'MigraineGuardian is designed for peaceful, privacy-preserving wellness.')}
          </p>
        </div>
      </div>

      {/* Sections */}
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

      {/* Footer Navigation */}
      <div className="pt-4 border-t border-muted-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-meta-sm text-muted-text">
          {t('common.appName')} • {t('terms.title')}
        </span>
        <div className="flex items-center gap-3">
          <Link to={ROUTES.PRIVACY}>
            <Button variant="ghost" size="sm">
              {t('footer.privacy', 'Privacy Policy')}
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

export default TermsPage;
