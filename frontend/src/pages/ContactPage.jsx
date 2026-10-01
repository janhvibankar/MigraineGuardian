import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ROUTES } from '../utils/constants';
import { useTranslation } from '../hooks/useTranslation';
import {
  HelpCircle,
  Mail,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Send,
  ArrowRight,
  ShieldCheck,
  Bot,
  ExternalLink,
} from 'lucide-react';

export function ContactPage() {
  const { t } = useTranslation();
  const [feedbackCategory, setFeedbackCategory] = useState('general');
  const [messageText, setMessageText] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmitFeedback = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    setIsSubmitted(true);
    setTimeout(() => {
      setMessageText('');
      setUserEmail('');
    }, 1000);
  };

  const faqs = [
    {
      q: t('contact.faqQ1', 'How does the Daily Check-in work?'),
      a: t('contact.faqA1', 'The daily micro-checkin takes under 60 seconds. You record key indicators (sleep hours, quality, daily stress, hydration, and screen time). These signals are fed into our machine learning model to compute today\'s sensitivity likelihood.'),
    },
    {
      q: t('contact.faqQ2', 'What is the PSS-10 assessment?'),
      a: t('contact.faqA2', 'The Perceived Stress Scale (PSS-10) is a clinically validated 10-item questionnaire that measures how unpredictable, uncontrollable, and overloaded you have found your life over the past month.'),
    },
    {
      q: t('contact.faqQ3', 'Is my health tracking data private?'),
      a: t('contact.faqA3', 'Yes. All personal check-in records are protected by Firebase Auth and stored in Cloud Firestore scoped exclusively to your verified user account. We never sell or monetize your data.'),
    },
    {
      q: t('contact.faqQ4', 'Can MigraineGuardian diagnose migraines?'),
      a: t('contact.faqA4', 'No. MigraineGuardian is designed for wellness tracking, trigger awareness, and proactive lifestyle support. It does not replace professional medical diagnosis from a licensed neurologist or physician.'),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-10 animate-in fade-in duration-200 text-left">
      <PageHeader
        title={t('footer.contact', 'Help & Contact Support')}
        subtitle={t('contact.subtitle', 'Have questions about tracking, machine learning forecasts, or need technical assistance? We are here to help.')}
        badge={t('contact.badge', 'Community & Support')}
        actions={
          <Link to={ROUTES.HOME}>
            <Button variant="secondary" size="md">
              {t('auth.backToOverview', 'Back to Overview')}
            </Button>
          </Link>
        }
      />

      {/* Emergency Medical Care Advisory Card */}
      <div className="p-5 rounded-[20px] bg-alert-muted/15 border-2 border-alert-muted/40 text-brand-dark flex items-start gap-4 shadow-sm">
        <AlertCircle className="w-5 h-5 text-[#8F443B] flex-shrink-0 mt-0.5" />
        <div className="space-y-1 text-meta-md">
          <span className="font-bold text-[#8F443B] block">
            {t('contact.emergencyNoticeTitle', 'Emergency Health Notice')}
          </span>
          <p className="text-[#555B55] leading-relaxed">
            {t('contact.emergencyNoticeDesc', 'If you are experiencing sudden, severe head pain, confusion, weakness, vision loss, or symptoms accompanied by high fever and neck stiffness, please call your local emergency medical services or visit the nearest emergency room immediately.')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left: Support Options & Direct Help */}
        <div className="md:col-span-6 space-y-6">
          <Card variant="warm" className="p-6 sm:p-7 space-y-4 border-2 border-brand-sage/50 rounded-[22px] shadow-sm">
            <div className="flex items-center gap-3 pb-3 border-b border-brand-sage/30">
              <div className="w-9 h-9 rounded-xl bg-brand-teal/20 border border-brand-teal/40 flex items-center justify-center text-brand-dark">
                <Mail className="w-5 h-5 text-brand-teal" />
              </div>
              <div>
                <h3 className="text-section-md font-bold text-brand-dark">
                  {t('contact.supportInquiriesTitle', 'Project Support & Inquiries')}
                </h3>
                <span className="text-meta-sm text-muted-text">{t('contact.supportInquiriesSub', 'Open-source & repository help')}</span>
              </div>
            </div>

            <p className="text-body-md text-[#555B55] leading-relaxed">
              MigraineGuardian is developed as an open health intelligence platform. For issue reporting, bug tracking, and code contributions, visit our repository.
            </p>

            <div className="pt-2 flex flex-col gap-2.5">
              <a
                href="https://github.com/janhvibankar/MigraineGuardian"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-card-sm bg-white border border-brand-sage/50 hover:border-brand-teal text-brand-dark font-medium text-meta-md flex items-center justify-between transition-colors shadow-sm"
              >
                <span>GitHub Repository & Issue Tracker</span>
                <ExternalLink className="w-4 h-4 text-brand-teal" />
              </a>

              <Link
                to={ROUTES.HOW_IT_WORKS}
                className="p-3 rounded-card-sm bg-white border border-brand-sage/50 hover:border-brand-teal text-brand-dark font-medium text-meta-md flex items-center justify-between transition-colors shadow-sm"
              >
                <span>{t('landing.howItWorksTitle', 'Learn How the System Works')}</span>
                <ArrowRight className="w-4 h-4 text-brand-teal" />
              </Link>
            </div>
          </Card>

          {/* Instant AI Companion Prompt */}
          <Card variant="warm" className="p-6 sm:p-7 space-y-4 border-2 border-brand-sage/50 rounded-[22px] shadow-sm">
            <div className="flex items-center gap-3 pb-3 border-b border-brand-sage/30">
              <div className="w-9 h-9 rounded-xl bg-brand-dark text-white flex items-center justify-center shadow-soft">
                <Bot className="w-5 h-5 text-brand-teal" />
              </div>
              <div>
                <h3 className="text-section-md font-bold text-brand-dark">
                  {t('chat.askMigraineGuardian', 'Ask MigraineGuardian AI')}
                </h3>
                <span className="text-meta-sm text-brand-teal font-semibold">{t('chat.evidenceGuidance', 'Evidence-based conversational guide')}</span>
              </div>
            </div>
            <p className="text-body-md text-[#555B55] leading-relaxed">
              Have questions about migraine triggers, barometric shifts, or relaxation routines? Try the floating assistant in the bottom right corner of any page.
            </p>
          </Card>
        </div>

        {/* Right: Message / Inquiries Form */}
        <div className="md:col-span-6">
          <Card variant="warm" className="p-6 sm:p-8 space-y-5 border-2 border-brand-sage/55 rounded-[24px] shadow-sm">
            <div className="space-y-1 pb-3 border-b border-brand-sage/30">
              <h3 className="text-section-md font-bold text-brand-dark">
                {t('contact.sendFeedbackTitle', 'Send In-App Feedback')}
              </h3>
              <p className="text-meta-sm text-[#555B55]">
                {t('contact.feedbackDesc', 'Share your suggestions, report issues, or suggest new lifestyle tracking features directly to our team.')}
              </p>
            </div>

            {isSubmitted ? (
              <div className="p-6 rounded-[18px] bg-brand-teal/15 border-2 border-brand-teal/40 text-center space-y-3 animate-in fade-in duration-200">
                <div className="w-12 h-12 rounded-full bg-brand-teal/20 border border-brand-teal/50 flex items-center justify-center mx-auto text-brand-teal">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-section-md font-bold text-brand-dark">
                  {t('contact.feedbackSentTitle', 'Thank you for your feedback!')}
                </h4>
                <p className="text-meta-md text-[#555B55] leading-relaxed">
                  {t('contact.feedbackSentDesc', 'Your note has been recorded. We continuously refine MigraineGuardian to support your calm wellness journey.')}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSubmitted(false)}
                >
                  {t('contact.sendAnotherBtn', 'Send Another Note')}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-meta-sm font-semibold text-brand-dark">
                    Topic Category
                  </label>
                  <select
                    value={feedbackCategory}
                    onChange={(e) => setFeedbackCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[12px] bg-white border border-brand-sage/50 text-body-md text-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal"
                  >
                    <option value="general">{t('contact.categoryGeneral')}</option>
                    <option value="feature">{t('contact.categoryFeature')}</option>
                    <option value="ml">{t('contact.categoryMl')}</option>
                    <option value="bug">{t('contact.categoryBug')}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-meta-sm font-semibold text-brand-dark">
                    {t('auth.emailAddress', 'Your Email')}
                  </label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder={t('contact.emailPlaceholder', 'Your email (optional, for follow-up)')}
                    className="w-full px-3.5 py-2.5 rounded-[12px] bg-white border border-brand-sage/50 text-body-md text-brand-dark placeholder:text-muted-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-meta-sm font-semibold text-brand-dark">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={t('contact.feedbackPlaceholder', 'Describe your feedback or question here in detail...')}
                    required
                    className="w-full px-3.5 py-2.5 rounded-[12px] bg-white border border-brand-sage/50 text-body-md text-brand-dark placeholder:text-muted-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full shadow-md font-bold"
                  iconRight={Send}
                  disabled={!messageText.trim()}
                >
                  {t('contact.sendBtn', 'Submit Feedback')}
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>

      {/* Frequently Asked Questions (FAQ) Section */}
      <div className="space-y-6 pt-4">
        <div className="space-y-1 pb-2 border-b border-muted-border/60">
          <h2 className="text-section-lg font-bold text-brand-dark">
            {t('contact.faqTitle', 'Frequently Asked Questions')}
          </h2>
          <p className="text-body-md text-muted-text">
            Quick answers to common questions about using MigraineGuardian.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {faqs.map((faq, idx) => (
            <Card key={idx} variant="warm" className="p-6 space-y-2 border-2 border-brand-sage/45 rounded-[20px]">
              <h3 className="text-meta-md font-bold text-brand-dark flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-brand-teal flex-shrink-0 mt-0.5" />
                <span>{faq.q}</span>
              </h3>
              <p className="text-meta-md text-[#555B55] leading-relaxed pl-6">
                {faq.a}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ContactPage;
