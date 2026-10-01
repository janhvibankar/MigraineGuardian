import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ROUTES } from '../utils/constants';
import { insightsService } from '../services/insightsService';
import { reportService } from '../services/reportService';
import { useTranslation } from '../hooks/useTranslation';
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
  AlertCircle,
  Loader2,
  CalendarCheck,
} from 'lucide-react';
import { cn } from '../utils/cn';

export function InsightsPage() {
  const { t } = useTranslation();
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [weeklyData, setWeeklyData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchInsights() {
      setLoading(true);
      try {
        const data = await insightsService.getWeeklyInsights();
        if (isMounted) {
          setWeeklyData(data);
          setLoading(false);
        }
      } catch (err) {
        console.warn('[InsightsPage] Error loading insights:', err.message);
        if (isMounted) setLoading(false);
      }
    }
    fetchInsights();
    return () => {
      isMounted = false;
    };
  }, []);

  const hasData = Boolean(weeklyData && weeklyData.hasData);

  const handleDownload = async () => {
    await reportService.generatePdfReport('weekly');
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const getPatternTitle = (p) => {
    if (p.id === 'sleep_deficit') return t('insights.patternSleepTitle');
    if (p.id === 'elevated_stress') return t('insights.patternStressTitle');
    return p.title;
  };

  const getPatternDesc = (p) => {
    if (p.id === 'sleep_deficit') return t('insights.patternSleepDesc', { count: p.count, avg: p.avg });
    if (p.id === 'elevated_stress') return t('insights.patternStressDesc', { avg: p.avg });
    return p.description;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200 text-left">
      {/* HEADER & TOP ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-muted-border/60">
        <div>
          <h1 className="text-app-xl sm:text-[32px] font-semibold text-brand-dark tracking-tight leading-tight">
            {t('insights.title')}
          </h1>
          <p className="text-body-md text-muted-text mt-0.5">
            {t('insights.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <Button
            variant="outline"
            size="md"
            onClick={handleDownload}
            icon={Download}
          >
            {t('common.export')}
          </Button>

          <Link to={ROUTES.CHAT}>
            <Button
              variant="primary"
              size="md"
              icon={MessageSquare}
              iconRight={ArrowRight}
            >
              {t('chat.askMigraineGuardian')}
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center space-y-3 py-12">
          <Loader2 className="w-8 h-8 text-brand-teal animate-spin" />
          <span className="text-body-md font-semibold text-brand-dark">
            {t('common.loading')}
          </span>
        </div>
      ) : !hasData ? (
        /* EMPTY STATE FOR NEW USERS */
        <Card variant="warm" className="p-8 sm:p-12 border-2 border-brand-sage/60 rounded-[28px] text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-sage/25 border border-brand-sage/50 flex items-center justify-center mx-auto text-brand-dark">
            <AlertCircle className="w-7 h-7 text-brand-teal" />
          </div>
          <div className="space-y-1">
            <h2 className="text-section-lg font-bold text-brand-dark">
              {t('common.noData')}
            </h2>
            <p className="text-body-md text-[#555B55] max-w-md mx-auto leading-relaxed">
              {t('dashboard.noForecastDesc')}
            </p>
          </div>
          <Link to={ROUTES.DAILY_CHECKIN} className="inline-block pt-2">
            <Button variant="primary" size="lg" icon={CalendarCheck} iconRight={ArrowRight}>
              {t('dashboard.completeCheckinBtn')}
            </Button>
          </Link>
        </Card>
      ) : (
        <>
          {/* SUMMARY TILES */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-card bg-white border border-muted-border shadow-soft space-y-1">
              <span className="text-meta-sm text-muted-text font-medium">{t('analytics.migraineDays')}</span>
              <div className="text-app-xl font-bold text-brand-dark">
                {weeklyData.summary.migraineDays} {t('common.daysAgo', { count: '' }).trim() || 'days'}
              </div>
              <span className="text-[11px] text-muted-text">{t('analytics.timeRange7')}</span>
            </div>

            <div className="p-5 rounded-card bg-white border border-muted-border shadow-soft space-y-1">
              <span className="text-meta-sm text-muted-text font-medium">{t('dashboard.sleepDuration')}</span>
              <div className="text-app-xl font-bold text-brand-dark">
                {weeklyData.summary.rawAvgSleep ? `${weeklyData.summary.rawAvgSleep} ${t('common.hoursShort')}` : weeklyData.summary.avgSleep}
              </div>
              <span className="text-[11px] text-muted-text">{t('dashboard.targetHours')}</span>
            </div>

            <div className="p-5 rounded-card bg-white border border-muted-border shadow-soft space-y-1">
              <span className="text-meta-sm text-muted-text font-medium">{t('dashboard.dailyStress')}</span>
              <div className="text-app-xl font-bold text-brand-dark">
                {weeklyData.summary.rawAvgStress ? `${weeklyData.summary.rawAvgStress} / 10` : weeklyData.summary.avgStress}
              </div>
              <span className="text-[11px] text-muted-text">{t('dashboard.outOfTen')}</span>
            </div>
          </div>

          {/* DISCOVERED PATTERNS */}
          <div className="space-y-4">
            <h2 className="text-section-lg font-bold text-brand-dark">
              {t('insights.keyFindingsTitle')}
            </h2>

            {weeklyData.noticedPatterns && weeklyData.noticedPatterns.length > 0 ? (
              <div className="space-y-3">
                {weeklyData.noticedPatterns.map((p, idx) => (
                  <Card key={idx} className="p-5 bg-white border border-muted-border rounded-card shadow-soft space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-section-md font-bold text-brand-dark">{getPatternTitle(p)}</h3>
                      <Badge variant={p.impact === 'High' ? 'alert' : 'teal'} size="sm">
                        {p.impact} {t('common.impact')}
                      </Badge>
                    </div>
                    <p className="text-meta-md text-[#555B55] leading-relaxed">{getPatternDesc(p)}</p>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-white border border-muted-border rounded-card text-muted-text text-center">
                {t('insights.noPatterns')}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default InsightsPage;
