import math
import datetime
from typing import List, Dict, Any, Tuple, Optional
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from backend.app.models import ATMLocation, Complaint, MuleAccount, utc_now

FEATURE_COLUMNS = [
    "district_fraud_density",
    "complaint_velocity_6h",
    "mule_proximity_km",
    "atm_count_in_district",
    "cross_state_flag"
]


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great circle distance in km between two lat/lon pairs."""
    r = 6371.0  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c


def compute_atm_features(
    db: Session,
    ref_time: Optional[datetime.datetime] = None
) -> Tuple[List[str], pd.DataFrame]:
    """
    Extracts the feature vector per ATM from the database at reference time.
    Features:
    - district_fraud_density
    - complaint_velocity_6h
    - mule_proximity_km
    - atm_count_in_district
    - cross_state_flag
    """
    if ref_time is None:
        ref_time = utc_now()

    # Ensure ref_time is tz-naive or tz-aware matching DB
    t_7d = ref_time - datetime.timedelta(days=7)
    t_6h = ref_time - datetime.timedelta(hours=6)

    atms = db.query(ATMLocation).all()
    if not atms:
        return [], pd.DataFrame()

    mules = db.query(MuleAccount).all()
    complaints = db.query(Complaint).filter(Complaint.timestamp >= t_7d, Complaint.timestamp <= ref_time).all()

    # District ATM counts
    district_atm_counts: Dict[Tuple[str, str], int] = {}
    for a in atms:
        key = (a.state, a.district)
        district_atm_counts[key] = district_atm_counts.get(key, 0) + 1

    # District complaints over 7d and 6h
    complaints_7d: Dict[Tuple[str, str], int] = {}
    complaints_6h: Dict[Tuple[str, str], int] = {}
    for c in complaints:
        key = (c.state, c.district)
        complaints_7d[key] = complaints_7d.get(key, 0) + 1
        # Handle naive vs aware comparison if needed
        c_ts = c.timestamp
        if c_ts.tzinfo is not None and t_6h.tzinfo is None:
            c_ts = c_ts.replace(tzinfo=None)
        elif c_ts.tzinfo is None and t_6h.tzinfo is not None:
            c_ts = c_ts.replace(tzinfo=datetime.timezone.utc)

        if c_ts >= t_6h:
            complaints_6h[key] = complaints_6h.get(key, 0) + 1

    # Mule clusters and cross-state flags per district
    mule_centroids: Dict[Tuple[str, str], Tuple[float, float]] = {}
    district_cross_state: Dict[Tuple[str, str], bool] = {}

    mule_district_coords: Dict[Tuple[str, str], List[Tuple[float, float]]] = {}
    for m in mules:
        key = (m.registered_state, m.registered_district)
        mule_district_coords.setdefault(key, []).append((m.registered_lat, m.registered_lng))
        if m.is_cross_state:
            district_cross_state[key] = True

    for key, coords in mule_district_coords.items():
        avg_lat = sum(c[0] for c in coords) / len(coords)
        avg_lng = sum(c[1] for c in coords) / len(coords)
        mule_centroids[key] = (avg_lat, avg_lng)

    atm_ids = []
    rows = []
    for atm in atms:
        atm_ids.append(atm.atm_id)
        key = (atm.state, atm.district)

        # 1. district_fraud_density (daily average over 7d)
        total_7d = complaints_7d.get(key, 0)
        density = total_7d / 7.0

        # 2. complaint_velocity_6h
        vel_6h = complaints_6h.get(key, 0)

        # 3. mule_proximity_km
        centroid = mule_centroids.get(key)
        if centroid:
            prox_km = haversine_km(atm.lat, atm.lng, centroid[0], centroid[1])
        else:
            prox_km = 50.0  # Default baseline distance

        # 4. atm_count_in_district
        atm_count = district_atm_counts.get(key, 1)

        # 5. cross_state_flag
        cross_state = 1.0 if district_cross_state.get(key, False) else 0.0

        rows.append({
            "district_fraud_density": density,
            "complaint_velocity_6h": float(vel_6h),
            "mule_proximity_km": prox_km,
            "atm_count_in_district": float(atm_count),
            "cross_state_flag": cross_state
        })

    df = pd.DataFrame(rows)
    return atm_ids, df
