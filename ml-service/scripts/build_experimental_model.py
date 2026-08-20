import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import GroupShuffleSplit
from sklearn.metrics import roc_auc_score, brier_score_loss, f1_score, precision_recall_curve, auc

try:
    import shap
    HAS_SHAP = True
except ImportError:
    HAS_SHAP = False

SEED = 42
np.random.seed(SEED)


# =====================================================================
# ISOLATED RESEARCH FEATURE TRANSFORMER
# =====================================================================

class ExperimentalWeatherFeatureEngineer(BaseEstimator, TransformerMixin):
    """
    Research-only 22-feature engineering transformer.
    Computes lifestyle, weather, and interaction features in exact order.
    """

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = X.copy()

        # 1. Engineered Lifestyle
        X["stress_sleep_ratio"] = X["stress_level"] / (X["sleep_hours"] + 1.0)
        X["screen_stress"] = X["screen_time"] * X["stress_level"]
        X["hydration_sleep"] = X["hydration_level"] * X["sleep_hours"]
        X["sleep_deficit"] = (7.0 - X["sleep_hours"]).clip(lower=0)
        X["hydration_deficit"] = (3.0 - X["hydration_level"]).clip(lower=0)
        X["stress_mood_interaction"] = X["stress_level"] * (6.0 - X["mood_level"])
        X["screen_sleep_ratio"] = X["screen_time"] / (X["sleep_hours"] + 1.0)

        # 2. Weather Lags & Interactions
        if "pressure_change_24h" not in X.columns:
            X["pressure_change_24h"] = 0.0
        if "barometric_drop_flag" not in X.columns:
            X["barometric_drop_flag"] = 0
        if "temp_change_24h" not in X.columns:
            X["temp_change_24h"] = 0.0

        X["pressure_stress_interaction"] = X["barometric_drop_flag"] * X["stress_level"]
        X["sleep_weather_vulnerability"] = X["sleep_deficit"] * X["barometric_drop_flag"]

        cols = [
            "sleep_hours", "mood_level", "stress_level", "hydration_level", "screen_time",
            "stress_sleep_ratio", "screen_stress", "hydration_sleep", "sleep_deficit",
            "hydration_deficit", "stress_mood_interaction", "screen_sleep_ratio",
            "temperature", "humidity", "pressure", "precipitation", "wind_speed",
            "pressure_change_24h", "barometric_drop_flag", "temp_change_24h",
            "pressure_stress_interaction", "sleep_weather_vulnerability",
        ]
        return X[cols]


# Register in sys.modules & __main__ so joblib unpickling works cleanly
import __main__
__main__.ExperimentalWeatherFeatureEngineer = ExperimentalWeatherFeatureEngineer
if 'build_experimental_model' not in sys.modules:
    sys.modules['build_experimental_model'] = sys.modules[__name__]


class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (np.integer, int)):
            return int(obj)
        elif isinstance(obj, (np.floating, float)):
            return float(obj)
        elif isinstance(obj, (np.bool_, bool)):
            return bool(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NumpyEncoder, self).default(obj)


# =====================================================================
# FEATURE SCHEMA DEFINITION (TASK 4)
# =====================================================================

FEATURE_SCHEMA_LIST = [
    {"order": 1, "name": "sleep_hours", "category": "Lifestyle", "type": "raw", "data_type": "float", "unit": "hours", "description": "Self-reported sleep duration"},
    {"order": 2, "name": "mood_level", "category": "Lifestyle", "type": "raw", "data_type": "float", "unit": "scale (1-5)", "description": "Self-reported mood rating"},
    {"order": 3, "name": "stress_level", "category": "Lifestyle", "type": "raw", "data_type": "float", "unit": "scale (0-10)", "description": "Self-reported daily stress level"},
    {"order": 4, "name": "hydration_level", "category": "Lifestyle", "type": "raw", "data_type": "float", "unit": "litres", "description": "Self-reported fluid intake"},
    {"order": 5, "name": "screen_time", "category": "Lifestyle", "type": "raw", "data_type": "float", "unit": "hours", "description": "Daily screen exposure duration"},
    {"order": 6, "name": "stress_sleep_ratio", "category": "Lifestyle", "type": "engineered", "data_type": "float", "unit": "ratio", "description": "stress_level / (sleep_hours + 1)"},
    {"order": 7, "name": "screen_stress", "category": "Lifestyle", "type": "engineered", "data_type": "float", "unit": "interaction", "description": "screen_time * stress_level"},
    {"order": 8, "name": "hydration_sleep", "category": "Lifestyle", "type": "engineered", "data_type": "float", "unit": "interaction", "description": "hydration_level * sleep_hours"},
    {"order": 9, "name": "sleep_deficit", "category": "Lifestyle", "type": "engineered", "data_type": "float", "unit": "hours", "description": "max(0, 7.0 - sleep_hours)"},
    {"order": 10, "name": "hydration_deficit", "category": "Lifestyle", "type": "engineered", "data_type": "float", "unit": "litres", "description": "max(0, 3.0 - hydration_level)"},
    {"order": 11, "name": "stress_mood_interaction", "category": "Lifestyle", "type": "engineered", "data_type": "float", "unit": "interaction", "description": "stress_level * (6.0 - mood_level)"},
    {"order": 12, "name": "screen_sleep_ratio", "category": "Lifestyle", "type": "engineered", "data_type": "float", "unit": "ratio", "description": "screen_time / (sleep_hours + 1)"},
    {"order": 13, "name": "temperature", "category": "Weather", "type": "raw", "data_type": "float", "unit": "°C", "description": "Ambient mean temperature"},
    {"order": 14, "name": "humidity", "category": "Weather", "type": "raw", "data_type": "float", "unit": "%", "description": "Relative humidity percentage"},
    {"order": 15, "name": "pressure", "category": "Weather", "type": "raw", "data_type": "float", "unit": "hPa", "description": "Sea-level atmospheric pressure"},
    {"order": 16, "name": "precipitation", "category": "Weather", "type": "raw", "data_type": "float", "unit": "mm", "description": "Daily rainfall/snowfall"},
    {"order": 17, "name": "wind_speed", "category": "Weather", "type": "raw", "data_type": "float", "unit": "km/h", "description": "Wind velocity"},
    {"order": 18, "name": "pressure_change_24h", "category": "Weather", "type": "engineered", "data_type": "float", "unit": "hPa", "description": "24h barometric pressure delta (P_t - P_{t-1})"},
    {"order": 19, "name": "barometric_drop_flag", "category": "Weather", "type": "engineered", "data_type": "int", "unit": "binary (0/1)", "description": "Indicator flag if pressure dropped >= 6 hPa in 24h"},
    {"order": 20, "name": "temp_change_24h", "category": "Weather", "type": "engineered", "data_type": "float", "unit": "°C", "description": "24h absolute temperature delta (|T_t - T_{t-1}|)"},
    {"order": 21, "name": "pressure_stress_interaction", "category": "Interaction", "type": "engineered", "data_type": "float", "unit": "interaction", "description": "barometric_drop_flag * stress_level"},
    {"order": 22, "name": "sleep_weather_vulnerability", "category": "Interaction", "type": "engineered", "data_type": "float", "unit": "interaction", "description": "sleep_deficit * barometric_drop_flag"},
]


def main():
    print("=" * 70)
    print("MigraineGuardian - Build Experimental Weather Model Artifact")
    print("=" * 70)

    base_dir = os.path.dirname(__file__)
    csv_path = os.path.abspath(os.path.join(base_dir, "..", "data", "raw", "synthetic_migraine_weather_dataset.csv"))
    models_dir = os.path.abspath(os.path.join(base_dir, "..", "data", "models"))
    reports_dir = os.path.abspath(os.path.join(base_dir, "..", "data", "reports"))

    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(reports_dir, exist_ok=True)

    artifact_pkl_path = os.path.join(models_dir, "migraine_weather_pipeline_experimental.pkl")
    schema_json_path = os.path.join(reports_dir, "weather_model_feature_schema.json")
    metadata_json_path = os.path.join(reports_dir, "weather_model_metadata.json")

    # Verify Production Protection
    prod_pkl_path = os.path.abspath(os.path.join(base_dir, "..", "app", "models", "migraine_pipeline.pkl"))
    if os.path.abspath(artifact_pkl_path) == prod_pkl_path:
        print("ERROR: Target path matches production pipeline artifact! Aborting.")
        sys.exit(1)

    # 1. Load Dataset
    df = pd.read_csv(csv_path)
    print(f"\n[1] Loaded Dataset: {len(df)} rows, {df['user_id'].nunique()} users")

    y = df["migraine_occurrence"].values
    groups = df["user_id"].values
    X = df.drop(columns=["migraine_occurrence"])

    # 2. Group-Aware Train / Test Split
    gss = GroupShuffleSplit(n_splits=1, test_size=0.20, random_state=SEED)
    train_idx, test_idx = next(gss.split(X, y, groups))

    X_train, X_test = X.iloc[train_idx].copy(), X.iloc[test_idx].copy()
    y_train, y_test = y[train_idx], y[test_idx]

    # 3. Build & Fit Experimental Pipeline
    print("\n[2] Training 22-Feature Experimental Model B...")
    pipeline = Pipeline([
        ("feature_engineering", ExperimentalWeatherFeatureEngineer()),
        ("scaler", StandardScaler()),
        ("classifier", LogisticRegression(penalty="l2", C=1.0, class_weight="balanced", random_state=SEED, max_iter=2000)),
    ])

    pipeline.fit(X_train, y_train)

    test_prob = pipeline.predict_proba(X_test)[:, 1]
    test_roc_auc = float(roc_auc_score(y_test, test_prob))
    test_brier = float(brier_score_loss(y_test, test_prob))

    print(f"    Training Complete. Test ROC-AUC: {test_roc_auc:.4f} | Brier: {test_brier:.4f}")

    # 4. Save Experimental Artifact (TASK 3)
    joblib.dump(pipeline, artifact_pkl_path)
    print(f"\n[3] Experimental Model Artifact Saved To:\n    {artifact_pkl_path}")

    # 5. Save Feature Schema (TASK 4)
    schema_payload = {
        "version": "2.0.0-experimental",
        "feature_count": len(FEATURE_SCHEMA_LIST),
        "features": FEATURE_SCHEMA_LIST,
    }
    with open(schema_json_path, "w") as f:
        json.dump(schema_payload, f, indent=2)
    print(f"\n[4] Feature Schema Saved To:\n    {schema_json_path}")

    # 6. Save Model Metadata (TASK 5)
    metadata_payload = {
        "model_name": "MigraineGuardian Experimental Weather-Aware Pipeline",
        "version": "2.0.0-experimental",
        "saved_artifact_path": artifact_pkl_path,
        "created_at": datetime.now().isoformat(),
        "random_seed": SEED,
        "feature_count": len(FEATURE_SCHEMA_LIST),
        "feature_names": [f["name"] for f in FEATURE_SCHEMA_LIST],
        "training_dataset": {
            "source_file": csv_path,
            "total_records": len(df),
            "total_users": df["user_id"].nunique(),
            "training_records": len(X_train),
            "testing_records": len(X_test),
            "train_users_count": len(set(groups[train_idx])),
            "test_users_count": len(set(groups[test_idx])),
        },
        "model_architecture": {
            "feature_engineer": "ExperimentalWeatherFeatureEngineer",
            "scaler": "StandardScaler",
            "classifier": "LogisticRegression(penalty='l2', C=1.0, class_weight='balanced')",
        },
        "performance_metrics": {
            "test_roc_auc": round(test_roc_auc, 4),
            "test_brier_score": round(test_brier, 4),
        },
        "disclaimer": "This experimental model is trained on synthetic data for research evaluation. It is NOT clinically validated and MUST NOT be deployed to production.",
    }
    with open(metadata_json_path, "w") as f:
        json.dump(metadata_payload, f, cls=NumpyEncoder, indent=2)
    print(f"\n[5] Model Metadata Saved To:\n    {metadata_json_path}")

    # 7. Independent Model Verification (TASK 6)
    print("\n[6] Running Independent Reload & Load Test from Disk...")
    reloaded_model = joblib.load(artifact_pkl_path)
    
    sample_test_row = X_test.iloc[[0]].copy()
    sample_pred_prob = float(reloaded_model.predict_proba(sample_test_row)[0, 1])
    sample_pred_prob_2 = float(reloaded_model.predict_proba(sample_test_row)[0, 1])

    is_deterministic = (sample_pred_prob == sample_pred_prob_2)
    is_valid_prob = (0.0 <= sample_pred_prob <= 1.0)
    
    fe_step = reloaded_model.named_steps["feature_engineering"]
    transformed_sample = fe_step.transform(sample_test_row)
    feature_count_matches = (transformed_sample.shape[1] == len(FEATURE_SCHEMA_LIST))

    print(f"    Artifact Loaded Successfully: True")
    print(f"    Sample Test Prediction Risk Score: {sample_pred_prob * 100:.2f}%")
    print(f"    Probability in [0.0, 1.0]: {is_valid_prob}")
    print(f"    Deterministic Output: {is_deterministic}")
    print(f"    Transformed Feature Count: {transformed_sample.shape[1]} (Matches Schema: {feature_count_matches})")

    if not (is_valid_prob and is_deterministic and feature_count_matches):
        print("ERROR: Independent model verification failed!")
        sys.exit(1)

    # 8. SHAP Compatibility Test (TASK 7)
    print("\n[7] Running SHAP Compatibility Test...")
    shap_results = {}
    if HAS_SHAP:
        try:
            # Transform background training set and test sample through pipeline up to scaler
            scaler = reloaded_model.named_steps["scaler"]
            clf = reloaded_model.named_steps["classifier"]

            X_tr_transformed = fe_step.transform(X_train)
            X_tr_scaled = scaler.transform(X_tr_transformed)

            X_sample_transformed = fe_step.transform(sample_test_row)
            X_sample_scaled = scaler.transform(X_sample_transformed)

            explainer = shap.LinearExplainer(clf, X_tr_scaled, feature_names=list(X_sample_transformed.columns))
            shap_values = explainer.shap_values(X_sample_scaled)

            # Map features to categories
            shap_sample = shap_values[0] if isinstance(shap_values, list) else shap_values[0]
            feature_names = list(X_sample_transformed.columns)

            lifestyle_shap = sum(abs(shap_sample[i]) for i, name in enumerate(feature_names) if name in [f["name"] for f in FEATURE_SCHEMA_LIST if f["category"] == "Lifestyle"])
            weather_shap = sum(abs(shap_sample[i]) for i, name in enumerate(feature_names) if name in [f["name"] for f in FEATURE_SCHEMA_LIST if f["category"] == "Weather"])
            interaction_shap = sum(abs(shap_sample[i]) for i, name in enumerate(feature_names) if name in [f["name"] for f in FEATURE_SCHEMA_LIST if f["category"] == "Interaction"])

            shap_results = {
                "shap_compatible": True,
                "explainer": "shap.LinearExplainer",
                "sample_predicted_risk": round(sample_pred_prob * 100, 2),
                "total_lifestyle_abs_shap": round(float(lifestyle_shap), 4),
                "total_weather_abs_shap": round(float(weather_shap), 4),
                "total_interaction_abs_shap": round(float(interaction_shap), 4),
                "top_3_contributing_features": [
                    {"feature": feature_names[idx], "shap_val": round(float(shap_sample[idx]), 4)}
                    for idx in np.argsort(abs(shap_sample))[::-1][:3]
                ],
            }
            print(f"    SHAP Compatibility: SUCCESS")
            print(f"    Lifestyle SHAP Magnitude: {lifestyle_shap:.4f}")
            print(f"    Weather SHAP Magnitude:   {weather_shap:.4f}")
            print(f"    Interaction SHAP Magnitude: {interaction_shap:.4f}")
        except Exception as e:
            shap_results = {"shap_compatible": False, "error": str(e)}
            print(f"    SHAP Compatibility Test Warning: {e}")
    else:
        shap_results = {"shap_compatible": False, "note": "shap library not installed"}
        print("    SHAP package not installed. Skipping SHAP test.")

    print("\n" + "=" * 70)
    print("EXPERIMENTAL ARTIFACT BUILD COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    main()
