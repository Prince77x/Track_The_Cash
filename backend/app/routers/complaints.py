from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.auth import get_current_user
from backend.app.database import get_db
from backend.app.models import Complaint, User
from backend.app.schemas import ComplaintCreate, ComplaintOut, ComplaintStatusUpdate

router = APIRouter(prefix="/api/v1/complaints", tags=["Complaints"])


@router.post("", response_model=ComplaintOut, status_code=status.HTTP_201_CREATED)
def create_complaint(payload: ComplaintCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    complaint = Complaint(
        complaint_id=f"C{__import__('uuid').uuid4().hex[:8].upper()}",
        user_id=current_user.id,
        state=payload.state,
        district=payload.district,
        crime_type=payload.crime_type,
        description=payload.description,
        amount_inr=payload.amount_inr,
        bank_name=payload.bank_name,
        suspected_identifier=payload.suspected_identifier,
        status="pending",
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return complaint


@router.get("", response_model=list[ComplaintOut])
def list_complaints(
    state: Optional[str] = None,
    district: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Complaint)
    if current_user.role.upper() == "CITIZEN":
        query = query.filter(Complaint.user_id == current_user.id)
    if state:
        query = query.filter(Complaint.state == state)
    if district:
        query = query.filter(Complaint.district == district)
    if status:
        query = query.filter(Complaint.status == status)
    return query.order_by(Complaint.timestamp.desc()).offset((page - 1) * page_size).limit(page_size).all()


@router.get("/{complaint_id}", response_model=ComplaintOut)
def get_complaint(complaint_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    complaint = db.query(Complaint).filter(Complaint.complaint_id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    if current_user.role.upper() == "CITIZEN" and complaint.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return complaint


@router.patch("/{complaint_id}/status")
def update_complaint_status(complaint_id: str, payload: ComplaintStatusUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    complaint = db.query(Complaint).filter(Complaint.complaint_id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    if current_user.role.upper() not in {"ADMIN", "LEA", "I4C"}:
        raise HTTPException(status_code=403, detail="Only LEA/I4C/Admin can update complaint status")
    complaint.status = payload.status
    complaint.updated_at = __import__("datetime").datetime.now(__import__("datetime").timezone.utc)
    db.commit()
    return {"message": "Complaint status updated", "complaint_id": complaint_id, "status": payload.status}
