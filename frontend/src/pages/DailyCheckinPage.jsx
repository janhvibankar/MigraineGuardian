import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase.js';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ROUTES } from '../utils/constants';
import { storageService } from '../services/storageService';
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
  Search,
  Navigation,
  Plane,
  X,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useTranslation } from '../hooks/useTranslation';

export function DailyCheckinPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Load existing draft or default values via storageService / trackingService
  const savedDraft = storageService.getItem('daily_checkin_draft', null) || trackingService.getTodayLog();

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
  const [historicalSummary, setHistoricalSummary] = useState(null);
  const [historicalRecords, setHistoricalRecords] = useState([]);
  const [weatherMode, setWeatherMode] = useState(null); // 'usual' | 'travel' | 'skip' | null
  const [usualLocation, setUsualLocation] = useState(null);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  const [weatherNotice, setWeatherNotice] = useState(null);

  // Location search state for travel / setting usual location
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [settingUsualTarget, setSettingUsualTarget] = useState(false);

  // Completion & Error State
  const [isSaved, setIsSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!isMounted) return;

      // Always reset weather & log state on auth state change
      setUsualLocation(null);
      setWeatherData(null);
      setHistoricalSummary(null);
      setHistoricalRecords([]);
      setWeatherMode(null);
      setWeatherNotice(null);

      if (!user) return;

      const localDraft = storageService.getItem('daily_checkin_draft', null);
      const todayData = localDraft || (await trackingService.fetchTodayLog());
      if (isMounted && todayData) {
        if (todayData.sleep_hours !== undefined) setSleepHours(todayData.sleep_hours);
        if (todayData.sleep_quality !== undefined) setSleepQuality(todayData.sleep_quality);
        if (todayData.daily_stress !== undefined) setDailyStress(todayData.daily_stress);
        if (todayData.mood !== undefined) setMood(todayData.mood);
        if (todayData.screen_time !== undefined) setScreenHours(todayData.screen_time);
        if (todayData.hydration !== undefined) setHydrationLiters(todayData.hydration);
        if (todayData.meal_skipped !== undefined) setSkippedMeal(todayData.meal_skipped);
        if (todayData.caffeine !== undefined) setCaffeineIntake(todayData.caffeine);
        if (todayData.exercise !== undefined) setExerciseLevel(todayData.exercise);
        if (todayData.migraine_occurrence !== undefined) setHadMigraine(todayData.migraine_occurrence ? 'Yes' : (todayData.hadMigraine || 'No'));
        if (todayData.migraine_severity !== undefined && todayData.migraine_severity !== null) setMigraineSeverity(todayData.migraine_severity);
        if (todayData.migraine_duration !== undefined && todayData.migraine_duration !== null) setMigraineDuration(todayData.migraine_duration);
        if (todayData.symptoms !== undefined && Array.isArray(todayData.symptoms)) setMigraineSymptoms(todayData.symptoms);
      }

      // Check for saved usual location strictly for current authenticated user
      const savedUsual = await weatherService.getUsualLocation();
      if (isMounted) {
        setUsualLocation(savedUsual || null);
      }

      // Check for today's recorded weather context strictly for current authenticated user
      const existingWeather = await weatherService.fetchTodayWeather();
      if (isMounted) {
        setWeatherData(existingWeather || null);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleUseUsualLocation = async () => {
    setWeatherMode('usual');
    setWeatherNotice(null);

    let loc = usualLocation;
    if (!loc) {
      loc = await weatherService.getUsualLocation();
      if (loc) setUsualLocation(loc);
    }

    if (!loc) {
      setSettingUsualTarget(true);
      setShowLocationModal(true);
      return;
    }

    setIsFetchingWeather(true);
    const histRes = await weatherService.fetchHistoricalWeather(loc.latitude, loc.longitude, 3, loc.name);
    setIsFetchingWeather(false);

    if (histRes.success) {
      setHistoricalSummary(histRes.summary);
      setHistoricalRecords(histRes.records);
      if (histRes.records && histRes.records.length > 0) {
        setWeatherData(histRes.records[histRes.records.length - 1]);
      }
      setWeatherNotice(null);
    } else {
      setWeatherNotice(histRes.message || 'Historical weather data was unavailable.');
    }
  };

  const handleSearchCity = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!locationSearchQuery.trim()) return;
    setIsSearchingLocation(true);
    const results = await weatherService.searchLocation(locationSearchQuery);
    setIsSearchingLocation(false);
    setSearchResults(results);
  };

  const handleSelectLocationResult = async (item, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const locObj = {
      name: item.label || item.name,
      latitude: item.latitude,
      longitude: item.longitude,
    };

    if (settingUsualTarget) {
      await weatherService.saveUsualLocation(locObj);
      setUsualLocation(locObj);
      setWeatherMode('usual');
      setSettingUsualTarget(false);
      setShowLocationModal(false);
      setLocationSearchQuery('');
      setSearchResults([]);

      setIsFetchingWeather(true);
      const histRes = await weatherService.fetchHistoricalWeather(locObj.latitude, locObj.longitude, 3, locObj.name);
      setIsFetchingWeather(false);
      if (histRes.success) {
        setHistoricalSummary(histRes.summary);
        setHistoricalRecords(histRes.records);
        if (histRes.records && histRes.records.length > 0) {
          setWeatherData(histRes.records[histRes.records.length - 1]);
        }
        setWeatherNotice(null);
      }
      return;
    }

    setShowLocationModal(false);
    setLocationSearchQuery('');
    setSearchResults([]);
    setWeatherMode('travel');
    setIsFetchingWeather(true);

    const histRes = await weatherService.fetchHistoricalWeather(locObj.latitude, locObj.longitude, 3, locObj.name);
    setIsFetchingWeather(false);

    if (histRes.success) {
      setHistoricalSummary(histRes.summary);
      setHistoricalRecords(histRes.records);
      if (histRes.records && histRes.records.length > 0) {
        setWeatherData(histRes.records[histRes.records.length - 1]);
      }
      setWeatherNotice(null);
    } else {
      setWeatherNotice(histRes.message || 'Historical weather data was unavailable.');
    }
  };

  const handleUseBrowserGpsForUsualLocation = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsFetchingWeather(true);
    const locRes = await weatherService.requestBrowserLocation();
    if (!locRes.success) {
      setIsFetchingWeather(false);
      setWeatherNotice(locRes.message || "Location access was not provided. Today's risk assessment can continue without local weather data.");
      return;
    }

    const locObj = {
      name: `Home (${Math.round(locRes.coords.latitude * 100) / 100}°, ${Math.round(locRes.coords.longitude * 100) / 100}°)`,
      latitude: locRes.coords.latitude,
      longitude: locRes.coords.longitude,
    };

    await weatherService.saveUsualLocation(locObj);
    setUsualLocation(locObj);
    setSettingUsualTarget(false);
    setShowLocationModal(false);

    const histRes = await weatherService.fetchHistoricalWeather(locObj.latitude, locObj.longitude, 3, locObj.name);
    setIsFetchingWeather(false);

    if (histRes.success) {
      setHistoricalSummary(histRes.summary);
      setHistoricalRecords(histRes.records);
      if (histRes.records && histRes.records.length > 0) {
        setWeatherData(histRes.records[histRes.records.length - 1]);
      }
      setWeatherNotice(null);
    }
  };

  const handleSkipWeather = () => {
    setWeatherMode('skip');
    setWeatherData(null);
    setHistoricalSummary(null);
    setHistoricalRecords([]);
    setWeatherNotice("Location access & weather context skipped for today's check-in. Risk assessment can continue without local weather data.");
  };

  const handleResetWeatherMode = () => {
    setWeatherMode(null);
    setWeatherData(null);
    setHistoricalSummary(null);
    setHistoricalRecords([]);
    setWeatherNotice(null);
  };

  // Sleep Quality Options (1-5)
  const sleepQualityOptions = [
    { value: 1, label: t('checkin.sleepQualityOptions.1') },
    { value: 2, label: t('checkin.sleepQualityOptions.2') },
    { value: 3, label: t('checkin.sleepQualityOptions.3') },
    { value: 4, label: t('checkin.sleepQualityOptions.4') },
    { value: 5, label: t('checkin.sleepQualityOptions.5') },
  ];

  // Mood Options (1-5)
  const moodOptions = [
    { value: 1, label: t('checkin.moodOptions.1') },
    { value: 2, label: t('checkin.moodOptions.2') },
    { value: 3, label: t('checkin.moodOptions.3') },
    { value: 4, label: t('checkin.moodOptions.4') },
    { value: 5, label: t('checkin.moodOptions.5') },
  ];

  // Meals Options
  const mealOptions = [
    { id: 'No', label: t('checkin.mealOptions.no') },
    { id: 'Breakfast', label: t('checkin.mealOptions.breakfast') },
    { id: 'Lunch', label: t('checkin.mealOptions.lunch') },
    { id: 'Dinner', label: t('checkin.mealOptions.dinner') },
    { id: 'More than one', label: t('checkin.mealOptions.multiple') },
  ];

  // Symptom Options
  const symptomOptions = [
    { id: 'Light sensitivity', label: t('checkin.symptomOptions.lightSensitivity') },
    { id: 'Sound sensitivity', label: t('checkin.symptomOptions.soundSensitivity') },
    { id: 'Nausea', label: t('checkin.symptomOptions.nausea') },
    { id: 'Aura', label: t('checkin.symptomOptions.aura') },
    { id: 'Neck tension', label: t('checkin.symptomOptions.neckTension') },
    { id: 'Other', label: t('checkin.symptomOptions.other') },
  ];

  const toggleSymptom = (symId) => {
    if (migraineSymptoms.includes(symId)) {
      setMigraineSymptoms(migraineSymptoms.filter((s) => s !== symId));
    } else {
      setMigraineSymptoms([...migraineSymptoms, symId]);
    }
  };

  const getStressLabel = (val) => {
    if (val <= 2) return `${t('common.low')} (${val}/10)`;
    if (val <= 5) return `${t('common.moderate')} (${val}/10)`;
    if (val <= 7) return `${t('common.high')} (${val}/10)`;
    return `${t('common.severe')} (${val}/10)`;
  };

  const formatPressureTrend = (trend) => {
    if (!trend) return t('checkin.steady', 'Steady');
    const lower = String(trend).toLowerCase();
    if (lower.includes('fall') || lower.includes('drop')) return t('checkin.dropping', 'Dropping');
    if (lower.includes('ris')) return t('checkin.rising', 'Rising');
    return t('checkin.steady', 'Steady');
  };

  const getDurationLabel = (dur) => {
    if (dur === '< 2 hours') return `< 2 ${t('common.hours')}`;
    if (dur === '2–4 hours') return `2–4 ${t('common.hours')}`;
    if (dur === '4–8 hours') return `4–8 ${t('common.hours')}`;
    if (dur === '8–12 hours') return `8–12 ${t('common.hours')}`;
    if (dur === '12+ hours') return `12+ ${t('common.hours')}`;
    return dur;
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    setIsSubmitting(true);
    setServerError(null);

    // Auto-detect location & weather context if not fetched yet
    let currentWeatherData = weatherData;
    if (!currentWeatherData) {
      try {
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
      storageService.removeItem('daily_checkin_draft');
      setIsSaved(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNavigateToPss = () => {
    const draft = {
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
      hadMigraine,
      migraine_severity: hadMigraine === 'Yes' ? migraineSeverity : null,
      migraine_duration: hadMigraine === 'Yes' ? migraineDuration : null,
      symptoms: hadMigraine === 'Yes' ? migraineSymptoms : [],
    };
    storageService.setItem('daily_checkin_draft', draft);
    navigate(ROUTES.PSS_ASSESSMENT, { state: { fromCheckin: true } });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <PageHeader
        title={t('checkin.title')}
        subtitle={t('checkin.subtitle')}
        badge={t('checkin.badge')}
        actions={
          <Link to={ROUTES.DASHBOARD}>
            <Button variant="secondary" size="md">
              {t('nav.dashboard')}
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
              {t('checkin.recordedNotice')}
            </h2>
            <p className="text-body-md text-muted-text leading-relaxed">
              {t('checkin.recordedSub')}
            </p>
          </div>

          {/* Quick Summary of today's logged baseline */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-meta-md text-left pt-2">
            <div className="p-3 rounded-card-sm bg-white border border-muted-border">
              <span className="text-meta-sm text-muted-text block">{t('dashboard.sleepDuration')}:</span>
              <span className="font-semibold text-brand-dark">{sleepHours}h ({sleepQualityOptions.find(o => o.value === sleepQuality)?.label})</span>
            </div>
            <div className="p-3 rounded-card-sm bg-white border border-muted-border">
              <span className="text-meta-sm text-muted-text block">{t('dashboard.dailyStress')}:</span>
              <span className="font-semibold text-brand-dark">{dailyStress} / 10</span>
            </div>
            <div className="p-3 rounded-card-sm bg-white border border-muted-border">
              <span className="text-meta-sm text-muted-text block">{t('dashboard.hydrationIntake')}:</span>
              <span className="font-semibold text-brand-dark">{hydrationLiters} L</span>
            </div>
            <div className="p-3 rounded-card-sm bg-white border border-muted-border">
              <span className="text-meta-sm text-muted-text block">{t('nav.riskForecast')}:</span>
              <span className="font-semibold text-brand-dark">{hadMigraine === 'Yes' ? t('dashboard.episodeLogged') : t('common.no')}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-muted-border/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <Link to={ROUTES.DASHBOARD} className="flex-1">
              <Button variant="primary" size="lg" className="w-full" iconRight={ArrowRight}>
                {t('nav.dashboard')}
              </Button>
            </Link>

            <Link to={ROUTES.RISK_ANALYSIS} className="flex-1 sm:flex-initial">
              <Button variant="secondary" size="lg" className="w-full">
                {t('checkin.viewForecastBtn')}
              </Button>
            </Link>

            <Button
              variant="outline"
              size="lg"
              onClick={() => setIsSaved(false)}
              icon={RotateCcw}
            >
              {t('common.edit')}
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
              <span className="font-semibold text-meta-md">{t('checkin.errorPrefix')} {serverError}</span>
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
                    {t('checkin.sleepTitle')}
                  </h3>
                  <span className="text-meta-sm text-muted-text">{t('checkin.sleepSub')}</span>
                </div>
              </div>
              <Badge variant="sage" size="sm">
                {sleepHours}h
              </Badge>
            </div>

            {/* Sleep Slider */}
            <div className="space-y-2 bg-white/70 p-4 rounded-card-sm border border-muted-border">
              <div className="flex items-center justify-between">
                <label className="text-body-md font-medium text-brand-dark">
                  {t('checkin.sleepQuestion')}
                </label>
                <span className="text-app-lg font-bold text-brand-dark">
                  {sleepHours} {t('common.hours')}
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
                <span>{t('dashboard.targetHours')}</span>
                <span>10h</span>
                <span>12h</span>
              </div>
            </div>

            {/* Sleep Quality 1-5 */}
            <div className="space-y-2.5">
              <label className="text-meta-md font-medium text-brand-dark block">
                {t('checkin.sleepQualityQuestion')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 [&>*:last-child]:col-span-2 sm:[&>*:last-child]:col-span-1">
                {sleepQualityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSleepQuality(opt.value)}
                    className={cn(
                      'p-3 rounded-card-sm border text-center transition-all min-h-[48px] flex flex-col items-center justify-center cursor-pointer',
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

          {/* SECTION 2: STRESS */}
          <Card variant="warm" className="p-6 sm:p-7 space-y-5 border-card-warm-border shadow-soft">
            <div className="flex items-center justify-between pb-3 border-b border-muted-border/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-teal/20 border border-brand-teal/35 flex items-center justify-center text-brand-dark">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-section-md font-semibold text-brand-dark">
                    {t('checkin.stressTitle')}
                  </h3>
                  <span className="text-meta-sm text-muted-text">{t('checkin.stressSub')}</span>
                </div>
              </div>
              <Badge variant={dailyStress > 6 ? 'alert' : dailyStress > 3 ? 'teal' : 'sage'} size="sm">
                {dailyStress} / 10
              </Badge>
            </div>

            <div className="space-y-3 bg-white/70 p-4 rounded-card-sm border border-muted-border">
              <div className="flex items-center justify-between">
                <label className="text-body-md font-medium text-brand-dark">
                  {t('checkin.stressQuestion')}
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
                <span>0</span>
                <span>5 ({t('common.moderate')})</span>
                <span>10 ({t('common.severe')})</span>
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
                      {t('pss.title')}
                    </span>
                    <Badge variant="sage" size="sm">
                      {t('common.active')}
                    </Badge>
                  </div>
                  <p className="text-meta-sm text-muted-text-dark leading-relaxed">
                    {t('pss.subtitle')}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNavigateToPss}
                iconRight={ArrowRight}
                className="font-semibold text-meta-sm whitespace-nowrap flex-shrink-0 self-end sm:self-auto cursor-pointer"
              >
                {t('auth.startPssBtn')}
              </Button>
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
                    {t('checkin.moodTitle')}
                  </h3>
                  <span className="text-meta-sm text-muted-text">{t('checkin.moodSub')}</span>
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
                      'p-3 rounded-card-sm border text-left sm:text-center transition-all min-h-[52px] flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-1 cursor-pointer',
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
                  {t('checkin.screenTitle')}
                </h3>
              </div>

              <div className="space-y-2 bg-white/70 p-4 rounded-card-sm border border-muted-border">
                <div className="flex items-center justify-between">
                  <span className="text-meta-md text-muted-text">{t('dashboard.screenTime')}:</span>
                  <span className="text-section-lg font-bold text-brand-dark">
                    {screenHours} {t('common.hoursShort')}
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
                  <span>6h</span>
                  <span>14h+</span>
                </div>
              </div>
            </Card>

            {/* Hydration */}
            <Card variant="warm" className="p-6 space-y-4 border-card-warm-border shadow-soft">
              <div className="flex items-center gap-2.5 pb-2 border-b border-muted-border/60">
                <Droplets className="w-4 h-4 text-brand-teal" />
                <h3 className="text-section-md font-semibold text-brand-dark">
                  {t('checkin.hydrationTitle')}
                </h3>
              </div>

              <div className="space-y-2 bg-white/70 p-4 rounded-card-sm border border-muted-border">
                <div className="flex items-center justify-between">
                  <span className="text-meta-md text-muted-text">{t('dashboard.hydrationIntake')}:</span>
                  <span className="text-section-lg font-bold text-brand-dark">
                    {hydrationLiters} {t('common.litersShort')}
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
                  <span>{t('dashboard.targetLiters')}</span>
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
                    {t('checkin.mealsTitle')}
                  </h3>
                  <span className="text-meta-sm text-muted-text">{t('checkin.mealsSub')}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-body-md font-medium text-brand-dark block">
                {t('checkin.skippedMealQuestion')}
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 [&>*:last-child]:col-span-2 sm:[&>*:last-child]:col-span-1">
                {mealOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSkippedMeal(opt.id)}
                    className={cn(
                      'p-3 rounded-card-sm border text-center transition-all min-h-[48px] font-medium text-meta-md cursor-pointer',
                      skippedMeal === opt.id
                        ? 'bg-brand-sage/25 text-brand-dark font-bold border-brand-sage/60 ring-1 ring-brand-sage/40 shadow-soft'
                        : 'bg-white/70 border-muted-border hover:bg-white text-brand-dark'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* SECTION 7: OPTIONAL LIFESTYLE */}
          <Card variant="warm" className="p-5 sm:p-6 space-y-4 border-muted-border/80 bg-card-warm/60">
            <button
              type="button"
              onClick={() => setShowOptionalLifestyle(!showOptionalLifestyle)}
              className="w-full flex items-center justify-between text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-meta-sm font-semibold uppercase tracking-wider text-muted-text">
                  {t('checkin.lifestyleTitle')}
                </span>
                <Badge variant="neutral" size="sm">
                  {t('common.optional')}
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
                    <span>{t('checkin.caffeineLabel')}</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'none', label: t('checkin.caffeineOptions.none') },
                      { id: '1 cup', label: t('checkin.caffeineOptions.one') },
                      { id: '2 cups', label: t('checkin.caffeineOptions.two') },
                      { id: '3+ cups', label: t('checkin.caffeineOptions.threePlus') },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setCaffeineIntake(opt.id)}
                        className={cn(
                          'p-2.5 rounded-card-sm border text-meta-sm text-center transition-all cursor-pointer',
                          caffeineIntake === opt.id
                            ? 'bg-brand-sage/25 text-brand-dark font-bold border-brand-sage/60 ring-1 ring-brand-sage/40 shadow-soft'
                            : 'bg-white/60 border-muted-border hover:bg-white text-muted-text-dark'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Exercise */}
                <div className="space-y-2">
                  <label className="text-meta-md font-medium text-brand-dark flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-brand-sage-dark" />
                    <span>{t('checkin.exerciseLabel')}</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'none', label: t('checkin.exerciseOptions.none') },
                      { id: 'light', label: t('checkin.exerciseOptions.light') },
                      { id: 'moderate', label: t('checkin.exerciseOptions.moderate') },
                      { id: 'intense', label: t('checkin.exerciseOptions.intense') },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setExerciseLevel(opt.id)}
                        className={cn(
                          'p-2.5 rounded-card-sm border text-meta-sm text-center transition-all cursor-pointer',
                          exerciseLevel === opt.id
                            ? 'bg-brand-sage/25 text-brand-dark font-bold border-brand-sage/60 ring-1 ring-brand-sage/40 shadow-soft'
                            : 'bg-white/60 border-muted-border hover:bg-white text-muted-text-dark'
                        )}
                      >
                        {opt.label}
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
                    {t('checkin.migraineTitle')}
                  </h3>
                  <span className="text-meta-sm text-muted-text">{t('checkin.migraineSub')}</span>
                </div>
              </div>
            </div>

            {/* Question */}
            <div className="space-y-3">
              <label className="text-body-md font-semibold text-brand-dark block">
                {t('checkin.hadMigraineQuestion')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'No', label: t('common.no') },
                  { id: 'Yes', label: t('common.yes') },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setHadMigraine(opt.id)}
                    className={cn(
                      'p-3.5 rounded-card-sm border text-body-md font-semibold text-center transition-all min-h-[48px] cursor-pointer',
                      hadMigraine === opt.id
                        ? opt.id === 'Yes'
                          ? 'bg-alert-muted/20 text-[#8F443B] font-bold border-alert-muted/50 ring-1 ring-alert-muted/40 shadow-soft'
                          : 'bg-brand-sage/25 text-brand-dark font-bold border-brand-sage/60 ring-1 ring-brand-sage/40 shadow-soft'
                        : 'bg-white/80 border-muted-border hover:bg-white text-brand-dark'
                    )}
                  >
                    {opt.label}
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
                      {t('checkin.severityLabel')}
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
                    <span>0 — {t('common.mild')}</span>
                    <span>5 — {t('common.moderate')}</span>
                    <span>10 — {t('common.severe')}</span>
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <label className="text-meta-md font-medium text-brand-dark block">
                    {t('checkin.durationLabel')}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {['< 2 hours', '2–4 hours', '4–8 hours', '8–12 hours', '12+ hours'].map((dur) => (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => setMigraineDuration(dur)}
                        className={cn(
                          'p-2.5 rounded-card-sm border text-meta-sm text-center transition-all cursor-pointer',
                          migraineDuration === dur
                            ? 'bg-brand-sage/25 text-brand-dark font-bold border-brand-sage/60 ring-1 ring-brand-sage/40 shadow-soft'
                            : 'bg-white/70 border-muted-border hover:bg-white text-muted-text-dark'
                        )}
                      >
                        {getDurationLabel(dur)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional Symptoms */}
                <div className="space-y-2">
                  <label className="text-meta-md font-medium text-brand-dark block">
                    {t('checkin.symptomsLabel')}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {symptomOptions.map((sym) => {
                      const isSelected = migraineSymptoms.includes(sym.id);
                      return (
                        <button
                          key={sym.id}
                          type="button"
                          onClick={() => toggleSymptom(sym.id)}
                          className={cn(
                            'p-3 rounded-card-sm border text-meta-md text-left transition-all flex items-center justify-between cursor-pointer',
                            isSelected
                              ? 'bg-white border-brand-teal text-brand-dark font-medium shadow-soft'
                              : 'bg-white/60 border-muted-border hover:bg-white text-muted-text'
                          )}
                        >
                          <span>{sym.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-brand-teal" />}
                        </button>
                      );
                    })}
                  </div>
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
                    {t('checkin.weatherTitle')}
                  </h3>
                  <span className="text-meta-sm text-muted-text">{t('checkin.weatherSub')}</span>
                </div>
              </div>
              <Badge variant={weatherData ? 'teal' : weatherMode === 'skip' ? 'neutral' : 'sage'} size="sm">
                {weatherData ? t('common.completed') : weatherMode === 'skip' ? t('common.optional') : t('common.active')}
              </Badge>
            </div>

            {/* THREE PRIVACY-FIRST LOCATION OPTIONS */}
            {!weatherData && weatherMode !== 'skip' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  isLoading={isFetchingWeather && weatherMode === 'usual'}
                  onClick={handleUseUsualLocation}
                  icon={Navigation}
                  className="font-semibold shadow-soft justify-center cursor-pointer"
                >
                  {t('checkin.useUsualLocation')}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  isLoading={isFetchingWeather && weatherMode === 'travel'}
                  onClick={() => {
                    setSettingUsualTarget(false);
                    setShowLocationModal(true);
                  }}
                  icon={Plane}
                  className="font-semibold justify-center cursor-pointer"
                >
                  {t('checkin.searchLocation')}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSkipWeather}
                  icon={X}
                  className="font-semibold border-brand-sage/50 text-muted-text hover:text-brand-dark justify-center cursor-pointer"
                >
                  {t('checkin.skipWeather')}
                </Button>
              </div>
            )}

            {/* SKIPPED STATE */}
            {weatherMode === 'skip' && (
              <div className="p-4 rounded-card-sm bg-white/70 border border-muted-border flex items-center justify-between gap-3">
                <p className="text-meta-md text-muted-text-dark leading-relaxed">
                  {weatherNotice || t('checkin.weatherSub')}
                </p>
                <Button type="button" variant="outline" size="sm" onClick={handleResetWeatherMode} icon={RotateCcw} className="cursor-pointer">
                  {t('checkin.resetWeather')}
                </Button>
              </div>
            )}

            {/* HISTORICAL WEATHER DATA PRESENT */}
            {weatherData && (
              <div className="p-4 rounded-card-sm bg-white border border-brand-sage/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-sage/20 pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-body-md font-semibold text-brand-dark">
                      {weatherMode === 'travel'
                        ? `${historicalSummary?.locationName || 'Travel'}`
                        : `${usualLocation?.name || historicalSummary?.locationName || 'Home'}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-body-md font-bold text-brand-teal">
                      {weatherData.temperature}°C • {weatherData.humidity}% {t('checkin.humidityLabel')}
                    </span>
                    <button
                      type="button"
                      onClick={handleResetWeatherMode}
                      className="text-meta-sm text-muted-text hover:text-brand-dark underline ml-2 cursor-pointer"
                    >
                      {t('checkin.resetWeather')}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-meta-md">
                  <div className="p-2.5 rounded bg-[#FAF9F5] border border-brand-sage/30">
                    <span className="text-meta-sm text-muted-text block">{t('checkin.temperatureLabel')}:</span>
                    <span className="font-bold text-brand-dark">{weatherData.temperature}°C</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#FAF9F5] border border-brand-sage/30">
                    <span className="text-meta-sm text-muted-text block">{t('checkin.humidityLabel')}:</span>
                    <span className="font-bold text-brand-dark">{weatherData.humidity}%</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#FAF9F5] border border-brand-sage/30">
                    <span className="text-meta-sm text-muted-text block">{t('checkin.pressureLabel')}:</span>
                    <span className="font-bold text-brand-dark">{weatherData.pressure} hPa</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#FAF9F5] border border-brand-sage/30">
                    <span className="text-meta-sm text-muted-text block">{t('checkin.pressureTrend')}:</span>
                    <span className="font-bold text-brand-teal">{formatPressureTrend(historicalSummary?.pressureTrend)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* LOCATION SEARCH MODAL / SUB-PANEL */}
            {showLocationModal && (
              <div className="p-4 rounded-card-sm bg-white border border-brand-teal/40 space-y-3 shadow-soft animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-brand-sage/20 pb-2">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-brand-teal" />
                    <span className="text-body-md font-semibold text-brand-dark">
                      {settingUsualTarget ? t('checkin.setUsualLocation') : t('checkin.searchLocation')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowLocationModal(false);
                      setSettingUsualTarget(false);
                    }}
                    className="text-muted-text hover:text-brand-dark p-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={locationSearchQuery}
                    onChange={(e) => setLocationSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSearchCity(e);
                      }
                    }}
                    placeholder={t('checkin.searchLocationPlaceholder')}
                    className="flex-1 px-3 py-2 text-meta-md rounded border border-muted-border focus:outline-none focus:border-brand-teal bg-white"
                  />
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    isLoading={isSearchingLocation}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSearchCity(e);
                    }}
                    className="cursor-pointer"
                  >
                    {t('common.search')}
                  </Button>
                </div>

                {settingUsualTarget && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleUseBrowserGpsForUsualLocation}
                      className="text-meta-sm font-semibold text-brand-teal hover:underline flex items-center gap-1.5 cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{t('checkin.useCurrentGps')}</span>
                    </button>
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="space-y-1.5 pt-2 max-h-48 overflow-y-auto">
                    {searchResults.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={(e) => handleSelectLocationResult(item, e)}
                        className="w-full text-left p-2 rounded hover:bg-brand-sage/20 border border-transparent hover:border-brand-sage/30 text-meta-md text-brand-dark flex items-center justify-between cursor-pointer"
                      >
                        <span>{item.label}</span>
                        <span className="text-meta-sm text-muted-text">({item.latitude}°, {item.longitude}°)</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* BOTTOM SUBMIT BUTTON */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-meta-sm text-muted-text">
              <ShieldCheck className="w-4 h-4 text-brand-teal" />
              <span>{t('auth.secureBadge')}</span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="xl"
              isLoading={isSubmitting}
              iconRight={Check}
              className="w-full sm:w-auto shadow-soft cursor-pointer"
            >
              {t('checkin.submitCheckin')}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

export default DailyCheckinPage;
