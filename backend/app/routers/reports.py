import csv
import io
import json
import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database import get_db
from backend.app.auth import require_authenticated, record_audit
from backend.app.models import (
    Prediction, ATMLocation, MuleAccount, Complaint, Alert,
    LEAOfficer, Case, utc_now
)

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/export")
def export_reports(
    report_type: str = Query("predictions", description="predictions, complaints, alerts, mules, officers, cases"),
    format: str = Query("csv", description="csv, json"),
    state: Optional[str] = Query(None),
    limit: int = Query(500, ge=1, le=5000),
    db: Session = Depends(get_db),
    user: dict = Depends(require_authenticated)
):
    now = utc_now()
    cutoff_stale = now - datetime.timedelta(hours=24)

    # 1. Predictions Report
    if report_type == "predictions":
        cross_districts = set(
            d[0] for d in db.query(MuleAccount.registered_district).filter_by(is_cross_state=True).all()
        )
        query = db.query(Prediction, ATMLocation).join(ATMLocation, Prediction.atm_id == ATMLocation.atm_id).order_by(desc(Prediction.risk_score))
        if state:
            query = query.filter(ATMLocation.state == state)
        results = query.limit(limit).all()

        if format == "json":
            data = [
                {
                    "atm_id": atm.atm_id,
                    "bank_name": atm.bank_name,
                    "district": atm.district,
                    "state": atm.state,
                    "risk_score": round(pred.risk_score, 4),
                    "cross_state": atm.district in cross_districts,
                    "predicted_at": pred.predicted_at.isoformat() if pred.predicted_at else ""
                }
                for pred, atm in results
            ]
            return Response(
                content=json.dumps(data, indent=2),
                media_type="application/json",
                headers={"Content-Disposition": f'attachment; filename="atm_risk_intelligence_{now.strftime("%Y%m%d")}.json"'}
            )

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["atm_id", "lat", "lng", "district", "state", "bank_name", "risk_score", "predicted_at", "cross_state_flag", "stale"])
        for pred, atm in results:
            pred_time = pred.predicted_at
            if pred_time and pred_time.tzinfo is None:
                pred_time = pred_time.replace(tzinfo=datetime.timezone.utc)
            is_stale = pred_time < cutoff_stale if pred_time else False
            is_cross = atm.district in cross_districts
            writer.writerow([
                atm.atm_id, atm.lat, atm.lng, atm.district, atm.state,
                atm.bank_name or "", round(pred.risk_score, 4),
                pred_time.isoformat() if pred_time else "", is_cross, is_stale
            ])
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="atm_risk_intelligence_{now.strftime("%Y%m%d")}.csv"'}
        )

    # 2. Complaints Report
    elif report_type == "complaints":
        query = db.query(Complaint).order_by(desc(Complaint.timestamp))
        if state:
            query = query.filter(Complaint.state == state)
        results = query.limit(limit).all()

        if format == "json":
            data = [
                {
                    "complaint_id": c.complaint_id,
                    "timestamp": c.timestamp.isoformat() if c.timestamp else "",
                    "state": c.state,
                    "district": c.district,
                    "amount_inr": c.amount_inr,
                    "priority": c.priority,
                    "status": c.status,
                    "atm_id": c.atm_id,
                    "mule_id": c.mule_account_id
                }
                for c in results
            ]
            return Response(
                content=json.dumps(data, indent=2),
                media_type="application/json",
                headers={"Content-Disposition": f'attachment; filename="complaint_intelligence_{now.strftime("%Y%m%d")}.json"'}
            )

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["complaint_id", "timestamp", "state", "district", "crime_type", "amount_inr", "priority", "status", "atm_id", "mule_account_id"])
        for c in results:
            writer.writerow([
                c.complaint_id, c.timestamp.isoformat() if c.timestamp else "",
                c.state, c.district, c.crime_type, c.amount_inr,
                c.priority, c.status, c.atm_id or "", c.mule_account_id or ""
            ])
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="complaint_intelligence_{now.strftime("%Y%m%d")}.csv"'}
        )

    # 3. Alerts Report
    elif report_type == "alerts":
        query = db.query(Alert).order_by(desc(Alert.detected_at))
        if state:
            query = query.filter(Alert.state == state)
        results = query.limit(limit).all()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["alert_id", "detected_at", "severity", "district", "state", "triggered_by", "complaint_count", "cross_state", "status", "assigned_officer", "message"])
        for a in results:
            writer.writerow([
                a.alert_id, a.detected_at.isoformat() if a.detected_at else "",
                a.severity, a.district, a.state, a.triggered_by,
                a.complaint_count, a.cross_state, a.status or "ACTIVE",
                a.assigned_officer or "", a.message or ""
            ])
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="alert_intelligence_{now.strftime("%Y%m%d")}.csv"'}
        )

    # 4. Mule Accounts Report
    elif report_type == "mules":
        query = db.query(MuleAccount).order_by(MuleAccount.mule_id.asc())
        if state:
            query = query.filter(MuleAccount.registered_state == state)
        results = query.limit(limit).all()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["mule_id", "registered_state", "registered_district", "account_bank", "is_cross_state", "linked_atm_count"])
        for m in results:
            writer.writerow([
                m.mule_id, m.registered_state, m.registered_district,
                m.account_bank, m.is_cross_state, len(m.linked_atm_ids or [])
            ])
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="mule_intelligence_{now.strftime("%Y%m%d")}.csv"'}
        )

    # 5. Cases Report
    elif report_type == "cases":
        query = db.query(Case).order_by(desc(Case.updated_at))
        if state:
            query = query.filter(Case.state == state)
        results = query.limit(limit).all()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["case_id", "title", "state", "district", "amount_inr", "priority", "status", "assigned_officer", "created_at", "resolved_at"])
        for c in results:
            writer.writerow([
                c.case_id, c.title, c.state, c.district, c.amount_inr,
                c.priority, c.status, c.assigned_officer_name or "",
                c.created_at.isoformat() if c.created_at else "",
                c.resolved_at.isoformat() if c.resolved_at else ""
            ])
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="cases_investigation_{now.strftime("%Y%m%d")}.csv"'}
        )

    # Default fallback to predictions
    return export_predictions_csv(db=db, user=user)


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
