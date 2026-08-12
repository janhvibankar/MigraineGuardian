import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ROUTES } from '../utils/constants';
import { predictionService } from '../services/predictionService';
import { reportService } from '../services/reportService';
import { formatUserXaiExplanation } from '../utils/xaiHelper';
import {
  Activity,
  Sparkles,
  ArrowRight,
  Info,
  ShieldCheck,
  CheckCircle2,
  CalendarCheck,
  AlertCircle,
  Loader2,
  TrendingUp,
  TrendingDown,
  BarChart2,
  ChevronDown,
  ChevronUp,
  Zap,
  Brain,
  Moon,
  SunMedium,
  Droplets,
  Smile,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import { cn } from '../utils/cn';

export function RiskAnalysisPage() {
  const [prediction, setPrediction] = useState(null);
  const [reportSummary, setReportSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTechnicalShap, setShowTechnicalShap] = useState(false);
  const [showFullMatrix, setShowFullMatrix] = useState(false);

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

  // Extract SHAP features from prediction.xai.features
  const xaiData = prediction?.xai || null;
  const xaiFeatures = Array.isArray(xaiData?.features) ? xaiData.features : [];

  // Extract elevated baseline factors & recommendations
  const elevatedFactors = prediction?.elevatedFactors || [];
  const focusAreas = prediction?.focusAreas || [];

  // Generate Layer 1 Human-Readable Explanation dynamically from SHAP features
  const userXai = formatUserXaiExplanation(xaiFeatures, currentScore || 0, currentLevel || 'Moderate');

  // Process & Sort SHAP features for Layer 2 Technical SHAP
  const sortedXaiFeatures = [...xaiFeatures].sort((a, b) => {
    const impA = a.importance !== undefined ? a.importance : Math.abs(a.shap_value || 0);
    const impB = b.importance !== undefined ? b.importance : Math.abs(b.shap_value || 0);
    return impB - impA;
  });

  const increasingRiskFactors = sortedXaiFeatures.filter(
    (f) => f.direction === 'increases_risk' || f.shap_value > 0
  );

  const decreasingRiskFactors = sortedXaiFeatures.filter(
    (f) => f.direction === 'decreases_risk' || f.shap_value < 0
  );

  const maxImportance = Math.max(
    ...sortedXaiFeatures.map((f) => (f.importance !== undefined ? f.importance : Math.abs(f.shap_value || 0))),
    0.001
  );

  const getFeatureIcon = (category) => {
    switch (category) {
      case 'sleep':
        return <Moon className="w-4 h-4 text-[#8F443B]" />;
      case 'stress':
        return <Brain className="w-4 h-4 text-[#8F443B]" />;
      case 'screen':
        return <SunMedium className="w-4 h-4 text-[#8F443B]" />;
      case 'hydration':
        return <Droplets className="w-4 h-4 text-brand-teal" />;
      case 'mood':
        return <Smile className="w-4 h-4 text-brand-teal" />;
      default:
        return <Activity className="w-4 h-4 text-brand-teal" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200 text-left pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-muted-border/60">
        <div>
          <h1 className="text-app-xl sm:text-[32px] font-semibold text-brand-dark tracking-tight leading-tight">
            Risk Analysis & Model Insights
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

            {/* Dynamic Overview Sentence */}
            <div className="p-4 rounded-[18px] bg-white border border-brand-sage/40 text-body-md text-[#333833] leading-relaxed shadow-sm">
              <p>{userXai.overviewText}</p>
            </div>
          </Card>

          {/* ========================================================================= */}
          {/* LAYER 1: HUMAN-READABLE EXPLANATION LAYER */}
          {/* ========================================================================= */}

          {/* 1. WHY DOES MY RISK LOOK LIKE THIS? */}
          <Card className="p-7 sm:p-8 border-2 border-brand-sage/50 rounded-[26px] bg-white shadow-soft space-y-6">
            <div className="space-y-1 pb-3 border-b border-brand-sage/30">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-sage/25 border border-brand-sage/40 flex items-center justify-center text-brand-dark">
                  <Sparkles className="w-5 h-5 text-brand-teal" />
                </div>
                <h2 className="text-section-lg font-bold text-brand-dark">
                  Why does my risk look like this?
                </h2>
              </div>
              <p className="text-body-md text-[#444944] pt-1 leading-relaxed">
                {userXai.whySummary}
              </p>
            </div>

            {!userXai.hasFeatures ? (
              <div className="p-6 rounded-[20px] bg-[#FAF9F5] border border-brand-sage/35 text-center text-muted-text space-y-1">
                <Info className="w-6 h-6 text-brand-teal mx-auto mb-1" />
                <p className="font-semibold text-brand-dark">Explainability data is not available for this forecast yet.</p>
                <p className="text-meta-sm">Complete a new check-in to generate feature attributions.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* HIGHER-RISK CONTRIBUTORS */}
                <div className="p-5 rounded-[22px] bg-[#FFFDF9] border-2 border-alert-muted/30 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-alert-muted/20">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-[#8F443B]" />
                      <h3 className="text-section-md font-bold text-brand-dark">
                        Factors associated with higher predicted risk
                      </h3>
                    </div>
                  </div>

                  {userXai.topIncreasing.length === 0 ? (
                    <p className="text-meta-md text-muted-text py-3 text-center">
                      No lifestyle factors contributed to higher predicted risk today.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {userXai.topIncreasing.map((item, idx) => (
                        <div key={idx} className="p-4 bg-white rounded-[16px] border border-alert-muted/25 shadow-sm space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-brand-dark text-body-md flex items-center gap-2">
                              {getFeatureIcon(item.category)}
                              {item.title}
                            </span>
                            <Badge variant="alert" size="sm">
                              Higher Risk Factor
                            </Badge>
                          </div>
                          <p className="text-meta-md text-muted-text leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* LOWER-RISK (PROTECTIVE) CONTRIBUTORS */}
                <div className="p-5 rounded-[22px] bg-[#F7FAF8] border-2 border-brand-sage/40 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-brand-sage/30">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-brand-teal" />
                      <h3 className="text-section-md font-bold text-brand-dark">
                        Factors associated with lower predicted risk
                      </h3>
                    </div>
                  </div>

                  {userXai.topDecreasing.length === 0 ? (
                    <p className="text-meta-md text-muted-text py-3 text-center">
                      No specific factors lowered predicted risk today.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {userXai.topDecreasing.map((item, idx) => (
                        <div key={idx} className="p-4 bg-white rounded-[16px] border border-brand-sage/35 shadow-sm space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-brand-dark text-body-md flex items-center gap-2">
                              {getFeatureIcon(item.category)}
                              {item.title}
                            </span>
                            <Badge variant="teal" size="sm">
                              Protective Signal
                            </Badge>
                          </div>
                          <p className="text-meta-md text-muted-text leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* 2. THINGS YOU CAN FOCUS ON */}
          {userXai.focusSuggestions.length > 0 && (
            <Card className="p-7 sm:p-8 border-2 border-brand-sage/50 rounded-[26px] bg-white shadow-soft space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-brand-sage/30">
                <div className="w-9 h-9 rounded-xl bg-brand-sage/25 border border-brand-sage/40 flex items-center justify-center text-brand-dark">
                  <Lightbulb className="w-5 h-5 text-brand-teal" />
                </div>
                <h2 className="text-section-lg font-bold text-brand-dark">
                  Things You Can Focus On
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                {userXai.focusSuggestions.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-[18px] bg-[#FAF9F5] border border-brand-sage/35 space-y-2 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-brand-dark font-bold text-body-md">
                        <CheckCircle2 className="w-4 h-4 text-brand-teal flex-shrink-0" />
                        <span>{item.title}</span>
                      </div>
                      <p className="text-meta-md text-[#555B55] leading-relaxed">
                        {item.tip}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ========================================================================= */}
          {/* LAYER 2: TECHNICAL SHAP EXPLANATION (EXPANDABLE / COLLAPSIBLE) */}
          {/* ========================================================================= */}
          <div className="space-y-4 pt-2">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowTechnicalShap(!showTechnicalShap)}
              className="w-full border-2 border-brand-sage/60 rounded-[20px] justify-between font-bold py-4 text-brand-dark bg-white hover:bg-[#FAF9F5] shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <BarChart2 className="w-5 h-5 text-brand-teal" />
                <span>{showTechnicalShap ? 'Hide' : 'View'} Technical Model Explanation (SHAP)</span>
              </div>
              {showTechnicalShap ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </Button>

            {showTechnicalShap && (
              <Card className="p-7 sm:p-8 border-2 border-brand-sage/50 rounded-[26px] bg-white shadow-soft space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-brand-sage/30">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <BarChart2 className="w-5 h-5 text-brand-teal" />
                      <h2 className="text-section-lg font-bold text-brand-dark">
                        Model Feature Attributions (SHAP Explanation)
                      </h2>
                    </div>
                    <p className="text-meta-md text-muted-text">
                      Mathematical additive log-odds feature attributions generated by <code className="text-brand-dark bg-brand-sage/20 px-1.5 py-0.5 rounded font-mono text-xs">shap.LinearExplainer</code>.
                    </p>
                  </div>
                  <Badge variant="teal" size="md" className="self-start sm:self-auto font-mono text-xs">
                    {xaiData?.method || 'SHAP'} Engine
                  </Badge>
                </div>

                {sortedXaiFeatures.length === 0 ? (
                  <div className="p-6 rounded-[20px] bg-[#FAF9F5] border border-brand-sage/35 text-center text-muted-text space-y-1">
                    <Info className="w-6 h-6 text-brand-teal mx-auto mb-1" />
                    <p className="font-semibold text-brand-dark">Explainability data is not available for this forecast yet.</p>
                    <p className="text-meta-sm">Complete a new check-in to generate mathematical SHAP attributions.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* LEFT COLUMN: Factors Associated With Higher Predicted Risk */}
                      <div className="p-5 rounded-[20px] bg-[#FFFDF9] border-2 border-alert-muted/30 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-alert-muted/20">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-[#8F443B]" />
                            <h3 className="text-section-md font-bold text-brand-dark">
                              Factors Associated With Higher Predicted Risk
                            </h3>
                          </div>
                          <Badge variant="alert" size="sm">
                            {increasingRiskFactors.length} Factor{increasingRiskFactors.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>

                        {increasingRiskFactors.length === 0 ? (
                          <p className="text-meta-md text-muted-text py-2 text-center">
                            No factors increased risk for this log.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {increasingRiskFactors.map((item, idx) => {
                              const importanceVal = item.importance !== undefined ? item.importance : Math.abs(item.shap_value || 0);
                              const barPercent = Math.min(100, Math.round((importanceVal / maxImportance) * 100));
                              const formattedValue = item.shap_value > 0 ? `+${item.shap_value.toFixed(4)}` : item.shap_value.toFixed(4);

                              return (
                                <div key={idx} className="p-3.5 bg-white rounded-[14px] border border-alert-muted/25 shadow-sm space-y-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-bold text-brand-dark text-body-md">
                                      {item.label || item.feature}
                                    </span>
                                    <span className="text-meta-sm font-extrabold text-[#8F443B] bg-alert-muted/15 px-2 py-0.5 rounded-full font-mono">
                                      Impact: {importanceVal.toFixed(4)}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between text-meta-sm text-muted-text">
                                    <span className="text-[#8F443B] font-semibold flex items-center gap-1">
                                      <TrendingUp className="w-3.5 h-3.5" />
                                      Increases risk
                                    </span>
                                    <span className="font-mono text-xs text-muted-text-dark">
                                      SHAP: {formattedValue}
                                    </span>
                                  </div>

                                  {/* Relative Impact Bar */}
                                  <div className="w-full h-2 bg-brand-sage/20 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-[#8F443B] rounded-full transition-all duration-500"
                                      style={{ width: `${barPercent}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* RIGHT COLUMN: Factors Associated With Lower Predicted Risk */}
                      <div className="p-5 rounded-[20px] bg-[#F7FAF8] border-2 border-brand-sage/40 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-brand-sage/30">
                          <div className="flex items-center gap-2">
                            <TrendingDown className="w-5 h-5 text-brand-teal" />
                            <h3 className="text-section-md font-bold text-brand-dark">
                              Factors Associated With Lower Predicted Risk
                            </h3>
                          </div>
                          <Badge variant="teal" size="sm">
                            {decreasingRiskFactors.length} Factor{decreasingRiskFactors.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>

                        {decreasingRiskFactors.length === 0 ? (
                          <p className="text-meta-md text-muted-text py-2 text-center">
                            No factors lowered risk for this log.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {decreasingRiskFactors.map((item, idx) => {
                              const importanceVal = item.importance !== undefined ? item.importance : Math.abs(item.shap_value || 0);
                              const barPercent = Math.min(100, Math.round((importanceVal / maxImportance) * 100));
                              const formattedValue = item.shap_value.toFixed(4);

                              return (
                                <div key={idx} className="p-3.5 bg-white rounded-[14px] border border-brand-sage/35 shadow-sm space-y-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-bold text-brand-dark text-body-md">
                                      {item.label || item.feature}
                                    </span>
                                    <span className="text-meta-sm font-extrabold text-brand-dark bg-brand-sage/25 px-2 py-0.5 rounded-full font-mono">
                                      Impact: {importanceVal.toFixed(4)}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between text-meta-sm text-muted-text">
                                    <span className="text-brand-teal font-semibold flex items-center gap-1">
                                      <TrendingDown className="w-3.5 h-3.5" />
                                      Protective / lowers risk
                                    </span>
                                    <span className="font-mono text-xs text-muted-text-dark">
                                      SHAP: {formattedValue}
                                    </span>
                                  </div>

                                  {/* Relative Impact Bar */}
                                  <div className="w-full h-2 bg-brand-sage/20 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-brand-teal rounded-full transition-all duration-500"
                                      style={{ width: `${barPercent}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Collapsible Full 12-Feature SHAP Matrix Table */}
                    <div className="pt-2 border-t border-brand-sage/30">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFullMatrix(!showFullMatrix)}
                        className="w-full border-brand-sage/50 justify-between font-semibold"
                      >
                        <span>
                          {showFullMatrix ? 'Hide' : 'View'} Full 12-Feature SHAP Matrix ({sortedXaiFeatures.length} Attributions)
                        </span>
                        {showFullMatrix ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>

                      {showFullMatrix && (
                        <div className="mt-4 overflow-x-auto rounded-[16px] border border-brand-sage/35 bg-[#FAF9F5] p-3 animate-in fade-in duration-200">
                          <table className="w-full text-meta-sm text-left border-collapse">
                            <thead>
                              <tr className="border-b border-brand-sage/40 text-muted-text-dark font-bold">
                                <th className="py-2.5 px-3">Feature Name</th>
                                <th className="py-2.5 px-3">System Key</th>
                                <th className="py-2.5 px-3 text-right">SHAP Value</th>
                                <th className="py-2.5 px-3 text-right">Importance</th>
                                <th className="py-2.5 px-3 text-center">Direction</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-sage/25">
                              {sortedXaiFeatures.map((item, idx) => (
                                <tr key={idx} className="hover:bg-white/60 transition-colors">
                                  <td className="py-2.5 px-3 font-semibold text-brand-dark">
                                    {item.label || item.feature}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-xs text-muted-text">
                                    {item.feature}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-right font-bold text-brand-dark">
                                    {item.shap_value > 0 ? `+${item.shap_value.toFixed(4)}` : item.shap_value.toFixed(4)}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-right font-bold text-brand-dark">
                                    {(item.importance !== undefined ? item.importance : Math.abs(item.shap_value || 0)).toFixed(4)}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    <span className={cn(
                                      "inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full",
                                      item.direction === 'increases_risk' || item.shap_value > 0
                                        ? "bg-alert-muted/20 text-[#8F443B]"
                                        : "bg-brand-sage/30 text-brand-dark"
                                    )}>
                                      {item.direction === 'increases_risk' || item.shap_value > 0 ? '↑ Increases Risk' : '↓ Lowers Risk'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 3. PERSONAL BASELINE COMPARISONS (CLINICAL RULE ENGINE) */}
          {/* ========================================================================= */}
          {elevatedFactors.length > 0 && (
            <Card className="p-7 sm:p-8 border-2 border-brand-sage/50 rounded-[26px] bg-white shadow-soft space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-brand-sage/30">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-brand-teal" />
                    <h2 className="text-section-lg font-bold text-brand-dark">
                      Personal Baseline Comparisons
                    </h2>
                  </div>
                  <p className="text-meta-md text-muted-text">
                    Rule-based physiological metric deviations calculated against your 14-day rolling baseline.
                  </p>
                </div>
                <Badge variant="sage" size="md">
                  Threshold Engine
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {elevatedFactors.map((factor, idx) => (
                  <div key={idx} className="p-4 bg-[#FAF9F5] border border-brand-sage/40 rounded-[16px] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-brand-dark text-body-md">
                        {factor.factor} ({factor.value})
                      </span>
                      <Badge variant={factor.statusType === 'alert' ? 'alert' : 'teal'} size="sm">
                        {factor.comparison}
                      </Badge>
                    </div>
                    <p className="text-meta-sm text-muted-text leading-relaxed">
                      {factor.description}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* DISCLAIMER */}
          <div className="p-4 rounded-[18px] bg-brand-sage/15 border border-brand-sage/30 text-center text-meta-sm text-muted-text max-w-3xl mx-auto space-y-1">
            <p className="font-semibold text-brand-dark">
              Physiological Risk Sensitivity & Machine Learning Attribution Notice
            </p>
            <p>
              MigraineGuardian provides wellness risk estimates and machine learning SHAP attributions for personal tracking. It is not a substitute for professional medical diagnosis or clinical advice.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default RiskAnalysisPage;

