from __future__ import annotations

import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.models import Alert, ATMLocation, ATMRiskHistory, Complaint, Prediction, Transaction, User


def get_risk_factors(db: Session, atm_id: str) -> List[Dict[str, Any]]:
    now = datetime.datetime.now(datetime.timezone.utc)
    day_ago = now - datetime.timedelta(days=1)
    week_ago = now - datetime.timedelta(days=7)

    complaint_count_24h = db.query(Complaint).filter(Complaint.timestamp >= day_ago, Complaint.status != "rejected").count()
    complaint_count_7d = db.query(Complaint).filter(Complaint.timestamp >= week_ago).count()
    withdrawal_count_24h = db.query(Transaction).filter(Transaction.transaction_time >= day_ago, Transaction.atm_id == atm_id).count()
    withdrawal_amount_24h = db.query(func.coalesce(func.sum(Transaction.amount_inr), 0)).filter(
        Transaction.transaction_time >= day_ago,
        Transaction.atm_id == atm_id,
    ).scalar() or 0
    unique_mules = db.query(Transaction.mule_account_id).filter(Transaction.atm_id == atm_id, Transaction.mule_account_id.isnot(None)).distinct().count()
    cross_state_count = db.query(Transaction).filter(Transaction.atm_id == atm_id, Transaction.state != "UP").count()
    historical_risk = db.query(func.avg(ATMRiskHistory.risk_score)).filter(ATMRiskHistory.atm_id == atm_id).scalar() or 0
    recent_count = db.query(Transaction).filter(Transaction.atm_id == atm_id, Transaction.transaction_time >= day_ago).count()
    rolling_avg = db.query(func.avg(Transaction.amount_inr)).filter(Transaction.atm_id == atm_id).scalar() or 0
    spike_ratio = (recent_count / max(1, float(rolling_avg or 1))) if rolling_avg else 1.0

    return [
        {"factor": "complaint_spike", "value": round(max(1.0, complaint_count_24h / max(1, complaint_count_7d / 7)), 2), "description": "Complaint activity relative to baseline"},
        {"factor": "withdrawal_count_24h", "value": float(withdrawal_count_24h), "description": "Withdrawals in the last 24 hours"},
        {"factor": "withdrawal_amount_24h", "value": float(withdrawal_amount_24h), "description": "Transaction amount in the last 24 hours"},
        {"factor": "unique_mule_accounts", "value": float(unique_mules), "description": "Distinct mule accounts linked to ATM"},
        {"factor": "cross_state_count", "value": float(cross_state_count), "description": "Cross-state activity count"},
        {"factor": "historical_risk", "value": float(historical_risk), "description": "Average historical risk"},
        {"factor": "spike_ratio", "value": round(spike_ratio, 2), "description": "Recent activity compared with baseline"},
    ]


def detect_cross_state(db: Session, entities: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    set_of_states = set()
    count = 0
    if entities is None:
        entities = []
    for item in entities:
        value = item.get("state")
        if value:
            set_of_states.add(value)
            count += 1
    result = {
        "is_cross_state": len(set_of_states) > 1,
        "states": sorted(set_of_states),
        "entity_count": count,
    }
    return result


def compute_spike_metrics(db: Session, atm_id: str) -> Dict[str, Any]:
    now = datetime.datetime.now(datetime.timezone.utc)
    window = now - datetime.timedelta(days=1)
    recent = db.query(Transaction).filter(Transaction.atm_id == atm_id, Transaction.transaction_time >= window).count()
    baseline = db.query(Transaction).filter(Transaction.atm_id == atm_id, Transaction.transaction_time < window).count()
    rolling_average = baseline / 30.0 if baseline else 1.0
    spike_ratio = recent / max(rolling_average, 1.0)
    return {
        "rolling_average": round(rolling_average, 2),
        "recent_count": recent,
        "spike_ratio": round(spike_ratio, 2),
        "spike_flag": spike_ratio >= settings.SPIKE_THRESHOLD,
    }


def explain_atm_risk(db: Session, atm_id: str) -> Dict[str, Any]:
    atm = db.query(ATMLocation).filter(ATMLocation.atm_id == atm_id).first()
    if not atm:
        raise ValueError("ATM not found")
    latest_prediction = db.query(Prediction).filter(Prediction.atm_id == atm_id).order_by(Prediction.predicted_at.desc()).first()
    factors = get_risk_factors(db, atm_id)
    cross_state = detect_cross_state(db, [{"state": atm.state}, {"state": "Delhi"}])
    spike = compute_spike_metrics(db, atm_id)
    risk_score = float(latest_prediction.risk_score) if latest_prediction else 0.0
    return {
        "atm_id": atm_id,
        "risk_score": risk_score,
        "factors": factors,
        "cross_state": cross_state,
        "spike": spike,
    }
