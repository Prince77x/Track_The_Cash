import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.database import get_db
from backend.app.auth import require_admin
from backend.app.models import Complaint, utc_now
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

    # Determine states to include
    target_states = None
    if states:
        target_states = [s.strip() for s in states.split(",") if s.strip()]
    else:
        # Default top 5 fraud states
        target_states = ["Uttar Pradesh", "Maharashtra", "Rajasthan", "Telangana", "Karnataka"]

    complaints = db.query(Complaint).filter(Complaint.state.in_(target_states)).all()

    # Aggregate counts by date and state
    counts_map = {}
    # Pre-populate all dates for target states
    for d in range(days):
        dt_str = (start_date + datetime.timedelta(days=d)).isoformat()
        for s in target_states:
            counts_map[(dt_str, s)] = 0

    for c in complaints:
        c_date = c.timestamp.date() if isinstance(c.timestamp, datetime.datetime) else c.timestamp
        if c_date >= start_date:
            dt_str = c_date.isoformat()
            if (dt_str, c.state) in counts_map:
                counts_map[(dt_str, c.state)] += 1

    trend_items = []
    for (dt_str, s), count in sorted(counts_map.items()):
        trend_items.append(VelocityItem(
            date=dt_str,
            state=s,
            complaint_count=count
        ))

    return VelocityResponse(trend=trend_items)


@router.get("/metrics")
def get_model_metrics(
    admin: dict = Depends(require_admin)
):
    model = ATMDefenseModel()
    model.load()
    return model.metadata
