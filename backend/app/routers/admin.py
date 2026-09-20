from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.auth import get_current_user, require_roles
from backend.app.database import get_db
from backend.app.models import AuditLog, User

router = APIRouter(prefix="/api/v1/admin", tags=["Admin"])


@router.get("/users")
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    return db.query(User).order_by(User.id).offset((page - 1) * page_size).limit(page_size).all()


@router.patch("/users/{user_id}")
def update_user(user_id: int, payload: dict, db: Session = Depends(get_db), current_user: User = Depends(require_roles("ADMIN"))):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for key, value in payload.items():
        if hasattr(user, key):
            setattr(user, key, value)
    db.commit()
    return {"message": "User updated", "user_id": user_id}


@router.post("/atms/import")
def import_atms(payload: dict, db: Session = Depends(get_db), current_user: User = Depends(require_roles("ADMIN"))):
    return {"message": "ATM import queued", "count": len(payload.get("atms", []))}


@router.get("/statistics")
def get_statistics(db: Session = Depends(get_db), current_user: User = Depends(require_roles("ADMIN"))):
    return {"user_count": db.query(User).count(), "audit_count": db.query(AuditLog).count()}


@router.get("/audit-logs")
def get_audit_logs(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), db: Session = Depends(get_db), current_user: User = Depends(require_roles("ADMIN"))):
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
