import sys
import types
import __main__
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, Any, Tuple, Optional, Union
from sklearn.base import BaseEstimator, TransformerMixin
from app.core.config import settings
from app.services.feature_engineering import MigraineFeatureEngineer

# Register custom production transformer in __main__ and sys.modules so joblib unpickling works cleanly
__main__.MigraineFeatureEngineer = MigraineFeatureEngineer
if 'feature_engineering' not in sys.modules:
    import app.services.feature_engineering as fe_module
    sys.modules['feature_engineering'] = fe_module


# Define Experimental Feature Engineer class so joblib unpickles Model B artifact cleanly
class ExperimentalWeatherFeatureEngineer(BaseEstimator, TransformerMixin):
    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = X.copy()
        X["stress_sleep_ratio"] = X["stress_level"] / (X["sleep_hours"] + 1.0)
        X["screen_stress"] = X["screen_time"] * X["stress_level"]
        X["hydration_sleep"] = X["hydration_level"] * X["sleep_hours"]
        X["sleep_deficit"] = (7.0 - X["sleep_hours"]).clip(lower=0)
        X["hydration_deficit"] = (3.0 - X["hydration_level"]).clip(lower=0)
        X["stress_mood_interaction"] = X["stress_level"] * (6.0 - X["mood_level"])
        X["screen_sleep_ratio"] = X["screen_time"] / (X["sleep_hours"] + 1.0)

        if "pressure_change_24h" not in X.columns:
            X["pressure_change_24h"] = 0.0
        if "barometric_drop_flag" not in X.columns:
            X["barometric_drop_flag"] = 0
        if "temp_change_24h" not in X.columns:
            X["temp_change_24h"] = 0.0

        X["pressure_stress_interaction"] = X["barometric_drop_flag"] * X["stress_level"]
        X["sleep_weather_vulnerability"] = X["sleep_deficit"] * X["barometric_drop_flag"]

        cols = [
            "sleep_hours", "mood_level", "stress_level", "hydration_level", "screen_time",
            "stress_sleep_ratio", "screen_stress", "hydration_sleep", "sleep_deficit",
            "hydration_deficit", "stress_mood_interaction", "screen_sleep_ratio",
            "temperature", "humidity", "pressure", "precipitation", "wind_speed",
            "pressure_change_24h", "barometric_drop_flag", "temp_change_24h",
            "pressure_stress_interaction", "sleep_weather_vulnerability",
        ]
        return X[cols]


# Register Experimental Transformer in sys.modules & __main__
__main__.ExperimentalWeatherFeatureEngineer = ExperimentalWeatherFeatureEngineer
if 'build_experimental_model' not in sys.modules:
    mod = types.ModuleType('build_experimental_model')
    mod.ExperimentalWeatherFeatureEngineer = ExperimentalWeatherFeatureEngineer
    sys.modules['build_experimental_model'] = mod


class ModelManager:
    _instance = None

    def __init__(self):
        self.model = None
        self.experimental_model = None
        self.is_loaded = False
        self.is_experimental_loaded = False
        self.load_error = None
        self.experimental_load_error = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = ModelManager()
        return cls._instance

    def load_model(self, path: Path = settings.MODEL_PATH, exp_path: Path = settings.EXPERIMENTAL_MODEL_PATH):
        # 1. Load Production Model A (migraine_pipeline.pkl)
        try:
            if not path.exists():
                raise FileNotFoundError(f"Model file not found at path: {path}")

            self.model = joblib.load(path)
            self.is_loaded = True
            self.load_error = None
            print(f"[ML Service] Model A (Production Baseline) successfully loaded from {path}")
        except Exception as e:
            self.is_loaded = False
            self.load_error = str(e)
            print(f"[ML Service] Error loading Model A: {e}")
            raise e

        # 2. Load Experimental Model B if artifact exists
        try:
            if exp_path.exists():
                self.experimental_model = joblib.load(exp_path)
                self.is_experimental_loaded = True
                self.experimental_load_error = None
                print(f"[ML Service] Model B (Experimental Weather-Aware) successfully loaded from {exp_path}")
            else:
                self.is_experimental_loaded = False
                self.experimental_load_error = f"Experimental model artifact not found at {exp_path}"
                print(f"[ML Service] Notice: Model B artifact not found at {exp_path}. Routing will fall back to Model A.")
        except Exception as e:
            self.is_experimental_loaded = False
            self.experimental_load_error = str(e)
            print(f"[ML Service Warning] Error loading Model B artifact: {e}")

    def predict_risk(
        self,
        raw_features: Dict[str, Any],
        weather_today: Optional[Dict[str, Any]] = None,
        weather_yesterday: Optional[Dict[str, Any]] = None,
        return_meta: bool = False,
    ) -> Union[Tuple[float, str], Tuple[float, str, str]]:
        if not self.is_loaded or self.model is None:
            raise RuntimeError(f"Model A is not loaded: {self.load_error or 'Unknown error'}")

        # Check if complete weather data is provided and valid for Model B routing
        # Only use Model B if the feature flag is explicitly enabled
        use_model_b = settings.WEATHER_MODEL_ENABLED and self._validate_weather_inputs(weather_today, weather_yesterday)

        if use_model_b and self.is_experimental_loaded and self.experimental_model is not None:
            try:
                wt = weather_today
                wy = weather_yesterday

                p_today = float(wt["pressure"])
                p_yesterday = float(wy["pressure"])
                t_today = float(wt["temperature"])
                t_yesterday = float(wy["temperature"])

                p_change = round(p_today - p_yesterday, 2)
                baro_flag = 1 if (p_yesterday - p_today) >= 6.0 else 0
                t_change = round(abs(t_today - t_yesterday), 2)

                df_b = pd.DataFrame([{
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

                probabilities = self.experimental_model.predict_proba(df_b)
                prob_class_1 = float(probabilities[0][1])
                score = round(prob_class_1 * 100.0, 2)
                level = self._get_risk_level(score)

                if return_meta:
                    return score, level, "MODEL_B_WEATHER_AWARE"
                return score, level
            except Exception as e:
                print(f"[ML Service Warning] Error executing Model B prediction: {e}. Falling back to Model A.")

        # Fallback to Model A Baseline (12 Features)
        df_a = pd.DataFrame([{
            "sleep_hours": float(raw_features["sleep_hours"]),
            "mood_level": float(raw_features["mood_level"]),
            "stress_level": float(raw_features["stress_level"]),
            "hydration_level": float(raw_features["hydration_level"]),
            "screen_time": float(raw_features["screen_time"])
        }])

        probabilities = self.model.predict_proba(df_a)
        prob_class_1 = float(probabilities[0][1])
        score = round(prob_class_1 * 100.0, 2)
        level = self._get_risk_level(score)

        if return_meta:
            return score, level, "MODEL_A_LIFESTYLE_BASELINE"
        return score, level

    def _validate_weather_inputs(self, wt: Optional[Dict[str, Any]], wy: Optional[Dict[str, Any]]) -> bool:
        if not wt or not wy:
            return False

        req_wt = ["temperature", "humidity", "pressure", "precipitation", "wind_speed"]
        req_wy = ["pressure", "temperature"]

        for k in req_wt:
            val = wt.get(k)
            if val is None or is_invalid_numeric(val):
                return False

        for k in req_wy:
            val = wy.get(k)
            if val is None or is_invalid_numeric(val):
                return False

        return True

    def _get_risk_level(self, score: float) -> str:
        if score < settings.RISK_THRESHOLD_LOW:
            return "Low"
        elif score <= settings.RISK_THRESHOLD_HIGH:
            return "Moderate"
        else:
            return "High"


def is_invalid_numeric(val) -> bool:
    try:
        v = float(val)
        return np.isnan(v) or np.isinf(v)
    except (ValueError, TypeError):
        return True


model_manager = ModelManager.get_instance()
