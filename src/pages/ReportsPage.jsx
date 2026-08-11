import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ROUTES } from '../utils/constants';
import { reportService } from '../services/reportService';
import { analyticsService } from '../services/analyticsService';
import { authService } from '../services/authService';
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
  FileText,
  Download,
  Share2,
  Printer,
  CheckCircle2,
  Calendar,
  Activity,
  Moon,
  Brain,
  SunMedium,
  Droplets,
  HelpCircle,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  User,
  Clock,
  HeartHandshake,
  Copy,
  Check,
  ClipboardList,
} from 'lucide-react';
import { cn } from '../utils/cn';

export function ReportsPage() {
  const currentUser = useCurrentUser();
  const [reportType, setReportType] = useState('7days'); // '7days', '30days', 'pss'
  const [isExporting, setIsExporting] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Service calls
  const currentReport = reportService.getReport(reportType);
  const analytics = analyticsService.getAnalyticsData(reportType === 'weekly' ? '7days' : '30days');

  const isWeekly = reportType === 'weekly';
  const periodLabel = currentReport.periodLabel;
  const reportData = analytics;

  const handleDownload = async () => {
    await reportService.generatePdfReport(reportType);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-muted-border/60">
        <div>
          <h1 className="text-app-xl sm:text-[32px] font-semibold text-brand-dark tracking-tight leading-tight">
            Your Reports
          </h1>
          <p className="text-body-md text-muted-text mt-0.5">
            Exportable clinical summaries and longitudinal pattern reports for you and your doctor.
          </p>
        </div>

        {/* Tab Controls: Weekly / Monthly */}
        <div className="inline-flex items-center p-1 rounded-card-sm bg-card-warm border border-card-warm-border self-start sm:self-auto select-none shadow-soft">
          <button
            type="button"
            onClick={() => setReportType('weekly')}
            className={cn(
              'px-4 py-1.5 rounded-btn text-meta-md font-medium transition-all',
              isWeekly
                ? 'bg-white text-brand-dark shadow-soft font-semibold border border-muted-border/70'
                : 'text-muted-text hover:text-brand-dark'
            )}
          >
            Weekly
          </button>
          <button
            type="button"
            onClick={() => setReportType('monthly')}
            className={cn(
              'px-4 py-1.5 rounded-btn text-meta-md font-medium transition-all',
              !isWeekly
                ? 'bg-white text-brand-dark shadow-soft font-semibold border border-muted-border/70'
                : 'text-muted-text hover:text-brand-dark'
            )}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card-warm p-4 rounded-card border border-card-warm-border shadow-soft">
        <div className="flex items-center gap-2 text-meta-md text-muted-text-dark font-medium">
          <FileText className="w-4 h-4 text-brand-teal" />
          <span>Report Period: <strong>{periodLabel}</strong></span>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="md"
            onClick={handlePrint}
            icon={Printer}
          >
            Print
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={() => setShareModalOpen(true)}
            icon={Share2}
          >
            Share Report
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleDownload}
            icon={Download}
          >
            Download PDF
          </Button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-3.5 rounded-card-sm bg-brand-teal/15 border border-brand-teal/30 text-brand-dark text-meta-md flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-teal" />
            <span>PDF report generated successfully. Ready for print or clinical consultation.</span>
          </div>
          <button
            type="button"
            onClick={() => setDownloadSuccess(false)}
            className="text-meta-sm underline hover:text-brand-dark font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* =========================================================================
          PRINTABLE & PROFESSIONAL REPORT DOCUMENT CONTAINER
         ========================================================================= */}
      <div className="bg-white border border-muted-border rounded-card-lg p-6 sm:p-10 md:p-12 shadow-soft-lg space-y-10 text-brand-dark print:border-none print:shadow-none print:p-0">
        
        {/* DOCUMENT HEADER */}
        <div className="pb-6 border-b-2 border-brand-dark flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-widest text-brand-teal-dark">
              MIGRAINEGUARDIAN
            </div>
            <h2 className="text-app-xl sm:text-[28px] font-bold text-brand-dark tracking-tight">
              Personal Health & Pattern Report
            </h2>
            <div className="text-meta-md text-muted-text font-medium">
              Period: {periodLabel}
            </div>
          </div>

          <div className="sm:text-right text-meta-sm space-y-0.5">
            <div className="font-bold text-brand-dark">Patient: {currentUser?.name || MOCK_USER.name}</div>
            <div className="text-muted-text">Record ID: {currentUser?.id || MOCK_USER.id}</div>
            <div className="text-brand-sage-dark font-medium">100% Tracking Completion</div>
          </div>
        </div>

        {/* =========================================================================
            SECTION 1: OVERVIEW
           ========================================================================= */}
        <div className="space-y-3.5">
          <h3 className="text-section-md font-bold uppercase tracking-wider text-muted-text-dark pb-1 border-b border-muted-border/60">
            1. Overview
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-card-sm bg-card-warm/60 border border-muted-border space-y-1">
              <span className="text-meta-sm text-muted-text block font-medium">Migraine Days</span>
              <span className="text-app-xl font-bold text-brand-dark block">
                {isWeekly ? '2 days' : '5 days'}
              </span>
              <span className="text-[11px] text-muted-text">
                {isWeekly ? 'Wednesday & Saturday' : 'Recorded in 30-day window'}
              </span>
            </div>

            <div className="p-4 rounded-card-sm bg-card-warm/60 border border-muted-border space-y-1">
              <span className="text-meta-sm text-muted-text block font-medium">Average Risk Estimate</span>
              <span className="text-app-xl font-bold text-brand-dark block">
                {reportData.summary.avgRisk}
              </span>
              <span className="text-[11px] text-muted-text">Mean period probability</span>
            </div>

            <div className="p-4 rounded-card-sm bg-card-warm/60 border border-muted-border space-y-1">
              <span className="text-meta-sm text-muted-text block font-medium">Average Episode Severity</span>
              <span className="text-app-xl font-bold text-brand-dark block">
                7.0 / 10
              </span>
              <span className="text-[11px] text-muted-text">Moderate to severe intensity</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            SECTION 2: RISK TREND (CHART)
           ========================================================================= */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between pb-1 border-b border-muted-border/60">
            <h3 className="text-section-md font-bold uppercase tracking-wider text-muted-text-dark">
              2. Risk Trend Trajectory
            </h3>
            <span className="text-meta-sm text-muted-text">Daily probability & logged episodes</span>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reportData.riskTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="reportRiskGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6F9990" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#A8B9A5" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3E1D7" vertical={false} />
                <XAxis dataKey="date" stroke="#737873" fontSize={10} tickLine={false} />
                <YAxis stroke="#737873" fontSize={10} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} />
                <Tooltip content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white border border-muted-border p-2 rounded shadow-soft text-meta-sm">
                        <span className="font-semibold text-brand-dark block">{label}</span>
                        <span className="text-muted-text">Risk: {payload[0].value}%</span>
                      </div>
                    );
                  }
                  return null;
                }} />
                <Area
                  type="monotone"
                  dataKey="risk"
                  stroke="#26352F"
                  strokeWidth={2}
                  fill="url(#reportRiskGrad)"
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    if (payload.isMigraineDay) {
                      return <circle key={payload.date} cx={cx} cy={cy} r={4.5} fill="#C98278" stroke="#FFFFFF" strokeWidth={1.5} />;
                    }
                    return <circle key={payload.date} cx={cx} cy={cy} r={2.5} fill="#26352F" />;
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* =========================================================================
            SECTION 3: LIFESTYLE TRENDS
           ========================================================================= */}
        <div className="space-y-3.5">
          <h3 className="text-section-md font-bold uppercase tracking-wider text-muted-text-dark pb-1 border-b border-muted-border/60">
            3. Lifestyle Trends
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-meta-md">
            <div className="p-3.5 rounded-card-sm bg-card-warm/50 border border-muted-border space-y-1">
              <div className="flex items-center gap-1.5 text-muted-text text-meta-sm">
                <Moon className="w-3.5 h-3.5 text-brand-teal" />
                <span>Sleep</span>
              </div>
              <div className="text-section-lg font-bold text-brand-dark">{reportData.summary.avgSleep}</div>
              <div className="text-[11px] text-muted-text">Target: 7.5h nightly</div>
            </div>

            <div className="p-3.5 rounded-card-sm bg-card-warm/50 border border-muted-border space-y-1">
              <div className="flex items-center gap-1.5 text-muted-text text-meta-sm">
                <Brain className="w-3.5 h-3.5 text-brand-teal" />
                <span>Daily Stress</span>
              </div>
              <div className="text-section-lg font-bold text-brand-dark">{reportData.summary.avgStress}</div>
              <div className="text-[11px] text-muted-text">Acute daily strain log</div>
            </div>

            <div className="p-3.5 rounded-card-sm bg-brand-sage/15 border border-brand-sage/40 space-y-1">
              <div className="flex items-center gap-1.5 text-brand-dark text-meta-sm font-semibold">
                <ClipboardList className="w-3.5 h-3.5 text-brand-teal" />
                <span>PSS-10 Baseline</span>
              </div>
              <div className="text-section-lg font-bold text-brand-dark">14 / 40</div>
              <div className="text-[11px] text-muted-text-dark font-medium">Validated Moderate Baseline</div>
            </div>

            <div className="p-3.5 rounded-card-sm bg-card-warm/50 border border-muted-border space-y-1">
              <div className="flex items-center gap-1.5 text-muted-text text-meta-sm">
                <SunMedium className="w-3.5 h-3.5 text-brand-teal" />
                <span>Screen Time</span>
              </div>
              <div className="text-section-lg font-bold text-brand-dark">{reportData.summary.avgScreen}</div>
              <div className="text-[11px] text-muted-text">Daily optical exposure</div>
            </div>

            <div className="p-3.5 rounded-card-sm bg-card-warm/50 border border-muted-border space-y-1">
              <div className="flex items-center gap-1.5 text-muted-text text-meta-sm">
                <Droplets className="w-3.5 h-3.5 text-brand-teal" />
                <span>Hydration</span>
              </div>
              <div className="text-section-lg font-bold text-brand-dark">2.2 L</div>
              <div className="text-[11px] text-brand-sage-dark font-medium">+0.6L improvement</div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            SECTION 4: PERSONAL PATTERNS
           ========================================================================= */}
        <div className="space-y-3.5">
          <h3 className="text-section-md font-bold uppercase tracking-wider text-muted-text-dark pb-1 border-b border-muted-border/60">
            4. Personal Patterns (Top Model-Associated Factors)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-meta-md">
            {reportData.patternAnalysis.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-card-sm bg-card-warm/40 border border-muted-border flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-brand-dark block">{item.factor}</span>
                  <span className="text-meta-sm text-muted-text">{item.description}</span>
                </div>
                <div className="text-right">
                  <span className="text-body-md font-bold text-brand-dark block">{item.contribution}%</span>
                  <span className="text-[10px] text-muted-text uppercase">Weight</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-text">
            * Values reflect statistical co-occurrence weight in the user's logged dataset. They do not establish medical causation.
          </p>
        </div>

        {/* =========================================================================
            SECTION 5: WEEKLY INSIGHTS (AI MOCK SUMMARY)
           ========================================================================= */}
        <div className="space-y-3.5">
          <h3 className="text-section-md font-bold uppercase tracking-wider text-muted-text-dark pb-1 border-b border-muted-border/60">
            5. Clinical Stress & Pattern Synthesis
          </h3>

          <div className="p-5 rounded-card-sm bg-card-warm/60 border border-card-warm-border space-y-2">
            <div className="flex items-center gap-2 text-brand-teal-dark font-semibold text-meta-sm uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-brand-teal" />
              <span>Multidimensional Stress & Trigger Analysis</span>
            </div>
            <p className="text-body-md text-brand-dark leading-relaxed">
              "During this tracking period, migraine episodes occurred on days where acute daily stress spikes (&gt;7.5/10) coincided with short sleep duration (&lt;6 hours) on a moderate validated PSS-10 baseline (14/40). Hydration improved significantly (+0.6L/day) compared to the prior baseline, providing a beneficial physiological buffer."
            </p>
          </div>
        </div>

        {/* =========================================================================
            SECTION 6: WHAT CHANGED
           ========================================================================= */}
        <div className="space-y-3.5">
          <h3 className="text-section-md font-bold uppercase tracking-wider text-muted-text-dark pb-1 border-b border-muted-border/60">
            6. What Changed (Comparison with Previous Period)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-meta-md">
            <div className="p-3.5 rounded-card-sm bg-white border border-muted-border flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-muted-text block">Migraine Frequency</span>
                <span className="font-semibold text-brand-dark">2 episodes vs 3 prior</span>
              </div>
              <Badge variant="sage" size="sm">
                -33% Decrease
              </Badge>
            </div>

            <div className="p-3.5 rounded-card-sm bg-white border border-muted-border flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-muted-text block">Hydration Volume</span>
                <span className="font-semibold text-brand-dark">2.2 L vs 1.6 L prior</span>
              </div>
              <Badge variant="sage" size="sm">
                +38% Improved
              </Badge>
            </div>

            <div className="p-3.5 rounded-card-sm bg-white border border-muted-border flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-muted-text block">Average Sleep Duration</span>
                <span className="font-semibold text-brand-dark">6.4 hrs vs 6.8 hrs prior</span>
              </div>
              <Badge variant="alert" size="sm">
                -0.4h Deficit
              </Badge>
            </div>

            <div className="p-3.5 rounded-card-sm bg-white border border-muted-border flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-muted-text block">Daily Stress Index</span>
                <span className="font-semibold text-brand-dark">6.2 / 10 vs 5.4 prior</span>
              </div>
              <Badge variant="alert" size="sm">
                +0.8 Elevated
              </Badge>
            </div>
          </div>
        </div>

        {/* =========================================================================
            SECTION 7: QUESTIONS TO DISCUSS WITH A HEALTHCARE PROFESSIONAL
           ========================================================================= */}
        <div className="space-y-3.5">
          <h3 className="text-section-md font-bold uppercase tracking-wider text-muted-text-dark pb-1 border-b border-muted-border/60">
            7. Questions to Discuss with a Healthcare Professional
          </h3>

          <div className="space-y-2.5">
            <div className="p-4 rounded-card-sm bg-white border border-muted-border flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-sage/20 text-brand-dark font-bold text-meta-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                1
              </div>
              <p className="text-body-md text-brand-dark leading-relaxed">
                "Given that episodes clustered following nights with less than 6 hours of rest, what circadian sleep routines or supplements might support a higher threshold?"
              </p>
            </div>

            <div className="p-4 rounded-card-sm bg-white border border-muted-border flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-sage/20 text-brand-dark font-bold text-meta-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                2
              </div>
              <p className="text-body-md text-brand-dark leading-relaxed">
                "Should we adjust the timing of acute rescue medication (Rizatriptan 10mg) to earlier prodrome stages, such as at initial neck tension onset?"
              </p>
            </div>

            <div className="p-4 rounded-card-sm bg-white border border-muted-border flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-sage/20 text-brand-dark font-bold text-meta-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                3
              </div>
              <p className="text-body-md text-brand-dark leading-relaxed">
                "Are there additional non-pharmacological preventive protocols to pair with my afternoon hydration routine during anticipated weather fronts?"
              </p>
            </div>
          </div>
        </div>

        {/* DOCUMENT FOOTER & MEDICAL DISCLAIMER */}
        <div className="pt-6 border-t border-muted-border text-meta-sm text-muted-text space-y-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span>Generated by MigraineGuardian • Confidential Health Document</span>
            <span>Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-text-light">
            Medical Disclaimer: This report compiles patient self-reported logs and statistical pattern models. It is intended for educational discussion and does not provide medical diagnoses, treatment prescriptions, or replace professional clinical consultations.
          </p>
        </div>
      </div>

      {/* SHARE REPORT MODAL */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-muted-border rounded-card p-6 sm:p-8 max-w-md w-full space-y-5 shadow-soft-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-brand-dark">
                <Share2 className="w-5 h-5 text-brand-teal" />
                <h3 className="text-section-lg font-semibold">Share Clinical Summary</h3>
              </div>
              <p className="text-meta-md text-muted-text">
                Generate a secure, time-limited link to share this report with your neurologist.
              </p>
            </div>

            <div className="p-3.5 rounded-card-sm bg-card-warm border border-muted-border flex items-center justify-between">
              <span className="text-meta-sm text-brand-dark font-mono truncate mr-2">
                https://migraineguardian.app/share/rep_84719_ev
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="p-2 rounded-btn bg-white border border-muted-border hover:bg-card-warm text-brand-dark flex-shrink-0"
                aria-label="Copy link"
              >
                {copiedLink ? <Check className="w-4 h-4 text-brand-teal" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {copiedLink && (
              <span className="text-meta-sm text-brand-teal-dark font-medium block">
                ✓ Secure link copied to clipboard (Expires in 7 days)
              </span>
            )}

            <div className="flex justify-end pt-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setShareModalOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
