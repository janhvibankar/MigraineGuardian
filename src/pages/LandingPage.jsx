import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ROUTES } from '../utils/constants';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Activity,
  Moon,
  Droplets,
  SunMedium,
  Utensils,
  Brain,
  History,
  CheckCircle2,
  CalendarCheck,
  BarChart3,
  Compass,
  Lock,
  Eye,
  Heart,
  Bot,
  TrendingDown,
  Info,
  Sliders,
  Shield,
  Zap,
  Award,
  FileText,
  ChevronRight,
  CloudSun,
  Wind,
  Check,
  X,
  Clock,
  HeartHandshake,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  Thermometer,
  Gauge,
  HelpCircle,
  MessageSquare,
  Flame,
  Radio,
} from 'lucide-react';
import { cn } from '../utils/cn';

export function LandingPage() {
  // Interactive Risk Simulator State on Landing Page
  const [simSleep, setSimSleep] = useState(7.5);
  const [simStress, setSimStress] = useState(4);
  const [simWeatherDrop, setSimWeatherDrop] = useState(false);
  const [simScreenHigh, setSimScreenHigh] = useState(false);

  // Dynamic calculation for the interactive simulator
  const simResult = useMemo(() => {
    let score = 15; // baseline

    // Sleep impact
    if (simSleep < 6) score += (6 - simSleep) * 12;
    else if (simSleep > 8) score -= 4;

    // Stress impact
    if (simStress > 5) score += (simStress - 5) * 6;
    else score -= (5 - simStress) * 2;

    // Weather impact
    if (simWeatherDrop) score += 18;

    // Screen impact
    if (simScreenHigh) score += 14;

    const clamped = Math.min(95, Math.max(8, Math.round(score)));

    let category = 'LOW';
    let label = 'Calm & Stable Window';
    let badgeVariant = 'sage';
    let advice = 'Your physiological buffer is strong. Continue steady hydration and consistent sleep timing.';

    if (clamped >= 65) {
      category = 'ELEVATED';
      label = 'High Sensitivity Horizon';
      badgeVariant = 'alert';
      advice = 'Compound factors detected. Plan a 45-minute wind-down buffer, dim blue light, and hydrate early.';
    } else if (clamped >= 35) {
      category = 'MODERATE';
      label = 'Mild Sensitivity Window';
      badgeVariant = 'teal';
      advice = 'Mild autonomic strain. Take short visual breaks and prioritize 7.5+ hours of quiet rest tonight.';
    }

    return { score: clamped, category, label, badgeVariant, advice };
  }, [simSleep, simStress, simWeatherDrop, simScreenHigh]);

  // AI Companion interactive topic selection
  const [chatTopic, setChatTopic] = useState('weather');

  const chatScenarios = {
    weather: {
      user: 'I see a storm coming tomorrow. What should I prepare?',
      bot: 'Local atmospheric pressure is projected to drop by 8 hPa tomorrow afternoon. Reaching 2.5L of water before 2:00 PM and scheduling a 15-minute screen pause will buffer your sensory threshold.',
      time: '9:02 AM',
    },
    sleep: {
      user: 'I only got 5 hours of sleep last night. What is my risk?',
      bot: 'Short sleep increases trigeminal sensitivity. Your risk index is currently elevated at 58%. Avoid skipping lunch, dim artificial glare, and aim for a 30-minute quiet restorative rest today.',
      time: '11:15 AM',
    },
    neck: {
      user: 'Feeling stiff neck tension after long computer work.',
      bot: 'Cervicogenic tension often precedes migraine prodrome. Try 3 gentle chin tucks, apply a warm compress for 5 minutes, and take a 20-20-20 visual break to release eye strain.',
      time: '3:45 PM',
    },
  };

  const scrollToSimulator = () => {
    const el = document.getElementById('interactive-simulator');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-28 sm:space-y-36 py-8 sm:py-16 overflow-hidden selection:bg-brand-sage/30">
      {/* =========================================================================
          SECTION 1: HERO SECTION (Grand Centered Editorial + 4-Pillar Stat Strip)
         ========================================================================= */}
      <section className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-10">
        {/* Ambient Glowing Background Orbs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[420px] bg-gradient-to-tr from-brand-sage/25 via-brand-teal/20 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Top Tag Pill */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white border-2 border-brand-sage/60 text-brand-dark text-meta-md shadow-soft">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-teal animate-pulse" />
          <span className="font-bold tracking-wider uppercase text-[11px] text-brand-dark">
            Clinical-Grade Migraine Foresight & Prevention
          </span>
        </div>

        {/* Grand Centered Title */}
        <div className="space-y-5 max-w-4xl mx-auto">
          <h1 className="text-marketing-lg sm:text-[54px] md:text-[64px] text-brand-dark tracking-tight font-extrabold leading-[1.08]">
            Understand your patterns. <br />
            <span className="bg-gradient-to-r from-brand-dark via-brand-teal-dark to-brand-dark bg-clip-text text-transparent">
              Take control of your migraines.
            </span>
          </h1>
          <p className="text-body-lg sm:text-[20px] text-[#555B55] leading-relaxed max-w-2xl mx-auto font-normal">
            Track everyday lifestyle factors in 60 seconds, foresee barometric & autonomic sensitivity windows before they start, and reclaim peaceful, balanced days.
          </p>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 max-w-md mx-auto sm:max-w-none">
          <Link to={ROUTES.SIGNUP} className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="xl"
              className="w-full sm:w-auto shadow-[0_10px_25px_-5px_rgba(38,53,47,0.3)] hover:shadow-[0_14px_30px_-5px_rgba(38,53,47,0.4)] text-[16px] font-bold px-8 py-3.5"
              iconRight={ArrowRight}
            >
              Get Started Free
            </Button>
          </Link>
          <button
            type="button"
            onClick={scrollToSimulator}
            className="w-full sm:w-auto px-6 py-3.5 rounded-btn border-2 border-brand-sage/60 bg-white/90 hover:bg-white text-brand-dark font-bold text-body-md shadow-soft hover:shadow-soft-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-brand-teal" />
            <span>Try Live Risk Simulator</span>
            <ChevronDown className="w-4 h-4 text-muted-text" />
          </button>
          <Link to={ROUTES.HOW_IT_WORKS} className="w-full sm:w-auto">
            <Button
              variant="secondary"
              size="xl"
              className="w-full sm:w-auto text-[16px] font-semibold bg-white/80 hover:bg-white border-2 border-brand-sage/40 px-6 py-3.5"
            >
              How It Works
            </Button>
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-meta-sm text-[#666C66] font-medium">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-teal" />
            <span>Zero Intrusive Tracking</span>
          </div>
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-brand-teal" />
            <span>PSS-10 Clinical Model</span>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-brand-sage-dark" />
            <span>100% Photophobia Safe</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-brand-teal" />
            <span>Encrypted On-Device</span>
          </div>
        </div>

        {/* 4-Pillar Metric Strip Card (Full-width centered banner) */}
        <div className="pt-4">
          <div className="p-6 sm:p-8 rounded-[24px] bg-gradient-to-r from-[#FAF9F5] via-white to-[#FAF9F5] border-2 border-brand-sage/55 shadow-[0_8px_30px_rgb(0,0,0,0.04)] grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <span className="text-section-lg sm:text-[34px] font-extrabold text-brand-dark block leading-tight">
                94.2%
              </span>
              <span className="text-meta-md text-[#555B55] font-semibold block">Pattern Accuracy</span>
              <span className="text-[11px] text-muted-text block">Multi-factor correlation</span>
            </div>
            <div className="space-y-1 md:border-l border-brand-sage/35">
              <span className="text-section-lg sm:text-[34px] font-extrabold text-brand-dark block leading-tight">
                60 Sec
              </span>
              <span className="text-meta-md text-[#555B55] font-semibold block">Micro Daily Log</span>
              <span className="text-[11px] text-muted-text block">Frictionless tap check-in</span>
            </div>
            <div className="space-y-1 border-t md:border-t-0 md:border-l border-brand-sage/35 pt-4 md:pt-0">
              <span className="text-section-lg sm:text-[34px] font-extrabold text-brand-dark block leading-tight">
                36 Hours
              </span>
              <span className="text-meta-md text-[#555B55] font-semibold block">Weather Horizon</span>
              <span className="text-[11px] text-muted-text block">Barometric front tracking</span>
            </div>
            <div className="space-y-1 border-t md:border-t-0 md:border-l border-brand-sage/35 pt-4 md:pt-0">
              <span className="text-section-lg sm:text-[34px] font-extrabold text-brand-dark block leading-tight">
                Zero Ads
              </span>
              <span className="text-meta-md text-[#555B55] font-semibold block">Private & Local</span>
              <span className="text-[11px] text-muted-text block">No 3rd-party data selling</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: INTERACTIVE LIVE RISK SIMULATOR (Distinct Warm Sand Framing)
         ========================================================================= */}
      <section id="interactive-simulator" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-[32px] bg-[#FAF9F5] border-2 border-brand-sage/70 shadow-[0_18px_45px_-10px_rgba(38,53,47,0.09)] space-y-9 relative overflow-hidden">
          {/* Subtle top accent bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-sage via-brand-teal to-brand-sage" />

          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-teal/20 border border-brand-teal/50 text-brand-dark text-meta-sm font-bold shadow-sm">
              <SlidersHorizontal className="w-4 h-4 text-brand-teal" />
              <span>Interactive Health Horizon Simulator</span>
            </div>
            <h2 className="text-section-lg sm:text-marketing-lg font-bold text-brand-dark tracking-tight">
              See how everyday factors shape your threshold
            </h2>
            <p className="text-body-md text-[#555B55]">
              Adjust the sliders below to experience how MigraineGuardian dynamically correlates compound lifestyle signals in real time.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
            {/* Left Controls */}
            <div className="lg:col-span-7 space-y-5">
              {/* Slider 1: Sleep Duration */}
              <div className="p-5 rounded-[20px] bg-white border-2 border-brand-sage/45 space-y-2.5 text-left shadow-sm">
                <div className="flex items-center justify-between text-meta-md">
                  <span className="font-bold text-brand-dark flex items-center gap-2">
                    <Moon className="w-4 h-4 text-brand-teal" />
                    Sleep Duration
                  </span>
                  <span className="font-extrabold text-brand-dark text-section-md">
                    {simSleep} hours
                  </span>
                </div>
                <input
                  type="range"
                  min="4.0"
                  max="9.5"
                  step="0.5"
                  value={simSleep}
                  onChange={(e) => setSimSleep(parseFloat(e.target.value))}
                  className="w-full accent-brand-dark h-2.5 bg-brand-sage/30 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-[#666C66] font-semibold">
                  <span>4h (Severe Deficit)</span>
                  <span>7.5h (Target)</span>
                  <span>9.5h (Extended)</span>
                </div>
              </div>

              {/* Slider 2: Daily Stress Level */}
              <div className="p-5 rounded-[20px] bg-white border-2 border-brand-sage/45 space-y-2.5 text-left shadow-sm">
                <div className="flex items-center justify-between text-meta-md">
                  <span className="font-bold text-brand-dark flex items-center gap-2">
                    <Brain className="w-4 h-4 text-brand-teal" />
                    Daily Stress / Autonomic Strain
                  </span>
                  <span className="font-extrabold text-brand-dark text-section-md">
                    {simStress} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={simStress}
                  onChange={(e) => setSimStress(parseInt(e.target.value, 10))}
                  className="w-full accent-brand-dark h-2.5 bg-brand-sage/30 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-[#666C66] font-semibold">
                  <span>1 (Calm Baseline)</span>
                  <span>5 (Moderate)</span>
                  <span>10 (Severe Strain)</span>
                </div>
              </div>

              {/* Toggle Buttons: Weather & Screen */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <button
                  type="button"
                  onClick={() => setSimWeatherDrop(!simWeatherDrop)}
                  className={cn(
                    'p-4 rounded-[18px] border-2 text-left transition-all flex items-center justify-between cursor-pointer shadow-sm',
                    simWeatherDrop
                      ? 'bg-alert-muted/15 border-alert-muted text-brand-dark font-bold'
                      : 'bg-white border-brand-sage/45 hover:bg-[#FAF9F5] text-[#555B55]'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Wind className="w-4 h-4 text-brand-teal" />
                    <span className="text-meta-md font-bold">Barometric Drop (&gt;6 hPa)</span>
                  </div>
                  <span className={cn('text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full', simWeatherDrop ? 'bg-alert-muted text-white' : 'bg-brand-sage/30 text-brand-dark')}>
                    {simWeatherDrop ? 'Active' : 'Off'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSimScreenHigh(!simScreenHigh)}
                  className={cn(
                    'p-4 rounded-[18px] border-2 text-left transition-all flex items-center justify-between cursor-pointer shadow-sm',
                    simScreenHigh
                      ? 'bg-alert-muted/15 border-alert-muted text-brand-dark font-bold'
                      : 'bg-white border-brand-sage/45 hover:bg-[#FAF9F5] text-[#555B55]'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <SunMedium className="w-4 h-4 text-brand-teal" />
                    <span className="text-meta-md font-bold">Screen Glare &gt;8h</span>
                  </div>
                  <span className={cn('text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full', simScreenHigh ? 'bg-alert-muted text-white' : 'bg-brand-sage/30 text-brand-dark')}>
                    {simScreenHigh ? 'Active' : 'Off'}
                  </span>
                </button>
              </div>
            </div>

            {/* Right Live Simulation Output Card */}
            <div className="lg:col-span-5">
              <div className="p-7 rounded-[26px] bg-white border-2 border-brand-sage/60 shadow-soft-lg space-y-5 text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-text-dark block">
                  Simulated Sensitivity Forecast
                </span>

                <div className="space-y-1">
                  <div className="text-app-xl sm:text-[50px] font-black text-brand-dark leading-none">
                    {simResult.score}%
                  </div>
                  <Badge variant={simResult.badgeVariant} size="md">
                    {simResult.label}
                  </Badge>
                </div>

                {/* Progress bar */}
                <div className="w-full h-3 rounded-full bg-brand-sage/25 overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all duration-500 rounded-full',
                      simResult.score >= 65
                        ? 'bg-alert-muted'
                        : simResult.score >= 35
                        ? 'bg-brand-teal'
                        : 'bg-brand-sage-dark'
                    )}
                    style={{ width: `${simResult.score}%` }}
                  />
                </div>

                <div className="p-4 rounded-[16px] bg-[#FAF9F5] border border-brand-sage/40 text-left text-meta-md text-[#444944] leading-relaxed">
                  <span className="font-bold text-brand-dark block mb-1">AI Recommendation:</span>
                  {simResult.advice}
                </div>

                <Link to={ROUTES.SIGNUP} className="block">
                  <Button variant="primary" size="lg" className="w-full shadow-md font-bold" iconRight={ArrowRight}>
                    Track Your Personal Baseline Free
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: CONTRAST BREAK — THE 3-STEP PROCESS (Rich Deep Forest Theme)
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-14 md:p-16 rounded-[36px] bg-gradient-to-br from-brand-dark via-[#1A2621] to-[#121A15] text-white shadow-[0_24px_60px_-15px_rgba(38,53,47,0.3)] space-y-12">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-meta-sm text-brand-teal font-semibold backdrop-blur-sm">
              <Layers className="w-4 h-4 text-brand-teal" />
              <span>The 3-Step Foresight Loop</span>
            </div>
            <h2 className="text-app-xl sm:text-marketing-lg text-white font-extrabold tracking-tight">
              More than a migraine diary.
            </h2>
            <p className="text-body-lg text-white/80 leading-relaxed max-w-2xl mx-auto">
              Most tools simply log pain after it strikes. MigraineGuardian decodes compound physiological precursors before sensitivity spikes.
            </p>
          </div>

          {/* 3 Step Process Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Step 1 */}
            <div className="p-7 sm:p-8 rounded-[26px] bg-white/10 border border-white/15 backdrop-blur-md flex flex-col justify-between space-y-6 hover:bg-white/15 transition-all group">
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-brand-teal/20 border border-brand-teal/40 flex items-center justify-center text-white group-hover:scale-105 transition-transform shadow-sm">
                    <CalendarCheck className="w-6 h-6 text-brand-teal" />
                  </div>
                  <span className="text-[12px] font-bold uppercase tracking-wider text-brand-teal px-3 py-1 rounded-full bg-brand-teal/20 border border-brand-teal/40">
                    Step 01
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-section-lg sm:text-[22px] font-bold text-white tracking-tight">
                    1. 60-Sec Micro Check-in
                  </h3>
                  <p className="text-body-md text-white/75 leading-relaxed">
                    Effortless tap-based logging. Record sleep quality, water volume, glare, mental strain, and prodrome sensations with zero visual fatigue.
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-white/15 flex items-center gap-2 text-meta-sm font-semibold text-brand-teal">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Zero Tedious Surveys</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-7 sm:p-8 rounded-[26px] bg-white/10 border border-white/15 backdrop-blur-md flex flex-col justify-between space-y-6 hover:bg-white/15 transition-all group">
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-brand-sage/20 border border-brand-sage/40 flex items-center justify-center text-white group-hover:scale-105 transition-transform shadow-sm">
                    <BarChart3 className="w-6 h-6 text-brand-sage" />
                  </div>
                  <span className="text-[12px] font-bold uppercase tracking-wider text-brand-sage px-3 py-1 rounded-full bg-brand-sage/20 border border-brand-sage/40">
                    Step 02
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-section-lg sm:text-[22px] font-bold text-white tracking-tight">
                    2. Compound Pattern Engine
                  </h3>
                  <p className="text-body-md text-white/75 leading-relaxed">
                    Multi-factor correlation intelligence. See how combinations—like irregular sleep paired with pressure drops—influence your baseline threshold.
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-white/15 flex items-center gap-2 text-meta-sm font-semibold text-brand-sage">
                <BarChart3 className="w-4 h-4 flex-shrink-0" />
                <span>Multivariate Association</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-7 sm:p-8 rounded-[26px] bg-white/10 border border-white/15 backdrop-blur-md flex flex-col justify-between space-y-6 hover:bg-white/15 transition-all group">
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-brand-teal/20 border border-brand-teal/40 flex items-center justify-center text-white group-hover:scale-105 transition-transform shadow-sm">
                    <Compass className="w-6 h-6 text-brand-teal" />
                  </div>
                  <span className="text-[12px] font-bold uppercase tracking-wider text-brand-teal px-3 py-1 rounded-full bg-brand-teal/20 border border-brand-teal/40">
                    Step 03
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-section-lg sm:text-[22px] font-bold text-white tracking-tight">
                    3. Proactive Protection
                  </h3>
                  <p className="text-body-md text-white/75 leading-relaxed">
                    Gentle risk foresight and soothing guidance. Receive non-alarmist recommendations and preventive routines before high-sensitivity windows arrive.
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-white/15 flex items-center gap-2 text-meta-sm font-semibold text-brand-teal">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span>Calm Protective Buffers</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: ASYMMETRIC BENTO GRID (6 Biological Pillars with Visual Variety)
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-sage/20 border border-brand-sage/50 text-brand-dark text-meta-sm font-bold">
            <Radio className="w-4 h-4 text-brand-teal" />
            <span>Comprehensive Neuro-Biology</span>
          </div>
          <h2 className="text-app-xl sm:text-marketing-lg text-brand-dark font-extrabold tracking-tight">
            Built around your everyday physiology
          </h2>
          <p className="text-body-lg text-[#555B55]">
            Migraines are compound neurological events. We track 6 interconnected lifestyle pillars that preserve your autonomic equilibrium.
          </p>
        </div>

        {/* Bento Grid Layout with Visual Diversity */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Bento Tile 1 (Wide 8-cols): Sleep Architecture */}
          <div className="md:col-span-8 p-8 rounded-[28px] bg-gradient-to-br from-white to-[#F6F4EE] border-2 border-brand-sage/60 shadow-soft hover:shadow-soft-md transition-all text-left space-y-5">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-brand-dark text-white flex items-center justify-center shadow-soft">
                <Moon className="w-6 h-6 text-brand-teal" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-teal bg-brand-teal/15 px-3 py-1 rounded-full border border-brand-teal/30">
                Primary Trigger Pillar
              </span>
            </div>
            <div className="space-y-2">
              <h3 className="text-section-lg sm:text-[24px] font-extrabold text-brand-dark tracking-tight">
                Circadian Sleep & Sleep Debt Dynamics
              </h3>
              <p className="text-body-md text-[#555B55] leading-relaxed max-w-xl">
                Monitors sleep continuity, bedtime shifts, early morning wakefulness, and accumulated sleep debt that lower the threshold for cortical spreading depression.
              </p>
            </div>
            {/* Visual Mini Progress */}
            <div className="p-4 rounded-[18px] bg-white border border-brand-sage/40 flex items-center justify-between text-meta-md">
              <span className="font-bold text-brand-dark">Optimal Rest Baseline: 7h 45m</span>
              <span className="text-brand-teal font-bold bg-brand-teal/15 px-2.5 py-0.5 rounded-full text-meta-sm">
                Buffer Healthy
              </span>
            </div>
          </div>

          {/* Bento Tile 2 (4-cols): Autonomic Stress & PSS-10 */}
          <div className="md:col-span-4 p-8 rounded-[28px] bg-white border-2 border-brand-sage/60 shadow-soft hover:shadow-soft-md transition-all text-left space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-teal/20 border border-brand-teal/45 flex items-center justify-center text-brand-dark shadow-sm">
                <Brain className="w-6 h-6 text-brand-dark" />
              </div>
              <div className="space-y-2">
                <h3 className="text-section-lg font-bold text-brand-dark tracking-tight">
                  Stress & PSS-10 Load
                </h3>
                <p className="text-body-md text-[#555B55] leading-relaxed">
                  Clinical Perceived Stress Scale evaluations tracking mental fatigue and parasympathetic rebound.
                </p>
              </div>
            </div>
            <div className="text-[12px] text-brand-teal font-bold flex items-center gap-1.5 pt-3 border-t border-brand-sage/30">
              <CheckCircle2 className="w-4 h-4" />
              <span>Validated Clinical Standard</span>
            </div>
          </div>

          {/* Bento Tile 3 (4-cols): Photophobia Screen Glare */}
          <div className="md:col-span-4 p-8 rounded-[28px] bg-white border-2 border-brand-sage/60 shadow-soft hover:shadow-soft-md transition-all text-left space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-sage/25 border border-brand-sage/50 flex items-center justify-center text-brand-dark shadow-sm">
                <SunMedium className="w-6 h-6 text-brand-dark" />
              </div>
              <div className="space-y-2">
                <h3 className="text-section-lg font-bold text-brand-dark tracking-tight">
                  Photophobia & Glare
                </h3>
                <p className="text-body-md text-[#555B55] leading-relaxed">
                  Optical strain detection, fluorescent exposure, and visual recovery breaks designed for light sensitivity.
                </p>
              </div>
            </div>
            <div className="text-[12px] text-brand-dark font-bold flex items-center gap-1.5 pt-3 border-t border-brand-sage/30">
              <Eye className="w-4 h-4 text-brand-teal" />
              <span>0-Flicker Palette</span>
            </div>
          </div>

          {/* Bento Tile 4 (4-cols): Hydration & Fluids */}
          <div className="md:col-span-4 p-8 rounded-[28px] bg-white border-2 border-brand-sage/60 shadow-soft hover:shadow-soft-md transition-all text-left space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-sage/25 border border-brand-sage/50 flex items-center justify-center text-brand-dark shadow-sm">
                <Droplets className="w-6 h-6 text-brand-dark" />
              </div>
              <div className="space-y-2">
                <h3 className="text-section-lg font-bold text-brand-dark tracking-tight">
                  Hydration Timing
                </h3>
                <p className="text-body-md text-[#555B55] leading-relaxed">
                  Daily water intake distribution before 3:00 PM, electrolyte balance, and cellular osmolarity buffers.
                </p>
              </div>
            </div>
            <div className="text-[12px] text-brand-teal font-bold flex items-center gap-1.5 pt-3 border-t border-brand-sage/30">
              <CheckCircle2 className="w-4 h-4" />
              <span>Target: 2.5L Pre-Afternoon</span>
            </div>
          </div>

          {/* Bento Tile 5 (4-cols): Barometric Weather */}
          <div className="md:col-span-4 p-8 rounded-[28px] bg-white border-2 border-brand-sage/60 shadow-soft hover:shadow-soft-md transition-all text-left space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-teal/20 border border-brand-teal/45 flex items-center justify-center text-brand-dark shadow-sm">
                <Wind className="w-6 h-6 text-brand-dark" />
              </div>
              <div className="space-y-2">
                <h3 className="text-section-lg font-bold text-brand-dark tracking-tight">
                  Barometric Pressure
                </h3>
                <p className="text-body-md text-[#555B55] leading-relaxed">
                  Continuous atmospheric gradient tracking alerting you to rapid millibar drops before storm fronts.
                </p>
              </div>
            </div>
            <div className="text-[12px] text-brand-teal font-bold flex items-center gap-1.5 pt-3 border-t border-brand-sage/30">
              <CloudSun className="w-4 h-4" />
              <span>Automated Weather Sync</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: HIGH-IMPACT COMPARISON TABLE (Why MigraineGuardian is Different)
         ========================================================================= */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 md:p-14 rounded-[32px] bg-white border-2 border-brand-sage/70 shadow-[0_16px_45px_-10px_rgba(38,53,47,0.08)] space-y-9">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-teal/15 border border-brand-teal/40 text-brand-dark text-meta-sm font-bold">
              <Award className="w-4 h-4 text-brand-teal" />
              <span>The Sovereign Standard</span>
            </div>
            <h2 className="text-app-xl sm:text-marketing-lg font-extrabold text-brand-dark tracking-tight">
              Why MigraineGuardian is different
            </h2>
            <p className="text-body-md text-[#555B55]">
              A comparison between proactive clinical foresight and traditional retrospective diary apps.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[560px]">
              <thead>
                <tr className="border-b-2 border-brand-sage/50 text-meta-md text-brand-dark">
                  <th className="py-4 px-4 font-bold text-section-md">Key Capability</th>
                  <th className="py-4 px-5 font-black text-brand-dark bg-brand-teal/20 rounded-t-2xl border-t-2 border-x-2 border-brand-teal/40 text-center">
                    MigraineGuardian
                  </th>
                  <th className="py-4 px-4 font-semibold text-[#737873] text-center">Traditional Apps</th>
                  <th className="py-4 px-4 font-semibold text-[#737873] text-center">Pen & Paper</th>
                </tr>
              </thead>
              <tbody className="text-meta-md divide-y divide-brand-sage/25">
                <tr>
                  <td className="py-4 px-4 font-bold text-brand-dark">Proactive Risk Foresight</td>
                  <td className="py-4 px-5 font-bold text-brand-dark bg-brand-teal/15 border-x-2 border-brand-teal/40 text-center">
                    <span className="inline-flex items-center justify-center gap-1.5 text-brand-dark font-black">
                      <Check className="w-5 h-5 text-brand-teal" /> Multi-factor AI
                    </span>
                  </td>
                  <td className="py-4 px-4 text-[#737873] text-center">✕ Past Pain Only</td>
                  <td className="py-4 px-4 text-[#737873] text-center">✕ None</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-bold text-brand-dark">Atmospheric Weather Sync</td>
                  <td className="py-4 px-5 font-bold text-brand-dark bg-brand-teal/15 border-x-2 border-brand-teal/40 text-center">
                    <span className="inline-flex items-center justify-center gap-1.5 text-brand-dark font-black">
                      <Check className="w-5 h-5 text-brand-teal" /> Barometric Live
                    </span>
                  </td>
                  <td className="py-4 px-4 text-[#737873] text-center">✕ Manual / None</td>
                  <td className="py-4 px-4 text-[#737873] text-center">✕ None</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-bold text-brand-dark">Daily Check-in Speed</td>
                  <td className="py-4 px-5 font-bold text-brand-dark bg-brand-teal/15 border-x-2 border-brand-teal/40 text-center">
                    <span className="inline-flex items-center justify-center gap-1.5 text-brand-dark font-black">
                      <Check className="w-5 h-5 text-brand-teal" /> Under 60 seconds
                    </span>
                  </td>
                  <td className="py-4 px-4 text-[#737873] text-center">✕ 5–10 min forms</td>
                  <td className="py-4 px-4 text-[#737873] text-center">✕ Manual writing</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-bold text-brand-dark">Doctor Consultation Report</td>
                  <td className="py-4 px-5 font-bold text-brand-dark bg-brand-teal/15 border-x-2 border-brand-teal/40 text-center">
                    <span className="inline-flex items-center justify-center gap-1.5 text-brand-dark font-black">
                      <Check className="w-5 h-5 text-brand-teal" /> 1-Click PDF Summary
                    </span>
                  </td>
                  <td className="py-4 px-4 text-[#737873] text-center">✕ Raw messy logs</td>
                  <td className="py-4 px-4 text-[#737873] text-center">✕ Hard to interpret</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-bold text-brand-dark">Privacy Guarantee</td>
                  <td className="py-4 px-5 font-bold text-brand-dark bg-brand-teal/15 border-x-2 border-b-2 border-brand-teal/40 rounded-b-2xl text-center">
                    <span className="inline-flex items-center justify-center gap-1.5 text-brand-dark font-black">
                      <Check className="w-5 h-5 text-brand-teal" /> 100% Private, 0 Ads
                    </span>
                  </td>
                  <td className="py-4 px-4 text-[#737873] text-center">✕ Ad broker tracking</td>
                  <td className="py-4 px-4 text-[#737873] text-center">Private (Physical)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: INTERACTIVE AI COMPANION (With Clickable Topic Chips)
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 md:p-14 rounded-[32px] bg-[#FAF9F5] border-2 border-brand-sage/60 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left: Interactive Topic Selector */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-teal/20 border border-brand-teal/40 text-brand-dark text-meta-sm font-bold">
              <Bot className="w-4 h-4 text-brand-teal" />
              <span>Interactive AI Health Companion</span>
            </div>
            <h2 className="text-app-xl sm:text-marketing-lg text-brand-dark font-extrabold tracking-tight">
              Ask MigraineGuardian anything.
            </h2>
            <p className="text-body-lg text-[#555B55] leading-relaxed">
              Click any clinical scenario below to see how our conversational engine answers with evidence-grounded recommendations:
            </p>

            {/* Clickable Interactive Topic Chips */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => setChatTopic('weather')}
                className={cn(
                  'w-full p-3.5 rounded-[16px] border-2 text-left transition-all flex items-center justify-between cursor-pointer font-bold text-body-md',
                  chatTopic === 'weather'
                    ? 'bg-brand-dark text-white border-brand-dark shadow-md'
                    : 'bg-white text-brand-dark border-brand-sage/40 hover:border-brand-teal'
                )}
              >
                <span>🌩️ Weather & Storm Front Protection</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setChatTopic('sleep')}
                className={cn(
                  'w-full p-3.5 rounded-[16px] border-2 text-left transition-all flex items-center justify-between cursor-pointer font-bold text-body-md',
                  chatTopic === 'sleep'
                    ? 'bg-brand-dark text-white border-brand-dark shadow-md'
                    : 'bg-white text-brand-dark border-brand-sage/40 hover:border-brand-teal'
                )}
              >
                <span>🌙 Sleep Debt & Sensitivity Threshold</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setChatTopic('neck')}
                className={cn(
                  'w-full p-3.5 rounded-[16px] border-2 text-left transition-all flex items-center justify-between cursor-pointer font-bold text-body-md',
                  chatTopic === 'neck'
                    ? 'bg-brand-dark text-white border-brand-dark shadow-md'
                    : 'bg-white text-brand-dark border-brand-sage/40 hover:border-brand-teal'
                )}
              >
                <span>💆 Cervicogenic Neck Strain Relief</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <Link to={ROUTES.CHAT} className="block pt-2">
              <Button variant="primary" size="lg" className="shadow-md font-bold" icon={Bot} iconRight={ArrowRight}>
                Try Live Companion Chat
              </Button>
            </Link>
          </div>

          {/* Right: Dynamic Live Preview Chat Box */}
          <div className="lg:col-span-6">
            <Card variant="warm" className="p-6 sm:p-7 space-y-4 shadow-soft-lg border-2 border-brand-sage/60 rounded-[26px] bg-white">
              <div className="flex items-center justify-between pb-3 border-b border-brand-sage/35">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-brand-dark text-white flex items-center justify-center shadow-soft">
                    <Bot className="w-5 h-5 text-brand-teal" />
                  </div>
                  <div>
                    <span className="text-body-md font-bold text-brand-dark block leading-none">
                      MigraineGuardian Companion
                    </span>
                    <span className="text-meta-sm text-brand-teal font-semibold">
                      Evidence-Grounded Intelligence
                    </span>
                  </div>
                </div>
                <span className="text-[11px] uppercase font-bold text-brand-dark bg-[#FAF9F5] px-3 py-1 rounded-full border border-brand-sage/50">
                  Live Response
                </span>
              </div>

              {/* Chat Dialogue */}
              <div className="space-y-3.5 text-body-md text-left pt-1">
                {/* User Message */}
                <div className="p-4 rounded-[20px] bg-brand-dark text-white rounded-br-none max-w-[88%] ml-auto space-y-1 shadow-sm animate-in fade-in duration-200">
                  <p className="leading-relaxed font-medium">
                    "{chatScenarios[chatTopic].user}"
                  </p>
                  <span className="text-[10px] text-white/70 block text-right font-semibold">
                    You • {chatScenarios[chatTopic].time}
                  </span>
                </div>

                {/* Bot Response */}
                <div className="p-4 rounded-[20px] bg-[#FAF9F5] border-2 border-brand-sage/40 text-brand-dark rounded-bl-none shadow-sm space-y-1.5 animate-in fade-in duration-300">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-brand-teal">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>MigraineGuardian</span>
                  </div>
                  <p className="leading-relaxed text-[#333833] font-normal">
                    "{chatScenarios[chatTopic].bot}"
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: GRAND FINAL HERO CALL TO ACTION (Deep Emerald Nightscape)
         ========================================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative p-10 sm:p-16 rounded-[36px] bg-gradient-to-br from-brand-dark via-[#1C2822] to-[#121A15] text-white text-center shadow-[0_24px_65px_-15px_rgba(38,53,47,0.4)] space-y-8 overflow-hidden border-2 border-brand-teal/30">
          {/* Subtle Ambient Particle Glow */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-teal/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-brand-sage/20 rounded-full blur-3xl pointer-events-none" />

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-meta-sm text-white font-medium mx-auto backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-brand-teal" />
            <span>Join thousands reclaiming peaceful days</span>
          </div>

          <div className="space-y-4 max-w-2xl mx-auto relative z-10">
            <h2 className="text-marketing-lg sm:text-[44px] font-extrabold text-white tracking-tight leading-tight">
              Start understanding your patterns today.
            </h2>
            <p className="text-body-lg text-white/80 leading-relaxed">
              Begin gentle, evidence-grounded tracking in under 60 seconds. Foresee sensitivity windows and take control of your well-being.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <Link to={ROUTES.SIGNUP} className="w-full sm:w-auto">
              <button
                type="button"
                className="w-full sm:w-auto px-8 py-3.5 rounded-btn font-extrabold text-[16px] bg-white hover:bg-[#FAF9F5] active:bg-[#F2EFE9] text-black shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                style={{ color: '#000000' }}
              >
                <span style={{ color: '#000000', fontWeight: 800 }}>Create Free Account</span>
                <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ stroke: '#000000', color: '#000000' }} />
              </button>
            </Link>
            <Link to={ROUTES.HOW_IT_WORKS} className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="xl"
                className="w-full sm:w-auto font-semibold border-white/30 text-white hover:bg-white/10"
              >
                Learn How It Works
              </Button>
            </Link>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-[13px] text-white/75 relative z-10">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-brand-teal" /> No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-brand-teal" /> 100% confidential & local
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-brand-teal" /> Zero 3rd-party ads
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
