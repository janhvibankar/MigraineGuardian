import json
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

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
print("Manual Prediction Test on Sample Payload")
print("-------------------------------------------------------\n")

print("Sample Payload:")
print(json.dumps(sample_payload, indent=2))

with TestClient(app) as test_client:
    response = test_client.post("/predict", json=sample_payload)
    print("\nAPI Response Status:", response.status_code)
    print("API Response Body:")
    print(json.dumps(response.json(), indent=2))
print("-------------------------------------------------------\n")
