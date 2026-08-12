import json
from fastapi.testclient import TestClient
from app.main import app

sample_payload = {
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

print("\n-------------------------------------------------------")
print("Manual Prediction & XAI Verification Test")
print("-------------------------------------------------------\n")
print("Sample Payload:")
print(json.dumps(sample_payload, indent=2))

with TestClient(app) as test_client:
    # 1. Test POST /predict
    pred_res = test_client.post("/predict", json=sample_payload)
    print("\n--- 1. POST /predict Response (Status:", pred_res.status_code, ") ---")
    print(json.dumps(pred_res.json(), indent=2))

    # 2. Test POST /explain
    explain_res = test_client.post("/explain", json=sample_payload)
    print("\n--- 2. POST /explain Response (Status:", explain_res.status_code, ") ---")
    print(json.dumps(explain_res.json(), indent=2))

print("\n-------------------------------------------------------")
