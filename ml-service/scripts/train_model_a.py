import os
import sys
from pathlib import Path
import pandas as pd
import numpy as np
import joblib
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

BASE_DIR = Path(r"e:\Migraine_Guardian\ml-service")
sys.path.insert(0, str(BASE_DIR))

from app.services.feature_engineering import MigraineFeatureEngineer

data_path = BASE_DIR / "migraine_dataset (1).csv"
if not data_path.exists():
    data_path = BASE_DIR / "data" / "real_migraine_dataset.csv"

print(f"Loading real dataset from: {data_path}")
df = pd.read_csv(data_path)
print(f"Dataset shape: {df.shape}")

raw_features = ["sleep_hours", "mood_level", "stress_level", "hydration_level", "screen_time"]
target = "migraine_occurrence"

# Construct 11-feature pipeline
pipeline = Pipeline([
    ("feature_engineering", MigraineFeatureEngineer()),
    ("scaler", StandardScaler()),
    ("model", LogisticRegression(class_weight="balanced", max_iter=1000, random_state=42))
])

# Fit on entire real dataset (11,879 rows)
print("Training final Model A pipeline on all real data...")
pipeline.fit(df[raw_features], df[target])

models_dir = BASE_DIR / "app" / "models"
models_dir.mkdir(parents=True, exist_ok=True)

primary_path = models_dir / "model_a_final_pipeline.pkl"
compat_path = models_dir / "migraine_pipeline.pkl"

joblib.dump(pipeline, primary_path)
joblib.dump(pipeline, compat_path)

print(f"Model saved to primary path: {primary_path} (Size: {os.path.getsize(primary_path)} bytes)")
print(f"Model saved to compatibility path: {compat_path} (Size: {os.path.getsize(compat_path)} bytes)")

# Reload and test inference
reloaded = joblib.load(primary_path)
test_sample = pd.DataFrame([{
    "sleep_hours": 7.0,
    "mood_level": 4.0,
    "stress_level": 2.0,
    "hydration_level": 3.0,
    "screen_time": 6.0
}])

pred = reloaded.predict(test_sample)[0]
probs = reloaded.predict_proba(test_sample)[0]
print(f"Reload Smoke Test -> Prediction: {pred}, Proba (Class 0, Class 1): {probs}")
print("Training and serialization completed successfully!")
