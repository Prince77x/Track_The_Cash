import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database import get_db
from backend.app.auth import require_authenticated
from backend.app.models import Prediction, ATMLocation, MuleAccount, utc_now
from backend.app.schemas import PredictResponse, ATMPredictionItem
from backend.app.ml.model import run_predictions

router = APIRouter(tags=["Predictions"])


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
