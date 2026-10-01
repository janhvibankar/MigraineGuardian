import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ROUTES } from '../utils/constants';
import { useTranslation } from '../hooks/useTranslation';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Activity,
  Moon,
  Droplets,
  SunMedium,
  Brain,
  CheckCircle2,
  CalendarCheck,
  BarChart3,
  Compass,
  Lock,
  Eye,
  Heart,
  Bot,
  Award,
  ChevronRight,
  CloudSun,
  Wind,
  Check,
  Layers,
} from 'lucide-react';
import { cn } from '../utils/cn';

export function LandingPage() {
  const { t } = useTranslation();
  // AI Companion interactive topic selection
  const [chatTopic, setChatTopic] = useState('weather');

  const chatScenarios = {
    weather: {
      user: t('landing.topicWeather'),
      bot: t('landing.botWeatherResponse'),
      time: '9:02 AM',
    },
    sleep: {
      user: t('landing.topicSleep'),
      bot: t('landing.botSleepResponse'),
      time: '11:15 AM',
    },
    neck: {
      user: t('landing.topicNeck'),
      bot: t('landing.botNeckResponse'),
      time: '3:45 PM',
    },
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
            {t('landing.tagline')}
          </span>
        </div>

        {/* Grand Centered Title */}
        <div className="space-y-5 max-w-4xl mx-auto">
          <h1 className="text-marketing-lg sm:text-[54px] md:text-[64px] text-brand-dark tracking-tight font-extrabold leading-[1.08]">
            {t('landing.heroTitle')}
          </h1>
          <p className="text-body-lg sm:text-[20px] text-[#555B55] leading-relaxed max-w-2xl mx-auto font-normal">
            {t('landing.heroSubtitle')}
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
              {t('landing.getStartedFree')}
            </Button>
          </Link>

          <Link to={ROUTES.HOW_IT_WORKS} className="w-full sm:w-auto">
            <Button
              variant="secondary"
              size="xl"
              className="w-full sm:w-auto text-[16px] font-semibold bg-white/80 hover:bg-white border-2 border-brand-sage/40 px-6 py-3.5"
            >
              {t('landing.exploreHowItWorks')}
            </Button>
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-meta-sm text-[#666C66] font-medium">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-teal" />
            <span>{t('auth.secureBadge')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-brand-teal" />
            <span>{t('nav.pssAssessment')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-brand-sage-dark" />
            <span>{t('landing.pillarGlareTag')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-brand-teal" />
            <span>{t('common.confidentialAndProtected')}</span>
          </div>
        </div>

        {/* 4-Pillar Metric Strip Card (Full-width centered banner) */}
        <div className="pt-4">
          <div className="p-6 sm:p-8 rounded-[24px] bg-gradient-to-r from-[#FAF9F5] via-white to-[#FAF9F5] border-2 border-brand-sage/55 shadow-[0_8px_30px_rgb(0,0,0,0.04)] grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <span className="text-section-lg sm:text-[34px] font-extrabold text-brand-dark block leading-tight">
                {t('landing.stat1Number')}
              </span>
              <span className="text-meta-md text-[#555B55] font-semibold block">{t('landing.stat1Title')}</span>
              <span className="text-[11px] text-muted-text block">{t('landing.stat1Desc')}</span>
            </div>
            <div className="space-y-1 md:border-l border-brand-sage/35">
              <span className="text-section-lg sm:text-[34px] font-extrabold text-brand-dark block leading-tight">
                {t('landing.stat2Number')}
              </span>
              <span className="text-meta-md text-[#555B55] font-semibold block">{t('landing.stat2Title')}</span>
              <span className="text-[11px] text-muted-text block">{t('landing.stat2Desc')}</span>
            </div>
            <div className="space-y-1 border-t md:border-t-0 md:border-l border-brand-sage/35 pt-4 md:pt-0">
              <span className="text-section-lg sm:text-[34px] font-extrabold text-brand-dark block leading-tight">
                {t('landing.stat3Number')}
              </span>
              <span className="text-meta-md text-[#555B55] font-semibold block">{t('landing.stat3Title')}</span>
              <span className="text-[11px] text-muted-text block">{t('landing.stat3Desc')}</span>
            </div>
            <div className="space-y-1 border-t md:border-t-0 md:border-l border-brand-sage/35 pt-4 md:pt-0">
              <span className="text-section-lg sm:text-[34px] font-extrabold text-brand-dark block leading-tight">
                {t('landing.stat4Number')}
              </span>
              <span className="text-meta-md text-[#555B55] font-semibold block">{t('landing.stat4Title')}</span>
              <span className="text-[11px] text-muted-text block">{t('landing.stat4Desc')}</span>
            </div>
          </div>
        </div>

        {/* Visible Medical Disclaimer Card */}
        <div className="pt-2 max-w-4xl mx-auto">
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF9F5] border-2 border-brand-sage/50 flex items-start sm:items-center gap-3.5 text-left text-meta-sm text-[#4E544E] shadow-soft">
            <ShieldCheck className="w-5 h-5 text-brand-teal flex-shrink-0 mt-0.5 sm:mt-0" />
            <p className="leading-relaxed">
              <strong className="font-bold text-brand-dark">{t('landing.medicalDisclaimerPrefix', 'Medical Disclaimer:')}</strong>{' '}
              {t('landing.medicalDisclaimer')}
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: CONTRAST BREAK — THE 3-STEP PROCESS (Rich Deep Forest Theme)
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-14 md:p-16 rounded-[36px] bg-gradient-to-br from-brand-dark via-[#1A2621] to-[#121A15] text-white shadow-[0_24px_60px_-15px_rgba(38,53,47,0.3)] space-y-12">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-meta-sm text-brand-teal font-semibold backdrop-blur-sm">
              <Layers className="w-4 h-4 text-brand-teal" />
              <span>{t('landing.loopTag')}</span>
            </div>
            <h2 className="text-app-xl sm:text-marketing-lg text-white font-extrabold tracking-tight">
              {t('landing.loopHeading')}
            </h2>
            <p className="text-body-lg text-white/80 leading-relaxed max-w-2xl mx-auto">
              {t('landing.loopDesc')}
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
                    {t('landing.step1Tag')}
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-section-lg sm:text-[22px] font-bold text-white tracking-tight">
                    {t('landing.step1Title')}
                  </h3>
                  <p className="text-body-md text-white/75 leading-relaxed">
                    {t('landing.step1Desc')}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-white/15 flex items-center gap-2 text-meta-sm font-semibold text-brand-teal">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{t('landing.step1Badge')}</span>
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
                    {t('landing.step2Tag')}
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-section-lg sm:text-[22px] font-bold text-white tracking-tight">
                    {t('landing.step2Title')}
                  </h3>
                  <p className="text-body-md text-white/75 leading-relaxed">
                    {t('landing.step2Desc')}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-white/15 flex items-center gap-2 text-meta-sm font-semibold text-brand-sage">
                <BarChart3 className="w-4 h-4 flex-shrink-0" />
                <span>{t('landing.step2Badge')}</span>
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
                    {t('landing.step3Tag')}
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-section-lg sm:text-[22px] font-bold text-white tracking-tight">
                    {t('landing.step3Title')}
                  </h3>
                  <p className="text-body-md text-white/75 leading-relaxed">
                    {t('landing.step3Desc')}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-white/15 flex items-center gap-2 text-meta-sm font-semibold text-brand-teal">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span>{t('landing.step3Badge')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: ASYMMETRIC BENTO GRID (6 Biological Pillars)
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h2 className="text-app-xl sm:text-marketing-lg text-brand-dark font-extrabold tracking-tight">
            {t('landing.pillarsHeading')}
          </h2>
          <p className="text-body-lg text-[#555B55]">
            {t('landing.pillarsDesc')}
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Bento Tile 1: Sleep */}
          <div className="md:col-span-8 p-8 rounded-[28px] bg-gradient-to-br from-white to-[#F6F4EE] border-2 border-brand-sage/60 shadow-soft hover:shadow-soft-md transition-all text-left space-y-5">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-brand-dark text-white flex items-center justify-center shadow-soft">
                <Moon className="w-6 h-6 text-brand-teal" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-teal bg-brand-teal/15 px-3 py-1 rounded-full border border-brand-teal/30">
                {t('landing.pillarSleepTag')}
              </span>
            </div>
            <div className="space-y-2">
              <h3 className="text-section-lg sm:text-[24px] font-extrabold text-brand-dark tracking-tight">
                {t('landing.pillarSleepTitle')}
              </h3>
              <p className="text-body-md text-[#555B55] leading-relaxed max-w-xl">
                {t('landing.pillarSleepDesc')}
              </p>
            </div>
            <div className="p-4 rounded-[18px] bg-white border border-brand-sage/40 flex items-center justify-between text-meta-md">
              <span className="font-bold text-brand-dark">{t('landing.pillarSleepBuffer')}</span>
              <span className="text-brand-teal font-bold bg-brand-teal/15 px-2.5 py-0.5 rounded-full text-meta-sm">
                {t('landing.pillarSleepBufferTag')}
              </span>
            </div>
          </div>

          {/* Bento Tile 2: Stress */}
          <div className="md:col-span-4 p-8 rounded-[28px] bg-white border-2 border-brand-sage/60 shadow-soft hover:shadow-soft-md transition-all text-left space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-teal/20 border border-brand-teal/45 flex items-center justify-center text-brand-dark shadow-sm">
                <Brain className="w-6 h-6 text-brand-dark" />
              </div>
              <div className="space-y-2">
                <h3 className="text-section-lg font-bold text-brand-dark tracking-tight">
                  {t('landing.pillarStressTitle')}
                </h3>
                <p className="text-body-md text-[#555B55] leading-relaxed">
                  {t('landing.pillarStressDesc')}
                </p>
              </div>
            </div>
            <div className="text-[12px] text-brand-teal font-bold flex items-center gap-1.5 pt-3 border-t border-brand-sage/30">
              <CheckCircle2 className="w-4 h-4" />
              <span>{t('landing.pillarStressTag')}</span>
            </div>
          </div>

          {/* Bento Tile 3: Screen Glare */}
          <div className="md:col-span-4 p-8 rounded-[28px] bg-white border-2 border-brand-sage/60 shadow-soft hover:shadow-soft-md transition-all text-left space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-sage/25 border border-brand-sage/50 flex items-center justify-center text-brand-dark shadow-sm">
                <SunMedium className="w-6 h-6 text-brand-dark" />
              </div>
              <div className="space-y-2">
                <h3 className="text-section-lg font-bold text-brand-dark tracking-tight">
                  {t('landing.pillarGlareTitle')}
                </h3>
                <p className="text-body-md text-[#555B55] leading-relaxed">
                  {t('landing.pillarGlareDesc')}
                </p>
              </div>
            </div>
            <div className="text-[12px] text-brand-dark font-bold flex items-center gap-1.5 pt-3 border-t border-brand-sage/30">
              <Eye className="w-4 h-4 text-brand-teal" />
              <span>{t('landing.pillarGlareTag')}</span>
            </div>
          </div>

          {/* Bento Tile 4: Hydration */}
          <div className="md:col-span-4 p-8 rounded-[28px] bg-white border-2 border-brand-sage/60 shadow-soft hover:shadow-soft-md transition-all text-left space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-sage/25 border border-brand-sage/50 flex items-center justify-center text-brand-dark shadow-sm">
                <Droplets className="w-6 h-6 text-brand-dark" />
              </div>
              <div className="space-y-2">
                <h3 className="text-section-lg font-bold text-brand-dark tracking-tight">
                  {t('landing.pillarHydrationTitle')}
                </h3>
                <p className="text-body-md text-[#555B55] leading-relaxed">
                  {t('landing.pillarHydrationDesc')}
                </p>
              </div>
            </div>
            <div className="text-[12px] text-brand-teal font-bold flex items-center gap-1.5 pt-3 border-t border-brand-sage/30">
              <CheckCircle2 className="w-4 h-4" />
              <span>{t('landing.pillarHydrationTag')}</span>
            </div>
          </div>

          {/* Bento Tile 5: Weather */}
          <div className="md:col-span-4 p-8 rounded-[28px] bg-white border-2 border-brand-sage/60 shadow-soft hover:shadow-soft-md transition-all text-left space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-teal/20 border border-brand-teal/45 flex items-center justify-center text-brand-dark shadow-sm">
                <Wind className="w-6 h-6 text-brand-dark" />
              </div>
              <div className="space-y-2">
                <h3 className="text-section-lg font-bold text-brand-dark tracking-tight">
                  {t('landing.pillarWeatherTitle')}
                </h3>
                <p className="text-body-md text-[#555B55] leading-relaxed">
                  {t('landing.pillarWeatherDesc')}
                </p>
              </div>
            </div>
            <div className="text-[12px] text-brand-teal font-bold flex items-center gap-1.5 pt-3 border-t border-brand-sage/30">
              <CloudSun className="w-4 h-4" />
              <span>{t('landing.pillarWeatherTag')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: HIGH-IMPACT COMPARISON TABLE
         ========================================================================= */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 md:p-14 rounded-[32px] bg-white border-2 border-brand-sage/70 shadow-[0_16px_45px_-10px_rgba(38,53,47,0.08)] space-y-9">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-teal/15 border border-brand-teal/40 text-brand-dark text-meta-sm font-bold">
              <Award className="w-4 h-4 text-brand-teal" />
              <span>{t('landing.comparisonTag')}</span>
            </div>
            <h2 className="text-app-xl sm:text-marketing-lg font-extrabold text-brand-dark tracking-tight">
              {t('landing.comparisonHeading')}
            </h2>
            <p className="text-body-md text-[#555B55]">
              {t('landing.comparisonDesc')}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[560px]">
              <thead>
                <tr className="border-b-2 border-brand-sage/50 text-meta-md text-brand-dark">
                  <th className="py-4 px-4 font-bold text-section-md">{t('landing.compCol1')}</th>
                  <th className="py-4 px-5 font-black text-brand-dark bg-brand-teal/20 rounded-t-2xl border-t-2 border-x-2 border-brand-teal/40 text-center">
                    {t('landing.compCol2')}
                  </th>
                  <th className="py-4 px-4 font-semibold text-[#737873] text-center">{t('landing.compCol3')}</th>
                  <th className="py-4 px-4 font-semibold text-[#737873] text-center">{t('landing.compCol4')}</th>
                </tr>
              </thead>
              <tbody className="text-meta-md divide-y divide-brand-sage/25">
                <tr>
                  <td className="py-4 px-4 font-bold text-brand-dark">{t('landing.compRow1Title')}</td>
                  <td className="py-4 px-5 font-bold text-brand-dark bg-brand-teal/15 border-x-2 border-brand-teal/40 text-center">
                    <span className="inline-flex items-center justify-center gap-1.5 text-brand-dark font-black">
                      <Check className="w-5 h-5 text-brand-teal" /> {t('landing.compRow1Migraine')}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-[#737873] text-center">{t('landing.compRow1Trad')}</td>
                  <td className="py-4 px-4 text-[#737873] text-center">{t('landing.compRow1Paper')}</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-bold text-brand-dark">{t('landing.compRow2Title')}</td>
                  <td className="py-4 px-5 font-bold text-brand-dark bg-brand-teal/15 border-x-2 border-brand-teal/40 text-center">
                    <span className="inline-flex items-center justify-center gap-1.5 text-brand-dark font-black">
                      <Check className="w-5 h-5 text-brand-teal" /> {t('landing.compRow2Migraine')}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-[#737873] text-center">{t('landing.compRow2Trad')}</td>
                  <td className="py-4 px-4 text-[#737873] text-center">{t('landing.compRow2Paper')}</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-bold text-brand-dark">{t('landing.compRow3Title')}</td>
                  <td className="py-4 px-5 font-bold text-brand-dark bg-brand-teal/15 border-x-2 border-brand-teal/40 text-center">
                    <span className="inline-flex items-center justify-center gap-1.5 text-brand-dark font-black">
                      <Check className="w-5 h-5 text-brand-teal" /> {t('landing.compRow3Migraine')}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-[#737873] text-center">{t('landing.compRow3Trad')}</td>
                  <td className="py-4 px-4 text-[#737873] text-center">{t('landing.compRow3Paper')}</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-bold text-brand-dark">{t('landing.compRow4Title')}</td>
                  <td className="py-4 px-5 font-bold text-brand-dark bg-brand-teal/15 border-x-2 border-brand-teal/40 text-center">
                    <span className="inline-flex items-center justify-center gap-1.5 text-brand-dark font-black">
                      <Check className="w-5 h-5 text-brand-teal" /> {t('landing.compRow4Migraine')}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-[#737873] text-center">{t('landing.compRow4Trad')}</td>
                  <td className="py-4 px-4 text-[#737873] text-center">{t('landing.compRow4Paper')}</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-bold text-brand-dark">{t('landing.compRow5Title')}</td>
                  <td className="py-4 px-5 font-bold text-brand-dark bg-brand-teal/15 border-x-2 border-b-2 border-brand-teal/40 rounded-b-2xl text-center">
                    <span className="inline-flex items-center justify-center gap-1.5 text-brand-dark font-black">
                      <Check className="w-5 h-5 text-brand-teal" /> {t('landing.compRow5Migraine')}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-[#737873] text-center">{t('landing.compRow5Trad')}</td>
                  <td className="py-4 px-4 text-[#737873] text-center">{t('landing.compRow5Paper')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: INTERACTIVE AI COMPANION
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 md:p-14 rounded-[32px] bg-[#FAF9F5] border-2 border-brand-sage/60 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left: Interactive Topic Selector */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-teal/20 border border-brand-teal/40 text-brand-dark text-meta-sm font-bold">
              <Bot className="w-4 h-4 text-brand-teal" />
              <span>{t('landing.aiCompanionTag')}</span>
            </div>
            <h2 className="text-app-xl sm:text-marketing-lg text-brand-dark font-extrabold tracking-tight">
              {t('landing.aiCompanionHeading')}
            </h2>
            <p className="text-body-lg text-[#555B55] leading-relaxed">
              {t('landing.aiCompanionDesc')}
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
                <span>🌩️ {t('landing.topicWeather')}</span>
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
                <span>🌙 {t('landing.topicSleep')}</span>
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
                <span>💆 {t('landing.topicNeck')}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <Link to={ROUTES.CHAT} className="block pt-2">
              <Button variant="primary" size="lg" className="shadow-md font-bold" icon={Bot} iconRight={ArrowRight}>
                {t('landing.tryLiveChatBtn')}
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
                      {t('landing.liveCompanionTitle')}
                    </span>
                    <span className="text-meta-sm text-brand-teal font-semibold">
                      {t('landing.liveCompanionSub')}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] uppercase font-bold text-brand-dark bg-[#FAF9F5] px-3 py-1 rounded-full border border-brand-sage/50">
                  {t('landing.liveResponseTag')}
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
                    {t('common.today')} • {chatScenarios[chatTopic].time}
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
          SECTION 6: GRAND FINAL HERO CALL TO ACTION
         ========================================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative p-10 sm:p-16 rounded-[36px] bg-gradient-to-br from-brand-dark via-[#1C2822] to-[#121A15] text-white text-center shadow-[0_24px_65px_-15px_rgba(38,53,47,0.4)] space-y-8 overflow-hidden border-2 border-brand-teal/30">
          {/* Subtle Ambient Particle Glow */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-teal/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-brand-sage/20 rounded-full blur-3xl pointer-events-none" />

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-meta-sm text-white font-medium mx-auto backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-brand-teal" />
            <span>{t('landing.ctaBadge')}</span>
          </div>

          <div className="space-y-4 max-w-2xl mx-auto relative z-10">
            <h2 className="text-marketing-lg sm:text-[44px] font-extrabold text-white tracking-tight leading-tight">
              {t('landing.ctaHeading')}
            </h2>
            <p className="text-body-lg text-white/80 leading-relaxed">
              {t('landing.ctaDesc')}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <Link to={ROUTES.SIGNUP} className="w-full sm:w-auto">
              <button
                type="button"
                className="w-full sm:w-auto px-8 py-3.5 rounded-btn font-extrabold text-[16px] bg-white hover:bg-[#FAF9F5] active:bg-[#F2EFE9] text-black shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                style={{ color: '#000000' }}
              >
                <span style={{ color: '#000000', fontWeight: 800 }}>{t('common.createFreeAccount')}</span>
                <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ stroke: '#000000', color: '#000000' }} />
              </button>
            </Link>
            <Link to={ROUTES.HOW_IT_WORKS} className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="xl"
                className="w-full sm:w-auto font-semibold border-white/30 text-white hover:bg-white/10"
              >
                {t('common.learnHowItWorks')}
              </Button>
            </Link>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-[13px] text-white/75 relative z-10">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-brand-teal" /> {t('common.noCreditCardRequired')}
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-brand-teal" /> {t('common.confidentialAndProtected')}
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-brand-teal" /> {t('common.zeroThirdPartyAds')}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
