from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.auth import get_current_user
from backend.app.database import get_db
from backend.app.models import EntityLink, MuleAccount, User
from backend.app.schemas import MuleAccountOut, NetworkResponse
from backend.app.services.network_service import build_entity_network

router = APIRouter(prefix="/api/v1/mule-accounts", tags=["Mule Accounts"])


@router.get("", response_model=list[MuleAccountOut])
def list_mules(
    state: Optional[str] = None,
    district: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(MuleAccount)
    if state:
        query = query.filter(MuleAccount.registered_state == state)
    if district:
        query = query.filter(MuleAccount.registered_district == district)
    return query.order_by(MuleAccount.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()


@router.get("/{mule_id}", response_model=MuleAccountOut)
def get_mule(mule_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    mule = db.query(MuleAccount).filter(MuleAccount.mule_id == mule_id).first()
    if not mule:
        raise HTTPException(status_code=404, detail="Mule account not found")
    return mule


@router.get("/{mule_id}/network", response_model=NetworkResponse)
def get_mule_network(mule_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return build_entity_network(db, "mule_account", mule_id)
