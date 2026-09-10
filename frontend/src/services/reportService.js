import { jsPDF } from 'jspdf';
import { trackingService } from './trackingService.js';
import { predictionService } from './predictionService.js';
import { pssService } from './pssService.js';
import { authService } from './authService.js';

function formatPeriodLabel(daysCount) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - (daysCount - 1));

  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  const startStr = startDate.toLocaleDateString('en-US', options);
  const endStr = endDate.toLocaleDateString('en-US', options);

  return `${startStr} – ${endStr}`;
}

export const reportService = {
  /**
   * Dynamically generates report summary metrics and historical risk trajectory
   * strictly from authenticated user's check-in logs and forecasts.
   */
  getReportSummary: async (timeframe = 'weekly') => {
    const daysLimit = timeframe === 'monthly' ? 30 : 7;
    const periodLabel = formatPeriodLabel(daysLimit);

    // Fetch existing historical logs, today's log, forecast and latest PSS assessment
    let logs = await trackingService.getDailyLogs(daysLimit);
    const todayLog = (await trackingService.fetchTodayLog()) || trackingService.getTodayLog();
    const prediction = await predictionService.getTodayPrediction();
    const latestPss = await pssService.getLatestAssessment();

    // Ensure today's log is included in the reporting array if not already present
    if (todayLog && todayLog.date) {
      if (!Array.isArray(logs) || logs.length === 0) {
        logs = [todayLog];
      } else {
        const hasToday = logs.some((l) => l.date === todayLog.date);
        if (!hasToday) {
          logs = [todayLog, ...logs];
        }
      }
    }

    const hasTodayCheckin = Boolean(todayLog);
    const hasLogs = Array.isArray(logs) && logs.length > 0;
    const hasPrediction = Boolean(prediction && prediction.score !== undefined);

    if (!hasLogs && !hasPrediction && !hasTodayCheckin) {
      return {
        hasData: false,
        hasTodayCheckin: false,
        timeframe,
        periodLabel,
        recordId: null,
        migraineDays: 0,
        avgRisk: null,
        avgSeverity: null,
        trackingCompletion: 0,
        totalLogs: 0,
        expectedDays: daysLimit,
        riskTrend: [],
        primaryTriggers: [],
        topFactors: [],
        recommendations: [],
        latestPss: latestPss || null,
        keyTakeaway: 'No check-in records logged for this period. Complete your daily check-in to build personalized report metrics.',
      };
    }

    // Filter logs within timeframe
    const validLogs = (logs || []).slice(0, daysLimit);
    const totalLogs = validLogs.length;
    const trackingCompletion = Math.min(100, Math.round((Math.max(totalLogs, hasTodayCheckin ? 1 : 0) / daysLimit) * 100));

    // Count migraine days & severity
    let migraineDays = 0;
    let totalSeverity = 0;
    let severityCount = 0;

    const riskTrend = validLogs.map((log) => {
      const isMigraine = Boolean(log.migraine_occurrence);
      if (isMigraine) {
        migraineDays++;
        if (log.migraine_severity !== null && log.migraine_severity !== undefined) {
          totalSeverity += Number(log.migraine_severity);
          severityCount++;
        }
      }

      // Compute estimated risk index from log signals or prediction if today
      let estRisk = 25;
      if (log.date === todayLog?.date && prediction?.score !== undefined) {
        estRisk = Number(prediction.score);
      } else {
        estRisk = Math.min(
          100,
          Math.max(
            10,
            Math.round(
              (10 - Number(log.sleep_hours || 7)) * 8 +
                Number(log.daily_stress || 4) * 6 +
                Number(log.screen_time || 5) * 4 -
                Number(log.hydration || 2) * 3
            )
          )
        );
      }

      const dateObj = new Date(log.date);
      const dayLabel = isNaN(dateObj.getTime())
        ? log.date
        : dateObj.toLocaleDateString('en-US', { weekday: 'short' });

      return {
        date: log.date,
        day: dayLabel,
        risk: estRisk,
        isMigraineDay: isMigraine,
        sleep: log.sleep_hours,
        stress: log.daily_stress,
        screen: log.screen_time,
        hydration: log.hydration,
      };
    }).reverse(); // Chronological order

    const avgSeverity = severityCount > 0 ? (totalSeverity / severityCount).toFixed(1) : null;
    const avgRisk = prediction?.score ?? (riskTrend.length > 0 ? Math.round(riskTrend.reduce((acc, r) => acc + r.risk, 0) / riskTrend.length) : null);

    const topFactors = prediction?.topFactors || prediction?.elevatedFactors || [];
    const recommendations = prediction?.recommendations || prediction?.focusAreas || [];

    return {
      hasData: true,
      hasTodayCheckin,
      timeframe,
      periodLabel,
      recordId: `MG-REP-${Date.now().toString(36).toUpperCase()}`,
      migraineDays,
      avgRisk,
      avgSeverity,
      trackingCompletion,
      totalLogs,
      expectedDays: daysLimit,
      riskTrend,
      topFactors,
      recommendations,
      latestPss: latestPss || null,
      todayPrediction: prediction || null,
      todayLog: todayLog || null,
      keyTakeaway: migraineDays > 0
        ? `Logged ${migraineDays} migraine episode(s) across ${totalLogs} check-ins. Maintain consistent sleep and hydration routines.`
        : `Zero migraine episodes logged across ${totalLogs} check-ins. Baseline metrics remain stable.`,
    };
  },

  /**
   * Generates a genuine binary PDF clinical report document starting with %PDF- signature
   * and triggers an authentic browser download.
   */
  generatePdfReport: async (type = 'weekly', summaryData = null, currentUser = null) => {
    const summary = summaryData || (await reportService.getReportSummary(type));
    const user = currentUser || authService.getCurrentUser();
    const patientName = user?.name || 'User';
    const patientEmail = user?.email || 'N/A';
    const todayStr = new Date().toISOString().split('T')[0];
    const filename = `MigraineGuardian_${type}_Clinical_Report_${todayStr}.pdf`;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let currentY = 18;

    // Helper color constants
    const COLOR_DARK = [38, 53, 47];      // #26352F
    const COLOR_TEAL = [111, 153, 144];   // #6F9990
    const COLOR_MUTED = [110, 115, 110];  // #6E736E
    const COLOR_ALERT = [143, 68, 59];    // #8F443B
    const BG_LIGHT = [250, 249, 245];     // #FAF9F5
    const BORDER_COLOR = [223, 220, 209]; // #DFDCD1

    // ------------------------------------------------------------------------
    // HEADER BLOCK
    // ------------------------------------------------------------------------
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLOR_TEAL);
    doc.text('MIGRAINEGUARDIAN', margin, currentY);

    // Right-aligned Metadata
    doc.setFontSize(9);
    doc.setTextColor(...COLOR_DARK);
    doc.text(`Patient: ${patientName}`, pageWidth - margin, currentY, { align: 'right' });

    currentY += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...COLOR_DARK);
    doc.text('Personal Clinical Pattern & Health Report', margin, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLOR_MUTED);
    doc.text(`Record ID: ${summary.recordId || 'MG-REP-ACTIVE'}`, pageWidth - margin, currentY, { align: 'right' });

    currentY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...COLOR_MUTED);
    doc.text(`Report Period: ${summary.periodLabel}`, margin, currentY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR_TEAL);
    doc.text(`${summary.trackingCompletion}% Tracking Completion`, pageWidth - margin, currentY, { align: 'right' });

    currentY += 4;
    // Header horizontal line
    doc.setDrawColor(...COLOR_DARK);
    doc.setLineWidth(0.6);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 8;

    // ------------------------------------------------------------------------
    // SECTION 1: CLINICAL OVERVIEW
    // ------------------------------------------------------------------------
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...COLOR_DARK);
    doc.text('1. CLINICAL OVERVIEW & SENSITIVITY METRICS', margin, currentY);
    currentY += 4;

    // 3 Metrics Cards (Width: contentWidth / 3 - gap)
    const cardGap = 4;
    const cardWidth = (contentWidth - cardGap * 2) / 3;
    const cardHeight = 18;

    const cardsData = [
      {
        label: 'Migraine Episodes',
        value: `${summary.migraineDays} day(s)`,
        sub: `Recorded in ${summary.expectedDays}-day window`,
      },
      {
        label: 'Average Risk Index',
        value: summary.avgRisk !== null ? `${summary.avgRisk}%` : 'N/A',
        sub: 'Period average probability',
      },
      {
        label: 'Average Severity',
        value: summary.avgSeverity ? `${summary.avgSeverity} / 10` : 'None logged',
        sub: 'Reported episode pain',
      },
    ];

    cardsData.forEach((card, index) => {
      const cardX = margin + index * (cardWidth + cardGap);
      doc.setFillColor(...BG_LIGHT);
      doc.setDrawColor(...BORDER_COLOR);
      doc.setLineWidth(0.3);
      doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 2, 2, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...COLOR_MUTED);
      doc.text(card.label, cardX + 3, currentY + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11.5);
      doc.setTextColor(...COLOR_DARK);
      doc.text(card.value, cardX + 3, currentY + 10.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...COLOR_MUTED);
      doc.text(card.sub, cardX + 3, currentY + 15);
    });

    currentY += cardHeight + 4;

    // Clinical Summary Takeaway Note Box
    doc.setFillColor(241, 239, 234);
    doc.setDrawColor(...BORDER_COLOR);
    doc.roundedRect(margin, currentY, contentWidth, 12, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_DARK);
    doc.text('Clinical Summary Note:', margin + 3, currentY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const splitNote = doc.splitTextToSize(summary.keyTakeaway, contentWidth - 6);
    doc.text(splitNote, margin + 3, currentY + 8.5);

    currentY += 16;

    // PSS-10 Section if present
    if (summary.latestPss) {
      doc.setFillColor(...BG_LIGHT);
      doc.setDrawColor(...BORDER_COLOR);
      doc.roundedRect(margin, currentY, contentWidth, 13, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...COLOR_DARK);
      doc.text(`Perceived Stress Scale (PSS-10) Baseline: ${summary.latestPss.score} / 40 (${summary.latestPss.category || 'Standard Assessment'})`, margin + 3, currentY + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...COLOR_MUTED);
      const pssDesc = summary.latestPss.interpretation || 'Clinical baseline assessment recorded for autonomic sensitivity calibration.';
      doc.text(doc.splitTextToSize(pssDesc, contentWidth - 6), margin + 3, currentY + 9);

      currentY += 17;
    }

    // ------------------------------------------------------------------------
    // SECTION 2: AI RISK FACTORS & RECOMMENDATIONS
    // ------------------------------------------------------------------------
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...COLOR_DARK);
    doc.text('2. IDENTIFIED RISK FACTORS & TARGETED BEHAVIORAL GUIDANCE', margin, currentY);
    currentY += 5;

    const factors = summary.topFactors || [];
    const recommendations = summary.recommendations || [];

    if (factors.length > 0 || recommendations.length > 0) {
      // Top Contributing Factors
      if (factors.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(...COLOR_DARK);
        doc.text('Primary Identified Contributing Factors (Explainable AI / SHAP):', margin, currentY);
        currentY += 4;

        factors.slice(0, 3).forEach((f) => {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(...COLOR_DARK);
          const fName = `• ${f.name || f.label || 'Factor'}: `;
          doc.text(fName, margin + 2, currentY);

          const nameWidth = doc.getTextWidth(fName);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...COLOR_MUTED);
          const fDesc = `${f.description || f.note || 'Impact on autonomic threshold'} ${f.impact ? '(' + f.impact + ')' : ''}`;
          doc.text(fDesc, margin + 2 + nameWidth, currentY);
          currentY += 4;
        });
      }

      // Targeted Recommendations
      if (recommendations.length > 0) {
        currentY += 1;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(...COLOR_DARK);
        doc.text('Targeted Behavioral Focus Areas:', margin, currentY);
        currentY += 4;

        recommendations.slice(0, 3).forEach((r) => {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(...COLOR_DARK);
          const rTitle = `• ${r.title || r.category || 'Guidance'}: `;
          doc.text(rTitle, margin + 2, currentY);

          const titleWidth = doc.getTextWidth(rTitle);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...COLOR_MUTED);
          const rText = `${r.text || r.action || 'Maintain regular circadian and hydration routines.'}`;
          doc.text(rText, margin + 2 + titleWidth, currentY);
          currentY += 4;
        });
      }
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLOR_MUTED);
      doc.text('Baseline sensitivity metrics stable. Complete daily check-ins to build personalized factor attributions.', margin + 2, currentY);
      currentY += 5;
    }

    currentY += 4;

    // ------------------------------------------------------------------------
    // SECTION 3: LONGITUDINAL CHECK-IN LOG TABLE
    // ------------------------------------------------------------------------
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...COLOR_DARK);
    doc.text('3. LONGITUDINAL TRAJECTORY & DAILY CHECK-IN LOG', margin, currentY);
    currentY += 4;

    // Table Header
    const colWidths = [30, 24, 34, 30, 30, 32];
    const headers = ['Date', 'Risk Index', 'Episode', 'Sleep Duration', 'Daily Stress', 'Hydration'];

    doc.setFillColor(244, 243, 238);
    doc.setDrawColor(...BORDER_COLOR);
    doc.rect(margin, currentY, contentWidth, 6, 'FD');

    let colX = margin;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR_DARK);
    headers.forEach((h, i) => {
      doc.text(h, colX + 2, currentY + 4.2);
      colX += colWidths[i];
    });
    currentY += 6;

    // Table Rows
    const trendRows = summary.riskTrend || [];
    if (trendRows.length === 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...COLOR_MUTED);
      doc.text('No check-in entries logged for this period.', margin + 2, currentY + 4.5);
      currentY += 7;
    } else {
      trendRows.slice(0, 10).forEach((t, rIdx) => {
        if (currentY > 265) {
          doc.addPage();
          currentY = 20;
        }

        const isEven = rIdx % 2 === 0;
        if (isEven) {
          doc.setFillColor(252, 251, 249);
          doc.rect(margin, currentY, contentWidth, 5.5, 'F');
        }
        doc.setDrawColor(235, 233, 226);
        doc.line(margin, currentY + 5.5, margin + contentWidth, currentY + 5.5);

        let rowColX = margin;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...COLOR_DARK);

        // Date
        doc.text(`${t.date} (${t.day || ''})`, rowColX + 2, currentY + 4);
        rowColX += colWidths[0];

        // Risk Index
        doc.setFont('helvetica', 'bold');
        if (t.risk > 60) doc.setTextColor(...COLOR_ALERT);
        else doc.setTextColor(...COLOR_DARK);
        doc.text(`${t.risk}%`, rowColX + 2, currentY + 4);
        rowColX += colWidths[1];

        // Episode
        doc.setFont('helvetica', t.isMigraineDay ? 'bold' : 'normal');
        if (t.isMigraineDay) doc.setTextColor(...COLOR_ALERT);
        else doc.setTextColor(...COLOR_MUTED);
        doc.text(t.isMigraineDay ? 'Episode Logged' : 'None', rowColX + 2, currentY + 4);
        rowColX += colWidths[2];

        // Sleep
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLOR_DARK);
        doc.text(t.sleep !== undefined && t.sleep !== null ? `${t.sleep} hrs` : '—', rowColX + 2, currentY + 4);
        rowColX += colWidths[3];

        // Stress
        doc.text(t.stress !== undefined && t.stress !== null ? `${t.stress} / 10` : '—', rowColX + 2, currentY + 4);
        rowColX += colWidths[4];

        // Hydration
        doc.text(t.hydration !== undefined && t.hydration !== null ? `${t.hydration} L` : '—', rowColX + 2, currentY + 4);

        currentY += 5.5;
      });
    }

    // ------------------------------------------------------------------------
    // DOCUMENT FOOTER
    // ------------------------------------------------------------------------
    const footerY = 282;
    doc.setDrawColor(...BORDER_COLOR);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY, pageWidth - margin, footerY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...COLOR_MUTED);
    doc.text(`MigraineGuardian Clinical Pattern & Sensitivity System • Generated ${todayStr}`, margin, footerY + 4);
    doc.text('Confidential • Educational & Clinical Reference Document', pageWidth - margin, footerY + 4, { align: 'right' });

    // ------------------------------------------------------------------------
    // OUTPUT GENUINE BINARY PDF BLOB & TRIGGER DOWNLOAD
    // ------------------------------------------------------------------------
    const pdfBlob = doc.output('blob');
    const downloadUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      URL.revokeObjectURL(downloadUrl);
    }, 1000);

    return {
      success: true,
      filename,
      downloadUrl,
      blob: pdfBlob,
    };
  },

  generateShareLink: async (type = 'weekly') => {
    await new Promise((res) => setTimeout(res, 300));
    return {
      success: true,
      shareUrl: `https://migraineguardian.app/share/rep_${Date.now()}_ev`,
      expiresIn: '7 days',
    };
  },
};
