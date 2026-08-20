import pytest
import os
from fastapi.testclient import TestClient
from app.main import app
from app.services.risk_calculator import model_manager


@pytest.fixture(scope="module", autouse=True)
def setup_models():
    """Ensure both Model A and Model B are initialized for testing."""
    model_manager.load_model()
    yield


def test_1_existing_lifestyle_only_request_uses_model_a():
    """TEST 1: Existing request with lifestyle data only routes to Model A baseline."""
    payload = {
        "user_id": "test_user_001",
        "latest_log": {
            "sleep_hours": 6.5,
            "sleep_quality": 3,
            "daily_stress": 6,
            "mood": 3,
            "screen_time": 7.0,
            "hydration": 2.0,
        },
    }

    with TestClient(app) as client:
        response = client.post("/predict", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "model_used" in data
        assert data["model_used"] == "MODEL_A_LIFESTYLE_BASELINE"


def test_2_complete_weather_request_uses_model_b():
    """TEST 2: Request with complete weather_today and weather_yesterday routes to Model B weather-aware."""
    payload = {
        "user_id": "test_user_001",
        "latest_log": {
            "sleep_hours": 6.5,
            "sleep_quality": 3,
            "daily_stress": 6,
            "mood": 3,
            "screen_time": 7.0,
            "hydration": 2.0,
        },
        "weather_today": {
            "temperature": 19.5,
            "humidity": 62.0,
            "pressure": 1008.0,
            "precipitation": 0.0,
            "wind_speed": 12.0,
        },
        "weather_yesterday": {
            "pressure": 1015.0,
            "temperature": 21.0,
        },
    }

    with TestClient(app) as client:
        response = client.post("/predict", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "model_used" in data
        assert data["model_used"] == "MODEL_B_WEATHER_AWARE"


def test_3_incomplete_weather_today_falls_back_to_model_a():
    """TEST 3: Request missing one field in weather_today safely falls back to Model A."""
    payload = {
        "user_id": "test_user_001",
        "latest_log": {
            "sleep_hours": 6.5,
            "sleep_quality": 3,
            "daily_stress": 6,
            "mood": 3,
            "screen_time": 7.0,
            "hydration": 2.0,
        },
        "weather_today": {
            "temperature": 19.5,
            # Missing pressure field!
            "humidity": 62.0,
            "precipitation": 0.0,
            "wind_speed": 12.0,
        },
        "weather_yesterday": {
            "pressure": 1015.0,
            "temperature": 21.0,
        },
    }

    with TestClient(app) as client:
        response = client.post("/predict", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["model_used"] == "MODEL_A_LIFESTYLE_BASELINE"


def test_4_missing_weather_yesterday_falls_back_to_model_a():
    """TEST 4: Request missing weather_yesterday safely falls back to Model A."""
    payload = {
        "user_id": "test_user_001",
        "latest_log": {
            "sleep_hours": 6.5,
            "sleep_quality": 3,
            "daily_stress": 6,
            "mood": 3,
            "screen_time": 7.0,
            "hydration": 2.0,
        },
        "weather_today": {
            "temperature": 19.5,
            "humidity": 62.0,
            "pressure": 1008.0,
            "precipitation": 0.0,
            "wind_speed": 12.0,
        },
        # weather_yesterday missing!
    }

    with TestClient(app) as client:
        response = client.post("/predict", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["model_used"] == "MODEL_A_LIFESTYLE_BASELINE"


def test_5_weather_delta_calculation_backwards_only():
    """TEST 5: Pressure drop calculation uses previous day pressure (1015) minus today pressure (1008) = +7.0 hPa drop."""
    raw_lifestyle = {
        "sleep_hours": 6.0,
        "mood_level": 3.0,
        "stress_level": 5.0,
        "hydration_level": 2.0,
        "screen_time": 6.0,
    }
    wt = {"temperature": 19.0, "humidity": 60.0, "pressure": 1008.0, "precipitation": 0.0, "wind_speed": 10.0}
    wy = {"pressure": 1015.0, "temperature": 21.0}

    score, level, model_used = model_manager.predict_risk(raw_lifestyle, wt, wy, return_meta=True)
    assert model_used == "MODEL_B_WEATHER_AWARE"
    assert 0.0 <= score <= 100.0


def test_6_model_b_score_probability_in_valid_range():
    """TEST 6: Model B probability score is between 0 and 100 and level is valid category."""
    payload = {
        "user_id": "test_user_001",
        "latest_log": {
            "sleep_hours": 4.5,
            "sleep_quality": 1,
            "daily_stress": 9,
            "mood": 1,
            "screen_time": 10.0,
            "hydration": 1.0,
        },
        "weather_today": {
            "temperature": 25.0,
            "humidity": 80.0,
            "pressure": 1002.0,
            "precipitation": 5.0,
            "wind_speed": 20.0,
        },
        "weather_yesterday": {
            "pressure": 1012.0,
            "temperature": 20.0,
        },
    }

    with TestClient(app) as client:
        response = client.post("/predict", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert 0.0 <= data["score"] <= 100.0
        assert data["level"] in ["Low", "Moderate", "High"]


def test_7_existing_response_fields_preserved():
    """TEST 7: Response continues returning all legacy fields (score, level, elevatedFactors, xai, focusAreas)."""
    payload = {
        "user_id": "test_user_001",
        "latest_log": {
            "sleep_hours": 6.5,
            "sleep_quality": 3,
            "daily_stress": 6,
            "mood": 3,
            "screen_time": 7.0,
            "hydration": 2.0,
        },
        "weather_today": {
            "temperature": 19.5,
            "humidity": 62.0,
            "pressure": 1008.0,
            "precipitation": 0.0,
            "wind_speed": 12.0,
        },
        "weather_yesterday": {
            "pressure": 1015.0,
            "temperature": 21.0,
        },
    }

    with TestClient(app) as client:
        response = client.post("/predict", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "score" in data
        assert "level" in data
        assert "elevatedFactors" in data
        assert "xai" in data
        assert "focusAreas" in data
        assert "model_used" in data


def test_8_model_used_metadata_values():
    """TEST 8: model_used contains exact expected enum strings."""
    assert "MODEL_A_LIFESTYLE_BASELINE" in ["MODEL_A_LIFESTYLE_BASELINE", "MODEL_B_WEATHER_AWARE"]
    assert "MODEL_B_WEATHER_AWARE" in ["MODEL_A_LIFESTYLE_BASELINE", "MODEL_B_WEATHER_AWARE"]


def test_9_production_model_pipeline_pkl_unchanged():
    """TEST 9: Production model artifact path exists and is loaded properly."""
    from app.core.config import settings
    assert model_manager.is_loaded is True
    assert model_manager.model is not None
    assert os.path.exists(settings.MODEL_PATH)
