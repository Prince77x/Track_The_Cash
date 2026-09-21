import os
import uuid
import datetime
from typing import Optional, List, Dict, Any
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from backend.app.database import get_db
from backend.app.models import (
    CitizenUser,
    Complaint,
    EvidenceFile,
    ComplaintStatusHistory,
    ComplaintUpdate,
    CitizenNotification,
    SuspiciousActivityReport,
    SafetyGuide,
    utc_now
)
from backend.app.auth import require_citizen, get_current_user, hash_password, verify_password
from backend.app.storage import save_evidence_file, get_evidence_path

router = APIRouter(prefix="/citizen", tags=["Citizen Portal"])


def get_citizen_identifier(current_user: Dict[str, Any], db: Session) -> str:
    """Helper to resolve citizen public_user_id or username."""
    pub_id = current_user.get("public_user_id")
    if pub_id:
        return pub_id
    
    # Try finding in database
    username = current_user.get("username")
    user = db.query(CitizenUser).filter(CitizenUser.username == username).first()
    if user:
        return user.public_user_id
    return username


@router.get("/dashboard")
def get_citizen_dashboard(
    current_user: Dict[str, Any] = Depends(require_citizen),
    db: Session = Depends(get_db)
):
    user_ident = get_citizen_identifier(current_user, db)
    
    # Complaints query for this citizen
    complaints = db.query(Complaint).filter(
        (Complaint.user_id == user_ident) | (Complaint.complainant_name == current_user.get("full_name"))
    ).all()
    
    total_complaints = len([c for c in complaints if not c.is_draft])
    drafts_count = len([c for c in complaints if c.is_draft])
    active_cases = len([c for c in complaints if not c.is_draft and c.status not in ["RESOLVED", "CLOSED", "REJECTED"]])
    resolved_cases = len([c for c in complaints if c.status == "RESOLVED"])
    
    # Total loss & recovered amount
    total_loss = sum(c.amount_inr or 0.0 for c in complaints if not c.is_draft)
    total_recovered = 0.0
    total_frozen = 0.0
    
    for c in complaints:
        if c.financial_details and isinstance(c.financial_details, dict):
            total_recovered += float(c.financial_details.get("recovered_amount", 0.0) or 0.0)
            total_frozen += float(c.financial_details.get("frozen_amount", 0.0) or 0.0)

    # Action required count (e.g. EVIDENCE_REQUESTED)
    pending_actions = len([c for c in complaints if c.status in ["EVIDENCE_REQUESTED", "ACTION_REQUIRED"]])

    # Recent complaints
    recent_complaints = db.query(Complaint).filter(
        (Complaint.user_id == user_ident) | (Complaint.complainant_name == current_user.get("full_name"))
    ).order_by(desc(Complaint.timestamp)).limit(5).all()

    # Recent unread notifications
    notifications = db.query(CitizenNotification).filter(
        CitizenNotification.user_id == user_ident
    ).order_by(desc(CitizenNotification.created_at)).limit(6).all()

    # Featured guides
    guides = db.query(SafetyGuide).limit(4).all()

    return {
        "metrics": {
            "total_complaints": total_complaints,
            "active_cases": active_cases,
            "resolved_cases": resolved_cases,
            "drafts_count": drafts_count,
            "pending_actions": pending_actions,
            "total_loss_inr": total_loss,
            "total_recovered_inr": total_recovered,
            "total_frozen_inr": total_frozen
        },
        "recent_complaints": [
            {
                "complaint_id": c.complaint_id,
                "public_complaint_id": c.public_complaint_id or c.complaint_id,
                "crime_type": c.crime_type,
                "category": c.category,
                "amount_inr": c.amount_inr,
                "status": c.status,
                "is_draft": c.is_draft,
                "timestamp": c.timestamp.isoformat() if c.timestamp else None,
                "assigned_officer": c.assigned_officer,
                "priority": c.priority
            }
            for c in recent_complaints
        ],
        "notifications": [
            {
                "id": n.id,
                "type": n.type,
                "title": n.title,
                "message": n.message,
                "is_read": n.is_read,
                "related_complaint_id": n.related_complaint_id,
                "created_at": n.created_at.isoformat() if n.created_at else None
            }
            for n in notifications
        ],
        "featured_guides": [
            {
                "id": g.id,
                "title": g.title,
                "category": g.category,
                "summary": g.summary,
                "icon_name": g.icon_name
            }
            for g in guides
        ]
    }


@router.get("/complaints")
def list_citizen_complaints(
    status_filter: Optional[str] = Query(None),
    crime_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(require_citizen),
    db: Session = Depends(get_db)
):
    user_ident = get_citizen_identifier(current_user, db)
    query = db.query(Complaint).filter(
        (Complaint.user_id == user_ident) | (Complaint.complainant_name == current_user.get("full_name"))
    )

    if status_filter and status_filter != "ALL":
        if status_filter == "DRAFTS":
            query = query.filter(Complaint.is_draft == True)
        else:
            query = query.filter(Complaint.status == status_filter, Complaint.is_draft == False)
    
    if crime_type and crime_type != "ALL":
        query = query.filter(Complaint.crime_type == crime_type)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (Complaint.public_complaint_id.ilike(s)) |
            (Complaint.complaint_id.ilike(s)) |
            (Complaint.crime_type.ilike(s)) |
            (Complaint.category.ilike(s)) |
            (Complaint.description.ilike(s)) |
            (Complaint.transaction_id.ilike(s))
        )

    complaints = query.order_by(desc(Complaint.timestamp)).all()

    return [
        {
            "complaint_id": c.complaint_id,
            "public_complaint_id": c.public_complaint_id or c.complaint_id,
            "crime_type": c.crime_type,
            "category": c.category,
            "amount_inr": c.amount_inr,
            "status": c.status,
            "is_draft": c.is_draft,
            "incident_date": c.incident_date.isoformat() if c.incident_date else None,
            "incident_time": c.incident_time,
            "state": c.state,
            "district": c.district,
            "city": c.city,
            "complainant_name": c.complainant_name,
            "contact_phone": c.contact_phone,
            "transaction_id": c.transaction_id,
            "description": c.description,
            "priority": c.priority,
            "assigned_officer": c.assigned_officer,
            "timestamp": c.timestamp.isoformat() if c.timestamp else None,
            "financial_details": c.financial_details or {},
            "suspect_details": c.suspect_details or {},
            "public_updates_count": len(c.public_updates or [])
        }
        for c in complaints
    ]


@router.post("/complaints")
def submit_complaint(
    payload: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(require_citizen),
    db: Session = Depends(get_db)
):
    user_ident = get_citizen_identifier(current_user, db)
    is_draft = payload.get("is_draft", False)
    
    # Generate Unique IDs
    raw_uuid = uuid.uuid4().hex[:6].upper()
    complaint_id = f"CMP-{datetime.date.today().year}-{payload.get('state', 'IND')[:3].upper()}-{raw_uuid}"
    public_id = f"TTC-{datetime.date.today().year}-{raw_uuid}" if not is_draft else None

    # Parse Incident Date
    inc_date_val = payload.get("incident_date")
    incident_date = None
    if inc_date_val:
        try:
            incident_date = datetime.date.fromisoformat(inc_date_val)
        except Exception:
            incident_date = datetime.date.today()

    # Determine initial status & priority
    amount = float(payload.get("amount_inr", 0.0) or 0.0)
    priority = "HIGH" if amount >= 100000 else ("MEDIUM" if amount >= 25000 else "LOW")
    if payload.get("priority"):
        priority = payload.get("priority")

    status_val = "DRAFT" if is_draft else "NEW"

    initial_public_update = []
    if not is_draft:
        initial_public_update = [
            {
                "timestamp": utc_now().isoformat(),
                "message": f"Complaint registered under Public Reference ID {public_id}. Acknowledged by I4C Automated Dispatch.",
                "author": "TrackTheCash System"
            }
        ]

    new_complaint = Complaint(
        complaint_id=complaint_id,
        public_complaint_id=public_id,
        user_id=user_ident,
        timestamp=utc_now(),
        state=payload.get("state", "Maharashtra"),
        district=payload.get("district", "Mumbai City"),
        city=payload.get("city", payload.get("district", "Mumbai")),
        crime_type=payload.get("crime_type", "Cyber Financial Fraud"),
        amount_inr=amount,
        status=status_val,
        is_draft=is_draft,
        source="citizen",
        incident_date=incident_date,
        incident_time=payload.get("incident_time", "12:00"),
        complainant_name=payload.get("complainant_name") or current_user.get("full_name", "Citizen Complainant"),
        contact_phone=payload.get("contact_phone", "+91 98765 43210"),
        transaction_id=payload.get("transaction_id", ""),
        atm_id=payload.get("atm_id", None),
        category=payload.get("category", "Online Fraud"),
        description=payload.get("description", "Incident reported via Citizen Portal"),
        priority=priority,
        financial_details=payload.get("financial_details", {}),
        suspect_details=payload.get("suspect_details", {}),
        public_updates=initial_public_update,
        feedback={}
    )

    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)

    # Record status history
    status_hist = ComplaintStatusHistory(
        complaint_id=new_complaint.complaint_id,
        old_status="NONE",
        new_status=new_complaint.status,
        changed_by="Citizen (Self)",
        changed_by_role="citizen",
        public_message=f"Complaint lodged by citizen with priority {new_complaint.priority}." if not is_draft else "Draft saved.",
        changed_at=utc_now()
    )
    db.add(status_hist)

    # Generate Notification for Citizen
    if not is_draft:
        notif = CitizenNotification(
            user_id=user_ident,
            type="COMPLAINT_REGISTERED",
            title=f"Complaint Lodged: {public_id}",
            message=f"Your complaint regarding ₹{amount:,.2f} {new_complaint.crime_type} has been registered successfully.",
            related_complaint_id=new_complaint.complaint_id,
            is_read=False,
            created_at=utc_now()
        )
        db.add(notif)

    db.commit()

    return {
        "success": True,
        "complaint_id": new_complaint.complaint_id,
        "public_complaint_id": new_complaint.public_complaint_id,
        "status": new_complaint.status,
        "is_draft": new_complaint.is_draft,
        "message": "Complaint successfully lodged!" if not is_draft else "Draft saved successfully."
    }


@router.get("/complaints/{complaint_id}")
def get_complaint_dossier(
    complaint_id: str,
    current_user: Dict[str, Any] = Depends(require_citizen),
    db: Session = Depends(get_db)
):
    user_ident = get_citizen_identifier(current_user, db)
    
    complaint = db.query(Complaint).filter(
        (Complaint.complaint_id == complaint_id) | (Complaint.public_complaint_id == complaint_id)
    ).first()

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Authorization Check: Citizen can only view their own complaint unless admin
    if current_user.get("role") not in ["admin"] and complaint.user_id != user_ident and complaint.complainant_name != current_user.get("full_name"):
        raise HTTPException(status_code=403, detail="Access denied to this complaint dossier.")

    # Fetch status history
    history = db.query(ComplaintStatusHistory).filter(
        ComplaintStatusHistory.complaint_id == complaint.complaint_id
    ).order_by(ComplaintStatusHistory.changed_at.asc()).all()

    # Fetch evidence files
    evidence_files = db.query(EvidenceFile).filter(
        EvidenceFile.complaint_id == complaint.complaint_id
    ).order_by(desc(EvidenceFile.uploaded_at)).all()

    # Fetch communication updates
    updates = db.query(ComplaintUpdate).filter(
        ComplaintUpdate.complaint_id == complaint.complaint_id
    ).order_by(ComplaintUpdate.created_at.asc()).all()

    return {
        "complaint_id": complaint.complaint_id,
        "public_complaint_id": complaint.public_complaint_id or complaint.complaint_id,
        "user_id": complaint.user_id,
        "timestamp": complaint.timestamp.isoformat() if complaint.timestamp else None,
        "state": complaint.state,
        "district": complaint.district,
        "city": complaint.city,
        "crime_type": complaint.crime_type,
        "category": complaint.category,
        "amount_inr": complaint.amount_inr,
        "status": complaint.status,
        "is_draft": complaint.is_draft,
        "priority": complaint.priority,
        "incident_date": complaint.incident_date.isoformat() if complaint.incident_date else None,
        "incident_time": complaint.incident_time,
        "complainant_name": complaint.complainant_name,
        "contact_phone": complaint.contact_phone,
        "transaction_id": complaint.transaction_id,
        "description": complaint.description,
        "assigned_officer": complaint.assigned_officer or "Cyber Cell Assigned Officer (In Progress)",
        "financial_details": complaint.financial_details or {},
        "suspect_details": complaint.suspect_details or {},
        "public_updates": complaint.public_updates or [],
        "feedback": complaint.feedback or {},
        "timeline": [
            {
                "id": h.id,
                "old_status": h.old_status,
                "new_status": h.new_status,
                "changed_by": h.changed_by,
                "changed_by_role": h.changed_by_role,
                "public_message": h.public_message,
                "changed_at": h.changed_at.isoformat() if h.changed_at else None
            }
            for h in history
        ],
        "evidence_files": [
            {
                "id": ef.id,
                "file_name": ef.file_name,
                "original_filename": ef.original_filename,
                "file_type": ef.file_type,
                "file_size": ef.file_size,
                "uploaded_by": ef.uploaded_by,
                "uploaded_at": ef.uploaded_at.isoformat() if ef.uploaded_at else None
            }
            for ef in evidence_files
        ],
        "updates": [
            {
                "id": u.id,
                "sender_id": u.sender_id,
                "sender_role": u.sender_role,
                "sender_name": u.sender_name,
                "type": u.type,
                "message": u.message,
                "attachments": u.attachments or [],
                "status": u.status,
                "created_at": u.created_at.isoformat() if u.created_at else None
            }
            for u in updates
        ]
    }


@router.put("/complaints/{complaint_id}/draft")
def update_or_publish_draft(
    complaint_id: str,
    payload: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(require_citizen),
    db: Session = Depends(get_db)
):
    user_ident = get_citizen_identifier(current_user, db)
    complaint = db.query(Complaint).filter(Complaint.complaint_id == complaint_id).first()

    if not complaint:
        raise HTTPException(status_code=404, detail="Draft not found")
    if complaint.user_id != user_ident:
        raise HTTPException(status_code=403, detail="Unauthorized to edit this draft")

    is_publish = payload.get("publish", False)

    for field in ["state", "district", "city", "crime_type", "category", "amount_inr", "incident_time", "contact_phone", "transaction_id", "description", "financial_details", "suspect_details"]:
        if field in payload:
            setattr(complaint, field, payload[field])

    if "incident_date" in payload and payload["incident_date"]:
        try:
            complaint.incident_date = datetime.date.fromisoformat(payload["incident_date"])
        except Exception:
            pass

    if is_publish:
        complaint.is_draft = False
        complaint.status = "NEW"
        complaint.public_complaint_id = f"TTC-{datetime.date.today().year}-{uuid.uuid4().hex[:6].upper()}"
        complaint.timestamp = utc_now()
        complaint.public_updates = [
            {
                "timestamp": utc_now().isoformat(),
                "message": f"Draft published as official complaint {complaint.public_complaint_id}.",
                "author": "Citizen"
            }
        ]

        # Add history
        hist = ComplaintStatusHistory(
            complaint_id=complaint.complaint_id,
            old_status="DRAFT",
            new_status="NEW",
            changed_by="Citizen (Self)",
            changed_by_role="citizen",
            public_message=f"Draft published under reference {complaint.public_complaint_id}.",
            changed_at=utc_now()
        )
        db.add(hist)

        # Notify
        notif = CitizenNotification(
            user_id=user_ident,
            type="COMPLAINT_REGISTERED",
            title=f"Complaint Lodged: {complaint.public_complaint_id}",
            message=f"Your draft complaint has been submitted as {complaint.public_complaint_id}.",
            related_complaint_id=complaint.complaint_id,
            is_read=False,
            created_at=utc_now()
        )
        db.add(notif)

    db.commit()
    db.refresh(complaint)

    return {
        "success": True,
        "complaint_id": complaint.complaint_id,
        "public_complaint_id": complaint.public_complaint_id,
        "status": complaint.status,
        "is_draft": complaint.is_draft
    }


@router.post("/complaints/{complaint_id}/evidence")
async def upload_evidence(
    complaint_id: str,
    file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(require_citizen),
    db: Session = Depends(get_db)
):
    user_ident = get_citizen_identifier(current_user, db)
    complaint = db.query(Complaint).filter(Complaint.complaint_id == complaint_id).first()

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    if current_user.get("role") not in ["admin"] and complaint.user_id != user_ident:
        raise HTTPException(status_code=403, detail="Unauthorized to attach evidence to this complaint")

    saved_info = await save_evidence_file(file, user_id=user_ident, complaint_id=complaint.complaint_id)

    evidence_entry = EvidenceFile(
        complaint_id=complaint.complaint_id,
        user_id=user_ident,
        file_name=saved_info["file_id"],
        original_filename=saved_info["original_filename"],
        file_type=saved_info["file_type"],
        file_size=saved_info["file_size"],
        storage_path=saved_info["saved_path"],
        uploaded_by=current_user.get("full_name", "Citizen"),
        uploaded_at=utc_now()
    )
    db.add(evidence_entry)

    # Add public update entry to complaint
    current_updates = list(complaint.public_updates or [])
    current_updates.append({
        "timestamp": utc_now().isoformat(),
        "message": f"Evidence file '{saved_info['original_filename']}' ({saved_info['file_size'] // 1024} KB) uploaded by complainant.",
        "author": current_user.get("full_name", "Citizen")
    })
    complaint.public_updates = current_updates

    db.commit()
    db.refresh(evidence_entry)

    return {
        "success": True,
        "file_id": evidence_entry.id,
        "filename": evidence_entry.original_filename,
        "size": evidence_entry.file_size,
        "message": "Evidence uploaded successfully"
    }


@router.get("/complaints/{complaint_id}/evidence/{file_id}/download")
def download_evidence(
    complaint_id: str,
    file_id: int,
    current_user: Dict[str, Any] = Depends(require_citizen),
    db: Session = Depends(get_db)
):
    user_ident = get_citizen_identifier(current_user, db)
    evidence = db.query(EvidenceFile).filter(
        EvidenceFile.id == file_id,
        EvidenceFile.complaint_id == complaint_id
    ).first()

    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence file record not found")

    if current_user.get("role") not in ["admin"] and evidence.user_id != user_ident:
        raise HTTPException(status_code=403, detail="Unauthorized access to this file")

    file_path = get_evidence_path(evidence.storage_path)
    return FileResponse(
        path=str(file_path),
        filename=evidence.original_filename,
        media_type=evidence.file_type
    )


@router.post("/complaints/{complaint_id}/updates")
def add_complaint_update(
    complaint_id: str,
    payload: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(require_citizen),
    db: Session = Depends(get_db)
):
    user_ident = get_citizen_identifier(current_user, db)
    complaint = db.query(Complaint).filter(Complaint.complaint_id == complaint_id).first()

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    if current_user.get("role") not in ["admin"] and complaint.user_id != user_ident:
        raise HTTPException(status_code=403, detail="Unauthorized to add updates to this complaint")

    message_type = payload.get("type", "ADDITIONAL_INFO")
    message_text = payload.get("message", "").strip()
    if not message_text:
        raise HTTPException(status_code=400, detail="Update message cannot be empty")

    new_update = ComplaintUpdate(
        complaint_id=complaint.complaint_id,
        sender_id=user_ident,
        sender_role="citizen",
        sender_name=current_user.get("full_name", "Citizen Complainant"),
        type=message_type,
        message=message_text,
        attachments=payload.get("attachments", []),
        status="RESPONDED",
        created_at=utc_now()
    )
    db.add(new_update)

    # Append to public updates
    current_updates = list(complaint.public_updates or [])
    current_updates.append({
        "timestamp": utc_now().isoformat(),
        "message": f"Complainant response: {message_text[:120]}...",
        "author": current_user.get("full_name", "Citizen")
    })
    complaint.public_updates = current_updates

    db.commit()
    db.refresh(new_update)

    return {
        "success": True,
        "update_id": new_update.id,
        "message": "Information/Evidence response submitted to investigating officer."
    }


@router.post("/complaints/{complaint_id}/feedback")
def submit_complaint_feedback(
    complaint_id: str,
    payload: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(require_citizen),
    db: Session = Depends(get_db)
):
    user_ident = get_citizen_identifier(current_user, db)
    complaint = db.query(Complaint).filter(Complaint.complaint_id == complaint_id).first()

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    if current_user.get("role") not in ["admin"] and complaint.user_id != user_ident:
        raise HTTPException(status_code=403, detail="Unauthorized")

    feedback_data = {
        "rating": payload.get("rating", 5),
        "comment": payload.get("comment", ""),
        "submitted_at": utc_now().isoformat()
    }
    complaint.feedback = feedback_data
    db.commit()

    return {"success": True, "message": "Feedback submitted. Thank you for helping us improve citizen cyber protection services."}


@router.get("/complaints/{complaint_id}/acknowledgement")
def get_complaint_acknowledgement(
    complaint_id: str,
    current_user: Dict[str, Any] = Depends(require_citizen),
    db: Session = Depends(get_db)
):
    user_ident = get_citizen_identifier(current_user, db)
    complaint = db.query(Complaint).filter(
        (Complaint.complaint_id == complaint_id) | (Complaint.public_complaint_id == complaint_id)
    ).first()

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    return {
        "acknowledgement_no": complaint.public_complaint_id or complaint.complaint_id,
        "internal_case_id": complaint.complaint_id,
        "filing_timestamp": complaint.timestamp.isoformat() if complaint.timestamp else None,
        "complainant": {
            "name": complaint.complainant_name,
            "phone": complaint.contact_phone,
            "city": complaint.city,
            "state": complaint.state
        },
        "incident": {
            "category": complaint.category,
            "crime_type": complaint.crime_type,
            "incident_date": complaint.incident_date.isoformat() if complaint.incident_date else None,
            "incident_time": complaint.incident_time,
            "amount_claimed_inr": complaint.amount_inr,
            "transaction_id": complaint.transaction_id,
            "description": complaint.description
        },
        "assigned_jurisdiction": {
            "state": complaint.state,
            "district": complaint.district,
            "police_unit": f"Cyber Crime Police Station, {complaint.district}",
            "investigating_officer": complaint.assigned_officer or "Under Assignment"
        },
        "statutory_notice": "This document constitutes an official cyber incident acknowledgement under Section 66D of the IT Act 2000 and BNSS guidelines. Generated digitally via TrackTheCash National Cyber Intelligence Network.",
        "qr_verification_code": f"TTC-VERIFY:{complaint.public_complaint_id or complaint.complaint_id}:{complaint.amount_inr}"
    }


@router.get("/notifications")
def list_notifications(
    current_user: Dict[str, Any] = Depends(require_citizen),
    db: Session = Depends(get_db)
):
    user_ident = get_citizen_identifier(current_user, db)
    notifs = db.query(CitizenNotification).filter(
        CitizenNotification.user_id == user_ident
    ).order_by(desc(CitizenNotification.created_at)).all()

    return [
        {
            "id": n.id,
            "type": n.type,
            "title": n.title,
            "message": n.message,
            "related_complaint_id": n.related_complaint_id,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat() if n.created_at else None
        }
        for n in notifs
    ]


@router.put("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    current_user: Dict[str, Any] = Depends(require_citizen),
    db: Session = Depends(get_db)
):
    user_ident = get_citizen_identifier(current_user, db)
    notif = db.query(CitizenNotification).filter(
        CitizenNotification.id == notification_id,
        CitizenNotification.user_id == user_ident
    ).first()

    if notif:
        notif.is_read = True
        db.commit()
    return {"success": True}


@router.put("/notifications/read-all")
def mark_all_notifications_read(
    current_user: Dict[str, Any] = Depends(require_citizen),
    db: Session = Depends(get_db)
):
    user_ident = get_citizen_identifier(current_user, db)
    db.query(CitizenNotification).filter(
        CitizenNotification.user_id == user_ident,
        CitizenNotification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"success": True}


@router.post("/suspicious-activity")
def report_suspicious_activity(
    payload: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(require_citizen),
    db: Session = Depends(get_db)
):
    user_ident = get_citizen_identifier(current_user, db)
    ref_id = f"TTC-INTEL-{uuid.uuid4().hex[:6].upper()}"

    report = SuspiciousActivityReport(
        reference_id=ref_id,
        user_id=user_ident,
        report_type=payload.get("report_type", "phishing_url"),
        identifier=payload.get("identifier", "").strip(),
        description=payload.get("description", "").strip(),
        evidence_info=payload.get("evidence_info", {}),
        status="RECEIVED",
        created_at=utc_now()
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    # Add thank you notification
    notif = CitizenNotification(
        user_id=user_ident,
        type="INTEL_RECEIVED",
        title=f"Intel Report Logged: {ref_id}",
        message=f"Thank you for reporting suspicious activity ({payload.get('identifier')}). Sent for automated triage.",
        is_read=False,
        created_at=utc_now()
    )
    db.add(notif)
    db.commit()

    return {
        "success": True,
        "reference_id": report.reference_id,
        "message": "Suspicious activity report recorded and queued for threat intelligence analysis."
    }


@router.get("/suspicious-activity")
def list_suspicious_reports(
    current_user: Dict[str, Any] = Depends(require_citizen),
    db: Session = Depends(get_db)
):
    user_ident = get_citizen_identifier(current_user, db)
    reports = db.query(SuspiciousActivityReport).filter(
        SuspiciousActivityReport.user_id == user_ident
    ).order_by(desc(SuspiciousActivityReport.created_at)).all()

    return [
        {
            "id": r.id,
            "reference_id": r.reference_id,
            "report_type": r.report_type,
            "identifier": r.identifier,
            "description": r.description,
            "evidence_info": r.evidence_info or {},
            "status": r.status,
            "created_at": r.created_at.isoformat() if r.created_at else None
        }
        for r in reports
    ]


@router.get("/safety-guides")
def get_safety_guides(
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(SafetyGuide)
    if category and category != "ALL":
        query = query.filter(SafetyGuide.category == category)
    guides = query.all()
    return [
        {
            "id": g.id,
            "title": g.title,
            "category": g.category,
            "summary": g.summary,
            "content": g.content,
            "icon_name": g.icon_name,
            "created_at": g.created_at.isoformat() if g.created_at else None
        }
        for g in guides
    ]


@router.get("/profile")
def get_citizen_profile(
    current_user: Dict[str, Any] = Depends(require_citizen),
    db: Session = Depends(get_db)
):
    user = db.query(CitizenUser).filter(
        (CitizenUser.username == current_user.get("username")) |
        (CitizenUser.public_user_id == current_user.get("public_user_id"))
    ).first()

    if not user:
        # Return synthesized profile for demo fallback
        return {
            "public_user_id": current_user.get("public_user_id", "TTC-USER-00124"),
            "username": current_user.get("username", "demo_citizen"),
            "full_name": current_user.get("full_name", "Rohan Mehta"),
            "email": "rohan.mehta@example.com",
            "phone": "+91 98765 43210",
            "city": "Mumbai",
            "district": "Mumbai City",
            "state": "Maharashtra",
            "address": "Flat 402, Sea Breeze Apts, Bandra West",
            "is_verified": True,
            "role": "user",
            "created_at": utc_now().isoformat()
        }

    return {
        "public_user_id": user.public_user_id,
        "username": user.username,
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "city": user.city,
        "district": user.district,
        "state": user.state,
        "address": user.address,
        "is_verified": user.is_verified,
        "role": user.role,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None
    }


@router.put("/profile")
def update_citizen_profile(
    payload: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(require_citizen),
    db: Session = Depends(get_db)
):
    user = db.query(CitizenUser).filter(
        (CitizenUser.username == current_user.get("username")) |
        (CitizenUser.public_user_id == current_user.get("public_user_id"))
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="Citizen profile not found in database")

    for field in ["full_name", "phone", "state", "district", "city", "address"]:
        if field in payload and payload[field] is not None:
            setattr(user, field, payload[field])

    user.updated_at = utc_now()
    db.commit()

    return {"success": True, "message": "Profile details updated successfully."}


@router.put("/change-password")
def change_citizen_password(
    payload: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(require_citizen),
    db: Session = Depends(get_db)
):
    old_password = payload.get("old_password")
    new_password = payload.get("new_password")

    if not old_password or not new_password:
        raise HTTPException(status_code=400, detail="Current and new passwords are required")

    user = db.query(CitizenUser).filter(
        (CitizenUser.username == current_user.get("username")) |
        (CitizenUser.public_user_id == current_user.get("public_user_id"))
    ).first()

    if not user:
        # Demo user password check
        if current_user.get("username") == "demo_citizen" and old_password == "citizen123":
            return {"success": True, "message": "Password updated successfully."}
        raise HTTPException(status_code=400, detail="Invalid current password")

    if not verify_password(old_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password does not match.")

    user.password_hash = hash_password(new_password)
    user.updated_at = utc_now()
    db.commit()

    return {"success": True, "message": "Password successfully updated."}
