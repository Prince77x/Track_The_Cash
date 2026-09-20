from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.auth import get_current_user
from backend.app.database import get_db
from backend.app.models import ATMLocation, ATMRiskHistory, Alert, Prediction, User
from backend.app.schemas import ATMLocationOut, ATMRiskHistoryOut, RiskExplanation, RiskSummary
from backend.app.services.risk_service import explain_atm_risk

router = APIRouter(prefix="/api/v1/atms", tags=["ATM"])


@router.get("", response_model=list[ATMLocationOut])
def list_atms(
    state: Optional[str] = None,
    district: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(ATMLocation)
    if state:
        query = query.filter(ATMLocation.state == state)
    if district:
        query = query.filter(ATMLocation.district == district)
    return query.order_by(ATMLocation.atm_id).offset((page - 1) * page_size).limit(page_size).all()


@router.get("/{atm_id}", response_model=ATMLocationOut)
def get_atm(atm_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    atm = db.query(ATMLocation).filter(ATMLocation.atm_id == atm_id).first()
    if not atm:
        raise HTTPException(status_code=404, detail="ATM not found")
    return atm


@router.get("/{atm_id}/risk")
def get_atm_risk(atm_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    pred = db.query(Prediction).filter(Prediction.atm_id == atm_id).order_by(Prediction.predicted_at.desc()).first()
    if not pred:
        raise HTTPException(status_code=404, detail="Risk prediction not found")
    return {
        "atm_id": atm_id,
        "risk_score": pred.risk_score,
        "confidence": pred.confidence,
        "risk_level": pred.risk_level,
        "model_version": pred.model_version,
    }


@router.get("/{atm_id}/risk-history", response_model=list[ATMRiskHistoryOut])
def get_atm_risk_history(atm_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(ATMRiskHistory).filter(ATMRiskHistory.atm_id == atm_id).order_by(ATMRiskHistory.date.desc()).all()


@router.get("/{atm_id}/risk-explanation", response_model=RiskExplanation)
def get_atm_risk_explanation(atm_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return explain_atm_risk(db, atm_id)
