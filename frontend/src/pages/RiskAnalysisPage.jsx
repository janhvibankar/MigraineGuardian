import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ROUTES } from '../utils/constants';
import { predictionService } from '../services/predictionService';
import { reportService } from '../services/reportService';
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
  Activity,
  Sparkles,
  ArrowRight,
  Info,
  ShieldCheck,
  CheckCircle2,
  CalendarCheck,
  Moon,
  Brain,
  SunMedium,
  Droplets,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '../utils/cn';

export function RiskAnalysisPage() {
  const [prediction, setPrediction] = useState(null);
  const [reportSummary, setReportSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [forecastData, summaryData] = await Promise.all([
          predictionService.getTodayPrediction(),
          reportService.getReportSummary('weekly'),
        ]);

        if (isMounted) {
          setPrediction(forecastData);
          setReportSummary(summaryData);
          setLoading(false);
        }
      } catch (err) {
        console.warn('[RiskAnalysisPage] Error loading data:', err.message);
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const hasForecast = Boolean(prediction && prediction.score !== undefined && prediction.score !== null);
  const currentScore = hasForecast ? prediction.score : null;
  const currentLevel = hasForecast ? prediction.level : null;
  const elevatedFactors = prediction?.elevatedFactors || [];
  const focusAreas = prediction?.focusAreas || [];
  const riskTrend = reportSummary?.riskTrend || [];

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white border border-muted-border p-3 rounded-card-sm shadow-soft text-meta-sm space-y-1 text-left">
          <div className="font-semibold text-brand-dark flex items-center justify-between gap-3">
            <span>{item.day || item.date}</span>
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
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200 text-left">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-muted-border/60">
        <div>
          <h1 className="text-app-xl sm:text-[32px] font-semibold text-brand-dark tracking-tight leading-tight">
            Risk Analysis & SHAP Explanation
          </h1>
          <p className="text-body-md text-muted-text mt-0.5">
            Empirical machine learning risk estimation and explainable AI feature attributions.
          </p>
        </div>

        <Link to={ROUTES.DAILY_CHECKIN}>
          <Button variant="primary" size="md" icon={CalendarCheck} iconRight={ArrowRight}>
            Complete Check-in
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center space-y-3 py-12">
          <Loader2 className="w-8 h-8 text-brand-teal animate-spin" />
          <span className="text-body-md font-semibold text-brand-dark">
            Running ML diagnostic evaluation...
          </span>
        </div>
      ) : !hasForecast ? (
        /* EMPTY STATE FOR NEW USERS */
        <Card variant="warm" className="p-8 sm:p-12 border-2 border-brand-sage/60 rounded-[28px] text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-sage/25 border border-brand-sage/50 flex items-center justify-center mx-auto text-brand-dark">
            <AlertCircle className="w-7 h-7 text-brand-teal" />
          </div>
          <div className="space-y-1">
            <h2 className="text-section-lg font-bold text-brand-dark">
              No risk analysis available yet
            </h2>
            <p className="text-body-md text-[#555B55] max-w-md mx-auto leading-relaxed">
              Complete today's check-in to run the machine learning model and generate Explainable AI (SHAP) risk factor attributions.
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
          {/* HERO FORECAST SCORE */}
          <Card variant="warm" className="p-7 sm:p-9 border-2 border-brand-sage/60 rounded-[26px] shadow-soft space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-brand-sage/35">
              <div className="flex items-center gap-5">
                <div className={cn(
                  "w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 flex flex-col items-center justify-center flex-shrink-0 shadow-sm",
                  currentLevel === 'High' ? "bg-alert-muted/15 border-alert-muted/40 text-[#8F443B]" : "bg-brand-teal/15 border-brand-teal/40 text-brand-dark"
                )}>
                  <span className="text-[34px] sm:text-[40px] font-black leading-none">
                    {currentScore}%
                  </span>
                  <span className="text-[10px] uppercase font-extrabold tracking-wider mt-1">
                    {currentLevel} Risk
                  </span>
                </div>

                <div className="space-y-1">
                  <Badge variant={currentLevel === 'High' ? 'alert' : currentLevel === 'Moderate' ? 'warning' : 'teal'} size="md">
                    {currentLevel} Sensitivity Window
                  </Badge>
                  <h2 className="text-section-lg font-bold text-brand-dark">
                    {prediction.headline}
                  </h2>
                </div>
              </div>
            </div>

            <p className="text-body-md text-[#444944] leading-relaxed">
              {prediction.summary}
            </p>

            {/* Elevated Factors */}
            {elevatedFactors.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-section-md font-bold text-brand-dark">
                  SHAP Attributed Risk Factors
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {elevatedFactors.map((factor, idx) => (
                    <div key={idx} className="p-4 bg-white border border-brand-sage/40 rounded-[16px] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-brand-dark">{factor.factor} ({factor.value})</span>
                        <Badge variant={factor.statusType === 'alert' ? 'alert' : 'teal'} size="sm">
                          {factor.comparison}
                        </Badge>
                      </div>
                      <p className="text-meta-sm text-muted-text">{factor.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

export default RiskAnalysisPage;
