from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path


class Settings(BaseSettings):
    PROJECT_NAME: str = "MigraineGuardian ML Service"
    VERSION: str = "1.0.0"

    # Absolute path to serialized scikit-learn pipeline model
    MODEL_PATH: Path = Path(__file__).resolve().parent.parent / "models" / "migraine_pipeline.pkl"
    EXPERIMENTAL_MODEL_PATH: Path = Path(__file__).resolve().parent.parent.parent / "data" / "models" / "migraine_weather_pipeline_experimental.pkl"

    # Project-level configurable risk score probability thresholds (0-100)
    # score < LOW_THRESHOLD -> "Low"
    # LOW_THRESHOLD <= score <= HIGH_THRESHOLD -> "Moderate"
    # score > HIGH_THRESHOLD -> "High"
    RISK_THRESHOLD_LOW: float = 35.0
    RISK_THRESHOLD_HIGH: float = 65.0

    # Project-level presentation thresholds for elevated factor status (alert, warning, stable)
    PRESENTATION_SLEEP_DEFICIT_ALERT: float = 1.5
    PRESENTATION_SLEEP_DEFICIT_WARNING: float = 0.5
    PRESENTATION_STRESS_HIGH_ALERT: float = 8.0
    PRESENTATION_STRESS_MOD_WARNING: float = 6.0
    PRESENTATION_STRESS_ELEVATION_ALERT: float = 3.0
    PRESENTATION_STRESS_ELEVATION_WARNING: float = 1.5
    PRESENTATION_SCREEN_TIME_ALERT: float = 8.0
    PRESENTATION_SCREEN_TIME_WARNING: float = 6.0
    PRESENTATION_HYDRATION_ALERT: float = 1.5
    PRESENTATION_HYDRATION_WARNING: float = 2.0

    model_config = SettingsConfigDict(case_sensitive=True)



settings = Settings()
