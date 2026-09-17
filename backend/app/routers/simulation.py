import asyncio
import datetime
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.auth import require_admin
from backend.app.schemas import SimulationSpikeRequest, SimulationModeRequest
from backend.scripts.generate import inject_spike_scenario
from backend.app.ml.model import run_predictions

router = APIRouter(prefix="/simulation", tags=["Simulation"])

# In-memory simulation state
sim_state = {
    "is_injecting": False,
    "current_mode": "random",
    "rate_per_second": 0.5,
    "last_injected_at": None
}


@router.get("/status")
def get_simulation_status(
    admin: dict = Depends(require_admin)
):
    return sim_state


@router.post("/inject-spike")
def inject_spike(
    request: SimulationSpikeRequest,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin)
):
    """Triggers the scripted 2-stage demo spike scenario."""
    if sim_state["is_injecting"]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A simulation spike injection is currently in progress"
        )

    sim_state["is_injecting"] = True
    try:
        stage_val = request.stage
        result = inject_spike_scenario(db, stage=stage_val)

        # Immediately elevate predictions
        run_predictions(db)
        sim_state["last_injected_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()

        return result
    finally:
        sim_state["is_injecting"] = False


@router.post("/mode")
def set_simulation_mode(
    request: SimulationModeRequest,
    admin: dict = Depends(require_admin)
):
    """Updates the streaming simulation mode and ingestion rate."""
    if request.mode not in ["random", "scripted"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mode must be 'random' or 'scripted'"
        )

    sim_state["current_mode"] = request.mode
    sim_state["rate_per_second"] = max(0.01, request.rate_per_second)

    return {
        "status": "updated",
        "mode": sim_state["current_mode"],
        "rate_per_second": sim_state["rate_per_second"]
    }
