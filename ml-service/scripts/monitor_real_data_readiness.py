#!/usr/bin/env python3
"""
MigraineGuardian - Slice 12: Real Data Collection & Quality Monitoring
This script performs a READ-ONLY analysis of the Firestore database.
It does NOT modify any data, train models, or enable features.
It aggregates data completeness, longitudinal user depth, positive outcome distributions,
weather pairing, temporal validity, and lists data quality violations.
"""

import os
import sys
import json
from datetime import datetime, timedelta
import firebase_admin
from firebase_admin import credentials, firestore

def run_monitor():
    print("=" * 70)
    print(" MIGRAINEGUARDIAN — REAL DATA QUALITY & MONITORING CONTROL PANEL")
    print("=" * 70)

    # 1. Initialize Firestore Admin SDK
    service_account_path = "backend/src/config/migraineguardian-firebase-adminsdk-fbsvc-b7c03e4c99.json"
    if not os.path.exists(service_account_path):
        print(f"ERROR: Service account file not found at: {service_account_path}")
        sys.exit(1)

    try:
        cred = credentials.Certificate(service_account_path)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("[OK] Successfully connected to Firestore.")
    except Exception as e:
        print(f"[FAIL] Firestore initialization failed: {e}")
        sys.exit(1)

    # 2. Retrieve all users
    users_ref = db.collection("users")
    users = list(users_ref.stream())
    total_users = len(users)
    print(f"[Info] Found {total_users} user profiles in Firestore.")

    # Counters
    total_morning_predictions = 0
    total_evening_checkins = 0
    total_positive_outcomes = 0
    total_negative_outcomes = 0
    total_complete_pairs = 0
    total_missing_outcome_pairs = 0
    total_missing_prediction_pairs = 0
    total_weather_linked_pairs = 0
    total_missing_t1_weather = 0
    total_missing_t_forecast = 0
    total_duplicate_prediction_dates = 0

    user_prediction_counts = []
    user_complete_pairs_counts = []

    # Quality Violations Logger
    quality_violations = []

    # Temporal Validity checks
    temporal_validity_passed = True

    # User longitudinal bins
    user_longitudinal_bins = {
        "0_days": 0,
        "1_7_days": 0,
        "8_14_days": 0,
        "15_29_days": 0,
        "30_plus_days": 0
    }

    # Loop through users
    for idx, user_doc in enumerate(users):
        user_id = user_doc.id
        user_data = user_doc.to_dict()
        user_alias = f"User_{idx + 1}"

        # Fetch subcollections
        preds_ref = users_ref.document(user_id).collection("prediction_inputs")
        checkins_ref = users_ref.document(user_id).collection("daily_checkins")
        weather_ref = users_ref.document(user_id).collection("weather_records")

        preds = list(preds_ref.stream())
        checkins = list(checkins_ref.stream())
        weather_recs = list(weather_ref.stream())

        total_morning_predictions += len(preds)
        total_evening_checkins += len(checkins)

        user_prediction_counts.append(len(preds))

        # Classify longitudinal depth
        num_preds = len(preds)
        if num_preds == 0:
            user_longitudinal_bins["0_days"] += 1
        elif 1 <= num_preds <= 7:
            user_longitudinal_bins["1_7_days"] += 1
        elif 8 <= num_preds <= 14:
            user_longitudinal_bins["8_14_days"] += 1
        elif 15 <= num_preds <= 29:
            user_longitudinal_bins["15_29_days"] += 1
        else:
            user_longitudinal_bins["30_plus_days"] += 1

        # Map collections by date
        preds_by_date = {}
        for p in preds:
            p_data = p.to_dict()
            date_str = p_data.get("prediction_date") or p.id
            if date_str in preds_by_date:
                total_duplicate_prediction_dates += 1
                quality_violations.append(f"[{user_alias}] Duplicate morning prediction input found for date {date_str}")
            preds_by_date[date_str] = p_data

            # Quality Check: morning features
            sh = p_data.get("sleep_hours")
            sq = p_data.get("sleep_quality")
            st = p_data.get("morning_stress")
            mo = p_data.get("morning_mood")
            pts = p_data.get("prediction_timestamp")
            pd = p_data.get("prediction_date")

            if pd is None:
                quality_violations.append(f"[{user_alias}] Prediction date is missing in prediction input document {p.id}")
            if pts is None:
                quality_violations.append(f"[{user_alias}] Prediction timestamp is missing in prediction input on {date_str}")

            if sh is None or not isinstance(sh, (int, float)) or sh < 0 or sh > 24:
                quality_violations.append(f"[{user_alias}] Invalid sleep_hours ({sh}) logged in morning input on {date_str}")
            if sq is None or not isinstance(sq, (int, float)) or sq < 1 or sq > 5:
                quality_violations.append(f"[{user_alias}] Invalid sleep_quality ({sq}) logged in morning input on {date_str}")
            if st is None or not isinstance(st, (int, float)) or st < 0 or st > 10:
                quality_violations.append(f"[{user_alias}] Invalid morning_stress ({st}) logged in morning input on {date_str}")
            if mo is None or not isinstance(mo, (int, float)) or mo < 1 or mo > 5:
                quality_violations.append(f"[{user_alias}] Invalid morning_mood ({mo}) logged in morning input on {date_str}")

        checkins_by_date = {}
        for c in checkins:
            c_data = c.to_dict()
            date_str = c_data.get("date") or c.id
            checkins_by_date[date_str] = c_data

            # Outcome checking
            occurrence = c_data.get("migraine_occurrence")
            if occurrence is True:
                total_positive_outcomes += 1
            elif occurrence is False:
                total_negative_outcomes += 1
            else:
                quality_violations.append(f"[{user_alias}] Checkin outcome migraine_occurrence is missing or null on {date_str}")

            # Quality Check: check-in lifestyle variables
            c_sh = c_data.get("sleep_hours")
            c_sq = c_data.get("sleep_quality")
            c_st = c_data.get("daily_stress")
            c_mo = c_data.get("mood")

            if c_sh is not None and (not isinstance(c_sh, (int, float)) or c_sh < 0 or c_sh > 24):
                quality_violations.append(f"[{user_alias}] Invalid sleep_hours ({c_sh}) logged in checkin on {date_str}")
            if c_sq is not None and (not isinstance(c_sq, (int, float)) or c_sq < 1 or c_sq > 5):
                quality_violations.append(f"[{user_alias}] Invalid sleep_quality ({c_sq}) logged in checkin on {date_str}")
            if c_st is not None and (not isinstance(c_st, (int, float)) or c_st < 0 or c_st > 10):
                quality_violations.append(f"[{user_alias}] Invalid daily_stress ({c_st}) logged in checkin on {date_str}")
            if c_mo is not None and (not isinstance(c_mo, (int, float)) or c_mo < 1 or c_mo > 5):
                quality_violations.append(f"[{user_alias}] Invalid mood ({c_mo}) logged in checkin on {date_str}")

        weather_by_id = {}
        for w in weather_recs:
            w_data = w.to_dict()
            weather_by_id[w.id] = w_data

            # Quality Check: forecast/observed labels matching
            w_type = w_data.get("data_type")
            if w.id.endswith("_forecast"):
                if w_type != "forecast":
                    quality_violations.append(f"[{user_alias}] Weather record {w.id} is forecast document but data_type is '{w_type}'")
            else:
                if w_type != "observed" and len(w.id) == 10: # YYYY-MM-DD format
                    quality_violations.append(f"[{user_alias}] Weather record {w.id} is observed document but data_type is '{w_type}'")

        # Evaluate pairs and weather links
        all_dates = set(preds_by_date.keys()).union(set(checkins_by_date.keys()))
        user_pairs = 0

        for d in sorted(list(all_dates)):
            has_pred = d in preds_by_date
            has_checkin = d in checkins_by_date

            if has_pred and has_checkin:
                total_complete_pairs += 1
                user_pairs += 1

                # Check Temporal Validity: prediction occurred before evening check-in log
                p_ts_str = preds_by_date[d].get("prediction_timestamp")
                c_ts_str = checkins_by_date[d].get("createdAt") or checkins_by_date[d].get("updatedAt")

                if p_ts_str and c_ts_str:
                    try:
                        # Extract timestamps safely
                        p_ts = datetime.fromisoformat(p_ts_str.replace("Z", "+00:00"))
                        c_ts = datetime.fromisoformat(c_ts_str.replace("Z", "+00:00"))
                        if p_ts >= c_ts:
                            temporal_validity_passed = False
                            quality_violations.append(f"[{user_alias}] Temporal inversion on {d}: Prediction timestamp {p_ts_str} occurs after checkin timestamp {c_ts_str}")
                    except Exception as e:
                        quality_violations.append(f"[{user_alias}] Timestamp comparison failed on {d}: {e}")

                # Check Weather links
                # T forecast weather
                w_f_id = f"{d}_forecast"
                has_forecast = w_f_id in weather_by_id
                
                # T-1 observed weather
                try:
                    dt = datetime.strptime(d, "%Y-%m-%d")
                    prev_d = (dt - timedelta(days=1)).strftime("%Y-%m-%d")
                except:
                    prev_d = None

                has_observed_t1 = prev_d in weather_by_id if prev_d else False

                if has_forecast and has_observed_t1:
                    total_weather_linked_pairs += 1
                else:
                    if not has_observed_t1:
                        total_missing_t1_weather += 1
                        quality_violations.append(f"[{user_alias}] Missing T-1 observed weather ({prev_d}) for complete training day {d}")
                    if not has_forecast:
                        total_missing_t_forecast += 1
                        quality_violations.append(f"[{user_alias}] Missing T forecast weather ({w_f_id}) for complete training day {d}")

            elif has_pred and not has_checkin:
                total_missing_outcome_pairs += 1
            elif not has_pred and has_checkin:
                total_missing_prediction_pairs += 1

        user_complete_pairs_counts.append(user_pairs)

    # Calculate Completeness & Statistics
    pred_outcome_completion_rate = (total_complete_pairs / total_morning_predictions * 100) if total_morning_predictions > 0 else 0.0
    weather_completion_rate = (total_weather_linked_pairs / total_complete_pairs * 100) if total_complete_pairs > 0 else 0.0
    complete_row_rate = (total_weather_linked_pairs / total_morning_predictions * 100) if total_morning_predictions > 0 else 0.0
    migraine_prevalence = (total_positive_outcomes / total_evening_checkins * 100) if total_evening_checkins > 0 else 0.0

    # User Depth Calculations
    def get_median(lst):
        if not lst:
            return 0.0
        n = len(lst)
        s_lst = sorted(lst)
        if n % 2 == 1:
            return float(s_lst[n // 2])
        else:
            return float((s_lst[n // 2 - 1] + s_lst[n // 2]) / 2.0)

    median_pred_days = get_median(user_prediction_counts)
    median_complete_pairs = get_median(user_complete_pairs_counts)
    max_complete_pairs = max(user_complete_pairs_counts) if user_complete_pairs_counts else 0

    # Training Readiness Scorecard Assessment
    dc_ready = "READY" if total_morning_predictions > 0 and total_evening_checkins > 0 else "NOT READY"
    tl_ready = "READY" if total_positive_outcomes >= 5 and total_negative_outcomes >= 5 else "NOT READY"
    wa_ready = "READY" if total_weather_linked_pairs > 0 else "NOT READY"
    tv_ready = "READY" if temporal_validity_passed and total_complete_pairs > 0 else "NOT READY"
    ld_ready = "READY" if max_complete_pairs >= 14 else "NOT READY"

    overall_status = "NOT READY"
    if dc_ready == "READY" and wa_ready == "READY" and tv_ready == "READY":
        if total_weather_linked_pairs >= 100:
            overall_status = "READY FOR TRAINING"
        elif total_weather_linked_pairs >= 20:
            overall_status = "READY FOR EXPLORATION"

    # Recommended next milestone
    rec_milestone = "MILESTONE 1: Establish first complete morning prediction to evening outcome pair"
    if total_complete_pairs > 0:
        rec_milestone = "MILESTONE 2: Multiple users with repeated observations (>5 complete days)"
    if total_complete_pairs >= 15:
        rec_milestone = "MILESTONE 3: Build diversity of positive and negative outcomes (at least 5 of each)"
    if total_complete_pairs >= 40:
        rec_milestone = "MILESTONE 4: Collect enough data for a real-data exploratory experiment (50+ rows)"
    if total_weather_linked_pairs >= 100:
        rec_milestone = "MILESTONE 5: Establish baseline vs weather-aware benchmark training (200+ rows)"

    # Print Report
    print("\n" + "=" * 50)
    print(" 1. AGGREGATE SYSTEM METRICS")
    print("=" * 50)
    print(f"  A. Total Users                     : {total_users}")
    print(f"  B. Total Morning Pred Inputs       : {total_morning_predictions}")
    print(f"  C. Total Evening Check-ins         : {total_evening_checkins}")
    print(f"  D. Total Migraine-Positive Outcomes: {total_positive_outcomes}")
    print(f"  E. Total Migraine-Negative Outcomes: {total_negative_outcomes}")
    print(f"  F. Complete Pred->Outcome Pairs    : {total_complete_pairs}")
    print(f"  G. Missing Evening Outcomes        : {total_missing_outcome_pairs}")
    print(f"  H. Missing Morning Predictions     : {total_missing_prediction_pairs}")
    print(f"  I. Complete Weather-Linked Pairs   : {total_weather_linked_pairs}")
    print(f"  J. Missing T-1 Observed Weather    : {total_missing_t1_weather}")
    print(f"  K. Missing T Forecast              : {total_missing_t_forecast}")
    print(f"  L. Duplicate Prediction Dates      : {total_duplicate_prediction_dates}")
    print(f"  M. Total Quality Violations Flagged: {len(quality_violations)}")

    print("\n" + "=" * 50)
    print(" 2. DATA COMPLETENESS RATIOS")
    print("=" * 50)
    print(f"  - Pred -> Outcome Completion Rate  : {pred_outcome_completion_rate:.1f}%")
    print(f"  - Weather Link Alignment Rate      : {weather_completion_rate:.1f}%")
    print(f"  - Complete Training-Row Yield      : {complete_row_rate:.1f}%")
    print(f"  - Supervised Target Prevalence     : {migraine_prevalence:.1f}%")

    print("\n" + "=" * 50)
    print(" 3. USER LONGITUDINAL DEPTH DISTRIBUTION")
    print("=" * 50)
    print(f"  - Users with 0 prediction days     : {user_longitudinal_bins['0_days']}")
    print(f"  - Users with 1-7 prediction days   : {user_longitudinal_bins['1_7_days']}")
    print(f"  - Users with 8-14 prediction days  : {user_longitudinal_bins['8_14_days']}")
    print(f"  - Users with 15-29 prediction days : {user_longitudinal_bins['15_29_days']}")
    print(f"  - Users with 30+ prediction days   : {user_longitudinal_bins['30_plus_days']}")
    print(f"  - Median Prediction Days/User      : {median_pred_days:.1f}")
    print(f"  - Median Complete Pairs/User       : {median_complete_pairs:.1f}")
    print(f"  - Maximum Complete Pairs/User      : {max_complete_pairs}")

    print("\n" + "=" * 50)
    print(" 4. DATA QUALITY VIOLATIONS SUMMARY")
    print("=" * 50)
    if not quality_violations:
        print("  [PASS] Zero data quality violations flagged. Dataset is clean.")
    else:
        for idx, violation in enumerate(quality_violations[:10]):
            print(f"  [{idx + 1}] {violation}")
        if len(quality_violations) > 10:
            print(f"  ... and {len(quality_violations) - 10} more violations.")

    print("\n" + "=" * 50)
    print(" 5. TRAINING READINESS SCORECARD")
    print("=" * 50)
    print(f"  - DATA COLLECTION       : {dc_ready}")
    print(f"  - TARGET LABELS         : {tl_ready} (requires >=5 positive and >=5 negative)")
    print(f"  - WEATHER ALIGNMENT     : {wa_ready}")
    print(f"  - TEMPORAL VALIDITY     : {tv_ready}")
    print(f"  - LONGITUDINAL DEPTH    : {ld_ready} (requires max user history >=14 days)")
    print(f"  - OVERALL READINESS STATUS: {overall_status}")

    print("\n" + "=" * 50)
    print(" 6. RECOMMENDED DATA COLLECTION MILESTONE")
    print("=" * 50)
    print(f"  CURRENT FOCUS: {rec_milestone}")
    print("=" * 70)

if __name__ == "__main__":
    run_monitor()
