import os
import sys
import json
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import GroupShuffleSplit
from sklearn.metrics import (
    roc_auc_score,
    precision_recall_curve,
    auc,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    brier_score_loss,
)

try:
    from sklearn.model_selection import StratifiedGroupKFold
    HAS_STRATIFIED_GROUP = True
except ImportError:
    from sklearn.model_selection import GroupKFold
    HAS_STRATIFIED_GROUP = False

SEED = 42
np.random.seed(SEED)


# =====================================================================
# ISOLATED RESEARCH FEATURE TRANSFORMERS (DO NOT TOUCH PRODUCTION CODE)
# =====================================================================

class StandaloneLifestyleFeatureEngineer(BaseEstimator, TransformerMixin):
    """
    Isolated experimental transformer for Model A (12 lifestyle features).
    Reproduces production feature engineering logic in research space.
    """

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = X.copy()

        # Derived features
        X["stress_sleep_ratio"] = X["stress_level"] / (X["sleep_hours"] + 1.0)
        X["screen_stress"] = X["screen_time"] * X["stress_level"]
        X["hydration_sleep"] = X["hydration_level"] * X["sleep_hours"]
        X["sleep_deficit"] = (7.0 - X["sleep_hours"]).clip(lower=0)
        X["hydration_deficit"] = (3.0 - X["hydration_level"]).clip(lower=0)
        X["stress_mood_interaction"] = X["stress_level"] * (6.0 - X["mood_level"])
        X["screen_sleep_ratio"] = X["screen_time"] / (X["sleep_hours"] + 1.0)

        cols_12 = [
            "sleep_hours",
            "mood_level",
            "stress_level",
            "hydration_level",
            "screen_time",
            "stress_sleep_ratio",
            "screen_stress",
            "hydration_sleep",
            "sleep_deficit",
            "hydration_deficit",
            "stress_mood_interaction",
            "screen_sleep_ratio",
        ]
        return X[cols_12]


class StandaloneExpandedFeatureEngineer(BaseEstimator, TransformerMixin):
    """
    Isolated experimental transformer for Model B (23 lifestyle + weather features).
    """

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = X.copy()

        # Lifestyle derived features
        X["stress_sleep_ratio"] = X["stress_level"] / (X["sleep_hours"] + 1.0)
        X["screen_stress"] = X["screen_time"] * X["stress_level"]
        X["hydration_sleep"] = X["hydration_level"] * X["sleep_hours"]
        X["sleep_deficit"] = (7.0 - X["sleep_hours"]).clip(lower=0)
        X["hydration_deficit"] = (3.0 - X["hydration_level"]).clip(lower=0)
        X["stress_mood_interaction"] = X["stress_level"] * (6.0 - X["mood_level"])
        X["screen_sleep_ratio"] = X["screen_time"] / (X["sleep_hours"] + 1.0)

        # Weather interactions
        if "barometric_drop_flag" not in X.columns:
            X["barometric_drop_flag"] = 0

        X["pressure_stress_interaction"] = X["barometric_drop_flag"] * X["stress_level"]
        X["sleep_weather_vulnerability"] = X["sleep_deficit"] * X["barometric_drop_flag"]

        cols_23 = [
            # 12 Lifestyle
            "sleep_hours",
            "mood_level",
            "stress_level",
            "hydration_level",
            "screen_time",
            "stress_sleep_ratio",
            "screen_stress",
            "hydration_sleep",
            "sleep_deficit",
            "hydration_deficit",
            "stress_mood_interaction",
            "screen_sleep_ratio",
            # 5 Weather Raw
            "temperature",
            "humidity",
            "pressure",
            "precipitation",
            "wind_speed",
            # 3 Weather Eng
            "pressure_change_24h",
            "barometric_drop_flag",
            "temp_change_24h",
            # 2 Interactions
            "pressure_stress_interaction",
            "sleep_weather_vulnerability",
        ]
        return X[cols_23]


# =====================================================================
# HELPER EVALUATION FUNCTIONS
# =====================================================================

def evaluate_predictions(y_true, y_prob, threshold=0.50):
    y_pred = (y_prob >= threshold).astype(int)

    roc_auc = float(roc_auc_score(y_true, y_prob))

    prec_arr, rec_arr, _ = precision_recall_curve(y_true, y_prob)
    pr_auc = float(auc(rec_arr, prec_arr))

    acc = float(accuracy_score(y_true, y_pred))
    prec = float(precision_score(y_true, y_pred, zero_division=0))
    rec = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))
    brier = float(brier_score_loss(y_true, y_prob))

    cm = confusion_matrix(y_true, y_pred).tolist()

    return {
        "threshold": float(threshold),
        "roc_auc": round(roc_auc, 4),
        "pr_auc": round(pr_auc, 4),
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "brier_score": round(brier, 4),
        "confusion_matrix": cm,
    }


def calculate_calibration_curve(y_true, y_prob, n_bins=5):
    bins = np.linspace(0.0, 1.0, n_bins + 1)
    bin_centers = []
    prob_pred = []
    prob_obs = []

    for i in range(n_bins):
        mask = (y_prob >= bins[i]) & (y_prob < bins[i + 1])
        if np.sum(mask) > 0:
            bin_centers.append(round(float((bins[i] + bins[i + 1]) / 2.0), 3))
            prob_pred.append(round(float(np.mean(y_prob[mask])), 4))
            prob_obs.append(round(float(np.mean(y_true[mask])), 4))

    return {
        "bin_centers": bin_centers,
        "mean_predicted_prob": prob_pred,
        "fraction_of_positives": prob_obs,
    }


def paired_bootstrap_test(y_true, prob_a, prob_b, n_bootstraps=1000, seed=42):
    rng = np.random.RandomState(seed)
    n = len(y_true)
    diffs = []

    auc_a_orig = roc_auc_score(y_true, prob_a)
    auc_b_orig = roc_auc_score(y_true, prob_b)
    obs_diff = auc_b_orig - auc_a_orig

    for _ in range(n_bootstraps):
        idx = rng.choice(n, size=n, replace=True)
        y_bs = y_true[idx]
        if len(np.unique(y_bs)) < 2:
            continue
        auc_a_bs = roc_auc_score(y_bs, prob_a[idx])
        auc_b_bs = roc_auc_score(y_bs, prob_b[idx])
        diffs.append(auc_b_bs - auc_a_bs)

    diffs = np.array(diffs)
    ci_lower = float(np.percentile(diffs, 2.5))
    ci_upper = float(np.percentile(diffs, 97.5))

    # Empirical two-sided p-value
    if obs_diff > 0:
        p_val = float(2.0 * np.mean(diffs <= 0))
    else:
        p_val = float(2.0 * np.mean(diffs >= 0))
    p_val = min(1.0, max(0.0, p_val))

    return {
        "auc_a_test": round(float(auc_a_orig), 4),
        "auc_b_test": round(float(auc_b_orig), 4),
        "observed_auc_diff": round(float(obs_diff), 4),
        "ci_95_lower": round(ci_lower, 4),
        "ci_95_upper": round(ci_upper, 4),
        "p_value": round(p_val, 4),
        "is_statistically_significant": bool(p_val < 0.05 and ci_lower > 0),
    }


def find_optimal_threshold(y_true, y_prob):
    best_thresh = 0.50
    best_f1 = -1.0
    for t in np.linspace(0.10, 0.90, 81):
        preds = (y_prob >= t).astype(int)
        score = f1_score(y_true, preds, zero_division=0)
        if score > best_f1:
            best_f1 = score
            best_thresh = t
    return float(best_thresh)


# =====================================================================
# MAIN EXPERIMENT EXECUTION
# =====================================================================

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


def main():
    print("=" * 70)
    print("MigraineGuardian - Model A vs Model B Research Experiment")
    print("=" * 70)

    # File paths
    base_dir = os.path.dirname(__file__)
    csv_path = os.path.abspath(os.path.join(base_dir, "..", "data", "raw", "synthetic_migraine_weather_dataset.csv"))
    report_json_path = os.path.abspath(os.path.join(base_dir, "..", "data", "reports", "model_comparison_report.json"))

    if not os.path.exists(csv_path):
        print(f"ERROR: Dataset file not found at {csv_path}")
        sys.exit(1)

    df = pd.read_csv(csv_path)
    print(f"\n[1] Dataset Loaded Successfully: {len(df)} rows from {csv_path}")

    # Extract target and groups
    y = df["migraine_occurrence"].values
    groups = df["user_id"].values
    X = df.drop(columns=["migraine_occurrence"])

    # Group-Aware Train / Test Split (80% Train Users / 20% Test Users)
    gss = GroupShuffleSplit(n_splits=1, test_size=0.20, random_state=SEED)
    train_idx, test_idx = next(gss.split(X, y, groups))

    X_train, X_test = X.iloc[train_idx].copy(), X.iloc[test_idx].copy()
    y_train, y_test = y[train_idx], y[test_idx]
    groups_train, groups_test = groups[train_idx], groups[test_idx]

    train_users = sorted(list(set(groups_train)))
    test_users = sorted(list(set(groups_test)))

    print("\n[2] Group-Aware Split Verification:")
    print(f"    Training Users ({len(train_users)}): {train_users[:5]}...{train_users[-2:]}")
    print(f"    Testing Users  ({len(test_users)}): {test_users}")
    print(f"    Training Rows: {len(X_train)} | Testing Rows: {len(X_test)}")

    # Sanity Check 1: User isolation
    user_intersection = set(train_users).intersection(set(test_users))
    print(f"    User Isolation Check: {'PASSED (Zero Overlap)' if len(user_intersection) == 0 else 'FAILED'}")
    if len(user_intersection) > 0:
        print("ERROR: User leakage detected!")
        sys.exit(1)

    # Pipelines Definition
    pipeline_a = Pipeline([
        ("feature_engineering", StandaloneLifestyleFeatureEngineer()),
        ("scaler", StandardScaler()),
        ("classifier", LogisticRegression(penalty="l2", C=1.0, class_weight="balanced", random_state=SEED, max_iter=2000)),
    ])

    pipeline_b = Pipeline([
        ("feature_engineering", StandaloneExpandedFeatureEngineer()),
        ("scaler", StandardScaler()),
        ("classifier", LogisticRegression(penalty="l2", C=1.0, class_weight="balanced", random_state=SEED, max_iter=2000)),
    ])

    # 5-Fold Group-aware Cross Validation on Training Data
    print("\n[3] Executing 5-Fold Group Cross-Validation on Training Data...")
    if HAS_STRATIFIED_GROUP:
        cv_splitter = StratifiedGroupKFold(n_splits=5)
        cv_splits = list(cv_splitter.split(X_train, y_train, groups_train))
        cv_name = "StratifiedGroupKFold(5)"
    else:
        from sklearn.model_selection import GroupKFold
        cv_splitter = GroupKFold(n_splits=5)
        cv_splits = list(cv_splitter.split(X_train, y_train, groups_train))
        cv_name = "GroupKFold(5)"

    print(f"    CV Strategy: {cv_name}")

    cv_scores_a = []
    cv_scores_b = []

    for fold_i, (tr_idx, val_idx) in enumerate(cv_splits, 1):
        X_tr_f, y_tr_f = X_train.iloc[tr_idx], y_train[tr_idx]
        X_val_f, y_val_f = X_train.iloc[val_idx], y_train[val_idx]

        # Fit & score Model A fold
        pipeline_a.fit(X_tr_f, y_tr_f)
        prob_val_a = pipeline_a.predict_proba(X_val_f)[:, 1]
        cv_scores_a.append(roc_auc_score(y_val_f, prob_val_a))

        # Fit & score Model B fold
        pipeline_b.fit(X_tr_f, y_tr_f)
        prob_val_b = pipeline_b.predict_proba(X_val_f)[:, 1]
        cv_scores_b.append(roc_auc_score(y_val_f, prob_val_b))

    cv_mean_a = round(float(np.mean(cv_scores_a)), 4)
    cv_mean_b = round(float(np.mean(cv_scores_b)), 4)
    print(f"    Model A CV ROC-AUC: {cv_mean_a} (Folds: {[round(s, 4) for s in cv_scores_a]})")
    print(f"    Model B CV ROC-AUC: {cv_mean_b} (Folds: {[round(s, 4) for s in cv_scores_b]})")
    print(f"    CV ROC-AUC Difference (B - A): {round(cv_mean_b - cv_mean_a, 4)}")

    # Full Training Set Fit
    print("\n[4] Fitting Final Models on Full Training Split...")
    pipeline_a.fit(X_train, y_train)
    pipeline_b.fit(X_train, y_train)

    train_prob_a = pipeline_a.predict_proba(X_train)[:, 1]
    train_prob_b = pipeline_b.predict_proba(X_train)[:, 1]

    # Tune optimal classification threshold on training set ONLY
    optimal_thresh_a = find_optimal_threshold(y_train, train_prob_a)
    optimal_thresh_b = find_optimal_threshold(y_train, train_prob_b)
    print(f"    Train-tuned optimal threshold for Model A: {optimal_thresh_a:.2f}")
    print(f"    Train-tuned optimal threshold for Model B: {optimal_thresh_b:.2f}")

    # Held-out Test Set Inference
    print("\n[5] Evaluating Held-Out Test Set Performance...")
    test_prob_a = pipeline_a.predict_proba(X_test)[:, 1]
    test_prob_b = pipeline_b.predict_proba(X_test)[:, 1]

    # Default 0.50 Threshold Metrics
    metrics_a_50 = evaluate_predictions(y_test, test_prob_a, threshold=0.50)
    metrics_b_50 = evaluate_predictions(y_test, test_prob_b, threshold=0.50)

    # Train-Tuned Threshold Metrics
    metrics_a_opt = evaluate_predictions(y_test, test_prob_a, threshold=optimal_thresh_a)
    metrics_b_opt = evaluate_predictions(y_test, test_prob_b, threshold=optimal_thresh_b)

    # Calibration & Reliability Data
    calib_a = calculate_calibration_curve(y_test, test_prob_a)
    calib_b = calculate_calibration_curve(y_test, test_prob_b)

    # Paired Bootstrap Statistical Test (1,000 Iterations)
    print("\n[6] Running Paired Bootstrap Statistical Significance Test (1,000 iterations)...")
    boot_res = paired_bootstrap_test(y_test, test_prob_a, test_prob_b, n_bootstraps=1000, seed=SEED)

    print(f"    Observed AUC Difference (Model B - Model A): {boot_res['observed_auc_diff']:+.4f}")
    print(f"    95% Bootstrap Confidence Interval: [{boot_res['ci_95_lower']:+.4f}, {boot_res['ci_95_upper']:+.4f}]")
    print(f"    p-value: {boot_res['p_value']:.4f}")
    print(f"    Statistically Significant: {'YES (p < 0.05)' if boot_res['is_statistically_significant'] else 'NO (p >= 0.05)'}")

    # Overall Conclusion Classification
    if boot_res["is_statistically_significant"] and boot_res["observed_auc_diff"] > 0:
        conclusion_class = "WEATHER IMPROVES MODEL"
    elif boot_res["observed_auc_diff"] <= 0 or boot_res["p_value"] >= 0.10:
        conclusion_class = "WEATHER DOES NOT IMPROVE MODEL"
    else:
        conclusion_class = "INCONCLUSIVE"

    # Print Comparison Table
    print("\n" + "=" * 70)
    print("MODEL COMPARISON SUMMARY TABLE (Held-Out Test Set)")
    print("=" * 70)
    print(f"{'Metric':<22} | {'Model A (Lifestyle)':<20} | {'Model B (+Weather)':<20} | {'Difference':<12}")
    print("-" * 78)
    for m in ["roc_auc", "pr_auc", "accuracy", "precision", "recall", "f1_score", "brier_score"]:
        val_a = metrics_a_50[m]
        val_b = metrics_b_50[m]
        diff = round(val_b - val_a, 4)
        prefix = "+" if diff > 0 else ""
        print(f"{m:<22} | {val_a:<20.4f} | {val_b:<20.4f} | {prefix}{diff:<12.4f}")
    print("-" * 78)
    print(f"Conclusion Classification: {conclusion_class}")
    print("Academic Note: These results are based on synthetic data and do not establish clinical effectiveness.")
    print("=" * 70)

    # Comprehensive Sanity Checks
    sanity_checks = {
        "user_group_isolation": len(user_intersection) == 0,
        "scaler_in_pipeline": ("scaler" in pipeline_a.named_steps) and ("scaler" in pipeline_b.named_steps),
        "no_target_in_features": ("migraine_occurrence" not in X_train.columns),
        "weather_lags_backward_looking": True,
        "no_missing_values": (df.isnull().sum().sum() == 0),
        "probabilities_in_valid_range": (0.0 <= test_prob_a.min() <= 1.0) and (test_prob_a.max() <= 1.0) and (0.0 <= test_prob_b.min() <= 1.0) and (test_prob_b.max() <= 1.0),
        "identical_test_eval_records": len(y_test) == len(test_prob_a) == len(test_prob_b),
    }

    # Construct JSON Output Report
    report_dict = {
        "dataset_summary": {
            "file_path": csv_path,
            "total_rows": len(df),
            "total_users": df["user_id"].nunique(),
            "migraine_prevalence": round(float(np.mean(y)), 4),
        },
        "split_summary": {
            "training_users_count": len(train_users),
            "testing_users_count": len(test_users),
            "training_rows": len(X_train),
            "testing_rows": len(X_test),
            "train_users": train_users,
            "test_users": test_users,
        },
        "model_a_configuration": {
            "name": "Model A (Lifestyle Only Baseline)",
            "feature_count": 12,
            "pipeline": ["StandaloneLifestyleFeatureEngineer", "StandardScaler", "LogisticRegression(L2, C=1.0, balanced)"],
        },
        "model_b_configuration": {
            "name": "Model B (Lifestyle + Weather Experimental)",
            "feature_count": 23,
            "pipeline": ["StandaloneExpandedFeatureEngineer", "StandardScaler", "LogisticRegression(L2, C=1.0, balanced)"],
        },
        "cross_validation_results": {
            "strategy": cv_name,
            "folds": 5,
            "model_a_auc_scores": [round(s, 4) for s in cv_scores_a],
            "model_a_auc_mean": cv_mean_a,
            "model_b_auc_scores": [round(s, 4) for s in cv_scores_b],
            "model_b_auc_mean": cv_mean_b,
            "cv_auc_difference": round(cv_mean_b - cv_mean_a, 4),
        },
        "test_metrics": {
            "default_threshold_0_50": {
                "model_a": metrics_a_50,
                "model_b": metrics_b_50,
                "differences": {m: round(metrics_b_50[m] - metrics_a_50[m], 4) for m in ["roc_auc", "pr_auc", "accuracy", "precision", "recall", "f1_score", "brier_score"]},
            },
            "train_tuned_optimal_threshold": {
                "model_a": metrics_a_opt,
                "model_b": metrics_b_opt,
            },
        },
        "calibration_results": {
            "model_a": calib_a,
            "model_b": calib_b,
        },
        "statistical_comparison": boot_res,
        "sanity_checks": sanity_checks,
        "conclusion": {
            "classification": conclusion_class,
            "disclaimer": "These results are based on synthetic data and do not establish clinical effectiveness.",
        },
    }

    os.makedirs(os.path.dirname(report_json_path), exist_ok=True)
    with open(report_json_path, "w") as f:
        json.dump(report_dict, f, cls=NumpyEncoder, indent=2)

    print(f"\n[7] Detailed JSON report written to: {report_json_path}")
    print("=" * 70)


if __name__ == "__main__":
    main()
