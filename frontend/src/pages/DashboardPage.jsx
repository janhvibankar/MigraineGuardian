import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ROUTES } from '../utils/constants';
import { getTimeBasedGreeting } from '../utils/formatters';
import { predictionService } from '../services/predictionService';
import { trackingService } from '../services/trackingService';
import { insightsService } from '../services/insightsService';
import { reportService } from '../services/reportService';
import { useCurrentUser } from '../hooks/useCurrentUser';
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
  const [prediction, setPrediction] = useState(null);
  const [todayLog, setTodayLog] = useState(null);
  const [reportSummary, setReportSummary] = useState(null);
  const [weeklyInsights, setWeeklyInsights] = useState(null);
  const [loading, setLoading] = useState(true);

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
                Episode Logged
              </span>
            )}
          </div>
          <div className="text-muted-text-dark flex items-center justify-between gap-4 font-medium">
            <span>Risk Index:</span>
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
          Loading your health data...
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
            <span>Active Continuous Monitoring</span>
          </div>
          <h1 className="text-app-xl sm:text-[34px] font-extrabold text-brand-dark tracking-tight leading-tight">
            {getTimeBasedGreeting(currentUser?.name ? currentUser.name.split(' ')[0] : 'User')}
          </h1>
          <p className="text-body-md text-[#555B55]">
            Here is your daily physiological sensitivity forecast and recovery baseline.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <Link to={ROUTES.DAILY_CHECKIN}>
            <Button
              variant="primary"
              size="lg"
              icon={CalendarCheck}
              iconRight={ArrowRight}
              className="shadow-md font-bold px-5"
            >
              Complete Today's Check-in
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
                Today's Risk Estimate
              </span>
              <Badge variant={currentLevel === 'High' ? 'alert' : currentLevel === 'Moderate' ? 'warning' : 'teal'} size="md">
                {currentLevel ? `${currentLevel} Sensitivity` : 'No Forecast Yet'}
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
                  {currentLevel || 'No Data'}
                </span>
              </div>

              <div className="space-y-1 text-left">
                <h2 className="text-section-lg font-bold text-brand-dark leading-tight">
                  {hasForecast ? prediction.headline : 'No Risk Estimate Yet'}
                </h2>
                <p className="text-meta-md text-[#555B55] leading-relaxed">
                  {hasForecast
                    ? prediction.summary
                    : "Complete today's check-in to generate your personalized AI risk forecast."}
                </p>
              </div>
            </div>

            {/* Recommendation Pill */}
            {focusAreas.length > 0 && (
              <div className="p-4 rounded-[18px] bg-white border border-brand-sage/40 text-meta-md text-brand-dark flex items-start gap-3 shadow-sm">
                <Sparkles className="w-5 h-5 text-brand-teal flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[#333833]">
                  <strong className="font-semibold text-brand-dark block">{focusAreas[0].title}:</strong>
                  {focusAreas[0].description}
                </p>
              </div>
            )}

            <Link to={ROUTES.RISK_ANALYSIS} className="block pt-1">
              <Button variant="outline" size="md" className="w-full font-semibold border-brand-sage/60" iconRight={ArrowRight}>
                View Full Diagnostic Breakdown
              </Button>
            </Link>
          </div>

          {/* Right Column: Elevated Factors */}
          <div className="lg:col-span-7 space-y-4 text-left">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-brand-teal" />
                <h3 className="text-section-md font-bold text-brand-dark">
                  Primary Contributing Factors
                </h3>
              </div>
              <span className="text-meta-sm text-muted-text">Measured vs personal baseline</span>
            </div>

            <div className="space-y-3">
              {elevatedFactors.length > 0 ? (
                elevatedFactors.slice(0, 3).map((factor, idx) => (
                  <div key={idx} className="p-4 rounded-[18px] bg-white border-2 border-brand-sage/40 shadow-sm flex items-center justify-between gap-4 hover:border-brand-teal transition-all">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-alert-muted/15 border border-alert-muted/30 flex items-center justify-center text-[#8F443B] flex-shrink-0">
                        {factor.factor === 'Sleep' ? <Moon className="w-5 h-5" /> : factor.factor === 'Stress' ? <Brain className="w-5 h-5" /> : <SunMedium className="w-5 h-5 text-brand-teal" />}
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
                ))
              ) : (
                <div className="p-5 rounded-[18px] bg-white border border-brand-sage/35 text-center text-muted-text">
                  {hasForecast ? 'No elevated risk factors detected today.' : 'No check-in signals recorded for today yet.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* 3. BASELINES */}
      <div className="space-y-4 text-left">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-section-lg font-bold text-brand-dark">
              Today's Monitored Baselines
            </h2>
            <p className="text-meta-md text-muted-text">
              Real-time balance across your active lifestyle pillars.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Sleep */}
          <div className="p-5 rounded-[22px] bg-white border-2 border-brand-sage/50 shadow-soft hover:shadow-soft-md transition-all space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-text font-bold text-meta-md">
                <Moon className="w-4 h-4 text-brand-teal" />
                <span>Sleep Rest</span>
              </div>
              <Badge variant={todayLog?.sleep_hours ? 'teal' : 'neutral'} size="sm">
                {todayLog?.sleep_hours ? `${todayLog.sleep_hours} h` : 'No data'}
              </Badge>
            </div>
            <div>
              <div className="text-[26px] font-extrabold text-brand-dark leading-none">
                {todayLog?.sleep_hours ? `${todayLog.sleep_hours} hrs` : 'No data yet'}
              </div>
              <span className="text-meta-sm text-[#737873] mt-1 block">Target: 7.5 hrs</span>
            </div>
          </div>

          {/* Stress */}
          <div className="p-5 rounded-[22px] bg-white border-2 border-brand-sage/50 shadow-soft hover:shadow-soft-md transition-all space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-text font-bold text-meta-md">
                <Brain className="w-4 h-4 text-brand-teal" />
                <span>Daily Stress</span>
              </div>
              <Badge variant={todayLog?.daily_stress ? 'teal' : 'neutral'} size="sm">
                {todayLog?.daily_stress ? `${todayLog.daily_stress} / 10` : 'No data'}
              </Badge>
            </div>
            <div>
              <div className="text-[26px] font-extrabold text-brand-dark leading-none">
                {todayLog?.daily_stress ? `${todayLog.daily_stress} / 10` : 'No data yet'}
              </div>
              <span className="text-meta-sm text-[#737873] mt-1 block">Target: &lt; 5 / 10</span>
            </div>
          </div>

          {/* Screen Time */}
          <div className="p-5 rounded-[22px] bg-white border-2 border-brand-sage/50 shadow-soft hover:shadow-soft-md transition-all space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-text font-bold text-meta-md">
                <SunMedium className="w-4 h-4 text-brand-teal" />
                <span>Screen Glare</span>
              </div>
              <Badge variant={todayLog?.screen_time ? 'teal' : 'neutral'} size="sm">
                {todayLog?.screen_time ? `${todayLog.screen_time} h` : 'No data'}
              </Badge>
            </div>
            <div>
              <div className="text-[26px] font-extrabold text-brand-dark leading-none">
                {todayLog?.screen_time ? `${todayLog.screen_time} hrs` : 'No data yet'}
              </div>
              <span className="text-meta-sm text-[#737873] mt-1 block">Target: &lt; 6.0 hrs</span>
            </div>
          </div>

          {/* Hydration */}
          <div className="p-5 rounded-[22px] bg-white border-2 border-brand-sage/50 shadow-soft hover:shadow-soft-md transition-all space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-text font-bold text-meta-md">
                <Droplets className="w-4 h-4 text-brand-teal" />
                <span>Hydration</span>
              </div>
              <Badge variant={todayLog?.hydration ? 'teal' : 'neutral'} size="sm">
                {todayLog?.hydration ? `${todayLog.hydration} L` : 'No data'}
              </Badge>
            </div>
            <div>
              <div className="text-[26px] font-extrabold text-brand-dark leading-none">
                {todayLog?.hydration ? `${todayLog.hydration} L` : 'No data yet'}
              </div>
              <span className="text-meta-sm text-[#737873] mt-1 block">Target: 2.2 L</span>
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
                  7-Day Risk & Episode Horizon
                </CardTitle>
                <CardDescription className="text-meta-md text-muted-text">
                  Longitudinal likelihood trajectory and logged migraine days
                </CardDescription>
              </div>
              <Badge variant="sage" size="sm">7-Day History</Badge>
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
                  <p className="text-meta-md font-bold text-brand-dark">No risk history available yet.</p>
                  <p className="text-meta-sm text-muted-text max-w-sm">
                    Complete daily check-ins to build your personalized risk history.
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
                Weekly Health Snapshot
              </CardTitle>
              <CardDescription className="text-meta-md text-muted-text">
                Summary of your 7-day logged patterns
              </CardDescription>
            </div>

            <div className="grid grid-cols-2 gap-3.5 py-1">
              <div className="p-4 rounded-[18px] bg-[#FAF9F5] border border-brand-sage/35 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-text text-meta-sm font-semibold">
                  <Calendar className="w-4 h-4 text-brand-teal" />
                  <span>Migraine days</span>
                </div>
                <div className="text-[26px] font-black text-brand-dark">
                  {weeklyInsights?.summary?.migraineDays ?? 0}
                </div>
              </div>

              <div className="p-4 rounded-[18px] bg-[#FAF9F5] border border-brand-sage/35 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-text text-meta-sm font-semibold">
                  <Moon className="w-4 h-4 text-brand-teal" />
                  <span>Avg sleep</span>
                </div>
                <div className="text-[26px] font-black text-brand-dark">
                  {weeklyInsights?.summary?.avgSleep || 'No data'}
                </div>
              </div>
            </div>

            <Link to={ROUTES.ANALYTICS} className="pt-2">
              <Button variant="secondary" size="md" className="w-full font-bold border-brand-sage/40" iconRight={ArrowRight}>
                Explore Full Analytics
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
