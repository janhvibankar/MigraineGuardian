import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ROUTES } from '../utils/constants';
import { predictionService } from '../services/predictionService';
import { trackingService } from '../services/trackingService';
import { reportService } from '../services/reportService';
import { formatUserXaiExplanation } from '../utils/xaiHelper';
import { localizeElevatedFactor } from '../utils/baselineHelper';
import {
  Activity,
  Sparkles,
  ArrowRight,
  Info,
  ShieldCheck,
  CheckCircle2,
  CalendarCheck,
  AlertCircle,
  Loader2,
  TrendingUp,
  TrendingDown,
  BarChart2,
  ChevronDown,
  ChevronUp,
  Zap,
  Brain,
  Moon,
  SunMedium,
  Droplets,
  Smile,
  HelpCircle,
  Lightbulb,
  Cloud,
  Thermometer,
  Wind,
  RotateCcw,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useTranslation } from '../hooks/useTranslation';

export function RiskAnalysisPage() {
  const { t } = useTranslation();
  const [prediction, setPrediction] = useState(null);
  const [todayCheckin, setTodayCheckin] = useState(null);
  const [reportSummary, setReportSummary] = useState(null);
  const [initialCheckinLoading, setInitialCheckinLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [forecastStatus, setForecastStatus] = useState('idle'); // 'idle' | 'ready' | 'warming' | 'timeout' | 'error' | 'no_checkin'
  const [calculationError, setCalculationError] = useState(null);
  const [canRetry, setCanRetry] = useState(true);
  const [showTechnicalShap, setShowTechnicalShap] = useState(false);
  const [showFullMatrix, setShowFullMatrix] = useState(false);

  const inFlightRef = useRef(false);
  const pollTimerRef = useRef(null);
  const isMountedRef = useRef(true);

  // Maximum warming auto-poll attempts: 10 cycles (~80-90s total), accommodating the measured
  // ~63s Render container cold-start delay while guaranteeing polling is strictly bounded.
  const MAX_WARMING_RETRIES = 10;

  const clearPollTimer = () => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const evaluatePrediction = async (isManualRetry = false, retryAttempt = 0) => {
    // If a manual retry is clicked, clear any scheduled background auto-poll timer
    if (isManualRetry) {
      clearPollTimer();
    }

    if (inFlightRef.current) return;
    inFlightRef.current = true;

    if (isManualRetry) {
      setIsRetrying(true);
      setCalculationError(null);
    }
    setIsEvaluating(true);

    try {
      const forecastData = isManualRetry
        ? await predictionService.recalculateTodayPrediction()
        : await predictionService.getTodayPrediction();

      if (!isMountedRef.current) return;

      const validForecast =
        forecastData && forecastData.score !== undefined && forecastData.score !== null ? forecastData : null;

      if (validForecast) {
        // Valid forecast arrived: stop polling immediately and render forecast
        clearPollTimer();
        setPrediction(validForecast);
        setForecastStatus('ready');
        setCalculationError(null);
      } else {
        const status = forecastData?.forecastStatus || (forecastData?.mlError?.includes('warming') ? 'warming' : 'error');
        const retryPermitted = forecastData?.canRetry !== false;
        setForecastStatus(status);
        setCanRetry(retryPermitted);
        setCalculationError(forecastData?.mlError || t('risk.serviceUnavailable'));

        const isWarmingState = status === 'warming' || forecastData?.errorCategory === 'FASTAPI_SERVICE_WARMING';

        // Bounded transient backoff: Auto-poll only while service is warming, retries permitted, and under MAX_WARMING_RETRIES
        if (!isManualRetry && isWarmingState && retryPermitted && retryAttempt < MAX_WARMING_RETRIES) {
          const pollDelayMs =
            typeof forecastData?.retryAfterMs === 'number' &&
            forecastData.retryAfterMs >= 2000 &&
            forecastData.retryAfterMs <= 30000
              ? forecastData.retryAfterMs
              : 8000;

          pollTimerRef.current = setTimeout(() => {
            pollTimerRef.current = null;
            inFlightRef.current = false;
            if (isMountedRef.current) {
              evaluatePrediction(false, retryAttempt + 1);
            }
          }, pollDelayMs);
          return;
        }

        // Stop polling on non-retryable error or exhausted attempts; ensure timer is cleared
        clearPollTimer();
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      console.warn('[RiskAnalysisPage] Prediction evaluation error:', err.message);
      setForecastStatus('error');
      setCalculationError(t('risk.serviceUnavailable'));
      clearPollTimer();
    } finally {
      if (isMountedRef.current) {
        setIsEvaluating(false);
        setIsRetrying(false);
      }
      inFlightRef.current = false;
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    let isMounted = true;

    async function init() {
      try {
        // Fast path: load basic check-in record and weekly summary first (sub-second)
        const [checkinData, summaryData] = await Promise.all([
          trackingService.fetchTodayLog(),
          reportService.getReportSummary('weekly'),
        ]);

        if (isMounted) {
          setTodayCheckin(checkinData);
          setReportSummary(summaryData);
          setInitialCheckinLoading(false);

          if (!checkinData) {
            setForecastStatus('no_checkin');
            return;
          }
        }
      } catch (err) {
        console.warn('[RiskAnalysisPage] Error loading check-in data:', err.message);
        if (isMounted) setInitialCheckinLoading(false);
      }

      // Asynchronous ML prediction pipeline (does not block initial render)
      if (isMounted) {
        evaluatePrediction(false);
      }
    }

    init();

    const handleForecastUpdated = (e) => {
      if (isMountedRef.current) {
        const updated = e.detail;
        const valid = updated && updated.score !== undefined && updated.score !== null ? updated : null;
        if (valid) {
          clearPollTimer();
          setPrediction(valid);
          setForecastStatus('ready');
          setIsEvaluating(false);
        }
      }
    };

    window.addEventListener('migraineguardian_forecast_updated', handleForecastUpdated);

    return () => {
      isMounted = false;
      isMountedRef.current = false;
      clearPollTimer();
      window.removeEventListener('migraineguardian_forecast_updated', handleForecastUpdated);
    };
  }, []);

  const hasForecast = Boolean(prediction && prediction.score !== undefined && prediction.score !== null);
  const currentScore = hasForecast ? prediction.score : null;
  const currentLevel = hasForecast ? prediction.level : null;
  const formattedScore = hasForecast
    ? typeof currentScore === 'number'
      ? `${Number(currentScore.toFixed(1))}%`
      : `${currentScore}%`
    : null;

  // Extract SHAP features from prediction.xai.features
  const xaiData = prediction?.xai || null;
  const xaiFeatures = Array.isArray(xaiData?.features) ? xaiData.features : [];

  // Extract elevated baseline factors & recommendations
  const elevatedFactors = prediction?.elevatedFactors || [];
  const focusAreas = prediction?.focusAreas || [];

  // Generate Layer 1 Human-Readable Explanation dynamically from SHAP features
  const userXai = formatUserXaiExplanation(xaiFeatures, currentScore || 0, currentLevel || 'Moderate', t);

  const getLocalizedFeatureName = (item, isProtective = false) => {
    if (!item) return '';
    const feat = item.feature;
    if (isProtective) {
      const prot = t(`xai.features.${feat}.protectiveName`);
      if (prot && prot !== `xai.features.${feat}.protectiveName`) return prot;
    }
    const name = t(`xai.features.${feat}.name`);
    if (name && name !== `xai.features.${feat}.name`) return name;
    return item.label || feat;
  };

  // Process & Sort SHAP features for Layer 2 Technical SHAP
  const sortedXaiFeatures = [...xaiFeatures].sort((a, b) => {
    const impA = a.importance !== undefined ? a.importance : Math.abs(a.shap_value || 0);
    const impB = b.importance !== undefined ? b.importance : Math.abs(b.shap_value || 0);
    return impB - impA;
  });

  const increasingRiskFactors = sortedXaiFeatures.filter(
    (f) => f.direction === 'increases_risk' || f.shap_value > 0
  );

  const decreasingRiskFactors = sortedXaiFeatures.filter(
    (f) => f.direction === 'decreases_risk' || f.shap_value < 0
  );

  const maxImportance = Math.max(
    ...sortedXaiFeatures.map((f) => (f.importance !== undefined ? f.importance : Math.abs(f.shap_value || 0))),
    0.001
  );

  const getFeatureIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'sleep':
        return <Moon className="w-4 h-4 text-[#8F443B]" />;
      case 'stress':
        return <Brain className="w-4 h-4 text-[#8F443B]" />;
      case 'screen':
        return <SunMedium className="w-4 h-4 text-[#8F443B]" />;
      case 'hydration':
        return <Droplets className="w-4 h-4 text-brand-teal" />;
      case 'mood':
        return <Smile className="w-4 h-4 text-brand-teal" />;
      case 'weather':
        return <Cloud className="w-4 h-4 text-brand-teal" />;
      case 'interaction':
        return <Zap className="w-4 h-4 text-[#8F443B]" />;
      default:
        return <Activity className="w-4 h-4 text-brand-teal" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200 text-left pb-28 sm:pb-20">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-muted-border/60">
        <div>
          <h1 className="text-app-xl sm:text-[32px] font-semibold text-brand-dark tracking-tight leading-tight">
            {t('risk.title')}
          </h1>
          <p className="text-body-md text-muted-text mt-0.5">
            {t('risk.subtitle')}
          </p>
        </div>

        <Link to={ROUTES.DAILY_CHECKIN}>
          <Button variant="primary" size="md" icon={CalendarCheck} iconRight={ArrowRight} className="cursor-pointer">
            {t('nav.dailyCheckin')}
          </Button>
        </Link>
      </div>

      {/* TODAY'S RECORDED CHECK-IN BANNER (Rendered immediately without waiting for ML) */}
      {todayCheckin && (
        <div className="p-4 sm:p-5 rounded-[20px] bg-[#FAF9F5] border border-brand-sage/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-sage/30 border border-brand-sage/50 flex items-center justify-center flex-shrink-0 text-brand-teal">
              <CheckCircle2 className="w-5 h-5 text-brand-teal" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-body-md font-bold text-brand-dark">
                  {t('risk.checkinRecordedTitle')}
                </span>
                <Badge variant="teal" size="sm">Saved in Firestore</Badge>
              </div>
              <p className="text-meta-sm text-muted-text">
                Your daily clinical inputs are recorded and baseline triggers are active.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {todayCheckin.sleep_hours !== undefined && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-brand-sage/30 text-meta-sm text-brand-dark font-medium shadow-xs">
                <Moon className="w-3.5 h-3.5 text-[#8F443B]" />
                {todayCheckin.sleep_hours}h sleep
              </span>
            )}
            {todayCheckin.daily_stress !== undefined && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-brand-sage/30 text-meta-sm text-brand-dark font-medium shadow-xs">
                <Brain className="w-3.5 h-3.5 text-[#8F443B]" />
                {todayCheckin.daily_stress}/10 stress
              </span>
            )}
            {todayCheckin.hydration !== undefined && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-brand-sage/30 text-meta-sm text-brand-dark font-medium shadow-xs">
                <Droplets className="w-3.5 h-3.5 text-brand-teal" />
                {todayCheckin.hydration}L water
              </span>
            )}
            {todayCheckin.screen_time !== undefined && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-brand-sage/30 text-meta-sm text-brand-dark font-medium shadow-xs">
                <SunMedium className="w-3.5 h-3.5 text-[#8F443B]" />
                {todayCheckin.screen_time}h screen
              </span>
            )}
          </div>
        </div>
      )}

      {initialCheckinLoading ? (
        <div className="min-h-[220px] flex flex-col items-center justify-center space-y-3 py-12">
          <Loader2 className="w-8 h-8 text-brand-teal animate-spin" />
          <span className="text-body-md font-semibold text-brand-dark">
            Loading your health data...
          </span>
        </div>
      ) : !hasForecast ? (
        todayCheckin ? (
          isEvaluating ? (
            /* ACTIVE EVALUATION IN PROGRESS (NON-BLOCKING) */
            <Card variant="warm" className="p-8 sm:p-12 border-2 border-brand-sage/60 rounded-[28px] text-center space-y-5 animate-in fade-in duration-200">
              <div className="w-14 h-14 rounded-2xl bg-brand-sage/25 border border-brand-sage/50 flex items-center justify-center mx-auto text-brand-dark">
                <Loader2 className="w-7 h-7 text-brand-teal animate-spin" />
              </div>
              <div className="space-y-2">
                <h2 className="text-section-lg font-bold text-brand-dark">
                  {t('risk.runningEvaluation')}
                </h2>
                <p className="text-body-md text-[#555B55] max-w-md mx-auto leading-relaxed">
                  {t('risk.loadingForecast')}
                </p>
              </div>
              <div className="max-w-xs mx-auto h-1.5 bg-brand-sage/30 rounded-full overflow-hidden">
                <div className="h-full bg-brand-teal animate-pulse rounded-full w-3/4" />
              </div>
            </Card>
          ) : (
            /* CHECK-IN COMPLETED: FORECAST PENDING, WARMING, OR TIMED OUT */
            <Card variant="warm" className="p-8 sm:p-12 border-2 border-brand-sage/60 rounded-[28px] text-center space-y-5 animate-in fade-in duration-200">
              <div className="w-14 h-14 rounded-2xl bg-brand-sage/25 border border-brand-sage/50 flex items-center justify-center mx-auto text-brand-dark">
                <Sparkles className="w-7 h-7 text-brand-teal" />
              </div>
              <div className="space-y-2">
                <h2 className="text-section-lg font-bold text-brand-dark">
                  {t('risk.checkinRecordedTitle')}
                </h2>
                <p className="text-body-md text-[#555B55] max-w-md mx-auto leading-relaxed">
                  {t('risk.checkinRecordedDesc')}
                </p>
              </div>
              {calculationError && (
                <div className="p-4 rounded-xl bg-[#8F443B]/10 border border-[#8F443B]/30 text-[#8F443B] flex items-center justify-center gap-2 max-w-md mx-auto text-body-sm font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#8F443B]" />
                  <span>{calculationError}</span>
                </div>
              )}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => evaluatePrediction(true)}
                  disabled={isRetrying || isEvaluating}
                  icon={isRetrying ? Loader2 : RotateCcw}
                  className={cn((isRetrying || isEvaluating) && "opacity-80")}
                >
                  {isRetrying ? t('risk.calculatingForecast') : t('risk.calculateForecastBtn')}
                </Button>
                <Link to={ROUTES.DASHBOARD}>
                  <Button variant="outline" size="lg">
                    {t('risk.goToDashboardBtn')}
                  </Button>
                </Link>
              </div>
            </Card>
          )
        ) : (
          /* EMPTY STATE FOR USERS WITHOUT CHECK-IN */
          <Card variant="warm" className="p-8 sm:p-12 border-2 border-brand-sage/60 rounded-[28px] text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-sage/25 border border-brand-sage/50 flex items-center justify-center mx-auto text-brand-dark">
              <AlertCircle className="w-7 h-7 text-brand-teal" />
            </div>
            <div className="space-y-1">
              <h2 className="text-section-lg font-bold text-brand-dark">
                {t('risk.noForecastMessage')}
              </h2>
              <p className="text-body-md text-[#555B55] max-w-md mx-auto leading-relaxed">
                {t('dashboard.noForecastDesc')}
              </p>
            </div>
            <Link to={ROUTES.DAILY_CHECKIN} className="inline-block pt-2">
              <Button variant="primary" size="lg" icon={CalendarCheck} iconRight={ArrowRight} className="cursor-pointer">
                {t('dashboard.completeCheckinBtn')}
              </Button>
            </Link>
          </Card>
        )
      ) : (
        <>
          {/* HERO FORECAST SCORE */}
          <Card variant="warm" className="p-6 sm:p-8 md:p-9 border-2 border-brand-sage/60 rounded-[26px] shadow-soft space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-5 border-b border-brand-sage/35">
              <div className="flex flex-col sm:flex-row sm:items-center gap-5 w-full">
                <div className={cn(
                  "min-w-[124px] sm:min-w-[144px] px-5 py-4 rounded-2xl border-2 flex flex-col items-center justify-center flex-shrink-0 shadow-sm transition-all",
                  currentLevel === 'High' ? "bg-alert-muted/15 border-alert-muted/40 text-[#8F443B]" : "bg-brand-teal/15 border-brand-teal/40 text-brand-dark"
                )}>
                  <span className="text-[32px] sm:text-[38px] font-black leading-none tracking-tight">
                    {formattedScore}
                  </span>
                  <span className="text-[11px] uppercase font-bold tracking-wider mt-1.5 text-center whitespace-nowrap">
                    {t('risk.levelRisk', { level: currentLevel || 'Moderate' })}
                  </span>
                </div>

                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={currentLevel === 'High' ? 'alert' : currentLevel === 'Moderate' ? 'warning' : 'teal'} size="md">
                      {t('risk.sensitivityWindow', { level: currentLevel || 'Moderate' })}
                    </Badge>
                  </div>
                  <h2 className="text-section-lg sm:text-[26px] font-bold text-brand-dark leading-snug break-words">
                    {currentLevel === 'High'
                      ? t('risk.headlineHigh')
                      : currentLevel === 'Low'
                      ? t('risk.headlineLow')
                      : t('risk.headlineModerate')}
                  </h2>
                </div>
              </div>
            </div>

            {/* Dynamic Overview Sentence */}
            <div className="p-5 rounded-[20px] bg-white border border-brand-sage/40 text-body-md text-[#333833] leading-relaxed shadow-sm">
              <p>{userXai.overviewText}</p>
            </div>
          </Card>

          {/* ========================================================================= */}
          {/* LAYER 1: HUMAN-READABLE EXPLANATION LAYER */}
          {/* ========================================================================= */}

          {/* 1. WHY DOES MY RISK LOOK LIKE THIS? */}
          <Card className="p-6 sm:p-8 border-2 border-brand-sage/50 rounded-[26px] bg-white shadow-soft space-y-6">
            <div className="space-y-1 pb-3 border-b border-brand-sage/30">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-sage/25 border border-brand-sage/40 flex items-center justify-center text-brand-dark">
                  <Sparkles className="w-5 h-5 text-brand-teal" />
                </div>
                <h2 className="text-section-lg font-bold text-brand-dark">
                  {t('risk.whyRiskTitle')}
                </h2>
              </div>
              <p className="text-body-md text-[#444944] pt-1 leading-relaxed">
                {userXai.whySummary}
              </p>
            </div>

            {!userXai.hasFeatures ? (
              <div className="p-6 rounded-[20px] bg-[#FAF9F5] border border-brand-sage/35 text-center text-muted-text space-y-1">
                <Info className="w-6 h-6 text-brand-teal mx-auto mb-1" />
                <p className="font-semibold text-brand-dark">{t('risk.noXaiData')}</p>
                <p className="text-meta-sm">{t('risk.completeCheckinForXai')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {/* HIGHER-RISK CONTRIBUTORS */}
                <div className="p-5 rounded-[22px] bg-[#FFFDF9] border-2 border-alert-muted/30 flex flex-col justify-between space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-alert-muted/20">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-[#8F443B]" />
                        <h3 className="text-section-md font-bold text-brand-dark">
                          {t('risk.factorsHigherRisk')}
                        </h3>
                      </div>
                    </div>

                    {userXai.topIncreasing.length === 0 ? (
                      <p className="text-meta-md text-muted-text py-3 text-center">
                        {t('risk.noHigherRiskFactors')}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {userXai.topIncreasing.map((item, idx) => (
                          <div key={idx} className="p-4 bg-white rounded-[16px] border border-alert-muted/25 shadow-sm space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-brand-dark text-body-md flex items-center gap-2 min-w-0 truncate">
                                {getFeatureIcon(item.category)}
                                <span className="truncate">{item.title}</span>
                              </span>
                              <Badge variant="alert" size="sm" className="flex-shrink-0">
                                {t('risk.higherRiskFactorBadge')}
                              </Badge>
                            </div>
                            <p className="text-meta-md text-muted-text leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* LOWER-RISK (PROTECTIVE) CONTRIBUTORS */}
                <div className="p-5 rounded-[22px] bg-[#F7FAF8] border-2 border-brand-sage/40 flex flex-col justify-between space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-brand-sage/30">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-brand-teal" />
                        <h3 className="text-section-md font-bold text-brand-dark">
                          {t('risk.factorsLowerRisk')}
                        </h3>
                      </div>
                    </div>

                    {userXai.topDecreasing.length === 0 ? (
                      <p className="text-meta-md text-muted-text py-3 text-center">
                        {t('risk.noLowerRiskFactors')}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {userXai.topDecreasing.map((item, idx) => (
                          <div key={idx} className="p-4 bg-white rounded-[16px] border border-brand-sage/35 shadow-sm space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-brand-dark text-body-md flex items-center gap-2 min-w-0 truncate">
                                {getFeatureIcon(item.category)}
                                <span className="truncate">{item.title}</span>
                              </span>
                              <Badge variant="teal" size="sm" className="flex-shrink-0">
                                {t('risk.protectiveSignalBadge')}
                              </Badge>
                            </div>
                            <p className="text-meta-md text-muted-text leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>


          {/* 2. THINGS YOU CAN FOCUS ON */}
          {userXai.focusSuggestions.length > 0 && (
            <Card className="p-7 sm:p-8 border-2 border-brand-sage/50 rounded-[26px] bg-white shadow-soft space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-brand-sage/30">
                <div className="w-9 h-9 rounded-xl bg-brand-sage/25 border border-brand-sage/40 flex items-center justify-center text-brand-dark">
                  <Lightbulb className="w-5 h-5 text-brand-teal" />
                </div>
                <h2 className="text-section-lg font-bold text-brand-dark">
                  {t('risk.thingsToFocusOn')}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                {userXai.focusSuggestions.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-[18px] bg-[#FAF9F5] border border-brand-sage/35 space-y-2 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-brand-dark font-bold text-body-md">
                        <CheckCircle2 className="w-4 h-4 text-brand-teal flex-shrink-0" />
                        <span>{item.title}</span>
                      </div>
                      <p className="text-meta-md text-[#555B55] leading-relaxed">
                        {item.tip}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ========================================================================= */}
          {/* LAYER 2: TECHNICAL SHAP EXPLANATION (EXPANDABLE / COLLAPSIBLE) */}
          {/* ========================================================================= */}
          <div className="space-y-4 pt-2">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowTechnicalShap(!showTechnicalShap)}
              className="w-full border-2 border-brand-sage/60 rounded-[20px] justify-between font-bold py-4 text-brand-dark bg-white hover:bg-[#FAF9F5] shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <BarChart2 className="w-5 h-5 text-brand-teal" />
                <span>{showTechnicalShap ? t('risk.hideShapExplanation') : t('risk.viewShapExplanation')}</span>
              </div>
              {showTechnicalShap ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </Button>

            {showTechnicalShap && (
              <Card className="p-7 sm:p-8 border-2 border-brand-sage/50 rounded-[26px] bg-white shadow-soft space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-brand-sage/30">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <BarChart2 className="w-5 h-5 text-brand-teal" />
                      <h2 className="text-section-lg font-bold text-brand-dark">
                        {t('risk.modelFeatureAttributions')}
                      </h2>
                    </div>
                    <p className="text-meta-md text-muted-text">
                      {t('risk.shapDescription')}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 self-start sm:self-auto">
                    <Badge variant="teal" size="md" className="font-mono text-xs">
                      {xaiData?.method || 'SHAP'} Engine
                    </Badge>
                    {xaiData?.model_used && (
                      <Badge variant="sage" size="md" className="font-mono text-xs">
                        {xaiData.model_used === 'MODEL_B_WEATHER_AWARE' ? t('risk.weatherAwareModel') : t('risk.lifestyleModel')}
                      </Badge>
                    )}
                  </div>
                </div>

                {sortedXaiFeatures.length === 0 ? (
                  <div className="p-6 rounded-[20px] bg-[#FAF9F5] border border-brand-sage/35 text-center text-muted-text space-y-1">
                    <Info className="w-6 h-6 text-brand-teal mx-auto mb-1" />
                    <p className="font-semibold text-brand-dark">{t('risk.noXaiData')}</p>
                    <p className="text-meta-sm">{t('risk.completeCheckinForXai')}</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* LEFT COLUMN: Factors Associated With Higher Predicted Risk */}
                      <div className="p-5 rounded-[20px] bg-[#FFFDF9] border-2 border-alert-muted/30 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-alert-muted/20">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-[#8F443B]" />
                            <h3 className="text-section-md font-bold text-brand-dark">
                              {t('risk.factorsHigherRisk')}
                            </h3>
                          </div>
                          <Badge variant="alert" size="sm">
                            {increasingRiskFactors.length}
                          </Badge>
                        </div>

                        {increasingRiskFactors.length === 0 ? (
                          <p className="text-meta-md text-muted-text py-2 text-center">
                            {t('risk.noHigherRiskFactors')}
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {increasingRiskFactors.map((item, idx) => {
                              const importanceVal = item.importance !== undefined ? item.importance : Math.abs(item.shap_value || 0);
                              const barPercent = Math.min(100, Math.round((importanceVal / maxImportance) * 100));
                              const formattedValue = item.shap_value > 0 ? `+${item.shap_value.toFixed(4)}` : item.shap_value.toFixed(4);

                              return (
                                <div key={idx} className="p-3.5 bg-white rounded-[14px] border border-alert-muted/25 shadow-sm space-y-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-bold text-brand-dark text-body-md">
                                      {getLocalizedFeatureName(item, false)}
                                    </span>
                                    <span className="text-meta-sm font-extrabold text-[#8F443B] bg-alert-muted/15 px-2 py-0.5 rounded-full font-mono">
                                      {t('risk.impact')}: {importanceVal.toFixed(4)}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between text-meta-sm text-muted-text">
                                    <span className="text-[#8F443B] font-semibold flex items-center gap-1">
                                      <TrendingUp className="w-3.5 h-3.5" />
                                      {t('risk.increasesRisk')}
                                    </span>
                                    <span className="font-mono text-xs text-muted-text-dark">
                                      SHAP: {formattedValue}
                                    </span>
                                  </div>

                                  {/* Relative Impact Bar */}
                                  <div className="w-full h-2 bg-brand-sage/20 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-[#8F443B] rounded-full transition-all duration-500"
                                      style={{ width: `${barPercent}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* RIGHT COLUMN: Factors Associated With Lower Predicted Risk */}
                      <div className="p-5 rounded-[20px] bg-[#F7FAF8] border-2 border-brand-sage/40 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-brand-sage/30">
                          <div className="flex items-center gap-2">
                            <TrendingDown className="w-5 h-5 text-brand-teal" />
                            <h3 className="text-section-md font-bold text-brand-dark">
                              {t('risk.factorsLowerRisk')}
                            </h3>
                          </div>
                          <Badge variant="teal" size="sm">
                            {decreasingRiskFactors.length}
                          </Badge>
                        </div>

                        {decreasingRiskFactors.length === 0 ? (
                          <p className="text-meta-md text-muted-text py-2 text-center">
                            {t('risk.noLowerRiskFactors')}
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {decreasingRiskFactors.map((item, idx) => {
                              const importanceVal = item.importance !== undefined ? item.importance : Math.abs(item.shap_value || 0);
                              const barPercent = Math.min(100, Math.round((importanceVal / maxImportance) * 100));
                              const formattedValue = item.shap_value.toFixed(4);

                              return (
                                <div key={idx} className="p-3.5 bg-white rounded-[14px] border border-brand-sage/35 shadow-sm space-y-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-bold text-brand-dark text-body-md">
                                      {getLocalizedFeatureName(item, true)}
                                    </span>
                                    <span className="text-meta-sm font-extrabold text-brand-dark bg-brand-sage/25 px-2 py-0.5 rounded-full font-mono">
                                      {t('risk.impact')}: {importanceVal.toFixed(4)}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between text-meta-sm text-muted-text">
                                    <span className="text-brand-teal font-semibold flex items-center gap-1">
                                      <TrendingDown className="w-3.5 h-3.5" />
                                      {t('risk.lowersRisk')}
                                    </span>
                                    <span className="font-mono text-xs text-muted-text-dark">
                                      SHAP: {formattedValue}
                                    </span>
                                  </div>

                                  {/* Relative Impact Bar */}
                                  <div className="w-full h-2 bg-brand-sage/20 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-brand-teal rounded-full transition-all duration-500"
                                      style={{ width: `${barPercent}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Collapsible Full SHAP Matrix Table */}
                    <div className="pt-2 border-t border-brand-sage/30">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFullMatrix(!showFullMatrix)}
                        className="w-full border-brand-sage/50 justify-between font-semibold"
                      >
                        <span>
                          {showFullMatrix ? t('risk.hideFullShapMatrix') : t('risk.viewFullShapMatrix', { count: sortedXaiFeatures.length })}
                        </span>
                        {showFullMatrix ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>

                      {showFullMatrix && (
                        <div className="mt-4 overflow-x-auto rounded-[16px] border border-brand-sage/35 bg-[#FAF9F5] p-3 animate-in fade-in duration-200">
                          <table className="w-full text-meta-sm text-left border-collapse">
                            <thead>
                              <tr className="border-b border-brand-sage/40 text-muted-text-dark font-bold">
                                <th className="py-2.5 px-3">{t('risk.featureName')}</th>
                                <th className="py-2.5 px-3">{t('risk.systemKey')}</th>
                                <th className="py-2.5 px-3 text-right">{t('risk.shapValue')}</th>
                                <th className="py-2.5 px-3 text-right">{t('risk.importance')}</th>
                                <th className="py-2.5 px-3 text-center">{t('risk.direction')}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-sage/25">
                              {sortedXaiFeatures.map((item, idx) => (
                                <tr key={idx} className="hover:bg-white/60 transition-colors">
                                  <td className="py-2.5 px-3 font-semibold text-brand-dark">
                                    {getLocalizedFeatureName(item, item.shap_value < 0)}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-xs text-muted-text">
                                    {item.feature}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-right font-bold text-brand-dark">
                                    {item.shap_value > 0 ? `+${item.shap_value.toFixed(4)}` : item.shap_value.toFixed(4)}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-right font-bold text-brand-dark">
                                    {(item.importance !== undefined ? item.importance : Math.abs(item.shap_value || 0)).toFixed(4)}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    <span className={cn(
                                      "inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full",
                                      item.direction === 'increases_risk' || item.shap_value > 0
                                        ? "bg-alert-muted/20 text-[#8F443B]"
                                        : "bg-brand-sage/30 text-brand-dark"
                                    )}>
                                      {item.direction === 'increases_risk' || item.shap_value > 0 ? `↑ ${t('risk.increasesRisk')}` : `↓ ${t('risk.lowersRisk')}`}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 3. PERSONAL BASELINE COMPARISONS (CLINICAL RULE ENGINE) */}
          {/* ========================================================================= */}
          {elevatedFactors.length > 0 && (
            <Card className="p-7 sm:p-8 border-2 border-brand-sage/50 rounded-[26px] bg-white shadow-soft space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-brand-sage/30">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-brand-teal" />
                    <h2 className="text-section-lg font-bold text-brand-dark">
                      {t('risk.personalBaselineTitle')}
                    </h2>
                  </div>
                  <p className="text-meta-md text-muted-text">
                    {t('risk.personalBaselineDesc')}
                  </p>
                </div>
                <Badge variant="sage" size="md">
                  {t('risk.thresholdEngine')}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {elevatedFactors.map((rawFactor, idx) => {
                  const factor = localizeElevatedFactor(rawFactor, t);
                  return (
                    <div key={idx} className="p-4 bg-[#FAF9F5] border border-brand-sage/40 rounded-[16px] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-brand-dark text-body-md">
                          {factor.factor} ({factor.value})
                        </span>
                        <Badge variant={factor.statusType === 'alert' ? 'alert' : 'teal'} size="sm">
                          {factor.comparison}
                        </Badge>
                      </div>
                      <p className="text-meta-sm text-muted-text leading-relaxed">
                        {factor.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* DISCLAIMER */}
          <div className="p-4 rounded-[18px] bg-brand-sage/15 border border-brand-sage/30 text-center text-meta-sm text-muted-text max-w-3xl mx-auto space-y-1">
            <p className="font-semibold text-brand-dark">
              {t('risk.clinicalDisclaimer')}
            </p>
            <p>
              {t('risk.disclaimerText')}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default RiskAnalysisPage;
