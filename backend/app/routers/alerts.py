import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, or_
from pydantic import BaseModel

from backend.app.database import get_db
from backend.app.auth import require_authenticated, require_admin, record_audit
from backend.app.models import Alert, ATMLocation, AdminNotification, utc_now
from backend.app.schemas import (
    AlertTriggerRequest,
    AlertTriggerResponse,
    SpikeCheckResponse,
    SpikeItem
)
from backend.app.ml.spike_detector import detect_spikes
from backend.app.email_service import send_alert_email

router = APIRouter(prefix="/alerts", tags=["Alerts"])


class UpdateAlertRequest(BaseModel):
    status: Optional[str] = None  # ACTIVE, ACKNOWLEDGED, INVESTIGATING, RESOLVED, ESCALATED
    assigned_officer: Optional[str] = None
    note: Optional[str] = None


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


@router.get("")
@router.get("/feed")
def get_alerts(
    severity: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    user: dict = Depends(require_authenticated)
):
    """Returns alerts with comprehensive search, filters, and pagination for Command and LEA centers."""
    query = db.query(Alert)

    if severity and severity.upper() != "ALL":
        query = query.filter(func.upper(Alert.severity) == severity.upper())

    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(func.upper(func.coalesce(Alert.status, 'ACTIVE')) == status_filter.upper())

    if state:
        query = query.filter(Alert.state == state)

    if district:
        query = query.filter(Alert.district == district)

    if search:
        s_fmt = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Alert.district.ilike(s_fmt),
                Alert.state.ilike(s_fmt),
                Alert.message.ilike(s_fmt),
                func.coalesce(Alert.assigned_officer, '').ilike(s_fmt)
            )
        )

    total = query.count()
    alerts = query.order_by(desc(Alert.detected_at)).offset(offset).limit(limit).all()

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
            "message": a.message or "",
            "status": a.status or "ACTIVE",
            "assigned_officer": a.assigned_officer or "Unassigned",
            "investigation_notes": a.investigation_notes or [],
            "action_history": a.action_history or []
        })

    # Return list if feed requested without pagination queries for backward compatibility
    if offset == 0 and not severity and not search:
        return results

    return {
        "total": total,
        "items": results,
        "limit": limit,
        "offset": offset
    }


@router.patch("/{alert_id}")
def update_alert(
    alert_id: int,
    payload: UpdateAlertRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(require_authenticated)
):
    """Triage and operational update on an alert (Acknowledge, Assign, Escalate, Resolve)."""
    alert = db.query(Alert).filter_by(alert_id=alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    now = utc_now()
    notes = list(alert.investigation_notes or [])
    history = list(alert.action_history or [])
    actor = user.get("full_name", user.get("username", "Officer"))

    if payload.status:
        old_status = alert.status or "ACTIVE"
        alert.status = payload.status.upper()
        history.append({
            "action": f"STATUS_CHANGE_{alert.status}",
            "actor": actor,
            "timestamp": now.isoformat(),
            "note": f"Alert status transitioned from {old_status} to {alert.status}."
        })

    if payload.assigned_officer:
        alert.assigned_officer = payload.assigned_officer
        history.append({
            "action": "OFFICER_ASSIGNMENT",
            "actor": actor,
            "timestamp": now.isoformat(),
            "note": f"Assigned to {payload.assigned_officer}."
        })

    if payload.note:
        notes.append({
            "author": actor,
            "timestamp": now.isoformat(),
            "note": payload.note.strip()
        })

    alert.investigation_notes = notes
    alert.action_history = history
    db.commit()

    return {
        "status": "updated",
        "alert_id": alert_id,
        "current_status": alert.status,
        "assigned_officer": alert.assigned_officer
    }


@router.post("/trigger", response_model=AlertTriggerResponse)
def manual_trigger_alert(
    request: AlertTriggerRequest,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin)
):
    """Manually triggers an alert email and logs it to the database (Admin only)."""
    now = utc_now()
    
    # Try to find matching state for district from ATMLocation or Complaint
    atm_match = db.query(ATMLocation).filter_by(district=request.district).first()
    state = atm_match.state if atm_match else "State Jurisdiction"

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
        message=request.message,
        status="ACTIVE",
        assigned_officer="Admin Operations Center",
        investigation_notes=[{
            "author": admin.get("username", "admin_user"),
            "timestamp": now.isoformat(),
            "note": f"Manual emergency broadcast initiated: {request.message}"
        }]
    )
    db.add(alert)
    db.commit()

    # Record in Audit Log
    record_audit(
        db=db,
        admin_user=admin.get("username", "admin_user"),
        action="DISPATCH_MANUAL_ALERT",
        resource="alerts",
        resource_id=str(alert.alert_id),
        details={"district": request.district, "severity": request.severity, "message": request.message}
    )

    # Add notification
    db.add(AdminNotification(
        timestamp=now,
        title=f"Manual Alert Dispatched: {request.district} ({request.severity})",
        message=request.message,
        type="CRITICAL_ALERT" if request.severity == "CRITICAL" else "SYSTEM",
        severity=request.severity.lower(),
        metadata_json={"alert_id": alert.alert_id, "district": request.district}
    ))
    db.commit()

    return AlertTriggerResponse(
        status="sent",
        recipients=res.get("recipients", [f"lea_{request.district.lower()}@police.gov.in"]),
        triggered_at=now.isoformat()
    )
