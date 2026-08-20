/**
 * Helper utility to dynamically generate user-friendly Explainable AI (XAI) descriptions
 * from mathematical SHAP feature attributions while adhering strictly to scientific
 * non-causal language guidelines ("associated with", "contributed to", "linked with").
 */

// Human-friendly titles and icons for technical feature keys
const FEATURE_FRIENDLY_MAP = {
  sleep_hours: {
    title: 'Sleep Duration',
    iconName: 'Moon',
    category: 'sleep',
    highRiskDesc: 'Shorter or irregular sleep rest was associated with a higher predicted risk.',
    lowRiskDesc: 'Sufficient sleep rest was associated with a lower predicted risk.',
    focusTip: 'Try to maintain a consistent sleep schedule and prioritize restful sleep recovery.',
  },
  mood_level: {
    title: 'Mood & Emotional Strain',
    iconName: 'Smile',
    category: 'mood',
    highRiskDesc: 'Elevated emotional tension or low mood was linked with a higher predicted risk.',
    lowRiskDesc: 'Calm or positive mood baseline was associated with a lower predicted risk.',
    focusTip: 'Engage in gentle movement or a calming activity to ease emotional strain.',
  },
  stress_level: {
    title: 'Daily Stress Load',
    iconName: 'Brain',
    category: 'stress',
    highRiskDesc: 'Elevated daily stress strain contributed to a higher predicted risk.',
    lowRiskDesc: 'Manageable stress levels were associated with a lower predicted risk.',
    focusTip: 'Consider short relaxation breaks or 5-minute deep breathing during demanding hours.',
  },
  hydration_level: {
    title: 'Fluid Intake & Hydration',
    iconName: 'Droplets',
    category: 'hydration',
    highRiskDesc: 'Lower fluid intake was associated with a higher predicted risk.',
    lowRiskDesc: 'Steady hydration intake was associated with a lower predicted risk.',
    focusTip: 'Continue maintaining steady fluid intake throughout the day (target: ~2.2 L).',
  },
  screen_time: {
    title: 'Screen Exposure & Glare',
    iconName: 'SunMedium',
    category: 'screen',
    highRiskDesc: 'Extended screen exposure was linked with a higher predicted risk.',
    lowRiskDesc: 'Moderate screen exposure was associated with a lower predicted risk.',
    focusTip: 'Consider taking regular screen breaks and reducing blue light exposure before sleep.',
  },
  stress_sleep_ratio: {
    title: 'Stress + Sleep Pattern',
    iconName: 'Activity',
    category: 'stress',
    highRiskDesc: 'The combination of high stress and reduced sleep rest was strongly linked with higher predicted risk.',
    lowRiskDesc: 'Balanced stress relative to sleep rest was associated with a lower predicted risk.',
    focusTip: 'Focus on evening wind-down routines to separate daily stress from sleep rest.',
  },
  screen_stress: {
    title: 'Screen Exposure + Stress Combined',
    iconName: 'Zap',
    category: 'screen',
    highRiskDesc: 'High screen glare combined with daily stress contributed to higher predicted risk.',
    lowRiskDesc: 'Controlled screen time during stress strain was linked with a lower predicted risk.',
    focusTip: 'Take short screen pauses during high-stress working hours.',
  },
  hydration_sleep: {
    title: 'Hydration + Sleep Synergy',
    iconName: 'Droplets',
    category: 'hydration',
    highRiskDesc: 'Reduced fluid intake combined with sleep rest was associated with higher predicted risk.',
    lowRiskDesc: 'Your hydration and sleep-related pattern was associated with a lower predicted risk.',
    focusTip: 'Drink a glass of water upon waking and stay hydrated throughout your active hours.',
  },
  sleep_deficit: {
    title: 'Sleep Rest Deficit',
    iconName: 'Moon',
    category: 'sleep',
    highRiskDesc: 'Sleeping below your optimal rest threshold was linked with higher predicted risk.',
    lowRiskDesc: 'Minimal sleep deficit was associated with a lower predicted risk.',
    focusTip: 'Aim for 7 to 8 hours of uninterrupted sleep to clear your sleep deficit.',
  },
  hydration_deficit: {
    title: 'Fluid Intake Deficit',
    iconName: 'Droplets',
    category: 'hydration',
    highRiskDesc: 'Fluid intake below recommended daily target was linked with higher predicted risk.',
    lowRiskDesc: 'Meeting fluid intake targets was associated with lower predicted risk.',
    focusTip: 'Keep a water bottle nearby to easily meet your daily fluid intake goals.',
  },
  stress_mood_interaction: {
    title: 'Stress & Mood Balance',
    iconName: 'Brain',
    category: 'stress',
    highRiskDesc: 'Daily stress combined with mood tension contributed to higher predicted risk.',
    lowRiskDesc: 'Balanced mood during stressful periods was linked with a lower predicted risk.',
    focusTip: 'Practice mindfulness or gentle stretching when feeling overwhelmed.',
  },
  screen_sleep_ratio: {
    title: 'Screen Glare vs Sleep Ratio',
    iconName: 'SunMedium',
    category: 'screen',
    highRiskDesc: 'High screen exposure relative to sleep rest hours contributed to higher predicted risk.',
    lowRiskDesc: 'Moderate screen time relative to rest was associated with lower predicted risk.',
    focusTip: 'Dim screen brightness and take 20-second optical breaks every 20 minutes.',
  },
  temperature: {
    title: 'Ambient Temperature',
    iconName: 'Thermometer',
    category: 'weather',
    highRiskDesc: 'Current temperature patterns were associated with a higher predicted risk.',
    lowRiskDesc: 'Current temperature patterns were associated with a lower predicted risk.',
    focusTip: 'Be mindful of extreme temperature conditions when planning your day.',
  },
  humidity: {
    title: 'Relative Humidity',
    iconName: 'Cloud',
    category: 'weather',
    highRiskDesc: 'Current humidity levels were associated with a higher predicted risk.',
    lowRiskDesc: 'Current humidity levels were associated with a lower predicted risk.',
    focusTip: 'Stay hydrated and use climate control during uncomfortable humidity.',
  },
  pressure: {
    title: 'Barometric Pressure',
    iconName: 'Cloud',
    category: 'weather',
    highRiskDesc: 'Current barometric pressure was associated with a higher predicted risk.',
    lowRiskDesc: 'Current barometric pressure was associated with a lower predicted risk.',
    focusTip: 'Monitor pressure trends if you are sensitive to barometric shifts.',
  },
  precipitation: {
    title: 'Precipitation Rate',
    iconName: 'Cloud',
    category: 'weather',
    highRiskDesc: 'Current precipitation conditions contributed to a higher predicted risk.',
    lowRiskDesc: 'Current precipitation conditions were associated with a lower predicted risk.',
    focusTip: 'Be mindful of changing weather conditions during heavy precipitation.',
  },
  wind_speed: {
    title: 'Wind Speed',
    iconName: 'Wind',
    category: 'weather',
    highRiskDesc: 'Elevated wind speeds were associated with a higher predicted risk.',
    lowRiskDesc: 'Current wind conditions were associated with a lower predicted risk.',
    focusTip: 'Consider protective measures like sunglasses when outdoors on windy days.',
  },
  pressure_change_24h: {
    title: '24-Hour Pressure Change',
    iconName: 'Cloud',
    category: 'weather',
    highRiskDesc: "Today's pressure pattern contributed to the predicted risk.",
    lowRiskDesc: 'Stable pressure patterns were associated with a lower predicted risk.',
    focusTip: 'Maintain a steady lifestyle routine during rapid pressure shifts.',
  },
  barometric_drop_flag: {
    title: 'Barometric Pressure Drop',
    iconName: 'Cloud',
    category: 'weather',
    highRiskDesc: 'A recent drop in barometric pressure contributed to a higher predicted risk.',
    lowRiskDesc: 'Stable barometric conditions were associated with a lower predicted risk.',
    focusTip: 'Stay well-hydrated and rested during significant barometric drops.',
  },
  temp_change_24h: {
    title: '24-Hour Temperature Change',
    iconName: 'Thermometer',
    category: 'weather',
    highRiskDesc: 'Recent temperature fluctuations contributed to the predicted risk.',
    lowRiskDesc: 'Stable temperature trends were associated with a lower predicted risk.',
    focusTip: 'Layer clothing appropriately to manage sudden temperature shifts.',
  },
  pressure_stress_interaction: {
    title: 'Pressure-Stress Interaction',
    iconName: 'Zap',
    category: 'interaction',
    highRiskDesc: 'The combination of stress and pressure changes contributed to the predicted risk.',
    lowRiskDesc: 'Balanced stress during pressure shifts was associated with a lower predicted risk.',
    focusTip: 'Prioritize relaxation when experiencing high stress during weather changes.',
  },
  sleep_weather_vulnerability: {
    title: 'Sleep-Weather Vulnerability',
    iconName: 'Zap',
    category: 'interaction',
    highRiskDesc: 'Reduced sleep combined with weather shifts contributed to the predicted risk.',
    lowRiskDesc: 'Sufficient sleep rest provided a buffer against weather changes.',
    focusTip: 'Prioritize consistent sleep to build resilience against weather shifts.',
  },
};

/**
 * Dynamically processes prediction.xai.features and generates:
 * 1. User-friendly summary text ("Why does my risk look like this?")
 * 2. Top human-readable factors increasing risk (max 3)
 * 3. Top human-readable factors reducing risk (max 2)
 * 4. Actionable focus points matching actual present SHAP features
 */
export function formatUserXaiExplanation(xaiFeatures = [], riskScore = 50, riskLevel = 'Moderate') {
  if (!Array.isArray(xaiFeatures) || xaiFeatures.length === 0) {
    return {
      hasFeatures: false,
      overviewText: `Based on your check-in, your estimated risk is ${riskLevel.toLowerCase()} (${Math.round(riskScore)}%).`,
      whySummary: 'No detailed feature attribution data is available for this forecast yet.',
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

    return {
      key,
      title: meta.title,
      description: isHighRisk ? meta.highRiskDesc : meta.lowRiskDesc,
      category: meta.category,
      focusTip: meta.focusTip,
      importance: item.importance !== undefined ? item.importance : Math.abs(item.shap_value || 0),
      shapValue: item.shap_value,
      direction: item.direction,
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
      whySummary = `Your ${primaryTitle.toLowerCase()} was the strongest factor associated with today's predicted risk. ${secondaryTitle} also contributed to the prediction.`;
    } else {
      whySummary = `Your ${primaryTitle.toLowerCase()} was the primary contributor associated with today's predicted risk.`;
    }
  } else if (topDecreasing.length > 0) {
    whySummary = `Your physiological baseline metrics were generally steady, with ${topDecreasing[0].title.toLowerCase()} helping lower your predicted risk.`;
  } else {
    whySummary = 'Your logged physiological parameters indicate a balanced baseline state.';
  }

  // Dynamic Overview Sentence based on Risk Level
  let overviewText = '';
  const roundedScore = Math.round(riskScore);

  if (riskLevel === 'High') {
    overviewText = `Based on your latest check-in, your current risk is elevated (${roundedScore}%). The model identified key lifestyle patterns associated with an increased predicted risk threshold.`;
  } else if (riskLevel === 'Moderate') {
    overviewText = `Based on your latest check-in, your current risk is moderate (${roundedScore}%). The model found that some of your recent lifestyle patterns were associated with a higher predicted risk.`;
  } else {
    overviewText = `Based on your latest check-in, your current risk is low (${roundedScore}%). Your recorded signals provide a steady physiological buffer against predicted sensitivity.`;
  }

  // Generate unique actionable Focus Suggestions based ONLY on top features present
  const suggestionsSet = new Set();
  const focusSuggestions = [];

  // Gather focus tips from top increasing and decreasing features
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
