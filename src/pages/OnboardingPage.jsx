import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { ROUTES } from '../utils/constants';
import { storageService } from '../services/storageService';
import {
  User,
  Activity,
  Sliders,
  ClipboardList,
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Moon,
  Brain,
  SunMedium,
  Droplets,
  Utensils,
  Smile,
  Dumbbell,
  Coffee,
  Info,
  Clock,
  HeartHandshake,
} from 'lucide-react';
import { cn } from '../utils/cn';

import { authService } from '../services/authService';

export function OnboardingPage() {
  const navigate = useNavigate();

  const currentUser = authService.getCurrentUser();

  // Multi-step state (1 to 4)
  const [step, setStep] = useState(1);

  // Step 1: About You - Read name from signed-up user
  const [name, setName] = useState(() => currentUser?.name || '');
  const [age, setAge] = useState(() => currentUser?.age || '32');
  const [gender, setGender] = useState(() => currentUser?.gender || 'Female');
  const [step1Error, setStep1Error] = useState('');

  // Step 2: Migraine History
  const [hasMigraines, setHasMigraines] = useState('Yes'); // 'Yes', 'No', 'Not sure'
  const [frequency, setFrequency] = useState('1–3 times a month');
  const [severity, setSeverity] = useState(6); // 0-10
  const [duration, setDuration] = useState('4–12 hours');
  const [usesMedication, setUsesMedication] = useState('Yes');

  // Step 3: Tracking Preferences
  const [selectedFactors, setSelectedFactors] = useState([
    'Sleep',
    'Stress',
    'Screen time',
    'Hydration',
    'Meals',
  ]);

  const trackingOptions = [
    { id: 'Sleep', label: 'Sleep', desc: 'Rest duration & sleep quality', icon: Moon },
    { id: 'Stress', label: 'Stress', desc: 'Mental strain & autonomic load', icon: Brain },
    { id: 'Screen time', label: 'Screen time', desc: 'Visual glare & continuous screen hours', icon: SunMedium },
    { id: 'Hydration', label: 'Hydration', desc: 'Water volume & fluid distribution', icon: Droplets },
    { id: 'Meals', label: 'Meals', desc: 'Meal regularity & skipped breakfasts', icon: Utensils },
    { id: 'Mood', label: 'Mood', desc: 'Calm, focus, tension, and irritability', icon: Smile },
    { id: 'Exercise', label: 'Exercise', desc: 'Light movement, walks, or workouts', icon: Dumbbell },
    { id: 'Caffeine', label: 'Caffeine', desc: 'Intake timing & withdrawal signals', icon: Coffee },
  ];

  const toggleFactor = (factorId) => {
    if (selectedFactors.includes(factorId)) {
      setSelectedFactors(selectedFactors.filter((f) => f !== factorId));
    } else {
      setSelectedFactors([...selectedFactors, factorId]);
    }
  };

  const selectAllFactors = () => {
    if (selectedFactors.length === trackingOptions.length) {
      setSelectedFactors(['Sleep', 'Hydration']);
    } else {
      setSelectedFactors(trackingOptions.map((t) => t.id));
    }
  };

  const saveProfileData = () => {
    const updatedName = name.trim() || currentUser?.name || 'Sakshi';
    authService.updateUserProfile({
      name: updatedName,
      age,
      gender,
      hasMigraines,
      frequency,
      severity,
      duration,
      usesMedication,
      selectedFactors,
    });
    storageService.setItem('onboarding_draft', {
      name: updatedName,
      age,
      gender,
      hasMigraines,
      frequency,
      severity,
      duration,
      usesMedication,
      selectedFactors,
    });
  };

  // Step navigation helpers
  const handleNext = () => {
    if (step === 1) {
      if (!name.trim()) {
        setStep1Error('Please enter your name.');
        return;
      }
      setStep1Error('');
    }

    saveProfileData();

    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleStartPss = () => {
    saveProfileData();
    navigate(ROUTES.PSS_ASSESSMENT);
  };

  const handleSkipToDashboard = () => {
    saveProfileData();
    navigate(ROUTES.DASHBOARD);
  };

  const stepsMeta = [
    { num: 1, title: 'About You', icon: User },
    { num: 2, title: 'Migraine History', icon: Activity },
    { num: 3, title: 'Tracking Preferences', icon: Sliders },
    { num: 4, title: 'PSS Assessment', icon: ClipboardList },
  ];

  const getSeverityLabel = (val) => {
    if (val === 0) return 'None (0)';
    if (val <= 3) return `Mild (${val}/10)`;
    if (val <= 6) return `Moderate (${val}/10)`;
    if (val <= 8) return `Severe (${val}/10)`;
    return `Intense (${val}/10)`;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4 sm:py-6">
      {/* Top Calm Progress Header */}
      <div className="bg-gradient-to-b from-[#FAF9F5] to-[#F1EFEA] border-2 border-brand-sage/55 rounded-[22px] p-5 sm:p-6 shadow-soft">
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-bold uppercase tracking-wider text-brand-dark bg-brand-sage/25 border border-brand-sage/50">
              Step {step} of 4
            </span>
            <span className="text-body-md font-bold text-brand-dark">
              {stepsMeta[step - 1].title}
            </span>
          </div>
          <span className="text-meta-sm text-[#666C66] font-medium hidden sm:inline">
            Personalizing your wellness profile
          </span>
        </div>

        {/* 4-Step Progress Indicator */}
        <div className="grid grid-cols-4 gap-2.5">
          {stepsMeta.map((s) => {
            const isCompleted = s.num < step;
            const isCurrent = s.num === step;
            return (
              <div key={s.num} className="space-y-1.5">
                <div
                  className={cn(
                    'h-2 rounded-full transition-all duration-300',
                    isCompleted
                      ? 'bg-brand-teal'
                      : isCurrent
                      ? 'bg-brand-dark shadow-sm'
                      : 'bg-brand-sage/25'
                  )}
                />
                <span
                  className={cn(
                    'text-[12px] font-semibold hidden md:block truncate',
                    isCurrent
                      ? 'text-brand-dark font-bold'
                      : isCompleted
                      ? 'text-brand-teal font-medium'
                      : 'text-muted-text-light'
                  )}
                >
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Card Container */}
      <Card variant="warm" className="p-7 sm:p-9 md:p-10 space-y-8 shadow-[0_12px_40px_-10px_rgba(38,53,47,0.08)] border-2 border-brand-sage/60 hover:border-brand-teal rounded-[24px]">
        {/* =========================================================================
            STEP 1: ABOUT YOU
           ========================================================================= */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="space-y-1.5 pb-2 border-b border-brand-sage/30">
              <h2 className="text-section-lg md:text-app-lg font-bold text-brand-dark">
                About You
              </h2>
              <p className="text-body-md text-[#555B55] leading-relaxed">
                This helps personalize your experience. You can skip optional information anytime.
              </p>
            </div>

            <div className="space-y-4 pt-1">
              <Input
                label="Preferred Name"
                id="onboarding-name"
                name="name"
                type="text"
                icon={User}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (step1Error) setStep1Error('');
                }}
                placeholder="What should we call you?"
                errorText={step1Error}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="onboarding-age"
                    className="text-meta-md font-semibold text-brand-dark flex items-center justify-between mb-1.5"
                  >
                    <span>Age</span>
                    <span className="text-meta-sm text-muted-text font-normal">Optional</span>
                  </label>
                  <input
                    id="onboarding-age"
                    type="number"
                    min="1"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 32"
                    className="w-full min-h-[46px] px-4 py-2.5 text-body-md text-brand-dark bg-white border-2 border-brand-sage/45 rounded-[14px] hover:border-brand-sage/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/50 focus-visible:border-brand-teal shadow-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="onboarding-gender"
                    className="text-meta-md font-semibold text-brand-dark flex items-center justify-between mb-1.5"
                  >
                    <span>Gender</span>
                    <span className="text-meta-sm text-muted-text font-normal">Optional</span>
                  </label>
                  <select
                    id="onboarding-gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full min-h-[46px] px-4 py-2.5 text-body-md text-brand-dark bg-white border-2 border-brand-sage/45 rounded-[14px] hover:border-brand-sage/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/50 focus-visible:border-brand-teal shadow-sm cursor-pointer"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-[16px] bg-gradient-to-r from-[#FAF9F5] to-[#F1EFEA] border-2 border-brand-sage/45 text-meta-sm text-brand-dark flex items-center gap-3 shadow-sm">
              <ShieldCheck className="w-5 h-5 text-brand-teal flex-shrink-0" />
              <span>We use these parameters strictly for circadian and hormonal baseline context.</span>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 2: MIGRAINE HISTORY
           ========================================================================= */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="space-y-1.5 pb-2 border-b border-brand-sage/30">
              <h2 className="text-section-lg md:text-app-lg font-bold text-brand-dark">
                Migraine History
              </h2>
              <p className="text-body-md text-[#555B55] leading-relaxed">
                Understanding your past experiences helps calibrate sensitivity thresholds. We never make diagnostic conclusions.
              </p>
            </div>

            {/* Question 1: Have you experienced migraine attacks? */}
            <div className="space-y-2.5">
              <label className="text-body-md font-bold text-brand-dark block">
                Have you experienced migraine attacks?
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['Yes', 'No', 'Not sure'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setHasMigraines(opt)}
                    className={cn(
                      'p-3.5 rounded-[14px] border-2 text-body-md font-bold transition-all text-center cursor-pointer shadow-sm',
                      hasMigraines === opt
                        ? 'bg-brand-sage/25 text-brand-dark border-brand-teal ring-1 ring-brand-teal/40'
                        : 'bg-white/80 border-brand-sage/40 hover:bg-white hover:border-brand-sage text-brand-dark'
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Conditional Questions if Yes */}
            {hasMigraines === 'Yes' ? (
              <div className="space-y-6 pt-3 border-t border-brand-sage/30">
                {/* Question 2: Frequency */}
                <div className="space-y-2.5">
                  <label className="text-meta-md font-bold text-brand-dark block">
                    How often do you usually experience them?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      'Less than once a month',
                      '1–3 times a month',
                      '1–2 times a week',
                      '3 or more times a week',
                    ].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setFrequency(opt)}
                        className={cn(
                          'p-3.5 rounded-[14px] border-2 text-meta-md text-left transition-all flex items-center justify-between cursor-pointer',
                          frequency === opt
                            ? 'bg-white border-brand-teal text-brand-dark font-bold shadow-soft'
                            : 'bg-white/70 border-brand-sage/40 hover:bg-white hover:border-brand-sage text-[#555B55]'
                        )}
                      >
                        <span>{opt}</span>
                        {frequency === opt && <Check className="w-4 h-4 text-brand-teal" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question 3: Severity Slider */}
                <div className="space-y-3 bg-white/90 p-5 rounded-[18px] border-2 border-brand-sage/45 shadow-sm">
                  <div className="flex items-center justify-between">
                    <label className="text-meta-md font-bold text-brand-dark">
                      How severe are your typical attacks?
                    </label>
                    <Badge variant={severity >= 7 ? 'alert' : severity >= 4 ? 'teal' : 'sage'} size="sm">
                      {getSeverityLabel(severity)}
                    </Badge>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={severity}
                    onChange={(e) => setSeverity(Number(e.target.value))}
                    className="w-full accent-brand-dark h-2.5 bg-card-warm rounded-lg cursor-pointer"
                  />

                  <div className="flex justify-between text-[11px] text-[#666C66] font-semibold px-1">
                    <span>0 — Mild / None</span>
                    <span>5 — Moderate</span>
                    <span>10 — Severe / Incapacitating</span>
                  </div>
                </div>

                {/* Question 4: Duration */}
                <div className="space-y-2.5">
                  <label className="text-meta-md font-bold text-brand-dark block">
                    How long does a typical attack last?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      'Less than 4 hours',
                      '4–12 hours',
                      '12–24 hours',
                      'More than 24 hours',
                    ].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setDuration(opt)}
                        className={cn(
                          'p-3 rounded-[14px] border-2 text-meta-sm font-medium text-center transition-all cursor-pointer',
                          duration === opt
                            ? 'bg-brand-sage/25 text-brand-dark font-bold border-brand-teal shadow-soft'
                            : 'bg-white/70 border-brand-sage/40 hover:bg-white hover:border-brand-sage text-[#555B55]'
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question 5: Medication */}
                <div className="space-y-2.5">
                  <label className="text-meta-md font-bold text-brand-dark block">
                    Do you currently use medication for migraine?
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Yes', 'No', 'Prefer not to say'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setUsesMedication(opt)}
                        className={cn(
                          'p-3.5 rounded-[14px] border-2 text-meta-md text-center transition-all cursor-pointer',
                          usesMedication === opt
                            ? 'bg-brand-sage/25 text-brand-dark font-bold border-brand-teal shadow-soft'
                            : 'bg-white/70 border-brand-sage/40 hover:bg-white hover:border-brand-sage text-[#555B55]'
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-[18px] bg-gradient-to-r from-brand-sage/20 to-brand-teal/15 border-2 border-brand-sage/50 text-brand-dark space-y-2">
                <div className="flex items-center gap-2 font-bold text-meta-md">
                  <HeartHandshake className="w-5 h-5 text-brand-teal" />
                  <span>Personalized for general headache & tension wellness</span>
                </div>
                <p className="text-meta-sm text-[#484E48] leading-relaxed">
                  MigraineGuardian will focus on monitoring your everyday weather sensitivities, sleep restfulness, stress patterns, and hydration routines to help you stay balanced.
                </p>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            STEP 3: TRACKING PREFERENCES
           ========================================================================= */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-brand-sage/30">
              <div className="space-y-1">
                <h2 className="text-section-lg md:text-app-lg font-bold text-brand-dark">
                  Tracking Preferences
                </h2>
                <p className="text-body-md text-[#555B55]">
                  Select the lifestyle factors you'd like to log during your daily check-in.
                </p>
              </div>

              <button
                type="button"
                onClick={selectAllFactors}
                className="text-meta-sm font-bold text-brand-dark hover:text-brand-teal hover:underline self-start sm:self-auto cursor-pointer"
              >
                {selectedFactors.length === trackingOptions.length ? 'Reset selection' : 'Select all factors'}
              </button>
            </div>

            {/* 8 Factors Grid (All Selectable) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {trackingOptions.map((factor) => {
                const isSelected = selectedFactors.includes(factor.id);
                const Icon = factor.icon;
                return (
                  <button
                    key={factor.id}
                    type="button"
                    onClick={() => toggleFactor(factor.id)}
                    className={cn(
                      'p-4 rounded-[16px] border-2 text-left transition-all flex items-start gap-3.5 group cursor-pointer',
                      isSelected
                        ? 'bg-white border-brand-teal shadow-[0_4px_16px_-2px_rgba(111,153,144,0.2)]'
                        : 'bg-white/70 border-brand-sage/40 hover:bg-white hover:border-brand-sage text-[#555B55]'
                    )}
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors shadow-sm',
                        isSelected
                          ? 'bg-brand-teal/20 text-brand-teal-dark border border-brand-teal/40'
                          : 'bg-card-warm text-muted-text border border-brand-sage/30'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            'text-body-md font-bold',
                            isSelected ? 'text-brand-dark' : 'text-[#555B55]'
                          )}
                        >
                          {factor.label}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-brand-teal flex-shrink-0" />}
                      </div>
                      <span className="text-meta-sm text-[#666C66] block mt-0.5 leading-snug">
                        {factor.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-4 rounded-[16px] bg-white/80 border-2 border-brand-sage/45 text-meta-sm text-[#555B55] flex items-center justify-between shadow-sm">
              <span>Selected Factors for Daily Micro-Checkin:</span>
              <span className="font-bold text-brand-dark">{selectedFactors.length} Active Factors</span>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 4: PSS ASSESSMENT BRIDGE
           ========================================================================= */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="space-y-1.5 pb-2 border-b border-brand-sage/30">
              <Badge variant="sage" size="sm">
                Final Step
              </Badge>
              <h2 className="text-section-lg md:text-app-lg font-bold text-brand-dark">
                Perceived Stress Scale (PSS-10)
              </h2>
              <p className="text-body-md text-[#555B55] leading-relaxed">
                Stress is one of the most significant autonomic influences on migraine vulnerability. Taking our clinically validated 10-question evaluation helps establish your baseline stress index.
              </p>
            </div>

            {/* Summary Review Card */}
            <div className="p-5 sm:p-6 rounded-[20px] bg-white border-2 border-brand-sage/50 shadow-soft space-y-3.5">
              <span className="text-meta-sm font-bold uppercase tracking-wider text-brand-teal block">
                Calibrated Health Profile
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-meta-md">
                <div className="p-3 rounded-[14px] bg-card-warm/60 border border-brand-sage/35">
                  <span className="text-meta-sm text-muted-text block">Name:</span>
                  <span className="font-bold text-brand-dark">{name}</span>
                </div>
                <div className="p-3 rounded-[14px] bg-card-warm/60 border border-brand-sage/35">
                  <span className="text-meta-sm text-muted-text block">Migraine History:</span>
                  <span className="font-bold text-brand-dark">{hasMigraines === 'Yes' ? frequency : 'General Wellness'}</span>
                </div>
                <div className="p-3 rounded-[14px] bg-card-warm/60 border border-brand-sage/35">
                  <span className="text-meta-sm text-muted-text block">Active Factors:</span>
                  <span className="font-bold text-brand-dark">{selectedFactors.length} Monitored</span>
                </div>
              </div>
            </div>

            {/* PSS Option Actions */}
            <div className="p-6 sm:p-8 rounded-[20px] bg-gradient-to-r from-brand-sage/20 to-brand-teal/15 border-2 border-brand-sage/50 space-y-4 shadow-sm">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-brand-teal/20 border border-brand-teal/40 flex items-center justify-center text-brand-dark flex-shrink-0 mt-0.5">
                  <ClipboardList className="w-5 h-5 text-brand-teal" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-section-md font-bold text-brand-dark">
                    Take the 3-Minute Stress Evaluation Now
                  </h3>
                  <p className="text-meta-md text-[#484E48] leading-relaxed">
                    Completing this 10-item questionnaire now provides immediate calibration for your upcoming risk forecasts.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleStartPss}
                  iconRight={ArrowRight}
                  className="flex-1 shadow-md"
                >
                  Start PSS Assessment
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleSkipToDashboard}
                  className="flex-1"
                >
                  Complete Later & Go to Dashboard
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            BOTTOM NAVIGATION BAR (Back / Continue)
           ========================================================================= */}
        <div className="flex items-center justify-between pt-6 border-t border-brand-sage/30">
          {step > 1 ? (
            <Button
              variant="outline"
              size="md"
              onClick={handleBack}
              icon={ArrowLeft}
            >
              Back
            </Button>
          ) : (
            <Link to={ROUTES.HOME}>
              <Button variant="ghost" size="md">
                Cancel
              </Button>
            </Link>
          )}

          {step < 4 ? (
            <Button
              variant="primary"
              size="lg"
              onClick={handleNext}
              iconRight={ArrowRight}
              className="shadow-md"
            >
              Continue to Step {step + 1}
            </Button>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
