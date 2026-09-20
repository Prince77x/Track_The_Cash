from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, ConfigDict


class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    name: str
    mobile_no: str
    state: str
    district: str
    address: Optional[str] = None
    role: str = "CITIZEN"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    email: str
    name: str
    mobile_no: str
    state: str
    district: str
    address: Optional[str]
    role: str
    is_active: bool


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    expires_in: int = 28800


class ComplaintCreate(BaseModel):
    state: str
    district: str
    crime_type: str
    description: str
    amount_inr: float
    bank_name: Optional[str] = None
    suspected_identifier: Optional[str] = None


class ComplaintOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    complaint_id: str
    user_id: int
    timestamp: datetime
    state: str
    district: str
    crime_type: str
    description: str
    amount_inr: float
    bank_name: Optional[str]
    suspected_identifier: Optional[str]
    status: str


class ComplaintStatusUpdate(BaseModel):
    status: str


class MuleAccountOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    mule_id: str
    registered_state: str
    registered_district: str
    registered_lat: float
    registered_lng: float
    account_bank: str
    account_identifier_hash: str
    is_cross_state: bool
    risk_score: float
    status: str


class TransactionCreate(BaseModel):
    complaint_id: Optional[str] = None
    mule_account_id: Optional[str] = None
    atm_id: Optional[str] = None
    amount_inr: float
    transaction_type: str
    state: str
    district: str
    is_suspicious: bool = False
    suspicious_reason: Optional[str] = None


class TransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    transaction_id: str
    complaint_id: Optional[str]
    mule_account_id: Optional[str]
    atm_id: Optional[str]
    transaction_time: datetime
    amount_inr: float
    transaction_type: str
    state: str
    district: str
    is_suspicious: bool
    suspicious_reason: Optional[str]


class ATMLocationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    atm_id: str
    lat: float
    lng: float
    state: str
    district: str
    bank_name: Optional[str]
    address: Optional[str]
    is_active: bool


class ATMRiskHistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    history_id: int
    atm_id: str
    date: Any
    risk_score: float
    complaint_count: int
    withdrawal_count: int
    withdrawal_amount: Any
    unique_mule_accounts: int
    cross_state_count: int
    spike_flag: bool
    district: str
    state: str
    created_at: datetime


class RiskSummary(BaseModel):
    atm_id: str
    risk_score: float
    confidence: float
    risk_level: str
    model_version: str
    predicted_at: datetime


class PredictionCreate(BaseModel):
    atm_id: str
    risk_score: float
    confidence: float = 0.0
    risk_level: str = "MEDIUM"
    prediction_horizon_hours: int = 24
    model_version: str = "v1.0"


class PredictionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    prediction_id: int
    atm_id: str
    risk_score: float
    confidence: float
    risk_level: str
    prediction_horizon_hours: int
    model_version: str
    predicted_at: datetime


class AlertFactorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    factor: str
    value: float
    description: str


class AlertDeliveryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    delivery_id: int
    channel: str
    recipient: str
    status: str
    provider_message_id: Optional[str]
    error_message: Optional[str]
    attempts: int
    sent_at: Optional[datetime]


class AlertOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    alert_id: int
    atm_id: Optional[str]
    district: str
    state: str
    severity: str
    detected_at: datetime
    triggered_by: str
    complaint_count: int
    rolling_avg: float
    cross_state: bool
    title: str
    message: str
    status: str
    alert_group_id: Optional[str]
    factors: List[AlertFactorOut] = []
    deliveries: List[AlertDeliveryOut] = []


class InvestigationCreate(BaseModel):
    complaint_id: str
    assigned_officer_id: Optional[int] = None
    status: str = "OPEN"
    priority: str = "MEDIUM"
    remarks: Optional[str] = None


class InvestigationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    investigation_id: int
    complaint_id: str
    assigned_officer_id: Optional[int]
    status: str
    priority: str
    remarks: Optional[str]
    created_at: datetime
    updated_at: datetime


class InvestigationEventCreate(BaseModel):
    event_type: str
    description: str


class InvestigationEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    event_id: int
    investigation_id: int
    event_type: str
    description: str
    created_by: Optional[int]
    created_at: datetime


class NetworkNode(BaseModel):
    id: str
    type: str
    label: str


class NetworkEdge(BaseModel):
    source: str
    target: str
    type: str
    weight: float


class NetworkResponse(BaseModel):
    nodes: List[NetworkNode]
    edges: List[NetworkEdge]


class RiskExplanation(BaseModel):
    atm_id: str
    risk_score: float
    factors: List[Dict[str, Any]]
    cross_state: Dict[str, Any]
    spike: Dict[str, Any]


class DemoTriggerResponse(BaseModel):
    alert: AlertOut
    explanation: RiskExplanation


class NotificationTestRequest(BaseModel):
    recipient: str


class NotificationTestResponse(BaseModel):
    success: bool
    channel: str
    recipient: str
    status: str
    provider_message_id: Optional[str] = None
    error: Optional[str] = None


class PaginationQuery(BaseModel):
    page: int = 1
    page_size: int = 20


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    audit_id: int
    user_id: Optional[int]
    action: str
    entity_type: str
    entity_id: Optional[str]
    ip_address: Optional[str]
    metadata: Optional[Dict[str, Any]]
    created_at: datetime


class VelocityItem(BaseModel):
    date: str
    state: str
    complaint_count: int


class VelocityResponse(BaseModel):
    trend: List[VelocityItem]


class ATMPredictionItem(BaseModel):
    atm_id: str
    lat: float
    lng: float
    risk_score: float
    district: str
    state: str
    bank_name: Optional[str]
    cross_state_flag: bool
    stale: bool


class PredictResponse(BaseModel):
    predictions: List[ATMPredictionItem]
    generated_at: str


class SimulationSpikeRequest(BaseModel):
    stage: Any = "all"
    fast: bool = False


class SimulationModeRequest(BaseModel):
    mode: str
    rate_per_second: float = 0.5
