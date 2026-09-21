import datetime
from typing import Optional, List
import pandas as pd
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database import get_db
from backend.app.auth import require_authenticated
from backend.app.models import Prediction, ATMLocation, MuleAccount, utc_now
from backend.app.schemas import PredictResponse, ATMPredictionItem, ATMScoreRequest, ATMScoreResponse, ATMScoreItem
from backend.app.ml.model import ATMDefenseModel, run_predictions

router = APIRouter(tags=["Predictions"])


def _risk_level_from_score(score: float) -> str:
    if score >= 0.75:
        return "HIGH"
    if score >= 0.5:
        return "MEDIUM"
    return "LOW"


@router.get("/predict", response_model=PredictResponse)
def get_predictions(
    state: Optional[str] = Query(None, description="Optional state filter"),
    limit: int = Query(50, ge=1, le=5000, description="Max predictions to return"),
    refresh: bool = Query(False, description="Force recalculation"),
    db: Session = Depends(get_db),
    user: dict = Depends(require_authenticated)
):
    # Check if predictions exist, or if refresh requested
    pred_count = db.query(Prediction).count()
    if pred_count == 0 or refresh:
        run_predictions(db)

    now = utc_now()
    cutoff_stale = now - datetime.timedelta(hours=24)

    # Pre-fetch cross-state districts
    cross_districts = set(
        d[0] for d in db.query(MuleAccount.registered_district).filter_by(is_cross_state=True).all()
    )

    query = (
        db.query(Prediction, ATMLocation)
        .join(ATMLocation, Prediction.atm_id == ATMLocation.atm_id)
        .order_by(desc(Prediction.risk_score))
    )

    if state:
        query = query.filter(ATMLocation.state == state)

    results = query.limit(limit).all()

    items: List[ATMPredictionItem] = []
    for pred, atm in results:
        pred_time = pred.predicted_at
        if pred_time.tzinfo is None:
            pred_time = pred_time.replace(tzinfo=datetime.timezone.utc)
        is_stale = pred_time < cutoff_stale
        is_cross = atm.district in cross_districts

        items.append(ATMPredictionItem(
            atm_id=atm.atm_id,
            lat=atm.lat,
            lng=atm.lng,
            risk_score=round(pred.risk_score, 4),
            district=atm.district,
            state=atm.state,
            bank_name=atm.bank_name,
            cross_state_flag=is_cross,
            stale=is_stale
        ))

    return PredictResponse(
        predictions=items,
        generated_at=now.isoformat()
    )


@router.post("/predict/score", response_model=ATMScoreResponse)
def score_atm_risk(
    payload: ATMScoreRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(require_authenticated),
):
    """Score nearby ATMs using complaint and mule-account risk context.

    This mirrors the project's real ML contract: the model predicts ATM risk from
    complaint velocity, district fraud density, mule proximity, district ATM count,
    and cross-state linkage, instead of receiving raw ATM details as primary inputs.
    """
    query = db.query(ATMLocation)
    if payload.state:
        query = query.filter(ATMLocation.state == payload.state)
    if payload.district:
        query = query.filter(ATMLocation.district == payload.district)

    atms = query.order_by(ATMLocation.atm_id).limit(500).all()
    if not atms:
        raise HTTPException(status_code=404, detail="No ATMs found for the selected location filters")

    model = ATMDefenseModel()
    model.load()
    if model.model is None:
        base_scores = []
        for _ in atms:
            score = 0.35 * min(payload.district_fraud_density / 10.0, 1.0)
            score += 0.45 * min(payload.complaint_velocity_6h / 20.0, 1.0)
            score += 0.15 * (1.0 if payload.cross_state_flag else 0.0)
            score += 0.05 * min(1.0 / max(payload.mule_proximity_km, 1.0), 1.0)
            base_scores.append(min(max(score, 0.05), 0.99))
    else:
        df = pd.DataFrame([
            {
                "district_fraud_density": payload.district_fraud_density,
                "complaint_velocity_6h": payload.complaint_velocity_6h,
                "mule_proximity_km": payload.mule_proximity_km,
                "atm_count_in_district": float(payload.atm_count_in_district),
                "cross_state_flag": 1.0 if payload.cross_state_flag else 0.0,
            }
            for _ in atms
        ])
        base_scores = model.predict_proba(df).tolist()

    scored = []
    for atm, score in zip(atms, base_scores):
        risk = float(score)
        scored.append({
            "atm_id": atm.atm_id,
            "state": atm.state,
            "district": atm.district,
            "bank_name": atm.bank_name,
            "risk_score": round(risk, 4),
            "risk_level": _risk_level_from_score(risk),
        })

    scored.sort(key=lambda x: x["risk_score"], reverse=True)
    now = utc_now()
    return ATMScoreResponse(
        predictions=[ATMScoreItem(**item) for item in scored[:payload.limit]],
        generated_at=now.isoformat()
    )
