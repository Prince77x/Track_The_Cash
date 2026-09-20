from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.auth import get_current_user, require_roles
from backend.app.database import get_db
from backend.app.models import Investigation, InvestigationEvent, User
from backend.app.schemas import InvestigationCreate, InvestigationEventCreate, InvestigationEventOut, InvestigationOut

router = APIRouter(prefix="/api/v1/investigations", tags=["Investigations"])


@router.post("", response_model=InvestigationOut)
def create_investigation(payload: InvestigationCreate, db: Session = Depends(get_db), current_user: User = Depends(require_roles("LEA", "I4C", "ADMIN"))):
    investigation = Investigation(
        complaint_id=payload.complaint_id,
        assigned_officer_id=payload.assigned_officer_id or current_user.id,
        status=payload.status,
        priority=payload.priority,
        remarks=payload.remarks,
    )
    db.add(investigation)
    db.commit()
    db.refresh(investigation)
    return investigation


@router.get("", response_model=list[InvestigationOut])
def list_investigations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Investigation).order_by(Investigation.created_at.desc()).all()


@router.get("/{investigation_id}", response_model=InvestigationOut)
def get_investigation(investigation_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    investigation = db.query(Investigation).filter(Investigation.investigation_id == investigation_id).first()
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    return investigation


@router.post("/{investigation_id}/events", response_model=InvestigationEventOut)
def add_investigation_event(investigation_id: int, payload: InvestigationEventCreate, db: Session = Depends(get_db), current_user: User = Depends(require_roles("LEA", "I4C", "ADMIN"))):
    investigation = db.query(Investigation).filter(Investigation.investigation_id == investigation_id).first()
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    event = InvestigationEvent(
        investigation_id=investigation_id,
        event_type=payload.event_type,
        description=payload.description,
        created_by=current_user.id,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
