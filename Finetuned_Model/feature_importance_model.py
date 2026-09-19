
import xgboost as xgb
import pandas as pd
import pickle
from huggingface_hub import hf_hub_download


MODEL_REPO = "Alpha23332/atm-at-risk"

MODEL_PATH = hf_hub_download(
    repo_id=MODEL_REPO,
    filename="xgb_no_interactions.pkl",
    repo_type="model"
)

with open(MODEL_PATH, "rb") as f:
    model = pickle.load(f)
model.set_params(device="cpu")
print("Model: ",model)
#################################################################

FEATURES=[
 'atm_count_district',
 'atm_baseline_activity',
 'atm_baseline_risk',
 'district_fraud_density',
 'hour',
 'day_of_week',
 'is_weekend',
 'hour_sin',
 'hour_cos',
 'dow_sin',
 'dow_cos',
 'complaints_1h',
 'complaints_6h',
 'complaints_24h',
 'complaints_7d',
 'complaint_velocity_6h',
 'mules_6h',
 'mules_24h',
 'mules_7d',
 'cross_state_mule_count_24h',
 'cross_state_flag',
 'cross_state_ratio',
 'mule_proximity_km',
 'mules_within_5km',
 'mules_within_10km',
 'mules_within_25km',
 'complaint_pressure',
 'mule_pressure',
 'atm_activity_24h',
 'atm_activity_7d',
 'mule_distance_inverse'
]

# ============================================================
# ATM PREDICTION FEATURE GENERATOR
# For the NEW 33-feature XGBoost model
# ============================================================

import numpy as np
import pandas as pd


# ------------------------------------------------------------
# Haversine distance
# ------------------------------------------------------------

def haversine_km(lat1, lon1, lat2, lon2):

    R = 6371.0

    lat1 = np.radians(lat1)
    lon1 = np.radians(lon1)

    lat2 = np.radians(lat2)
    lon2 = np.radians(lon2)

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (
        np.sin(dlat / 2) ** 2
        +
        np.cos(lat1)
        * np.cos(lat2)
        * np.sin(dlon / 2) ** 2
    )

    return 2 * R * np.arcsin(np.sqrt(a))


# ------------------------------------------------------------
# Main prediction-row generator
# ------------------------------------------------------------

def create_atm_prediction_rows(
    complaint,
    mule,
    atms,
    complaints,
    max_atms=50
):

    atms = atms.copy()
    complaints = complaints.copy()

    # ========================================================
    # 1. TIME
    # ========================================================

    prediction_time = pd.to_datetime(
        complaint["complaint_time"]
    )

    hour = prediction_time.hour

    day_of_week = prediction_time.dayofweek

    is_weekend = int(day_of_week >= 5)

    hour_sin = np.sin(
        2 * np.pi * hour / 24
    )

    hour_cos = np.cos(
        2 * np.pi * hour / 24
    )

    dow_sin = np.sin(
        2 * np.pi * day_of_week / 7
    )

    dow_cos = np.cos(
        2 * np.pi * day_of_week / 7
    )


    # ========================================================
    # 2. ATM DISTANCE FROM MULE
    # ========================================================

    distances = haversine_km(
        mule["lat"],
        mule["lng"],
        atms["lat"].values,
        atms["lng"].values
    )

    atms["mule_proximity_km"] = distances

    # Keep nearest candidate ATMs
    atms = (
        atms
        .sort_values("mule_proximity_km")
        .head(max_atms)
        .copy()
    )


    # ========================================================
    # 3. ATM DISTANCE FEATURES
    # ========================================================

    atms["mules_within_5km"] = (
        atms["mule_proximity_km"] <= 5
    ).astype(int)

    atms["mules_within_10km"] = (
        atms["mule_proximity_km"] <= 10
    ).astype(int)

    atms["mules_within_25km"] = (
        atms["mule_proximity_km"] <= 25
    ).astype(int)

    atms["mule_distance_inverse"] = (
        1 /
        (1 + atms["mule_proximity_km"])
    )


    # ========================================================
    # 4. HISTORICAL COMPLAINTS
    # ========================================================

    complaints["complaint_time"] = pd.to_datetime(
        complaints["complaint_time"]
    )

    # Only complaints BEFORE prediction time
    historical = complaints[
        complaints["complaint_time"] <= prediction_time
    ].copy()


    # --------------------------------------------------------
    # Time windows
    # --------------------------------------------------------

    t_1h = prediction_time - pd.Timedelta(hours=1)
    t_6h = prediction_time - pd.Timedelta(hours=6)
    t_24h = prediction_time - pd.Timedelta(hours=24)
    t_7d = prediction_time - pd.Timedelta(days=7)


    complaints_1h = historical[
        historical["complaint_time"] >= t_1h
    ]

    complaints_6h = historical[
        historical["complaint_time"] >= t_6h
    ]

    complaints_24h = historical[
        historical["complaint_time"] >= t_24h
    ]

    complaints_7d = historical[
        historical["complaint_time"] >= t_7d
    ]


    # ========================================================
    # 5. DISTRICT-LEVEL COMPLAINT COUNTS
    # ========================================================

    district = complaint["district"]
    state = complaint["state"]

    district_1h = complaints_1h[
        (complaints_1h["district"] == district)
        &
        (complaints_1h["state"] == state)
    ]

    district_6h = complaints_6h[
        (complaints_6h["district"] == district)
        &
        (complaints_6h["state"] == state)
    ]

    district_24h = complaints_24h[
        (complaints_24h["district"] == district)
        &
        (complaints_24h["state"] == state)
    ]

    district_7d = complaints_7d[
        (complaints_7d["district"] == district)
        &
        (complaints_7d["state"] == state)
    ]


    complaints_1h_count = len(district_1h)

    complaints_6h_count = len(district_6h)

    complaints_24h_count = len(district_24h)

    complaints_7d_count = len(district_7d)


    # ========================================================
    # 6. COMPLAINT VELOCITY
    # ========================================================

    complaint_velocity_6h = (
        complaints_6h_count / 6.0
    )


    # ========================================================
    # 7. DISTRICT FRAUD DENSITY
    # ========================================================

    total_historical = len(
        historical
    )

    if total_historical > 0:

        district_historical = historical[
            (historical["district"] == district)
            &
            (historical["state"] == state)
        ]

        district_fraud_density = (
            len(district_historical)
            /
            total_historical
        )

    else:

        district_fraud_density = 0.0


    # ========================================================
    # 8. MULE FEATURES
    # ========================================================

    # Your current mule input is one mule.
    # We calculate its relation to each candidate ATM.

    mule_cross_state = int(
        mule["state"] != complaint["state"]
    )

    cross_state_mule_count_24h = mule_cross_state

    cross_state_flag = mule_cross_state

    cross_state_ratio = float(
        mule_cross_state
    )

    mules_6h = 1
    mules_24h = 1
    mules_7d = 1


    # ========================================================
    # 9. ATM DISTRICT COUNT
    # ========================================================

    if "atm_count_district" in atms.columns:

        atm_count_values = (
            atms["atm_count_district"]
            .fillna(1)
        )

    else:

        district_counts = (
            atms
            .groupby(
                ["state", "district"]
            )
            .size()
        )

        atm_count_values = np.array([
            district_counts.get(
                (s, d),
                1
            )
            for s, d
            in zip(
                atms["state"],
                atms["district"]
            )
        ])


    # ========================================================
    # 10. BASELINE ATM FEATURES
    # ========================================================

    if "atm_baseline_activity" in atms.columns:

        baseline_activity = (
            atms["atm_baseline_activity"]
            .fillna(1)
            .values
        )

    else:

        baseline_activity = np.ones(
            len(atms)
        )


    if "atm_baseline_risk" in atms.columns:

        baseline_risk = (
            atms["atm_baseline_risk"]
            .fillna(0.5)
            .values
        )

    else:

        baseline_risk = np.full(
            len(atms),
            0.5
        )


    # ========================================================
    # 11. ATM ACTIVITY
    # ========================================================

    # Since we don't have future ATM withdrawal information,
    # use historical activity if present.
    #
    # Otherwise use baseline activity.

    atm_activity_24h = baseline_activity

    atm_activity_7d = baseline_activity


    # ========================================================
    # 12. PRESSURE FEATURES
    # ========================================================

    complaint_pressure = (
        complaints_6h_count
        /
        max(
            complaints_7d_count / 7,
            1
        )
    )

    mule_pressure = (
        mules_24h
        /
        max(
            mules_7d / 7,
            1
        )
    )


    # ========================================================
    # 13. BUILD DATAFRAME
    # ========================================================

    result = pd.DataFrame({

        "atm_id": atms["atm_id"].values,

        "prediction_time": prediction_time,

        "state": atms["state"].values,

        "district": atms["district"].values,

        "atm_count_district":
            np.asarray(atm_count_values),

        "atm_baseline_activity":
            baseline_activity,

        "atm_baseline_risk":
            baseline_risk,

        "district_fraud_density":
            district_fraud_density,

        "hour":
            hour,

        "day_of_week":
            day_of_week,

        "is_weekend":
            is_weekend,

        "hour_sin":
            hour_sin,

        "hour_cos":
            hour_cos,

        "dow_sin":
            dow_sin,

        "dow_cos":
            dow_cos,

        "complaints_1h":
            complaints_1h_count,

        "complaints_6h":
            complaints_6h_count,

        "complaints_24h":
            complaints_24h_count,

        "complaints_7d":
            complaints_7d_count,

        "complaint_velocity_6h":
            complaint_velocity_6h,

        "mules_6h":
            mules_6h,

        "mules_24h":
            mules_24h,

        "mules_7d":
            mules_7d,

        "cross_state_mule_count_24h":
            cross_state_mule_count_24h,

        "cross_state_flag":
            cross_state_flag,

        "cross_state_ratio":
            cross_state_ratio,

        "mule_proximity_km":
            atms["mule_proximity_km"].values,

        "mules_within_5km":
            atms["mules_within_5km"].values,

        "mules_within_10km":
            atms["mules_within_10km"].values,

        "mules_within_25km":
            atms["mules_within_25km"].values,

        "complaint_pressure":
            complaint_pressure,

        "mule_pressure":
            mule_pressure,

        "atm_activity_24h":
            atm_activity_24h,

        "atm_activity_7d":
            atm_activity_7d,

        "mule_distance_inverse":
            atms["mule_distance_inverse"].values
    })


    # ========================================================
    # 14. INTERACTION FEATURES
    # ========================================================

    result["velocity_density_interaction"] = (
        result["complaint_velocity_6h"]
        *
        result["district_fraud_density"]
    )

    result["mule_complaint_interaction"] = (
        result["mule_distance_inverse"]
        *
        result["complaint_velocity_6h"]
    )


    # ========================================================
    # 15. ENSURE EXACT MODEL FEATURE ORDER
    # ========================================================

    missing = [
        f for f in FEATURES
        if f not in result.columns
    ]

    if missing:

        raise ValueError(
            f"Missing model features: {missing}"
        )

    result = result[
        [
            "atm_id",
            "prediction_time",
            "state",
            "district"
        ]
        + FEATURES
    ]

    return result


def run(complaint,mule):
    all_predictions = []
    atms=pd.read_csv('atm_locations.csv')
    # mule=pd.read_csv('mule_accounts.csv')
    complaints=pd.read_csv('complaints.csv')
    atm_features = create_atm_prediction_rows(
        complaint=complaint,
        mule=mule,
        atms=atms,
        complaints=complaints,
        max_atms=50
        )
    X_case = atm_features[FEATURES].copy()


    risk_probability = model.predict_proba(
        X_case
        )[:, 1]


    atm_features["risk_score"] = risk_probability

    atm_features = atm_features.sort_values(
        "risk_score",
        ascending=False
        ).reset_index(drop=True)

    # --------------------------------------------------------
    # Risk category
    # --------------------------------------------------------

    def risk_category(score):

        if score >= 0.60:
            return "CRITICAL"

        elif score >= 0.50:
            return "HIGH"

        elif score >= 0.30:
            return "MEDIUM"

        else:
            return "LOW"

    atm_features["risk_level"] = (
        atm_features["risk_score"]
        .apply(risk_category)
    )

    # --------------------------------------------------------
    # Display TOP 10
    # --------------------------------------------------------
    #

    display_columns = [
        "atm_id",
        "state",
        "district",
        "risk_score",
        "risk_level"
    ]

    print("\nTOP 10 ATM RISK PREDICTIONS")

    print(atm_features[
        display_columns
    ].head(10))

    # --------------------------------------------------------
    # Save for combined comparison
    # --------------------------------------------------------

    top = atm_features.head(10).copy()

    all_predictions.append(top)
    return all_predictions


###############################################################
###############################################################

def predict(
    complaint_id,
    complaint_state,
    complaint_district,
    crime_type,
    amount,
    complaint_time,
    mule_id,
    mule_state,
    mule_district,
    mule_lat,
    mule_lng
):
    # print("Complaint:")
    # print({
    #     "complaint_id": complaint_id,
    #     "state": complaint_state,
    #     "district": complaint_district,
    #     "crime_type": crime_type,
    #     "amount": amount,
    #     "complaint_time": complaint_time
    # })

    # print("Mule:")
    # print({
    #     "mule_id": mule_id,
    #     "state": mule_state,
    #     "district": mule_district,
    #     "lat": mule_lat,
    #     "lng": mule_lng
    # })
    val=run(
        complaint={
            "complaint_id": complaint_id,
            "state": complaint_state,
            "district": complaint_district,
            "crime_type": crime_type,
            "amount": amount,
            "complaint_time": complaint_time
        },
        mule={
            "mule_id": mule_id,
            "state": mule_state,
            "district": mule_district,
            "lat": mule_lat,
            "lng": mule_lng
        }  
    )
    return val




print(predict(
    complaint_id="TEST_HIGH_003",
    complaint_state="Rajasthan",
    complaint_district="Jaipur",
    crime_type="Loan Fraud",
    amount=750000,
    complaint_time="2026-02-13 20:00:00",
    mule_id="MULE_HIGH_003",
    mule_state="Haryana",
    mule_district="Gurugram",
    mule_lat=28.4595,
    mule_lng=77.0266
))
