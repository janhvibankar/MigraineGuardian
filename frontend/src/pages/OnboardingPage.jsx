import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { ROUTES } from '../utils/constants';
import { authService } from '../services/authService';
import { auth } from '../config/firebase';
import { useTranslation } from '../hooks/useTranslation';
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
  Lock,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '../utils/cn';

export function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const guestDraft = authService.getGuestOnboarding();

  // Multi-step state (1 to 4)
  const [step, setStep] = useState(1);
  const [showAuthChoiceModal, setShowAuthChoiceModal] = useState(false);
  const [authModalType, setAuthModalType] = useState('pss'); // 'pss' | 'completeLater'
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Step 1: About You - Always start clean from guestDraft
  const [name, setName] = useState(() => guestDraft?.name || '');
  const [age, setAge] = useState(() => guestDraft?.age || '25-34');
  const [gender, setGender] = useState(() => guestDraft?.gender || 'Female');
  const [step1Error, setStep1Error] = useState('');

  // Step 2: Migraine History
  const [hasMigraines, setHasMigraines] = useState(() => guestDraft?.hasMigraines || 'Yes');
  const [frequency, setFrequency] = useState(() => guestDraft?.frequency || '1–3 times a month');
  const [severity, setSeverity] = useState(() => guestDraft?.severity ?? 6); // 0-10
  const [duration, setDuration] = useState(() => guestDraft?.duration || '4–12 hours');
  const [usesMedication, setUsesMedication] = useState(() => guestDraft?.usesMedication || 'Yes');

  // Step 3: Tracking Preferences
  const [selectedFactors, setSelectedFactors] = useState(() => guestDraft?.selectedFactors || [
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

  const saveCurrentProgress = () => {
    const updatedName = name.trim();
    const payload = {
      name: updatedName,
      age,
      gender,
      hasMigraines,
      frequency,
      severity,
      duration,
      usesMedication,
      selectedFactors,
    };

    authService.saveGuestOnboarding(payload);
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

    saveCurrentProgress();

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
    saveCurrentProgress();
    setAuthError(null);
    setAuthModalType('pss');
    setShowAuthChoiceModal(true);
  };

  const handleCompleteLater = () => {
    saveCurrentProgress();
    setAuthError(null);
    setAuthModalType('completeLater');
    setShowAuthChoiceModal(true);
  };

  // Authenticated user confirmation handlers
  const handleContinueAsCurrent = async () => {
    setIsSubmittingAuth(true);
    setAuthError(null);
    try {
      await authService.transferGuestOnboardingToUser();
      setIsSubmittingAuth(false);
      setShowAuthChoiceModal(false);
      if (authModalType === 'pss') {
        navigate(ROUTES.PSS_ASSESSMENT, { state: { fromOnboarding: true } });
      } else {
        navigate(ROUTES.DASHBOARD);
      }
    } catch (err) {
      setIsSubmittingAuth(false);
      setAuthError(err.message || 'Failed to link setup to your account. Please try again.');
    }
  };

  const handleSignInDifferent = async () => {
    await authService.logout();
    setShowAuthChoiceModal(false);
    navigate(ROUTES.LOGIN, {
      state: {
        redirectTo: authModalType === 'pss' ? ROUTES.PSS_ASSESSMENT : ROUTES.DASHBOARD,
        fromOnboarding: true,
      },
    });
  };

  const handleCreateNewAccount = async () => {
    await authService.logout();
    setShowAuthChoiceModal(false);
    navigate(ROUTES.SIGNUP, {
      state: {
        redirectTo: authModalType === 'pss' ? ROUTES.PSS_ASSESSMENT : ROUTES.DASHBOARD,
        fromOnboarding: true,
      },
    });
  };

  const handleGoogleSignIn = async () => {
    setIsSubmittingAuth(true);
    setAuthError(null);
    try {
      const res = await authService.loginWithGoogle();
      setIsSubmittingAuth(false);
      if (res.success) {
        setShowAuthChoiceModal(false);
        if (authModalType === 'pss') {
          navigate(ROUTES.PSS_ASSESSMENT, { state: { fromOnboarding: true } });
        } else {
          navigate(ROUTES.DASHBOARD);
        }
      } else {
        setAuthError(res.error || 'Google sign-in failed. Please try again.');
      }
    } catch (err) {
      setIsSubmittingAuth(false);
      setAuthError(err.message || 'Google sign-in encountered an error.');
    }
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
    return `Extreme (${val}/10)`;
  };

  const currentEmail = auth?.currentUser?.email || (authService.isAuthenticated() ? authService.getCurrentUser()?.email : null);

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4 sm:py-6 text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-brand-sage/30">
        <div>
          <h1 className="text-section-lg sm:text-app-xl font-bold text-brand-dark tracking-tight">
            {t('onboarding.title')}
          </h1>
          <p className="text-body-md text-[#555B55] mt-0.5">
            {t('onboarding.stepOf', { step, title: stepsMeta[step - 1].title })}
          </p>
        </div>
        <Badge variant="teal" size="md">
          {t('onboarding.personalizedSetup')}
        </Badge>
      </div>

      {/* Steps Pill Navigator */}
      <div className="grid grid-cols-4 gap-2">
        {stepsMeta.map((s) => {
          const Icon = s.icon;
          const isDone = s.num < step;
          const isCurrent = s.num === step;
          return (
            <div
              key={s.num}
              className={cn(
                'p-2.5 sm:p-3 rounded-[16px] border-2 transition-all flex items-center gap-2 select-none shadow-sm',
                isCurrent
                  ? 'bg-white border-brand-teal text-brand-dark shadow-[0_4px_16px_-2px_rgba(111,153,144,0.25)]'
                  : isDone
                  ? 'bg-brand-sage/20 border-brand-sage/50 text-brand-dark'
                  : 'bg-white/60 border-brand-sage/30 text-muted-text opacity-70'
              )}
            >
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-meta-sm font-bold flex-shrink-0',
                  isCurrent
                    ? 'bg-brand-teal text-white'
                    : isDone
                    ? 'bg-brand-sage text-brand-dark'
                    : 'bg-card-warm text-muted-text'
                )}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : s.num}
              </div>
              <span className="text-meta-sm font-bold truncate hidden sm:inline">
                {s.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Main Multi-Step Form Card */}
      <Card variant="warm" className="p-6 sm:p-9 space-y-6 shadow-[0_12px_40px_-10px_rgba(38,53,47,0.08)] border-2 border-brand-sage/60 rounded-[24px]">
        {/* =========================================================================
            STEP 1: ABOUT YOU
           ========================================================================= */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="space-y-1 pb-2 border-b border-brand-sage/30">
              <h2 className="text-section-lg font-bold text-brand-dark">
                {t('onboarding.aboutYouTitle')}
              </h2>
              <p className="text-body-md text-[#555B55]">
                {t('onboarding.aboutYouSub')}
              </p>
            </div>

            <div className="space-y-4 pt-1">
              <Input
                label={t('onboarding.yourPreferredName')}
                id="onboarding-name"
                name="name"
                type="text"
                icon={User}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (step1Error) setStep1Error('');
                }}
                placeholder="e.g. Alex"
                errorText={step1Error}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-meta-sm font-semibold text-brand-dark">
                    {t('onboarding.ageGroup')}
                  </label>
                  <select
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[12px] bg-white border border-brand-sage/50 text-body-md text-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal"
                  >
                    <option value="18-24">18–24 years</option>
                    <option value="25-34">25–34 years</option>
                    <option value="35-44">35–44 years</option>
                    <option value="45-54">45–54 years</option>
                    <option value="55-64">55–64 years</option>
                    <option value="65+">65+ years</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-meta-sm font-semibold text-brand-dark">
                    {t('onboarding.genderIdentity')}
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[12px] bg-white border border-brand-sage/50 text-body-md text-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal"
                  >
                    <option value="Female">{t('onboarding.female', 'Female')}</option>
                    <option value="Male">{t('onboarding.male', 'Male')}</option>
                    <option value="Non-binary">{t('onboarding.nonBinary', 'Non-binary')}</option>
                    <option value="Prefer not to say">{t('onboarding.preferNotToSay', 'Prefer not to say')}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 2: MIGRAINE HISTORY
           ========================================================================= */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="space-y-1 pb-2 border-b border-brand-sage/30">
              <h2 className="text-section-lg font-bold text-brand-dark">
                {t('onboarding.migraineExpTitle')}
              </h2>
              <p className="text-body-md text-[#555B55]">
                {t('onboarding.migraineExpSub')}
              </p>
            </div>

            <div className="space-y-5 pt-1">
              {/* Do you experience migraines? */}
              <div className="space-y-2">
                <label className="text-meta-sm font-semibold text-brand-dark block">
                  {t('onboarding.doYouExperienceMigraines')}
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { val: 'Yes', label: t('common.yes') },
                    { val: 'No', label: t('common.no') },
                    { val: 'Not sure', label: t('onboarding.notSure', 'Not sure') },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setHasMigraines(opt.val)}
                      className={cn(
                        'py-2.5 px-3 rounded-[12px] border-2 text-meta-md font-bold transition-all cursor-pointer text-center',
                        hasMigraines === opt.val
                          ? 'bg-brand-dark text-white border-brand-dark shadow-sm'
                          : 'bg-white text-brand-dark border-brand-sage/40 hover:border-brand-teal'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Typical Frequency */}
              <div className="space-y-2">
                <label className="text-meta-sm font-semibold text-brand-dark block">
                  {t('onboarding.typicalFrequency')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { val: 'Less than once a month', label: t('onboarding.freqLessMonthly', 'Less than once a month') },
                    { val: '1–3 times a month', label: t('onboarding.freq1to3Monthly', '1–3 times a month') },
                    { val: '1–2 times a week', label: t('onboarding.freq1to2Weekly', '1–2 times a week') },
                    { val: '3+ times a week / Chronic', label: t('onboarding.freq3PlusWeekly', '3+ times a week / Chronic') },
                  ].map((freq) => (
                    <button
                      key={freq.val}
                      type="button"
                      onClick={() => setFrequency(freq.val)}
                      className={cn(
                        'p-3 rounded-[14px] border-2 text-meta-md font-semibold text-left transition-all cursor-pointer flex items-center justify-between',
                        frequency === freq.val
                          ? 'bg-white border-brand-teal text-brand-dark ring-2 ring-brand-teal/20 shadow-sm font-bold'
                          : 'bg-white/80 border-brand-sage/40 hover:bg-white text-[#555B55]'
                      )}
                    >
                      <span>{freq.label}</span>
                      {frequency === freq.val && <Check className="w-4 h-4 text-brand-teal" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Severity Slider */}
              <div className="p-4 rounded-[18px] bg-white border-2 border-brand-sage/45 space-y-2">
                <div className="flex items-center justify-between text-meta-md">
                  <span className="font-bold text-brand-dark">{t('onboarding.typicalSeverity')}</span>
                  <span className="font-extrabold text-brand-dark text-section-md">
                    {getSeverityLabel(severity)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={severity}
                  onChange={(e) => setSeverity(parseInt(e.target.value, 10))}
                  className="w-full accent-brand-dark h-2 bg-brand-sage/30 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-[#666C66] font-semibold">
                  <span>{t('onboarding.severityNoPain')}</span>
                  <span>{t('onboarding.severityModPain')}</span>
                  <span>{t('onboarding.severityDebilitating')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 3: TRACKING PREFERENCES
           ========================================================================= */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-brand-sage/30">
              <div>
                <h2 className="text-section-lg font-bold text-brand-dark">
                  {t('onboarding.chooseActiveFactors')}
                </h2>
                <p className="text-body-md text-[#555B55]">
                  {t('onboarding.chooseActiveFactorsSub')}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={selectAllFactors}
                className="text-brand-teal hover:text-brand-dark font-semibold"
              >
                {selectedFactors.length === trackingOptions.length ? t('onboarding.reset') : t('onboarding.selectAll')}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {trackingOptions.map((item) => {
                const Icon = item.icon;
                const isSelected = selectedFactors.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleFactor(item.id)}
                    className={cn(
                      'p-3.5 rounded-[16px] border-2 text-left transition-all cursor-pointer flex items-start gap-3 select-none',
                      isSelected
                        ? 'bg-white border-brand-teal shadow-sm text-brand-dark'
                        : 'bg-white/70 border-brand-sage/35 text-muted-text hover:bg-white hover:border-brand-sage'
                    )}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors',
                        isSelected ? 'bg-brand-teal/20 text-brand-dark' : 'bg-card-warm text-muted-text'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-meta-md font-bold text-brand-dark truncate">
                          {item.label}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-brand-teal flex-shrink-0" />}
                      </div>
                      <p className="text-[12px] text-[#666C66] line-clamp-1">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
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
                {t('onboarding.finalStepBadge')}
              </Badge>
              <h2 className="text-section-lg md:text-app-lg font-bold text-brand-dark">
                {t('onboarding.pssTitle')}
              </h2>
              <p className="text-body-md text-[#555B55] leading-relaxed">
                {t('onboarding.pssDesc')}
              </p>
            </div>

            {/* Summary Review Card */}
            <div className="p-5 sm:p-6 rounded-[20px] bg-white border-2 border-brand-sage/50 shadow-soft space-y-3.5">
              <span className="text-meta-sm font-bold uppercase tracking-wider text-brand-teal block">
                {t('onboarding.calibratedProfile')}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-meta-md">
                <div className="p-3 rounded-[14px] bg-card-warm/60 border border-brand-sage/35">
                  <span className="text-meta-sm text-muted-text block">{t('onboarding.nameLabel')}</span>
                  <span className="font-bold text-brand-dark">{name}</span>
                </div>
                <div className="p-3 rounded-[14px] bg-card-warm/60 border border-brand-sage/35">
                  <span className="text-meta-sm text-muted-text block">{t('onboarding.migraineHistoryLabel')}</span>
                  <span className="font-bold text-brand-dark">{hasMigraines === 'Yes' ? frequency : 'General Wellness'}</span>
                </div>
                <div className="p-3 rounded-[14px] bg-card-warm/60 border border-brand-sage/35">
                  <span className="text-meta-sm text-muted-text block">{t('onboarding.activeFactorsLabel')}</span>
                  <span className="font-bold text-brand-dark">{t('onboarding.factorsMonitored', { count: selectedFactors.length })}</span>
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
                    {t('onboarding.takeStressEvalNow')}
                  </h3>
                  <p className="text-meta-md text-[#484E48] leading-relaxed">
                    {t('onboarding.takeStressEvalDesc')}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleStartPss}
                  iconRight={ArrowRight}
                  className="flex-1 shadow-md font-bold"
                >
                  {t('onboarding.startPssAssessment')}
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleCompleteLater}
                  className="flex-1"
                >
                  {t('onboarding.completeLater')}
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
              {t('common.back')}
            </Button>
          ) : (
            <Link to={ROUTES.HOME}>
              <Button variant="ghost" size="md">
                {t('common.cancel')}
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
              {t('onboarding.continueToStep', { next: step + 1 })}
            </Button>
          ) : null}
        </div>
      </Card>

      {/* Explicit Authentication Boundary Modal */}
      {showAuthChoiceModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border-2 border-brand-sage/60 rounded-[24px] p-6 sm:p-8 max-w-md w-full space-y-5 shadow-soft-lg text-center">
            <div className="w-12 h-12 rounded-2xl bg-brand-teal/20 border border-brand-teal/40 flex items-center justify-center mx-auto text-brand-teal mb-2">
              <ShieldCheck className="w-6 h-6" />
            </div>

            {currentEmail ? (
              /* Active Firebase Session Detected in Browser */
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-section-md font-bold text-brand-dark">
                    Confirm Account Connection
                  </h3>
                  <div className="p-3 bg-brand-sage/20 rounded-[14px] border border-brand-sage/40 text-meta-sm text-brand-dark font-medium">
                    Signed in as: <span className="font-bold">{currentEmail}</span>
                  </div>
                  <p className="text-body-md text-[#555B55] leading-relaxed">
                    Would you like to save this new setup to your current account, or continue with a different profile?
                  </p>
                </div>

                {authError && (
                  <div className="p-3 rounded-[12px] bg-alert-muted/15 border border-alert-muted/30 text-[#8F443B] text-meta-sm font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <div className="space-y-2.5 pt-1">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleContinueAsCurrent}
                    disabled={isSubmittingAuth}
                    className="w-full shadow-md font-bold"
                    iconRight={isSubmittingAuth ? Loader2 : ArrowRight}
                  >
                    {isSubmittingAuth ? 'Saving to Account...' : `Continue as ${currentEmail}`}
                  </Button>

                  <Button
                    variant="secondary"
                    size="md"
                    onClick={handleSignInDifferent}
                    disabled={isSubmittingAuth}
                    className="w-full"
                  >
                    {t('auth.signInDifferent', 'Sign In with Different Account')}
                  </Button>

                  <Button
                    variant="outline"
                    size="md"
                    onClick={handleCreateNewAccount}
                    disabled={isSubmittingAuth}
                    className="w-full border-brand-sage/50"
                  >
                    {t('auth.createNewAccount', 'Create New Account')}
                  </Button>

                  <div className="pt-2 flex flex-col items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAuthChoiceModal(false)}
                      className="text-meta-sm text-muted-text hover:text-brand-dark font-medium transition-colors cursor-pointer"
                    >
                      {t('auth.keepEditing', 'Keep Editing Setup')}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Unauthenticated Guest Flow */
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-section-md font-bold text-brand-dark">
                    {authModalType === 'pss'
                      ? t('auth.guestPssTitle', 'Sign In to Begin PSS Calibration')
                      : t('auth.guestDashboardTitle', 'Sign In to Access Your Dashboard')}
                  </h3>
                  <p className="text-body-md text-[#555B55] leading-relaxed">
                    {authModalType === 'pss'
                      ? t('auth.guestPssDesc', 'To take your clinical baseline stress evaluation and link your calibration to your health records, please create a free account or sign in. Your onboarding answers are safely preserved.')
                      : t('auth.guestDashboardDesc', 'To access your personalized dashboard, record daily check-ins, and receive predictive risk forecasts, please create a free account or sign in. Your calibration responses have been safely saved.')}
                  </p>
                </div>

                {authError && (
                  <div className="p-3 rounded-[12px] bg-alert-muted/15 border border-alert-muted/30 text-[#8F443B] text-meta-sm font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <div className="space-y-2.5 pt-1">
                  <Link
                    to={ROUTES.SIGNUP}
                    state={{
                      redirectTo: authModalType === 'pss' ? ROUTES.PSS_ASSESSMENT : ROUTES.DASHBOARD,
                      fromOnboarding: true,
                    }}
                    className="block"
                  >
                    <Button variant="primary" size="lg" className="w-full shadow-md font-bold" iconRight={ArrowRight}>
                      {t('common.createFreeAccount')}
                    </Button>
                  </Link>
                  <Link
                    to={ROUTES.LOGIN}
                    state={{
                      redirectTo: authModalType === 'pss' ? ROUTES.PSS_ASSESSMENT : ROUTES.DASHBOARD,
                      fromOnboarding: true,
                    }}
                    className="block"
                  >
                    <Button variant="secondary" size="md" className="w-full">
                      {t('nav.signIn')}
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    size="md"
                    onClick={handleGoogleSignIn}
                    disabled={isSubmittingAuth}
                    className="w-full border-brand-sage/50"
                  >
                    {isSubmittingAuth ? t('onboarding.connectingGoogle', 'Connecting Google...') : t('auth.googleSignIn')}
                  </Button>

                  <div className="pt-2 flex flex-col items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAuthChoiceModal(false)}
                      className="text-meta-sm text-muted-text hover:text-brand-dark font-medium transition-colors cursor-pointer"
                    >
                      {t('auth.keepEditing', 'Keep Editing Setup')}
                    </button>
                    <Link
                      to={ROUTES.HOME}
                      className="text-meta-sm text-muted-text hover:text-brand-dark transition-colors"
                    >
                      {t('auth.backToOverview')}
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default OnboardingPage;
