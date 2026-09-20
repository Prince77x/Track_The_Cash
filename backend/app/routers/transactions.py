from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.auth import get_current_user
from backend.app.database import get_db
from backend.app.models import Transaction, User
from backend.app.schemas import TransactionCreate, TransactionOut

router = APIRouter(prefix="/api/v1/transactions", tags=["Transactions"])


@router.post("", response_model=TransactionOut, status_code=status.HTTP_201_CREATED)
def create_transaction(payload: TransactionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tx = Transaction(
        transaction_id=f"T{__import__('uuid').uuid4().hex[:8].upper()}",
        complaint_id=payload.complaint_id,
        mule_account_id=payload.mule_account_id,
        atm_id=payload.atm_id,
        transaction_time=__import__('datetime').datetime.now(__import__('datetime').timezone.utc),
        amount_inr=payload.amount_inr,
        transaction_type=payload.transaction_type,
        state=payload.state,
        district=payload.district,
        is_suspicious=payload.is_suspicious,
        suspicious_reason=payload.suspicious_reason,
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


@router.get("", response_model=list[TransactionOut])
def list_transactions(
    state: Optional[str] = None,
    district: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Transaction)
    if state:
        query = query.filter(Transaction.state == state)
    if district:
        query = query.filter(Transaction.district == district)
    return query.order_by(Transaction.transaction_time.desc()).offset((page - 1) * page_size).limit(page_size).all()


@router.get("/{transaction_id}", response_model=TransactionOut)
def get_transaction(transaction_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tx = db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx


@router.get("/{transaction_id}/trail")
def get_transaction_trail(transaction_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tx = db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"transaction_id": tx.transaction_id, "trail": [{"type": "transaction", "state": tx.state, "district": tx.district}]}
