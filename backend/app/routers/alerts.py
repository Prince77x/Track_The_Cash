import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database import get_db
from backend.app.auth import require_authenticated, require_admin
from backend.app.models import Alert, utc_now
from backend.app.schemas import (
    AlertTriggerRequest,
    AlertTriggerResponse,
    SpikeCheckResponse,
    SpikeItem
)
from backend.app.ml.spike_detector import detect_spikes
from backend.app.email_service import send_alert_email

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("/spike-check", response_model=SpikeCheckResponse)
def trigger_spike_check(
    db: Session = Depends(get_db),
    user: dict = Depends(require_authenticated)
):
    """Runs the spike detector on-demand and returns newly identified spikes."""
    spikes = detect_spikes(db, send_email=True)
    items = []
    for s in spikes:
        items.append(SpikeItem(
            district=s["district"],
            state=s["state"],
            severity=s["severity"],
            complaint_count=s["complaint_count"],
            rolling_avg=s["rolling_avg"],
            cross_state=s["cross_state"],
            detected_at=s["detected_at"]
        ))
    return SpikeCheckResponse(spikes=items)


@router.get("", response_model=List[Dict[str, Any]])
@router.get("/feed", response_model=List[Dict[str, Any]])
def get_alert_feed(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: dict = Depends(require_authenticated)
):
    """Returns the latest alerts for dashboard feed displays."""
    alerts = db.query(Alert).order_by(desc(Alert.detected_at)).limit(limit).all()
    results = []
    for a in alerts:
        results.append({
            "alert_id": a.alert_id,
            "district": a.district,
            "state": a.state,
            "severity": a.severity,
            "detected_at": a.detected_at.isoformat() if a.detected_at else "",
            "triggered_by": a.triggered_by,
            "complaint_count": a.complaint_count,
            "rolling_avg": a.rolling_avg,
            "cross_state": a.cross_state,
            "message": a.message
        })
    return results


@router.post("/trigger", response_model=AlertTriggerResponse)
def manual_trigger_alert(
    request: AlertTriggerRequest,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin)
):
    """Manually triggers an alert email and logs it to the database (Admin only)."""
    now = utc_now()
    # Find state for the district if possible
    state = "State Jurisdiction"

    # Send email
    res = send_alert_email(
        district=request.district,
        state=state,
        severity=request.severity,
        complaint_count=1,
        message=request.message
    )

    # Record in alerts table
    alert = Alert(
        district=request.district,
        state=state,
        severity=request.severity,
        detected_at=now,
        triggered_by="manual",
        complaint_count=1,
        rolling_avg=0.0,
        cross_state=False,
        message=request.message
    )
    db.add(alert)
    db.commit()

    return AlertTriggerResponse(
        status="sent",
        recipients=res.get("recipients", [f"lea_{request.district.lower()}@police.gov.in"]),
        triggered_at=now.isoformat()
    )
