from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.auth import get_current_user, require_roles
from backend.app.database import get_db
from backend.app.models import Prediction, User
from backend.app.schemas import PredictionCreate, PredictionOut

router = APIRouter(prefix="/api/v1/predictions", tags=["Predictions"])


@router.post("", response_model=PredictionOut, status_code=status.HTTP_201_CREATED)
def create_prediction(payload: PredictionCreate, db: Session = Depends(get_db), current_user: User = Depends(require_roles("ADMIN", "LEA", "I4C"))):
    pred = Prediction(
        atm_id=payload.atm_id,
        risk_score=payload.risk_score,
        confidence=payload.confidence,
        risk_level=payload.risk_level,
        prediction_horizon_hours=payload.prediction_horizon_hours,
        model_version=payload.model_version,
    )
    db.add(pred)
    db.commit()
    db.refresh(pred)
    return pred


@router.get("", response_model=list[PredictionOut])
def list_predictions(
    state: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Prediction)
    return query.order_by(Prediction.predicted_at.desc()).offset((page - 1) * page_size).limit(page_size).all()


@router.get("/{prediction_id}", response_model=PredictionOut)
def get_prediction(prediction_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    pred = db.query(Prediction).filter(Prediction.prediction_id == prediction_id).first()
    if not pred:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return pred
