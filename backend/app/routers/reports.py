import csv
import io
import datetime
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database import get_db
from backend.app.auth import require_admin
from backend.app.models import Prediction, ATMLocation, MuleAccount, utc_now

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/export")
def export_predictions_csv(
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin)
):
    now = utc_now()
    cutoff_stale = now - datetime.timedelta(hours=24)

    cross_districts = set(
        d[0] for d in db.query(MuleAccount.registered_district).filter_by(is_cross_state=True).all()
    )

    results = (
        db.query(Prediction, ATMLocation)
        .join(ATMLocation, Prediction.atm_id == ATMLocation.atm_id)
        .order_by(desc(Prediction.risk_score))
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "atm_id",
        "lat",
        "lng",
        "district",
        "state",
        "bank_name",
        "risk_score",
        "predicted_at",
        "cross_state_flag",
        "stale"
    ])

    for pred, atm in results:
        pred_time = pred.predicted_at
        if pred_time.tzinfo is None:
            pred_time = pred_time.replace(tzinfo=datetime.timezone.utc)
        is_stale = pred_time < cutoff_stale
        is_cross = atm.district in cross_districts

        writer.writerow([
            atm.atm_id,
            atm.lat,
            atm.lng,
            atm.district,
            atm.state,
            atm.bank_name or "",
            round(pred.risk_score, 4),
            pred_time.isoformat(),
            is_cross,
            is_stale
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={
            "Content-Disposition": 'attachment; filename="predictions.csv"'
        }
    )
