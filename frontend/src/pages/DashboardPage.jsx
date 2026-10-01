import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ROUTES } from '../utils/constants';
import { predictionService } from '../services/predictionService';
import { trackingService } from '../services/trackingService';
import { insightsService } from '../services/insightsService';
import { reportService } from '../services/reportService';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useTranslation } from '../hooks/useTranslation';
import { weatherService } from '../services/weatherService';
import { localizeElevatedFactor, localizeFocusArea } from '../utils/baselineHelper';
import { cn } from '../utils/cn';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  CalendarCheck,
  Moon,
  Brain,
  SunMedium,
  Droplets,
  Sparkles,
  ArrowRight,
  Info,
  Calendar,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export function DashboardPage() {
  const currentUser = useCurrentUser();
  const { t, language } = useTranslation();
  const [prediction, setPrediction] = useState(null);
  const [todayLog, setTodayLog] = useState(null);
  const [reportSummary, setReportSummary] = useState(null);
  const [weeklyInsights, setWeeklyInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  // Morning Prediction States
  const [morningSleep, setMorningSleep] = useState(7.5);
  const [morningSleepQuality, setMorningSleepQuality] = useState(4);
  const [morningStress, setMorningStress] = useState(3);
  const [morningMood, setMorningMood] = useState(4);
  const [submittingMorning, setSubmittingMorning] = useState(false);
  const [morningError, setMorningError] = useState(null);

  const handleMorningPredictionSubmit = async (e) => {
    e.preventDefault();
    setSubmittingMorning(true);
    setMorningError(null);

    let lat = undefined;
    let lon = undefined;

    try {
      const locResult = await weatherService.requestBrowserLocation();
      if (locResult.success && locResult.coords) {
        lat = locResult.coords.latitude;
        lon = locResult.coords.longitude;
      }
    } catch (locErr) {
      console.warn('[DashboardPage] Geolocation fetch skipped:', locErr.message);
    }

    try {
      const payload = {
        sleep_hours: Number(morningSleep),
        sleep_quality: Number(morningSleepQuality),
        morning_stress: Number(morningStress),
        morning_mood: Number(morningMood),
        latitude: lat,
        longitude: lon,
      };

      const result = await predictionService.submitMorningPrediction(payload);
      if (result) {
        setPrediction(result);
        setTodayLog((prev) => ({
          ...prev,
          sleep_hours: Number(morningSleep),
          sleep_quality: Number(morningSleepQuality),
          daily_stress: Number(morningStress),
          mood: Number(morningMood),
        }));
      } else {
        setMorningError(t('risk.serviceUnavailable'));
      }
    } catch (err) {
      setMorningError(err.message || 'An error occurred.');
    } finally {
      setSubmittingMorning(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        const [forecastData, logData, summaryData, insightsData] = await Promise.all([
          predictionService.getTodayPrediction(),
          trackingService.fetchTodayLog(),
          reportService.getReportSummary('weekly'),
          insightsService.getWeeklyInsights(),
        ]);

        if (isMounted) {
          setPrediction(forecastData);
          setTodayLog(logData);
          setReportSummary(summaryData);
          setWeeklyInsights(insightsData);
          setLoading(false);
        }
      } catch (err) {
        console.warn('[DashboardPage] Error loading user dashboard data:', err.message);
        if (isMounted) setLoading(false);
      }
    }

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  const hasForecast = Boolean(prediction && prediction.score !== undefined && prediction.score !== null);
  const currentScore = hasForecast ? prediction.score : null;
  const currentLevel = hasForecast ? prediction.level : null;
  const elevatedFactors = prediction?.elevatedFactors || [];
  const focusAreas = prediction?.focusAreas || [];
  const riskTrend = reportSummary?.riskTrend || [];

  const userName = currentUser?.name ? currentUser.name.split(' ')[0] : 'User';

  const getGreetingText = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return t('dashboard.goodMorning', { name: userName });
    } else if (hour < 18) {
      return t('dashboard.goodAfternoon', { name: userName });
    } else {
      return t('dashboard.goodEvening', { name: userName });
    }
  };

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white border-2 border-brand-sage/60 p-3.5 rounded-card-sm shadow-soft text-meta-sm space-y-1">
          <div className="font-bold text-brand-dark flex items-center justify-between gap-3">
            <span>{item.day || item.date}</span>
            {item.isMigraineDay && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-alert-muted/20 text-[#8F443B] font-bold">
                {t('dashboard.episodeLogged')}
              </span>
            )}
          </div>
          <div className="text-muted-text-dark flex items-center justify-between gap-4 font-medium">
            <span>{t('dashboard.riskIndex')}:</span>
            <span className="font-extrabold text-brand-dark">{item.risk}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-3 py-12">
        <Loader2 className="w-8 h-8 text-brand-teal animate-spin" />
        <span className="text-body-md font-semibold text-brand-dark">
          {t('dashboard.loadingData')}
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-9 py-2 pb-12 animate-in fade-in duration-200">
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-brand-sage/35">
        <div className="space-y-1 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-brand-sage/20 border border-brand-sage/45 text-meta-sm text-brand-dark font-medium mb-1">
            <span className="w-2 h-2 rounded-full bg-brand-teal animate-pulse" />
            <span>{t('dashboard.activeContinuousMonitoring')}</span>
          </div>
          <h1 className="text-app-xl sm:text-[34px] font-extrabold text-brand-dark tracking-tight leading-tight">
            {getGreetingText()}
          </h1>
          <p className="text-body-md text-[#555B55]">
            {t('dashboard.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <Link to={ROUTES.DAILY_CHECKIN}>
            <Button
              variant="primary"
              size="lg"
              icon={CalendarCheck}
              iconRight={ArrowRight}
              className="shadow-md font-bold px-5 cursor-pointer"
            >
              {t('dashboard.completeCheckinBtn')}
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. HERO RISK FORECAST */}
      <Card variant="warm" className="p-7 sm:p-9 border-2 border-brand-sage/60 rounded-[28px] shadow-[0_12px_36px_-8px_rgba(38,53,47,0.08)] space-y-7">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Gauge & Headline */}
          <div className="lg:col-span-5 space-y-5 lg:border-r border-brand-sage/35 lg:pr-8 text-left">
            <div className="flex items-center justify-between">
              <span className="text-meta-sm font-bold uppercase tracking-wider text-muted-text-dark">
                {t('dashboard.todaysRiskEstimate')}
              </span>
              <Badge variant={currentLevel === 'High' ? 'alert' : currentLevel === 'Moderate' ? 'warning' : 'teal'} size="md">
                {currentLevel ? t('dashboard.sensitivity', { level: currentLevel }) : t('dashboard.noForecastYet')}
              </Badge>
            </div>

            <div className="flex items-center gap-5">
              <div className={cn(
                "w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 flex flex-col items-center justify-center flex-shrink-0 shadow-sm",
                currentLevel === 'High' ? "bg-alert-muted/15 border-alert-muted/40 text-[#8F443B]" : "bg-brand-teal/15 border-brand-teal/40 text-brand-dark"
              )}>
                <span className="text-[32px] sm:text-[38px] font-black leading-none">
                  {currentScore !== null ? `${currentScore}%` : '--'}
                </span>
                <span className="text-[10px] uppercase font-extrabold tracking-wider mt-1">
                  {currentLevel || t('common.noData')}
                </span>
              </div>

              <div className="space-y-1 text-left">
                <h2 className="text-section-lg font-bold text-brand-dark leading-tight">
                  {hasForecast
                    ? currentLevel === 'High'
                      ? t('risk.headlineHigh')
                      : currentLevel === 'Low'
                      ? t('risk.headlineLow')
                      : t('risk.headlineModerate')
                    : t('dashboard.noForecastYet')}
                </h2>
                <p className="text-meta-md text-[#555B55] leading-relaxed">
                  {hasForecast
                    ? t('dashboard.forecastSummaryTemplate', { score: currentScore, level: currentLevel || 'Moderate' })
                    : t('dashboard.noForecastDesc')}
                </p>
              </div>
            </div>

            {/* Recommendation Pill */}
            {focusAreas.length > 0 && (() => {
              const localizedFocus = localizeFocusArea(focusAreas[0], t);
              return (
                <div className="p-4 rounded-[18px] bg-white border border-brand-sage/40 text-meta-md text-brand-dark flex items-start gap-3 shadow-sm">
                  <Sparkles className="w-5 h-5 text-brand-teal flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed text-[#333833]">
                    <strong className="font-semibold text-brand-dark block">{localizedFocus.title}:</strong>
                    {localizedFocus.description}
                  </p>
                </div>
              );
            })()}

            <Link to={ROUTES.RISK_ANALYSIS} className="block pt-1">
              <Button variant="outline" size="md" className="w-full font-semibold border-brand-sage/60 cursor-pointer" iconRight={ArrowRight}>
                {t('dashboard.viewRiskDetails')}
              </Button>
            </Link>
          </div>

          {/* Right Column: Elevated Factors */}
          <div className="lg:col-span-7 space-y-4 text-left">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-brand-teal" />
                <h3 className="text-section-md font-bold text-brand-dark">
                  {t('dashboard.elevatedFactors')}
                </h3>
              </div>
              <span className="text-meta-sm text-muted-text">{t('dashboard.measuredVsBaseline')}</span>
            </div>

            <div className="space-y-3">
              {elevatedFactors.length > 0 ? (
                elevatedFactors.slice(0, 3).map((rawFactor, idx) => {
                  const factor = localizeElevatedFactor(rawFactor, t);
                  return (
                    <div key={idx} className="p-4 rounded-[18px] bg-white border-2 border-brand-sage/40 shadow-sm flex items-center justify-between gap-4 hover:border-brand-teal transition-all">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-alert-muted/15 border border-alert-muted/30 flex items-center justify-center text-[#8F443B] flex-shrink-0">
                          {rawFactor.factor === 'Sleep' ? <Moon className="w-5 h-5" /> : rawFactor.factor === 'Stress' ? <Brain className="w-5 h-5" /> : <SunMedium className="w-5 h-5 text-brand-teal" />}
                        </div>
                        <div>
                          <span className="text-body-md font-bold text-brand-dark block leading-none">
                            {factor.factor} ({factor.value})
                          </span>
                          <span className="text-meta-sm text-muted-text mt-1 block">
                            {factor.description}
                          </span>
                        </div>
                      </div>
                      <Badge variant={factor.statusType === 'alert' ? 'alert' : 'teal'} size="sm">
                        {factor.comparison}
                      </Badge>
                    </div>
                  );
                })
              ) : (
                <div className="p-5 rounded-[18px] bg-white border border-brand-sage/35 text-center text-muted-text">
                  {hasForecast ? t('dashboard.noElevatedFactors') : t('dashboard.noForecastDesc')}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {!hasForecast && (
        <Card className="p-7 border-2 border-brand-sage/60 rounded-[28px] shadow-soft max-w-xl mx-auto space-y-6 text-left">
          <div className="space-y-1">
            <h3 className="text-section-md font-bold text-brand-dark flex items-center gap-2">
              <SunMedium className="w-5 h-5 text-brand-teal" />
              {t('dashboard.morningCheckinTitle')}
            </h3>
            <p className="text-meta-md text-[#555B55]">
              {t('dashboard.noForecastDesc')}
            </p>
          </div>

          {morningError && (
            <div className="p-3 rounded-lg bg-alert-muted/15 border border-alert-muted/30 text-meta-sm text-[#8F443B] flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{morningError}</span>
            </div>
          )}

          <form onSubmit={handleMorningPredictionSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-meta-sm font-bold text-brand-dark">{t('dashboard.sleepDuration')}</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={morningSleep}
                  onChange={(e) => setMorningSleep(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-brand-sage/50 text-body-md text-brand-dark focus:border-brand-teal focus:ring-1 focus:ring-brand-teal focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-meta-sm font-bold text-brand-dark">{t('dashboard.sleepQualityLabel')}</label>
                <select
                  value={morningSleepQuality}
                  onChange={(e) => setMorningSleepQuality(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-brand-sage/50 text-body-md text-brand-dark focus:border-brand-teal focus:ring-1 focus:ring-brand-teal focus:outline-none bg-white"
                  required
                >
                  <option value="1">1 - {t('checkin.sleepQualityOptions.1')}</option>
                  <option value="2">2 - {t('checkin.sleepQualityOptions.2')}</option>
                  <option value="3">3 - {t('checkin.sleepQualityOptions.3')}</option>
                  <option value="4">4 - {t('checkin.sleepQualityOptions.4')}</option>
                  <option value="5">5 - {t('checkin.sleepQualityOptions.5')}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-meta-sm font-bold text-brand-dark">{t('dashboard.dailyStress')}</label>
                <select
                  value={morningStress}
                  onChange={(e) => setMorningStress(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-brand-sage/50 text-body-md text-brand-dark focus:border-brand-teal focus:ring-1 focus:ring-brand-teal focus:outline-none bg-white"
                  required
                >
                  {[...Array(11).keys()].map((num) => (
                    <option key={num} value={num}>{num} {num === 0 ? '(0)' : num === 10 ? '(10)' : ''}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-meta-sm font-bold text-brand-dark">{t('dashboard.morningMoodLabel')}</label>
                <select
                  value={morningMood}
                  onChange={(e) => setMorningMood(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-brand-sage/50 text-body-md text-brand-dark focus:border-brand-teal focus:ring-1 focus:ring-brand-teal focus:outline-none bg-white"
                  required
                >
                  <option value="1">1 - {t('checkin.moodOptions.1')}</option>
                  <option value="2">2 - {t('checkin.moodOptions.2')}</option>
                  <option value="3">3 - {t('checkin.moodOptions.3')}</option>
                  <option value="4">4 - {t('checkin.moodOptions.4')}</option>
                  <option value="5">5 - {t('checkin.moodOptions.5')}</option>
                </select>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5 font-bold rounded-xl shadow-soft cursor-pointer"
              disabled={submittingMorning}
            >
              {submittingMorning ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('common.loading')}
                </span>
              ) : t('dashboard.calculateForecastBtn')}
            </Button>
          </form>
        </Card>
      )}

      {/* 3. BASELINES */}
      <div className="space-y-4 text-left">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-section-lg font-bold text-brand-dark">
              {t('dashboard.quickMetricsTitle')}
            </h2>
            <p className="text-meta-md text-muted-text">
              {t('dashboard.sevenDayRiskSub')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Sleep */}
          <div className="p-5 rounded-[22px] bg-white border-2 border-brand-sage/50 shadow-soft hover:shadow-soft-md transition-all space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-text font-bold text-meta-md">
                <Moon className="w-4 h-4 text-brand-teal" />
                <span>{t('dashboard.sleepDuration')}</span>
              </div>
              <Badge variant={todayLog?.sleep_hours ? 'teal' : 'neutral'} size="sm">
                {todayLog?.sleep_hours ? `${todayLog.sleep_hours} h` : t('common.noData')}
              </Badge>
            </div>
            <div>
              <div className="text-[26px] font-extrabold text-brand-dark leading-none">
                {todayLog?.sleep_hours ? `${todayLog.sleep_hours} hrs` : t('common.noData')}
              </div>
              <span className="text-meta-sm text-muted-text mt-1 block">{t('dashboard.targetHours')}</span>
            </div>
          </div>

          {/* Stress */}
          <div className="p-5 rounded-[22px] bg-white border-2 border-brand-sage/50 shadow-soft hover:shadow-soft-md transition-all space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-text font-bold text-meta-md">
                <Brain className="w-4 h-4 text-brand-teal" />
                <span>{t('dashboard.dailyStress')}</span>
              </div>
              <Badge variant={todayLog?.daily_stress ? 'teal' : 'neutral'} size="sm">
                {todayLog?.daily_stress ? `${todayLog.daily_stress} / 10` : t('common.noData')}
              </Badge>
            </div>
            <div>
              <div className="text-[26px] font-extrabold text-brand-dark leading-none">
                {todayLog?.daily_stress ? `${todayLog.daily_stress} / 10` : t('common.noData')}
              </div>
              <span className="text-meta-sm text-muted-text mt-1 block">{t('dashboard.outOfTen')}</span>
            </div>
          </div>

          {/* Screen Time */}
          <div className="p-5 rounded-[22px] bg-white border-2 border-brand-sage/50 shadow-soft hover:shadow-soft-md transition-all space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-text font-bold text-meta-md">
                <SunMedium className="w-4 h-4 text-brand-teal" />
                <span>{t('dashboard.screenTime')}</span>
              </div>
              <Badge variant={todayLog?.screen_time ? 'teal' : 'neutral'} size="sm">
                {todayLog?.screen_time ? `${todayLog.screen_time} h` : t('common.noData')}
              </Badge>
            </div>
            <div>
              <div className="text-[26px] font-extrabold text-brand-dark leading-none">
                {todayLog?.screen_time ? `${todayLog.screen_time} hrs` : t('common.noData')}
              </div>
              <span className="text-meta-sm text-muted-text mt-1 block">{t('dashboard.hoursRecorded')}</span>
            </div>
          </div>

          {/* Hydration */}
          <div className="p-5 rounded-[22px] bg-white border-2 border-brand-sage/50 shadow-soft hover:shadow-soft-md transition-all space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-text font-bold text-meta-md">
                <Droplets className="w-4 h-4 text-brand-teal" />
                <span>{t('dashboard.hydrationIntake')}</span>
              </div>
              <Badge variant={todayLog?.hydration ? 'teal' : 'neutral'} size="sm">
                {todayLog?.hydration ? `${todayLog.hydration} L` : t('common.noData')}
              </Badge>
            </div>
            <div>
              <div className="text-[26px] font-extrabold text-brand-dark leading-none">
                {todayLog?.hydration ? `${todayLog.hydration} L` : t('common.noData')}
              </div>
              <span className="text-meta-sm text-muted-text mt-1 block">{t('dashboard.targetLiters')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. TREND & SNAPSHOT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
        <div className="lg:col-span-7">
          <Card className="p-6 sm:p-7 space-y-4 bg-white border-2 border-brand-sage/50 rounded-[26px] shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle as="h2" className="text-section-lg font-bold text-brand-dark">
                  {t('dashboard.sevenDayRiskTrend')}
                </CardTitle>
                <CardDescription className="text-meta-md text-muted-text">
                  {t('dashboard.sevenDayRiskSub')}
                </CardDescription>
              </div>
              <Badge variant="sage" size="sm">{t('analytics.timeRange7')}</Badge>
            </div>

            <div className="h-64 sm:h-72 w-full pt-2">
              {riskTrend && riskTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={riskTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dashboardGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6F9990" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#A8B9A5" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E3E1D7" vertical={false} />
                    <XAxis dataKey="date" stroke="#737873" fontSize={12} tickLine={false} axisLine={{ stroke: '#E3E1D7' }} />
                    <YAxis stroke="#737873" fontSize={12} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="risk"
                      stroke="#26352F"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#dashboardGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-brand-sage/40 rounded-[20px] text-center space-y-2">
                  <AlertCircle className="w-6 h-6 text-brand-teal" />
                  <p className="text-meta-md font-bold text-brand-dark">{t('dashboard.noForecastYet')}</p>
                  <p className="text-meta-sm text-muted-text max-w-sm">
                    {t('dashboard.noForecastDesc')}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-5">
          <Card className="p-6 sm:p-7 space-y-4 bg-white border-2 border-brand-sage/50 rounded-[26px] shadow-soft h-full flex flex-col justify-between">
            <div className="space-y-1">
              <CardTitle as="h2" className="text-section-lg font-bold text-brand-dark">
                {t('reports.weeklySummaryTitle')}
              </CardTitle>
              <CardDescription className="text-meta-md text-muted-text">
                {t('dashboard.recentPatterns')}
              </CardDescription>
            </div>

            <div className="grid grid-cols-2 gap-3.5 py-1">
              <div className="p-4 rounded-[18px] bg-[#FAF9F5] border border-brand-sage/35 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-text text-meta-sm font-semibold">
                  <Calendar className="w-4 h-4 text-brand-teal" />
                  <span>{t('analytics.migraineDays')}</span>
                </div>
                <div className="text-[26px] font-black text-brand-dark">
                  {weeklyInsights?.summary?.migraineDays ?? 0}
                </div>
              </div>

              <div className="p-4 rounded-[18px] bg-[#FAF9F5] border border-brand-sage/35 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-text text-meta-sm font-semibold">
                  <Moon className="w-4 h-4 text-brand-teal" />
                  <span>{t('dashboard.sleepDuration')}</span>
                </div>
                <div className="text-[26px] font-black text-brand-dark">
                  {weeklyInsights?.summary?.avgSleep || t('common.noData')}
                </div>
              </div>
            </div>

            <Link to={ROUTES.ANALYTICS} className="pt-2">
              <Button variant="secondary" size="md" className="w-full font-bold border-brand-sage/40 cursor-pointer" iconRight={ArrowRight}>
                {t('pageTitles.analytics')}
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
