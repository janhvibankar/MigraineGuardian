import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ROUTES } from '../utils/constants';
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
  const sections = [
    {
      icon: Database,
      title: '1. Information We Collect & Purpose',
      content: (
        <div className="space-y-3 text-body-md text-[#555B55] leading-relaxed">
          <p>
            MigraineGuardian collects only the minimum lifestyle indicators necessary to compute personalized migraine risk forecasts and pattern insights:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-meta-md">
            <li><strong>Daily Micro Check-in Logs:</strong> Sleep duration, sleep quality, daily stress ratings (0–10), mood, screen exposure, hydration, skipped meals, caffeine timing, exercise level, and reported migraine episodes.</li>
            <li><strong>Perceived Stress Scale (PSS-10):</strong> Clinically validated 10-item stress perception questionnaire responses used for autonomic baseline calibration.</li>
            <li><strong>Environmental Context:</strong> Local ambient temperature, barometric pressure, humidity, and precipitation (retrieved via optional browser geolocation or chosen location).</li>
            <li><strong>Account Identifiers:</strong> Your email address and display name managed via Firebase Authentication.</li>
          </ul>
        </div>
      ),
    },
    {
      icon: Lock,
      title: '2. Data Isolation & Security Architecture',
      content: (
        <div className="space-y-3 text-body-md text-[#555B55] leading-relaxed">
          <p>
            Your health tracking records are strictly isolated and protected:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-meta-md">
            <li><strong>Authenticated Owner Gating:</strong> All Cloud Firestore records are scoped exclusively to your verified Firebase UID (<code className="text-meta-sm bg-card-warm px-1.5 py-0.5 rounded">users/&#123;uid&#125;</code>). Other users cannot query or access your records.</li>
            <li><strong>Encrypted in Transit:</strong> All communication between your browser, our API gateway, and our machine learning microservice is encrypted using TLS / HTTPS.</li>
            <li><strong>On-Demand ML Inference:</strong> Daily check-in feature vectors are processed in memory by our dedicated Python FastAPI machine learning pipeline to produce SHAP explainability attributions and risk scores.</li>
          </ul>
        </div>
      ),
    },
    {
      icon: UserX,
      title: '3. Zero Third-Party Advertising or Data Selling',
      content: (
        <div className="space-y-3 text-body-md text-[#555B55] leading-relaxed">
          <p>
            We adhere to a strict non-commercial privacy principle:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-meta-md">
            <li>We do not sell, rent, monetize, or broker your personal health information to third parties, insurance companies, data brokers, or advertisers.</li>
            <li>We do not embed third-party advertising tracking pixels or commercial ad SDKs.</li>
            <li>Your data is used solely to generate your personal wellness insights, clinical PDF summaries, and proactive sensitivity forecasts.</li>
          </ul>
        </div>
      ),
    },
    {
      icon: Trash2,
      title: '4. User Control & Data Deletion',
      content: (
        <div className="space-y-3 text-body-md text-[#555B55] leading-relaxed">
          <p>
            You maintain full ownership of your tracking history:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-meta-md">
            <li><strong>Local Cache Clearing:</strong> You can reset local device preferences and stored check-in drafts at any time from the Settings page.</li>
            <li><strong>History Export:</strong> You can generate a clinical 1-click PDF summary report from the Reports page to export your longitudinal patterns for personal review or physician consultation.</li>
            <li><strong>Account Deletion:</strong> You may request complete removal of your account and associated Firestore documents.</li>
          </ul>
        </div>
      ),
    },
    {
      icon: Info,
      title: '5. Non-Diagnostic Wellness Advisory',
      content: (
        <div className="space-y-3 text-body-md text-[#555B55] leading-relaxed">
          <p>
            MigraineGuardian is a predictive lifestyle and wellness companion designed to recognize empirical patterns and encourage calming self-care routines. It does not provide medical diagnosis, clinical treatment plans, or emergency health intervention. Always consult a qualified neurologist or healthcare provider for medical diagnosis and prescription guidance.
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-10 animate-in fade-in duration-200 text-left">
      <PageHeader
        title="Privacy Policy & Data Protection"
        subtitle="How MigraineGuardian safeguards your personal wellness data, maintains strict user isolation, and respects your privacy."
        badge="Confidential & Protected"
        actions={
          <Link to={ROUTES.HOME}>
            <Button variant="secondary" size="md">
              Back to Overview
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
            Our Core Privacy Commitment
          </h2>
          <p className="text-meta-md text-[#555B55] leading-relaxed">
            Your migraine patterns, stress ratings, and daily check-ins belong exclusively to you. We enforce verified Firebase UID ownership on every request and never monetize your health records.
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
          Last updated: September 2026 • MigraineGuardian Privacy Architecture
        </span>
        <div className="flex items-center gap-3">
          <Link to={ROUTES.TERMS}>
            <Button variant="ghost" size="sm">
              Terms of Service
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

export default PrivacyPage;
