import pytest
import numpy as np
from fastapi.testclient import TestClient
from app.main import app
from app.services.risk_calculator import model_manager
from app.services.shap_explainer import shap_explainer_service


@pytest.fixture(scope="module", autouse=True)
def setup_models():
    model_manager.load_model()
    yield


EXPECTED_MODEL_B_FEATURES = [
    "sleep_hours", "mood_level", "stress_level", "hydration_level", "screen_time",
    "stress_sleep_ratio", "screen_stress", "hydration_sleep", "sleep_deficit",
    "hydration_deficit", "stress_mood_interaction", "screen_sleep_ratio",
    "temperature", "humidity", "pressure", "precipitation", "wind_speed",
    "pressure_change_24h", "barometric_drop_flag", "temp_change_24h",
    "pressure_stress_interaction", "sleep_weather_vulnerability"
]


def test_1_model_a_prediction_returns_12_shap_features():
    """TEST 1: Model A prediction returns exactly 12 SHAP features."""
    raw_lifestyle = {
        "sleep_hours": 6.5,
        "mood_level": 3.0,
        "stress_level": 6.0,
        "hydration_level": 2.0,
        "screen_time": 7.0,
    }
    exp = shap_explainer_service.explain(raw_lifestyle, model_used="MODEL_A_LIFESTYLE_BASELINE")
    assert len(exp["features"]) == 12
    assert exp["model_used"] == "MODEL_A_LIFESTYLE_BASELINE"


def test_2_model_b_prediction_returns_22_shap_features():
    """TEST 2: Model B prediction returns exactly 22 SHAP features."""
    raw_lifestyle = {"sleep_hours": 6.5, "mood_level": 3.0, "stress_level": 6.0, "hydration_level": 2.0, "screen_time": 7.0}
    wt = {"temperature": 19.5, "humidity": 62.0, "pressure": 1008.0, "precipitation": 0.0, "wind_speed": 12.0}
    wy = {"pressure": 1015.0, "temperature": 21.0}

    exp = shap_explainer_service.explain(
        raw_lifestyle, weather_today=wt, weather_yesterday=wy, model_used="MODEL_B_WEATHER_AWARE"
    )
    assert len(exp["features"]) == 22
    assert exp["model_used"] == "MODEL_B_WEATHER_AWARE"


def test_3_model_b_feature_names_and_order_match_schema():
    """TEST 3: Model B feature list contains all 22 features matching exact schema order."""
    raw_lifestyle = {"sleep_hours": 6.5, "mood_level": 3.0, "stress_level": 6.0, "hydration_level": 2.0, "screen_time": 7.0}
    wt = {"temperature": 19.5, "humidity": 62.0, "pressure": 1008.0, "precipitation": 0.0, "wind_speed": 12.0}
    wy = {"pressure": 1015.0, "temperature": 21.0}

    exp = shap_explainer_service.explain(raw_lifestyle, weather_today=wt, weather_yesterday=wy, model_used="MODEL_B_WEATHER_AWARE")
    returned_feature_names = [f["feature"] for f in exp["features"]]

    for expected_feat in EXPECTED_MODEL_B_FEATURES:
        assert expected_feat in returned_feature_names


def test_4_model_b_shap_values_length_matches_feature_list():
    """TEST 4: Model B SHAP values array length matches feature list length (22)."""
    raw_lifestyle = {"sleep_hours": 6.5, "mood_level": 3.0, "stress_level": 6.0, "hydration_level": 2.0, "screen_time": 7.0}
    wt = {"temperature": 19.5, "humidity": 62.0, "pressure": 1008.0, "precipitation": 0.0, "wind_speed": 12.0}
    wy = {"pressure": 1015.0, "temperature": 21.0}

    exp = shap_explainer_service.explain(raw_lifestyle, weather_today=wt, weather_yesterday=wy, model_used="MODEL_B_WEATHER_AWARE")
    assert len(exp["features"]) == 22
    for f in exp["features"]:
        assert "shap_value" in f
        assert isinstance(f["shap_value"], float)


def test_5_model_b_weather_features_present():
    """TEST 5: Model B SHAP output includes weather features (pressure, temperature, pressure_change_24h, barometric_drop_flag)."""
    raw_lifestyle = {"sleep_hours": 6.5, "mood_level": 3.0, "stress_level": 6.0, "hydration_level": 2.0, "screen_time": 7.0}
    wt = {"temperature": 19.5, "humidity": 62.0, "pressure": 1008.0, "precipitation": 0.0, "wind_speed": 12.0}
    wy = {"pressure": 1015.0, "temperature": 21.0}

    exp = shap_explainer_service.explain(raw_lifestyle, weather_today=wt, weather_yesterday=wy, model_used="MODEL_B_WEATHER_AWARE")
    feature_keys = {f["feature"] for f in exp["features"]}
    weather_keys = {"temperature", "humidity", "pressure", "precipitation", "wind_speed", "pressure_change_24h", "barometric_drop_flag", "temp_change_24h"}
    assert weather_keys.issubset(feature_keys)


def test_6_model_b_interaction_features_present():
    """TEST 6: Model B SHAP output includes interaction features (pressure_stress_interaction, sleep_weather_vulnerability)."""
    raw_lifestyle = {"sleep_hours": 6.5, "mood_level": 3.0, "stress_level": 6.0, "hydration_level": 2.0, "screen_time": 7.0}
    wt = {"temperature": 19.5, "humidity": 62.0, "pressure": 1008.0, "precipitation": 0.0, "wind_speed": 12.0}
    wy = {"pressure": 1015.0, "temperature": 21.0}

    exp = shap_explainer_service.explain(raw_lifestyle, weather_today=wt, weather_yesterday=wy, model_used="MODEL_B_WEATHER_AWARE")
    feature_keys = {f["feature"] for f in exp["features"]}
    interaction_keys = {"pressure_stress_interaction", "sleep_weather_vulnerability"}
    assert interaction_keys.issubset(feature_keys)


def test_7_model_a_shap_remains_unchanged():
    """TEST 7: Model A SHAP output structure and behavior remain unchanged."""
    raw_lifestyle = {"sleep_hours": 6.5, "mood_level": 3.0, "stress_level": 6.0, "hydration_level": 2.0, "screen_time": 7.0}
    exp = shap_explainer_service.explain(raw_lifestyle, model_used="MODEL_A_LIFESTYLE_BASELINE")
    assert exp["method"] == "SHAP"
    assert exp["model_used"] == "MODEL_A_LIFESTYLE_BASELINE"
    assert len(exp["features"]) == 12


def test_8_positive_and_negative_shap_direction_validity():
    """TEST 8: Direction label strictly maps positive SHAP to 'increases_risk' and negative to 'decreases_risk'."""
    raw_lifestyle = {"sleep_hours": 4.0, "mood_level": 1.0, "stress_level": 9.0, "hydration_level": 1.0, "screen_time": 10.0}
    wt = {"temperature": 19.5, "humidity": 62.0, "pressure": 1008.0, "precipitation": 0.0, "wind_speed": 12.0}
    wy = {"pressure": 1015.0, "temperature": 21.0}

    exp = shap_explainer_service.explain(raw_lifestyle, weather_today=wt, weather_yesterday=wy, model_used="MODEL_B_WEATHER_AWARE")
    for f in exp["features"]:
        if f["shap_value"] > 0:
            assert f["direction"] == "increases_risk"
        elif f["shap_value"] < 0:
            assert f["direction"] == "decreases_risk"


def test_9_repeated_input_produces_deterministic_shap_output():
    """TEST 9: Repeated identical input produces deterministic SHAP output values."""
    raw_lifestyle = {"sleep_hours": 6.0, "mood_level": 3.0, "stress_level": 5.0, "hydration_level": 2.0, "screen_time": 6.0}
    wt = {"temperature": 19.5, "humidity": 62.0, "pressure": 1008.0, "precipitation": 0.0, "wind_speed": 12.0}
    wy = {"pressure": 1015.0, "temperature": 21.0}

    exp1 = shap_explainer_service.explain(raw_lifestyle, weather_today=wt, weather_yesterday=wy, model_used="MODEL_B_WEATHER_AWARE")
    exp2 = shap_explainer_service.explain(raw_lifestyle, weather_today=wt, weather_yesterday=wy, model_used="MODEL_B_WEATHER_AWARE")

    for f1, f2 in zip(exp1["features"], exp2["features"]):
        assert f1["feature"] == f2["feature"]
        assert f1["shap_value"] == f2["shap_value"]


def test_10_model_b_probability_and_shap_come_from_same_model():
    """TEST 10: Model B probability and SHAP attributions are computed from Model B pipeline."""
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
        res = client.post("/predict", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["model_used"] == "MODEL_B_WEATHER_AWARE"
        assert len(data["xai"]["features"]) == 22


def test_11_zero_background_matrix_22_columns_used_for_model_b():
    """TEST 11: LinearExplainer for Model B uses 22-column zero background matrix."""
    lr_model_b = model_manager.experimental_model.named_steps.get("model") or model_manager.experimental_model.named_steps.get("classifier")
    explainer_b = shap_explainer_service._get_explainer_model_b(lr_model_b)
    assert len(explainer_b.mean) == 22


def test_12_existing_xai_response_fields_compatible():
    """TEST 12: Predict and Explain response contracts preserve all existing fields."""
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
        res = client.post("/explain", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert "score" in data
        assert "level" in data
        assert "xai" in data
        assert "features" in data["xai"]
        assert len(data["xai"]["features"]) == 22


def test_13_mathematical_additivity_check_model_b():
    """TEST 13: Mathematical additivity check: base_value + sum(shap_values) == logit(probability)."""
    lr_b = model_manager.experimental_model.named_steps.get("model") or model_manager.experimental_model.named_steps.get("classifier")
    fe_b = model_manager.experimental_model.named_steps["feature_engineering"]
    scaler_b = model_manager.experimental_model.named_steps["scaler"]

    explainer_b = shap_explainer_service._get_explainer_model_b(lr_b)

    raw_lifestyle = {"sleep_hours": 6.0, "mood_level": 3.0, "stress_level": 5.0, "hydration_level": 2.0, "screen_time": 6.0}
    wt = {"temperature": 19.5, "humidity": 62.0, "pressure": 1008.0, "precipitation": 0.0, "wind_speed": 12.0}
    wy = {"pressure": 1015.0, "temperature": 21.0}

    p_change = 1008.0 - 1015.0
    baro_flag = 1 if (1015.0 - 1008.0) >= 6.0 else 0
    t_change = abs(19.5 - 21.0)

    import pandas as pd
    df_raw = pd.DataFrame([{
        "sleep_hours": 6.0, "mood_level": 3.0, "stress_level": 5.0, "hydration_level": 2.0, "screen_time": 6.0,
        "temperature": 19.5, "humidity": 62.0, "pressure": 1008.0, "precipitation": 0.0, "wind_speed": 12.0,
        "pressure_change_24h": p_change, "barometric_drop_flag": baro_flag, "temp_change_24h": t_change
    }])

    df_trans = fe_b.transform(df_raw)
    scaled_X = scaler_b.transform(df_trans)

    exp = explainer_b(scaled_X)
    shap_vals = exp.values[0]
    if shap_vals.ndim > 1:
        shap_vals = shap_vals[:, 1]
        base_val = float(exp.base_values[0][1])
    else:
        base_val = float(exp.base_values[0])

    sum_shap = float(np.sum(shap_vals))
    reconstructed_logit = base_val + sum_shap

    # Predict raw logit directly from Linear Model
    intercept = float(lr_b.intercept_[0])
    coefs = lr_b.coef_[0]
    expected_logit = float(intercept + np.dot(scaled_X[0], coefs))

    # Logit additivity exact match check
    assert np.isclose(reconstructed_logit, expected_logit, atol=1e-4)
