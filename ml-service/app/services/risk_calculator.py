import sys
import __main__
import joblib
import pandas as pd
from pathlib import Path
from typing import Dict, Any, Tuple
from app.core.config import settings
from app.services.feature_engineering import MigraineFeatureEngineer

# Register custom transformer in __main__ and sys.modules so joblib unpickling works cleanly
__main__.MigraineFeatureEngineer = MigraineFeatureEngineer
if 'feature_engineering' not in sys.modules:
    import app.services.feature_engineering as fe_module
    sys.modules['feature_engineering'] = fe_module


class ModelManager:
    _instance = None

    def __init__(self):
        self.model = None
        self.is_loaded = False
        self.load_error = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = ModelManager()
        return cls._instance

    def load_model(self, path: Path = settings.MODEL_PATH):
        try:
            if not path.exists():
                raise FileNotFoundError(f"Model file not found at path: {path}")

            self.model = joblib.load(path)
            self.is_loaded = True
            self.load_error = None
            print(f"[ML Service] Model successfully loaded from {path}")
        except Exception as e:
            self.is_loaded = False
            self.load_error = str(e)
            print(f"[ML Service] Error loading model: {e}")
            raise e

    def predict_risk(self, raw_features: Dict[str, Any]) -> Tuple[float, str]:
        if not self.is_loaded or self.model is None:
            raise RuntimeError(f"Model is not loaded: {self.load_error or 'Unknown error'}")

        # Map API inputs to exact feature names expected by trained model pipeline
        df = pd.DataFrame([{
            "sleep_hours": float(raw_features["sleep_hours"]),
            "mood_level": float(raw_features["mood_level"]),
            "stress_level": float(raw_features["stress_level"]),
            "hydration_level": float(raw_features["hydration_level"]),
            "screen_time": float(raw_features["screen_time"])
        }])

        # Sklearn Pipeline handles internal feature engineering, scaling, and classification
        probabilities = self.model.predict_proba(df)

        # Class 1 probability represents migraine risk
        prob_class_1 = float(probabilities[0][1])
        score = round(prob_class_1 * 100.0, 2)

        # Categorical risk level mapping based on project configurable thresholds
        if score < settings.RISK_THRESHOLD_LOW:
            level = "Low"
        elif score <= settings.RISK_THRESHOLD_HIGH:
            level = "Moderate"
        else:
            level = "High"

        return score, level


model_manager = ModelManager.get_instance()
