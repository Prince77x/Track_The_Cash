import datetime
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.auth import require_authenticated
from backend.app.models import Prediction, ATMLocation, MuleAccount, utc_now
from backend.app.ml.model import run_predictions

router = APIRouter(tags=["Heatmap"])


def get_severity(score: float) -> str:
    if score < 0.4:
        return "low"
    elif score <= 0.7:
        return "medium"
    else:
        return "high"


@router.get("/heatmap")
def get_heatmap_geojson(
    state: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user: dict = Depends(require_authenticated)
) -> Dict[str, Any]:
    pred_count = db.query(Prediction).count()
    if pred_count == 0:
        run_predictions(db)

    now = utc_now()
    cutoff_stale = now - datetime.timedelta(hours=24)

    cross_districts = set(
        d[0] for d in db.query(MuleAccount.registered_district).filter_by(is_cross_state=True).all()
    )

    query = db.query(Prediction, ATMLocation).join(ATMLocation, Prediction.atm_id == ATMLocation.atm_id)
    if state:
        query = query.filter(ATMLocation.state == state)

    results = query.all()

    features: List[Dict[str, Any]] = []
    for pred, atm in results:
        pred_time = pred.predicted_at
        if pred_time.tzinfo is None:
            pred_time = pred_time.replace(tzinfo=datetime.timezone.utc)
        is_stale = pred_time < cutoff_stale
        is_cross = atm.district in cross_districts
        severity = get_severity(pred.risk_score)

        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [atm.lng, atm.lat]
            },
            "properties": {
                "atm_id": atm.atm_id,
                "risk_score": round(pred.risk_score, 4),
                "severity": severity,
                "district": atm.district,
                "state": atm.state,
                "bank_name": atm.bank_name,
                "cross_state_flag": is_cross,
                "stale": is_stale
            }
        })

    return {
        "type": "FeatureCollection",
        "features": features
    }
