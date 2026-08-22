#!/usr/bin/env python3
"""
MigraineGuardian - Dataset Generator Script
This script reconstructs the supervised training dataset from real Firestore records:
1. Streams user documents and subcollections (prediction_inputs, daily_checkins, weather_records).
2. Performs matching joins on date T.
3. Enforces temporal validity (prediction_timestamp < evening outcome timestamp).
4. Extracts morning lifestyle variables, today's forecast weather (T), and yesterday's observed weather (T-1).
5. Computes forecasted weather changes (deltas).
6. Retrieves ground-truth target strictly from daily_checkins[T].migraine_occurrence.
7. Exports the clean dataset to ml-service/data/real_training_dataset.csv.
"""

import os
import sys
import csv
from datetime import datetime, timedelta
import firebase_admin
from firebase_admin import credentials, firestore

def run_reconstruction():
    print("=" * 70)
    print(" MIGRAINEGUARDIAN — TRAINING DATASET RECONSTRUCTION ENGINE")
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
    print(f"[Info] Scanning {len(users)} user profiles...")

    rows = []

    # Columns header
    headers = [
        "user_id",
        "prediction_date",
        "prediction_timestamp",
        # Morning Lifestyle Features
        "sleep_hours",
        "sleep_quality",
        "morning_stress",
        "morning_mood",
        # Weather T-1 Observed Features
        "temp_t1_observed",
        "pressure_t1_observed",
        "humidity_t1_observed",
        "wind_speed_t1_observed",
        "precipitation_t1_observed",
        # Weather T Forecast Features
        "temp_forecast_t",
        "pressure_forecast_t",
        "humidity_forecast_t",
        "wind_speed_forecast_t",
        "precipitation_forecast_t",
        # Weather Engineered Changes
        "forecasted_pressure_change",
        "forecasted_temp_change",
        # Target
        "migraine_occurrence"
    ]

    for idx, user_doc in enumerate(users):
        user_id = user_doc.id
        
        preds_ref = users_ref.document(user_id).collection("prediction_inputs")
        checkins_ref = users_ref.document(user_id).collection("daily_checkins")
        weather_ref = users_ref.document(user_id).collection("weather_records")

        preds = list(preds_ref.stream())
        checkins = list(checkins_ref.stream())
        weather_recs = list(weather_ref.stream())

        preds_by_date = {}
        for p in preds:
            p_data = p.to_dict()
            date_str = p_data.get("prediction_date") or p.id
            preds_by_date[date_str] = p_data

        checkins_by_date = {}
        for c in checkins:
            c_data = c.to_dict()
            date_str = c_data.get("date") or c.id
            checkins_by_date[date_str] = c_data

        weather_by_id = {}
        for w in weather_recs:
            w_data = w.to_dict()
            weather_by_id[w.id] = w_data

        # Align on candidate dates T
        candidate_dates = set(preds_by_date.keys()).intersection(set(checkins_by_date.keys()))

        for d in sorted(list(candidate_dates)):
            p_entry = preds_by_date[d]
            c_entry = checkins_by_date[d]

            # 1. Verify target outcome presence in evening checkin
            occurrence = c_entry.get("migraine_occurrence")
            if occurrence is None:
                continue

            target_val = 1 if occurrence else 0

            # 2. Check weather alignment
            # Today's Forecast (T_forecast)
            w_f_id = f"{d}_forecast"
            forecast_weather = weather_by_id.get(w_f_id)

            # Yesterday's Observed (T-1)
            try:
                dt = datetime.strptime(d, "%Y-%m-%d")
                prev_d = (dt - timedelta(days=1)).strftime("%Y-%m-%d")
            except:
                prev_d = None

            observed_t1_weather = weather_by_id.get(prev_d) if prev_d else None

            if not forecast_weather or not observed_t1_weather:
                continue

            # 3. Verify Temporal Validity
            p_ts_str = p_entry.get("prediction_timestamp")
            c_ts_str = c_entry.get("createdAt") or c_entry.get("updatedAt")

            if p_ts_str and c_ts_str:
                try:
                    p_ts = datetime.fromisoformat(p_ts_str.replace("Z", "+00:00"))
                    c_ts = datetime.fromisoformat(c_ts_str.replace("Z", "+00:00"))
                    if p_ts >= c_ts:
                        # Inverted timestamp, drop to prevent target leaking
                        continue
                except:
                    continue

            # 4. Extract metrics safely
            sh = p_entry.get("sleep_hours", 7.5)
            sq = p_entry.get("sleep_quality", 4)
            ms = p_entry.get("morning_stress", 3)
            mm = p_entry.get("morning_mood", 4)

            # T-1 Observed Weather metrics
            t1_temp = observed_t1_weather.get("temperature", 22.0)
            t1_pres = observed_t1_weather.get("pressure", 1013.0)
            t1_hum = observed_t1_weather.get("humidity", 60.0)
            t1_wind = observed_t1_weather.get("windSpeed", 0.0)
            t1_prec = observed_t1_weather.get("precipitation", 0.0)

            # T Forecast Weather metrics
            f_temp = forecast_weather.get("temperature", 22.0)
            f_pres = forecast_weather.get("pressure", 1013.0)
            f_hum = forecast_weather.get("humidity", 60.0)
            f_wind = forecast_weather.get("windSpeed", 0.0)
            f_prec = forecast_weather.get("precipitation", 0.0)

            # Compute deltas
            pressure_delta = float(f_pres) - float(t1_pres)
            temp_delta = float(f_temp) - float(t1_temp)

            # Construct row
            row = [
                user_id,
                d,
                p_ts_str,
                # Morning lifestyle features
                float(sh),
                int(sq),
                int(ms),
                int(mm),
                # T-1 weather observed features
                float(t1_temp),
                float(t1_pres),
                float(t1_hum),
                float(t1_wind),
                float(t1_prec),
                # T forecast weather features
                float(f_temp),
                float(f_pres),
                float(f_hum),
                float(f_wind),
                float(f_prec),
                # Deltas
                pressure_delta,
                temp_delta,
                # Supervised Target
                target_val
            ]

            rows.append(row)

    # Write output to CSV
    output_dir = "ml-service/data"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "real_training_dataset.csv")

    try:
        with open(output_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(headers)
            writer.writerows(rows)
        print(f"[OK] Reconstructed dataset successfully! Created {len(rows)} training rows.")
        print(f"[Info] File saved to: {output_path}")
    except Exception as e:
        print(f"[FAIL] Writing dataset CSV failed: {e}")

if __name__ == "__main__":
    run_reconstruction()
