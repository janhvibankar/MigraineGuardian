import sys
from fastapi.testclient import TestClient
from app.main import app

def test_fastapi_health():
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        print("1. FastAPI Health: PASS")

def test_model_a():
    with TestClient(app) as client:
        payload = {
            "user_id": "test_user_001",
            "latest_log": {
                "sleep_hours": 7.0,
                "sleep_quality": 5,
                "daily_stress": 4,
                "mood": 5,
                "screen_time": 4.0,
                "hydration": 2.0
            },
            "sleep_hours": 7.0,
            "mood_level": 5,
            "stress_level": 4,
            "hydration_level": 2.0,
            "screen_time": 4.0
        }
        response = client.post("/predict", json=payload)
        if response.status_code != 200:
            print(f"Model A Failed: {response.text}")
        assert response.status_code == 200
        data = response.json()
        assert data["score"] >= 0 and data["score"] <= 100
        assert data["model_used"] == "MODEL_A_LIFESTYLE_BASELINE"
        assert len(data["xai"]["features"]) == 12
        print("2. Model A End-to-End: PASS")

def test_model_b():
    with TestClient(app) as client:
        payload = {
            "user_id": "test_user_001",
            "latest_log": {
                "sleep_hours": 7.0,
                "sleep_quality": 5,
                "daily_stress": 4,
                "mood": 5,
                "screen_time": 4.0,
                "hydration": 2.0
            },
            "sleep_hours": 7.0,
            "mood_level": 5,
            "stress_level": 4,
            "hydration_level": 2.0,
            "screen_time": 4.0,
            "weather_today": {
                "temperature": 25.0,
                "humidity": 60.0,
                "pressure": 1010.0,
                "precipitation": 0.0,
                "wind_speed": 10.0,
                "date": "2023-08-20"
            },
            "weather_yesterday": {
                "temperature": 27.0,
                "humidity": 50.0,
                "pressure": 1018.0,
                "precipitation": 0.0,
                "wind_speed": 5.0,
                "date": "2023-08-19"
            }
        }
        response = client.post("/predict", json=payload)
        if response.status_code != 200:
            print(f"Model B Failed: {response.text}")
        assert response.status_code == 200
        data = response.json()
        assert data["score"] >= 0 and data["score"] <= 100
        assert data["model_used"] == "MODEL_B_WEATHER_AWARE"
        assert len(data["xai"]["features"]) == 22
        
        feature_names = [f["feature"] for f in data["xai"]["features"]]
        assert "pressure_change_24h" in feature_names
        assert "barometric_drop_flag" in feature_names
        assert "temp_change_24h" in feature_names
        assert "pressure_stress_interaction" in feature_names
        print("3. Model B End-to-End: PASS")

def test_weather_fallback():
    with TestClient(app) as client:
        payload = {
            "user_id": "test_user_001",
            "latest_log": {
                "sleep_hours": 7.0,
                "sleep_quality": 5,
                "daily_stress": 4,
                "mood": 5,
                "screen_time": 4.0,
                "hydration": 2.0
            },
            "sleep_hours": 7.0,
            "mood_level": 5,
            "stress_level": 4,
            "hydration_level": 2.0,
            "screen_time": 4.0,
            "weather_today": {
                "temperature": 25.0,
                "humidity": 60.0,
                "pressure": 1010.0,
                "precipitation": 0.0,
                "wind_speed": 10.0,
                "date": "2023-08-20"
            }
        }
        # Missing yesterday
        response = client.post("/predict", json=payload)
        if response.status_code != 200:
            print(f"Fallback Failed: {response.text}")
        data = response.json()
        assert data["model_used"] == "MODEL_A_LIFESTYLE_BASELINE"
        assert len(data["xai"]["features"]) == 12
        print("4. Weather Fallback: PASS")

def main():
    try:
        test_fastapi_health()
        test_model_a()
        test_model_b()
        test_weather_fallback()
        print("ALL TESTS PASSED")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"FAILED: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
