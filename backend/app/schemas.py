from pydantic import BaseModel
from typing import List, Optional, Any, Dict
import datetime


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    role: str
    expires_in: int = 28800  # 8 hours in seconds


class ATMPredictionItem(BaseModel):
    atm_id: str
    lat: float
    lng: float
    risk_score: float
    district: str
    state: str
    bank_name: Optional[str] = None
    cross_state_flag: bool = False
    stale: bool = False


class PredictResponse(BaseModel):
    predictions: List[ATMPredictionItem]
    generated_at: str


class AlertTriggerRequest(BaseModel):
    district: str
    severity: str = "WARNING"  # WARNING | CRITICAL
    message: str


class AlertTriggerResponse(BaseModel):
    status: str
    recipients: List[str]
    triggered_at: str


class SpikeItem(BaseModel):
    district: str
    state: str
    severity: str
    complaint_count: int
    rolling_avg: float
    cross_state: bool
    detected_at: str


class SpikeCheckResponse(BaseModel):
    spikes: List[SpikeItem]


class SimulationSpikeRequest(BaseModel):
    stage: Any = "all"  # 1 | 2 | "all"
    fast: bool = False


class SimulationModeRequest(BaseModel):
    mode: str = "random"  # random | scripted
    rate_per_second: float = 0.5


class VelocityItem(BaseModel):
    date: str
    state: str
    complaint_count: int


class VelocityResponse(BaseModel):
    trend: List[VelocityItem]
