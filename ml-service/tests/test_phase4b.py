import pytest
from fastapi.testclient import TestClient
import pandas as pd
from app.main import app
from app.services.risk_calculator import model_manager
from app.services.shap_explainer import shap_explainer_service, FEATURE_HUMAN_NAMES


@pytest.fixture(scope="module", autouse=True)
def setup_model():
    """Ensure ML model is loaded before tests run."""
    model_manager.load_model()
    yield


def test_1_shap_explainer_initializes_successfully():
    """TEST 1: SHAP explainer initializes successfully."""
    assert shap_explainer_service is not None
    assert hasattr(shap_explainer_service, "explain")


def test_2_explain_endpoint_valid_request():
    """TEST 2: Valid /explain request returns HTTP 200."""
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
        response = client.post("/explain", json=payload)
        assert response.status_code == 200


def test_3_response_contains_score():
    """TEST 3: Response contains score."""
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
        response = client.post("/explain", json=payload)
        data = response.json()
        assert "score" in data
        assert isinstance(data["score"], (int, float))
        assert data["score"] == 85.24


def test_4_response_contains_risk_level():
    """TEST 4: Response contains risk level."""
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
        response = client.post("/explain", json=payload)
        data = response.json()
        assert "level" in data
        assert data["level"] == "High"


def test_5_response_xai_method_is_shap():
    """TEST 5: Response contains xai.method == 'SHAP'."""
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
        response = client.post("/explain", json=payload)
        data = response.json()
        assert "xai" in data
        assert data["xai"]["method"] == "SHAP"


def test_6_response_contains_shap_features():
    """TEST 6: Response contains SHAP feature contributions."""
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
        response = client.post("/explain", json=payload)
        data = response.json()
        assert "features" in data["xai"]
        assert len(data["xai"]["features"]) > 0


def test_7_shap_output_contains_expected_model_features():
    """TEST 7: SHAP output contains the expected model features (12 features: 5 base + 7 derived)."""
    raw_features = {
        "sleep_hours": 5.8,
        "mood_level": 2.0,
        "stress_level": 8.0,
        "hydration_level": 1.5,
        "screen_time": 8.2,
    }

    result = shap_explainer_service.explain(raw_features)
    feature_names = [f["feature"] for f in result["features"]]

    expected = [
        "sleep_hours", "mood_level", "stress_level", "hydration_level", "screen_time",
        "stress_sleep_ratio", "screen_stress", "hydration_sleep", "sleep_deficit",
        "hydration_deficit", "stress_mood_interaction", "screen_sleep_ratio"
    ]

    for feat in expected:
        assert feat in feature_names


def test_8_positive_shap_contributions_increases_risk():
    """TEST 8: Positive SHAP contributions are correctly identified as risk-increasing for class 1."""
    raw_features = {
        "sleep_hours": 5.8,
        "mood_level": 2.0,
        "stress_level": 8.0,
        "hydration_level": 1.5,
        "screen_time": 8.2,
    }

    result = shap_explainer_service.explain(raw_features)
    for feat in result["features"]:
        if feat["shap_value"] > 0:
            assert feat["direction"] == "increases_risk"


def test_9_negative_shap_contributions_decreases_risk():
    """TEST 9: Negative SHAP contributions are correctly identified as risk-decreasing for class 1."""
    raw_features = {
        "sleep_hours": 5.8,
        "mood_level": 2.0,
        "stress_level": 8.0,
        "hydration_level": 1.5,
        "screen_time": 8.2,
    }

    result = shap_explainer_service.explain(raw_features)
    for feat in result["features"]:
        if feat["shap_value"] < 0:
            assert feat["direction"] == "decreases_risk"


def test_10_elevated_factors_ranked_deterministically():
    """TEST 10: Elevated factors are ranked deterministically with status types."""
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
        response = client.post("/explain", json=payload)
        data = response.json()
        assert "elevatedFactors" in data
        assert len(data["elevatedFactors"]) >= 4

        for factor in data["elevatedFactors"]:
            assert "factor" in factor
            assert "value" in factor
            assert "comparison" in factor
            assert "statusType" in factor
            assert factor["statusType"] in ["alert", "warning", "stable"]


def test_11_baseline_comparison_calculation():
    """TEST 11: Baseline comparison is calculated correctly when baseline values exist."""
    latest_log = {
        "sleep_hours": 5.8,
        "daily_stress": 8.0,
        "screen_time": 8.2,
        "hydration": 1.5,
    }
    baseline_stats = {
        "avg_sleep": 7.6,
        "avg_stress": 4.0,
        "pss_score": 14,
    }

    elevated = shap_explainer_service._build_elevated_factors(latest_log, baseline_stats)

    sleep_factor = next(f for f in elevated if f["factor"] == "Sleep")
    assert "1.8 h below baseline" in sleep_factor["comparison"]
    assert sleep_factor["statusType"] == "alert"

    stress_factor = next(f for f in elevated if f["factor"] == "Stress")
    assert "4.0 points above baseline" in stress_factor["comparison"]
    assert stress_factor["statusType"] == "alert"



def test_12_missing_optional_baseline_graceful_handling():
    """TEST 12: Missing optional baseline information does not crash explanation endpoint."""
    payload_no_baseline = {
        "user_id": "test_user_001",
        "latest_log": {
            "sleep_hours": 5.8,
            "sleep_quality": 2,
            "daily_stress": 8,
            "mood": 2,
            "screen_time": 8.2,
            "hydration": 1.5,
        },
        # baseline_stats omitted
        "recent_episodes_count_7d": 0,
    }

    with TestClient(app) as client:
        response = client.post("/explain", json=payload_no_baseline)
        assert response.status_code == 200
        data = response.json()
        assert data["score"] == 85.24
        assert "elevatedFactors" in data
        for f in data["elevatedFactors"]:
            assert f["comparison"] == "No baseline data" or "Daily log metric" in f["comparison"]


def test_13_phase4a_tests_pass_unchanged():
    """TEST 13: Existing Phase 4A /predict behavior remains backward-compatible."""
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
        assert data["score"] == 85.24
        assert data["level"] == "High"
