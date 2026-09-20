import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from backend.app.database import get_db
from backend.app.auth import require_admin
from backend.app.models import Complaint, Case, Alert, utc_now
from backend.app.schemas import VelocityResponse, VelocityItem
from backend.app.ml.model import ATMDefenseModel

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/velocity", response_model=VelocityResponse)
def get_complaint_velocity(
    days: int = Query(7, ge=1, le=90),
    states: Optional[str] = Query(None, description="Comma-separated list of states"),
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin)
):
    now = utc_now()
    start_date = (now - datetime.timedelta(days=days)).date()

    target_states = None
    if states:
        target_states = [s.strip() for s in states.split(",") if s.strip()]
    else:
        target_states = ["Uttar Pradesh", "Maharashtra", "Rajasthan", "Telangana", "Karnataka"]

    # Filter complaints within range
    complaints = db.query(Complaint.state, Complaint.timestamp).filter(
        Complaint.state.in_(target_states),
        Complaint.timestamp >= datetime.datetime.combine(start_date, datetime.time.min)
    ).all()

    counts_map = {}
    for d in range(days):
        dt_str = (start_date + datetime.timedelta(days=d)).isoformat()
        for s in target_states:
            counts_map[(dt_str, s)] = 0

    for c_state, c_ts in complaints:
        if c_ts:
            c_date = c_ts.date() if isinstance(c_ts, datetime.datetime) else c_ts
            dt_str = c_date.isoformat()
            if (dt_str, c_state) in counts_map:
                counts_map[(dt_str, c_state)] += 1

    trend_items = []
    for (dt_str, s), count in sorted(counts_map.items()):
        trend_items.append(VelocityItem(
            date=dt_str,
            state=s,
            complaint_count=count
        ))

    return VelocityResponse(trend=trend_items)


@router.get("/charts")
def get_analytics_charts(
    time_frame: str = Query("7d", description="24h, 7d, 30d, all"),
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin)
):
    """Calculates multi-dimensional analytics for real-time visual charts."""
    now = utc_now()

    if time_frame == "24h":
        start_time = now - datetime.timedelta(hours=24)
    elif time_frame == "30d":
        start_time = now - datetime.timedelta(days=30)
    elif time_frame == "all":
        start_time = now - datetime.timedelta(days=365)
    else:  # 7d default
        start_time = now - datetime.timedelta(days=7)

    # 1. State Distribution (Top 8)
    state_rows = db.query(
        Complaint.state,
        func.count(Complaint.complaint_id),
        func.sum(Complaint.amount_inr)
    ).group_by(Complaint.state).order_by(desc(func.count(Complaint.complaint_id))).limit(8).all()

    state_distribution = [
        {
            "state": r[0],
            "count": r[1],
            "amount_inr": float(r[2] or 0.0),
            "amount_cr": round(float(r[2] or 0.0) / 10000000, 2)
        }
        for r in state_rows
    ]

    # 2. Crime Type Breakdown
    crime_rows = db.query(
        Complaint.crime_type,
        func.count(Complaint.complaint_id)
    ).group_by(Complaint.crime_type).order_by(desc(func.count(Complaint.complaint_id))).limit(6).all()

    crime_distribution = [
        {"crime_type": r[0] or "atm_card_fraud", "count": r[1]}
        for r in crime_rows
    ]

    # 3. Priority Breakdown
    priority_rows = db.query(
        Complaint.priority,
        func.count(Complaint.complaint_id)
    ).group_by(Complaint.priority).all()

    priority_distribution = {
        r[0] or "HIGH": r[1] for r in priority_rows
    }

    # 4. Resolution Status
    active_count = db.query(func.count(Complaint.complaint_id)).filter(
        ~func.lower(Complaint.status).in_(["resolved", "closed"])
    ).scalar() or 0

    resolved_count = db.query(func.count(Complaint.complaint_id)).filter(
        func.lower(Complaint.status).in_(["resolved", "closed"])
    ).scalar() or 0

    total = active_count + resolved_count
    resolution_rate = round((resolved_count / total * 100), 1) if total > 0 else 0.0

    return {
        "time_frame": time_frame,
        "state_distribution": state_distribution,
        "crime_distribution": crime_distribution,
        "priority_distribution": priority_distribution,
        "resolution_stats": {
            "active_complaints": active_count,
            "resolved_complaints": resolved_count,
            "total_complaints": total,
            "resolution_rate_pct": resolution_rate
        },
        "generated_at": now.isoformat()
    }


@router.get("/metrics")
def get_model_metrics(
    admin: dict = Depends(require_admin)
):
    model = ATMDefenseModel()
    model.load()
    return model.metadata
