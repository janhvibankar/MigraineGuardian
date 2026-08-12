from typing import Dict, Any, List, Optional

# Grouping mapping from model features (base & derived) to lifestyle categories
FEATURE_CATEGORY_MAP = {
    "sleep_hours": "Sleep",
    "sleep_deficit": "Sleep",
    "stress_level": "Stress",
    "screen_stress": "Stress",
    "stress_sleep_ratio": "Stress",
    "stress_mood_interaction": "Stress",
    "screen_time": "Screen",
    "screen_sleep_ratio": "Screen",
    "hydration_level": "Hydration",
    "hydration_deficit": "Hydration",
    "hydration_sleep": "Hydration",
    "mood_level": "Mood",
}


class RecommendationEngine:
    """
    Deterministic wellness recommendation engine driven by SHAP risk factors.
    Converts model attribution signals into structured, non-alarmist focus areas.

    Medical Safety Boundary:
    - Recommendations are strictly non-alarmist, general wellness suggestions.
    - Absolutely NO medical diagnoses, NO medication advice, NO emergency guidance.
    - SHAP is treated strictly as model feature attribution, not medical causation.
    """

    def generate_focus_areas(
        self,
        risk_score: float,
        risk_level: str,
        shap_features: List[Dict[str, Any]],
        latest_log: Optional[Dict[str, Any]] = None,
        baseline_stats: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, str]]:
        if not shap_features or not latest_log:
            return []

        # 1. Aggregate positive SHAP risk contribution per lifestyle category
        category_contributions: Dict[str, float] = {}

        for feat in shap_features:
            name = feat.get("feature")
            category = FEATURE_CATEGORY_MAP.get(name)
            if not category:
                continue

            shap_val = float(feat.get("shap_value", 0.0))
            # Focus on positive SHAP values (risk-increasing features)
            if shap_val > 0:
                category_contributions[category] = category_contributions.get(category, 0.0) + shap_val

        # 2. Sort categories by aggregate positive SHAP contribution DESC
        sorted_categories = sorted(
            category_contributions.items(), key=lambda item: item[1], reverse=True
        )

        focus_areas = []
        seen_categories = set()

        for category, _ in sorted_categories:
            if len(focus_areas) >= 3:
                break
            if category in seen_categories:
                continue

            focus_area = self._build_focus_area(category, latest_log, baseline_stats)
            if focus_area:
                focus_areas.append(focus_area)
                seen_categories.add(category)

        # Fallback if no strong positive SHAP features were found
        if not focus_areas and latest_log:
            focus_areas = self._build_fallback_focus_areas(latest_log, baseline_stats)

        return focus_areas[:3]

    def _build_focus_area(
        self,
        category: str,
        latest_log: Dict[str, Any],
        baseline_stats: Optional[Dict[str, Any]],
    ) -> Optional[Dict[str, str]]:
        if category == "Sleep":
            sleep = float(latest_log.get("sleep_hours", 7.0))
            avg_sleep = float(baseline_stats.get("avg_sleep")) if baseline_stats and baseline_stats.get("avg_sleep") is not None else None

            if avg_sleep is not None and sleep < avg_sleep:
                deficit = round(avg_sleep - sleep, 1)
                desc = f"Your recent sleep ({sleep} h) is {deficit} h below your usual baseline average of {avg_sleep} h. Consider prioritizing a consistent sleep schedule tonight."
            else:
                desc = f"Your recent sleep is {sleep} h. Prioritizing rest and regular sleep timing can support your overall daily wellness."

            return {
                "title": "Sleep consistency",
                "description": desc,
            }

        elif category == "Stress":
            stress = float(latest_log.get("daily_stress", 5.0))
            avg_stress = float(baseline_stats.get("avg_stress")) if baseline_stats and baseline_stats.get("avg_stress") is not None else None

            if avg_stress is not None and stress > avg_stress:
                diff = round(stress - avg_stress, 1)
                desc = f"Daily stress is currently elevated ({stress}/10 vs your baseline {avg_stress}). Consider taking a short calming break or engaging in a low-stimulation activity."
            else:
                desc = f"Daily stress rating is currently elevated at {stress}/10. A short mindfulness pause or gentle walk may help ease tension."

            return {
                "title": "Stress reset",
                "description": desc,
            }

        elif category == "Screen":
            screen = float(latest_log.get("screen_time", 6.0))
            desc = f"Continuous screen duration ({screen} h) is elevated. Consider taking regular screen breaks and reducing prolonged continuous use."
            return {
                "title": "Screen-time breaks",
                "description": desc,
            }

        elif category == "Hydration":
            hydration = float(latest_log.get("hydration", 2.0))
            desc = f"Your recorded fluid intake is {hydration} L. Consider maintaining steady hydration throughout the day."
            return {
                "title": "Hydration",
                "description": desc,
            }

        elif category == "Mood":
            mood = float(latest_log.get("mood", 3.0))
            desc = f"Your logged mood rating is {mood}/5. Taking time for light relaxation or restorative activities can support overall emotional balance."
            return {
                "title": "Restorative downtime",
                "description": desc,
            }

        return None

    def _build_fallback_focus_areas(
        self,
        latest_log: Dict[str, Any],
        baseline_stats: Optional[Dict[str, Any]],
    ) -> List[Dict[str, str]]:
        fallbacks = []
        sleep = float(latest_log.get("sleep_hours", 7.0))
        if sleep < 7.0:
            fallbacks.append({
                "title": "Sleep consistency",
                "description": f"Sleep duration of {sleep} h recorded. Maintaining steady rest supports daily balance.",
            })
        stress = float(latest_log.get("daily_stress", 4.0))
        if stress >= 5.0:
            fallbacks.append({
                "title": "Stress reset",
                "description": f"Daily stress rating is {stress}/10. Consider taking regular sensory pauses.",
            })
        return fallbacks


recommendation_engine = RecommendationEngine()
