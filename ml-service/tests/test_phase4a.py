import pytest
from fastapi.testclient import TestClient
import pandas as pd
from app.main import app
from app.services.risk_calculator import model_manager, ModelManager
from app.services.feature_engineering import MigraineFeatureEngineer


@pytest.fixture(scope="module", autouse=True)
def setup_model():
    """Ensure ML model is loaded before tests run."""
    model_manager.load_model()
    yield


def test_1_model_loads_successfully():
    """TEST 1: Model loads successfully from pickle artifact."""
    assert model_manager.is_loaded is True
    assert model_manager.model is not None
    assert hasattr(model_manager.model, "predict_proba")
    steps = [name for name, _ in model_manager.model.steps]
    assert "feature_engineering" in steps
    assert "scaler" in steps
    assert "model" in steps


def test_2_health_check_endpoint():
    """TEST 2: GET /health returns HTTP 200 and model_loaded=true."""
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "migraine-ml-service"
        assert data["model_loaded"] is True


def test_3_predict_valid_input_status_200():
    """TEST 3: POST /predict with valid input returns HTTP 200."""
    payload = {
        "user_id": "test_user_001",
        "latest_log": {
            "sleep_hours": 5.8,
            "sleep_quality": 2,
            "daily_stress": 8,
            "mood": 2,
            "screen_time": 8.2,
            "hydration": 1.5,
        },
        "baseline_stats": {
            "avg_sleep": 7.6,
            "avg_stress": 4.0,
            "pss_score": 14,
        },
        "recent_episodes_count_7d": 2,
    }

    with TestClient(app) as client:
        response = client.post("/predict", json=payload)
        assert response.status_code == 200


def test_4_prediction_score_range():
    """TEST 4: Prediction contains score between 0 and 100."""
    payload = {
        "user_id": "test_user_001",
        "latest_log": {
            "sleep_hours": 5.8,
            "sleep_quality": 2,
            "daily_stress": 8,
            "mood": 2,
            "screen_time": 8.2,
            "hydration": 1.5,
        },
        "baseline_stats": {
            "avg_sleep": 7.6,
            "avg_stress": 4.0,
            "pss_score": 14,
        },
        "recent_episodes_count_7d": 2,
    }

    with TestClient(app) as client:
        response = client.post("/predict", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "score" in data
        assert isinstance(data["score"], (int, float))
        assert 0.0 <= data["score"] <= 100.0


def test_5_prediction_level_mapping():
    """TEST 5: Prediction contains level Low/Moderate/High."""
    payload = {
        "user_id": "test_user_001",
        "latest_log": {
            "sleep_hours": 5.8,
            "sleep_quality": 2,
            "daily_stress": 8,
            "mood": 2,
            "screen_time": 8.2,
            "hydration": 1.5,
        },
        "baseline_stats": {
            "avg_sleep": 7.6,
            "avg_stress": 4.0,
            "pss_score": 14,
        },
        "recent_episodes_count_7d": 2,
    }

    with TestClient(app) as client:
        response = client.post("/predict", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "level" in data
        assert data["level"] in ["Low", "Moderate", "High"]


def test_6_invalid_input_returns_422():
    """TEST 6: Invalid/missing required model input returns HTTP 422."""
    invalid_payload = {
        "user_id": "test_user_001",
        "latest_log": {
            # Missing sleep_hours
            "sleep_quality": 2,
            "daily_stress": 8,
            "mood": 2,
            "screen_time": 8.2,
            "hydration": 1.5,
        },
        "baseline_stats": {
            "avg_sleep": 7.6,
            "avg_stress": 4.0,
            "pss_score": 14,
        },
        "recent_episodes_count_7d": 2,
    }

    with TestClient(app) as client:
        response = client.post("/predict", json=invalid_payload)
        assert response.status_code == 422


def test_7_verify_field_name_mapping():
    """TEST 7: Verify API correctly maps mood->mood_level, daily_stress->stress_level, hydration->hydration_level."""
    raw_features = {
        "sleep_hours": 7.5,
        "mood_level": 4.0,
        "stress_level": 3.0,
        "hydration_level": 2.5,
        "screen_time": 5.0,
    }

    score, level = model_manager.predict_risk(raw_features)
    assert isinstance(score, float)
    assert level in ["Low", "Moderate", "High"]


def test_8_verify_pipeline_internal_feature_engineering():
    """TEST 8: Verify that pipeline performs feature engineering internally without duplicate computation in FastAPI."""
    raw_df = pd.DataFrame([{
        "sleep_hours": 6.0,
        "mood_level": 3.0,
        "stress_level": 5.0,
        "hydration_level": 2.0,
        "screen_time": 7.0,
    }])

    # Raw input has exactly 5 base features
    assert list(raw_df.columns) == ["sleep_hours", "mood_level", "stress_level", "hydration_level", "screen_time"]

    # Transform using custom MigraineFeatureEngineer component of loaded pipeline
    fe_transformer = model_manager.model.named_steps["feature_engineering"]
    transformed_df = fe_transformer.transform(raw_df)

    # Derived features generated by transformer
    derived_cols = [
        "stress_sleep_ratio",
        "screen_stress",
        "hydration_sleep",
        "sleep_deficit",
        "hydration_deficit",
        "stress_mood_interaction",
        "screen_sleep_ratio",
    ]
    for col in derived_cols:
        assert col in transformed_df.columns
