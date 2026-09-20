from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.auth import get_current_user, require_roles
from backend.app.config import settings
from backend.app.database import get_db
from backend.app.models import Alert, ATMLocation, Complaint, Prediction, Transaction, User
from backend.app.schemas import DemoTriggerResponse
from backend.app.services.notifications import NotificationService
from backend.app.services.risk_service import explain_atm_risk

router = APIRouter(prefix="/api/v1/demo", tags=["Demo"])


@router.post("/trigger-high-risk-alert", response_model=DemoTriggerResponse)
def trigger_high_risk_alert(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if settings.APP_ENV != "development":
        raise HTTPException(status_code=403, detail="Demo endpoint disabled in production")

    atm = db.query(ATMLocation).filter(ATMLocation.atm_id == "ATM_DEMO_01").first()
    if not atm:
        atm = ATMLocation(
            atm_id="ATM_DEMO_01",
            lat=26.8467,
            lng=80.9462,
            state="UP",
            district="Lucknow",
            bank_name="Demo Bank",
            address="Demo Street",
            is_active=True,
        )
        db.add(atm)
    complaint = Complaint(
        complaint_id="C_DEMO_01",
        user_id=current_user.id,
        state="UP",
        district="Lucknow",
        crime_type="atm_card_fraud",
        description="Suspicious cards used in rapid withdrawals",
        amount_inr=25000,
        bank_name="Demo Bank",
        suspected_identifier="DEMO123",
        status="pending",
    )
    db.add(complaint)
    forecast = Prediction(
        atm_id="ATM_DEMO_01",
        risk_score=91.2,
        confidence=0.89,
        risk_level="CRITICAL",
        prediction_horizon_hours=24,
        model_version="mock-v1.0",
    )
    db.add(forecast)
    db.flush()
    alert = Alert(
        atm_id="ATM_DEMO_01",
        prediction_id=forecast.prediction_id,
        district="Lucknow",
        state="UP",
        severity="CRITICAL",
        triggered_by="auto",
        complaint_count=8,
        rolling_avg=7.2,
        cross_state=True,
        title="ATM fraud hotspot",
        message="Cross-state suspicious withdrawals detected.",
        status="NEW",
    )
    db.add(alert)
    db.flush()
    explanation = explain_atm_risk(db, "ATM_DEMO_01")
    service = NotificationService()
    service.send_alert_notifications(
        alert_id=alert.alert_id,
        alert_context={
            "alert_id": alert.alert_id,
            "atm_id": "ATM_DEMO_01",
            "district": "Lucknow",
            "state": "UP",
            "severity": "CRITICAL",
            "risk_score": 91.2,
            "detected_at": alert.detected_at.isoformat(),
            "signals": ["8 related complaints", "4 mule accounts", "unusual withdrawal spike", "cross-state activity"],
        },
    )
    db.commit()
    return DemoTriggerResponse(alert=alert, explanation=explanation)
