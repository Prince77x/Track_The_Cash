import asyncio
import datetime
import random
import uuid
from typing import List, Optional, Dict, Any, Set
from fastapi import APIRouter, Depends, Query, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, or_
from pydantic import BaseModel, Field

from backend.app.database import get_db
from backend.app.auth import require_authenticated
from backend.app.models import Complaint, ATMLocation, Prediction, Alert, utc_now

router = APIRouter(prefix="/complaints", tags=["Complaints"])

# -------------------------------------------------------------------------
# Real-Time WebSocket Connection Manager
# -------------------------------------------------------------------------
class ComplaintConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast(self, data: dict):
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send_json(data)
            except Exception:
                disconnected.add(connection)
        for dead_conn in disconnected:
            self.active_connections.discard(dead_conn)

ws_manager = ComplaintConnectionManager()


# -------------------------------------------------------------------------
# Pydantic Schemas
# -------------------------------------------------------------------------
class CreateComplaintRequest(BaseModel):
    complainant_name: Optional[str] = "Citizen User"
    contact_phone: Optional[str] = "+91 98765 43210"
    category: Optional[str] = "ATM Cash-Out Anomaly"
    crime_type: Optional[str] = None
    description: Optional[str] = "Unauthorized cash withdrawal activity detected"
    amount_inr: float = Field(..., gt=0)
    state: str
    district: str
    atm_id: Optional[str] = None
    transaction_id: Optional[str] = None
    priority: Optional[str] = None
    mule_account_id: Optional[str] = None

class UpdateComplaintStatusRequest(BaseModel):
    status: str
    resolution_summary: Optional[str] = None
    officer_name: Optional[str] = None

class UpdateComplaintPriorityRequest(BaseModel):
    priority: str

class AssignComplaintRequest(BaseModel):
    assigned_officer: str

class AddComplaintNoteRequest(BaseModel):
    author: str = "LEA Officer"
    note: str

# -------------------------------------------------------------------------
# Helpers
# -------------------------------------------------------------------------
def serialize_complaint(c: Complaint, db: Optional[Session] = None) -> Dict[str, Any]:
    atm_info = None
    if c.atm_id and db:
        atm = db.query(ATMLocation).filter_by(atm_id=c.atm_id).first()
        if atm:
            pred = db.query(Prediction).filter_by(atm_id=c.atm_id).first()
            atm_info = {
                "atm_id": atm.atm_id,
                "bank_name": atm.bank_name,
                "district": atm.district,
                "state": atm.state,
                "lat": atm.lat,
                "lng": atm.lng,
                "risk_score": round(pred.risk_score, 4) if pred else 0.45
            }

    timestamp_str = c.timestamp.isoformat() if c.timestamp else ""
    updated_str = c.updated_at.isoformat() if c.updated_at else timestamp_str
    resolved_str = c.resolved_at.isoformat() if c.resolved_at else None

    return {
        "complaint_id": c.complaint_id,
        "complainant_name": c.complainant_name or "Citizen User",
        "contact_phone": c.contact_phone or "+91 98765 43210",
        "category": c.category or "ATM Cash-Out Anomaly",
        "crime_type": c.crime_type or "atm_card_fraud",
        "description": c.description or "Suspicious cash withdrawal activity detected",
        "amount_inr": float(c.amount_inr),
        "state": c.state,
        "district": c.district,
        "atm_id": c.atm_id or "",
        "transaction_id": c.transaction_id or f"TXN-{(c.complaint_id[-6:] if len(c.complaint_id) >= 6 else '000001')}",
        "priority": c.priority or "HIGH",
        "status": (c.status or "NEW").upper(),
        "assigned_officer": c.assigned_officer or "Unassigned",
        "investigation_notes": c.investigation_notes or [],
        "resolution_summary": c.resolution_summary or "",
        "resolved_at": resolved_str,
        "timestamp": timestamp_str,
        "updated_at": updated_str,
        "atm_details": atm_info
    }


# -------------------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------------------
@router.post("", status_code=status.HTTP_201_CREATED)
async def create_complaint(
    payload: CreateComplaintRequest,
    db: Session = Depends(get_db)
):
    """Submits a citizen / user complaint and broadcasts real-time telemetry."""
    cid_suffix = f"{random.randint(10000, 99999)}"
    complaint_id = f"CMP-2026-{cid_suffix}"
    now = utc_now()

    # Determine priority if not specified
    priority = payload.priority
    if not priority:
        if payload.amount_inr >= 100000:
            priority = "CRITICAL"
        elif payload.amount_inr >= 50000:
            priority = "HIGH"
        elif payload.amount_inr >= 20000:
            priority = "MEDIUM"
        else:
            priority = "LOW"

    # Find matching ATM in district if not specified
    atm_id = payload.atm_id
    if not atm_id:
        district_atm = db.query(ATMLocation).filter_by(district=payload.district).first()
        if district_atm:
            atm_id = district_atm.atm_id
        else:
            any_atm = db.query(ATMLocation).first()
            atm_id = any_atm.atm_id if any_atm else f"ATM-DL-CONN-{random.randint(10, 99)}"

    tx_id = payload.transaction_id or f"TXN-2026-{cid_suffix}"
    category = payload.category or "Suspicious Transaction"
    crime_type = payload.crime_type or ("otp_fraud" if "otp" in category.lower() else "atm_card_fraud")

    initial_notes = [
        {
            "author": "Automated NatGrid Ingestion",
            "timestamp": now.isoformat(),
            "note": f"Incident reported via Citizen Fraud Portal for ₹{payload.amount_inr:,.2f} in {payload.district}, {payload.state}."
        }
    ]

    new_comp = Complaint(
        complaint_id=complaint_id,
        timestamp=now,
        state=payload.state,
        district=payload.district,
        crime_type=crime_type,
        amount_inr=payload.amount_inr,
        mule_account_id=payload.mule_account_id,
        status="NEW",
        complainant_name=payload.complainant_name or "Citizen User",
        contact_phone=payload.contact_phone or "+91 98765 43210",
        transaction_id=tx_id,
        atm_id=atm_id,
        category=category,
        description=payload.description or "Automated cybercrime complaint registered.",
        priority=priority,
        assigned_officer="Unassigned",
        investigation_notes=initial_notes,
        updated_at=now
    )

    db.add(new_comp)
    db.commit()
    db.refresh(new_comp)

    serialized = serialize_complaint(new_comp, db)

    # Broadcast event via WebSocket
    await ws_manager.broadcast({
        "event": "NEW_COMPLAINT",
        "data": serialized,
        "timestamp": now.isoformat()
    })

    return serialized


@router.get("")
def list_complaints(
    status: Optional[str] = Query(None, description="active, resolved, NEW, OPEN, etc."),
    priority: Optional[str] = Query(None, description="CRITICAL, HIGH, MEDIUM, LOW"),
    search: Optional[str] = Query(None, description="Search term"),
    state: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    user: dict = Depends(require_authenticated)
):
    """Lists complaints with filtering, search, and pagination for LEA surveillance."""
    query = db.query(Complaint)

    # Status filter logic
    if status:
        st_lower = status.lower()
        if st_lower == "active":
            query = query.filter(
                ~func.lower(Complaint.status).in_(["resolved", "closed"])
            )
        elif st_lower == "resolved":
            query = query.filter(
                func.lower(Complaint.status).in_(["resolved", "closed"])
            )
        else:
            query = query.filter(func.lower(Complaint.status) == st_lower)

    # Priority filter
    if priority and priority.upper() != "ALL":
        query = query.filter(func.upper(Complaint.priority) == priority.upper())

    # State filter
    if state:
        query = query.filter(Complaint.state == state)

    # Search filter
    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Complaint.complaint_id.ilike(search_fmt),
                Complaint.complainant_name.ilike(search_fmt),
                Complaint.transaction_id.ilike(search_fmt),
                Complaint.atm_id.ilike(search_fmt),
                Complaint.district.ilike(search_fmt),
                Complaint.state.ilike(search_fmt),
                Complaint.description.ilike(search_fmt),
                Complaint.category.ilike(search_fmt),
            )
        )

    total = query.count()
    items = query.order_by(desc(Complaint.timestamp)).offset(offset).limit(limit).all()

    return {
        "total": total,
        "items": [serialize_complaint(c, db) for c in items],
        "limit": limit,
        "offset": offset
    }


@router.get("/analytics/stats")
def get_complaint_stats(
    db: Session = Depends(get_db),
    user: dict = Depends(require_authenticated)
):
    """Returns high-level KPI and analytics aggregates for the LEA command center."""
    now = utc_now()
    today_start = datetime.datetime(now.year, now.month, now.day)

    # Counts
    active_count = db.query(func.count(Complaint.complaint_id)).filter(
        ~func.lower(Complaint.status).in_(["resolved", "closed"])
    ).scalar() or 0

    resolved_count = db.query(func.count(Complaint.complaint_id)).filter(
        func.lower(Complaint.status).in_(["resolved", "closed"])
    ).scalar() or 0

    today_new = db.query(func.count(Complaint.complaint_id)).filter(
        Complaint.timestamp >= today_start
    ).scalar() or 0

    # Suspect volume (24H)
    yesterday = now - datetime.timedelta(hours=24)
    vol_24h = db.query(func.sum(Complaint.amount_inr)).filter(
        Complaint.timestamp >= yesterday
    ).scalar() or 0.0

    # Alerts & ATMs
    total_alerts_today = db.query(func.count(Alert.alert_id)).filter(
        Alert.detected_at >= today_start
    ).scalar() or 0

    critical_alerts_count = db.query(func.count(Alert.alert_id)).filter(
        Alert.severity == "CRITICAL"
    ).scalar() or 0

    monitored_atms = db.query(func.count(ATMLocation.atm_id)).scalar() or 0

    # Breakdown by priority (active only)
    priority_rows = db.query(
        Complaint.priority,
        func.count(Complaint.complaint_id)
    ).filter(
        ~func.lower(Complaint.status).in_(["resolved", "closed"])
    ).group_by(Complaint.priority).all()

    by_priority = {r[0]: r[1] for r in priority_rows if r[0]}

    # Breakdown by category
    category_rows = db.query(
        Complaint.category,
        func.count(Complaint.complaint_id)
    ).group_by(Complaint.category).limit(8).all()

    by_category = {r[0] or "Other": r[1] for r in category_rows}

    # Resolution rate
    total_all = active_count + resolved_count
    resolution_rate = round((resolved_count / total_all * 100), 1) if total_all > 0 else 0.0

    # Format suspect volume in Crores (₹ Cr)
    vol_cr = round(vol_24h / 10000000, 2)
    vol_display = f"₹ {vol_cr:.2f} Cr" if vol_cr >= 1 else f"₹ {round(vol_24h / 100000, 2):.2f} Lakh"

    return {
        "active_complaints": active_count,
        "resolved_complaints": resolved_count,
        "today_new_complaints": today_new,
        "suspect_volume_24h_raw": float(vol_24h),
        "suspect_volume_24h_display": vol_display,
        "monitored_atms": monitored_atms,
        "critical_alerts_count": critical_alerts_count,
        "total_alerts_today": total_alerts_today,
        "resolution_rate": resolution_rate,
        "by_priority": by_priority,
        "by_category": by_category,
        "generated_at": now.isoformat()
    }


@router.get("/{complaint_id}")
def get_complaint_detail(
    complaint_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(require_authenticated)
):
    """Returns comprehensive dossier details for an individual complaint."""
    comp = db.query(Complaint).filter_by(complaint_id=complaint_id).first()
    if not comp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint '{complaint_id}' not found"
        )
    return serialize_complaint(comp, db)


@router.patch("/{complaint_id}/status")
async def update_complaint_status(
    complaint_id: str,
    payload: UpdateComplaintStatusRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(require_authenticated)
):
    """Updates complaint status, registers resolution audit note, and broadcasts update."""
    comp = db.query(Complaint).filter_by(complaint_id=complaint_id).first()
    if not comp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint '{complaint_id}' not found"
        )

    now = utc_now()
    new_status = payload.status.upper()
    comp.status = new_status
    comp.updated_at = now

    notes = list(comp.investigation_notes or [])
    officer = payload.officer_name or user.get("username", "LEA Officer")

    if new_status in ["RESOLVED", "CLOSED"]:
        comp.resolved_at = now
        summary = payload.resolution_summary or f"Complaint {new_status.lower()} by officer {officer}."
        comp.resolution_summary = summary
        notes.append({
            "author": officer,
            "timestamp": now.isoformat(),
            "note": f"STATUS CHANGED TO {new_status}: {summary}"
        })
    else:
        notes.append({
            "author": officer,
            "timestamp": now.isoformat(),
            "note": f"STATUS CHANGED TO {new_status}."
        })

    comp.investigation_notes = notes
    db.commit()
    db.refresh(comp)

    serialized = serialize_complaint(comp, db)
    await ws_manager.broadcast({
        "event": "COMPLAINT_UPDATED",
        "data": serialized,
        "timestamp": now.isoformat()
    })

    return serialized


@router.patch("/{complaint_id}/priority")
async def update_complaint_priority(
    complaint_id: str,
    payload: UpdateComplaintPriorityRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(require_authenticated)
):
    """Updates the priority level of a complaint."""
    comp = db.query(Complaint).filter_by(complaint_id=complaint_id).first()
    if not comp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint '{complaint_id}' not found"
        )

    now = utc_now()
    comp.priority = payload.priority.upper()
    comp.updated_at = now

    notes = list(comp.investigation_notes or [])
    officer = user.get("username", "LEA Officer")
    notes.append({
        "author": officer,
        "timestamp": now.isoformat(),
        "note": f"PRIORITY UPDATED TO {comp.priority}."
    })
    comp.investigation_notes = notes

    db.commit()
    db.refresh(comp)

    serialized = serialize_complaint(comp, db)
    await ws_manager.broadcast({
        "event": "COMPLAINT_UPDATED",
        "data": serialized,
        "timestamp": now.isoformat()
    })

    return serialized


@router.patch("/{complaint_id}/assign")
async def assign_complaint(
    complaint_id: str,
    payload: AssignComplaintRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(require_authenticated)
):
    """Assigns an officer to lead the complaint investigation."""
    comp = db.query(Complaint).filter_by(complaint_id=complaint_id).first()
    if not comp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint '{complaint_id}' not found"
        )

    now = utc_now()
    comp.assigned_officer = payload.assigned_officer
    comp.updated_at = now

    notes = list(comp.investigation_notes or [])
    notes.append({
        "author": user.get("username", "LEA Officer"),
        "timestamp": now.isoformat(),
        "note": f"ASSIGNED TO OFFICER: {payload.assigned_officer}."
    })
    comp.investigation_notes = notes

    db.commit()
    db.refresh(comp)

    serialized = serialize_complaint(comp, db)
    await ws_manager.broadcast({
        "event": "COMPLAINT_UPDATED",
        "data": serialized,
        "timestamp": now.isoformat()
    })

    return serialized


@router.post("/{complaint_id}/notes")
async def add_investigation_note(
    complaint_id: str,
    payload: AddComplaintNoteRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(require_authenticated)
):
    """Appends an investigative note / field observation to the complaint audit trail."""
    comp = db.query(Complaint).filter_by(complaint_id=complaint_id).first()
    if not comp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint '{complaint_id}' not found"
        )

    now = utc_now()
    comp.updated_at = now

    notes = list(comp.investigation_notes or [])
    notes.append({
        "author": payload.author or user.get("username", "LEA Officer"),
        "timestamp": now.isoformat(),
        "note": payload.note.strip()
    })
    comp.investigation_notes = notes

    db.commit()
    db.refresh(comp)

    serialized = serialize_complaint(comp, db)
    await ws_manager.broadcast({
        "event": "COMPLAINT_UPDATED",
        "data": serialized,
        "timestamp": now.isoformat()
    })

    return serialized


# -------------------------------------------------------------------------
# WebSocket Endpoint
# -------------------------------------------------------------------------
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Subscribes LEA dashboard to real-time complaint broadcasts & telemetry."""
    await ws_manager.connect(websocket)
    try:
        # Send initial handshake message
        await websocket.send_json({
            "event": "CONNECTED",
            "message": "Real-time LEA complaint telemetry feed active",
            "timestamp": utc_now().isoformat()
        })
        while True:
            # Keepalive listener
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)
