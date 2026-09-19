import datetime
from sqlalchemy import (
    Column,
    String,
    Float,
    Integer,
    Boolean,
    DateTime,
    Date,
    ForeignKey,
    Text,
    JSON,
    CheckConstraint,
    Index
)
from sqlalchemy.orm import relationship
from backend.app.database import Base


def utc_now():
    return datetime.datetime.now(datetime.timezone.utc)


class MuleAccount(Base):
    __tablename__ = "mule_accounts"

    mule_id = Column(String(64), primary_key=True, index=True)
    registered_state = Column(String(64), nullable=False, index=True)
    registered_district = Column(String(64), nullable=False, index=True)
    registered_lat = Column(Float, nullable=False)
    registered_lng = Column(Float, nullable=False)
    account_bank = Column(String(128), nullable=False)
    is_cross_state = Column(Boolean, default=False, nullable=False, index=True)
    linked_atm_ids = Column(JSON, default=list, nullable=False)

    complaints = relationship("Complaint", back_populates="mule_account")


class Complaint(Base):
    __tablename__ = "complaints"

    complaint_id = Column(String(64), primary_key=True, index=True)
    timestamp = Column(DateTime, default=utc_now, nullable=False, index=True)
    state = Column(String(64), nullable=False, index=True)
    district = Column(String(64), nullable=False, index=True)
    crime_type = Column(String(64), nullable=False)
    amount_inr = Column(Float, nullable=False)
    mule_account_id = Column(String(64), ForeignKey("mule_accounts.mule_id"), nullable=True, index=True)
    status = Column(String(32), default="NEW", nullable=False, index=True)

    # Extended fields for LEA surveillance & investigation
    complainant_name = Column(String(128), default="Citizen User", nullable=True)
    contact_phone = Column(String(64), default="+91 98765 43210", nullable=True)
    transaction_id = Column(String(64), nullable=True, index=True)
    atm_id = Column(String(64), nullable=True, index=True)
    category = Column(String(64), default="ATM Cash-Out Anomaly", nullable=True)
    description = Column(Text, default="Suspicious cash withdrawal activity detected", nullable=True)
    priority = Column(String(16), default="HIGH", nullable=False, index=True)
    assigned_officer = Column(String(128), nullable=True)
    investigation_notes = Column(JSON, default=list, nullable=True)
    resolution_summary = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=True)

    mule_account = relationship("MuleAccount", back_populates="complaints")


class ATMLocation(Base):
    __tablename__ = "atm_locations"

    atm_id = Column(String(64), primary_key=True, index=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    state = Column(String(64), nullable=False, index=True)
    district = Column(String(64), nullable=False, index=True)
    bank_name = Column(String(128), nullable=True)

    __table_args__ = (
        Index("idx_atm_state_district", "state", "district"),
    )


class ATMRiskHistory(Base):
    __tablename__ = "atm_risk_history"

    history_id = Column(Integer, primary_key=True, autoincrement=True)
    atm_id = Column(String(64), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    risk_score = Column(Float, nullable=False)
    complaint_count = Column(Integer, default=0, nullable=False)
    spike_flag = Column(Boolean, default=False, nullable=False)
    district = Column(String(64), nullable=False, index=True)
    state = Column(String(64), nullable=False, index=True)

    __table_args__ = (
        Index("idx_history_atm_date", "atm_id", "date"),
    )


class Prediction(Base):
    __tablename__ = "predictions"

    atm_id = Column(String(64), primary_key=True, index=True)
    risk_score = Column(Float, nullable=False, index=True)
    predicted_at = Column(DateTime, default=utc_now, nullable=False, index=True)


class Alert(Base):
    __tablename__ = "alerts"

    alert_id = Column(Integer, primary_key=True, autoincrement=True)
    district = Column(String(64), nullable=False, index=True)
    state = Column(String(64), nullable=False, index=True)
    severity = Column(String(16), nullable=False)
    detected_at = Column(DateTime, default=utc_now, nullable=False, index=True)
    triggered_by = Column(String(16), nullable=False)
    complaint_count = Column(Integer, default=0, nullable=False)
    rolling_avg = Column(Float, default=0.0, nullable=False)
    cross_state = Column(Boolean, default=False, nullable=False)
    message = Column(Text, nullable=True)

    # Operational lifecycle fields
    status = Column(String(32), default="ACTIVE", nullable=False, index=True)  # ACTIVE, ACKNOWLEDGED, INVESTIGATING, RESOLVED, ESCALATED
    assigned_officer = Column(String(128), nullable=True)
    investigation_notes = Column(JSON, default=list, nullable=True)
    action_history = Column(JSON, default=list, nullable=True)

    __table_args__ = (
        CheckConstraint(
            "severity IN ('WARNING', 'CRITICAL')",
            name="check_alert_severity"
        ),
        CheckConstraint(
            "triggered_by IN ('auto', 'manual')",
            name="check_triggered_by"
        ),
    )


class LEAOfficer(Base):
    __tablename__ = "lea_officers"

    officer_id = Column(String(64), primary_key=True, index=True)
    username = Column(String(64), unique=True, nullable=False, index=True)
    full_name = Column(String(128), nullable=False)
    email = Column(String(128), unique=True, nullable=False, index=True)
    phone = Column(String(64), nullable=True)
    state = Column(String(64), nullable=False, index=True)
    district = Column(String(64), nullable=False, index=True)
    unit = Column(String(128), nullable=False)
    designation = Column(String(64), nullable=False)
    password_hash = Column(String(256), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    role = Column(String(32), default="lea", nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    last_active_at = Column(DateTime, default=utc_now, nullable=True)


class Case(Base):
    __tablename__ = "cases"

    case_id = Column(String(64), primary_key=True, index=True)
    title = Column(String(256), nullable=False)
    complaint_id = Column(String(64), nullable=True, index=True)
    alert_id = Column(Integer, nullable=True, index=True)
    atm_id = Column(String(64), nullable=True, index=True)
    mule_id = Column(String(64), nullable=True, index=True)
    state = Column(String(64), nullable=False, index=True)
    district = Column(String(64), nullable=False, index=True)
    amount_inr = Column(Float, default=0.0, nullable=False)
    priority = Column(String(16), default="HIGH", nullable=False, index=True)  # CRITICAL, HIGH, MEDIUM, LOW
    status = Column(String(32), default="NEW", nullable=False, index=True)  # NEW, ASSIGNED, INVESTIGATING, ESCALATED, RESOLVED, CLOSED
    assigned_officer_id = Column(String(64), nullable=True, index=True)
    assigned_officer_name = Column(String(128), nullable=True)
    investigation_notes = Column(JSON, default=list, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False, index=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)
    resolved_at = Column(DateTime, nullable=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=utc_now, nullable=False, index=True)
    admin_user = Column(String(64), nullable=False, index=True)
    action = Column(String(64), nullable=False, index=True)  # e.g., CREATE_OFFICER, ASSIGN_CASE, DISPATCH_ALERT, INJECT_SPIKE
    resource = Column(String(64), nullable=False, index=True)  # officers, cases, alerts, simulation, settings
    resource_id = Column(String(64), nullable=True)
    details = Column(JSON, default=dict, nullable=True)
    ip_address = Column(String(64), default="127.0.0.1", nullable=True)


class AdminNotification(Base):
    __tablename__ = "admin_notifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=utc_now, nullable=False, index=True)
    title = Column(String(256), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(64), default="SYSTEM", nullable=False, index=True)  # CRITICAL_ALERT, VELOCITY_SPIKE, MULE_FLOW, CASE_STATUS, SYSTEM
    severity = Column(String(32), default="info", nullable=False)  # critical, warning, info, success
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    metadata_json = Column(JSON, default=dict, nullable=True)


class AdminSetting(Base):
    __tablename__ = "admin_settings"

    key = Column(String(64), primary_key=True, index=True)
    value = Column(JSON, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)
    updated_by = Column(String(64), default="admin_user", nullable=False)
