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




def create_atm_prediction_rows(
    complaint,
    mule,
    atms,
    complaints
):
    
    rows = []
    
    prediction_time = pd.to_datetime(
        complaint["complaint_time"]
    )
    
    cross_state = get_cross_state_flag(
        complaint["state"],
        mule["state"]
    )
    
    for _, atm in atms.iterrows():
        
        district = atm["district"]
        
        # Feature 1
        density = get_fraud_density(
            district,
            complaints
        )
        
        # Feature 2
        velocity = get_complaint_velocity(
            district,
            prediction_time,
            complaints
        )
        
        # Feature 3
        mule_distance = get_mule_proximity(
            mule["lat"],
            mule["lng"],
            atm["lat"],
            atm["lng"]
        )
        
        # Feature 4
        atm_count = get_atm_count(
            district,
            atms
        )
        
        # Feature 5
        cross_state_flag = cross_state
        
        rows.append({
            "atm_id": atm["atm_id"],
            
            "district_fraud_density":
                density,
            
            "complaint_velocity_6h":
                velocity,
            
            "mule_proximity_km":
                mule_distance,
            
            "atm_count_district":
                atm_count,
            
            "cross_state_flag":
                cross_state_flag
        })
    
    return pd.DataFrame(rows)



new_complaint={
  "complaint_id": "TEST002",
  "state": "Maharashtra",
  "district": "Mumbai",
  "crime_type": "Online Banking Fraud",
  "amount": 25000,
  "complaint_time": "2026-09-17 11:30:00"
}
mule ={
    "mule_id": "NEW_MULE",
  "state": "Maharashtra",
  "district": "Thane",
  "lat": 19.2183,
  "lng": 72.9781
}
atm_features = create_atm_prediction_rows(
    complaint=new_complaint,
    mule=mule,
    atms=atms,
    complaints=complaints
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