from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.auth import get_current_user
from backend.app.database import get_db
from backend.app.schemas import NetworkResponse
from backend.app.services.network_service import build_entity_network

router = APIRouter(prefix="/api/v1", tags=["Network Intelligence"])


@router.get("/entities/{entity_type}/{entity_id}/network", response_model=NetworkResponse)
def get_entity_network(entity_type: str, entity_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    normalized = entity_type.lower()
    if normalized not in {"complaint", "mule_account", "transaction", "atm"}:
        raise HTTPException(status_code=400, detail="Unsupported entity type")
    return build_entity_network(db, normalized, entity_id)
