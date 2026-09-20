from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.auth import get_current_user, require_roles
from backend.app.database import get_db
from backend.app.models import Alert, User
from backend.app.schemas import NotificationTestRequest, NotificationTestResponse
from backend.app.services.notifications import NotificationService

router = APIRouter(prefix="/api/v1/notifications", tags=["Notifications"])


@router.post("/test-email", response_model=NotificationTestResponse)
def test_email(payload: NotificationTestRequest, db: Session = Depends(get_db), current_user: User = Depends(require_roles("ADMIN", "LEA", "I4C"))):
    result = NotificationService().email_provider.send(
        to=payload.recipient,
        subject="Track the Cash test email",
        body="Track the Cash notification test",
    )
    return NotificationTestResponse(success=result.get("success", False), channel="EMAIL", recipient=payload.recipient, status=result.get("status", "FAILED"), provider_message_id=result.get("provider_message_id"), error=result.get("error"))


@router.post("/test-whatsapp", response_model=NotificationTestResponse)
def test_whatsapp(payload: NotificationTestRequest, db: Session = Depends(get_db), current_user: User = Depends(require_roles("ADMIN", "LEA", "I4C"))):
    result = NotificationService().whatsapp_provider.send(to=payload.recipient, body="Track the Cash notification test")
    return NotificationTestResponse(success=result.get("success", False), channel="WHATSAPP", recipient=payload.recipient, status=result.get("status", "FAILED"), provider_message_id=result.get("provider_message_id"), error=result.get("error"))


@router.post("/alerts/{alert_id}/notify")
def notify_alert(alert_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles("ADMIN", "LEA", "I4C"))):
    alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    service = NotificationService()
    result = service.send_alert_notifications(
        alert_id=alert_id,
        alert_context={
            "alert_id": alert.alert_id,
            "atm_id": alert.atm_id,
            "district": alert.district,
            "state": alert.state,
            "severity": alert.severity,
            "risk_score": alert.rolling_avg,
            "detected_at": alert.detected_at.isoformat(),
            "signals": ["complaint spike", "cross-state activity"],
        },
        recipients=["ops@trackthecash.gov.in"],
    )
    return {"alert_id": alert_id, "delivery_status": result}
