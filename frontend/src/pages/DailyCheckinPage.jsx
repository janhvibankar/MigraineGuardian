import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ROUTES } from '../utils/constants';
import { trackingService } from '../services/trackingService';
import { weatherService } from '../services/weatherService';
import {
  Moon,
  Brain,
  Smile,
  SunMedium,
  Droplets,
  Utensils,
  Coffee,
  Dumbbell,
  Activity,
  Check,
  CheckCircle2,
  CalendarCheck,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ClipboardList,
  CloudSun,
  MapPin,
} from 'lucide-react';
import { cn } from '../utils/cn';

export function DailyCheckinPage() {
  const navigate = useNavigate();

  // Load existing or default values via trackingService
  const savedDraft = trackingService.getTodayLog();

  // Section 1: Sleep
  const [sleepHours, setSleepHours] = useState(savedDraft?.sleep_hours ?? savedDraft?.sleepHours ?? 7.5);
  const [sleepQuality, setSleepQuality] = useState(savedDraft?.sleep_quality ?? savedDraft?.sleepQuality ?? 4); // 1-5

  // Section 2: Stress (Daily stress, NOT PSS-10)
  const [dailyStress, setDailyStress] = useState(savedDraft?.daily_stress ?? savedDraft?.dailyStress ?? 4); // 0-10

  // Section 3: Mood
  const [mood, setMood] = useState(savedDraft?.mood ?? 4); // 1-5

  // Section 4: Screen Time
  const [screenHours, setScreenHours] = useState(savedDraft?.screen_time ?? savedDraft?.screenHours ?? 6.5);

  // Section 5: Hydration
  const [hydrationLiters, setHydrationLiters] = useState(savedDraft?.hydration ?? savedDraft?.hydrationLiters ?? 2.2);

  // Section 6: Meals
  const [skippedMeal, setSkippedMeal] = useState(savedDraft?.meal_skipped ?? savedDraft?.skippedMeal ?? 'No');

  // Section 7: Optional Lifestyle
  const [showOptionalLifestyle, setShowOptionalLifestyle] = useState(true);
  const [caffeineIntake, setCaffeineIntake] = useState(savedDraft?.caffeine ?? savedDraft?.caffeineIntake ?? '1 cup');
  const [exerciseLevel, setExerciseLevel] = useState(savedDraft?.exercise ?? savedDraft?.exerciseLevel ?? 'Light walk / gentle stretch');

  // Section 8: Migraine Experience
  const [hadMigraine, setHadMigraine] = useState(savedDraft?.migraine_occurrence ? 'Yes' : savedDraft?.hadMigraine ?? 'No');
  const [migraineSeverity, setMigraineSeverity] = useState(savedDraft?.migraine_severity ?? savedDraft?.migraineSeverity ?? 5);
  const [migraineDuration, setMigraineDuration] = useState(savedDraft?.migraine_duration ?? savedDraft?.migraineDuration ?? '2–4 hours');
  const [migraineSymptoms, setMigraineSymptoms] = useState(savedDraft?.symptoms ?? savedDraft?.migraineSymptoms ?? ['Light sensitivity']);

  // Section 9: Weather & Environmental Context State
  const [weatherData, setWeatherData] = useState(null);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  const [weatherNotice, setWeatherNotice] = useState(null);

  // Completion & Error State
  const [isSaved, setIsSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    async function loadLog() {
      const todayData = await trackingService.fetchTodayLog();
      if (todayData) {
        if (todayData.sleep_hours !== undefined) setSleepHours(todayData.sleep_hours);
        if (todayData.sleep_quality !== undefined) setSleepQuality(todayData.sleep_quality);
        if (todayData.daily_stress !== undefined) setDailyStress(todayData.daily_stress);
        if (todayData.mood !== undefined) setMood(todayData.mood);
        if (todayData.screen_time !== undefined) setScreenHours(todayData.screen_time);
        if (todayData.hydration !== undefined) setHydrationLiters(todayData.hydration);
        if (todayData.meal_skipped !== undefined) setSkippedMeal(todayData.meal_skipped);
        if (todayData.caffeine !== undefined) setCaffeineIntake(todayData.caffeine);
        if (todayData.exercise !== undefined) setExerciseLevel(todayData.exercise);
        if (todayData.migraine_occurrence !== undefined) setHadMigraine(todayData.migraine_occurrence ? 'Yes' : 'No');
        if (todayData.migraine_severity !== undefined && todayData.migraine_severity !== null) setMigraineSeverity(todayData.migraine_severity);
        if (todayData.migraine_duration !== undefined && todayData.migraine_duration !== null) setMigraineDuration(todayData.migraine_duration);
        if (todayData.symptoms !== undefined && Array.isArray(todayData.symptoms)) setMigraineSymptoms(todayData.symptoms);
      }

      // Check for today's recorded weather context
      const existingWeather = await weatherService.fetchTodayWeather();
      if (existingWeather) {
        setWeatherData(existingWeather);
      }
    }
    loadLog();
  }, []);

  const handleDetectWeather = async () => {
    setIsFetchingWeather(true);
    setWeatherNotice(null);

    const locRes = await weatherService.requestBrowserLocation();
    if (!locRes.success) {
      setIsFetchingWeather(false);
      setWeatherNotice(locRes.message || "Location access was not provided. Today's risk assessment can continue without local weather data.");
      return;
    }

    const weatherRes = await weatherService.fetchCurrentWeather(locRes.coords.latitude, locRes.coords.longitude);
    setIsFetchingWeather(false);

    if (weatherRes.success && weatherRes.data) {
      setWeatherData(weatherRes.data);
      setWeatherNotice(null);
    } else {
      setWeatherNotice(weatherRes.message || "Location access was not provided. Today's risk assessment can continue without local weather data.");
    }
  };


  // Sleep Quality Options (1-5)
  const sleepQualityOptions = [
    { value: 1, label: 'Very Poor' },
    { value: 2, label: 'Poor' },
    { value: 3, label: 'Fair' },
    { value: 4, label: 'Restful' },
    { value: 5, label: 'Very Restful' },
  ];

  // Mood Options (1-5) with accessible text labels
  const moodOptions = [
    { value: 1, label: 'Very Low / Exhausted' },
    { value: 2, label: 'Low / Tense' },
    { value: 3, label: 'Neutral / Steady' },
    { value: 4, label: 'Pleasant / Calm' },
    { value: 5, label: 'Uplifted / Energetic' },
  ];

  // Meals Options
  const mealOptions = ['No', 'Breakfast', 'Lunch', 'Dinner', 'More than one'];

  // Symptom Options
  const symptomOptions = [
    'Nausea',
    'Light sensitivity',
    'Sound sensitivity',
    'Aura',
    'Neck tension',
    'Other',
  ];

  const toggleSymptom = (sym) => {
    if (migraineSymptoms.includes(sym)) {
      setMigraineSymptoms(migraineSymptoms.filter((s) => s !== sym));
    } else {
      setMigraineSymptoms([...migraineSymptoms, sym]);
    }
  };

  const getStressLabel = (val) => {
    if (val <= 2) return `Low (${val}/10) — Serene`;
    if (val <= 5) return `Moderate (${val}/10) — Manageable`;
    if (val <= 7) return `Elevated (${val}/10) — Noticeable load`;
    return `High (${val}/10) — Heavy strain`;
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    setIsSubmitting(true);
    setServerError(null);

    // Auto-detect location & weather context if not fetched yet
    let currentWeatherData = weatherData;
    if (!currentWeatherData) {
      try {
        console.log('[Weather] Auto-detecting location & weather context during check-in save...');
        const locRes = await weatherService.requestBrowserLocation();
        if (locRes.success && locRes.coords) {
          const weatherRes = await weatherService.fetchCurrentWeather(
            locRes.coords.latitude,
            locRes.coords.longitude
          );
          if (weatherRes.success && weatherRes.data) {
            currentWeatherData = weatherRes.data;
            setWeatherData(weatherRes.data);
          }
        } else {
          console.log('[Weather] Location access not granted — proceeding with lifestyle check-in save.');
        }
      } catch (wErr) {
        console.warn('[Weather] Non-blocking error during weather check-in save:', wErr.message);
      }
    }

    const logData = {
      sleep_hours: sleepHours,
      sleep_quality: sleepQuality,
      daily_stress: dailyStress,
      mood,
      screen_time: screenHours,
      hydration: hydrationLiters,
      meal_skipped: skippedMeal,
      caffeine: caffeineIntake,
      exercise: exerciseLevel,
      migraine_occurrence: hadMigraine === 'Yes',
      migraine_severity: hadMigraine === 'Yes' ? migraineSeverity : null,
      migraine_duration: hadMigraine === 'Yes' ? migraineDuration : null,
      symptoms: hadMigraine === 'Yes' ? migraineSymptoms : [],
    };

    const res = await trackingService.saveDailyCheckin(logData);
    setIsSubmitting(false);

    if (res && res.error) {
      const errMsg = Array.isArray(res.error.details)
        ? res.error.details.join(' ')
        : res.error.message || 'Error saving check-in.';
      setServerError(errMsg);
    } else {
      setIsSaved(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };


  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <PageHeader
        title="How are you feeling today?"
        subtitle="Your daily check-in helps MigraineGuardian understand your personal patterns."
        badge="1–2 Minute Check-in"
        actions={
          <Link to={ROUTES.DASHBOARD}>
            <Button variant="secondary" size="md">
              Dashboard
            </Button>
          </Link>
        }
      />

      {/* Confirmation View after Saving */}
      {isSaved ? (
        <Card variant="warm" className="p-8 sm:p-10 space-y-6 text-center border-brand-sage/50 shadow-soft-lg animate-in fade-in duration-300">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-sage/20 border border-brand-sage/40 flex items-center justify-center text-brand-dark mb-2">
            <CheckCircle2 className="w-8 h-8 text-brand-teal" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-section-lg sm:text-app-lg font-semibold text-brand-dark">
              Today's check-in has been recorded.
            </h2>
            <p className="text-body-md text-muted-text leading-relaxed">
              Your insights will update as more information is collected.
            </p>
          </div>

          {/* Quick Summary of today's logged baseline */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-meta-md text-left pt-2">
            <div className="p-3 rounded-card-sm bg-white border border-muted-border">
              <span className="text-meta-sm text-muted-text block">Sleep:</span>
              <span className="font-semibold text-brand-dark">{sleepHours}h ({sleepQualityOptions.find(o => o.value === sleepQuality)?.label})</span>
            </div>
            <div className="p-3 rounded-card-sm bg-white border border-muted-border">
              <span className="text-meta-sm text-muted-text block">Daily Stress:</span>
              <span className="font-semibold text-brand-dark">{dailyStress} / 10</span>
            </div>
            <div className="p-3 rounded-card-sm bg-white border border-muted-border">
              <span className="text-meta-sm text-muted-text block">Hydration:</span>
              <span className="font-semibold text-brand-dark">{hydrationLiters} L</span>
            </div>
            <div className="p-3 rounded-card-sm bg-white border border-muted-border">
              <span className="text-meta-sm text-muted-text block">Migraine:</span>
              <span className="font-semibold text-brand-dark">{hadMigraine === 'Yes' ? 'Episode Logged' : 'None'}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-muted-border/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <Link to={ROUTES.DASHBOARD} className="flex-1">
              <Button variant="primary" size="lg" className="w-full" iconRight={ArrowRight}>
                Go to Dashboard
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
              onClick={() => setIsSaved(false)}
              icon={RotateCcw}
            >
              Edit Today's Check-in
            </Button>
          </div>
        </Card>
      ) : (
        /* =========================================================================
           PROGRESSIVE CHECK-IN FORM
           ========================================================================= */
        <form onSubmit={handleSave} className="space-y-6">
          {serverError && (
            <div className="p-4 rounded-card-sm bg-alert-muted/15 border border-alert-muted/40 text-brand-dark flex items-center gap-3 animate-in fade-in duration-200">
              <span className="font-semibold text-meta-md">Error: {serverError}</span>
            </div>
          )}

          {/* SECTION 1: SLEEP */}
          <Card variant="warm" className="p-6 sm:p-7 space-y-5 border-card-warm-border shadow-soft">
            <div className="flex items-center justify-between pb-3 border-b border-muted-border/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-sage/20 border border-brand-sage/35 flex items-center justify-center text-brand-dark">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-section-md font-semibold text-brand-dark">
                    Section 1 — Sleep
                  </h3>
                  <span className="text-meta-sm text-muted-text">Rest duration & restorative quality</span>
                </div>
              </div>
              <Badge variant="sage" size="sm">
                {sleepHours}h Logged
              </Badge>
            </div>

            {/* Sleep Slider */}
            <div className="space-y-2 bg-white/70 p-4 rounded-card-sm border border-muted-border">
              <div className="flex items-center justify-between">
                <label className="text-body-md font-medium text-brand-dark">
                  How long did you sleep last night?
                </label>
                <span className="text-app-lg font-bold text-brand-dark">
                  {sleepHours} hrs
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="12"
                step="0.5"
                value={sleepHours}
                onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                className="w-full accent-brand-dark h-2.5 bg-card-warm rounded-lg cursor-pointer"
              />

              <div className="flex justify-between text-[11px] text-muted-text font-medium px-1">
                <span>0h</span>
                <span>4h</span>
                <span>7.5h (Target)</span>
                <span>10h</span>
                <span>12h</span>
              </div>
            </div>

            {/* Sleep Quality 1-5 */}
            <div className="space-y-2.5">
              <label className="text-meta-md font-medium text-brand-dark block">
                How would you rate your sleep quality?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 [&>*:last-child]:col-span-2 sm:[&>*:last-child]:col-span-1">
                {sleepQualityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSleepQuality(opt.value)}
                    className={cn(
                      'p-3 rounded-card-sm border text-center transition-all min-h-[48px] flex flex-col items-center justify-center',
                      sleepQuality === opt.value
                        ? 'bg-brand-sage/25 text-brand-dark font-bold border-brand-sage/60 ring-1 ring-brand-sage/40 shadow-soft'
                        : 'bg-white/70 border-muted-border hover:bg-white text-brand-dark'
                    )}
                  >
                    <span className="text-body-md font-bold">{opt.value}</span>
                    <span className="text-[11px] mt-0.5 opacity-90">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* SECTION 2: STRESS (Daily Stress, NOT PSS-10) */}
          <Card variant="warm" className="p-6 sm:p-7 space-y-5 border-card-warm-border shadow-soft">
            <div className="flex items-center justify-between pb-3 border-b border-muted-border/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-teal/20 border border-brand-teal/35 flex items-center justify-center text-brand-dark">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-section-md font-semibold text-brand-dark">
                    Section 2 — Daily Stress
                  </h3>
                  <span className="text-meta-sm text-muted-text">Daily perceived mental strain (Not PSS-10)</span>
                </div>
              </div>
              <Badge variant={dailyStress > 6 ? 'alert' : dailyStress > 3 ? 'teal' : 'sage'} size="sm">
                {dailyStress} / 10
              </Badge>
            </div>

            <div className="space-y-3 bg-white/70 p-4 rounded-card-sm border border-muted-border">
              <div className="flex items-center justify-between">
                <label className="text-body-md font-medium text-brand-dark">
                  How stressed did you feel today?
                </label>
                <span className="text-meta-md font-bold text-brand-dark">
                  {getStressLabel(dailyStress)}
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={dailyStress}
                onChange={(e) => setDailyStress(parseInt(e.target.value, 10))}
                className="w-full accent-brand-dark h-2.5 bg-card-warm rounded-lg cursor-pointer"
              />

              <div className="flex justify-between text-[11px] text-muted-text font-medium px-1">
                <span>0 — Serene</span>
                <span>5 — Moderate</span>
                <span>10 — Severe Strain</span>
              </div>
            </div>

            {/* PSS-10 Weekly Assessment Callout */}
            <div className="p-4 rounded-card-sm bg-brand-sage/15 border border-brand-sage/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-teal/20 border border-brand-teal/35 flex items-center justify-center text-brand-dark flex-shrink-0 mt-0.5">
                  <ClipboardList className="w-4 h-4 text-brand-teal" />
                </div>
                <div className="space-y-0.5 text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-body-md font-bold text-brand-dark">
                      Check Your Weekly PSS Score
                    </span>
                    <Badge variant="sage" size="sm">
                      Clinical Baseline
                    </Badge>
                  </div>
                  <p className="text-meta-sm text-muted-text-dark leading-relaxed">
                    Calculate your validated 10-item Perceived Stress Scale (PSS-10) to power your collective weekly analytics and clinical reports.
                  </p>
                </div>
              </div>

              <Link to={ROUTES.PSS_ASSESSMENT} className="flex-shrink-0 self-end sm:self-auto">
                <Button variant="outline" size="sm" iconRight={ArrowRight} className="font-semibold text-meta-sm whitespace-nowrap">
                  Take PSS-10 (2 min)
                </Button>
              </Link>
            </div>
          </Card>

          {/* SECTION 3: MOOD */}
          <Card variant="warm" className="p-6 sm:p-7 space-y-4 border-card-warm-border shadow-soft">
            <div className="flex items-center justify-between pb-3 border-b border-muted-border/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-card-warm-hover border border-muted-border flex items-center justify-center text-brand-dark">
                  <Smile className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-section-md font-semibold text-brand-dark">
                    Section 3 — Mood & Emotional State
                  </h3>
                  <span className="text-meta-sm text-muted-text">General autonomic & emotional valence</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {moodOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMood(opt.value)}
                    className={cn(
                      'p-3 rounded-card-sm border text-left sm:text-center transition-all min-h-[52px] flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-1',
                      mood === opt.value
                        ? 'bg-brand-sage/25 text-brand-dark font-bold border-brand-sage/60 ring-1 ring-brand-sage/40 shadow-soft'
                        : 'bg-white/70 border-muted-border hover:bg-white text-brand-dark'
                    )}
                  >
                    <span className="text-body-md font-bold">{opt.value}</span>
                    <span className="text-meta-sm leading-tight text-center">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* SECTION 4 & 5: SCREEN TIME & HYDRATION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Screen Time */}
            <Card variant="warm" className="p-6 space-y-4 border-card-warm-border shadow-soft">
              <div className="flex items-center gap-2.5 pb-2 border-b border-muted-border/60">
                <SunMedium className="w-4 h-4 text-brand-teal" />
                <h3 className="text-section-md font-semibold text-brand-dark">
                  Section 4 — Screen Time
                </h3>
              </div>

              <div className="space-y-2 bg-white/70 p-4 rounded-card-sm border border-muted-border">
                <div className="flex items-center justify-between">
                  <span className="text-meta-md text-muted-text">Estimated exposure:</span>
                  <span className="text-section-lg font-bold text-brand-dark">
                    {screenHours} hrs
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="14"
                  step="0.5"
                  value={screenHours}
                  onChange={(e) => setScreenHours(parseFloat(e.target.value))}
                  className="w-full accent-brand-dark h-2 bg-card-warm rounded-lg cursor-pointer"
                />

                <div className="flex justify-between text-[11px] text-muted-text font-medium">
                  <span>0h</span>
                  <span>6h baseline</span>
                  <span>14h+</span>
                </div>
              </div>
            </Card>

            {/* Hydration */}
            <Card variant="warm" className="p-6 space-y-4 border-card-warm-border shadow-soft">
              <div className="flex items-center gap-2.5 pb-2 border-b border-muted-border/60">
                <Droplets className="w-4 h-4 text-brand-teal" />
                <h3 className="text-section-md font-semibold text-brand-dark">
                  Section 5 — Hydration
                </h3>
              </div>

              <div className="space-y-2 bg-white/70 p-4 rounded-card-sm border border-muted-border">
                <div className="flex items-center justify-between">
                  <span className="text-meta-md text-muted-text">Water & Fluids:</span>
                  <span className="text-section-lg font-bold text-brand-dark">
                    {hydrationLiters} Litres
                  </span>
                </div>

                <input
                  type="range"
                  min="0.5"
                  max="4.0"
                  step="0.1"
                  value={hydrationLiters}
                  onChange={(e) => setHydrationLiters(parseFloat(e.target.value))}
                  className="w-full accent-brand-dark h-2 bg-card-warm rounded-lg cursor-pointer"
                />

                <div className="flex justify-between text-[11px] text-muted-text font-medium">
                  <span>0.5L</span>
                  <span>2.2L target</span>
                  <span>4.0L</span>
                </div>
              </div>
            </Card>
          </div>

          {/* SECTION 6: MEALS */}
          <Card variant="warm" className="p-6 sm:p-7 space-y-4 border-card-warm-border shadow-soft">
            <div className="flex items-center justify-between pb-3 border-b border-muted-border/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-teal/20 border border-brand-teal/35 flex items-center justify-center text-brand-dark">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-section-md font-semibold text-brand-dark">
                    Section 6 — Meals & Nutrition
                  </h3>
                  <span className="text-meta-sm text-muted-text">Blood sugar stability monitoring</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-body-md font-medium text-brand-dark block">
                Did you skip a major meal today?
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 [&>*:last-child]:col-span-2 sm:[&>*:last-child]:col-span-1">
                {mealOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSkippedMeal(opt)}
                    className={cn(
                      'p-3 rounded-card-sm border text-center transition-all min-h-[48px] font-medium text-meta-md',
                      skippedMeal === opt
                        ? 'bg-brand-sage/25 text-brand-dark font-bold border-brand-sage/60 ring-1 ring-brand-sage/40 shadow-soft'
                        : 'bg-white/70 border-muted-border hover:bg-white text-brand-dark'
                    )}
                  >
                    {opt === 'No' ? 'No (All meals)' : opt}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* SECTION 7: OPTIONAL LIFESTYLE (Visually Secondary) */}
          <Card variant="warm" className="p-5 sm:p-6 space-y-4 border-muted-border/80 bg-card-warm/60">
            <button
              type="button"
              onClick={() => setShowOptionalLifestyle(!showOptionalLifestyle)}
              className="w-full flex items-center justify-between text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-meta-sm font-semibold uppercase tracking-wider text-muted-text">
                  Section 7 — Optional Lifestyle Factors
                </span>
                <Badge variant="neutral" size="sm">
                  Optional
                </Badge>
              </div>
              {showOptionalLifestyle ? (
                <ChevronUp className="w-4 h-4 text-muted-text" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-text" />
              )}
            </button>

            {showOptionalLifestyle && (
              <div className="space-y-4 pt-2 border-t border-muted-border/50 animate-in fade-in duration-150">
                {/* Caffeine */}
                <div className="space-y-2">
                  <label className="text-meta-md font-medium text-brand-dark flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-brand-teal" />
                    <span>Caffeine Intake</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['None', '1 cup', '2 cups', '3+ cups'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setCaffeineIntake(opt)}
                        className={cn(
                          'p-2.5 rounded-card-sm border text-meta-sm text-center transition-all',
                          caffeineIntake === opt
                            ? 'bg-brand-sage/25 text-brand-dark font-bold border-brand-sage/60 ring-1 ring-brand-sage/40 shadow-soft'
                            : 'bg-white/60 border-muted-border hover:bg-white text-muted-text-dark'
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Exercise */}
                <div className="space-y-2">
                  <label className="text-meta-md font-medium text-brand-dark flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-brand-sage-dark" />
                    <span>Physical Activity / Movement</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    {[
                      'None',
                      'Light walk / gentle stretch',
                      'Moderate workout (30m+)',
                      'High intensity',
                    ].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setExerciseLevel(opt)}
                        className={cn(
                          'p-2.5 rounded-card-sm border text-meta-sm text-center transition-all',
                          exerciseLevel === opt
                            ? 'bg-brand-sage/25 text-brand-dark font-bold border-brand-sage/60 ring-1 ring-brand-sage/40 shadow-soft'
                            : 'bg-white/60 border-muted-border hover:bg-white text-muted-text-dark'
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* SECTION 8: MIGRAINE EXPERIENCE */}
          <Card variant="warm" className="p-6 sm:p-7 space-y-5 border-alert-muted/40 shadow-soft">
            <div className="flex items-center justify-between pb-3 border-b border-muted-border/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-alert-muted/15 text-[#8F443B] flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-section-md font-semibold text-brand-dark">
                    Section 8 — Migraine Attack Log
                  </h3>
                  <span className="text-meta-sm text-muted-text">Record episode specifics without diagnosis</span>
                </div>
              </div>
            </div>

            {/* Question */}
            <div className="space-y-3">
              <label className="text-body-md font-semibold text-brand-dark block">
                Did you experience a migraine today?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['No', 'Yes'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setHadMigraine(opt)}
                    className={cn(
                      'p-3.5 rounded-card-sm border text-body-md font-semibold text-center transition-all min-h-[48px]',
                      hadMigraine === opt
                        ? opt === 'Yes'
                          ? 'bg-alert-muted/20 text-[#8F443B] font-bold border-alert-muted/50 ring-1 ring-alert-muted/40 shadow-soft'
                          : 'bg-brand-sage/25 text-brand-dark font-bold border-brand-sage/60 ring-1 ring-brand-sage/40 shadow-soft'
                        : 'bg-white/80 border-muted-border hover:bg-white text-brand-dark'
                    )}
                  >
                    {opt === 'No' ? 'No Episode Today' : 'Yes, Experienced Episode'}
                  </button>
                ))}
              </div>
            </div>

            {/* If Yes: Reveal Severity, Duration, Symptoms */}
            {hadMigraine === 'Yes' && (
              <div className="space-y-5 pt-3 border-t border-muted-border/60 animate-in fade-in duration-200">
                {/* Severity Slider */}
                <div className="space-y-2 bg-white/80 p-4 rounded-card-sm border border-muted-border">
                  <div className="flex items-center justify-between">
                    <label className="text-meta-md font-medium text-brand-dark">
                      Attack Severity (0–10)
                    </label>
                    <span className="text-section-md font-bold text-[#8F443B]">
                      {migraineSeverity} / 10
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={migraineSeverity}
                    onChange={(e) => setMigraineSeverity(parseInt(e.target.value, 10))}
                    className="w-full accent-alert-muted h-2.5 bg-card-warm rounded-lg cursor-pointer"
                  />

                  <div className="flex justify-between text-[11px] text-muted-text font-medium px-1">
                    <span>0 — Mild</span>
                    <span>5 — Moderate</span>
                    <span>10 — Severe / Incapacitating</span>
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <label className="text-meta-md font-medium text-brand-dark block">
                    Duration in Hours:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {['< 2 hours', '2–4 hours', '4–8 hours', '8–12 hours', '12+ hours'].map((dur) => (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => setMigraineDuration(dur)}
                        className={cn(
                          'p-2.5 rounded-card-sm border text-meta-sm text-center transition-all',
                          migraineDuration === dur
                            ? 'bg-brand-sage/25 text-brand-dark font-bold border-brand-sage/60 ring-1 ring-brand-sage/40 shadow-soft'
                            : 'bg-white/70 border-muted-border hover:bg-white text-muted-text-dark'
                        )}
                      >
                        {dur}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional Symptoms */}
                <div className="space-y-2">
                  <label className="text-meta-md font-medium text-brand-dark block">
                    Optional Symptoms Noticed:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {symptomOptions.map((sym) => {
                      const isSelected = migraineSymptoms.includes(sym);
                      return (
                        <button
                          key={sym}
                          type="button"
                          onClick={() => toggleSymptom(sym)}
                          className={cn(
                            'p-3 rounded-card-sm border text-meta-md text-left transition-all flex items-center justify-between',
                            isSelected
                              ? 'bg-white border-brand-teal text-brand-dark font-medium shadow-soft'
                              : 'bg-white/60 border-muted-border hover:bg-white text-muted-text'
                          )}
                        >
                          <span>{sym}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-brand-teal" />}
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-[11px] text-muted-text block pt-1">
                    * Recorded for lifestyle correlation. MigraineGuardian does not provide medical diagnoses.
                  </span>
                </div>
              </div>
            )}
          </Card>

          {/* SECTION 9: ENVIRONMENTAL CONTEXT (WEATHER) */}
          <Card variant="warm" className="p-6 sm:p-7 space-y-4 border-card-warm-border shadow-soft">
            <div className="flex items-center justify-between pb-3 border-b border-muted-border/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-sage/20 border border-brand-sage/35 flex items-center justify-center text-brand-dark">
                  <CloudSun className="w-4 h-4 text-brand-teal" />
                </div>
                <div>
                  <h3 className="text-section-md font-semibold text-brand-dark">
                    Environmental Context
                  </h3>
                  <span className="text-meta-sm text-muted-text">Local weather & barometric conditions</span>
                </div>
              </div>
              <Badge variant={weatherData ? 'teal' : 'neutral'} size="sm">
                {weatherData ? 'Local weather detected' : 'Environmental Signal'}
              </Badge>
            </div>

            <p className="text-meta-md text-muted-text-dark leading-relaxed">
              Local weather conditions can provide additional environmental context for your migraine risk assessment.
            </p>

            {weatherData ? (
              <div className="p-4 rounded-card-sm bg-white border border-brand-sage/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-sage/20 pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-body-md font-semibold text-brand-dark">Local weather detected</span>
                  </div>
                  <div className="text-body-md font-bold text-brand-teal">
                    {weatherData.temperature}°C • {weatherData.humidity}% humidity • {weatherData.weatherDescription || weatherData.weatherCondition}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-meta-md">
                  <div className="p-2.5 rounded bg-[#FAF9F5] border border-brand-sage/30">
                    <span className="text-meta-sm text-muted-text block">Temperature:</span>
                    <span className="font-bold text-brand-dark">{weatherData.temperature}°C (Feels {weatherData.feelsLike}°C)</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#FAF9F5] border border-brand-sage/30">
                    <span className="text-meta-sm text-muted-text block">Condition:</span>
                    <span className="font-bold text-brand-dark capitalize">{weatherData.weatherDescription}</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#FAF9F5] border border-brand-sage/30">
                    <span className="text-meta-sm text-muted-text block">Pressure:</span>
                    <span className="font-bold text-brand-dark">{weatherData.pressure} hPa</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#FAF9F5] border border-brand-sage/30">
                    <span className="text-meta-sm text-muted-text block">Humidity:</span>
                    <span className="font-bold text-brand-dark">{weatherData.humidity}%</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-card-sm bg-white/70 border border-muted-border space-y-3">
                {weatherNotice && (
                  <p className="text-meta-md text-muted-text-dark leading-relaxed">
                    {weatherNotice}
                  </p>
                )}

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  isLoading={isFetchingWeather}
                  onClick={handleDetectWeather}
                  icon={MapPin}
                  className="font-semibold shadow-soft"
                >
                  {isFetchingWeather ? 'Retrieving Weather...' : 'Allow & Detect Local Weather'}
                </Button>
              </div>
            )}
          </Card>

          {/* BOTTOM SUBMIT BUTTON */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-meta-sm text-muted-text">
              <ShieldCheck className="w-4 h-4 text-brand-teal" />
              <span>Auto-saved to your private browser storage</span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="xl"
              isLoading={isSubmitting}
              iconRight={Check}
              className="w-full sm:w-auto shadow-soft"
            >
              Save today's check-in
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
