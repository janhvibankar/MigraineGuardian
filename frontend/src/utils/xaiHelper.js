/**
 * Helper utility to dynamically generate user-friendly Explainable AI (XAI) descriptions
 * from mathematical SHAP feature attributions while adhering strictly to scientific
 * non-causal language guidelines ("associated with", "contributed to", "linked with").
 * Supports full internationalization across English, Hindi, and Marathi.
 */

// Human-friendly titles, categories, and icons for technical feature keys
export const FEATURE_FRIENDLY_MAP = {
  sleep_hours: {
    title: 'Sleep Duration',
    iconName: 'Moon',
    category: 'sleep',
    highRiskDesc: 'Shorter or irregular sleep was associated with higher predicted risk.',
    lowRiskDesc: 'Sufficient sleep rest was associated with lower predicted risk.',
    focusTip: 'Try to maintain a consistent sleep schedule and prioritize restful sleep recovery.',
  },
  mood_level: {
    title: 'Mood & Emotional Strain',
    iconName: 'Smile',
    category: 'mood',
    highRiskDesc: 'Elevated emotional tension or low mood was linked with higher predicted risk.',
    lowRiskDesc: 'Calm and positive mood was associated with lower predicted risk.',
    focusTip: 'Engage in gentle movement or a calming activity to ease emotional strain.',
  },
  stress_level: {
    title: 'Daily Stress Load',
    iconName: 'Brain',
    category: 'stress',
    highRiskDesc: 'Elevated daily stress strain contributed to higher predicted risk.',
    lowRiskDesc: 'Manageable stress levels were associated with lower predicted risk.',
    focusTip: 'Consider short relaxation breaks or 5-minute deep breathing during demanding hours.',
  },
  hydration_level: {
    title: 'Fluid Intake & Hydration',
    iconName: 'Droplets',
    category: 'hydration',
    highRiskDesc: 'Lower fluid intake was associated with higher predicted risk.',
    lowRiskDesc: 'Steady hydration intake was associated with lower predicted risk.',
    focusTip: 'Continue maintaining steady fluid intake throughout the day (target: ~2.2 L).',
  },
  screen_time: {
    title: 'Screen & Optical Exposure',
    iconName: 'SunMedium',
    category: 'screen',
    highRiskDesc: 'Extended screen exposure was linked with higher predicted risk.',
    lowRiskDesc: 'Moderate screen exposure was associated with lower predicted risk.',
    focusTip: 'Take regular screen pauses and reduce blue light exposure before sleep.',
  },
  sleep_deviation: {
    title: 'Sleep Deviation from 8h',
    iconName: 'Moon',
    category: 'sleep',
    highRiskDesc: 'Deviation from your 8-hour sleep baseline contributed to higher predicted risk.',
    lowRiskDesc: 'Consistent sleep close to the 8-hour baseline helped lower predicted risk.',
    focusTip: 'Keep your wake-up and bedtime consistent every day.',
  },
  low_sleep: {
    title: 'Low Sleep Rest (<6.5h)',
    protectiveTitle: 'Sufficient Sleep Rest (>=6.5h)',
    iconName: 'Moon',
    category: 'sleep',
    highRiskDesc: 'Short sleep rest under 6.5 hours contributed to higher predicted risk.',
    lowDesc: 'Getting more than 6.5 hours of sleep helped lower predicted risk.',
    focusTip: 'Plan an early bedtime to ensure at least 7 hours of rest.',
  },
  high_screen_time: {
    title: 'High Screen Exposure (>=8h)',
    protectiveTitle: 'Controlled Screen Exposure (<8h)',
    iconName: 'SunMedium',
    category: 'screen',
    highRiskDesc: 'Extended screen exposure of 8+ hours contributed to higher predicted risk.',
    lowRiskDesc: 'Keeping screen exposure under 8 hours helped lower predicted risk.',
    focusTip: 'Dim screen brightness and take 20-second optical breaks every 20 minutes.',
  },
  low_hydration: {
    title: 'Low Fluid Intake (<=2L)',
    protectiveTitle: 'Adequate Fluid Intake (>2L)',
    iconName: 'Droplets',
    category: 'hydration',
    highRiskDesc: 'Fluid intake of 2L or less contributed to higher predicted risk.',
    lowRiskDesc: 'Maintaining fluid intake above the 2L threshold helped lower predicted risk.',
    focusTip: 'Keep a water bottle nearby and drink water steadily through the day.',
  },
  stress_mood_interaction: {
    title: 'Stress & Mood Balance',
    iconName: 'Brain',
    category: 'stress',
    highRiskDesc: 'Daily stress combined with mood tension contributed to higher predicted risk.',
    lowRiskDesc: 'Balanced mood during stressful periods helped lower predicted risk.',
    focusTip: 'Practice mindfulness or gentle stretching when feeling overwhelmed.',
  },
  sleep_screen_interaction: {
    title: 'Sleep & Screen Interaction',
    iconName: 'SunMedium',
    category: 'screen',
    highRiskDesc: 'Screen exposure combined with reduced sleep contributed to higher predicted risk.',
    lowRiskDesc: 'Good rest balance relative to screen time helped lower predicted risk.',
    focusTip: 'Put screens away at least 30 minutes before bedtime.',
  },
  stress_sleep_ratio: {
    title: 'Stress + Sleep Pattern',
    iconName: 'Activity',
    category: 'stress',
    highRiskDesc: 'High stress relative to sleep rest contributed to higher predicted risk.',
    lowRiskDesc: 'Balanced stress relative to sleep rest was associated with lower predicted risk.',
    focusTip: 'Focus on evening wind-down routines to separate daily stress from sleep rest.',
  },
  screen_stress: {
    title: 'Screen Exposure + Stress Combined',
    iconName: 'Zap',
    category: 'screen',
    highRiskDesc: 'High screen glare combined with daily stress contributed to higher predicted risk.',
    lowRiskDesc: 'Controlled screen time during stress strain was linked with lower predicted risk.',
    focusTip: 'Take short screen pauses during demanding hours.',
  },
  hydration_sleep: {
    title: 'Hydration + Sleep Synergy',
    iconName: 'Droplets',
    category: 'hydration',
    highRiskDesc: 'Reduced fluid intake combined with low sleep was associated with higher predicted risk.',
    lowRiskDesc: 'Healthy hydration and steady sleep rest helped lower predicted risk.',
    focusTip: 'Drink a glass of water upon waking and maintain hydration throughout active hours.',
  },
  sleep_deficit: {
    title: 'Sleep Rest Deficit',
    iconName: 'Moon',
    category: 'sleep',
    highRiskDesc: 'Sleeping below your optimal rest threshold was linked with higher predicted risk.',
    lowRiskDesc: 'Minimal sleep deficit was associated with lower predicted risk.',
    focusTip: 'Aim for 7 to 8 hours of uninterrupted rest to clear your sleep deficit.',
  },
  hydration_deficit: {
    title: 'Fluid Intake Deficit',
    iconName: 'Droplets',
    category: 'hydration',
    highRiskDesc: 'Fluid intake below the daily target was linked with higher predicted risk.',
    lowRiskDesc: 'Meeting daily fluid targets was associated with lower predicted risk.',
    focusTip: 'Keep water easily accessible throughout your workday.',
  },
  screen_sleep_ratio: {
    title: 'Screen Glare vs Sleep Ratio',
    iconName: 'SunMedium',
    category: 'screen',
    highRiskDesc: 'High screen exposure relative to sleep rest contributed to higher predicted risk.',
    lowRiskDesc: 'Moderate screen time relative to rest was associated with lower predicted risk.',
    focusTip: 'Dim screen brightness and take regular optical breaks.',
  },
  temperature: {
    title: 'Ambient Temperature',
    iconName: 'Thermometer',
    category: 'weather',
    highRiskDesc: "Today's ambient temperature patterns were associated with higher predicted risk.",
    lowRiskDesc: 'Stable ambient temperatures were associated with lower predicted risk.',
    focusTip: 'Be mindful of extreme temperature shifts when planning your day.',
  },
  humidity: {
    title: 'Relative Humidity',
    iconName: 'Cloud',
    category: 'weather',
    highRiskDesc: 'Current humidity levels were associated with higher predicted risk.',
    lowRiskDesc: 'Comfortable humidity levels were associated with lower predicted risk.',
    focusTip: 'Stay in well-ventilated spaces and keep well-hydrated.',
  },
  pressure: {
    title: 'Barometric Pressure',
    iconName: 'Cloud',
    category: 'weather',
    highRiskDesc: 'Current atmospheric pressure was associated with higher predicted risk.',
    lowRiskDesc: 'Stable barometric pressure was associated with lower predicted risk.',
    focusTip: 'Stay calm and restful if you are sensitive to barometric shifts.',
  },
  precipitation: {
    title: 'Precipitation Rate',
    iconName: 'Cloud',
    category: 'weather',
    highRiskDesc: 'Active precipitation conditions contributed to higher predicted risk.',
    lowRiskDesc: 'Clear weather conditions were associated with lower predicted risk.',
    focusTip: 'Keep indoor lighting comfortable during heavy overcast or rainy weather.',
  },
  wind_speed: {
    title: 'Wind Speed',
    iconName: 'Wind',
    category: 'weather',
    highRiskDesc: 'Elevated wind speeds were associated with higher predicted risk.',
    lowRiskDesc: 'Calm wind conditions were associated with lower predicted risk.',
    focusTip: 'Consider wearing sunglasses when outdoors on windy days.',
  },
  pressure_change_24h: {
    title: '24-Hour Pressure Change',
    iconName: 'Cloud',
    category: 'weather',
    highRiskDesc: 'A rapid 24-hour barometric shift contributed to higher predicted risk.',
    lowRiskDesc: 'Stable 24-hour pressure patterns were associated with lower predicted risk.',
    focusTip: 'Maintain a steady lifestyle routine during rapid weather shifts.',
  },
  barometric_drop_flag: {
    title: 'Barometric & Weather Fronts',
    iconName: 'Cloud',
    category: 'weather',
    highRiskDesc: 'A recent drop in barometric pressure contributed to higher predicted risk.',
    lowRiskDesc: 'Absence of pressure drops was associated with lower predicted risk.',
    focusTip: 'Stay well-hydrated and well-rested during significant barometric drops.',
  },
  temp_change_24h: {
    title: '24-Hour Temperature Change',
    iconName: 'Thermometer',
    category: 'weather',
    highRiskDesc: 'Recent temperature fluctuations contributed to higher predicted risk.',
    lowRiskDesc: 'Stable temperature trends were associated with lower predicted risk.',
    focusTip: 'Dress comfortably in layers to manage sudden temperature changes.',
  },
  pressure_stress_interaction: {
    title: 'Pressure Drop & Stress Strain',
    iconName: 'Zap',
    category: 'interaction',
    highRiskDesc: 'The combination of stress and pressure changes contributed to higher predicted risk.',
    lowRiskDesc: 'Manageable stress during pressure shifts helped lower predicted risk.',
    focusTip: 'Prioritize relaxation when experiencing stress during weather shifts.',
  },
  sleep_weather_vulnerability: {
    title: 'Sleep Deficit & Pressure Drop',
    iconName: 'Zap',
    category: 'interaction',
    highRiskDesc: 'Reduced sleep combined with weather shifts contributed to higher predicted risk.',
    lowRiskDesc: 'Sufficient sleep rest provided a protective buffer against weather changes.',
    focusTip: 'Prioritize consistent sleep to build resilience against weather shifts.',
  },
};

/**
 * Dynamically processes prediction.xai.features and generates:
 * 1. User-friendly summary text ("Why does my risk look like this?")
 * 2. Top human-readable factors increasing risk (max 3)
 * 3. Top human-readable factors reducing risk (max 2)
 * 4. Actionable focus points matching actual present SHAP features
 *
 * All text is localized dynamically using the active translation function `t`.
 */
export function formatUserXaiExplanation(xaiFeatures = [], riskScore = 50, riskLevel = 'Moderate', t = null) {
  const roundedScore = Math.round(riskScore);
  const normalizedLevel = (riskLevel || 'Moderate').toLowerCase();

  // Fallback translation helper if t is not provided
  const translate = (key, fallback, params = {}) => {
    if (typeof t === 'function') {
      const res = t(key, params);
      if (res && res !== key) return res;
    }
    if (typeof fallback === 'string') {
      let str = fallback;
      for (const [k, v] of Object.entries(params)) {
        str = str.replace(new RegExp(`{${k}}`, 'g'), v);
      }
      return str;
    }
    return key;
  };

  if (!Array.isArray(xaiFeatures) || xaiFeatures.length === 0) {
    let overviewText = '';
    if (normalizedLevel === 'high') {
      overviewText = translate('xai.overviewHigh', `Based on your latest check-in, your current risk is elevated (${roundedScore}%).`, { score: roundedScore });
    } else if (normalizedLevel === 'moderate') {
      overviewText = translate('xai.overviewModerate', `Based on your latest check-in, your current risk is moderate (${roundedScore}%).`, { score: roundedScore });
    } else {
      overviewText = translate('xai.overviewLow', `Based on your latest check-in, your current risk is low (${roundedScore}%).`, { score: roundedScore });
    }

    return {
      hasFeatures: false,
      overviewText,
      whySummary: translate('xai.noAttributions', 'No detailed feature attribution data is available for this forecast yet.'),
      topIncreasing: [],
      topDecreasing: [],
      focusSuggestions: [],
    };
  }

  // Sort by absolute importance DESC
  const sorted = [...xaiFeatures].sort((a, b) => {
    const impA = a.importance !== undefined ? a.importance : Math.abs(a.shap_value || 0);
    const impB = b.importance !== undefined ? b.importance : Math.abs(b.shap_value || 0);
    return impB - impA;
  });

  // Strict model direction: shap_value > 0 pushes risk higher, shap_value < 0 lowers risk
  const increasing = sorted.filter((f) => f.direction === 'increases_risk' || f.shap_value > 0);
  const decreasing = sorted.filter((f) => f.direction === 'decreases_risk' || f.shap_value < 0);

  // Top 3 increasing & top 2 decreasing
  const topIncreasingRaw = increasing.slice(0, 3);
  const topDecreasingRaw = decreasing.slice(0, 2);

  const mapFeatureToUserObj = (item, isHighRisk) => {
    const key = item.feature;
    const meta = FEATURE_FRIENDLY_MAP[key] || {
      title: item.label || key,
      iconName: 'Activity',
      category: 'general',
      highRiskDesc: `${item.label || key} contributed to a higher predicted risk.`,
      lowRiskDesc: `${item.label || key} was associated with a lower predicted risk.`,
      focusTip: 'Maintain a balanced routine for optimal wellness.',
    };

    // Determine localized title: use protective title when shap < 0 if available
    let localizedTitle;
    if (!isHighRisk) {
      localizedTitle = translate(
        `xai.features.${key}.protectiveName`,
        translate(`xai.features.${key}.name`, meta.protectiveTitle || meta.title)
      );
    } else {
      localizedTitle = translate(`xai.features.${key}.name`, meta.title);
    }

    const localizedDesc = isHighRisk
      ? translate(`xai.features.${key}.highDesc`, meta.highRiskDesc)
      : translate(`xai.features.${key}.lowDesc`, meta.lowRiskDesc);

    const localizedFocusTip = translate(`xai.features.${key}.focusTip`, meta.focusTip);

    return {
      key,
      title: localizedTitle,
      description: localizedDesc,
      category: meta.category,
      focusTip: localizedFocusTip,
      importance: item.importance !== undefined ? item.importance : Math.abs(item.shap_value || 0),
      shapValue: item.shap_value,
      direction: isHighRisk ? 'increases_risk' : 'decreases_risk',
    };
  };

  const topIncreasing = topIncreasingRaw.map((item) => mapFeatureToUserObj(item, true));
  const topDecreasing = topDecreasingRaw.map((item) => mapFeatureToUserObj(item, false));

  // Dynamic "Why does my risk look like this?" summary sentence
  let whySummary = '';
  if (topIncreasing.length > 0) {
    const primaryTitle = topIncreasing[0].title;
    if (topIncreasing.length > 1) {
      const secondaryTitle = topIncreasing[1].title;
      whySummary = translate('xai.whySummaryPrimary', `Your ${primaryTitle} was the strongest factor associated with today's predicted risk. ${secondaryTitle} also contributed to the prediction.`, {
        feature: primaryTitle,
        secondary: secondaryTitle,
      });
    } else {
      whySummary = translate('xai.whySummarySingle', `Your ${primaryTitle} was the primary contributor associated with today's predicted risk.`, {
        feature: primaryTitle,
      });
    }
  } else if (topDecreasing.length > 0) {
    whySummary = translate('xai.whySummaryProtective', `Your physiological baseline metrics were generally steady, with ${topDecreasing[0].title} helping lower your predicted risk.`, {
      feature: topDecreasing[0].title,
    });
  } else {
    whySummary = translate('xai.whySummaryBalanced', 'Your logged physiological parameters indicate a balanced baseline state.');
  }

  // Dynamic Overview Sentence based on Risk Level
  let overviewText = '';
  if (normalizedLevel === 'high') {
    overviewText = translate('xai.overviewHigh', `Based on your latest check-in, your current risk is elevated (${roundedScore}%). The model identified key lifestyle patterns associated with an increased predicted risk threshold.`, { score: roundedScore });
  } else if (normalizedLevel === 'moderate') {
    overviewText = translate('xai.overviewModerate', `Based on your latest check-in, your current risk is moderate (${roundedScore}%). The model found that some of your recent lifestyle patterns were associated with a higher predicted risk.`, { score: roundedScore });
  } else {
    overviewText = translate('xai.overviewLow', `Based on your latest check-in, your current risk is low (${roundedScore}%). Your recorded signals provide a steady physiological buffer against predicted sensitivity.`, { score: roundedScore });
  }

  // Generate unique actionable Focus Suggestions based ONLY on top features present
  const suggestionsSet = new Set();
  const focusSuggestions = [];

  [...topIncreasing, ...topDecreasing].forEach((feat) => {
    if (feat.focusTip && !suggestionsSet.has(feat.focusTip)) {
      suggestionsSet.add(feat.focusTip);
      focusSuggestions.push({
        title: feat.title,
        tip: feat.focusTip,
        category: feat.category,
      });
    }
  });

  return {
    hasFeatures: true,
    overviewText,
    whySummary,
    topIncreasing,
    topDecreasing,
    focusSuggestions: focusSuggestions.slice(0, 3), // Max 3 suggestions
  };
}
