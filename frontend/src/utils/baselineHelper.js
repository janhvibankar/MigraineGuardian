/**
 * Helper utility to localize backend-generated baseline factor comparisons and focus areas.
 * Ensures zero hardcoded English text leaks from the model explanation or threshold engines.
 */

export function localizeElevatedFactor(factor, t) {
  if (!factor) return factor;

  // Localize Factor Name
  let factorName = factor.factor;
  if (factor.factor === 'Sleep') {
    factorName = t('baseline.factorSleep', 'Sleep Duration');
  } else if (factor.factor === 'Stress') {
    factorName = t('baseline.factorStress', 'Daily Stress Load');
  } else if (factor.factor === 'Screen Time') {
    factorName = t('baseline.factorScreen', 'Screen Time');
  } else if (factor.factor === 'Hydration') {
    factorName = t('baseline.factorHydration', 'Fluid Intake');
  }

  // Localize Comparison badge
  let comparison = factor.comparison;
  if (typeof factor.comparison === 'string') {
    const hoursBelowMatch = factor.comparison.match(/(\d+(?:\.\d+)?)\s*h\s*below/i);
    const hoursAboveMatch = factor.comparison.match(/(\d+(?:\.\d+)?)\s*h\s*above/i);
    const ptsAboveMatch = factor.comparison.match(/(\d+(?:\.\d+)?)\s*points\s*above/i);
    const ptsBelowMatch = factor.comparison.match(/(\d+(?:\.\d+)?)\s*points\s*below/i);

    if (hoursBelowMatch) {
      comparison = t('baseline.hoursBelow', { hours: hoursBelowMatch[1] });
    } else if (hoursAboveMatch) {
      comparison = t('baseline.hoursAbove', { hours: hoursAboveMatch[1] });
    } else if (ptsAboveMatch) {
      comparison = t('baseline.pointsAbove', { points: ptsAboveMatch[1] });
    } else if (ptsBelowMatch) {
      comparison = t('baseline.pointsBelow', { points: ptsBelowMatch[1] });
    } else if (factor.comparison.toLowerCase().includes('matches')) {
      comparison = t('baseline.matchesBaseline', 'Matches baseline');
    } else if (factor.comparison.toLowerCase().includes('no baseline')) {
      comparison = t('baseline.noBaseline', 'No baseline data');
    } else if (factor.comparison.toLowerCase().includes('daily log') || factor.comparison.toLowerCase().includes('metric')) {
      comparison = t('baseline.dailyMetric', 'Daily check-in value');
    }
  }

  // Localize Description
  let description = factor.description;
  const isAlertOrWarning = factor.statusType === 'alert' || factor.statusType === 'warning';

  if (factor.factor === 'Sleep') {
    description = isAlertOrWarning
      ? t('baseline.descSleepDeficit', { value: factor.value })
      : t('baseline.descSleepStable', { value: factor.value });
  } else if (factor.factor === 'Stress') {
    description = isAlertOrWarning
      ? t('baseline.descStressHigh', { value: factor.value })
      : t('baseline.descStressStable', { value: factor.value });
  } else if (factor.factor === 'Screen Time') {
    description = isAlertOrWarning
      ? t('baseline.descScreenHigh', { value: factor.value })
      : t('baseline.descScreenStable', { value: factor.value });
  } else if (factor.factor === 'Hydration') {
    description = isAlertOrWarning
      ? t('baseline.descHydrationLow', { value: factor.value })
      : t('baseline.descHydrationStable', { value: factor.value });
  }

  return {
    ...factor,
    factor: factorName,
    comparison,
    description,
  };
}

export function localizeFocusArea(focus, t) {
  if (!focus) return { title: '', description: '' };
  const rawTitle = (focus.title || '').toLowerCase();

  if (rawTitle.includes('sleep')) {
    return {
      title: t('focus.sleepTitle', 'Sleep consistency'),
      description: t('focus.sleepDesc', 'Prioritizing regular rest and steady sleep timing supports daily balance.'),
    };
  }
  if (rawTitle.includes('stress')) {
    return {
      title: t('focus.stressTitle', 'Stress reset'),
      description: t('focus.stressDesc', 'Taking short calming breaks or practicing deep breathing helps ease tension.'),
    };
  }
  if (rawTitle.includes('screen')) {
    return {
      title: t('focus.screenTitle', 'Screen-time breaks'),
      description: t('focus.screenDesc', 'Taking regular breaks from bright displays reduces optical strain.'),
    };
  }
  if (rawTitle.includes('hydration')) {
    return {
      title: t('focus.hydrationTitle', 'Hydration'),
      description: t('focus.hydrationDesc', 'Maintaining steady fluid intake throughout the day helps prevent dehydration triggers.'),
    };
  }
  if (rawTitle.includes('mood') || rawTitle.includes('restorative')) {
    return {
      title: t('focus.moodTitle', 'Restorative downtime'),
      description: t('focus.moodDesc', 'Taking quiet time for relaxing activities supports emotional equilibrium.'),
    };
  }

  return {
    title: focus.title,
    description: focus.description,
  };
}
