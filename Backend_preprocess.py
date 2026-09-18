import joblib

model = joblib.load(
    "/kaggle/input/models/shubham3421/xgboost-crime/other/cyber-atm/1/xgboost_cybercrime_model.pkl"
)
print(model)

complaints = pd.read_csv("/kaggle/input/datasets/shubham3421/atm-fraud/complaints.csv")
# mules = pd.read_csv("/kaggle/working/mule_accounts.csv")
atms = pd.read_csv("/kaggle/input/datasets/shubham3421/atm-fraud/atm_locations.csv")
withdrawals = pd.read_csv("/kaggle/input/datasets/shubham3421/atm-fraud/withdrawals.csv")


def get_fraud_density(district, complaints):
    
    district_count = (
        complaints["district"]
        .eq(district)
        .sum()
    )
    
    total_count = len(complaints)
    
    if total_count == 0:
        return 0.0
    
    return district_count / total_count

def get_complaint_velocity(
    district,
    prediction_time,
    complaints
):
    
    prediction_time = pd.to_datetime(prediction_time)
    
    start_time = prediction_time - pd.Timedelta(hours=6)
    
    complaint_times = pd.to_datetime(
        complaints["complaint_time"]
    )
    
    mask = (
        (complaints["district"] == district)
        &
        (complaint_times >= start_time)
        &
        (complaint_times < prediction_time)
    )
    
    return int(mask.sum())

def calculate_distance(
    lat1,
    lon1,
    lat2,
    lon2
):
    
    R = 6371.0
    
    lat1 = np.radians(lat1)
    lat2 = np.radians(lat2)
    
    dlat = lat2 - lat1
    dlon = np.radians(lon2) - np.radians(lon1)
    
    a = (
        np.sin(dlat / 2) ** 2
        +
        np.cos(lat1)
        * np.cos(lat2)
        * np.sin(dlon / 2) ** 2
    )
    
    c = 2 * np.arcsin(np.sqrt(a))
    
    return R * c

def get_mule_proximity(
    mule_lat,
    mule_lng,
    atm_lat,
    atm_lng
):
    
    return calculate_distance(
        mule_lat,
        mule_lng,
        atm_lat,
        atm_lng
    )

def get_atm_count(
    district,
    atms
):
    
    return int(
        atms["district"]
        .eq(district)
        .sum()
    )


def get_cross_state_flag(
    complaint_state,
    mule_state
):
    
    return int(
        complaint_state != mule_state
    )







#------------------------------
# ============================================================
# FAST ATM PREDICTION FEATURE GENERATOR
# ============================================================

import pandas as pd
import numpy as np


# ------------------------------------------------------------
# 1. Vectorized Haversine distance
# ------------------------------------------------------------

def get_vectorized_mule_distance(
    mule_lat,
    mule_lng,
    atm_lats,
    atm_lngs
):
    """
    Calculate distance from one mule location to all ATMs
    simultaneously.
    Returns distance in KM.
    """

    R = 6371.0

    lat1 = np.radians(float(mule_lat))
    lng1 = np.radians(float(mule_lng))

    lat2 = np.radians(
        np.asarray(atm_lats, dtype=float)
    )
    lng2 = np.radians(
        np.asarray(atm_lngs, dtype=float)
    )

    dlat = lat2 - lat1
    dlng = lng2 - lng1

    a = (
        np.sin(dlat / 2) ** 2
        +
        np.cos(lat1)
        * np.cos(lat2)
        * np.sin(dlng / 2) ** 2
    )

    # Numerical safety
    a = np.clip(a, 0, 1)

    return 2 * R * np.arcsin(np.sqrt(a))


# ------------------------------------------------------------
# 2. FAST ATM PREDICTION ROW GENERATOR
# ------------------------------------------------------------

def create_atm_prediction_rows(
    complaint,
    mule,
    atms,
    complaints,
    max_atms=50,
    mule_radius_km=100,
    top_fraud_districts=20
):
    
    prediction_time = pd.to_datetime(
        complaint["complaint_time"]
    )

    # ========================================================
    # A. CROSS-STATE
    # ========================================================

    cross_state = get_cross_state_flag(
        complaint["state"],
        mule["state"]
    )


    # ========================================================
    # B. PRE-COMPUTE ATM COUNT
    # ========================================================

    atm_counts = (
        atms.groupby("district")
        .size()
        .to_dict()
    )


    # ========================================================
    # C. PRE-COMPUTE FRAUD DENSITY
    # ========================================================

    district_counts = (
        complaints.groupby("district")
        .size()
    )

    total_complaints = max(
        len(complaints),
        1
    )

    density_map = (
        district_counts / total_complaints
    ).to_dict()


    # ========================================================
    # D. PRE-COMPUTE 6-HOUR COMPLAINT VELOCITY
    # ========================================================

    # Make sure complaint_time is datetime
    if not pd.api.types.is_datetime64_any_dtype(
        complaints["complaint_time"]
    ):
        complaints = complaints.copy()

        complaints["complaint_time"] = pd.to_datetime(
            complaints["complaint_time"],
            errors="coerce"
        )

    recent_start = (
        prediction_time -
        pd.Timedelta(hours=6)
    )

    recent_complaints = complaints[
        (complaints["complaint_time"] > recent_start)
        &
        (complaints["complaint_time"] <= prediction_time)
    ]

    velocity_map = (
        recent_complaints
        .groupby("district")
        .size()
        .to_dict()
    )


    # ========================================================
    # E. VECTORIZE MULE → ATM DISTANCES
    # ========================================================

    atm_temp = atms.copy()

    atm_temp["mule_distance"] = (
        get_vectorized_mule_distance(
            mule["lat"],
            mule["lng"],
            atm_temp["lat"].values,
            atm_temp["lng"].values
        )
    )


    # ========================================================
    # F. SELECT RELEVANT ATMs
    # ========================================================

    # ---- 1. ATMs close to mule -----------------------------

    near_mule = atm_temp[
        atm_temp["mule_distance"] <= mule_radius_km
    ]


    # ---- 2. Complaint district -----------------------------

    complaint_district_atms = atm_temp[
        atm_temp["district"]
        ==
        complaint["district"]
    ]


    # ---- 3. Mule district ---------------------------------

    mule_district_atms = atm_temp[
        atm_temp["district"]
        ==
        mule["district"]
    ]


    # ---- 4. Historically high-fraud districts ------------

    high_fraud_districts = (
        district_counts
        .nlargest(top_fraud_districts)
        .index
    )

    high_fraud_atms = atm_temp[
        atm_temp["district"].isin(
            high_fraud_districts
        )
    ]


    # ========================================================
    # G. COMBINE CANDIDATES
    # ========================================================

    candidates = pd.concat(
        [
            near_mule,
            complaint_district_atms,
            mule_district_atms,
            high_fraud_atms
        ],
        ignore_index=True
    )

    candidates = candidates.drop_duplicates(
        subset="atm_id"
    )


    # ========================================================
    # H. LIMIT NUMBER OF ATMs
    # ========================================================

    if len(candidates) > max_atms:

        # Give priority to:
        # 1. nearby ATMs
        # 2. complaint/mule districts
        # 3. historical fraud districts

        priority = np.zeros(
            len(candidates)
        )

        priority += np.where(
            candidates["mule_distance"] <= mule_radius_km,
            1000,
            0
        )

        priority += np.where(
            candidates["district"]
            ==
            complaint["district"],
            500,
            0
        )

        priority += np.where(
            candidates["district"]
            ==
            mule["district"],
            500,
            0
        )

        # Smaller distance gets higher priority
        priority += (
            100 /
            (candidates["mule_distance"] + 1)
        )

        candidates["_priority"] = priority

        candidates = (
            candidates
            .sort_values(
                "_priority",
                ascending=False
            )
            .head(max_atms)
            .drop(columns="_priority")
        )


    # ========================================================
    # I. CREATE FINAL FEATURE TABLE
    # ========================================================

    result = pd.DataFrame({

        "atm_id":
            candidates["atm_id"].values,

        "district_fraud_density":
            candidates["district"]
            .map(density_map)
            .fillna(0)
            .values,

        "complaint_velocity_6h":
            candidates["district"]
            .map(velocity_map)
            .fillna(0)
            .values,

        "mule_proximity_km":
            candidates["mule_distance"]
            .values,

        "atm_count_district":
            candidates["district"]
            .map(atm_counts)
            .fillna(0)
            .values,

        "cross_state_flag":
            cross_state
    })


    # ========================================================
    # J. FINAL CLEANUP
    # ========================================================

    result = result.replace(
        [np.inf, -np.inf],
        np.nan
    )

    result = result.fillna(0)

    return result


print("✅ Fast ATM prediction function loaded")
print("⚡ Vectorized distance + precomputed features + selective ATMs")




#-------------------------------





new_complaint = {
    "complaint_id": "TEST002",
    "state": "West Bengal",
    "district": "Kolkata",
    "crime_type": "UPI Fraud",
    "amount": 15000,
    "complaint_time": "2026-10-27 10:00:00"
}
mule = {
    "mule_id": "MULE002",
    "state": "West Bengal",
    "district": "Kolkata",
    "lat": 22.5726,
    "lng": 88.3639
}
atm_features = create_atm_prediction_rows(
    complaint=new_complaint,
    mule=mule,
    atms=atms,
    complaints=complaints,
    max_atms=50 #introduced max_atms parameter to limit the number of ATMs considered for prediction
)


FEATURES = [
    "district_fraud_density",
    "complaint_velocity_6h",
    "mule_proximity_km",
    "atm_count_district",
    "cross_state_flag"
]

atm_features["risk_score"] = model.predict_proba(
    atm_features[FEATURES]
)[:, 1]


atm_results = atm_features.merge(
    atms,
    on="atm_id",
    how="left"
)
atm_results=atm_results.sort_values(by="risk_score",ascending=False)
atm_results.head(10)


##----- To get the top 10 ATMs with the highest risk scores, you can use the following code:
atm_results = atm_features.merge(
    atms,
    on="atm_id",
    how="left"
)
atm_results=atm_results.sort_values(by="risk_score",ascending=False)
atm_results.head(10)