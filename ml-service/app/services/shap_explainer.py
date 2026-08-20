import numpy as np
import pandas as pd
import shap
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.services.risk_calculator import model_manager

# Human-readable label dictionary for all Model A and Model B features
FEATURE_HUMAN_NAMES = {
    # Lifestyle Raw
    "sleep_hours": "Sleep Duration",
    "mood_level": "Mood",
    "stress_level": "Daily Stress",
    "hydration_level": "Hydration",
    "screen_time": "Screen Time",
    # Lifestyle Engineered
    "stress_sleep_ratio": "Stress / Sleep Pattern",
    "screen_stress": "Screen Exposure + Stress",
    "hydration_sleep": "Hydration + Sleep Pattern",
    "sleep_deficit": "Sleep Rest Deficit",
    "hydration_deficit": "Fluid Intake Deficit",
    "stress_mood_interaction": "Stress & Mood Strain",
    "screen_sleep_ratio": "Screen Exposure vs Sleep",
    # Weather Raw
    "temperature": "Ambient Temperature",
    "humidity": "Relative Humidity",
    "pressure": "Barometric Pressure",
    "precipitation": "Precipitation Rate",
    "wind_speed": "Wind Speed",
    # Weather Engineered
    "pressure_change_24h": "24-Hour Pressure Change",
    "barometric_drop_flag": "Barometric Pressure Drop",
    "temp_change_24h": "24-Hour Temperature Change",
    # Interactions
    "pressure_stress_interaction": "Pressure Drop & Stress Strain",
    "sleep_weather_vulnerability": "Sleep Deficit & Pressure Drop",
}

# Category mapping for Model B feature classification
FEATURE_CATEGORIES = {
    "sleep_hours": "LIFESTYLE",
    "mood_level": "LIFESTYLE",
    "stress_level": "LIFESTYLE",
    "hydration_level": "LIFESTYLE",
    "screen_time": "LIFESTYLE",
    "stress_sleep_ratio": "LIFESTYLE",
    "screen_stress": "LIFESTYLE",
    "hydration_sleep": "LIFESTYLE",
    "sleep_deficit": "LIFESTYLE",
    "hydration_deficit": "LIFESTYLE",
    "stress_mood_interaction": "LIFESTYLE",
    "screen_sleep_ratio": "LIFESTYLE",
    "temperature": "WEATHER",
    "humidity": "WEATHER",
    "pressure": "WEATHER",
    "precipitation": "WEATHER",
    "wind_speed": "WEATHER",
    "pressure_change_24h": "WEATHER",
    "barometric_drop_flag": "WEATHER",
    "temp_change_24h": "WEATHER",
    "pressure_stress_interaction": "INTERACTION",
    "sleep_weather_vulnerability": "INTERACTION",
}


class ShapExplainerService:
    """
    Explainable AI (XAI) service using SHAP for LogisticRegression pipelines (Model A & Model B).

    SHAP Method Justification:
    Both Model A (12 features) and Model B (22 features) classifiers are LogisticRegression estimators
    operating on StandardScaled features z = (x - mu) / sigma.
    shap.LinearExplainer computes exact, analytical additive log-odds feature attributions phi_j = beta_j * z_j
    relative to the zero background mean E[z_j] = 0.
    This guarantees exact, deterministic feature contribution ranking without sampling noise.
    """

    def __init__(self):
        self._explainer_model_a = None
        self._explainer_model_b = None

    def _get_explainer_model_a(self, lr_model):
        if self._explainer_model_a is None:
            zero_background = np.zeros((1, 12))
            self._explainer_model_a = shap.LinearExplainer(lr_model, zero_background)
        return self._explainer_model_a

    def _get_explainer_model_b(self, lr_model):
        if self._explainer_model_b is None:
            zero_background = np.zeros((1, 22))
            self._explainer_model_b = shap.LinearExplainer(lr_model, zero_background)
        return self._explainer_model_b

    def explain(
        self,
        raw_features: Dict[str, Any],
        latest_log: Optional[Dict[str, Any]] = None,
        baseline_stats: Optional[Dict[str, Any]] = None,
        recent_episodes_count_7d: int = 0,
        weather_today: Optional[Dict[str, Any]] = None,
        weather_yesterday: Optional[Dict[str, Any]] = None,
        model_used: str = "MODEL_A_LIFESTYLE_BASELINE",
    ) -> Dict[str, Any]:
        if not model_manager.is_loaded or model_manager.model is None:
            raise RuntimeError("Model A is not loaded.")

        if model_used == "MODEL_B_WEATHER_AWARE" and model_manager.is_experimental_loaded and model_manager.experimental_model is not None:
            pipeline = model_manager.experimental_model
            explainer_fn = self._get_explainer_model_b
            is_model_b = True
        else:
            pipeline = model_manager.model
            explainer_fn = self._get_explainer_model_a
            is_model_b = False

        fe = pipeline.named_steps["feature_engineering"]
        scaler = pipeline.named_steps["scaler"]
        lr_model = pipeline.named_steps.get("model") or pipeline.named_steps.get("classifier")

        # 1. Transform raw inputs via respective pipeline feature engineer
        if is_model_b and weather_today and weather_yesterday:
            wt = weather_today
            wy = weather_yesterday
            p_today = float(wt["pressure"])
            p_yesterday = float(wy["pressure"])
            t_today = float(wt["temperature"])
            t_yesterday = float(wy["temperature"])

            p_change = round(p_today - p_yesterday, 2)
            baro_flag = 1 if (p_yesterday - p_today) >= 6.0 else 0
            t_change = round(abs(t_today - t_yesterday), 2)

            raw_df = pd.DataFrame([{
                "sleep_hours": float(raw_features["sleep_hours"]),
                "mood_level": float(raw_features["mood_level"]),
                "stress_level": float(raw_features["stress_level"]),
                "hydration_level": float(raw_features["hydration_level"]),
                "screen_time": float(raw_features["screen_time"]),
                "temperature": t_today,
                "humidity": float(wt["humidity"]),
                "pressure": p_today,
                "precipitation": float(wt["precipitation"]),
                "wind_speed": float(wt["wind_speed"]),
                "pressure_change_24h": p_change,
                "barometric_drop_flag": baro_flag,
                "temp_change_24h": t_change,
            }])
        else:
            raw_df = pd.DataFrame([{
                "sleep_hours": float(raw_features["sleep_hours"]),
                "mood_level": float(raw_features["mood_level"]),
                "stress_level": float(raw_features["stress_level"]),
                "hydration_level": float(raw_features["hydration_level"]),
                "screen_time": float(raw_features["screen_time"]),
            }])

        transformed_df = fe.transform(raw_df)
        feature_names = list(transformed_df.columns)

        # 2. Scale features via pipeline StandardScaler
        scaled_X = scaler.transform(transformed_df)

        # 3. Compute SHAP values
        explainer = explainer_fn(lr_model)
        shap_explanation = explainer(scaled_X)
        shap_values = shap_explanation.values[0]

        # Handle binary classification 2D output if returned by SHAP version
        if shap_values.ndim > 1:
            shap_values = shap_values[:, 1]

        # 4. Map feature attributions
        features_list = []
        for name, val in zip(feature_names, shap_values):
            shap_val = float(val)
            direction = "increases_risk" if shap_val > 0 else "decreases_risk"
            features_list.append({
                "feature": name,
                "label": FEATURE_HUMAN_NAMES.get(name, name),
                "shap_value": round(shap_val, 4),
                "direction": direction,
                "importance": round(abs(shap_val), 4),
                "category": FEATURE_CATEGORIES.get(name, "LIFESTYLE"),
            })

        # Rank all features by absolute importance DESC
        features_sorted = sorted(features_list, key=lambda x: x["importance"], reverse=True)

        # Separate risk-increasing and risk-decreasing factors
        risk_increasing = [f for f in features_sorted if f["direction"] == "increases_risk"]
        risk_decreasing = [f for f in features_sorted if f["direction"] == "decreases_risk"]

        # 5. Build presentation elevated factors from actual API data
        elevated_factors = self._build_elevated_factors(latest_log, baseline_stats, recent_episodes_count_7d)

        return {
            "method": "SHAP",
            "model_used": "MODEL_B_WEATHER_AWARE" if is_model_b else "MODEL_A_LIFESTYLE_BASELINE",
            "features": features_sorted,
            "risk_increasing_factors": risk_increasing,
            "risk_decreasing_factors": risk_decreasing,
            "elevatedFactors": elevated_factors,
        }

    def _build_elevated_factors(
        self,
        latest_log: Optional[Dict[str, Any]],
        baseline_stats: Optional[Dict[str, Any]],
        recent_episodes_count_7d: int = 0,
    ) -> List[Dict[str, Any]]:
        elevated = []

        if not latest_log:
            return elevated

        # Sleep evaluation
        sleep = float(latest_log.get("sleep_hours", 7.0))
        avg_sleep = float(baseline_stats.get("avg_sleep")) if baseline_stats and baseline_stats.get("avg_sleep") is not None else None

        if avg_sleep is not None:
            diff_sleep = sleep - avg_sleep
            if diff_sleep < 0:
                comp_str = f"{abs(round(diff_sleep, 1))} h below baseline"
            elif diff_sleep > 0:
                comp_str = f"{round(diff_sleep, 1)} h above baseline"
            else:
                comp_str = "Matches baseline"
            desc = f"{sleep} h sleep recorded vs baseline average of {avg_sleep} h."
            sleep_deficit_hours = avg_sleep - sleep
        else:
            comp_str = "No baseline data"
            desc = f"{sleep} h sleep recorded."
            sleep_deficit_hours = 7.0 - sleep

        if sleep_deficit_hours >= settings.PRESENTATION_SLEEP_DEFICIT_ALERT:
            sleep_status = "alert"
        elif sleep_deficit_hours >= settings.PRESENTATION_SLEEP_DEFICIT_WARNING:
            sleep_status = "warning"
        else:
            sleep_status = "stable"

        elevated.append({
            "factor": "Sleep",
            "value": f"{sleep} h",
            "comparison": comp_str,
            "description": desc,
            "statusType": sleep_status,
        })

        # Stress evaluation
        stress = float(latest_log.get("daily_stress", 4.0))
        avg_stress = float(baseline_stats.get("avg_stress")) if baseline_stats and baseline_stats.get("avg_stress") is not None else None

        if avg_stress is not None:
            diff_stress = stress - avg_stress
            if diff_stress > 0:
                comp_str = f"{round(diff_stress, 1)} points above baseline"
            elif diff_stress < 0:
                comp_str = f"{abs(round(diff_stress, 1))} points below baseline"
            else:
                comp_str = "Matches baseline"
            desc = f"Daily stress rating {stress} vs baseline average of {avg_stress}."
            stress_elev = diff_stress
        else:
            comp_str = "No baseline data"
            desc = f"Daily stress rating {stress}."
            stress_elev = stress - 4.0

        if stress >= settings.PRESENTATION_STRESS_HIGH_ALERT or stress_elev >= settings.PRESENTATION_STRESS_ELEVATION_ALERT:
            stress_status = "alert"
        elif stress >= settings.PRESENTATION_STRESS_MOD_WARNING or stress_elev >= settings.PRESENTATION_STRESS_ELEVATION_WARNING:
            stress_status = "warning"
        else:
            stress_status = "stable"

        elevated.append({
            "factor": "Stress",
            "value": f"{stress} / 10",
            "comparison": comp_str,
            "description": desc,
            "statusType": stress_status,
        })

        # Screen time evaluation
        screen = float(latest_log.get("screen_time", 6.0))
        if screen >= settings.PRESENTATION_SCREEN_TIME_ALERT:
            screen_status = "alert"
            screen_desc = f"Heavy screen exposure of {screen} h recorded."
        elif screen >= settings.PRESENTATION_SCREEN_TIME_WARNING:
            screen_status = "warning"
            screen_desc = f"Moderate-to-high screen exposure of {screen} h recorded."
        else:
            screen_status = "stable"
            screen_desc = f"Screen exposure of {screen} h within normal limits."

        elevated.append({
            "factor": "Screen Time",
            "value": f"{screen} h",
            "comparison": "Daily log metric",
            "description": screen_desc,
            "statusType": screen_status,
        })

        # Hydration evaluation
        hydration = float(latest_log.get("hydration", 2.0))
        if hydration <= settings.PRESENTATION_HYDRATION_ALERT:
            hydration_status = "alert"
            hydration_desc = f"Low fluid intake of {hydration} L recorded."
        elif hydration <= settings.PRESENTATION_HYDRATION_WARNING:
            hydration_status = "warning"
            hydration_desc = f"Sub-optimal fluid intake of {hydration} L recorded."
        else:
            hydration_status = "stable"
            hydration_desc = f"Healthy fluid intake of {hydration} L recorded."

        elevated.append({
            "factor": "Hydration",
            "value": f"{hydration} L",
            "comparison": "Daily log metric",
            "description": hydration_desc,
            "statusType": hydration_status,
        })

        return elevated


shap_explainer_service = ShapExplainerService()
