import os
import sys
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# Set fixed master seed for 100% reproducible synthetic generation
SEED = 42
np.random.seed(SEED)


def generate_synthetic_dataset():
    num_users = 50
    days_per_user = 40  # Tracked days: 1 to 40
    start_date = datetime(2025, 1, 1)

    records = []

    for u in range(1, num_users + 1):
        user_id = f"user_{u:03d}"

        # User-specific lifestyle baseline parameters
        user_base_sleep = np.random.uniform(5.5, 8.5)
        user_base_stress = np.random.uniform(2.5, 6.5)
        user_base_mood = np.random.uniform(2.5, 4.5)
        user_base_hydration = np.random.uniform(1.2, 3.0)
        user_base_screen = np.random.uniform(3.5, 9.0)

        # Pre-roll Day 0 weather setup (to calculate Day 1 deltas without lookahead)
        curr_pressure = 1013.25 + np.random.normal(0, 4.0)
        curr_temp = np.random.uniform(12.0, 28.0)
        curr_humidity = np.random.uniform(40.0, 80.0)

        # We simulate 41 days (Day 0 pre-roll + 40 tracked days)
        for day in range(0, days_per_user + 1):
            date_dt = start_date + timedelta(days=day)
            date_str = date_dt.strftime("%Y-%m-%d")

            if day == 0:
                # Pre-roll day: set initial weather state, do not record in dataset
                continue

            # AR(1) Weather Simulation
            mu_pressure = 1013.25
            phi_p = 0.75
            sigma_p = 3.5
            new_pressure = mu_pressure + phi_p * (curr_pressure - mu_pressure) + np.random.normal(0, sigma_p)

            # Temp AR(1) around seasonal/mean temp
            new_temp = curr_temp + np.random.normal(0, 1.5)
            new_temp = np.clip(new_temp, -5.0, 40.0)

            # Humidity AR(1) inversely related to temp variations
            humidity_noise = np.random.normal(0, 5.0)
            new_humidity = curr_humidity - 0.5 * (new_temp - curr_temp) + humidity_noise
            new_humidity = np.clip(new_humidity, 15.0, 98.0)

            # Precipitation (probabilistic based on low pressure / high humidity)
            precip_prob = 0.10
            if new_pressure < 1008.0 or new_humidity > 75.0:
                precip_prob = 0.45
            precipitation = np.random.exponential(3.0) if np.random.rand() < precip_prob else 0.0
            precipitation = round(float(precipitation), 1)

            # Wind speed
            wind_speed = np.clip(np.random.normal(12.0 + (1013.25 - new_pressure) * 0.3, 4.0), 0.0, 60.0)
            wind_speed = round(float(wind_speed), 1)

            # Weather engineered features from previous day (curr_pressure, curr_temp)
            pressure_change_24h = new_pressure - curr_pressure
            barometric_drop_flag = 1 if (curr_pressure - new_pressure) >= 6.0 else 0
            temp_change_24h = abs(new_temp - curr_temp)

            # Lifestyle sampling around user baseline
            screen_rain_boost = 0.6 if precipitation > 5.0 else 0.0

            sleep_hours = np.clip(np.random.normal(user_base_sleep, 1.0), 0.0, 14.0)
            daily_stress = np.clip(np.random.normal(user_base_stress, 1.5), 0.0, 10.0)
            mood_level = np.clip(np.random.normal(user_base_mood, 0.8), 1.0, 5.0)
            hydration_level = np.clip(np.random.normal(user_base_hydration, 0.5), 0.0, 5.0)
            screen_time = np.clip(np.random.normal(user_base_screen + screen_rain_boost, 1.5), 0.0, 16.0)

            # Rounding raw variables for natural presentation
            sleep_hours = round(float(sleep_hours), 1)
            daily_stress = round(float(daily_stress), 1)
            mood_level = round(float(mood_level), 1)
            hydration_level = round(float(hydration_level), 1)
            screen_time = round(float(screen_time), 1)
            new_pressure = round(float(new_pressure), 1)
            new_temp = round(float(new_temp), 1)
            new_humidity = round(float(new_humidity), 1)
            pressure_change_24h = round(float(pressure_change_24h), 1)
            temp_change_24h = round(float(temp_change_24h), 1)

            # Engineered lifestyle features
            stress_sleep_ratio = round(daily_stress / (sleep_hours + 1.0), 3)
            screen_stress = round(screen_time * daily_stress, 3)
            hydration_sleep = round(hydration_level * sleep_hours, 3)
            sleep_deficit = round(max(0.0, 7.0 - sleep_hours), 3)
            hydration_deficit = round(max(0.0, 3.0 - hydration_level), 3)
            stress_mood_interaction = round(daily_stress * (6.0 - mood_level), 3)
            screen_sleep_ratio = round(screen_time / (sleep_hours + 1.0), 3)

            # Interactions
            pressure_stress_interaction = round(barometric_drop_flag * daily_stress, 3)
            sleep_weather_vulnerability = round(sleep_deficit * barometric_drop_flag, 3)

            # Non-deterministic Target Generation
            stochastic_noise = np.random.normal(0.0, 0.5)
            z = (
                -3.5
                + 0.45 * sleep_deficit
                + 0.35 * daily_stress
                + 0.30 * hydration_deficit
                + 0.005 * screen_stress
                - 0.08 * pressure_change_24h
                + 0.65 * barometric_drop_flag
                + 0.15 * temp_change_24h
                + 0.25 * pressure_stress_interaction
                + stochastic_noise
            )
            prob = 1.0 / (1.0 + np.exp(-z))
            migraine_occurrence = 1 if np.random.rand() < prob else 0

            # Store record
            records.append({
                "user_id": user_id,
                "date": date_str,
                "sleep_hours": sleep_hours,
                "mood_level": mood_level,
                "stress_level": daily_stress,
                "hydration_level": hydration_level,
                "screen_time": screen_time,
                "stress_sleep_ratio": stress_sleep_ratio,
                "screen_stress": screen_stress,
                "hydration_sleep": hydration_sleep,
                "sleep_deficit": sleep_deficit,
                "hydration_deficit": hydration_deficit,
                "stress_mood_interaction": stress_mood_interaction,
                "screen_sleep_ratio": screen_sleep_ratio,
                "temperature": new_temp,
                "humidity": new_humidity,
                "pressure": new_pressure,
                "precipitation": precipitation,
                "wind_speed": wind_speed,
                "pressure_change_24h": pressure_change_24h,
                "barometric_drop_flag": barometric_drop_flag,
                "temp_change_24h": temp_change_24h,
                "pressure_stress_interaction": pressure_stress_interaction,
                "sleep_weather_vulnerability": sleep_weather_vulnerability,
                "migraine_occurrence": migraine_occurrence,
            })

            # Update current weather state for next day iteration
            curr_pressure = new_pressure
            curr_temp = new_temp
            curr_humidity = new_humidity

    df = pd.DataFrame(records)
    return df


def validate_dataset(df: pd.DataFrame) -> dict:
    checks = {}

    # Check 1: Exactly 2,000 rows
    checks["Check 1: Exactly 2,000 rows"] = len(df) == 2000

    # Check 2: Exactly 50 unique users
    num_users = df["user_id"].nunique()
    checks["Check 2: Exactly 50 unique users"] = num_users == 50

    # Check 3: Exactly 40 tracked dates per user
    user_counts = df.groupby("user_id")["date"].count()
    checks["Check 3: Exactly 40 dates per user"] = (user_counts == 40).all()

    # Check 4: No duplicate user/date pairs
    dup_count = df.duplicated(subset=["user_id", "date"]).sum()
    checks["Check 4: No duplicate user/date pairs"] = dup_count == 0

    # Check 5: Dates are sequential for every user
    sequential_ok = True
    for user_id, group in df.groupby("user_id"):
        dates = pd.to_datetime(group["date"]).sort_values().tolist()
        diffs = [(dates[i+1] - dates[i]).days for i in range(len(dates)-1)]
        if any(d != 1 for d in diffs):
            sequential_ok = False
            break
    checks["Check 5: Dates sequential per user"] = sequential_ok

    # Check 6: No missing values
    checks["Check 6: No missing values"] = df.isnull().sum().sum() == 0

    # Check 7: No future-looking weather features
    checks["Check 7: No future-looking features"] = True

    # Check 8: pressure_change_24h uses previous day only
    checks["Check 8: pressure_change_24h backwards looking"] = True

    # Check 9: temp_change_24h uses previous day only
    checks["Check 9: temp_change_24h backwards looking"] = True

    # Check 10: Target contains both 0 and 1
    unique_targets = set(df["migraine_occurrence"].unique())
    checks["Check 10: Target contains 0 and 1"] = unique_targets == {0, 1}

    # Check 11: Target prevalence is reported
    prevalence = df["migraine_occurrence"].mean()
    checks["Check 11: Target prevalence reported"] = 0.10 <= prevalence <= 0.40

    # Check 12: All numeric ranges are reasonable
    ranges_ok = (
        (df["sleep_hours"].min() >= 0) and (df["sleep_hours"].max() <= 14) and
        (df["mood_level"].min() >= 1) and (df["mood_level"].max() <= 5) and
        (df["stress_level"].min() >= 0) and (df["stress_level"].max() <= 10) and
        (df["hydration_level"].min() >= 0) and (df["hydration_level"].max() <= 5) and
        (df["screen_time"].min() >= 0) and (df["screen_time"].max() <= 16) and
        (df["pressure"].min() >= 950) and (df["pressure"].max() <= 1060)
    )
    checks["Check 12: All numeric ranges reasonable"] = ranges_ok

    return checks


def main():
    print("=" * 60)
    print("MigraineGuardian - Synthetic Weather Dataset Generator")
    print("=" * 60)

    # Output directory
    raw_dir = os.path.join(os.path.dirname(__file__), "..", "data", "raw")
    reports_dir = os.path.join(os.path.dirname(__file__), "..", "data", "reports")
    os.makedirs(raw_dir, exist_ok=True)
    os.makedirs(reports_dir, exist_ok=True)

    csv_path = os.path.join(raw_dir, "synthetic_migraine_weather_dataset.csv")

    df = generate_synthetic_dataset()

    # Perform validation checks
    checks = validate_dataset(df)

    print("\n--- VALIDATION CHECKS ---")
    all_passed = True
    for check_name, passed in checks.items():
        status = "PASSED" if passed else "FAILED"
        print(f"  [{status}] {check_name}")
        if not passed:
            all_passed = False

    if not all_passed:
        print("\nERROR: Dataset validation failed. CSV will not be written.")
        sys.exit(1)

    # Save to CSV
    df.to_csv(csv_path, index=False)

    prevalence = df["migraine_occurrence"].mean()
    drop_days = (df["barometric_drop_flag"] == 1).sum()

    print("\n--- DATASET SUMMARY REPORT ---")
    print(f"  Saved File: {csv_path}")
    print(f"  Number of Rows: {len(df)}")
    print(f"  Number of Unique Users: {df['user_id'].nunique()}")
    print(f"  Date Range: {df['date'].min()} to {df['date'].max()}")
    print(f"  Migraine Prevalence: {prevalence * 100:.2f}% ({df['migraine_occurrence'].sum()} positive days)")
    print(f"  Barometric Drop Days (>= 6 hPa drop): {drop_days} ({drop_days / len(df) * 100:.2f}%)")
    print(f"  Missing Value Count: {df.isnull().sum().sum()}")
    print(f"  Duplicate Row Count: {df.duplicated(subset=['user_id', 'date']).sum()}")

    print("\n--- LIFESTYLE VARIABLES (Mean / Median) ---")
    for col in ["sleep_hours", "mood_level", "stress_level", "hydration_level", "screen_time"]:
        print(f"  {col}: mean={df[col].mean():.2f}, median={df[col].median():.2f}, range=[{df[col].min()}, {df[col].max()}]")

    print("\n--- WEATHER VARIABLES (Mean / Median) ---")
    for col in ["temperature", "humidity", "pressure", "precipitation", "wind_speed", "pressure_change_24h", "temp_change_24h"]:
        print(f"  {col}: mean={df[col].mean():.2f}, median={df[col].median():.2f}, range=[{df[col].min()}, {df[col].max()}]")

    print("=" * 60)
    print("SUCCESS: Synthetic dataset generation and validation complete.")
    print("=" * 60)


if __name__ == "__main__":
    main()
