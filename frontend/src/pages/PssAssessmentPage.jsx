import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ROUTES } from '../utils/constants';
import { pssService } from '../services/pssService';
import { authService } from '../services/authService';
import { useTranslation } from '../hooks/useTranslation';
import {
  calculatePssScore,
  PSS_RESPONSE_OPTIONS,
  PSS_REVERSE_SCORED_QUESTIONS,
} from '../utils/pssCalculator';
import {
  ClipboardList,
  ArrowRight,
  ArrowLeft,
  Check,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  HelpCircle,
  Activity,
  Heart,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { cn } from '../utils/cn';

export function PssAssessmentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const fromCheckin = Boolean(location.state?.fromCheckin);
  const fromOnboarding = Boolean(location.state?.fromOnboarding);
  const isAuthenticated = authService.isAuthenticated();

  // Clinically validated PSS-10 standardized items
  const pssQuestions = [
    { id: 1, text: t('pss.q1') },
    { id: 2, text: t('pss.q2') },
    { id: 3, text: t('pss.q3') },
    { id: 4, text: t('pss.q4'), isReverse: true },
    { id: 5, text: t('pss.q5'), isReverse: true },
    { id: 6, text: t('pss.q6') },
    { id: 7, text: t('pss.q7'), isReverse: true },
    { id: 8, text: t('pss.q8'), isReverse: true },
    { id: 9, text: t('pss.q9') },
    { id: 10, text: t('pss.q10') },
  ];

  const localizedResponseOptions = [
    { value: 0, label: t('pss.scale0') },
    { value: 1, label: t('pss.scale1') },
    { value: 2, label: t('pss.scale2') },
    { value: 3, label: t('pss.scale3') },
    { value: 4, label: t('pss.scale4') },
  ];

  // Store responses in frontend state
  const [answers, setAnswers] = useState({
    1: 2,
    2: 2,
    3: 3,
    4: 1,
    5: 2,
    6: 3,
    7: 1,
    8: 2,
    9: 2,
    10: 2,
  });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); // 0 to 9
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const currentQ = pssQuestions[currentQuestionIndex];
  const currentQNum = currentQ.id;
  const currentSelection = answers[currentQNum];

  const handleSelectOption = (value) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQNum]: value,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < pssQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    setServerError(null);

    const calculatedScore = calculatePssScore(answers);

    if (authService.isAuthenticated()) {
      const res = await pssService.submitAssessment(answers);
      setIsSubmitting(false);

      if (res && res.error) {
        const errMsg = Array.isArray(res.error.details)
          ? res.error.details.join(' ')
          : res.error.message || 'Error submitting assessment.';
        setServerError(errMsg);
      } else {
        setIsCompleted(true);
      }
    } else {
      // Guest mode: Save in isolated client guest onboarding draft
      authService.saveGuestOnboarding({
        pssAnswers: answers,
        pssScore: calculatedScore,
        pssCompletedAt: new Date().toISOString(),
      });
      setIsSubmitting(false);
      setIsCompleted(true);
    }
  };

  const handleRetake = () => {
    setCurrentQuestionIndex(0);
    setIsCompleted(false);
  };

  const calculatedScore = calculatePssScore(answers);
  const progressPercent = ((currentQuestionIndex + 1) / pssQuestions.length) * 100;

  const getScoreInterpretation = (score) => {
    if (score <= 13) return { label: t('pss.lowStress'), color: 'teal', desc: t('pss.lowStressDesc') };
    if (score <= 26) return { label: t('pss.moderateStress'), color: 'sage', desc: t('pss.moderateStressDesc') };
    return { label: t('pss.highStress'), color: 'alert', desc: t('pss.highStressDesc') };
  };

  const interpretation = getScoreInterpretation(calculatedScore);

  const renderTopActions = () => {
    if (fromCheckin) {
      return (
        <Link to={ROUTES.DAILY_CHECKIN}>
          <Button variant="secondary" size="md" icon={ArrowLeft}>
            {t('pss.returnToDailyCheckin')}
          </Button>
        </Link>
      );
    }
    if (fromOnboarding) {
      return (
        <Link to={ROUTES.ONBOARDING}>
          <Button variant="secondary" size="md" icon={ArrowLeft}>
            {t('pss.backToOnboarding')}
          </Button>
        </Link>
      );
    }
    if (isAuthenticated) {
      return (
        <Link to={ROUTES.DASHBOARD}>
          <Button variant="secondary" size="md">
            {t('pss.returnToDashboard')}
          </Button>
        </Link>
      );
    }
    return (
      <Link to={ROUTES.HOME}>
        <Button variant="secondary" size="md">
          {t('pss.backToOverview')}
        </Button>
      </Link>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4 sm:py-8 text-left">
      {/* Top Header */}
      <PageHeader
        title={t('pss.title')}
        subtitle={t('pss.subtitle')}
        badge={isAuthenticated ? t('pss.badgeValidated') : t('pss.badgePublic')}
        actions={renderTopActions()}
      />

      {!isCompleted ? (
        /* =========================================================================
           ONE QUESTION AT A TIME ASSESSMENT VIEW
           ========================================================================= */
        <Card variant="warm" className="p-7 sm:p-9 md:p-10 space-y-8 shadow-[0_12px_40px_-10px_rgba(38,53,47,0.08)] border-2 border-brand-sage/60 hover:border-brand-teal rounded-[24px]">
          {/* Progress Indicator Header */}
          <div className="space-y-3 pb-4 border-b border-brand-sage/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-bold uppercase tracking-wider text-brand-dark bg-brand-sage/25 border border-brand-sage/50">
                  {t('pss.questionOf', { current: currentQuestionIndex + 1, total: 10 })}
                </span>
                {currentQ.isReverse && (
                  <Badge variant="teal" size="sm">
                    {t('pss.reverseScored')}
                  </Badge>
                )}
              </div>
              <span className="text-meta-md font-bold text-brand-teal">
                {t('pss.percentComplete', { percent: Math.round(progressPercent) })}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-card-warm overflow-hidden border border-brand-sage/30">
              <div
                className="h-full bg-brand-teal rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-2 text-left">
            <span className="text-meta-sm font-bold uppercase tracking-wider text-brand-teal block">
              {t('pss.questionOf', { current: currentQuestionIndex + 1, total: 10 })}
            </span>
            <h2 className="text-section-lg sm:text-app-lg font-bold text-brand-dark leading-snug">
              {currentQ.text}
            </h2>
          </div>

          {/* Options (Radio List) */}
          <div className="space-y-3" role="radiogroup" aria-label={`Question ${currentQNum} options`}>
            {localizedResponseOptions.map((option) => {
              const isSelected = currentSelection === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelectOption(option.value)}
                  className={cn(
                    'w-full p-4 sm:p-5 rounded-[16px] border-2 text-left transition-all duration-150 flex items-center justify-between group cursor-pointer',
                    'min-h-[58px] select-none shadow-sm',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal',
                    isSelected
                      ? 'bg-white text-brand-dark border-brand-teal ring-2 ring-brand-teal/30 shadow-[0_4px_16px_-2px_rgba(111,153,144,0.25)] font-bold'
                      : 'bg-white/80 border-brand-sage/40 hover:bg-white hover:border-brand-sage text-[#555B55]'
                  )}
                  aria-checked={isSelected}
                  role="radio"
                >
                  <div className="flex items-center gap-3.5">
                    <span
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-meta-sm font-bold border transition-colors',
                        isSelected
                          ? 'bg-brand-teal/25 text-brand-dark border-brand-teal'
                          : 'bg-card-warm text-muted-text border-brand-sage/40 group-hover:border-brand-sage'
                      )}
                    >
                      {option.value}
                    </span>
                    <span className="text-body-lg font-semibold text-brand-dark">{option.label}</span>
                  </div>

                  {isSelected && (
                    <div className="w-7 h-7 rounded-full bg-brand-teal/20 border border-brand-teal/40 flex items-center justify-center text-brand-teal">
                      <Check className="w-4 h-4 text-brand-teal" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Navigation Buttons (Back / Next / Finish) */}
          <div className="flex items-center justify-between pt-6 border-t border-brand-sage/30">
            <Button
              variant="outline"
              size="md"
              onClick={handleBack}
              disabled={currentQuestionIndex === 0}
              icon={ArrowLeft}
            >
              {t('common.back')}
            </Button>

            {/* Quick jump dot navigator */}
            <div className="hidden sm:flex items-center gap-2">
              {pssQuestions.map((q, idx) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={cn(
                    'w-3 h-3 rounded-full transition-all cursor-pointer',
                    idx === currentQuestionIndex
                      ? 'bg-brand-dark scale-125 shadow-sm'
                      : answers[q.id] !== undefined
                      ? 'bg-brand-teal'
                      : 'bg-brand-sage/30'
                  )}
                  aria-label={`Jump to question ${idx + 1}`}
                />
              ))}
            </div>

            {currentQuestionIndex < pssQuestions.length - 1 ? (
              <Button
                variant="primary"
                size="md"
                onClick={handleNext}
                disabled={currentSelection === undefined}
                iconRight={ArrowRight}
                className="shadow-md font-bold"
              >
                {t('common.continue')}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={handleFinish}
                disabled={currentSelection === undefined || isSubmitting}
                iconRight={Check}
                className="shadow-md font-bold"
              >
                {isSubmitting ? t('common.submitting') : t('pss.submitAssessment')}
              </Button>
            )}
          </div>
        </Card>
      ) : (
        /* =========================================================================
           COMPLETION & RESULTS VIEW (Strictly Non-Diagnostic)
           ========================================================================= */
        <Card variant="warm" className="p-7 sm:p-10 space-y-8 shadow-[0_12px_40px_-10px_rgba(38,53,47,0.08)] border-2 border-brand-sage/60 rounded-[24px] animate-in fade-in duration-300">
          <div className="text-center space-y-5 max-w-xl mx-auto">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-teal/20 border-2 border-brand-teal/40 flex items-center justify-center text-brand-dark shadow-sm">
              <Sparkles className="w-7 h-7 text-brand-teal" />
            </div>

            <div className="space-y-1.5">
              <span className="text-meta-sm font-bold uppercase tracking-wider text-brand-teal">
                {t('pss.evaluationCompleted')}
              </span>
              <h2 className="text-app-xl font-bold text-brand-dark">
                {t('pss.yourStressScore')}
              </h2>
            </div>

            {/* Score Display Card */}
            <div className="p-7 sm:p-8 rounded-[20px] bg-white border-2 border-brand-sage/50 shadow-soft space-y-4">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-[56px] sm:text-[68px] font-bold text-brand-dark leading-none tracking-tight">
                  {calculatedScore}
                </span>
                <span className="text-section-lg font-bold text-muted-text">
                  / 40
                </span>
              </div>

              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-sage/20 border border-brand-sage/40 text-meta-md font-bold text-brand-dark">
                <span>{interpretation.label}</span>
              </div>

              {/* Score Visual Continuum Bar */}
              <div className="space-y-2 pt-2">
                <div className="w-full h-3.5 rounded-full bg-card-warm overflow-hidden relative border border-brand-sage/30">
                  <div
                    className="h-full bg-gradient-to-r from-brand-sage via-brand-teal to-[#C47D75] rounded-full transition-all duration-700 shadow-sm"
                    style={{ width: `${(calculatedScore / 40) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-[#666C66] font-semibold px-1">
                  <span>{t('pss.scaleLowLabel')}</span>
                  <span>{t('pss.scaleModLabel')}</span>
                  <span>{t('pss.scaleHighLabel')}</span>
                </div>
              </div>
            </div>

            {/* Narrative Explanation */}
            <div className="space-y-2 text-body-md text-[#555B55] leading-relaxed pt-1">
              <p className="font-bold text-brand-dark">
                {interpretation.desc}
              </p>
              <p className="text-meta-md text-[#777E77]">
                {t('pss.scoreDescDisclaimer')}
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-5 border-t border-brand-sage/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 flex-wrap">
            {isAuthenticated ? (
              <>
                {fromCheckin && (
                  <Link to={ROUTES.DAILY_CHECKIN} className="flex-1">
                    <Button variant="primary" size="lg" className="w-full shadow-md font-bold" icon={ArrowLeft}>
                      {t('pss.returnToDailyCheckin')}
                    </Button>
                  </Link>
                )}

                <Link to={ROUTES.DASHBOARD} className={fromCheckin ? "flex-1 sm:flex-initial" : "flex-1"}>
                  <Button variant={fromCheckin ? "secondary" : "primary"} size="lg" className="w-full shadow-md font-bold" iconRight={ArrowRight}>
                    {t('pss.continueToDashboard')}
                  </Button>
                </Link>

                {!fromCheckin && (
                  <Link to={ROUTES.DAILY_CHECKIN} className="flex-1 sm:flex-initial">
                    <Button variant="secondary" size="lg" className="w-full" icon={ArrowLeft}>
                      {t('pss.goToDailyCheckin')}
                    </Button>
                  </Link>
                )}

                <Link to={ROUTES.RISK_ANALYSIS} className="flex-1 sm:flex-initial">
                  <Button variant="secondary" size="lg" className="w-full">
                    {t('pss.viewRiskForecast')}
                  </Button>
                </Link>
              </>
            ) : (
              /* Guest Actions */
              <>
                <Link to={ROUTES.SIGNUP} className="flex-1">
                  <Button variant="primary" size="lg" className="w-full shadow-md font-bold" iconRight={ArrowRight}>
                    {t('pss.createAccountSaveScore')}
                  </Button>
                </Link>

                <Link to={ROUTES.LOGIN} className="flex-1 sm:flex-initial">
                  <Button variant="secondary" size="lg" className="w-full">
                    {t('pss.signInSaveScore')}
                  </Button>
                </Link>

                {fromOnboarding && (
                  <Link to={ROUTES.ONBOARDING} className="flex-1 sm:flex-initial">
                    <Button variant="outline" size="lg" className="w-full">
                      {t('pss.backToOnboarding')}
                    </Button>
                  </Link>
                )}
              </>
            )}

            <Button
              variant="outline"
              size="lg"
              onClick={handleRetake}
              icon={RotateCcw}
              className="flex-1 sm:flex-initial"
            >
              {t('pss.retakeBtn')}
            </Button>
          </div>
        </Card>
      )}

      {/* Reassurance Footer Card */}
      <div className="p-4 rounded-[18px] bg-gradient-to-r from-[#FAF9F5] to-[#F1EFEA] border-2 border-brand-sage/45 flex items-start gap-3.5 text-meta-sm text-[#555B55] shadow-sm">
        <ShieldCheck className="w-5 h-5 text-brand-teal flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {t('pss.confidentialityReassurance')}
        </p>
      </div>
    </div>
  );
}

export default PssAssessmentPage;
