import os
import sys
import time
import uuid
import random
import argparse
import datetime
from typing import List, Dict, Tuple, Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy import delete

from backend.app.database import engine, SessionLocal, Base
from backend.app.models import (
    MuleAccount,
    Complaint,
    ATMLocation,
    ATMRiskHistory,
    Alert,
    utc_now
)
from backend.scripts.fetch_atms import TOP_STATES_DISTRICTS, BANKS

# Calibrated probabilities
STATE_WEIGHTS = {
    "Uttar Pradesh": 0.30,
    "Maharashtra": 0.25,
    "Rajasthan": 0.20,
    "Telangana": 0.15,
    "Karnataka": 0.10,
}

CRIME_TYPES = ["otp_fraud", "atm_card_fraud", "investment_scam"]
CRIME_WEIGHTS = [0.45, 0.30, 0.25]


def get_random_state() -> str:
    states = list(STATE_WEIGHTS.keys())
    weights = list(STATE_WEIGHTS.values())
    return random.choices(states, weights=weights, k=1)[0]


def get_random_district(state: str) -> Tuple[str, float, float]:
    districts = TOP_STATES_DISTRICTS.get(state, TOP_STATES_DISTRICTS["Uttar Pradesh"])
    district_name = random.choice(list(districts.keys()))
    lat, lng = districts[district_name]
    # small jitter
    lat += random.gauss(0, 0.03)
    lng += random.gauss(0, 0.03)
    return district_name, lat, lng


def generate_mule_accounts(
    db: Session,
    num_mules: int = 5000,
    cross_state_ratio: float = 0.25,
    force: bool = False
) -> List[str]:
    """Generates mule accounts with linked ATM IDs and cross-state distribution."""
    existing_mules = [m[0] for m in db.query(MuleAccount.mule_id).all()]
    if existing_mules and len(existing_mules) >= min(50, num_mules) and not force:
        print(f"Mule accounts already populated ({len(existing_mules)} records). Reusing existing mules.")
        return existing_mules

    existing_set = set(existing_mules)
    atms = db.query(ATMLocation).all()
    atm_ids_by_state = {}
    for a in atms:
        atm_ids_by_state.setdefault(a.state, []).append(a.atm_id)

    all_atm_ids = [a.atm_id for a in atms] if atms else [f"ATM_{i:05d}" for i in range(1, 100)]

    mules = []
    mule_ids = list(existing_mules)
    start_idx = len(existing_mules) + 1

    for i in range(start_idx, start_idx + num_mules):
        mule_id = f"MULE_{i:06d}"
        if mule_id in existing_set:
            continue
        mule_ids.append(mule_id)
        existing_set.add(mule_id)

        state = get_random_state()
        district, lat, lng = get_random_district(state)
        is_cross_state = random.random() < cross_state_ratio

        # Link 3 nearest/local ATM IDs
        candidate_atms = atm_ids_by_state.get(state, all_atm_ids)
        linked = random.sample(candidate_atms, min(3, len(candidate_atms))) if candidate_atms else []

        mules.append({
            "mule_id": mule_id,
            "registered_state": state,
            "registered_district": district,
            "registered_lat": round(lat, 6),
            "registered_lng": round(lng, 6),
            "account_bank": random.choice(BANKS),
            "is_cross_state": is_cross_state,
            "linked_atm_ids": linked
        })

    if mules:
        # Bulk insert in batches
        batch_size = 2000
        for i in range(0, len(mules), batch_size):
            db.bulk_insert_mappings(MuleAccount, mules[i:i + batch_size])
        db.commit()

    return mule_ids


def generate_batch_complaints(
    db: Session,
    days: int = 30,
    complaints_per_day: int = 8000,
    mule_ids: Optional[List[str]] = None,
    force: bool = False
) -> int:
    """Generates batch complaints and historical ATM risk records."""
    existing_count = db.query(Complaint).count()
    if existing_count >= 1000 and not force:
        print(f"Database already populated with {existing_count} complaints. Skipping batch generation.")
        return existing_count

    if not mule_ids:
        existing_mules = db.query(MuleAccount.mule_id).all()
        mule_ids = [m[0] for m in existing_mules]
        if not mule_ids:
            mule_ids = generate_mule_accounts(db, num_mules=4000)

    # Fetch mule accounts metadata for cross-state alignment
    mule_records = db.query(MuleAccount.mule_id, MuleAccount.registered_state, MuleAccount.is_cross_state).all()
    mule_dict = {m.mule_id: (m.registered_state, m.is_cross_state) for m in mule_records}

    start_date = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=days)
    complaints = []
    total_complaints = 0

    complaint_counts_per_district_date = {}

    for d in range(days):
        current_date = start_date + datetime.timedelta(days=d)
        is_weekday = current_date.weekday() < 5
        day_factor = 1.3 if is_weekday else 0.8
        target_for_day = int(complaints_per_day * day_factor)

        for _ in range(target_for_day):
            mule_id = random.choice(mule_ids)
            m_state, is_cross = mule_dict.get(mule_id, (get_random_state(), False))

            if is_cross:
                # Origin state differs from mule registered state
                other_states = [s for s in STATE_WEIGHTS.keys() if s != m_state]
                comp_state = random.choice(other_states)
            else:
                comp_state = m_state

            district, _, _ = get_random_district(comp_state)
            crime_type = random.choices(CRIME_TYPES, weights=CRIME_WEIGHTS, k=1)[0]
            amount = round(random.uniform(10000, 500000), 2)

            # Assign timestamp across the day
            second_offset = random.randint(0, 86399)
            ts = current_date.replace(hour=0, minute=0, second=0, microsecond=0) + datetime.timedelta(seconds=second_offset)

            complaints.append({
                "complaint_id": f"COMP_{uuid.uuid4().hex[:12].upper()}",
                "timestamp": ts,
                "state": comp_state,
                "district": district,
                "crime_type": crime_type,
                "amount_inr": amount,
                "mule_account_id": mule_id,
                "status": "pending" if d >= days - 2 else random.choice(["pending", "resolved"])
            })

            key = (comp_state, district, ts.date())
            complaint_counts_per_district_date[key] = complaint_counts_per_district_date.get(key, 0) + 1

        total_complaints += target_for_day

        # Batch insert every 10k rows
        if len(complaints) >= 10000:
            db.bulk_insert_mappings(Complaint, complaints)
            db.commit()
            complaints = []

    if complaints:
        db.bulk_insert_mappings(Complaint, complaints)
        db.commit()

    # Populate atm_risk_history
    atms = db.query(ATMLocation).all()
    history_records = []
    for d in range(days):
        h_date = (start_date + datetime.timedelta(days=d)).date()
        for atm in atms:
            key = (atm.state, atm.district, h_date)
            c_count = complaint_counts_per_district_date.get(key, random.randint(1, 10))
            risk_score = min(1.0, round(c_count / 40.0 + random.uniform(0.05, 0.35), 4))
            spike = risk_score > 0.70

            history_records.append({
                "atm_id": atm.atm_id,
                "date": h_date,
                "risk_score": risk_score,
                "complaint_count": c_count,
                "spike_flag": spike,
                "district": atm.district,
                "state": atm.state
            })

        if len(history_records) >= 10000:
            db.bulk_insert_mappings(ATMRiskHistory, history_records)
            db.commit()
            history_records = []

    if history_records:
        db.bulk_insert_mappings(ATMRiskHistory, history_records)
        db.commit()

    print(f"Batch generation completed: {total_complaints} complaints created across {days} days.")
    return total_complaints


def inject_spike_scenario(db: Session, stage: str = "all") -> Dict[str, Any]:
    """
    Executes scripted 2-stage demo scenario:
    Stage 1: Cross-state fraud (Rajasthan origin complaints -> UP mule accounts -> CRITICAL alert)
    Stage 2: Single-state spike (UP complaints exceed 2x 7-day rolling average -> WARNING alert)
    """
    now = utc_now()
    alerts_fired = []
    affected_atms = []

    # Get or create cross-state UP mules
    up_mules = db.query(MuleAccount).filter_by(registered_state="Uttar Pradesh", is_cross_state=True).all()
    if not up_mules:
        # Create a specific mule account in Noida, UP
        mule = MuleAccount(
            mule_id=f"MULE_DEMO_UP_{uuid.uuid4().hex[:6]}",
            registered_state="Uttar Pradesh",
            registered_district="Noida",
            registered_lat=28.5355,
            registered_lng=77.3910,
            account_bank="State Bank of India",
            is_cross_state=True,
            linked_atm_ids=[]
        )
        db.add(mule)
        db.commit()
        up_mules = [mule]

    up_atms = db.query(ATMLocation).filter_by(state="Uttar Pradesh", district="Noida").all()
    if not up_atms:
        up_atms = db.query(ATMLocation).filter_by(state="Uttar Pradesh").limit(10).all()
    affected_atms = [a.atm_id for a in up_atms]

    if stage in (1, "1", "all"):
        # Stage 1: Cross-state Rajasthan -> UP
        mule_id = up_mules[0].mule_id
        for _ in range(15):
            comp = Complaint(
                complaint_id=f"COMP_SPIKE_S1_{uuid.uuid4().hex[:8].upper()}",
                timestamp=now,
                state="Rajasthan",
                district="Jaipur",
                crime_type="otp_fraud",
                amount_inr=150000.0,
                mule_account_id=mule_id,
                status="pending"
            )
            db.add(comp)

        alert_s1 = Alert(
            district="Noida",
            state="Uttar Pradesh",
            severity="CRITICAL",
            detected_at=now,
            triggered_by="auto",
            complaint_count=15,
            rolling_avg=4.2,
            cross_state=True,
            message="CRITICAL: Cross-state mule cash-out risk detected (Rajasthan complaints -> UP mule accounts)"
        )
        db.add(alert_s1)
        alerts_fired.append({
            "stage": 1,
            "district": "Noida",
            "state": "Uttar Pradesh",
            "severity": "CRITICAL",
            "cross_state": True
        })

    if stage in (2, "2", "all"):
        # Stage 2: UP single-state velocity spike
        for _ in range(35):
            comp = Complaint(
                complaint_id=f"COMP_SPIKE_S2_{uuid.uuid4().hex[:8].upper()}",
                timestamp=now,
                state="Uttar Pradesh",
                district="Lucknow",
                crime_type="atm_card_fraud",
                amount_inr=85000.0,
                mule_account_id=None,
                status="pending"
            )
            db.add(comp)

        alert_s2 = Alert(
            district="Lucknow",
            state="Uttar Pradesh",
            severity="WARNING",
            detected_at=now + datetime.timedelta(seconds=2),
            triggered_by="auto",
            complaint_count=35,
            rolling_avg=12.0,
            cross_state=False,
            message="WARNING: Complaint velocity spike in Lucknow exceeds 2x 7-day rolling average"
        )
        db.add(alert_s2)
        alerts_fired.append({
            "stage": 2,
            "district": "Lucknow",
            "state": "Uttar Pradesh",
            "severity": "WARNING",
            "cross_state": False
        })

    db.commit()
    return {
        "status": "injected",
        "stage": stage,
        "alerts_fired": alerts_fired,
        "affected_atms": affected_atms
    }


def stream_live_complaint(db: Session, mule_ids: Optional[List[str]] = None) -> Complaint:
    """Generates and persists a single real-time complaint."""
    if not mule_ids:
        existing = db.query(MuleAccount.mule_id).limit(100).all()
        mule_ids = [m[0] for m in existing] if existing else None

    state = get_random_state()
    district, _, _ = get_random_district(state)
    crime = random.choices(CRIME_TYPES, weights=CRIME_WEIGHTS, k=1)[0]
    mule_id = random.choice(mule_ids) if mule_ids else None

    comp = Complaint(
        complaint_id=f"COMP_LIVE_{uuid.uuid4().hex[:8].upper()}",
        timestamp=utc_now(),
        state=state,
        district=district,
        crime_type=crime,
        amount_inr=round(random.uniform(15000, 250000), 2),
        mule_account_id=mule_id,
        status="pending"
    )
    db.add(comp)
    db.commit()
    db.refresh(comp)
    return comp


def reset_database(db: Session):
    """Wipes generated data tables idempotently."""
    print("Resetting generated data tables...")
    db.execute(delete(Alert))
    db.execute(delete(Complaint))
    db.execute(delete(MuleAccount))
    db.execute(delete(ATMRiskHistory))
    db.commit()
    print("Reset complete.")


def main():
    parser = argparse.ArgumentParser(description="Track the Cash Synthetic Data Generator")
    parser.add_argument("--mode", choices=["batch", "live", "spike"], default="batch")
    parser.add_argument("--days", type=int, default=30)
    parser.add_argument("--complaints-per-day", type=int, default=8000)
    parser.add_argument("--inject-spike", action="store_true")
    parser.add_argument("--reset", action="store_true")
    parser.add_argument("--rate", type=float, default=0.5, help="Seconds between complaints in live mode")

    args = parser.parse_args()
    db = SessionLocal()

    try:
        if args.reset:
            reset_database(db)

        if args.inject_spike:
            result = inject_spike_scenario(db, stage="all")
            print("Spike scenario injected:", result)
            return

        if args.mode == "batch":
            mule_ids = generate_mule_accounts(db, num_mules=3000)
            generate_batch_complaints(db, days=args.days, complaints_per_day=args.complaints_per_day, mule_ids=mule_ids)
        elif args.mode == "live":
            print(f"Streaming live complaints at 1 per {args.rate}s. Press Ctrl+C to stop.")
            while True:
                c = stream_live_complaint(db)
                print(f"[{c.timestamp.strftime('%H:%M:%S')}] New complaint {c.complaint_id} in {c.district}, {c.state} (₹{c.amount_inr:,.2f})")
                time.sleep(args.rate)
    finally:
        db.close()


if __name__ == "__main__":
    main()
