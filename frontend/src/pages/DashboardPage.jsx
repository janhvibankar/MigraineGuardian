import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ROUTES } from '../utils/constants';
import { getTimeBasedGreeting } from '../utils/formatters';
import { predictionService } from '../services/predictionService';
import { insightsService } from '../services/insightsService';
import { useCurrentUser } from '../hooks/useCurrentUser';
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
  Activity,
  Moon,
  Brain,
  SunMedium,
  Droplets,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Bot,
  Info,
  Calendar,
  Clock,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '../utils/cn';

export function DashboardPage() {
  // Service Calls & State
  const currentUser = useCurrentUser();
  const prediction = predictionService.getTodayPrediction();
  const riskTrend = predictionService.getRiskTrend('7days');
  const weeklyInsights = insightsService.getWeeklyInsights();

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
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

  return (
    <div className="max-w-7xl mx-auto space-y-9 py-2 pb-12 animate-in fade-in duration-200">
      {/* =========================================================================
          1. CLEAN WELCOME & QUICK ACTION HEADER
         ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-brand-sage/35">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-brand-sage/20 border border-brand-sage/45 text-meta-sm text-brand-dark font-medium mb-1">
            <span className="w-2 h-2 rounded-full bg-brand-teal animate-pulse" />
            <span>Active Continuous Monitoring</span>
          </div>
          <h1 className="text-app-xl sm:text-[34px] font-extrabold text-brand-dark tracking-tight leading-tight">
            {getTimeBasedGreeting(currentUser?.name ? currentUser.name.split(' ')[0] : 'Sakshi')}
          </h1>
          <p className="text-body-md text-[#555B55]">
            Here is your daily physiological sensitivity forecast and recovery baseline.
          </p>
        </div>

        {/* Primary Daily Action */}
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

      {/* =========================================================================
          2. SPACIOUS HERO RISK FORECAST & PRIMARY DRIVERS (Clean 2-Column Split)
         ========================================================================= */}
      <Card variant="warm" className="p-7 sm:p-9 border-2 border-brand-sage/60 rounded-[28px] shadow-[0_12px_36px_-8px_rgba(38,53,47,0.08)] space-y-7">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Risk Gauge & Meaning */}
          <div className="lg:col-span-5 space-y-5 lg:border-r border-brand-sage/35 lg:pr-8">
            <div className="flex items-center justify-between">
              <span className="text-meta-sm font-bold uppercase tracking-wider text-muted-text-dark">
                Today's Risk Estimate
              </span>
              <Badge variant="alert" size="md">
                Elevated Horizon
              </Badge>
            </div>

            {/* Gauge Score Display */}
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-alert-muted/15 border-2 border-alert-muted/40 flex flex-col items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-[34px] sm:text-[40px] font-black text-[#8F443B] leading-none">
                  {prediction.score}%
                </span>
                <span className="text-[10px] uppercase font-extrabold text-[#8F443B] tracking-wider mt-1">
                  High Risk
                </span>
              </div>

              <div className="space-y-1 text-left">
                <h2 className="text-section-lg font-bold text-brand-dark leading-tight">
                  High Sensitivity Window
                </h2>
                <p className="text-meta-md text-[#555B55] leading-relaxed">
                  Compound triggers detected. Your threshold to sensory stimulation is currently reduced.
                </p>
              </div>
            </div>

            {/* Micro Recommendation Pill */}
            <div className="p-4 rounded-[18px] bg-white border border-brand-sage/40 text-meta-md text-brand-dark flex items-start gap-3 shadow-sm">
              <Sparkles className="w-5 h-5 text-brand-teal flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[#333833]">
                <strong className="font-semibold text-brand-dark block">Recommended Protocol:</strong>
                Hydrate with 2.5L water before 3 PM, dim screen glare, and take a 15-min quiet restorative break.
              </p>
            </div>

            <Link to={ROUTES.RISK_ANALYSIS} className="block pt-1">
              <Button variant="outline" size="md" className="w-full font-semibold border-brand-sage/60" iconRight={ArrowRight}>
                View Full Diagnostic Breakdown
              </Button>
            </Link>
          </div>

          {/* Right Column: Top 3 Contributing Drivers */}
          <div className="lg:col-span-7 space-y-4">
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
              {/* Driver 1: Sleep */}
              <div className="p-4 rounded-[18px] bg-white border-2 border-brand-sage/40 shadow-sm flex items-center justify-between gap-4 hover:border-brand-teal transition-all">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-alert-muted/15 border border-alert-muted/30 flex items-center justify-center text-[#8F443B] flex-shrink-0">
                    <Moon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-body-md font-bold text-brand-dark block leading-none">
                      Sleep Duration (5.8h)
                    </span>
                    <span className="text-meta-sm text-muted-text mt-1 block">
                      1.8h deficit compared to your 7.6h baseline
                    </span>
                  </div>
                </div>
                <Badge variant="alert" size="sm">
                  -24% Deficit
                </Badge>
              </div>

              {/* Driver 2: Stress */}
              <div className="p-4 rounded-[18px] bg-white border-2 border-brand-sage/40 shadow-sm flex items-center justify-between gap-4 hover:border-brand-teal transition-all">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-alert-muted/15 border border-alert-muted/30 flex items-center justify-center text-[#8F443B] flex-shrink-0">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-body-md font-bold text-brand-dark block leading-none">
                      Autonomic Stress (8 / 10)
                    </span>
                    <span className="text-meta-sm text-muted-text mt-1 block">
                      Elevated sympathetics (Baseline: 4/10)
                    </span>
                  </div>
                </div>
                <Badge variant="alert" size="sm">
                  +100% Strain
                </Badge>
              </div>

              {/* Driver 3: Screen Glare */}
              <div className="p-4 rounded-[18px] bg-white border-2 border-brand-sage/40 shadow-sm flex items-center justify-between gap-4 hover:border-brand-teal transition-all">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-brand-teal/15 border border-brand-teal/30 flex items-center justify-center text-brand-dark flex-shrink-0">
                    <SunMedium className="w-5 h-5 text-brand-teal" />
                  </div>
                  <div>
                    <span className="text-body-md font-bold text-brand-dark block leading-none">
                      Screen Glare & Photophobia (8.2h)
                    </span>
                    <span className="text-meta-sm text-muted-text mt-1 block">
                      Continuous optical exposure (Baseline: 6.0h)
                    </span>
                  </div>
                </div>
                <Badge variant="teal" size="sm">
                  +36% Exposure
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* =========================================================================
          3. TODAY'S MONITORED BASELINES (Clean 4-Card Status Row)
         ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-section-lg font-bold text-brand-dark">
              Today's Physiological Baselines
            </h2>
            <p className="text-meta-md text-muted-text">
              Real-time balance across your 4 active lifestyle pillars.
            </p>
          </div>
          <span className="text-meta-sm text-muted-text bg-white px-3 py-1 rounded-full border border-brand-sage/40">
            Updated at 8:15 AM
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Sleep */}
          <div className="p-5 rounded-[22px] bg-white border-2 border-brand-sage/50 shadow-soft hover:shadow-soft-md transition-all space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-text font-bold text-meta-md">
                <Moon className="w-4 h-4 text-brand-teal" />
                <span>Sleep Rest</span>
              </div>
              <Badge variant="alert" size="sm">
                5.8 h
              </Badge>
            </div>
            <div>
              <div className="text-[28px] font-extrabold text-brand-dark leading-none">
                5.8 hrs
              </div>
              <span className="text-meta-sm text-[#737873] mt-1 block">
                Target: 7.5 hrs (Deficit)
              </span>
            </div>
          </div>

          {/* Card 2: Stress */}
          <div className="p-5 rounded-[22px] bg-white border-2 border-brand-sage/50 shadow-soft hover:shadow-soft-md transition-all space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-text font-bold text-meta-md">
                <Brain className="w-4 h-4 text-brand-teal" />
                <span>Daily Stress</span>
              </div>
              <Badge variant="alert" size="sm">
                8 / 10
              </Badge>
            </div>
            <div>
              <div className="text-[28px] font-extrabold text-brand-dark leading-none">
                8 / 10
              </div>
              <span className="text-meta-sm text-[#737873] mt-1 block">
                Target: &lt; 5 / 10 (High)
              </span>
            </div>
          </div>

          {/* Card 3: Screen Glare */}
          <div className="p-5 rounded-[22px] bg-white border-2 border-brand-sage/50 shadow-soft hover:shadow-soft-md transition-all space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-text font-bold text-meta-md">
                <SunMedium className="w-4 h-4 text-brand-teal" />
                <span>Screen Glare</span>
              </div>
              <Badge variant="alert" size="sm">
                8.2 h
              </Badge>
            </div>
            <div>
              <div className="text-[28px] font-extrabold text-brand-dark leading-none">
                8.2 hrs
              </div>
              <span className="text-meta-sm text-[#737873] mt-1 block">
                Target: &lt; 6.0 hrs
              </span>
            </div>
          </div>

          {/* Card 4: Hydration */}
          <div className="p-5 rounded-[22px] bg-white border-2 border-brand-sage/50 shadow-soft hover:shadow-soft-md transition-all space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-text font-bold text-meta-md">
                <Droplets className="w-4 h-4 text-brand-teal" />
                <span>Hydration</span>
              </div>
              <Badge variant="teal" size="sm">
                1.5 L
              </Badge>
            </div>
            <div>
              <div className="text-[28px] font-extrabold text-brand-dark leading-none">
                1.5 L
              </div>
              <span className="text-meta-sm text-[#737873] mt-1 block">
                Target: 2.2 L (0.7L to go)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. 7-DAY RECENT RISK TREND & WEEKLY HEALTH SNAPSHOT
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recharts Risk Trend Area Chart */}
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
              <Badge variant="sage" size="sm">
                7-Day History
              </Badge>
            </div>

            <div className="h-64 sm:h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={riskTrend}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="dashboardGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6F9990" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#A8B9A5" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E3E1D7" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#737873"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#E3E1D7' }}
                  />
                  <YAxis
                    stroke="#737873"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    unit="%"
                    domain={[0, 100]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="risk"
                    stroke="#26352F"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#dashboardGrad)"
                    dot={(props) => {
                      const { cx, cy, payload } = props;
                      if (payload.isMigraineDay) {
                        return (
                          <circle
                            key={payload.date}
                            cx={cx}
                            cy={cy}
                            r={5.5}
                            fill="#C98278"
                            stroke="#FFFFFF"
                            strokeWidth={2}
                          />
                        );
                      }
                      return (
                        <circle
                          key={payload.date}
                          cx={cx}
                          cy={cy}
                          r={3.5}
                          fill="#26352F"
                          stroke="#FFFFFF"
                          strokeWidth={1.5}
                        />
                      );
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-meta-sm text-muted-text pt-3 border-t border-brand-sage/30">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-dark" />
                <span className="font-semibold text-brand-dark">Estimated Risk %</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-alert-muted" />
                <span className="font-semibold text-[#8F443B]">Logged Migraine Day</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Weekly Health Snapshot Summary */}
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
                  {weeklyInsights.summary.migraineDays}
                </div>
                <div className="text-[11px] text-muted-text">This past week</div>
              </div>

              <div className="p-4 rounded-[18px] bg-[#FAF9F5] border border-brand-sage/35 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-text text-meta-sm font-semibold">
                  <Moon className="w-4 h-4 text-brand-teal" />
                  <span>Avg sleep</span>
                </div>
                <div className="text-[26px] font-black text-brand-dark">
                  {weeklyInsights.summary.avgSleep}
                </div>
                <div className="text-[11px] text-muted-text">7-day rolling average</div>
              </div>

              <div className="p-4 rounded-[18px] bg-[#FAF9F5] border border-brand-sage/35 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-text text-meta-sm font-semibold">
                  <Brain className="w-4 h-4 text-brand-teal" />
                  <span>Avg stress</span>
                </div>
                <div className="text-[26px] font-black text-brand-dark">
                  {weeklyInsights.summary.avgStress}
                </div>
                <div className="text-[11px] text-muted-text">Daily tracking average</div>
              </div>

              <div className="p-4 rounded-[18px] bg-[#FAF9F5] border border-brand-sage/35 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-text text-meta-sm font-semibold">
                  <SunMedium className="w-4 h-4 text-brand-teal" />
                  <span>Avg screen</span>
                </div>
                <div className="text-[26px] font-black text-brand-dark">
                  {weeklyInsights.summary.avgScreenTime}
                </div>
                <div className="text-[11px] text-muted-text">Optical exposure</div>
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
