import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ROUTES } from '../utils/constants';
import { reportService } from '../services/reportService';
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
  User,
  Clock,
  HeartHandshake,
  Copy,
  Check,
  ClipboardList,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '../utils/cn';

export function ReportsPage() {
  const currentUser = useCurrentUser();
  const [reportType, setReportType] = useState('weekly'); // 'weekly' or 'monthly'
  const [reportSummary, setReportSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchReport() {
      setLoading(true);
      try {
        const summary = await reportService.getReportSummary(reportType);
        if (isMounted) {
          setReportSummary(summary);
          setLoading(false);
        }
      } catch (err) {
        console.warn('[ReportsPage] Error loading report summary:', err.message);
        if (isMounted) setLoading(false);
      }
    }
    fetchReport();
    return () => {
      isMounted = false;
    };
  }, [reportType]);

  const isWeekly = reportType === 'weekly';
  const periodLabel = reportSummary?.periodLabel || (isWeekly ? 'Past 7 Days' : 'Past 30 Days');
  const hasData = Boolean(reportSummary && reportSummary.hasData);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-muted-border/60 text-left">
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
              'px-4 py-1.5 rounded-btn text-meta-md font-medium transition-all cursor-pointer',
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
              'px-4 py-1.5 rounded-btn text-meta-md font-medium transition-all cursor-pointer',
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card-warm p-4 rounded-card border border-card-warm-border shadow-soft text-left">
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

      {loading ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center space-y-3 py-12">
          <Loader2 className="w-8 h-8 text-brand-teal animate-spin" />
          <span className="text-body-md font-semibold text-brand-dark">
            Generating your report summary...
          </span>
        </div>
      ) : (
        /* PRINTABLE & PROFESSIONAL REPORT DOCUMENT CONTAINER */
        <div className="bg-white border border-muted-border rounded-card-lg p-6 sm:p-10 md:p-12 shadow-soft-lg space-y-10 text-brand-dark text-left print:border-none print:shadow-none print:p-0">
          
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
              <div className="font-bold text-brand-dark">Patient: {currentUser?.name || 'User'}</div>
              <div className="text-muted-text">
                {hasData ? `Record ID: ${reportSummary.recordId}` : 'No Records Logged'}
              </div>
              <div className="text-brand-sage-dark font-medium">
                {hasData ? `${reportSummary.trackingCompletion}% Tracking Completion` : '0% Tracking Completion'}
              </div>
            </div>
          </div>

          {!hasData ? (
            /* EMPTY STATE CARD FOR NEW USERS WITH NO RECORDS */
            <div className="p-8 border-2 border-dashed border-brand-sage/50 rounded-[22px] bg-[#FAF9F5] text-center space-y-4 my-6">
              <div className="w-12 h-12 rounded-2xl bg-brand-sage/25 border border-brand-sage/50 flex items-center justify-center mx-auto text-brand-dark">
                <AlertCircle className="w-6 h-6 text-brand-teal" />
              </div>
              <div className="space-y-1">
                <h3 className="text-section-md font-bold text-brand-dark">
                  No report data available yet.
                </h3>
                <p className="text-meta-md text-[#555B55] max-w-md mx-auto leading-relaxed">
                  Complete your daily check-in to generate your personal clinical pattern summary and risk history.
                </p>
              </div>
              <Link to={ROUTES.DAILY_CHECKIN} className="inline-block pt-2">
                <Button variant="primary" size="md" icon={CalendarCheck} iconRight={ArrowRight}>
                  Complete Today's Check-in
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* SECTION 1: OVERVIEW */}
              <div className="space-y-3.5">
                <h3 className="text-section-md font-bold uppercase tracking-wider text-muted-text-dark pb-1 border-b border-muted-border/60">
                  1. Overview
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-card-sm bg-card-warm/60 border border-muted-border space-y-1">
                    <span className="text-meta-sm text-muted-text block font-medium">Migraine Days</span>
                    <span className="text-app-xl font-bold text-brand-dark block">
                      {reportSummary.migraineDays} day(s)
                    </span>
                    <span className="text-[11px] text-muted-text">
                      Recorded in {reportSummary.expectedDays}-day window
                    </span>
                  </div>

                  <div className="p-4 rounded-card-sm bg-card-warm/60 border border-muted-border space-y-1">
                    <span className="text-meta-sm text-muted-text block font-medium">Average Risk Estimate</span>
                    <span className="text-app-xl font-bold text-brand-dark block">
                      {reportSummary.avgRisk !== null ? `${reportSummary.avgRisk}%` : 'No data'}
                    </span>
                    <span className="text-[11px] text-muted-text">Mean period probability</span>
                  </div>

                  <div className="p-4 rounded-card-sm bg-card-warm/60 border border-muted-border space-y-1">
                    <span className="text-meta-sm text-muted-text block font-medium">Average Episode Severity</span>
                    <span className="text-app-xl font-bold text-brand-dark block">
                      {reportSummary.avgSeverity ? `${reportSummary.avgSeverity} / 10` : 'No episodes'}
                    </span>
                    <span className="text-[11px] text-muted-text">Reported pain intensity</span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: RISK TREND (CHART) */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-1 border-b border-muted-border/60">
                  <h3 className="text-section-md font-bold uppercase tracking-wider text-muted-text-dark">
                    2. Risk Trend Trajectory
                  </h3>
                  <span className="text-meta-sm text-muted-text">Daily probability & logged episodes</span>
                </div>

                <div className="h-56 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={reportSummary.riskTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
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

              {/* SECTION 3: KEY SUMMARY TAKEAWAY */}
              <div className="p-4 rounded-card bg-brand-sage/15 border border-brand-sage/40 space-y-1.5">
                <div className="flex items-center gap-2 text-meta-sm font-bold text-brand-dark">
                  <Sparkles className="w-4 h-4 text-brand-teal" />
                  <span>Clinical Summary Notes</span>
                </div>
                <p className="text-meta-md text-[#333833] leading-relaxed">
                  {reportSummary.keyTakeaway}
                </p>
              </div>
            </>
          )}

          {/* DOCUMENT FOOTER */}
          <div className="pt-6 border-t border-muted-border text-meta-sm text-muted-text flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>MigraineGuardian Personal Wellness Tracking System</div>
            <div>Confidential • Educational Clinical Summary</div>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-muted-border rounded-card p-6 sm:p-8 max-w-md w-full space-y-5 shadow-soft-lg text-left">
            <div className="space-y-1">
              <h3 className="text-section-lg font-bold text-brand-dark">
                Share Report Summary
              </h3>
              <p className="text-meta-md text-muted-text">
                Generate a secure, temporary link to share this clinical summary with your healthcare provider.
              </p>
            </div>

            <div className="p-3 bg-card-warm border border-muted-border rounded-card-sm flex items-center justify-between gap-2">
              <span className="text-meta-sm text-brand-dark truncate font-mono">
                https://migraineguardian.app/share/rep_{Date.now()}_ev
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-btn bg-brand-dark text-white text-meta-sm font-medium hover:bg-[#1C2822] flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setShareModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsPage;
