# ============================================================
# CYBERCRIME PREDICTIVE ANALYTICS
# UPDATED / CONSISTENT SYNTHETIC DATA GENERATOR
# ============================================================
#
# Main ML target:
#   target = 1 if suspicious withdrawal occurs
#            at that ATM within next 24 hours
#
# ML FEATURES:
#   1. district_fraud_density
#   2. complaint_velocity_6h
#   3. mule_proximity_km
#   4. atm_count_district
#   5. cross_state_flag
#
# IMPORTANT:
#   - Target is generated from a latent risk process.
#   - No artificial target promotion is performed.
#   - ATM selection is based on mule proximity.
#   - A withdrawal can occur at an ATM outside the
#     complaint district.
# ============================================================

import numpy as np
import pandas as pd

from datetime import datetime, timedelta
from collections import defaultdict


# ============================================================
# 1. CONFIGURATION
# ============================================================

SEED = 42
rng = np.random.default_rng(SEED)

CONFIG = {
    "start_date": "2026-01-01",
    "num_days": 30,

    # PRD
    "complaints_per_day": 8000,

    # ATM backbone
    "num_atms": 1500,

    # Prediction snapshots
    "prediction_frequency_hours": 6,

    # Cross-state mule requirement
    "cross_state_rate": 0.25,

    # Complaint spikes
    "spike_days": {
        "2026-01-10": 1.50,
        "2026-01-20": 1.40,
        "2026-01-26": 1.60
    },

    # Mule accounts
    "mule_accounts_per_complaint": 0.18,

    # Desired approximate target rate.
    # This is NOT used to artificially modify targets.
    "target_positive_rate": 0.10
}


# ============================================================
# 2. I4C / CFCFRMS 2023 CALIBRATION
# ============================================================

I4C_COMPLAINTS_2023 = {
    "Andhra Pradesh": 33507,
    "Assam": 7621,
    "Bihar": 42029,
    "Chhattisgarh": 18147,
    "Delhi": 58748,
    "Gujarat": 121701,
    "Haryana": 76736,
    "Jharkhand": 10040,
    "Karnataka": 64301,
    "Kerala": 23757,
    "Madhya Pradesh": 37435,
    "Maharashtra": 125153,
    "Odisha": 16869,
    "Punjab": 19252,
    "Rajasthan": 77769,
    "Tamil Nadu": 59549,
    "Telangana": 71426,
    "Uttarakhand": 17958,
    "Uttar Pradesh": 197547,
    "West Bengal": 29804
}

state_names = list(I4C_COMPLAINTS_2023.keys())

state_counts = np.array(
    list(I4C_COMPLAINTS_2023.values()),
    dtype=float
)

state_probabilities = (
    state_counts / state_counts.sum()
)

state_probability_map = dict(
    zip(
        state_names,
        state_probabilities
    )
)

print("=" * 70)
print("I4C-CALIBRATED STATE DISTRIBUTION")
print("=" * 70)

for state, prob in sorted(
    state_probability_map.items(),
    key=lambda x: x[1],
    reverse=True
)[:10]:

    print(
        f"{state:<20} "
        f"{prob:.4f} "
        f"({prob * 100:.2f}%)"
    )


# ============================================================
# 3. DISTRICT / CITY BACKBONE
# ============================================================

DISTRICTS = {

    "Delhi": [
        ("New Delhi", 28.6139, 77.2090),
        ("North Delhi", 28.7041, 77.1025),
        ("South Delhi", 28.5355, 77.2490),
        ("East Delhi", 28.6280, 77.2770),
        ("West Delhi", 28.6517, 77.1500),
    ],

    "Uttar Pradesh": [
        ("Lucknow", 26.8467, 80.9462),
        ("Kanpur Nagar", 26.4499, 80.3319),
        ("Agra", 27.1767, 78.0081),
        ("Varanasi", 25.3176, 82.9739),
        ("Prayagraj", 25.4358, 81.8463),
        ("Gautam Buddha Nagar", 28.5355, 77.3910),
        ("Ghaziabad", 28.6692, 77.4538),
        ("Meerut", 28.9845, 77.7064),
    ],

    "Maharashtra": [
        ("Mumbai", 19.0760, 72.8777),
        ("Pune", 18.5204, 73.8567),
        ("Nagpur", 21.1458, 79.0882),
        ("Nashik", 19.9975, 73.7898),
        ("Thane", 19.2183, 72.9781),
        ("Aurangabad", 19.8762, 75.3433),
    ],

    "Rajasthan": [
        ("Jaipur", 26.9124, 75.7873),
        ("Jodhpur", 26.2389, 73.0243),
        ("Udaipur", 24.5854, 73.7125),
        ("Kota", 25.2138, 75.8648),
        ("Alwar", 27.5530, 76.6346),
        ("Bharatpur", 27.2152, 77.5030),
    ],

    "Telangana": [
        ("Hyderabad", 17.3850, 78.4867),
        ("Warangal", 17.9689, 79.5941),
        ("Nizamabad", 18.6725, 78.0941),
        ("Karimnagar", 18.4386, 79.1288),
    ],

    "Karnataka": [
        ("Bengaluru Urban", 12.9716, 77.5946),
        ("Mysuru", 12.2958, 76.6394),
        ("Mangaluru", 12.9141, 74.8560),
        ("Hubballi", 15.3647, 75.1240),
        ("Belagavi", 15.8497, 74.4977),
    ],

    "Gujarat": [
        ("Ahmedabad", 23.0225, 72.5714),
        ("Surat", 21.1702, 72.8311),
        ("Vadodara", 22.3072, 73.1812),
        ("Rajkot", 22.3039, 70.8022),
    ],

    "Haryana": [
        ("Gurugram", 28.4595, 77.0266),
        ("Faridabad", 28.4089, 77.3178),
        ("Panipat", 29.3909, 76.9635),
        ("Hisar", 29.1492, 75.7217),
    ],

    "Tamil Nadu": [
        ("Chennai", 13.0827, 80.2707),
        ("Coimbatore", 11.0168, 76.9558),
        ("Madurai", 9.9252, 78.1198),
        ("Salem", 11.6643, 78.1460),
    ],

    "West Bengal": [
        ("Kolkata", 22.5726, 88.3639),
        ("Durgapur", 23.5204, 87.3119),
        ("Siliguri", 26.7271, 88.3953),
        ("Asansol", 23.6739, 87.1480),
    ],

    "Andhra Pradesh": [
        ("Visakhapatnam", 17.6868, 83.2185),
        ("Vijayawada", 16.5062, 80.6480),
        ("Guntur", 16.3067, 80.4365),
        ("Tirupati", 13.6288, 79.4192),
    ],

    "Madhya Pradesh": [
        ("Bhopal", 23.2599, 77.4126),
        ("Indore", 22.7196, 75.8577),
        ("Gwalior", 26.2183, 78.1828),
        ("Jabalpur", 23.1815, 79.9864),
    ],

    "Bihar": [
        ("Patna", 25.5941, 85.1376),
        ("Gaya", 24.7914, 85.0002),
        ("Muzaffarpur", 26.1197, 85.3910),
    ],

    "Kerala": [
        ("Thiruvananthapuram", 8.5241, 76.9366),
        ("Kochi", 9.9312, 76.2673),
        ("Kozhikode", 11.2588, 75.7804),
    ],

    "Odisha": [
        ("Bhubaneswar", 20.2961, 85.8245),
        ("Cuttack", 20.4625, 85.8828),
        ("Rourkela", 22.2604, 84.8536),
    ],

    "Punjab": [
        ("Ludhiana", 30.9010, 75.8573),
        ("Amritsar", 31.6340, 74.8723),
        ("Jalandhar", 31.3260, 75.5762),
    ],

    "Jharkhand": [
        ("Ranchi", 23.3441, 85.3096),
        ("Jamshedpur", 22.8046, 86.2029),
        ("Dhanbad", 23.7957, 86.4304),
    ],

    "Chhattisgarh": [
        ("Raipur", 21.2514, 81.6296),
        ("Bhilai", 21.1938, 81.3509),
        ("Bilaspur", 22.0797, 82.1409),
    ],

    "Uttarakhand": [
        ("Dehradun", 30.3165, 78.0322),
        ("Haridwar", 29.9457, 78.1642),
        ("Haldwani", 29.2183, 79.5130),
    ],

    "Assam": [
        ("Guwahati", 26.1445, 91.7362),
        ("Dibrugarh", 27.4728, 94.9120),
    ]
}


# ============================================================
# 4. BANKS / CRIME TYPES
# ============================================================

BANKS = [
    "SBI",
    "HDFC Bank",
    "ICICI Bank",
    "Axis Bank",
    "Bank of Baroda",
    "PNB",
    "Canara Bank",
    "Union Bank",
    "Kotak Mahindra Bank",
    "IndusInd Bank"
]

CRIME_TYPES = [
    "UPI Fraud",
    "Phishing",
    "Digital Arrest",
    "Investment Fraud",
    "Loan Fraud",
    "E-commerce Fraud",
    "OTP Fraud",
    "Card Fraud"
]

CRIME_WEIGHTS = np.array([
    0.30,
    0.15,
    0.10,
    0.15,
    0.08,
    0.10,
    0.07,
    0.05
])

CRIME_WEIGHTS = (
    CRIME_WEIGHTS /
    CRIME_WEIGHTS.sum()
)


# ============================================================
# 5. HELPER FUNCTIONS
# ============================================================

def haversine(
    lat1,
    lon1,
    lat2,
    lon2
):

    R = 6371.0

    lat1 = np.radians(lat1)
    lat2 = np.radians(lat2)

    dlat = lat2 - lat1
    dlon = np.radians(lon2 - lon1)

    a = (
        np.sin(dlat / 2) ** 2
        +
        np.cos(lat1)
        * np.cos(lat2)
        * np.sin(dlon / 2) ** 2
    )

    return (
        2
        * R
        * np.arcsin(
            np.sqrt(a)
        )
    )


def sigmoid(x):

    return 1.0 / (
        1.0 +
        np.exp(
            -np.clip(x, -30, 30)
        )
    )


# ============================================================
# 6. CREATE ATM LOCATIONS
# ============================================================

print("\n" + "=" * 70)
print("GENERATING ATM LOCATIONS")
print("=" * 70)

atm_rows = []

atm_state_counts = rng.multinomial(
    CONFIG["num_atms"],
    state_probabilities
)

atm_id_counter = 1

for state, n_atms in zip(
    state_names,
    atm_state_counts
):

    if state not in DISTRICTS:
        continue

    districts = DISTRICTS[state]

    for _ in range(n_atms):

        district, base_lat, base_lon = (
            districts[
                rng.integers(
                    len(districts)
                )
            ]
        )

        lat = (
            base_lat
            + rng.normal(0, 0.045)
        )

        lon = (
            base_lon
            + rng.normal(0, 0.045)
        )

        # Hidden ATM characteristics
        # NOT given to XGBoost.

        base_activity = rng.lognormal(
            mean=0,
            sigma=0.35
        )

        local_risk_factor = rng.beta(
            2,
            8
        )

        atm_rows.append({

            "atm_id":
                f"ATM_{atm_id_counter:05d}",

            "state":
                state,

            "district":
                district,

            "lat":
                round(lat, 6),

            "lng":
                round(lon, 6),

            "bank_name":
                rng.choice(BANKS),

            "base_activity":
                base_activity,

            "local_risk_factor":
                local_risk_factor
        })

        atm_id_counter += 1


atm_locations = pd.DataFrame(
    atm_rows
)

print(
    "ATM count:",
    len(atm_locations)
)


# ============================================================
# 7. ATM COUNT PER DISTRICT
# ============================================================

district_counts = (
    atm_locations
    .groupby(
        ["state", "district"]
    )
    .size()
    .rename(
        "atm_count_district"
    )
    .reset_index()
)

atm_locations = atm_locations.merge(
    district_counts,
    on=[
        "state",
        "district"
    ],
    how="left"
)

atm_locations[
    "atm_count_district"
] = atm_locations[
    "atm_count_district"
].astype(int)


# ============================================================
# 8. CREATE COMPLAINTS
# ============================================================

print("\n" + "=" * 70)
print("GENERATING COMPLAINTS")
print("=" * 70)

start_date = pd.Timestamp(
    CONFIG["start_date"]
)

complaint_rows = []

complaint_counter = 1

# Hour distribution
hour_weights = np.array([
    0.015, 0.012, 0.010, 0.008,
    0.008, 0.012, 0.025, 0.045,
    0.065, 0.070, 0.070, 0.065,
    0.060, 0.060, 0.065, 0.070,
    0.075, 0.080, 0.085, 0.075,
    0.055, 0.045, 0.030, 0.020
])

hour_weights = (
    hour_weights /
    hour_weights.sum()
)

for day_index in range(
    CONFIG["num_days"]
):

    current_date = (
        start_date
        + pd.Timedelta(
            days=day_index
        )
    )

    weekday = current_date.weekday()

    # Weekday > weekend
    if weekday < 5:
        day_multiplier = 1.25
    else:
        day_multiplier = 1.00

    spike_multiplier = (
        CONFIG["spike_days"].get(
            current_date.strftime(
                "%Y-%m-%d"
            ),
            1.0
        )
    )

    n_complaints = int(
        np.ceil(
            CONFIG["complaints_per_day"]
            * day_multiplier
            * spike_multiplier
        )
    )

    for _ in range(
        n_complaints
    ):

        state = rng.choice(
            state_names,
            p=state_probabilities
        )

        districts = DISTRICTS.get(
            state
        )

        if not districts:
            continue

        district, _, _ = (
            districts[
                rng.integers(
                    len(districts)
                )
            ]
        )

        hour = rng.choice(
            np.arange(24),
            p=hour_weights
        )

        minute = rng.integers(
            0,
            60
        )

        complaint_time = (
            current_date
            + pd.Timedelta(
                hours=int(hour)
            )
            + pd.Timedelta(
                minutes=int(minute)
            )
        )

        crime_type = rng.choice(
            CRIME_TYPES,
            p=CRIME_WEIGHTS
        )

        amount = np.clip(
            rng.lognormal(
                mean=np.log(18000),
                sigma=1.0
            ),
            500,
            500000
        )

        complaint_rows.append({

            "complaint_id":
                f"C_{complaint_counter:08d}",

            "complaint_time":
                complaint_time,

            "state":
                state,

            "district":
                district,

            "crime_type":
                crime_type,

            "amount":
                round(
                    amount,
                    2
                )
        })

        complaint_counter += 1


complaints = pd.DataFrame(
    complaint_rows
)

complaints[
    "complaint_time"
] = pd.to_datetime(
    complaints["complaint_time"]
)

print(
    "Complaint count:",
    len(complaints)
)


# ============================================================
# 9. CREATE MULE ACCOUNTS
# ============================================================

print("\n" + "=" * 70)
print("GENERATING MULE ACCOUNTS")
print("=" * 70)

n_mules = int(
    len(complaints)
    *
    CONFIG[
        "mule_accounts_per_complaint"
    ]
)

mule_rows = []

for i in range(n_mules):

    complaint = complaints.iloc[
        rng.integers(
            len(complaints)
        )
    ]

    complaint_state = (
        complaint["state"]
    )

    complaint_district = (
        complaint["district"]
    )

    is_cross_state = (
        rng.random()
        <
        CONFIG["cross_state_rate"]
    )

    if is_cross_state:

        other_states = [
            s
            for s in state_names
            if s != complaint_state
            and s in DISTRICTS
        ]

        mule_state = rng.choice(
            other_states
        )

        mule_district = rng.choice(
            [
                d[0]
                for d in DISTRICTS[
                    mule_state
                ]
            ]
        )

    else:

        mule_state = complaint_state
        mule_district = complaint_district

    mule_rows.append({

        "mule_id":
            f"M_{i+1:07d}",

        "complaint_id":
            complaint["complaint_id"],

        "mule_state":
            mule_state,

        "mule_district":
            mule_district,

        "complaint_state":
            complaint_state,

        "complaint_district":
            complaint_district,

        "cross_state_flag":
            int(
                mule_state
                != complaint_state
            ),

        "cross_district_flag":
            int(
                mule_district
                != complaint_district
            )
    })


mule_accounts = pd.DataFrame(
    mule_rows
)

print(
    "Mule accounts:",
    len(mule_accounts)
)

print(
    "Cross-state percentage:",
    round(
        mule_accounts[
            "cross_state_flag"
        ].mean()
        * 100,
        2
    ),
    "%"
)


# ============================================================
# 10. DISTRICT FRAUD DENSITY
# ============================================================

district_fraud = (
    complaints
    .groupby(
        ["state", "district"]
    )
    .size()
    .rename(
        "complaint_count"
    )
    .reset_index()
)

district_fraud[
    "district_fraud_density"
] = (
    district_fraud[
        "complaint_count"
    ]
    /
    district_fraud.groupby(
        "state"
    )[
        "complaint_count"
    ].transform("sum")
)

density_map = dict(
    zip(
        zip(
            district_fraud["state"],
            district_fraud["district"]
        ),
        district_fraud[
            "district_fraud_density"
        ]
    )
)


# ============================================================
# 11. CREATE HISTORICAL WITHDRAWALS
# ============================================================

print("\n" + "=" * 70)
print("GENERATING HISTORICAL WITHDRAWALS")
print("=" * 70)

withdrawal_rows = []

mule_by_complaint = (
    mule_accounts
    .groupby(
        "complaint_id",
        sort=False
    )
)

# Precompute district coordinates
district_coordinate_map = {}

for state, districts in DISTRICTS.items():

    for district, lat, lon in districts:

        district_coordinate_map[
            (state, district)
        ] = (
            lat,
            lon
        )


for _, complaint in complaints.iterrows():

    complaint_id = (
        complaint["complaint_id"]
    )

    try:

        complaint_mules = (
            mule_by_complaint.get_group(
                complaint_id
            )
        )

    except KeyError:

        continue

    if len(complaint_mules) == 0:
        continue

    # Select one mule
    mule = complaint_mules.iloc[
        rng.integers(
            len(complaint_mules)
        )
    ]

    mule_state = mule[
        "mule_state"
    ]

    mule_district = mule[
        "mule_district"
    ]

    mule_coords = (
        district_coordinate_map.get(
            (
                mule_state,
                mule_district
            )
        )
    )

    if mule_coords is None:
        continue

    mule_lat, mule_lon = mule_coords

    # --------------------------------------------------------
    # Probability that complaint produces suspicious
    # cash withdrawal
    # --------------------------------------------------------

    p_withdrawal = 0.12

    if complaint["amount"] > 50000:
        p_withdrawal += 0.08

    if complaint["amount"] > 100000:
        p_withdrawal += 0.05

    if mule[
        "cross_state_flag"
    ] == 1:

        p_withdrawal += 0.10

    if complaint[
        "crime_type"
    ] in [
        "UPI Fraud",
        "Digital Arrest",
        "Investment Fraud"
    ]:

        p_withdrawal += 0.05

    p_withdrawal = min(
        p_withdrawal,
        0.45
    )

    if (
        rng.random()
        >
        p_withdrawal
    ):
        continue

    # --------------------------------------------------------
    # Consider ALL ATMs
    # --------------------------------------------------------

    candidate = (
        atm_locations.copy()
    )

    candidate[
        "mule_distance_km"
    ] = haversine(
        candidate["lat"].values,
        candidate["lng"].values,
        mule_lat,
        mule_lon
    )

    # --------------------------------------------------------
    # PROXIMITY SIGNAL
    #
    # Closer ATM = higher probability.
    # --------------------------------------------------------

    candidate[
        "proximity_score"
    ] = np.exp(
        -candidate[
            "mule_distance_km"
        ]
        / 120.0
    )

    # ATM activity
    candidate[
        "activity_score"
    ] = (
        candidate[
            "base_activity"
        ]
        /
        candidate[
            "base_activity"
        ].mean()
    )

    # Local risk
    candidate[
        "local_score"
    ] = (
        0.60
        *
        candidate[
            "proximity_score"
        ]
        +
        0.25
        *
        candidate[
            "local_risk_factor"
        ]
        +
        0.15
        *
        (
            candidate[
                "activity_score"
            ]
            /
            candidate[
                "activity_score"
            ].max()
        )
    )

    candidate[
        "local_score"
    ] = candidate[
        "local_score"
    ].clip(
        lower=1e-8
    )

    probabilities = (
        candidate["local_score"]
        /
        candidate["local_score"].sum()
    )

    # Select ATM
    chosen_position = rng.choice(
        len(candidate),
        p=probabilities.values
    )

    atm = candidate.iloc[
        chosen_position
    ]

    # Withdrawal within next 24 hours
    withdrawal_time = (
        complaint[
            "complaint_time"
        ]
        +
        pd.Timedelta(
            hours=int(
                rng.integers(
                    1,
                    25
                )
            )
        )
    )

    withdrawal_amount = np.clip(
        complaint["amount"]
        *
        rng.uniform(
            0.20,
            0.80
        ),
        500,
        200000
    )

    withdrawal_rows.append({

        "withdrawal_id":
            f"W_{len(withdrawal_rows)+1:08d}",

        "complaint_id":
            complaint_id,

        "atm_id":
            atm["atm_id"],

        "withdrawal_time":
            withdrawal_time,

        "withdrawal_amount":
            round(
                withdrawal_amount,
                2
            ),

        "suspicious":
            1
    })


withdrawals = pd.DataFrame(
    withdrawal_rows
)

if len(withdrawals) == 0:

    raise RuntimeError(
        "No withdrawals were generated. "
        "Increase p_withdrawal."
    )

print(
    "Withdrawals:",
    len(withdrawals)
)


# ============================================================
# 12. CREATE PREDICTION SNAPSHOTS / TRAINING DATA
# ============================================================

print("\n" + "=" * 70)
print("CREATING TRAINING DATA")
print("=" * 70)

prediction_times = pd.date_range(
    start=start_date,
    end=(
        start_date
        +
        pd.Timedelta(
            days=
            CONFIG["num_days"] - 1
        )
    ),
    freq=(
        f'{CONFIG["prediction_frequency_hours"]}h'
    )
)

training_rows = []

atm_records = (
    atm_locations.to_dict(
        "records"
    )
)

withdrawals[
    "withdrawal_time"
] = pd.to_datetime(
    withdrawals[
        "withdrawal_time"
    ]
)


for prediction_time in prediction_times:

    # ========================================================
    # HISTORICAL COMPLAINTS
    # ========================================================

    history_start = (
        prediction_time
        -
        pd.Timedelta(
            hours=6
        )
    )

    history_complaints = complaints[
        (
            complaints[
                "complaint_time"
            ]
            >
            history_start
        )
        &
        (
            complaints[
                "complaint_time"
            ]
            <=
            prediction_time
        )
    ]

    # ========================================================
    # COMPLAINT VELOCITY
    # ========================================================

    district_velocity = (
        history_complaints
        .groupby(
            [
                "state",
                "district"
            ]
        )
        .size()
        .to_dict()
    )

    # ========================================================
    # RELEVANT MULES
    # ========================================================

    relevant_complaint_ids = set(
        history_complaints[
            "complaint_id"
        ]
    )

    relevant_mules = mule_accounts[
        mule_accounts[
            "complaint_id"
        ].isin(
            relevant_complaint_ids
        )
    ].copy()

    # ========================================================
    # MULE COORDINATES
    # ========================================================

    mule_points = []

    for _, mule in (
        relevant_mules.iterrows()
    ):

        coords = (
            district_coordinate_map.get(
                (
                    mule[
                        "mule_state"
                    ],
                    mule[
                        "mule_district"
                    ]
                )
            )
        )

        if coords is None:
            continue

        mule_lat, mule_lon = coords

        mule_points.append({

            "lat":
                mule_lat,

            "lng":
                mule_lon,

            "cross_state_flag":
                int(
                    mule[
                        "cross_state_flag"
                    ]
                )
        })

    # ========================================================
    # FUTURE WITHDRAWALS = TARGET
    # ========================================================

    future_end = (
        prediction_time
        +
        pd.Timedelta(
            hours=24
        )
    )

    future_withdrawals = withdrawals[
        (
            withdrawals[
                "withdrawal_time"
            ]
            >
            prediction_time
        )
        &
        (
            withdrawals[
                "withdrawal_time"
            ]
            <=
            future_end
        )
    ]

    positive_atms = set(
        future_withdrawals[
            "atm_id"
        ]
    )

    # ========================================================
    # CREATE ONE ROW PER ATM
    # ========================================================

    for atm in atm_records:

        atm_id = atm[
            "atm_id"
        ]

        state = atm[
            "state"
        ]

        district = atm[
            "district"
        ]

        # ----------------------------------------------------
        # Feature 1: district fraud density
        # ----------------------------------------------------
        historical_state_complaints = (
            history_complaints[
                history_complaints["state"] == state
            ]
        )
        if len(historical_state_complaints) > 0:
            district_historical_count = (
                historical_state_complaints["district"] == district
            ).sum()

            fraud_density = (
                district_historical_count
                / len(historical_state_complaints)
            )
        else:
            fraud_density = 0.0
        # ----------------------------------------------------
        # Feature 2: complaint velocity
        # ----------------------------------------------------

        complaint_velocity = (
            district_velocity.get(
                (
                    state,
                    district
                ),
                0
            )
        )

        # ----------------------------------------------------
        # Feature 3: nearest mule distance
        # ----------------------------------------------------

        if len(mule_points) > 0:

            distances = [
                haversine(
                    atm["lat"],
                    atm["lng"],
                    mule_point["lat"],
                    mule_point["lng"]
                )
                for mule_point
                in mule_points
            ]

            mule_distance = min(
                distances
            )

        else:

            # No recent mule activity.
            mule_distance = 500.0

        # ----------------------------------------------------
        # Feature 4: ATM count
        # ----------------------------------------------------

        atm_count = int(
            atm[
                "atm_count_district"
            ]
        )

        # ----------------------------------------------------
        # Feature 5: cross-state flag
        # ----------------------------------------------------

        if len(relevant_mules) > 0:
            mule_distances = []

            for _, mule in relevant_mules.iterrows():
                # Get mule district coordinates
                mule_locations = DISTRICTS.get(mule["mule_state"], [])

                mule_coords = None

                for district_name, lat, lng in mule_locations:
                    if district_name == mule["mule_district"]:
                        mule_coords = (lat, lng)
                        break

                # Skip if coordinates cannot be found
                if mule_coords is None:
                    continue

                mule_lat, mule_lng = mule_coords

                distance = haversine(
                    mule_lat,
                    mule_lng,
                    atm["lat"],
                    atm["lng"]
                )

                mule_distances.append(distance)

            if len(mule_distances) > 0:
                mule_distance = min(mule_distances)
            else:
                mule_distance = 1500.0

            cross_state_flag = int(
                relevant_mules["cross_state_flag"].max() == 1
            )

        else:
            mule_distance = 1500.0
            cross_state_flag = 0

        # ----------------------------------------------------
        # TARGET
        #
        # Actual future suspicious withdrawal.
        # ----------------------------------------------------

        target = int(
            atm_id in positive_atms
        )

        training_rows.append({

            "atm_id":
                atm_id,

            "prediction_time":
                prediction_time,

            "state":
                state,

            "district":
                district,

            "district_fraud_density":
                float(
                    fraud_density
                ),

            "complaint_velocity_6h":
                int(
                    complaint_velocity
                ),

            "mule_proximity_km":
                round(
                    float(
                        mule_distance
                    ),
                    4
                ),

            "atm_count_district":
                atm_count,

            "cross_state_flag":
                cross_state_flag,

            "hour":
                prediction_time.hour,

            "day_of_week":
                prediction_time.dayofweek,

            "is_weekend":
                int(
                    prediction_time.dayofweek >= 5
                ),

            "target":
                target
        })


training_data = pd.DataFrame(
    training_rows
)


# ============================================================
# 13. VALIDATE TRAINING DATA
# ============================================================

print("\n" + "=" * 70)
print("TRAINING DATA VALIDATION")
print("=" * 70)

print(
    "Rows:",
    len(training_data)
)

print(
    "Unique ATMs:",
    training_data[
        "atm_id"
    ].nunique()
)

print(
    "Prediction windows:",
    training_data[
        "prediction_time"
    ].nunique()
)

positive_rows = int(
    training_data[
        "target"
    ].sum()
)

positive_rate = (
    training_data[
        "target"
    ].mean()
)

print(
    "Positive rows:",
    positive_rows
)

print(
    "Positive rate:",
    round(
        positive_rate * 100,
        2
    ),
    "%"
)


# ============================================================
# IMPORTANT TARGET CHECK
# ============================================================

if training_data[
    "target"
].nunique() < 2:

    raise RuntimeError(
        "Training target contains only one class. "
        "Increase withdrawal probability."
    )


# ============================================================
# 14. CHECK DISTANCE RELATIONSHIP IN WITHDRAWALS
# ============================================================

print("\n" + "=" * 70)
print("WITHDRAWAL DISTANCE SANITY CHECK")
print("=" * 70)

withdrawal_distances = []

for _, w in withdrawals.iterrows():

    complaint = complaints[
        complaints[
            "complaint_id"
        ]
        ==
        w[
            "complaint_id"
        ]
    ]

    if len(complaint) == 0:
        continue

    complaint = complaint.iloc[0]

    mule_match = mule_accounts[
        mule_accounts[
            "complaint_id"
        ]
        ==
        w[
            "complaint_id"
        ]
    ]

    if len(mule_match) == 0:
        continue

    mule = mule_match.iloc[0]

    mule_coords = (
        district_coordinate_map.get(
            (
                mule[
                    "mule_state"
                ],
                mule[
                    "mule_district"
                ]
            )
        )
    )

    if mule_coords is None:
        continue

    atm_match = atm_locations[
        atm_locations[
            "atm_id"
        ]
        ==
        w[
            "atm_id"
        ]
    ]

    if len(atm_match) == 0:
        continue

    atm = atm_match.iloc[0]

    distance = haversine(
        atm["lat"],
        atm["lng"],
        mule_coords[0],
        mule_coords[1]
    )

    withdrawal_distances.append(
        distance
    )


if withdrawal_distances:

    print(
        "Median withdrawal distance:",
        round(
            float(
                np.median(
                    withdrawal_distances
                )
            ),
            2
        ),
        "km"
    )

    print(
        "Mean withdrawal distance:",
        round(
            float(
                np.mean(
                    withdrawal_distances
                )
            ),
            2
        ),
        "km"
    )


# ============================================================
# 15. DAILY SUMMARY
# ============================================================

complaints["date"] = (
    complaints[
        "complaint_time"
    ].dt.date
)

daily_summary = (
    complaints
    .groupby("date")
    .agg(
        complaint_count=(
            "complaint_id",
            "count"
        )
    )
    .reset_index()
)

daily_summary[
    "weekday"
] = pd.to_datetime(
    daily_summary[
        "date"
    ]
).dt.day_name()

daily_summary[
    "is_weekend"
] = (
    pd.to_datetime(
        daily_summary[
            "date"
        ]
    ).dt.dayofweek >= 5
)

daily_summary[
    "is_spike_day"
] = (
    daily_summary[
        "date"
    ]
    .astype(str)
    .isin(
        CONFIG[
            "spike_days"
        ].keys()
    )
)


# ============================================================
# 16. SAVE DATASETS
# ============================================================

print("\n" + "=" * 70)
print("SAVING DATASETS")
print("=" * 70)

complaints.to_csv(
    "complaints.csv",
    index=False
)

mule_accounts.to_csv(
    "mule_accounts.csv",
    index=False
)

# Do NOT expose hidden variables
atm_locations.drop(
    columns=[
        "base_activity",
        "local_risk_factor"
    ]
).to_csv(
    "atm_locations.csv",
    index=False
)

withdrawals.to_csv(
    "withdrawals.csv",
    index=False
)

training_data.to_csv(
    "training_data.csv",
    index=False
)

daily_summary.to_csv(
    "daily_summary.csv",
    index=False
)


# ============================================================
# 17. FINAL VALIDATION
# ============================================================

print("\n" + "=" * 70)
print("FINAL VALIDATION")
print("=" * 70)

# ------------------------------------------------------------
# Requirement: >= 8000 complaints/day
# ------------------------------------------------------------

minimum_daily = (
    daily_summary[
        "complaint_count"
    ].min()
)

print(
    "\nMinimum daily complaints:",
    minimum_daily
)

assert (
    minimum_daily >= 8000
)


# ------------------------------------------------------------
# Weekday > weekend
# ------------------------------------------------------------

weekday_avg = (
    daily_summary[
        ~daily_summary[
            "is_weekend"
        ]
    ][
        "complaint_count"
    ].mean()
)

weekend_avg = (
    daily_summary[
        daily_summary[
            "is_weekend"
        ]
    ][
        "complaint_count"
    ].mean()
)

print(
    "Weekday average:",
    round(
        weekday_avg,
        2
    )
)

print(
    "Weekend average:",
    round(
        weekend_avg,
        2
    )
)

assert (
    weekday_avg > weekend_avg
)


# ------------------------------------------------------------
# Cross-state >= 20%
# ------------------------------------------------------------

cross_state_pct = (
    mule_accounts[
        "cross_state_flag"
    ].mean()
)

print(
    "\nCross-state percentage:",
    round(
        cross_state_pct * 100,
        2
    ),
    "%"
)

assert (
    cross_state_pct >= 0.20
)


# ------------------------------------------------------------
# Delhi exists
# ------------------------------------------------------------

print(
    "\nDelhi complaints:",
    (
        complaints[
            "state"
        ] == "Delhi"
    ).sum()
)

print(
    "Delhi ATMs:",
    (
        atm_locations[
            "state"
        ] == "Delhi"
    ).sum()
)

assert (
    (
        complaints[
            "state"
        ] == "Delhi"
    ).sum()
    > 0
)

assert (
    (
        atm_locations[
            "state"
        ] == "Delhi"
    ).sum()
    > 0
)


# ------------------------------------------------------------
# Coordinate validation
# ------------------------------------------------------------

assert (
    atm_locations[
        "lat"
    ].between(
        8,
        38
    ).all()
)

assert (
    atm_locations[
        "lng"
    ].between(
        68,
        98
    ).all()
)

print(
    "\nATM coordinates: VALID"
)


# ------------------------------------------------------------
# Required ML features
# ------------------------------------------------------------

FEATURES = [
    "district_fraud_density",
    "complaint_velocity_6h",
    "mule_proximity_km",
    "atm_count_district",
    "cross_state_flag"
]

required_columns = [
    "atm_id",
    "prediction_time",
    "state",
    "district",
    *FEATURES,
    "target"
]

missing_features = [
    col
    for col in required_columns
    if col not in training_data.columns
]

print(
    "\nMissing ML columns:",
    missing_features
)

assert (
    len(missing_features) == 0
)


# ------------------------------------------------------------
# No NaNs
# ------------------------------------------------------------

assert (
    training_data[
        FEATURES + ["target"]
    ].isna().sum().sum()
    == 0
)

print(
    "ML features: NO NaNs"
)


# ------------------------------------------------------------
# Target has both classes
# ------------------------------------------------------------

assert (
    set(
        training_data[
            "target"
        ].unique()
    )
    == {0, 1}
)

print(
    "Target classes: 0 and 1"
)


# ============================================================
# 18. SPIKE DAYS
# ============================================================

print("\n" + "=" * 70)
print("SPIKE DAY VALIDATION")
print("=" * 70)

for spike_date, multiplier in (
    CONFIG[
        "spike_days"
    ].items()
):

    row = daily_summary[
        daily_summary[
            "date"
        ]
        ==
        pd.to_datetime(
            spike_date
        ).date()
    ]

    if len(row):

        print(
            spike_date,
            "| multiplier:",
            multiplier,
            "| complaints:",
            int(
                row[
                    "complaint_count"
                ].iloc[0]
            )
        )


# ============================================================
# 19. DATASET SUMMARY
# ============================================================

print("\n" + "=" * 70)
print("GENERATION COMPLETE")
print("=" * 70)

print(
    f"""
Files generated:

1. complaints.csv
2. mule_accounts.csv
3. atm_locations.csv
4. withdrawals.csv
5. training_data.csv
6. daily_summary.csv

Main ML file:
    training_data.csv

Target:
    target = 1
    -> suspicious withdrawal at that ATM
       within the next 24 hours

ML Features:
    district_fraud_density
    complaint_velocity_6h
    mule_proximity_km
    atm_count_district
    cross_state_flag

ATM count:
    {len(atm_locations)}

Complaint count:
    {len(complaints)}

Mule count:
    {len(mule_accounts)}

Withdrawal count:
    {len(withdrawals)}

Training rows:
    {len(training_data)}

Unique ATMs:
    {training_data["atm_id"].nunique()}

Prediction windows:
    {training_data["prediction_time"].nunique()}

Positive rate:
    {positive_rate * 100:.2f}%

Cross-state mule rate:
    {cross_state_pct * 100:.2f}%
"""
)

print("=" * 70)
print("READY FOR XGBOOST TRAINING")
print("=" * 70)

training_data["distance_bucket"] = pd.cut(
    training_data["mule_proximity_km"],
    bins=[
        0, 25, 50, 100, 200,
        500, 1000, 1500, np.inf
    ]
)

print(
    training_data
    .groupby(
        "distance_bucket",
        observed=True
    )["target"]
    .agg(
        rows="count",
        positives="sum",
        positive_rate="mean"
    )
)


#--------------------------FIX DATA TO PRODUCE training_corrected.csv ----------------------------

# ================================================================
# FINAL FIX USING EXISTING DATA ONLY
# NO REGENERATION
# NO DISTRICT COORDINATE DICTIONARY REQUIRED
# ================================================================

import pandas as pd
import numpy as np
import time

start = time.time()

# ================================================================
# 1. LOAD ORIGINAL FILES AGAIN
# ================================================================

training = pd.read_csv("training_data.csv")
complaints = pd.read_csv("complaints.csv")
mules = pd.read_csv("mule_accounts.csv")
atms = pd.read_csv("atm_locations.csv")

training["prediction_time"] = pd.to_datetime(
    training["prediction_time"]
)

complaints["complaint_time"] = pd.to_datetime(
    complaints["complaint_time"]
)

# IDs
training["atm_id"] = training["atm_id"].astype(str)
atms["atm_id"] = atms["atm_id"].astype(str)

mules["complaint_id"] = mules["complaint_id"].astype(str)
complaints["complaint_id"] = complaints["complaint_id"].astype(str)

print("=" * 70)
print("DATA LOADED")
print("=" * 70)

print("Training :", len(training))
print("Complaints:", len(complaints))
print("Mules     :", len(mules))
print("ATMs      :", len(atms))


# ================================================================
# 2. CREATE MULE COORDINATES FROM ATM DISTRICT CENTROIDS
#
# We don't need the generator's coordinate dictionary.
# Existing real ATM coordinates are enough.
# ================================================================

print("\nCreating district coordinate lookup...")

atms["lat"] = pd.to_numeric(atms["lat"])
atms["lng"] = pd.to_numeric(atms["lng"])

district_coords = (
    atms
    .groupby(
        ["state", "district"],
        as_index=False
    )
    .agg(
        mule_lat=("lat", "mean"),
        mule_lng=("lng", "mean")
    )
)

print(
    "District coordinate combinations:",
    len(district_coords)
)


# ================================================================
# 3. ATTACH COMPLAINT TIME TO MULES
# ================================================================

mules = mules.merge(
    complaints[
        [
            "complaint_id",
            "complaint_time"
        ]
    ],
    on="complaint_id",
    how="left"
)

print(
    "Mules after complaint merge:",
    len(mules)
)


# ================================================================
# 4. MATCH MULE DISTRICT TO ATM DISTRICT
#
# First try exact state + district.
# ================================================================

mules = mules.merge(
    district_coords,
    left_on=[
        "mule_state",
        "mule_district"
    ],
    right_on=[
        "state",
        "district"
    ],
    how="left"
)

# Remove duplicate lookup columns
mules.drop(
    columns=[
        "state",
        "district"
    ],
    inplace=True,
    errors="ignore"
)

matched = mules["mule_lat"].notna().sum()

print(
    f"Mules matched to ATM districts: "
    f"{matched:,}/{len(mules):,}"
)


# ================================================================
# 5. IF SOME MULE DISTRICTS DON'T MATCH EXACTLY,
#    TRY CLEANED STRING MATCHING
# ================================================================

if matched < len(mules):

    print(
        "Attempting normalized state/district matching..."
    )

    # Reload district lookup
    district_coords2 = (
        atms[
            [
                "state",
                "district",
                "lat",
                "lng"
            ]
        ]
        .copy()
    )

    def normalize_text(x):
        return (
            str(x)
            .strip()
            .lower()
            .replace("-", " ")
            .replace("_", " ")
        )

    district_coords2["state_key"] = (
        district_coords2["state"]
        .map(normalize_text)
    )

    district_coords2["district_key"] = (
        district_coords2["district"]
        .map(normalize_text)
    )

    # Keep first coordinate per normalized district
    district_coords2 = (
        district_coords2
        .groupby(
            [
                "state_key",
                "district_key"
            ],
            as_index=False
        )
        .agg(
            fallback_lat=("lat", "mean"),
            fallback_lng=("lng", "mean")
        )
    )

    mules["state_key"] = (
        mules["mule_state"]
        .map(normalize_text)
    )

    mules["district_key"] = (
        mules["mule_district"]
        .map(normalize_text)
    )

    mules = mules.merge(
        district_coords2,
        on=[
            "state_key",
            "district_key"
        ],
        how="left"
    )

    # Fill unmatched coordinates
    mules["mule_lat"] = (
        mules["mule_lat"]
        .fillna(
            mules["fallback_lat"]
        )
    )

    mules["mule_lng"] = (
        mules["mule_lng"]
        .fillna(
            mules["fallback_lng"]
        )
    )

    mules.drop(
        columns=[
            "state_key",
            "district_key",
            "fallback_lat",
            "fallback_lng"
        ],
        inplace=True,
        errors="ignore"
    )


# ================================================================
# 6. KEEP ONLY USABLE MULES
# ================================================================

mules = mules.dropna(
    subset=[
        "mule_lat",
        "mule_lng",
        "complaint_time"
    ]
).copy()

mules["cross_state_flag"] = (
    mules["cross_state_flag"]
    .astype(np.int8)
)

print(
    f"\nUsable mules: {len(mules):,}"
)

print(
    f"Mule cross-state ratio: "
    f"{mules['cross_state_flag'].mean():.2%}"
)


# ================================================================
# 7. PREPARE ATM ARRAYS
# ================================================================

atm_base = (
    atms[
        [
            "atm_id",
            "lat",
            "lng"
        ]
    ]
    .drop_duplicates("atm_id")
    .copy()
)

atm_ids = atm_base["atm_id"].to_numpy()

atm_lat = atm_base["lat"].to_numpy()
atm_lng = atm_base["lng"].to_numpy()

atm_position = {
    x: i
    for i, x in enumerate(atm_ids)
}


# ================================================================
# 8. VECTORIZED HAVERSINE
# ================================================================

EARTH_RADIUS_KM = 6371.0


def haversine_matrix(
    atm_lat,
    atm_lng,
    mule_lat,
    mule_lng
):

    lat1 = np.radians(
        atm_lat
    )[:, None]

    lon1 = np.radians(
        atm_lng
    )[:, None]

    lat2 = np.radians(
        mule_lat
    )[None, :]

    lon2 = np.radians(
        mule_lng
    )[None, :]

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (
        np.sin(dlat / 2) ** 2
        +
        np.cos(lat1)
        * np.cos(lat2)
        * np.sin(dlon / 2) ** 2
    )

    a = np.clip(a, 0, 1)

    return (
        2
        * EARTH_RADIUS_KM
        * np.arcsin(
            np.sqrt(a)
        )
    )


# ================================================================
# 9. PREDICTION WINDOWS
# ================================================================

prediction_times = (
    training[
        "prediction_time"
    ]
    .drop_duplicates()
    .sort_values()
    .to_numpy()
)

print(
    "\nPrediction windows:",
    len(prediction_times)
)


# ================================================================
# 10. CORRECT MULE DISTANCE + CROSS STATE
# ================================================================

print("\n" + "=" * 70)
print("CORRECTING MULE FEATURES")
print("=" * 70)

new_distance = np.full(
    len(training),
    1500.0,
    dtype=np.float32
)

new_cross_state = np.zeros(
    len(training),
    dtype=np.int8
)

# Group rows once
time_groups = (
    training
    .groupby(
        "prediction_time",
        sort=False
    )
    .groups
)


for i, pt in enumerate(
    prediction_times
):

    pt = pd.Timestamp(pt)

    row_idx = time_groups[
        pt
    ]

    row_idx = np.asarray(
        row_idx,
        dtype=np.int64
    )

    # Previous 6 hours
    start_time = (
        pt - pd.Timedelta(
            hours=6
        )
    )

    relevant = mules[
        (mules["complaint_time"] > start_time)
        &
        (mules["complaint_time"] <= pt)
    ]

    if len(relevant) > 0:

        mule_lat = (
            relevant["mule_lat"]
            .to_numpy(
                dtype=np.float64
            )
        )

        mule_lng = (
            relevant["mule_lng"]
            .to_numpy(
                dtype=np.float64
            )
        )

        # --------------------------------------------------------
        # ATMs × RELEVANT MULES
        # --------------------------------------------------------

        distances = haversine_matrix(
            atm_lat,
            atm_lng,
            mule_lat,
            mule_lng
        )

        # Nearest mule for each ATM
        nearest_idx = (
            np.argmin(
                distances,
                axis=1
            )
        )

        atm_range = np.arange(
            len(atm_base)
        )

        nearest_distance = (
            distances[
                atm_range,
                nearest_idx
            ]
        )

        nearest_flag = (
            relevant.iloc[
                nearest_idx
            ]["cross_state_flag"]
            .to_numpy(
                dtype=np.int8
            )
        )

        # --------------------------------------------------------
        # Map ATM -> training rows
        # --------------------------------------------------------

        row_atm_ids = (
            training.loc[
                row_idx,
                "atm_id"
            ].to_numpy()
        )

        positions = np.array(
            [
                atm_position[x]
                for x in row_atm_ids
            ],
            dtype=np.int64
        )

        new_distance[row_idx] = (
            nearest_distance[
                positions
            ]
        )

        new_cross_state[row_idx] = (
            nearest_flag[
                positions
            ]
        )

    if (
        (i + 1) % 10 == 0
        or i == 0
        or i == len(prediction_times) - 1
    ):
        print(
            f"Window "
            f"{i+1}/{len(prediction_times)}"
        )


# ================================================================
# 11. APPLY MULE CORRECTIONS
# ================================================================

training[
    "mule_proximity_km"
] = new_distance

training[
    "cross_state_flag"
] = new_cross_state


# ================================================================
# 12. CORRECT DISTRICT FRAUD DENSITY
# ================================================================

print("\n" + "=" * 70)
print("CORRECTING DISTRICT FRAUD DENSITY")
print("=" * 70)

density_parts = []

# Sort once
complaints = complaints.sort_values(
    "complaint_time"
).reset_index(drop=True)


for i, pt in enumerate(
    prediction_times
):

    pt = pd.Timestamp(pt)

    historical = complaints[
        complaints["complaint_time"] <= pt
    ]

    if historical.empty:
        continue

    state_total = (
        historical
        .groupby("state")
        .size()
        .rename("state_total")
    )

    district_total = (
        historical
        .groupby(
            [
                "state",
                "district"
            ]
        )
        .size()
        .rename("district_total")
        .reset_index()
    )

    density = district_total.merge(
        state_total.reset_index(),
        on="state",
        how="left"
    )

    density[
        "district_fraud_density"
    ] = (
        density["district_total"]
        /
        density["state_total"]
    )

    density[
        "prediction_time"
    ] = pt

    density_parts.append(
        density[
            [
                "prediction_time",
                "state",
                "district",
                "district_fraud_density"
            ]
        ]
    )


density_history = pd.concat(
    density_parts,
    ignore_index=True
)


# ================================================================
# 13. APPLY DENSITY
# ================================================================

training.drop(
    columns=[
        "district_fraud_density"
    ],
    inplace=True,
    errors="ignore"
)

training = training.merge(
    density_history,
    on=[
        "prediction_time",
        "state",
        "district"
    ],
    how="left"
)

training[
    "district_fraud_density"
] = (
    training[
        "district_fraud_density"
    ]
    .fillna(0)
)


# ================================================================
# 14. REMOVE VALIDATION COLUMN
# ================================================================

training.drop(
    columns=[
        "distance_bucket"
    ],
    inplace=True,
    errors="ignore"
)


# ================================================================
# 15. SORT
# ================================================================

training = (
    training
    .sort_values(
        [
            "prediction_time",
            "atm_id"
        ]
    )
    .reset_index(drop=True)
)


# ================================================================
# 16. SAVE
# ================================================================

training.to_csv(
    "training_data_corrected.csv",
    index=False
)


# ================================================================
# 17. VALIDATION
# ================================================================

print("\n" + "=" * 70)
print("FINAL VALIDATION")
print("=" * 70)

FEATURES = [
    "district_fraud_density",
    "complaint_velocity_6h",
    "mule_proximity_km",
    "atm_count_district",
    "cross_state_flag"
]


print(
    "\nShape:",
    training.shape
)


print(
    "\nMissing values:"
)

print(
    training[
        FEATURES + ["target"]
    ].isna().sum()
)


print(
    "\nDuplicates:",
    training.duplicated().sum()
)


numeric_cols = (
    training
    .select_dtypes(
        include=np.number
    )
    .columns
)

print(
    "Infinite values:",
    np.isinf(
        training[numeric_cols]
    ).sum().sum()
)


# ------------------------------------------------------------
# CROSS STATE
# ------------------------------------------------------------

print(
    "\nCross-state distribution:"
)

print(
    training[
        "cross_state_flag"
    ].value_counts()
)


print(
    "\nCross-state percentage:"
)

print(
    training[
        "cross_state_flag"
    ].value_counts(
        normalize=True
    ) * 100
)


# ------------------------------------------------------------
# TARGET
# ------------------------------------------------------------

print(
    "\nTarget distribution:"
)

print(
    training[
        "target"
    ].value_counts()
)


print(
    "\nTarget by cross-state:"
)

print(
    training
    .groupby(
        "cross_state_flag"
    )["target"]
    .agg(
        [
            "count",
            "sum",
            "mean"
        ]
    )
)


# ------------------------------------------------------------
# DISTANCE
# ------------------------------------------------------------

print(
    "\nMule distance:"
)

print(
    training[
        "mule_proximity_km"
    ].describe()
)


# ------------------------------------------------------------
# CORRELATION
# ------------------------------------------------------------

print(
    "\nFeature-target correlation:"
)

print(
    training[
        FEATURES + ["target"]
    ]
    .corr()["target"]
    .sort_values(
        ascending=False
    )
)


# ------------------------------------------------------------
# TARGET PRESERVATION
# ------------------------------------------------------------

print(
    "\nTarget counts:"
)

print(
    "Positive:",
    (training["target"] == 1).sum()
)

print(
    "Negative:",
    (training["target"] == 0).sum()
)

print(
    "Total:",
    len(training)
)


# ================================================================
# DONE
# ================================================================

elapsed = time.time() - start

print("\n" + "=" * 70)
print("DONE")
print("=" * 70)

print(
    f"Time taken: {elapsed:.2f} seconds"
)

print(
    "Saved as: training_data_corrected.csv"
)