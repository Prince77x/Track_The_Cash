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
    public_complaint_id = Column(String(64), nullable=True, index=True)  # e.g. TTC-2026-000124
    user_id = Column(String(64), nullable=True, index=True)              # Link to citizen user
    timestamp = Column(DateTime, default=utc_now, nullable=False, index=True)
    state = Column(String(64), nullable=False, index=True)
    district = Column(String(64), nullable=False, index=True)
    city = Column(String(128), nullable=True)
    crime_type = Column(String(64), nullable=False)
    amount_inr = Column(Float, nullable=False)
    mule_account_id = Column(String(64), ForeignKey("mule_accounts.mule_id"), nullable=True, index=True)
    status = Column(String(32), default="NEW", nullable=False, index=True)
    is_draft = Column(Boolean, default=False, nullable=False, index=True)
    source = Column(String(32), default="citizen", nullable=False)

    # Extended fields for citizen incident details
    incident_date = Column(Date, nullable=True)
    incident_time = Column(String(32), nullable=True)
    complainant_name = Column(String(128), default="Citizen User", nullable=True)
    contact_phone = Column(String(64), default="+91 98765 43210", nullable=True)
    transaction_id = Column(String(64), nullable=True, index=True)
    atm_id = Column(String(64), nullable=True, index=True)
    category = Column(String(64), default="ATM Cash-Out Anomaly", nullable=True)
    description = Column(Text, default="Suspicious cash withdrawal activity detected", nullable=True)
    priority = Column(String(16), default="HIGH", nullable=False, index=True)
    assigned_officer = Column(String(128), nullable=True)

    # Structured details & privacy boundary
    financial_details = Column(JSON, default=dict, nullable=True)
    suspect_details = Column(JSON, default=dict, nullable=True)
    public_updates = Column(JSON, default=list, nullable=True)       # Citizen-safe updates
    investigation_notes = Column(JSON, default=list, nullable=True)  # Strictly internal LEA/Admin notes
    resolution_summary = Column(Text, nullable=True)
    feedback = Column(JSON, nullable=True)                           # Post-resolution citizen rating
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


from sqlalchemy import Column, String, Float, DateTime, Integer
# Ensure utc_now is imported from your app.models or utils

class Prediction(Base):
    __tablename__ = "predictions"

    # Dedicated primary key to allow saving multiple historical predictions
    prediction_id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Core fields mapped directly from your JSON output
    atm_id = Column(String(64), nullable=False, index=True)
    state = Column(String(64), nullable=False, index=True)
    district = Column(String(64), nullable=False, index=True)
    risk_score = Column(Float, nullable=False, index=True)
    risk_level = Column(String(32), nullable=False)
    
    # Timestamp to track when this prediction was generated
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
    status = Column(String(32), default="ACTIVE", nullable=False, index=True)
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


class CitizenUser(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    public_user_id = Column(String(64), unique=True, nullable=False, index=True)  # e.g. TTC-USER-00124
    username = Column(String(64), unique=True, nullable=False, index=True)
    email = Column(String(128), unique=True, nullable=False, index=True)
    phone = Column(String(64), unique=True, nullable=True, index=True)
    full_name = Column(String(128), nullable=False)
    password_hash = Column(String(256), nullable=False)
    role = Column(String(32), default="user", nullable=False, index=True)
    state = Column(String(64), nullable=False)
    district = Column(String(64), nullable=False)
    city = Column(String(128), nullable=True)
    address = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)
    last_login_at = Column(DateTime, default=utc_now, nullable=True)


class EvidenceFile(Base):
    __tablename__ = "evidence_files"

    id = Column(Integer, primary_key=True, autoincrement=True)
    complaint_id = Column(String(64), nullable=False, index=True)
    user_id = Column(String(64), nullable=False, index=True)
    file_name = Column(String(256), nullable=False)
    original_filename = Column(String(256), nullable=False)
    file_type = Column(String(64), nullable=False)
    file_size = Column(Integer, nullable=False)
    storage_path = Column(String(512), nullable=False)
    uploaded_by = Column(String(128), default="Citizen", nullable=False)
    uploaded_at = Column(DateTime, default=utc_now, nullable=False)


class ComplaintStatusHistory(Base):
    __tablename__ = "complaint_status_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    complaint_id = Column(String(64), nullable=False, index=True)
    old_status = Column(String(32), nullable=False)
    new_status = Column(String(32), nullable=False)
    changed_by = Column(String(128), nullable=False)
    changed_by_role = Column(String(32), default="admin", nullable=False)
    public_message = Column(Text, nullable=False)
    internal_note = Column(Text, nullable=True)
    changed_at = Column(DateTime, default=utc_now, nullable=False)


class ComplaintUpdate(Base):
    __tablename__ = "complaint_updates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    complaint_id = Column(String(64), nullable=False, index=True)
    sender_id = Column(String(64), nullable=False)
    sender_role = Column(String(32), nullable=False)  # citizen, lea, admin
    sender_name = Column(String(128), nullable=False)
    type = Column(String(64), default="ADDITIONAL_INFO", nullable=False)  # INFO_REQUEST, EVIDENCE_REQUEST, CITIZEN_RESPONSE, ADDITIONAL_INFO
    message = Column(Text, nullable=False)
    attachments = Column(JSON, default=list, nullable=True)
    status = Column(String(32), default="PENDING", nullable=False)  # PENDING, RESPONDED, RESOLVED
    created_at = Column(DateTime, default=utc_now, nullable=False)


class CitizenNotification(Base):
    __tablename__ = "citizen_notifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(64), nullable=False, index=True)
    type = Column(String(64), default="SYSTEM", nullable=False)
    title = Column(String(256), nullable=False)
    message = Column(Text, nullable=False)
    related_complaint_id = Column(String(64), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)


class SuspiciousActivityReport(Base):
    __tablename__ = "suspicious_activity_reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    reference_id = Column(String(64), unique=True, nullable=False, index=True)  # e.g. TTC-INTEL-000123
    user_id = Column(String(64), nullable=True, index=True)
    report_type = Column(String(64), nullable=False)  # website, phone, email, upi, bank_acc, social_media, sms, other
    identifier = Column(String(256), nullable=False)
    description = Column(Text, nullable=False)
    evidence_info = Column(JSON, default=dict, nullable=True)
    status = Column(String(32), default="RECEIVED", nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)


class SafetyGuide(Base):
    __tablename__ = "safety_guides"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(256), nullable=False)
    category = Column(String(64), nullable=False, index=True)
    summary = Column(Text, nullable=False)
    content = Column(Text, nullable=False)
    icon_name = Column(String(64), default="Shield", nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)


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
    priority = Column(String(16), default="HIGH", nullable=False, index=True)
    status = Column(String(32), default="NEW", nullable=False, index=True)
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
    action = Column(String(64), nullable=False, index=True)
    resource = Column(String(64), nullable=False, index=True)
    resource_id = Column(String(64), nullable=True)
    details = Column(JSON, default=dict, nullable=True)
    ip_address = Column(String(64), default="127.0.0.1", nullable=True)


class AdminNotification(Base):
    __tablename__ = "admin_notifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=utc_now, nullable=False, index=True)
    title = Column(String(256), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(64), default="SYSTEM", nullable=False, index=True)
    severity = Column(String(32), default="info", nullable=False)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    metadata_json = Column(JSON, default=dict, nullable=True)


class AdminSetting(Base):
    __tablename__ = "admin_settings"

    key = Column(String(64), primary_key=True, index=True)
    value = Column(JSON, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)
    updated_by = Column(String(64), default="admin_user", nullable=False)
