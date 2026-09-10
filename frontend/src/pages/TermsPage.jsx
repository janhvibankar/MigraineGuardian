import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ROUTES } from '../utils/constants';
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
  const sections = [
    {
      icon: HeartHandshake,
      title: '1. Wellness & Educational Purpose (Not Medical Advice)',
      content: (
        <div className="space-y-3 text-body-md text-[#555B55] leading-relaxed">
          <p>
            MigraineGuardian is designed strictly as an empirical lifestyle tracking, pattern recognition, and educational support tool.
          </p>
          <div className="p-4 rounded-xl bg-alert-muted/10 border border-alert-muted/30 text-brand-dark text-meta-md">
            <strong>Important Medical Disclaimer:</strong> MigraineGuardian does NOT provide medical diagnoses, clinical treatment plans, or emergency health intervention. The risk probabilities, SHAP feature attributions, and AI suggestions provided are statistical wellness estimations and must never replace direct evaluation by a licensed neurologist or physician.
          </div>
          <p>
            If you experience sudden, unusually severe headache symptoms ("thunderclap" headache), neurological deficits, vision loss, or high fever accompanied by stiff neck, seek emergency medical care immediately.
          </p>
        </div>
      ),
    },
    {
      icon: UserCheck,
      title: '2. User Accounts & Responsibilities',
      content: (
        <div className="space-y-3 text-body-md text-[#555B55] leading-relaxed">
          <p>
            When creating an account or using guest features, you agree to:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-meta-md">
            <li>Provide accurate lifestyle tracking inputs (sleep hours, hydration, stress level) to ensure meaningful personal pattern correlation.</li>
            <li>Maintain the confidentiality of your authentication credentials and notify us immediately if you suspect unauthorized account access.</li>
            <li>Use the application solely for personal, non-commercial health self-management.</li>
          </ul>
        </div>
      ),
    },
    {
      icon: Scale,
      title: '3. Machine Learning & Predictive Output',
      content: (
        <div className="space-y-3 text-body-md text-[#555B55] leading-relaxed">
          <p>
            MigraineGuardian utilizes trained machine learning models (gradient boosted decision trees and TreeSHAP explainability) to estimate compound sensitivity likelihoods from your daily logs and environmental data:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-meta-md">
            <li>Forecasts represent empirical risk estimations, not deterministic guarantees that a migraine attack will or will not occur.</li>
            <li>Individual physiological variations, unlogged triggers, medication changes, and external factors can influence actual migraine onset.</li>
          </ul>
        </div>
      ),
    },
    {
      icon: Shield,
      title: '4. Service Availability & Modifications',
      content: (
        <div className="space-y-3 text-body-md text-[#555B55] leading-relaxed">
          <p>
            We strive to provide continuous, reliable service for your daily wellness tracking. We may periodically update features, refine machine learning algorithms, or enhance data security protocols. We will provide notice of significant service changes where feasible.
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-10 animate-in fade-in duration-200 text-left">
      <PageHeader
        title="Terms of Service"
        subtitle="The terms governing your use of MigraineGuardian for daily wellness tracking, pattern insights, and risk forecasting."
        badge="Terms of Use"
        actions={
          <Link to={ROUTES.HOME}>
            <Button variant="secondary" size="md">
              Back to Overview
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
            Summary of Key Terms
          </h2>
          <p className="text-meta-md text-[#555B55] leading-relaxed">
            MigraineGuardian is a gentle, evidence-based wellness tool. By using the platform, you acknowledge that our forecasts and AI companion provide lifestyle support, not professional medical diagnoses.
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
          Effective date: September 2026 • MigraineGuardian
        </span>
        <div className="flex items-center gap-3">
          <Link to={ROUTES.PRIVACY}>
            <Button variant="ghost" size="sm">
              Privacy Policy
            </Button>
          </Link>
          <Link to={ROUTES.ONBOARDING}>
            <Button variant="primary" size="sm" iconRight={ArrowRight}>
              Begin Journey
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default TermsPage;
