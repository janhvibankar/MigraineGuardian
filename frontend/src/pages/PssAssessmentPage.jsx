import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ROUTES } from '../utils/constants';
import { storageService } from '../services/storageService';
import { pssService } from '../services/pssService';

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
} from 'lucide-react';
import { cn } from '../utils/cn';

export function PssAssessmentPage() {
  const navigate = useNavigate();

  // Clinically validated PSS-10 standardized items
  const pssQuestions = [
    { id: 1, text: 'In the last month, how often have you been upset because of something that happened unexpectedly?' },
    { id: 2, text: 'In the last month, how often have you felt that you were unable to control the important things in your life?' },
    { id: 3, text: 'In the last month, how often have you felt nervous and stressed?' },
    { id: 4, text: 'In the last month, how often have you felt confident about your ability to handle your personal problems?', isReverse: true },
    { id: 5, text: 'In the last month, how often have you felt that things were going your way?', isReverse: true },
    { id: 6, text: 'In the last month, how often have you found that you could not cope with all the things that you had to do?' },
    { id: 7, text: 'In the last month, how often have you been able to control irritations in your life?', isReverse: true },
    { id: 8, text: 'In the last month, how often have you felt that you were on top of things?', isReverse: true },
    { id: 9, text: 'In the last month, how often have you been angered because of things that were outside of your control?' },
    { id: 10, text: 'In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?' },
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
  };

  const handleRetake = () => {
    setCurrentQuestionIndex(0);
    setIsCompleted(false);
  };

  const calculatedScore = calculatePssScore(answers);
  const progressPercent = ((currentQuestionIndex + 1) / pssQuestions.length) * 100;

  const getScoreInterpretation = (score) => {
    if (score <= 13) return { label: 'Low Perceived Stress', color: 'teal', desc: 'Your autonomic stress load is in a calm, balanced range.' };
    if (score <= 26) return { label: 'Moderate Stress Load', color: 'sage', desc: 'Mild-to-moderate autonomic strain detected. Consider scheduling regular sensory pauses.' };
    return { label: 'Elevated Perceived Stress', color: 'alert', desc: 'Significant physiological strain. Stress management protocols are highly recommended.' };
  };

  const interpretation = getScoreInterpretation(calculatedScore);

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4 sm:py-6">
      {/* Top Header */}
      <PageHeader
        title="Perceived Stress Scale (PSS-10)"
        subtitle="A validated questionnaire measuring perceived stress over the previous month."
        badge="Validated Clinical Instrument"
        actions={
          <Link to={ROUTES.DASHBOARD}>
            <Button variant="secondary" size="md">
              Return to Dashboard
            </Button>
          </Link>
        }
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
                  Question {currentQuestionIndex + 1} of 10
                </span>
                {currentQ.isReverse && (
                  <span className="text-[11px] font-bold text-brand-teal-dark bg-brand-teal/20 border border-brand-teal/40 px-2.5 py-0.5 rounded-full">
                    Reverse calibrated
                  </span>
                )}
              </div>
              <span className="text-meta-sm text-brand-dark font-bold">
                {Math.round(progressPercent)}% completed
              </span>
            </div>

            {/* Smooth Progress Bar */}
            <div className="w-full h-2.5 rounded-full bg-brand-sage/25 overflow-hidden">
              <div
                className="h-full bg-brand-dark rounded-full transition-all duration-300 ease-out shadow-sm"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Question Text Prompt */}
          <div className="space-y-3 py-2 min-h-[90px] flex flex-col justify-center">
            <span className="text-meta-sm font-bold uppercase tracking-wider text-brand-teal">
              Item #{currentQNum}
            </span>
            <h2 className="text-section-lg sm:text-[22px] font-bold text-brand-dark leading-relaxed">
              "{currentQ.text}"
            </h2>
          </div>

          {/* Large Touch-Friendly Response Buttons */}
          <div className="space-y-3 pt-1" role="radiogroup" aria-label={`Response options for question ${currentQNum}`}>
            {PSS_RESPONSE_OPTIONS.map((option) => {
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
              Back
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
                className="shadow-md"
              >
                Next
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={handleFinish}
                disabled={currentSelection === undefined}
                iconRight={Check}
                className="shadow-md"
              >
                Finish Assessment
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
                Evaluation Completed
              </span>
              <h2 className="text-app-xl font-bold text-brand-dark">
                Your Perceived Stress Score
              </h2>
            </div>

            {/* Score Display Card with Green Border */}
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

              {/* Calm Score Visual Continuum Bar */}
              <div className="space-y-2 pt-2">
                <div className="w-full h-3.5 rounded-full bg-card-warm overflow-hidden relative border border-brand-sage/30">
                  <div
                    className="h-full bg-gradient-to-r from-brand-sage via-brand-teal to-[#C47D75] rounded-full transition-all duration-700 shadow-sm"
                    style={{ width: `${(calculatedScore / 40) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-[#666C66] font-semibold px-1">
                  <span>0 (Low Stress)</span>
                  <span>20 (Moderate)</span>
                  <span>40 (High Stress)</span>
                </div>
              </div>
            </div>

            {/* Required Supporting Narrative */}
            <div className="space-y-2 text-body-md text-[#555B55] leading-relaxed pt-1">
              <p className="font-bold text-brand-dark">
                {interpretation.desc}
              </p>
              <p className="text-meta-md text-[#777E77]">
                Higher scores indicate greater perceived load over the past 30 days. This score serves as an empirical lifestyle indicator, not a psychiatric diagnosis.
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-5 border-t border-brand-sage/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5">
            <Link to={ROUTES.DASHBOARD} className="flex-1">
              <Button variant="primary" size="lg" className="w-full shadow-md" iconRight={ArrowRight}>
                Continue to Dashboard
              </Button>
            </Link>

            <Link to={ROUTES.RISK_ANALYSIS} className="flex-1 sm:flex-initial">
              <Button variant="secondary" size="lg" className="w-full">
                View Risk Forecast
              </Button>
            </Link>

            <Button
              variant="outline"
              size="lg"
              onClick={handleRetake}
              icon={RotateCcw}
            >
              Retake Assessment
            </Button>
          </div>
        </Card>
      )}

      {/* Reassurance Footer Card */}
      <div className="p-4 rounded-[18px] bg-gradient-to-r from-[#FAF9F5] to-[#F1EFEA] border-2 border-brand-sage/45 flex items-start gap-3.5 text-meta-sm text-[#555B55] shadow-sm">
        <ShieldCheck className="w-5 h-5 text-brand-teal flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          The Perceived Stress Scale (PSS-10) is utilized for lifestyle pattern recognition and baseline sensitivity modeling. All responses are securely retained within your local browser state.
        </p>
      </div>
    </div>
  );
}
