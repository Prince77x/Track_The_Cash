# Cybercrime ATM Risk Predictor — User Input Guide

## Purpose

This interface requires information about:

1. The **new cybercrime complaint**
2. The **associated mule account**

The system uses these inputs to create ATM-level prediction features and then sends those features to the trained XGBoost model.

---

# 1. New Complaint Information

The user must provide the following fields.

| Input | Required | Example | Description |
|---|---|---|---|
| `complaint_id` | Yes | `NEW001` | Unique ID for the new complaint (Use any tool to generate any random )|
| `state` | Yes | `West Bengal` | State where the complaint was registered |
| `district` | Yes | `Durgapur` | District where the complaint was registered |
| `crime_type` | Yes | `UPI Fraud` | Type/category of cybercrime |
| `amount` | Yes | `40000` | Amount involved in the complaint, in ₹ |
| `complaint_time` | Yes | `2026-10-27 08:30:00` | Date and time when the complaint was registered |

## Complaint example

```python
new_complaint = {
    "complaint_id": "NEW001",
    "state": "West Bengal",
    "district": "Durgapur",
    "crime_type": "UPI Fraud",
    "amount": 40000,
    "complaint_time": "2026-10-27 08:30:00"
}
```

---

# 2. Mule Account Information

The user must provide the following fields.

| Input | Required | Example | Description |
|---|---|---|---|
| `mule_id` | Yes | `NEW_MULE` | Unique ID for the mule account/person (Use any tool to generate any random )|
| `state` | Yes | `Jharkhand` | State associated with the mule |
| `district` | Yes | `Dhanbad` | District associated with the mule |
| `lat` | Yes | `23.7957` | Latitude of the mule location |
| `lng` | Yes | `86.4304` | Longitude of the mule location |

## Mule example

```python
mule = {
    "mule_id": "NEW_MULE",
    "state": "Jharkhand",
    "district": "Dhanbad",
    "lat": 23.7957,
    "lng": 86.4304
}
```

---

# 3. Complete Input

The user therefore needs to provide **11 values in total**.

### Complaint — 6 values

```text
1. Complaint ID
2. Complaint State
3. Complaint District
4. Crime Type
5. Fraud Amount
6. Complaint Date & Time
```

### Mule — 5 values

```text
7. Mule ID
8. Mule State
9. Mule District
10. Mule Latitude
11. Mule Longitude
```

---

# 4. What the User Does NOT Need to Provide

The user does **not** need to manually provide the ML features:

```text
district_fraud_density
complaint_velocity_6h
mule_proximity_km
atm_count_district
cross_state_flag
```

These are generated automatically by:

```python
create_atm_prediction_rows(
    complaint=new_complaint,
    mule=mule,
    atms=atms,
    complaints=complaints
)
for referenece you can see the Backend_preprocess.py
```

The user also does not need to provide ATM information.

The system already has:
the atm_location.csv,complaints.csv,mule_accounts.csv,withdrawals.csv all these must have to be used at test prediction
(Better need to store them since at each request they are required)

which contains the ATM locations used for prediction.

---

# 5. Input Flow

```text
              USER
                │
        ┌───────┴────────┐
        │                │
        ▼                ▼
  NEW COMPLAINT      MULE ACCOUNT
        │                │
        │                │
  6 inputs             5 inputs
        │                │
        └───────┬────────┘
                ▼
   create_atm_prediction_rows()
                │
                ▼
       ATM Feature Generation
                │
                ▼
       XGBoost Prediction
                │
                ▼
       Risk Score for ATMs
                │
                ▼
          Return 10 risked ATMS where Cyber attack is possible
```

---

# 6. Recommended User Interface

The input screen should be divided into two sections.

## Section A — Complaint Details

```text
Complaint ID       [________________]

State              [________________]

District           [________________]

Crime Type         [ Select Crime Type ▼ ]

Fraud Amount (₹)   [________________]

Complaint Time     [ YYYY-MM-DD HH:MM:SS ]
```

## Section B — Mule Account Details

```text
Mule ID             [________________]

State               [________________]

District            [________________]

Latitude            [________________]

Longitude           [________________]
```

Then provide one main action:

```text
             [ 🔍 Predict ATM Risk ]
```

---

# 7. Validation Rules

Before prediction, the interface should validate:

### Complaint

- Complaint ID cannot be empty.
- State cannot be empty.
- District cannot be empty.
- Crime type cannot be empty.
- Amount must be a valid number.
- Amount should not be negative.
- Complaint time must be a valid date/time.

### Mule

- Mule ID cannot be empty.
- State cannot be empty.
- District cannot be empty.
- Latitude must be between `-90` and `90`.
- Longitude must be between `-180` and `180`.

---

# 8. Example Scenario

Suppose an investigator receives:

```text
Complaint:
State       → West Bengal
District    → Durgapur
Crime       → UPI Fraud
Amount      → ₹40,000
Time        → 2026-10-27 08:30:00

Mule:
State       → Jharkhand
District    → Dhanbad
Latitude    → 23.7957
Longitude   → 86.4304
```

The application creates:

```python
new_complaint = {
    "complaint_id": "NEW001",
    "state": "West Bengal",
    "district": "Durgapur",
    "crime_type": "UPI Fraud",
    "amount": 40000,
    "complaint_time": "2026-10-27 08:30:00"
}

mule = {
    "mule_id": "NEW_MULE",
    "state": "Jharkhand",
    "district": "Dhanbad",
    "lat": 23.7957,
    "lng": 86.4304
}
```

The rest of the prediction pipeline runs automatically.

---

# Sample outputs
# ATM Risk Prediction Results SAMPLE OUTPUT -1

| # | ATM ID | Fraud Density | Velocity (6h) | Mule Distance (km) | ATM Count District | Cross-State | Risk Score | State | District | Latitude | Longitude | Bank |
|---:|---|---:|---:|---:|---:|---:|---:|---|---|---:|---:|---|
| 724 | ATM_00725 | 0.019027 | 0 | 124.943015 | 28 | 0 | 0.53519 | Maharashtra | Nashik | 20.018492 | 73.815558 | Axis Bank |
| 798 | ATM_00799 | 0.019027 | 0 | 123.556619 | 28 | 0 | 0.53519 | Maharashtra | Nashik | 19.989345 | 73.827462 | Canara Bank |
| 811 | ATM_00812 | 0.019027 | 0 | 119.663656 | 28 | 0 | 0.53519 | Maharashtra | Nashik | 20.002346 | 73.760652 | Canara Bank |
| 813 | ATM_00814 | 0.019027 | 0 | 124.259199 | 28 | 0 | 0.53519 | Maharashtra | Nashik | 20.024878 | 73.799236 | Bank of Baroda |
| 734 | ATM_00735 | 0.019027 | 0 | 123.343279 | 28 | 0 | 0.53519 | Maharashtra | Nashik | 19.986934 | 73.827092 | IndusInd Bank |
| 737 | ATM_00738 | 0.019027 | 0 | 122.705332 | 28 | 0 | 0.53519 | Maharashtra | Nashik | 20.011628 | 73.792422 | PNB |
| 742 | ATM_00743 | 0.019027 | 0 | 119.633611 | 28 | 0 | 0.53519 | Maharashtra | Nashik | 20.032624 | 73.724624 | PNB |
| 772 | ATM_00773 | 0.019027 | 0 | 123.742120 | 28 | 0 | 0.53519 | Maharashtra | Nashik | 19.991249 | 73.827978 | IndusInd Bank |
| 818 | ATM_00819 | 0.019027 | 0 | 124.086075 | 28 | 0 | 0.53519 | Maharashtra | Nashik | 19.977205 | 73.846569 | Kotak Mahindra Bank |
| 679 | ATM_00680 | 0.019027 | 0 | 124.417482 | 28 | 0 | 0.53519 | Maharashtra | Nashik | 19.958334 | 73.868899 | Axis Bank |



# ATM Risk Prediction Results SAMPLE OUTPUT-2

| Rank | ATM ID | Fraud Density | Velocity (6h) | Mule Distance (km) | ATM Count District | Cross-State | Risk Score | State | District | Latitude | Longitude | Bank |
|---:|---|---:|---:|---:|---:|---:|---:|---|---|---:|---:|---|
| 1 | ATM_00006 | 0.007393 | 0 | 817.69 | 8 | 1 | 45.31% | Andhra Pradesh | Vijayawada | 16.476413 | 80.631663 | Kotak Mahindra Bank |
| 2 | ATM_01491 | 0.006913 | 0 | 756.59 | 8 | 1 | 45.31% | West Bengal | Durgapur | 23.441601 | 87.291068 | Axis Bank |
| 3 | ATM_01490 | 0.006913 | 0 | 756.24 | 8 | 1 | 45.31% | West Bengal | Durgapur | 23.507834 | 87.292892 | HDFC Bank |
| 4 | ATM_00504 | 0.003067 | 0 | 670.93 | 8 | 1 | 45.31% | Jharkhand | Dhanbad | 23.812608 | 86.469362 | Bank of Baroda |
| 5 | ATM_00505 | 0.003067 | 0 | 667.91 | 8 | 1 | 45.31% | Jharkhand | Dhanbad | 23.767422 | 86.438564 | Bank of Baroda |
| 6 | ATM_00506 | 0.003067 | 0 | 666.29 | 8 | 1 | 45.31% | Jharkhand | Dhanbad | 23.788621 | 86.423187 | SBI |
| 7 | ATM_00507 | 0.003067 | 0 | 672.14 | 8 | 1 | 45.31% | Jharkhand | Dhanbad | 23.772751 | 86.480245 | Union Bank |
| 8 | ATM_00508 | 0.003067 | 0 | 665.24 | 8 | 1 | 45.31% | Jharkhand | Dhanbad | 23.718469 | 86.410541 | Canara Bank |
| 9 | ATM_00510 | 0.003067 | 0 | 665.24 | 8 | 1 | 45.31% | Jharkhand | Dhanbad | 23.878969 | 86.414574 | HDFC Bank |
| 10 | ATM_00513 | 0.003067 | 0 | 666.06 | 8 | 1 | 45.31% | Jharkhand | Dhanbad | 23.782006 | 86.420776 | Axis Bank |

### NOTE
How are doing doest not matter the data needed is final which is shown above that is needed for predictions
# 9. Important Note

The predicted ATM risk is an **analytical risk score for prioritization**. It should not be interpreted as proof that a particular person, mule account, or ATM is involved in criminal activity.

