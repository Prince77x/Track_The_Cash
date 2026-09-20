from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.auth import get_current_user, require_roles
from backend.app.database import get_db
from backend.app.models import Alert, AlertDelivery, AlertFactor, User
from backend.app.schemas import AlertOut
from backend.app.ml.spike_detector import detect_spikes

router = APIRouter(prefix="/api/v1/alerts", tags=["Alerts"])
legacy_router = APIRouter(prefix="/alerts", tags=["Alerts"])


@legacy_router.get("/spike-check")
def spike_check(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("LEA", "I4C", "BANK", "ADMIN")),
):
    return {"spikes": detect_spikes(db)}


@legacy_router.post("/trigger")
def trigger_alert(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    alert = Alert(
        district=payload.get("district", ""),
        state=payload.get("state", ""),
        severity=payload.get("severity", "WARNING"),
        triggered_by="manual",
        message=payload.get("message", "Manual alert"),
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return {"status": "sent", "alert_id": alert.alert_id}


@legacy_router.get("/feed")
def alert_feed(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("LEA", "I4C", "BANK", "ADMIN")),
):
    return db.query(Alert).order_by(Alert.detected_at.desc()).all()


@router.get("", response_model=list[AlertOut])
def list_alerts(
    state: Optional[str] = None,
    district: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.upper() not in {"ADMIN", "LEA", "I4C", "BANK"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    query = db.query(Alert)
    if state:
        query = query.filter(Alert.state == state)
    if district:
        query = query.filter(Alert.district == district)
    if severity:
        query = query.filter(Alert.severity == severity)
    if status:
        query = query.filter(Alert.status == status)

    alerts = query.order_by(Alert.detected_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return alerts


@router.get("/{alert_id}", response_model=AlertOut)
def get_alert(alert_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.post("/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles("LEA", "I4C", "BANK", "ADMIN"))):
    alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = "ACKNOWLEDGED"
    alert.updated_at = __import__("datetime").datetime.now(__import__("datetime").timezone.utc)
    db.commit()
    return {"message": "Alert acknowledged", "alert_id": alert.alert_id}


@router.post("/{alert_id}/escalate")
def escalate_alert(alert_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles("LEA", "I4C", "ADMIN"))):
    alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = "ESCALATED"
    db.commit()
    return {"message": "Alert escalated", "alert_id": alert.alert_id}


@router.post("/{alert_id}/resolve")
def resolve_alert(alert_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles("LEA", "I4C", "ADMIN"))):
    alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = "RESOLVED"
    db.commit()
    return {"message": "Alert resolved", "alert_id": alert.alert_id}


@router.get("/{alert_id}/deliveries")
def get_alert_deliveries(alert_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    deliveries = db.query(AlertDelivery).filter(AlertDelivery.alert_id == alert_id).all()
    return deliveries


@router.post("/{alert_id}/notify")
def notify_alert(alert_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles("ADMIN", "LEA", "I4C"))):
    alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"status": "scheduled", "alert_id": alert_id}
