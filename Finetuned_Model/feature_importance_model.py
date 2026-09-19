new_model=joblib.load('/kaggle/input/models/shubham3421/xgboost-crime/other/feature_importance_model/1/xgb_no_interactions.pkl')
print(new_model)


# ============================================================
# REALISTIC ATM RISK TEST CASES
# ============================================================

import pandas as pd
import numpy as np


# ============================================================
# 1. TEST CASES
# ============================================================

test_cases = [

    # --------------------------------------------------------
    # CASE 1 — High risk
    # Complaint in Bengaluru
    # Mule in Hyderabad (cross-state)
    # Large amount
    # --------------------------------------------------------
    {
        "case": "HIGH_RISK_CROSS_STATE",

        "complaint": {
            "complaint_id": "TEST_HIGH_001",
            "state": "Karnataka",
            "district": "Bengaluru Urban",
            "crime_type": "Investment Fraud",
            "amount": 1000000,
            "complaint_time": "2026-02-13 19:30:00"
        },

        "mule": {
            "mule_id": "MULE_HIGH_001",
            "state": "Telangana",
            "district": "Hyderabad",
            "lat": 17.3850,
            "lng": 78.4867
        }
    },


    # --------------------------------------------------------
    # CASE 2 — High risk
    # Complaint and mule in same district
    # Very large transaction
    # --------------------------------------------------------
    {
        "case": "HIGH_RISK_LOCAL",

        "complaint": {
            "complaint_id": "TEST_HIGH_002",
            "state": "Uttar Pradesh",
            "district": "Varanasi",
            "crime_type": "Investment Fraud",
            "amount": 800000,
            "complaint_time": "2026-02-13 18:00:00"
        },

        "mule": {
            "mule_id": "MULE_HIGH_002",
            "state": "Uttar Pradesh",
            "district": "Varanasi",
            "lat": 25.3176,
            "lng": 82.9739
        }
    },


    # --------------------------------------------------------
    # CASE 3 — Medium risk
    # Cross-state but smaller amount
    # --------------------------------------------------------
    {
        "case": "MEDIUM_RISK_CROSS_STATE",

        "complaint": {
            "complaint_id": "TEST_MED_001",
            "state": "Maharashtra",
            "district": "Mumbai",
            "crime_type": "Online Shopping Fraud",
            "amount": 150000,
            "complaint_time": "2026-02-13 14:00:00"
        },

        "mule": {
            "mule_id": "MULE_MED_001",
            "state": "Gujarat",
            "district": "Ahmedabad",
            "lat": 23.0225,
            "lng": 72.5714
        }
    },


    # --------------------------------------------------------
    # CASE 4 — Lower risk
    # Small amount
    # Same state
    # --------------------------------------------------------
    {
        "case": "LOW_RISK_LOCAL",

        "complaint": {
            "complaint_id": "TEST_LOW_001",
            "state": "West Bengal",
            "district": "Kolkata",
            "crime_type": "UPI Fraud",
            "amount": 10000,
            "complaint_time": "2026-02-13 11:00:00"
        },

        "mule": {
            "mule_id": "MULE_LOW_001",
            "state": "West Bengal",
            "district": "Kolkata",
            "lat": 22.5726,
            "lng": 88.3639
        }
    },


    # --------------------------------------------------------
    # CASE 5 — High risk
    # Cross-state + very large amount
    # --------------------------------------------------------
    {
        "case": "HIGH_RISK_NORTH",

        "complaint": {
            "complaint_id": "TEST_HIGH_003",
            "state": "Rajasthan",
            "district": "Jaipur",
            "crime_type": "Loan Fraud",
            "amount": 750000,
            "complaint_time": "2026-02-13 20:00:00"
        },

        "mule": {
            "mule_id": "MULE_HIGH_003",
            "state": "Haryana",
            "district": "Gurugram",
            "lat": 28.4595,
            "lng": 77.0266
        }
    }
]


# ============================================================
# 2. RUN ALL TEST CASES
# ============================================================

all_predictions = []
atms=pd.read_csv('/kaggle/input/datasets/shubham3421/advance-train-data-for-atm-fraud/atm_locations.csv')
mule=pd.read_csv('/kaggle/input/datasets/shubham3421/advance-train-data-for-atm-fraud/mule_accounts.csv')
complaints=pd.read_csv('/kaggle/input/datasets/shubham3421/advance-train-data-for-atm-fraud/complaints.csv')


for test in test_cases:

    print("\n")
    print("=" * 80)
    print("TEST CASE:", test["case"])
    print("=" * 80)

    complaint = test["complaint"]
    mule = test["mule"]

    print("Complaint:")
    print(
        complaint["state"],
        "|",
        complaint["district"],
        "|",
        complaint["crime_type"],
        "| ₹",
        complaint["amount"]
    )

    print("\nMule:")
    print(
        mule["state"],
        "|",
        mule["district"]
    )

    # --------------------------------------------------------
    # Generate ML features for candidate ATMs
    # --------------------------------------------------------

    atm_features = create_atm_prediction_rows(
        complaint=complaint,
        mule=mule,
        atms=atms,
        complaints=complaints,
        max_atms=50
    )

    # --------------------------------------------------------
    # Keep only model features
    # --------------------------------------------------------

    X_case = atm_features[FEATURES].copy()

    # --------------------------------------------------------
    # Predict probability
    # --------------------------------------------------------

    risk_probability = new_model.predict_proba(
        X_case
    )[:, 1]

    atm_features["risk_score"] = risk_probability

    # --------------------------------------------------------
    # Sort highest risk first
    # --------------------------------------------------------

    atm_features = atm_features.sort_values(
        "risk_score",
        ascending=False
    ).reset_index(drop=True)

    # --------------------------------------------------------
    # Risk category
    # --------------------------------------------------------

    def risk_category(score):

        if score >= 0.80:
            return "CRITICAL"

        elif score >= 0.60:
            return "HIGH"

        elif score >= 0.40:
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

    display_columns = [
        "atm_id",
        "state",
        "district",
        "risk_score",
        "risk_level"
    ]

    print("\nTOP 10 ATM RISK PREDICTIONS")

    display(
        atm_features[
            display_columns
        ].head(10)
    )

    # --------------------------------------------------------
    # Save for combined comparison
    # --------------------------------------------------------

    top = atm_features.head(10).copy()

    top["test_case"] = test["case"]

    all_predictions.append(top)


# ============================================================
# 3. COMBINE ALL RESULTS
# ============================================================

all_predictions_df = pd.concat(
    all_predictions,
    ignore_index=True
)

print("\n")
print("=" * 80)
print("ALL HIGH-RISK ATM PREDICTIONS")
print("=" * 80)

display(
    all_predictions_df[
        [
            "test_case",
            "atm_id",
            "state",
            "district",
            "risk_score",
            "risk_level"
        ]
    ]
)