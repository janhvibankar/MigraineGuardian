import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.risk_calculator import model_manager
from app.services.recommendation_engine import recommendation_engine


@pytest.fixture(scope="module", autouse=True)
def setup_model():
    """Ensure ML model is loaded before tests run."""
    model_manager.load_model()
    yield


def test_1_recommendation_engine_initializes():
    """TEST 1: Recommendation engine initializes."""
    assert recommendation_engine is not None
    assert hasattr(recommendation_engine, "generate_focus_areas")


def test_2_high_risk_sample_generates_focus_areas():
    """TEST 2: High-risk sample generates focus areas."""
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
        assert "focusAreas" in data
        assert isinstance(data["focusAreas"], list)
        assert len(data["focusAreas"]) > 0


def test_3_focus_areas_contain_title_and_description():
    """TEST 3: Focus areas contain title and description."""
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
        data = response.json()
        for fa in data["focusAreas"]:
            assert "title" in fa
            assert "description" in fa
            assert len(fa["title"]) > 0
            assert len(fa["description"]) > 0


def test_4_maximum_3_focus_areas_returned():
    """TEST 4: Maximum 3 focus areas are returned."""
    payload = {
        "user_id": "test_user_001",
        "latest_log": {
            "sleep_hours": 5.0,
            "sleep_quality": 1,
            "daily_stress": 9,
            "mood": 1,
            "screen_time": 10.0,
            "hydration": 1.0,
        },
        "baseline_stats": {
            "avg_sleep": 8.0,
            "avg_stress": 3.0,
            "pss_score": 20,
        },
        "recent_episodes_count_7d": 4,
    }

    with TestClient(app) as client:
        response = client.post("/predict", json=payload)
        data = response.json()
        assert len(data["focusAreas"]) <= 3


def test_5_strong_positive_shap_influences_priority():
    """TEST 5: Strong positive SHAP factors influence recommendation priority."""
    shap_features = [
        {"feature": "screen_stress", "shap_value": 2.5},
        {"feature": "sleep_deficit", "shap_value": 0.2},
    ]
    latest_log = {"sleep_hours": 6.5, "daily_stress": 8.0, "screen_time": 9.0, "hydration": 2.0}

    focus_areas = recommendation_engine.generate_focus_areas(
        risk_score=75.0,
        risk_level="High",
        shap_features=shap_features,
        latest_log=latest_log,
    )

    assert len(focus_areas) > 0
    # Stress category derived from strong screen_stress feature should be top priority
    assert focus_areas[0]["title"] == "Stress reset"


def test_6_multiple_stress_shap_features_deduplicated():
    """TEST 6: Multiple stress-related SHAP features do not create duplicate stress recommendations."""
    shap_features = [
        {"feature": "stress_level", "shap_value": 1.2},
        {"feature": "screen_stress", "shap_value": 1.5},
        {"feature": "stress_sleep_ratio", "shap_value": 0.8},
        {"feature": "stress_mood_interaction", "shap_value": 0.9},
    ]
    latest_log = {"sleep_hours": 6.0, "daily_stress": 8.0, "screen_time": 8.0, "hydration": 2.0}

    focus_areas = recommendation_engine.generate_focus_areas(
        risk_score=80.0,
        risk_level="High",
        shap_features=shap_features,
        latest_log=latest_log,
    )

    stress_titles = [fa["title"] for fa in focus_areas if fa["title"] == "Stress reset"]
    assert len(stress_titles) == 1


def test_7_sleep_recommendation_uses_baseline_comparison():
    """TEST 7: Sleep recommendation correctly uses baseline comparison when available."""
    latest_log = {"sleep_hours": 5.5, "daily_stress": 4.0, "screen_time": 5.0, "hydration": 2.0}
    baseline_stats = {"avg_sleep": 7.5, "avg_stress": 4.0}
    shap_features = [{"feature": "sleep_deficit", "shap_value": 1.4}]

    focus_areas = recommendation_engine.generate_focus_areas(
        risk_score=60.0,
        risk_level="Moderate",
        shap_features=shap_features,
        latest_log=latest_log,
        baseline_stats=baseline_stats,
    )

    sleep_fa = next(fa for fa in focus_areas if fa["title"] == "Sleep consistency")
    assert "2.0 h below your usual baseline" in sleep_fa["description"]


def test_8_missing_baseline_handled_gracefully():
    """TEST 8: Missing baseline values are handled gracefully without crashing."""
    latest_log = {"sleep_hours": 5.5, "daily_stress": 8.0, "screen_time": 8.0, "hydration": 1.2}
    shap_features = [{"feature": "sleep_deficit", "shap_value": 1.2}]

    focus_areas = recommendation_engine.generate_focus_areas(
        risk_score=70.0,
        risk_level="High",
        shap_features=shap_features,
        latest_log=latest_log,
        baseline_stats=None,
    )

    assert len(focus_areas) > 0


def test_9_recommendations_remain_non_alarmist():
    """TEST 9: Recommendations remain non-alarmist and general wellness oriented."""
    latest_log = {"sleep_hours": 5.0, "daily_stress": 9.0, "screen_time": 9.0, "hydration": 1.0}
    shap_features = [
        {"feature": "stress_level", "shap_value": 2.0},
        {"feature": "sleep_deficit", "shap_value": 1.8},
    ]

    focus_areas = recommendation_engine.generate_focus_areas(
        risk_score=90.0,
        risk_level="High",
        shap_features=shap_features,
        latest_log=latest_log,
    )

    for fa in focus_areas:
        desc = fa["description"].lower()
        assert "emergency" not in desc
        assert "hospital" not in desc
        assert "cure" not in desc
        assert "medical diagnosis" not in desc


def test_10_interaction_features_translated_to_lifestyle():
    """TEST 10: Interaction features are translated into understandable lifestyle categories."""
    shap_features = [
        {"feature": "screen_sleep_ratio", "shap_value": 1.5},
        {"feature": "hydration_sleep", "shap_value": 1.2},
    ]
    latest_log = {"sleep_hours": 5.5, "daily_stress": 4.0, "screen_time": 8.5, "hydration": 1.2}

    focus_areas = recommendation_engine.generate_focus_areas(
        risk_score=65.0,
        risk_level="Moderate",
        shap_features=shap_features,
        latest_log=latest_log,
    )

    titles = [fa["title"] for fa in focus_areas]
    assert "screen_sleep_ratio" not in titles
    assert "hydration_sleep" not in titles
    assert "Screen-time breaks" in titles or "Hydration" in titles or "Sleep consistency" in titles


def test_11_no_medication_or_prescription_generated():
    """TEST 11: No medication dosage or prescription is generated."""
    latest_log = {"sleep_hours": 4.0, "daily_stress": 10.0, "screen_time": 12.0, "hydration": 0.5}
    shap_features = [
        {"feature": "stress_level", "shap_value": 3.0},
        {"feature": "sleep_deficit", "shap_value": 2.5},
    ]

    focus_areas = recommendation_engine.generate_focus_areas(
        risk_score=95.0,
        risk_level="High",
        shap_features=shap_features,
        latest_log=latest_log,
    )

    for fa in focus_areas:
        text = (fa["title"] + " " + fa["description"]).lower()
        assert "mg" not in text
        assert "dose" not in text
        assert "pill" not in text
        assert "medication" not in text
        assert "prescription" not in text
        assert "triptan" not in text
        assert "ibuprofen" not in text


def test_12_phase4a_tests_pass_unchanged():
    """TEST 12: Existing Phase 4A tests still pass."""
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


def test_13_phase4b_tests_pass_unchanged():
    """TEST 13: Existing Phase 4B tests still pass."""
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
        data = response.json()
        assert data["score"] == 85.24
        assert data["xai"]["method"] == "SHAP"
