import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ROUTES } from '../utils/constants';
import { predictionService } from '../services/predictionService';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  Activity,
  Moon,
  Brain,
  SunMedium,
  History,
  Sparkles,
  Droplets,
  HeartHandshake,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  MessageSquare,
  Bot,
  Eye,
  Info,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '../utils/cn';

export function RiskAnalysisPage() {
  const prediction = predictionService.getTodayPrediction();
  const riskTrend = predictionService.getRiskTrend('7days');
  const elevatedFactors = predictionService.getElevatedFactors();
  const focusAreas = predictionService.getFocusAreas();

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white border border-muted-border p-3 rounded-card-sm shadow-soft text-meta-sm space-y-1">
          <div className="font-semibold text-brand-dark flex items-center justify-between gap-3">
            <span>{item.day}</span>
            {item.isMigraineDay && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-alert-muted/20 text-[#8F443B] font-semibold">
                Episode Logged
              </span>
            )}
          </div>
          <div className="text-muted-text flex items-center justify-between gap-4">
            <span>Estimated Probability:</span>
            <span className="font-bold text-brand-dark">{item.risk}%</span>
          </div>
          <div className="text-[11px] text-muted-text">
            Sleep: {item.sleep}h • Stress: {item.stress}/10
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* HEADER */}
      <PageHeader
        title="Your Risk Analysis"
        subtitle="A transparent, evidence-grounded breakdown of your current sensitivity estimate and contributing lifestyle factors."
        badge="Transparent Modeling"
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link to={ROUTES.INSIGHTS}>
              <Button variant="secondary" size="md" iconRight={ArrowRight}>
                View weekly insights
              </Button>
            </Link>
            <Link to={ROUTES.CHAT}>
              <Button variant="primary" size="md" icon={Bot}>
                Ask MigraineGuardian
              </Button>
            </Link>
          </div>
        }
      />

      {/* MAIN RISK ESTIMATE BLOCK */}
      <Card variant="warm" className="p-6 sm:p-8 border-card-warm-border shadow-soft-lg space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-muted-border/60">
          <div className="flex items-start gap-4">
            {/* Soft terracotta calm indicator */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-alert-muted/15 border border-alert-muted/35 flex flex-col items-center justify-center flex-shrink-0">
              <span className="text-app-xl sm:text-[32px] font-bold text-[#8F443B] leading-none">
                72%
              </span>
              <span className="text-[11px] uppercase font-bold text-[#8F443B] tracking-wider mt-0.5">
                High
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-meta-sm font-semibold uppercase tracking-wider text-muted-text-light">
                  Today's estimated risk
                </span>
                <Badge variant="alert" size="sm">
                  High Sensitivity Window
                </Badge>
              </div>
              <p className="text-body-md text-brand-dark font-medium leading-relaxed">
                Estimated probability based on your recent tracked patterns.
              </p>
            </div>
          </div>
        </div>

        {/* Prototype & Transparency Note */}
        <div className="p-4 rounded-card-sm bg-white/70 border border-muted-border/80 text-meta-sm text-muted-text leading-relaxed flex items-start gap-3">
          <Info className="w-4 h-4 text-brand-teal flex-shrink-0 mt-0.5" />
          <span>
            This estimate reflects a multivariate statistical model correlating your self-reported sleep, stress, and screen exposure against historical baseline trends. It provides preventive awareness rather than a deterministic forecast.
          </span>
        </div>
      </Card>

      {/* SECTION: WHAT MAY BE CONTRIBUTING TO YOUR ESTIMATE? */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-section-lg font-semibold text-brand-dark">
            What may be contributing to your estimate?
          </h2>
          <p className="text-body-md text-muted-text">
            Four primary parameters currently showing variance from your calm physiological baseline.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Sleep */}
          <Card className="p-5 space-y-3 bg-white shadow-soft hover:border-brand-sage/60 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-text">
                <Moon className="w-4 h-4 text-brand-teal" />
                <span className="text-body-md font-semibold text-brand-dark">Sleep</span>
              </div>
              <Badge variant="alert" size="sm">
                5.8 h
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="text-app-lg font-bold text-brand-dark">5.8 h</div>
              <div className="text-meta-md text-[#8F443B] font-medium">
                1.2 h below personal average
              </div>
            </div>
            <p className="text-meta-sm text-muted-text pt-2 border-t border-muted-border/50 leading-relaxed">
              Shorter sleep duration reduces neural recovery, lowering your threshold to environmental triggers.
            </p>
          </Card>

          {/* Card 2: Stress */}
          <Card className="p-5 space-y-3 bg-white shadow-soft hover:border-brand-teal/60 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-text">
                <Brain className="w-4 h-4 text-brand-teal" />
                <span className="text-body-md font-semibold text-brand-dark">Stress</span>
              </div>
              <Badge variant="alert" size="sm">
                8 / 10
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="text-app-lg font-bold text-brand-dark">8 / 10</div>
              <div className="text-meta-md text-[#8F443B] font-medium">
                Higher than recent average
              </div>
            </div>
            <p className="text-meta-sm text-muted-text pt-2 border-t border-muted-border/50 leading-relaxed">
              Elevated daily stress increases autonomic nervous system tone and upper neck muscle tension.
            </p>
          </Card>

          {/* Card 3: Screen Time */}
          <Card className="p-5 space-y-3 bg-white shadow-soft hover:border-card-warm-border transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-text">
                <SunMedium className="w-4 h-4 text-brand-teal" />
                <span className="text-body-md font-semibold text-brand-dark">Screen time</span>
              </div>
              <Badge variant="alert" size="sm">
                8.2 h
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="text-app-lg font-bold text-brand-dark">8.2 h</div>
              <div className="text-meta-md text-[#8F443B] font-medium">
                Above recent average
              </div>
            </div>
            <p className="text-meta-sm text-muted-text pt-2 border-t border-muted-border/50 leading-relaxed">
              Prolonged continuous display exposure introduces sensory glare and visual fatigue.
            </p>
          </Card>

          {/* Card 4: Recent Migraine Pattern */}
          <Card className="p-5 space-y-3 bg-white shadow-soft hover:border-alert-muted/50 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-text">
                <History className="w-4 h-4 text-[#8F443B]" />
                <span className="text-body-md font-semibold text-brand-dark">Recent migraine pattern</span>
              </div>
              <Badge variant="alert" size="sm">
                2 Episodes
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="text-app-lg font-bold text-brand-dark">2 migraine days</div>
              <div className="text-meta-md text-[#8F443B] font-medium">
                in the past week
              </div>
            </div>
            <p className="text-meta-sm text-muted-text pt-2 border-t border-muted-border/50 leading-relaxed">
              Recent episodes can leave the trigeminal vascular system in a temporarily sensitized state.
            </p>
          </Card>
        </div>
      </div>

      {/* SECTION: YOUR RECENT PATTERN (Recharts Line Chart) */}
      <Card className="p-6 sm:p-8 space-y-5 bg-white shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-section-lg font-semibold text-brand-dark">
              Your recent pattern
            </h2>
            <p className="text-meta-md text-muted-text">
              7-day trajectory of estimated probability and logged episode days
            </p>
          </div>
          <Badge variant="sage" size="sm">
            7-Day Model
          </Badge>
        </div>

        {/* Recharts Area Container */}
        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={riskTrend}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="riskAnalysisGradient" x1="0" y1="0" x2="0" y2="1">
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
                fill="url(#riskAnalysisGradient)"
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (payload.isMigraineDay) {
                    return (
                      <circle
                        key={payload.day}
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
                      key={payload.day}
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

        <div className="flex items-center justify-between text-meta-sm text-muted-text pt-3 border-t border-muted-border/60">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-dark" />
            <span>Estimated Probability</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-alert-muted" />
            <span>Logged Migraine Day</span>
          </div>
        </div>
      </Card>

      {/* SECTION: WHAT YOU CAN FOCUS ON */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-section-lg font-semibold text-brand-dark">
            What you can focus on
          </h2>
          <p className="text-body-md text-muted-text">
            Calm, practical habits to support physiological balance during elevated sensitivity windows.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Focus 1: Sleep consistency */}
          <Card variant="warm" className="p-5 space-y-2.5 border-card-warm-border">
            <div className="flex items-center gap-2 text-brand-dark">
              <div className="w-8 h-8 rounded-lg bg-brand-sage/20 border border-brand-sage/35 flex items-center justify-center">
                <Moon className="w-4 h-4 text-brand-dark" />
              </div>
              <h3 className="text-section-md font-semibold">
                Sleep consistency
              </h3>
            </div>
            <p className="text-meta-md text-muted-text-dark leading-relaxed">
              Aim for a consistent bedtime tonight. Dim overhead lights 1 hour before sleep to encourage natural melatonin release and deep cellular rest.
            </p>
          </Card>

          {/* Focus 2: Stress management */}
          <Card variant="warm" className="p-5 space-y-2.5 border-card-warm-border">
            <div className="flex items-center gap-2 text-brand-dark">
              <div className="w-8 h-8 rounded-lg bg-brand-teal/20 border border-brand-teal/35 flex items-center justify-center">
                <Brain className="w-4 h-4 text-brand-dark" />
              </div>
              <h3 className="text-section-md font-semibold">
                Stress management
              </h3>
            </div>
            <p className="text-meta-md text-muted-text-dark leading-relaxed">
              Integrate two 5-minute breathing pauses into your afternoon. Gentle shoulder rolls and neck stretches help release accumulated tension.
            </p>
          </Card>

          {/* Focus 3: Regular hydration */}
          <Card variant="warm" className="p-5 space-y-2.5 border-card-warm-border">
            <div className="flex items-center gap-2 text-brand-dark">
              <div className="w-8 h-8 rounded-lg bg-brand-teal/20 border border-brand-teal/35 flex items-center justify-center">
                <Droplets className="w-4 h-4 text-brand-dark" />
              </div>
              <h3 className="text-section-md font-semibold">
                Regular hydration
              </h3>
            </div>
            <p className="text-meta-md text-muted-text-dark leading-relaxed">
              Keep a water bottle within reach and sip steadily to reach 2.2L before 4:00 PM. Hydration creates an effective physiological buffer.
            </p>
          </Card>

          {/* Focus 4: Screen breaks */}
          <Card variant="warm" className="p-5 space-y-2.5 border-card-warm-border">
            <div className="flex items-center gap-2 text-brand-dark">
              <div className="w-8 h-8 rounded-lg bg-card-warm-hover border border-muted-border flex items-center justify-center">
                <Eye className="w-4 h-4 text-brand-dark" />
              </div>
              <h3 className="text-section-md font-semibold">
                Screen breaks
              </h3>
            </div>
            <p className="text-meta-md text-muted-text-dark leading-relaxed">
              Apply the 20-20-20 rule (every 20 minutes, look 20 feet away for 20 seconds) and reduce monitor brightness to relieve ocular strain.
            </p>
          </Card>
        </div>
      </div>

      {/* COMPLIANCE DISCLAIMER */}
      <Card variant="white" className="p-5 border-muted-border flex items-start gap-3.5 text-meta-sm text-muted-text">
        <ShieldCheck className="w-5 h-5 text-brand-teal flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          This risk estimate is for wellness and awareness. It does not diagnose migraine or replace medical advice.
        </p>
      </Card>

      {/* QUICK JUMP ACTIONS */}
      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <Link to={ROUTES.DASHBOARD}>
          <Button variant="outline" size="lg" className="w-full sm:w-auto">
            ← Return to Dashboard
          </Button>
        </Link>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Link to={ROUTES.INSIGHTS}>
            <Button variant="secondary" size="lg" className="w-full sm:w-auto" iconRight={ArrowRight}>
              View weekly insights
            </Button>
          </Link>
          <Link to={ROUTES.CHAT}>
            <Button variant="primary" size="lg" className="w-full sm:w-auto" icon={Bot}>
              Ask MigraineGuardian
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
