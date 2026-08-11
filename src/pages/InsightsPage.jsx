import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ROUTES } from '../utils/constants';
import { insightsService } from '../services/insightsService';
import { reportService } from '../services/reportService';
import {
  Sparkles,
  Moon,
  Brain,
  SunMedium,
  Droplets,
  Activity,
  Calendar,
  Download,
  BarChart3,
  MessageSquare,
  Bot,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Info,
  Clock,
  HeartHandshake,
  TrendingDown,
  Check,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../utils/cn';

export function InsightsPage() {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Service calls
  const weeklyData = insightsService.getWeeklyInsights();
  const noticedPatterns = insightsService.getNoticedPatterns();
  const nextWeekFocus = insightsService.getNextWeekFocus();

  const handleDownload = async () => {
    await reportService.generatePdfReport('weekly');
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  // 4 Core Highlight Metrics (Balanced, clean, and spacious)
  const coreMetrics = [
    {
      label: 'Migraine Days',
      value: `${weeklyData.summary.migraineDays} Days`,
      subtext: '2 logged episodes this week',
      icon: Calendar,
      badge: 'Episode Log',
      badgeVariant: 'alert',
      accent: 'border-alert-muted/40 bg-alert-muted/10 text-[#8F443B]',
    },
    {
      label: 'Average Risk',
      value: weeklyData.summary.avgRisk,
      subtext: '7-day mean forecast index',
      icon: Activity,
      badge: 'Moderate',
      badgeVariant: 'teal',
      accent: 'border-brand-teal/40 bg-brand-teal/10 text-brand-teal-dark',
    },
    {
      label: 'Average Sleep',
      value: weeklyData.summary.avgSleep,
      subtext: '-1.2h below 7.6h baseline',
      icon: Moon,
      badge: 'Deficit',
      badgeVariant: 'alert',
      accent: 'border-brand-sage/50 bg-brand-sage/15 text-brand-dark',
    },
    {
      label: 'Hydration Buffer',
      value: weeklyData.summary.avgHydration || '2.2 L',
      subtext: '+0.6L improvement vs last week',
      icon: Droplets,
      badge: 'Progress',
      badgeVariant: 'sage',
      accent: 'border-brand-teal/40 bg-brand-teal/10 text-brand-teal',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-10 py-2 pb-24 animate-in fade-in duration-200">
      {/* =========================================================================
          1. CLASSY HEADER & DOWNLOAD ACTION
         ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-brand-sage/35">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-brand-sage/20 border border-brand-sage/45 text-meta-sm text-brand-dark font-medium mb-1">
            <span className="w-2 h-2 rounded-full bg-brand-teal animate-pulse" />
            <span>Weekly Synthesis • 7-Day Longitudinal Horizon</span>
          </div>
          <h1 className="text-app-xl sm:text-[34px] font-extrabold text-brand-dark tracking-tight leading-tight">
            Your Weekly Insights
          </h1>
          <p className="text-body-md text-[#555B55]">
            Discover actionable trigger patterns, baseline variances, and recovery habits from the past 7 days.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            size="md"
            onClick={handleDownload}
            icon={Download}
            className="shadow-sm font-semibold"
          >
            {downloadSuccess ? 'Summary Generated' : 'Download Weekly PDF'}
          </Button>
          <Link to={ROUTES.ANALYTICS}>
            <Button variant="secondary" size="md" iconRight={ArrowRight} className="font-semibold">
              Detailed Analytics
            </Button>
          </Link>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-4 rounded-[18px] bg-brand-teal/15 border-2 border-brand-teal/40 text-brand-dark text-meta-md flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 font-medium">
            <CheckCircle2 className="w-5 h-5 text-brand-teal" />
            <span>Weekly summary PDF generated successfully. Saved to your local records folder.</span>
          </div>
          <Link to={ROUTES.REPORTS} className="text-meta-sm font-bold underline text-brand-dark hover:text-brand-teal">
            View Reports →
          </Link>
        </div>
      )}

      {/* =========================================================================
          2. TOP 4 KEY HIGHLIGHT METRICS (Spacious & Clean)
         ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {coreMetrics.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-5 sm:p-6 rounded-[22px] bg-white border-2 border-brand-sage/50 shadow-soft hover:shadow-soft-md transition-all space-y-3.5"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-brand-dark text-white flex items-center justify-center shadow-soft">
                  <Icon className="w-5 h-5 text-brand-teal" />
                </div>
                <Badge variant={item.badgeVariant} size="sm">
                  {item.badge}
                </Badge>
              </div>

              <div>
                <span className="text-meta-sm font-bold text-muted-text block uppercase tracking-wider">
                  {item.label}
                </span>
                <div className="text-[30px] font-black text-brand-dark leading-tight mt-0.5">
                  {item.value}
                </div>
              </div>

              <div className="text-meta-sm text-[#666C66] pt-2 border-t border-brand-sage/25 font-medium">
                {item.subtext}
              </div>
            </div>
          );
        })}
      </div>

      {/* =========================================================================
          3. DISCOVERED PATTERNS (Classy 2-Column Grid with Clear Highlights)
         ========================================================================= */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-brand-teal" />
            <h2 className="text-section-lg sm:text-app-lg font-bold text-brand-dark">
              Key Pattern Discoveries
            </h2>
          </div>
          <span className="text-meta-sm text-muted-text bg-white px-3 py-1 rounded-full border border-brand-sage/40">
            4 Observed Trends
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {/* Pattern 1: Sleep */}
          <div className="p-6 rounded-[24px] bg-white border-2 border-brand-sage/50 shadow-soft hover:shadow-soft-md transition-all space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-brand-sage/30">
              <div className="flex items-center gap-2 text-brand-dark font-bold text-meta-md">
                <Moon className="w-4 h-4 text-brand-teal" />
                <span>Sleep Continuity Deficit</span>
              </div>
              <Badge variant="alert" size="sm">
                High Association
              </Badge>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-section-md font-extrabold text-brand-dark leading-snug">
                Shorter sleep preceded both migraine episodes
              </h3>
              <p className="text-meta-md text-[#555B55] leading-relaxed">
                Nights before logged migraine events averaged 5.4 hours compared to your 7.6-hour baseline rest duration.
              </p>
            </div>

            <div className="p-3.5 rounded-[16px] bg-alert-muted/10 border border-alert-muted/30 flex items-center justify-between text-meta-md">
              <span className="text-muted-text-dark font-medium">Measured Variance:</span>
              <span className="font-bold text-[#8F443B]">5.4h vs 7.6h baseline (-2.2h)</span>
            </div>
          </div>

          {/* Pattern 2: Stress */}
          <div className="p-6 rounded-[24px] bg-white border-2 border-brand-sage/50 shadow-soft hover:shadow-soft-md transition-all space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-brand-sage/30">
              <div className="flex items-center gap-2 text-brand-dark font-bold text-meta-md">
                <Brain className="w-4 h-4 text-brand-teal" />
                <span>Autonomic Stress Surge</span>
              </div>
              <Badge variant="alert" size="sm">
                Contributing Factor
              </Badge>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-section-md font-extrabold text-brand-dark leading-snug">
                Elevated sympathetic tension prior to onset
              </h3>
              <p className="text-meta-md text-[#555B55] leading-relaxed">
                Stress ratings averaged 8.2 / 10 in the 24-hour windows leading up to Wednesday and Saturday.
              </p>
            </div>

            <div className="p-3.5 rounded-[16px] bg-alert-muted/10 border border-alert-muted/30 flex items-center justify-between text-meta-md">
              <span className="text-muted-text-dark font-medium">Measured Variance:</span>
              <span className="font-bold text-[#8F443B]">8.2/10 preceding episodes (+4.2)</span>
            </div>
          </div>

          {/* Pattern 3: Screen Glare */}
          <div className="p-6 rounded-[24px] bg-white border-2 border-brand-sage/50 shadow-soft hover:shadow-soft-md transition-all space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-brand-sage/30">
              <div className="flex items-center gap-2 text-brand-dark font-bold text-meta-md">
                <SunMedium className="w-4 h-4 text-brand-teal" />
                <span>Screen Exposure & Glare</span>
              </div>
              <Badge variant="teal" size="sm">
                Sensory Strain
              </Badge>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-section-md font-extrabold text-brand-dark leading-snug">
                Extended display sessions without pauses
              </h3>
              <p className="text-meta-md text-[#555B55] leading-relaxed">
                Continuous screen time reached 8.2 hours without scheduled 20-minute visual recovery intervals.
              </p>
            </div>

            <div className="p-3.5 rounded-[16px] bg-brand-teal/10 border border-brand-teal/30 flex items-center justify-between text-meta-md">
              <span className="text-muted-text-dark font-medium">Measured Variance:</span>
              <span className="font-bold text-brand-dark">8.2h vs 6.0h baseline (+1.1h)</span>
            </div>
          </div>

          {/* Pattern 4: Hydration Progress */}
          <div className="p-6 rounded-[24px] bg-white border-2 border-brand-sage/50 shadow-soft hover:shadow-soft-md transition-all space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-brand-sage/30">
              <div className="flex items-center gap-2 text-brand-dark font-bold text-meta-md">
                <Droplets className="w-4 h-4 text-brand-teal" />
                <span>Hydration Buffer Consistency</span>
              </div>
              <Badge variant="sage" size="sm">
                Protective Habit
              </Badge>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-section-md font-extrabold text-brand-dark leading-snug">
                Daily fluid intake improved by +0.6L
              </h3>
              <p className="text-meta-md text-[#555B55] leading-relaxed">
                You maintained 2.2L daily, building a supportive buffer against afternoon physiological fatigue.
              </p>
            </div>

            <div className="p-3.5 rounded-[16px] bg-brand-sage/20 border border-brand-sage/45 flex items-center justify-between text-meta-md">
              <span className="text-muted-text-dark font-medium">Positive Gain:</span>
              <span className="font-bold text-brand-teal-dark">+0.6 L/day increase</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. CALIBRATED ACTION PLAN (Next Week's Focus - Clean Editorial Stepper)
         ========================================================================= */}
      <Card variant="warm" className="p-7 sm:p-9 border-2 border-brand-sage/60 rounded-[28px] shadow-soft space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-brand-sage/35">
          <div className="flex items-center gap-2.5 text-brand-dark">
            <HeartHandshake className="w-5 h-5 text-brand-teal" />
            <h2 className="text-section-lg font-bold">
              Your Focus for Next Week
            </h2>
          </div>
          <span className="text-meta-sm font-semibold text-[#555B55]">
            Target: Circadian Regularity & Hydration
          </span>
        </div>

        {/* 3 Step Actionable Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {/* Step 1 */}
          <div className="p-5 rounded-[20px] bg-white border-2 border-brand-sage/45 shadow-sm space-y-2.5 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-brand-dark bg-brand-sage/25 px-2.5 py-0.5 rounded-full border border-brand-sage/45 uppercase tracking-wider">
                Step 01
              </span>
              <Moon className="w-4 h-4 text-brand-teal" />
            </div>
            <h4 className="text-body-md font-bold text-brand-dark">
              Consistent Bedtime Window
            </h4>
            <p className="text-meta-sm text-[#555B55] leading-relaxed">
              Keep bedtime within a 30-minute window, even on weekends, to stabilize your circadian threshold.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-5 rounded-[20px] bg-white border-2 border-brand-sage/45 shadow-sm space-y-2.5 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-brand-dark bg-brand-teal/20 px-2.5 py-0.5 rounded-full border border-brand-teal/40 uppercase tracking-wider">
                Step 02
              </span>
              <Brain className="w-4 h-4 text-brand-teal" />
            </div>
            <h4 className="text-body-md font-bold text-brand-dark">
              Daily Stress Micro-Log
            </h4>
            <p className="text-meta-sm text-[#555B55] leading-relaxed">
              Continue capturing 60-second midday stress ratings to pinpoint tasks that trigger evening tension.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-5 rounded-[20px] bg-white border-2 border-brand-sage/45 shadow-sm space-y-2.5 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-brand-dark bg-brand-sage/25 px-2.5 py-0.5 rounded-full border border-brand-sage/45 uppercase tracking-wider">
                Step 03
              </span>
              <Droplets className="w-4 h-4 text-brand-teal" />
            </div>
            <h4 className="text-body-md font-bold text-brand-dark">
              Pre-3 PM Fluid Target
            </h4>
            <p className="text-meta-sm text-[#555B55] leading-relaxed">
              Maintain this week's 2.2L water target before 3:00 PM to protect against atmospheric pressure drops.
            </p>
          </div>
        </div>
      </Card>

      {/* =========================================================================
          5. COMPLIANCE & NAVIGATION (Ample Spacing)
         ========================================================================= */}
      <div className="p-4 rounded-[18px] bg-white border border-brand-sage/40 flex items-start gap-3 text-meta-sm text-muted-text shadow-sm">
        <ShieldCheck className="w-5 h-5 text-brand-teal flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          These weekly insights describe personal correlation patterns in your tracked check-in history. They do not constitute medical diagnosis or replace professional clinical evaluation.
        </p>
      </div>

      {/* Quick Navigation Action Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <Link to={ROUTES.DASHBOARD}>
          <Button variant="outline" size="lg" className="w-full sm:w-auto font-bold">
            ← Return to Dashboard
          </Button>
        </Link>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Link to={ROUTES.ANALYTICS}>
            <Button variant="secondary" size="lg" className="w-full sm:w-auto font-bold" iconRight={ArrowRight}>
              View Detailed Analytics
            </Button>
          </Link>
          <Link to={ROUTES.CHAT}>
            <Button variant="primary" size="lg" className="w-full sm:w-auto font-bold" icon={Bot}>
              Ask MigraineGuardian
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default InsightsPage;
