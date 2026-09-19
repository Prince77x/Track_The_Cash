import csv
import io
import datetime
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database import get_db
from backend.app.auth import require_authenticated
from backend.app.models import Prediction, ATMLocation, MuleAccount, Complaint, Alert, utc_now

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/export")
def export_predictions_csv(
    db: Session = Depends(get_db),
    user: dict = Depends(require_authenticated)
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


@router.get("/dossier")
def export_intelligence_dossier(
    db: Session = Depends(get_db),
    user: dict = Depends(require_authenticated)
):
    """Generates a comprehensive Law Enforcement Intelligence Dossier document."""
    now = utc_now()
    top_threats = (
        db.query(Prediction, ATMLocation)
        .join(ATMLocation, Prediction.atm_id == ATMLocation.atm_id)
        .order_by(desc(Prediction.risk_score))
        .limit(10)
        .all()
    )
    recent_complaints = db.query(Complaint).order_by(desc(Complaint.timestamp)).limit(10).all()

    html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>LEA Financial Intelligence Dossier</title>
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #070b14; color: #f1f5f9; padding: 2rem; }}
  h1, h2, h3 {{ color: #38bdf8; margin-bottom: 0.2rem; }}
  .badge {{ background: #0284c7; color: #fff; padding: 3px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; }}
  .badge-red {{ background: #ef4444; }}
  .card {{ background: #0d1424; border: 1px solid #1e293b; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 0.5rem; font-size: 0.85rem; }}
  th, td {{ padding: 8px 12px; text-align: left; border-bottom: 1px solid #1e293b; }}
  th {{ color: #94a3b8; text-transform: uppercase; font-size: 0.75rem; }}
  .header {{ border-bottom: 2px solid #0284c7; padding-bottom: 1rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; }}
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>TRACKTHECASH &bull; LAW ENFORCEMENT INTELLIGENCE DOSSIER</h1>
      <p style="color: #94a3b8; margin: 0;">Surveillance Sector: ALL-INDIA FINANCIAL HUBS &bull; Generated: {now.strftime('%d %b %Y %H:%M:%S UTC')} &bull; Officer: {user.get('username')}</p>
    </div>
    <div>
      <span class="badge">NATGRID-SYS-001 &bull; RESTRICTED</span>
    </div>
  </div>

  <div class="card">
    <h2>TOP HIGH-RISK ATM CASH-OUT HOTSPOTS (NEXT 24H)</h2>
    <table>
      <thead>
        <tr><th>ATM ID</th><th>Bank</th><th>District, State</th><th>Risk Probability</th><th>Status</th></tr>
      </thead>
      <tbody>
"""
    for pred, atm in top_threats:
        html += f"""
        <tr>
          <td style="color:#38bdf8; font-weight:700;">{atm.atm_id}</td>
          <td>{atm.bank_name}</td>
          <td>{atm.district}, {atm.state}</td>
          <td><span class="badge {'badge-red' if pred.risk_score > 0.7 else ''}">{(pred.risk_score * 100):.1f}%</span></td>
          <td>MONITORED</td>
        </tr>
"""
    html += """
      </tbody>
    </table>
  </div>

  <div class="card">
    <h2>RECENT ACTIVE COMPLAINT INTELLIGENCE</h2>
    <table>
      <thead>
        <tr><th>Complaint ID</th><th>Complainant</th><th>Category</th><th>Amount</th><th>District</th><th>Priority</th><th>Status</th></tr>
      </thead>
      <tbody>
"""
    for c in recent_complaints:
        html += f"""
        <tr>
          <td style="color:#38bdf8; font-weight:700;">{c.complaint_id}</td>
          <td>{c.complainant_name or 'Citizen'}</td>
          <td>{c.category or 'Fraud'}</td>
          <td>₹ {c.amount_inr:,.2f}</td>
          <td>{c.district}, {c.state}</td>
          <td><span class="badge {'badge-red' if c.priority == 'CRITICAL' else ''}">{c.priority}</span></td>
          <td>{(c.status or 'NEW').upper()}</td>
        </tr>
"""
    html += """
      </tbody>
    </table>
  </div>
  <script>window.print();</script>
</body>
</html>
"""
    return Response(
        content=html,
        media_type="text/html",
        headers={
            "Content-Disposition": f'inline; filename="LEA_Dossier_{now.strftime("%Y%m%d_%H%M")}.html"'
        }
    )
