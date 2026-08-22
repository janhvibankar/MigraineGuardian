#!/usr/bin/env python3
"""
MigraineGuardian - Slice 8: Real-Data Readiness Audit
This script is for INSPECTION AND ANALYSIS ONLY.
It connects to Firestore, gathers data statistics, checks schema fields,
audits date alignment, and evaluates the longitudinal depth of real user data.
It does NOT modify any data, train models, or enable features.
"""

import os
import sys
import json
from datetime import datetime, timedelta
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

def run_audit():
    print("=" * 60)
    print("MigraineGuardian - Real-Data Readiness Audit")
    print("=" * 60)

    # 1. Initialize Firestore Admin SDK
    service_account_path = "backend/src/config/migraineguardian-firebase-adminsdk-fbsvc-b7c03e4c99.json"
    if not os.path.exists(service_account_path):
        print(f"ERROR: Service account file not found at: {service_account_path}")
        sys.exit(1)

    try:
        cred = credentials.Certificate(service_account_path)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("[OK] Successfully initialized Firestore connection.")
    except Exception as e:
        print(f"[FAIL] Failed to initialize Firestore connection: {e}")
        sys.exit(1)

    # 2. Query Users
    print("\nRetrieving users list...")
    users_ref = db.collection("users")
    users = list(users_ref.stream())
    print(f"Total user documents in root 'users' collection: {len(users)}")

    all_user_stats = []
    
    # Track schemas to log exact fields
    checkin_fields = set()
    weather_fields = set()
    profile_fields = set()
    episode_subcoll_fields = set()
    pss_fields = set()
    forecast_fields = set()

    # Track aggregate data pairing statistics
    total_checkin_records = 0
    total_weather_records = 0
    total_forecast_records = 0
    total_pss_records = 0
    total_episode_records = 0
    
    users_with_both = 0
    
    all_dates_checkins = set()
    all_dates_weather = set()
    
    # Aggregate pairing metrics
    # T, T-1
    complete_t_t1_lifestyle_pairing_count = 0

    for idx, user_doc in enumerate(users):
        user_id = user_doc.id
        user_data = user_doc.to_dict()
        profile_fields.update(user_data.keys())

        # Subcollections
        checkins_ref = users_ref.document(user_id).collection("daily_checkins")
        weather_ref = users_ref.document(user_id).collection("weather_records")
        forecasts_ref = users_ref.document(user_id).collection("risk_forecasts")
        pss_ref = users_ref.document(user_id).collection("pss_assessments")

        checkins = list(checkins_ref.stream())
        weather_recs = list(weather_ref.stream())
        forecasts = list(forecasts_ref.stream())
        pss_recs = list(pss_ref.stream())

        num_checkins = len(checkins)
        num_weather = len(weather_recs)
        num_forecasts = len(forecasts)
        num_pss = len(pss_recs)

        total_checkin_records += num_checkins
        total_weather_records += num_weather
        total_forecast_records += num_forecasts
        total_pss_records += num_pss

        # Anonymized user identifier
        user_alias = f"User_{idx + 1}"

        checkin_dates = set()
        weather_dates = set()

        checkin_data_by_date = {}
        weather_data_by_date = {}

        # Parse check-ins
        target_occurrences = 0
        target_severities = []
        target_durations = []
        target_null_counts = 0
        target_values_dist = {}
        
        # Check subcollection migraine_episodes
        num_episodes_found = 0

        for checkin_doc in checkins:
            c_data = checkin_doc.to_dict()
            checkin_fields.update(c_data.keys())
            date_str = c_data.get("date")
            if date_str:
                checkin_dates.add(date_str)
                all_dates_checkins.add(date_str)
                checkin_data_by_date[date_str] = c_data
            
            # Target outcome audit
            occurrence = c_data.get("migraine_occurrence")
            severity = c_data.get("migraine_severity")
            duration = c_data.get("migraine_duration")
            
            if occurrence is not None:
                occurrence_bool = bool(occurrence)
                target_values_dist[occurrence_bool] = target_values_dist.get(occurrence_bool, 0) + 1
                if occurrence_bool:
                    target_occurrences += 1
            else:
                target_null_counts += 1

            if severity is not None:
                target_severities.append(severity)
            if duration is not None:
                target_durations.append(duration)

            # Query primary episode subcollection
            episode_ref = checkins_ref.document(checkin_doc.id).collection("migraine_episodes").document("primary")
            episode_doc = episode_ref.get()
            if episode_doc.exists:
                num_episodes_found += 1
                total_episode_records += 1
                episode_subcoll_fields.update(episode_doc.to_dict().keys())

        # Parse weather
        for w_doc in weather_recs:
            w_data = w_doc.to_dict()
            weather_fields.update(w_data.keys())
            date_str = w_data.get("date")
            if date_str:
                weather_dates.add(date_str)
                all_dates_weather.add(date_str)
                weather_data_by_date[date_str] = w_data

        # Parse forecasts
        for f_doc in forecasts:
            f_data = f_doc.to_dict()
            forecast_fields.update(f_data.keys())

        # Parse PSS
        for p_doc in pss_recs:
            p_data = p_doc.to_dict()
            pss_fields.update(p_data.keys())

        # Evaluate pairing
        overlap_dates = checkin_dates.intersection(weather_dates)
        if num_checkins > 0 and num_weather > 0:
            users_with_both += 1

        # Check alignment logic for T, T-1
        complete_days = []
        for date_str in sorted(list(checkin_dates)):
            try:
                dt = datetime.strptime(date_str, "%Y-%m-%d")
                prev_dt = dt - timedelta(days=1)
                prev_date_str = prev_dt.strftime("%Y-%m-%d")

                has_lifestyle_t = date_str in checkin_data_by_date
                has_weather_t = date_str in weather_data_by_date
                has_weather_t1 = prev_date_str in weather_data_by_date
                
                # Check migraine target presence
                has_target = checkin_data_by_date[date_str].get("migraine_occurrence") is not None

                if has_lifestyle_t and has_weather_t and has_weather_t1 and has_target:
                    complete_days.append(date_str)
            except Exception as ex:
                print(f"Date parsing error on user {user_alias} date {date_str}: {ex}")

        complete_t_t1_lifestyle_pairing_count += len(complete_days)

        earliest_checkin = min(checkin_dates) if checkin_dates else "None"
        latest_checkin = max(checkin_dates) if checkin_dates else "None"
        earliest_weather = min(weather_dates) if weather_dates else "None"
        latest_weather = max(weather_dates) if weather_dates else "None"

        # Store stats
        user_stat = {
            "alias": user_alias,
            "id_masked": f"{user_id[:4]}...{user_id[-4:]}" if len(user_id) > 8 else user_id,
            "num_checkins": num_checkins,
            "earliest_checkin": earliest_checkin,
            "latest_checkin": latest_checkin,
            "num_weather": num_weather,
            "earliest_weather": earliest_weather,
            "latest_weather": latest_weather,
            "num_pss": num_pss,
            "num_forecasts": num_forecasts,
            "overlap_days_count": len(overlap_dates),
            "complete_t_t1_lifestyle_days_count": len(complete_days),
            "migraine_occurrence_total": target_occurrences,
            "migraine_occurrence_nulls": target_null_counts,
            "migraine_episodes_subcoll_count": num_episodes_found,
            "target_values_dist": target_values_dist
        }
        all_user_stats.append(user_stat)

    print("\n--- RESULTS ANALYSIS ---")
    print(f"Total Users Checked: {len(all_user_stats)}")
    print(f"Users with both Checkins and Weather records: {users_with_both}")
    print(f"Total check-in records: {total_checkin_records}")
    print(f"Total weather records: {total_weather_records}")
    print(f"Total risk forecast records: {total_forecast_records}")
    print(f"Total PSS-10 assessments: {total_pss_records}")
    print(f"Total subcollection migraine episodes: {total_episode_records}")
    print(f"Total aligned days across all users (Lifestyle(T) + Weather(T) + Weather(T-1) + Target(T)): {complete_t_t1_lifestyle_pairing_count}")

    print("\n--- USER LONGITUDINAL DEPTH DETAILS ---")
    for stat in all_user_stats:
        print(f"User: {stat['alias']} (id: {stat['id_masked']})")
        print(f"  Checkins: {stat['num_checkins']} (from {stat['earliest_checkin']} to {stat['latest_checkin']})")
        print(f"  Weather Recs: {stat['num_weather']} (from {stat['earliest_weather']} to {stat['latest_weather']})")
        print(f"  PSS Recs: {stat['num_pss']}")
        print(f"  Forecasts: {stat['num_forecasts']}")
        print(f"  Direct Overlap Dates: {stat['overlap_days_count']}")
        print(f"  Complete Aligned Days (T & T-1): {stat['complete_t_t1_lifestyle_days_count']}")
        print(f"  Migraine Occurrences: {stat['migraine_occurrence_total']} (nulls: {stat['migraine_occurrence_nulls']})")
        print(f"  Migraine Episodes subcoll count: {stat['migraine_episodes_subcoll_count']}")
        print(f"  Occurrence Value Distribution: {stat['target_values_dist']}")

    print("\n--- SCHEMA FIELDS DETECTED ---")
    print(f"Profile fields: {sorted(list(profile_fields))}")
    print(f"Check-in fields: {sorted(list(checkin_fields))}")
    print(f"Weather fields: {sorted(list(weather_fields))}")
    print(f"Episode subcollection fields: {sorted(list(episode_subcoll_fields))}")
    print(f"Forecast fields: {sorted(list(forecast_fields))}")
    print(f"PSS fields: {sorted(list(pss_fields))}")

    # Check Date Gaps & Formats
    print("\n--- DATE ALIGNMENT & DATES CHECKS ---")
    all_checkin_dates_sorted = sorted(list(all_dates_checkins))
    all_weather_dates_sorted = sorted(list(all_dates_weather))
    
    print(f"Checkin Dates Range: {all_checkin_dates_sorted[0] if all_checkin_dates_sorted else 'N/A'} to {all_checkin_dates_sorted[-1] if all_checkin_dates_sorted else 'N/A'}")
    print(f"Weather Dates Range: {all_weather_dates_sorted[0] if all_weather_dates_sorted else 'N/A'} to {all_weather_dates_sorted[-1] if all_weather_dates_sorted else 'N/A'}")

    report_data = {
        "timestamp": datetime.utcnow().isoformat(),
        "aggregate_stats": {
            "total_users": len(all_user_stats),
            "users_with_both": users_with_both,
            "total_checkin_records": total_checkin_records,
            "total_weather_records": total_weather_records,
            "total_forecast_records": total_forecast_records,
            "total_pss_records": total_pss_records,
            "total_episode_records": total_episode_records,
            "total_aligned_days": complete_t_t1_lifestyle_pairing_count
        },
        "user_details": all_user_stats,
        "schemas": {
            "profile": sorted(list(profile_fields)),
            "checkin": sorted(list(checkin_fields)),
            "weather": sorted(list(weather_fields)),
            "episode_subcollection": sorted(list(episode_subcoll_fields)),
            "forecast": sorted(list(forecast_fields)),
            "pss": sorted(list(pss_fields))
        }
    }
    
    os.makedirs("ml-service/data/reports", exist_ok=True)
    report_path = "ml-service/data/reports/real_data_audit_report.json"
    with open(report_path, "w") as f:
        json.dump(report_data, f, indent=2)
    print(f"\n[OK] Detailed JSON report written to {report_path}")
    print("=" * 60)

if __name__ == "__main__":
    run_audit()
