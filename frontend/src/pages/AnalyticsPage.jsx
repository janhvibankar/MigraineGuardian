import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ROUTES } from '../utils/constants';
import { analyticsService } from '../services/analyticsService';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  Activity,
  Calendar,
  Clock,
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
  AlertCircle,
  Loader2,
  CalendarCheck,
} from 'lucide-react';
import { cn } from '../utils/cn';

export function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState('7days'); // '7days', '30days'
  const [currentData, setCurrentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchAnalytics() {
      setLoading(true);
      try {
        const data = await analyticsService.getAnalyticsData(timeframe);
        if (isMounted) {
          setCurrentData(data);
          setLoading(false);
        }
      } catch (err) {
        console.warn('[AnalyticsPage] Error loading analytics data:', err.message);
        if (isMounted) setLoading(false);
      }
    }
    fetchAnalytics();
    return () => {
      isMounted = false;
    };
  }, [timeframe]);

  const hasData = Boolean(currentData && currentData.hasData);

  // Custom Tooltip for Charts
  const CustomTooltip = ({ active, payload, label, unit = '' }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-muted-border p-2.5 rounded-card-sm shadow-soft text-meta-sm space-y-1 text-left">
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
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200 text-left">
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

        {/* Filter: 7 days, 30 days */}
        <div className="inline-flex items-center p-1 rounded-card-sm bg-card-warm border border-card-warm-border self-start sm:self-auto select-none shadow-soft">
          {[
            { id: '7days', label: '7 days' },
            { id: '30days', label: '30 days' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTimeframe(tab.id)}
              className={cn(
                'px-3.5 py-1.5 rounded-btn text-meta-md font-medium transition-all cursor-pointer',
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

      {loading ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center space-y-3 py-12">
          <Loader2 className="w-8 h-8 text-brand-teal animate-spin" />
          <span className="text-body-md font-semibold text-brand-dark">
            Loading analytics dataset...
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
              No analytics data available yet
            </h2>
            <p className="text-body-md text-[#555B55] max-w-md mx-auto leading-relaxed">
              Complete your daily check-ins to build longitudinal charts for sleep, stress, hydration, and risk trajectory.
            </p>
          </div>
          <Link to={ROUTES.DAILY_CHECKIN} className="inline-block pt-2">
            <Button variant="primary" size="lg" icon={CalendarCheck} iconRight={ArrowRight}>
              Complete Today's Check-in
            </Button>
          </Link>
        </Card>
      ) : (
        <>
          {/* SUMMARY TILES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-card bg-white border border-muted-border shadow-soft space-y-1">
              <span className="text-meta-sm text-muted-text font-medium">Logged Check-ins</span>
              <div className="text-app-xl font-bold text-brand-dark">{currentData.totalLogs}</div>
              <span className="text-[11px] text-muted-text">Recorded entries</span>
            </div>

            <div className="p-5 rounded-card bg-white border border-muted-border shadow-soft space-y-1">
              <span className="text-meta-sm text-muted-text font-medium">Average Sleep</span>
              <div className="text-app-xl font-bold text-brand-dark">{currentData.summary.avgSleep}</div>
              <span className="text-[11px] text-muted-text">Target: 7.5 hrs</span>
            </div>

            <div className="p-5 rounded-card bg-white border border-muted-border shadow-soft space-y-1">
              <span className="text-meta-sm text-muted-text font-medium">Average Stress</span>
              <div className="text-app-xl font-bold text-brand-dark">{currentData.summary.avgStress}</div>
              <span className="text-[11px] text-muted-text">Target: &lt; 5.0</span>
            </div>

            <div className="p-5 rounded-card bg-white border border-muted-border shadow-soft space-y-1">
              <span className="text-meta-sm text-muted-text font-medium">Average Hydration</span>
              <div className="text-app-xl font-bold text-brand-dark">{currentData.summary.avgHydration}</div>
              <span className="text-[11px] text-muted-text">Target: 2.2 L</span>
            </div>
          </div>

          {/* CHARTS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Index Horizon */}
            <Card className="p-6 space-y-4 bg-white border border-muted-border rounded-card shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle as="h3" className="text-section-md font-bold text-brand-dark">
                    Risk Estimate Trajectory
                  </CardTitle>
                  <CardDescription className="text-meta-sm text-muted-text">
                    Daily probability scores from your logged check-ins
                  </CardDescription>
                </div>
                <Badge variant="teal" size="sm">Risk</Badge>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={currentData.riskTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E3E1D7" vertical={false} />
                    <XAxis dataKey="day" stroke="#737873" fontSize={11} tickLine={false} />
                    <YAxis stroke="#737873" fontSize={11} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip unit="%" />} />
                    <Area type="monotone" dataKey="risk" stroke="#26352F" strokeWidth={2} fill="#A8B9A5" fillOpacity={0.25} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Sleep Rest Duration */}
            <Card className="p-6 space-y-4 bg-white border border-muted-border rounded-card shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle as="h3" className="text-section-md font-bold text-brand-dark">
                    Sleep Rest Duration
                  </CardTitle>
                  <CardDescription className="text-meta-sm text-muted-text">
                    Nightly sleep hours logged by day
                  </CardDescription>
                </div>
                <Badge variant="sage" size="sm">Sleep</Badge>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={currentData.sleepTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E3E1D7" vertical={false} />
                    <XAxis dataKey="day" stroke="#737873" fontSize={11} tickLine={false} />
                    <YAxis stroke="#737873" fontSize={11} tickLine={false} axisLine={false} unit="h" domain={[0, 12]} />
                    <Tooltip content={<CustomTooltip unit="hrs" />} />
                    <Bar dataKey="hours" fill="#6F9990" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

export default AnalyticsPage;
