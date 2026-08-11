import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ROUTES } from '../utils/constants';
import { analyticsService } from '../services/analyticsService';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  BarChart3,
  Activity,
  Calendar,
  Moon,
  Brain,
  SunMedium,
  Droplets,
  ArrowRight,
  ShieldCheck,
  Info,
  CalendarDays,
  Layers,
  Sparkles,
  ClipboardList,
} from 'lucide-react';
import { cn } from '../utils/cn';

export function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState('7days'); // '7days', '30days', '90days'
  const [hoveredDay, setHoveredDay] = useState(null);

  // Service calls
  const currentData = analyticsService.getAnalyticsData(timeframe);
  const calendarDays = analyticsService.getCalendarDays();

  // Custom Tooltip for Charts
  const CustomTooltip = ({ active, payload, label, unit = '' }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-muted-border p-2.5 rounded-card-sm shadow-soft text-meta-sm space-y-1">
          <div className="font-semibold text-brand-dark">{label}</div>
          {payload.map((entry, idx) => (
            <div key={idx} className="flex items-center justify-between gap-3 text-muted-text">
              <span className="capitalize">{entry.name || 'Value'}:</span>
              <span className="font-bold text-brand-dark">
                {entry.value} {unit}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* HEADER & TIMEFRAME FILTER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-muted-border/60">
        <div>
          <h1 className="text-app-xl sm:text-[32px] font-semibold text-brand-dark tracking-tight leading-tight">
            Your Analytics
          </h1>
          <p className="text-body-md text-muted-text mt-0.5">
            Dedicated longitudinal tracking workspace across physiological and behavioral factors.
          </p>
        </div>

        {/* Filter: 7 days, 30 days, 90 days */}
        <div className="inline-flex items-center p-1 rounded-card-sm bg-card-warm border border-card-warm-border self-start sm:self-auto select-none shadow-soft">
          {[
            { id: '7days', label: '7 days' },
            { id: '30days', label: '30 days' },
            { id: '90days', label: '90 days' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTimeframe(tab.id)}
              className={cn(
                'px-3.5 py-1.5 rounded-btn text-meta-md font-medium transition-all',
                timeframe === tab.id
                  ? 'bg-white text-brand-dark shadow-soft font-semibold border border-muted-border/70'
                  : 'text-muted-text hover:text-brand-dark'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TIMEFRAME SUMMARY CALLOUT */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-3.5 rounded-card-sm bg-white border border-muted-border shadow-soft">
          <span className="text-[11px] uppercase font-semibold text-muted-text-light block">Migraine Days</span>
          <span className="text-app-lg font-bold text-brand-dark mt-0.5 block">{currentData.summary.migraineDays}</span>
        </div>
        <div className="p-3.5 rounded-card-sm bg-white border border-muted-border shadow-soft">
          <span className="text-[11px] uppercase font-semibold text-muted-text-light block">Avg Risk</span>
          <span className="text-app-lg font-bold text-brand-dark mt-0.5 block">{currentData.summary.avgRisk}</span>
        </div>
        <div className="p-3.5 rounded-card-sm bg-white border border-muted-border shadow-soft">
          <span className="text-[11px] uppercase font-semibold text-muted-text-light block">Avg Sleep</span>
          <span className="text-app-lg font-bold text-brand-dark mt-0.5 block">{currentData.summary.avgSleep}</span>
        </div>
        <div className="p-3.5 rounded-card-sm bg-white border border-muted-border shadow-soft">
          <span className="text-[11px] uppercase font-semibold text-muted-text-light block">Avg Stress</span>
          <span className="text-app-lg font-bold text-brand-dark mt-0.5 block">{currentData.summary.avgStress}</span>
        </div>
        <div className="p-3.5 rounded-card-sm bg-white border border-muted-border shadow-soft col-span-2 sm:col-span-1">
          <span className="text-[11px] uppercase font-semibold text-muted-text-light block">Avg Screen</span>
          <span className="text-app-lg font-bold text-brand-dark mt-0.5 block">{currentData.summary.avgScreen}</span>
        </div>
      </div>

      {/* =========================================================================
          SECTION 1: RISK & EPISODE CHARTS (CHART 1 & CHART 2)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Risk Trend */}
        <Card className="p-6 space-y-4 bg-white shadow-soft">
          <div className="flex items-center justify-between pb-2 border-b border-muted-border/60">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-teal" />
              <h2 className="text-section-md font-semibold text-brand-dark">
                Chart 1: Risk Trend
              </h2>
            </div>
            <Badge variant="teal" size="sm">
              Probability %
            </Badge>
          </div>

          <div className="h-60 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentData.riskTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="analyticsRiskGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6F9990" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#A8B9A5" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3E1D7" vertical={false} />
                <XAxis dataKey="date" stroke="#737873" fontSize={11} tickLine={false} />
                <YAxis stroke="#737873" fontSize={11} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} />
                <Tooltip content={<CustomTooltip unit="%" />} />
                <Area
                  type="monotone"
                  dataKey="risk"
                  name="Risk Probability"
                  stroke="#26352F"
                  strokeWidth={2.5}
                  fill="url(#analyticsRiskGrad)"
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    if (payload.isMigraineDay) {
                      return <circle key={payload.date} cx={cx} cy={cy} r={5} fill="#C98278" stroke="#FFFFFF" strokeWidth={2} />;
                    }
                    return <circle key={payload.date} cx={cx} cy={cy} r={3} fill="#26352F" stroke="#FFFFFF" strokeWidth={1} />;
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-muted-text">
            Modeled sensitivity trajectory based on recent lifestyle and physiological entries.
          </p>
        </Card>

        {/* CHART 2: Migraine Frequency */}
        <Card className="p-6 space-y-4 bg-white shadow-soft">
          <div className="flex items-center justify-between pb-2 border-b border-muted-border/60">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-sage-dark" />
              <h2 className="text-section-md font-semibold text-brand-dark">
                Chart 2: Migraine Frequency
              </h2>
            </div>
            <Badge variant="sage" size="sm">
              Episode Count
            </Badge>
          </div>

          <div className="h-60 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentData.frequency} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3E1D7" vertical={false} />
                <XAxis dataKey="period" stroke="#737873" fontSize={11} tickLine={false} />
                <YAxis stroke="#737873" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} domain={[0, 4]} />
                <Tooltip content={<CustomTooltip unit=" episodes" />} />
                <Bar dataKey="count" name="Episodes" fill="#A8B9A5" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-muted-text">
            Total recorded migraine episodes distributed across the selected timeframe.
          </p>
        </Card>
      </div>

      {/* =========================================================================
          SECTION 2: SLEEP, STRESS & SCREEN TIME (CHARTS 3, 4, 5)
         ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CHART 3: Sleep Trend */}
        <Card className="p-5 space-y-3 bg-white shadow-soft">
          <div className="flex items-center justify-between pb-2 border-b border-muted-border/60">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-brand-teal" />
              <h3 className="text-section-md font-semibold text-brand-dark">
                Chart 3: Sleep Trend
              </h3>
            </div>
            <Badge variant="sage" size="sm">
              Hours
            </Badge>
          </div>

          <div className="h-52 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currentData.sleepTrend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3E1D7" vertical={false} />
                <XAxis dataKey="date" stroke="#737873" fontSize={10} tickLine={false} />
                <YAxis stroke="#737873" fontSize={10} tickLine={false} domain={[4, 10]} />
                <Tooltip content={<CustomTooltip unit=" hrs" />} />
                <ReferenceLine y={7.5} stroke="#6F9990" strokeDasharray="4 4" label={{ value: '7.5h Target', fill: '#6F9990', fontSize: 10, position: 'insideTopRight' }} />
                <Line type="monotone" dataKey="hours" name="Sleep Duration" stroke="#26352F" strokeWidth={2.5} dot={{ r: 3, fill: '#26352F' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <span className="text-[11px] text-muted-text block">Sleep hours vs 7.5h target baseline</span>
        </Card>

        {/* CHART 4: Daily Stress */}
        <Card className="p-5 space-y-3 bg-white shadow-soft">
          <div className="flex items-center justify-between pb-2 border-b border-muted-border/60">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-brand-teal" />
              <h3 className="text-section-md font-semibold text-brand-dark">
                Chart 4: Daily Stress
              </h3>
            </div>
            <Badge variant="alert" size="sm">
              0–10 Scale
            </Badge>
          </div>

          <div className="h-52 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currentData.stressTrend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3E1D7" vertical={false} />
                <XAxis dataKey="date" stroke="#737873" fontSize={10} tickLine={false} />
                <YAxis stroke="#737873" fontSize={10} tickLine={false} domain={[0, 10]} />
                <Tooltip content={<CustomTooltip unit="/10" />} />
                <Line type="monotone" dataKey="stress" name="Daily Stress" stroke="#C98278" strokeWidth={2.5} dot={{ r: 3, fill: '#C98278' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <span className="text-[11px] text-muted-text block">Daily self-reported stress load (0–10)</span>
        </Card>

        {/* CHART 5: Screen Time */}
        <Card className="p-5 space-y-3 bg-white shadow-soft">
          <div className="flex items-center justify-between pb-2 border-b border-muted-border/60">
            <div className="flex items-center gap-2">
              <SunMedium className="w-4 h-4 text-brand-teal" />
              <h3 className="text-section-md font-semibold text-brand-dark">
                Chart 5: Screen Time
              </h3>
            </div>
            <Badge variant="neutral" size="sm">
              Hours
            </Badge>
          </div>

          <div className="h-52 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currentData.screenTrend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3E1D7" vertical={false} />
                <XAxis dataKey="date" stroke="#737873" fontSize={10} tickLine={false} />
                <YAxis stroke="#737873" fontSize={10} tickLine={false} domain={[4, 10]} />
                <Tooltip content={<CustomTooltip unit=" hrs" />} />
                <Line type="monotone" dataKey="hours" name="Screen Exposure" stroke="#6F9990" strokeWidth={2.5} dot={{ r: 3, fill: '#6F9990' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <span className="text-[11px] text-muted-text block">Continuous optical display hours</span>
        </Card>
      </div>

      {/* =========================================================================
          COLLECTIVE STRESS & PSS-10 BASELINE INTEGRATION
         ========================================================================= */}
      <Card variant="warm" className="p-6 sm:p-7 border-2 border-brand-sage/50 rounded-[24px] shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-brand-sage/35">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-dark text-white flex items-center justify-center flex-shrink-0 shadow-soft">
              <ClipboardList className="w-5 h-5 text-brand-teal" />
            </div>
            <div>
              <h3 className="text-section-md font-bold text-brand-dark">
                Collective Stress Analysis: Daily Logs & PSS-10 Baseline
              </h3>
              <p className="text-meta-sm text-[#555B55]">
                How acute daily stress spikes (0–10) align with your validated weekly Perceived Stress Scale (PSS-10).
              </p>
            </div>
          </div>

          <Link to={ROUTES.PSS_ASSESSMENT} className="flex-shrink-0">
            <Button variant="outline" size="sm" iconRight={ArrowRight} className="font-bold border-brand-sage/60">
              Update Weekly PSS (2 min)
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-[18px] bg-white border border-brand-sage/40 space-y-1 shadow-sm">
            <span className="text-meta-sm font-bold text-muted-text uppercase tracking-wider block">
              Daily Stress Average
            </span>
            <div className="text-[26px] font-black text-brand-dark leading-tight">
              {currentData.summary.avgStress}
            </div>
            <span className="text-meta-sm text-[#555B55] block">
              Acute daily strain recorded in check-ins
            </span>
          </div>

          <div className="p-4 rounded-[18px] bg-white border border-brand-sage/40 space-y-1 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-meta-sm font-bold text-muted-text uppercase tracking-wider block">
                Validated PSS-10 Score
              </span>
              <Badge variant="teal" size="sm">Moderate</Badge>
            </div>
            <div className="text-[26px] font-black text-brand-dark leading-tight">
              14 / 40
            </div>
            <span className="text-meta-sm text-[#555B55] block">
              Standardized perceived stress baseline
            </span>
          </div>

          <div className="p-4 rounded-[18px] bg-white border border-brand-sage/40 space-y-1 shadow-sm">
            <span className="text-meta-sm font-bold text-muted-text uppercase tracking-wider block">
              Clinical Correlation
            </span>
            <div className="text-[16px] font-bold text-brand-dark leading-snug">
              Episodes Linked to Acute Spikes
            </div>
            <span className="text-meta-sm text-[#555B55] block leading-relaxed">
              Both weekly episodes followed daily stress &gt;7.5/10 on your 14/40 baseline.
            </span>
          </div>
        </div>
      </Card>

      {/* =========================================================================
          SECTION 3: SEVERITY & PATTERN ANALYSIS (CHARTS 6 & 7)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CHART 6: Migraine Severity */}
        <div className="lg:col-span-6">
          <Card className="p-6 space-y-4 bg-white shadow-soft h-full flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 border-b border-muted-border/60">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-alert-muted" />
                <h3 className="text-section-md font-semibold text-brand-dark">
                  Chart 6: Migraine Severity
                </h3>
              </div>
              <Badge variant="alert" size="sm">
                0–10 Intensity
              </Badge>
            </div>

            <div className="h-56 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={currentData.severityTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E3E1D7" vertical={false} />
                  <XAxis dataKey="date" stroke="#737873" fontSize={11} tickLine={false} />
                  <YAxis stroke="#737873" fontSize={11} tickLine={false} domain={[0, 10]} />
                  <Tooltip content={<CustomTooltip unit="/10 Severity" />} />
                  <Bar dataKey="severity" name="Severity" fill="#C98278" radius={[6, 6, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-muted-border/50 text-meta-sm text-muted-text">
              {currentData.severityTrend.map((ev, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="font-medium text-brand-dark">{ev.date} ({ev.duration}):</span>
                  <span>{ev.note}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* CHART 7: Personal Pattern Analysis (Horizontal Bar Chart) */}
        <div className="lg:col-span-6">
          <Card className="p-6 space-y-4 bg-white shadow-soft h-full flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 border-b border-muted-border/60">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-teal" />
                <h3 className="text-section-md font-semibold text-brand-dark">
                  Chart 7: Personal Pattern Analysis
                </h3>
              </div>
              <Badge variant="sage" size="sm">
                Statistical Weight
              </Badge>
            </div>

            <div className="h-56 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={currentData.patternAnalysis}
                  margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E3E1D7" horizontal={false} />
                  <XAxis type="number" stroke="#737873" fontSize={11} tickLine={false} unit="%" domain={[0, 50]} />
                  <YAxis dataKey="factor" type="category" stroke="#26352F" fontSize={12} tickLine={false} width={80} />
                  <Tooltip content={<CustomTooltip unit="% Model-associated contribution" />} />
                  <Bar dataKey="contribution" name="Model-associated contribution" fill="#6F9990" radius={[0, 6, 6, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="p-3 rounded-card-sm bg-card-warm/50 border border-muted-border/70 text-meta-sm text-muted-text flex items-center gap-2">
              <Info className="w-4 h-4 text-brand-teal flex-shrink-0" />
              <span>
                Labels represent <strong>Model-associated contribution</strong> based on co-occurrence, not medical cause.
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* =========================================================================
          CHART 8: CALENDAR-STYLE VIEW SHOWING DAILY RISK LEVELS
         ========================================================================= */}
      <Card className="p-6 sm:p-8 space-y-6 bg-white shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-muted-border/60">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-brand-teal" />
              <h2 className="text-section-lg font-semibold text-brand-dark">
                Chart 8: Daily Risk Horizon Calendar
              </h2>
            </div>
            <p className="text-meta-md text-muted-text mt-0.5">
              Monthly overview of daily sensitivity levels and recorded episode dates.
            </p>
          </div>

          <div className="flex items-center gap-4 text-meta-sm text-muted-text">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-brand-sage/30 border border-brand-sage/50" />
              <span>Stable / Low</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-card-warm border border-muted-border" />
              <span>Moderate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-alert-muted/25 border border-alert-muted/50" />
              <span>Elevated / Episode</span>
            </div>
          </div>
        </div>

        {/* 28-Day Calendar Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5 sm:gap-3">
          {calendarDays.map((cell) => {
            const isTerracotta = cell.state === 'terracotta';
            const isSage = cell.state === 'sage';
            return (
              <div
                key={cell.day}
                onMouseEnter={() => setHoveredDay(cell)}
                onMouseLeave={() => setHoveredDay(null)}
                className={cn(
                  'p-2.5 sm:p-3 rounded-card-sm border transition-all cursor-pointer relative flex flex-col justify-between min-h-[72px] sm:min-h-[82px]',
                  isTerracotta
                    ? 'bg-alert-muted/15 border-alert-muted/40 hover:border-alert-muted text-brand-dark'
                    : isSage
                    ? 'bg-brand-sage/15 border-brand-sage/35 hover:border-brand-sage text-brand-dark'
                    : 'bg-card-warm/50 border-muted-border/70 hover:bg-card-warm text-brand-dark',
                  cell.isToday && 'ring-2 ring-brand-dark ring-offset-1 ring-offset-white font-bold'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-meta-sm font-semibold">{cell.day}</span>
                  {cell.episode && (
                    <span className="w-2 h-2 rounded-full bg-alert-muted" title="Migraine Episode" />
                  )}
                  {cell.isToday && (
                    <span className="text-[9px] uppercase font-bold px-1 rounded bg-brand-dark text-[#F7F6F2]">
                      Today
                    </span>
                  )}
                </div>

                <div className="space-y-0.5">
                  <div className="text-meta-md font-bold leading-tight">
                    {cell.risk}%
                  </div>
                  <div className="text-[10px] text-muted-text truncate">
                    {cell.sleep} • {cell.stress}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Calendar Day Tooltip details bar */}
        {hoveredDay && (
          <div className="p-3 rounded-card-sm bg-card-warm border border-card-warm-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-meta-sm text-brand-dark animate-in fade-in duration-100">
            <div>
              <strong>{hoveredDay.date}:</strong> Risk estimate {hoveredDay.risk}% ({hoveredDay.state === 'terracotta' ? 'Elevated' : hoveredDay.state === 'sage' ? 'Calm / Stable' : 'Moderate'}).
            </div>
            <div className="text-muted-text">
              Sleep recorded: {hoveredDay.sleep} • Daily stress: {hoveredDay.stress} {hoveredDay.episode ? '• Migraine episode logged' : ''}
            </div>
          </div>
        )}
      </Card>

      {/* BOTTOM DISCLAIMER & QUICK JUMP */}
      <Card variant="white" className="p-5 border-muted-border flex items-start gap-3.5 text-meta-sm text-muted-text">
        <ShieldCheck className="w-5 h-5 text-brand-teal flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          These analytics illustrate personal lifestyle trajectories and model associations. They do not constitute a clinical diagnosis or establish physiological causation.
        </p>
      </Card>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <Link to={ROUTES.DASHBOARD}>
          <Button variant="outline" size="lg" className="w-full sm:w-auto">
            ← Return to Dashboard
          </Button>
        </Link>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Link to={ROUTES.INSIGHTS}>
            <Button variant="secondary" size="lg" className="w-full sm:w-auto" iconRight={ArrowRight}>
              View Weekly Insights
            </Button>
          </Link>
          <Link to={ROUTES.REPORTS}>
            <Button variant="secondary" size="lg" className="w-full sm:w-auto" iconRight={ArrowRight}>
              Clinical Doctor Reports
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
