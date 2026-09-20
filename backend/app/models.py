import datetime
import hashlib
import uuid
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    JSON,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from backend.app.database import Base


def utc_now():
    return datetime.datetime.now(datetime.timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(64), nullable=False, unique=True, index=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(128), nullable=False, default="")
    mobile_no = Column(String(20), nullable=False, default="")
    state = Column(String(64), nullable=False, default="", index=True)
    district = Column(String(64), nullable=False, default="", index=True)
    address = Column(Text, nullable=True)
    role = Column(String(32), nullable=False, default="CITIZEN")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    complaints = relationship("Complaint", back_populates="user")
    notification_preferences = relationship("NotificationPreference", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")

    __table_args__ = (
        CheckConstraint("role IN ('ADMIN', 'CITIZEN', 'LEA', 'BANK', 'I4C')", name="check_user_role"),
        Index("idx_users_state_district", "state", "district"),
    )


class Complaint(Base):
    __tablename__ = "complaints"

    complaint_id = Column(String(64), primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    mule_account_id = Column(String(64), ForeignKey("mule_accounts.mule_id"), nullable=True, index=True)
    timestamp = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)
    state = Column(String(64), nullable=False, index=True)
    district = Column(String(64), nullable=False, index=True)
    crime_type = Column(String(32), nullable=False)
    description = Column(Text, nullable=False, default="")
    amount_inr = Column(Numeric(12, 2), nullable=False)
    bank_name = Column(String(128), nullable=True)
    suspected_identifier = Column(String(128), nullable=True)
    status = Column(String(32), default="pending", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="complaints")
    mule_account = relationship("MuleAccount", back_populates="complaints", foreign_keys=[mule_account_id])
    transactions = relationship("Transaction", back_populates="complaint")
    investigations = relationship("Investigation", back_populates="complaint")

    __table_args__ = (
        CheckConstraint("crime_type IN ('otp_fraud', 'atm_card_fraud', 'investment_scam')", name="check_complaint_type"),
        CheckConstraint("status IN ('pending', 'under_investigation', 'resolved', 'rejected')", name="check_complaint_status"),
        Index("idx_complaints_state_district", "state", "district"),
    )


class MuleAccount(Base):
    __tablename__ = "mule_accounts"

    mule_id = Column(String(64), primary_key=True, index=True)
    registered_state = Column(String(64), nullable=False, index=True)
    registered_district = Column(String(64), nullable=False, index=True)
    registered_lat = Column(Float, nullable=False)
    registered_lng = Column(Float, nullable=False)
    account_bank = Column(String(128), nullable=False)
    account_identifier_hash = Column(
        String(255),
        nullable=False,
        default=lambda: hashlib.sha256(uuid.uuid4().bytes).hexdigest(),
    )
    linked_atm_ids = Column(JSON, nullable=True, default=list)
    is_cross_state = Column(Boolean, default=False, nullable=False, index=True)
    risk_score = Column(Float, default=0.0, nullable=False)
    status = Column(String(32), default="active", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    complaints = relationship("Complaint", back_populates="mule_account", foreign_keys="Complaint.mule_account_id")
    transactions = relationship("Transaction", back_populates="mule_account")

    __table_args__ = (
        CheckConstraint("status IN ('active', 'flagged', 'inactive', 'blocked')", name="check_mule_status"),
        Index("idx_mules_state_district", "registered_state", "registered_district"),
    )


class Transaction(Base):
    __tablename__ = "transactions"

    transaction_id = Column(String(64), primary_key=True, index=True)
    complaint_id = Column(String(64), ForeignKey("complaints.complaint_id"), nullable=True, index=True)
    mule_account_id = Column(String(64), ForeignKey("mule_accounts.mule_id"), nullable=True, index=True)
    atm_id = Column(String(64), ForeignKey("atm_locations.atm_id"), nullable=True, index=True)
    transaction_time = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)
    amount_inr = Column(Numeric(12, 2), nullable=False)
    transaction_type = Column(String(32), nullable=False)
    state = Column(String(64), nullable=False, index=True)
    district = Column(String(64), nullable=False, index=True)
    is_suspicious = Column(Boolean, default=False, nullable=False, index=True)
    suspicious_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    complaint = relationship("Complaint", back_populates="transactions")
    mule_account = relationship("MuleAccount", back_populates="transactions")
    atm = relationship("ATMLocation", back_populates="transactions")

    __table_args__ = (
        Index("idx_transactions_atm_state", "atm_id", "state"),
        Index("idx_transactions_mule_time", "mule_account_id", "transaction_time"),
    )


class ATMLocation(Base):
    __tablename__ = "atm_locations"

    atm_id = Column(String(64), primary_key=True, index=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    state = Column(String(64), nullable=False, index=True)
    district = Column(String(64), nullable=False, index=True)
    bank_name = Column(String(128), nullable=True)
    address = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    transactions = relationship("Transaction", back_populates="atm")
    predictions = relationship("Prediction", back_populates="atm")
    alerts = relationship("Alert", back_populates="atm")
    risk_history = relationship("ATMRiskHistory", back_populates="atm")

    __table_args__ = (
        Index("idx_atm_state_district", "state", "district"),
    )


class ATMRiskHistory(Base):
    __tablename__ = "atm_risk_history"

    history_id = Column(Integer, primary_key=True, autoincrement=True)
    atm_id = Column(String(64), ForeignKey("atm_locations.atm_id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    risk_score = Column(Float, nullable=False)
    complaint_count = Column(Integer, default=0, nullable=False)
    withdrawal_count = Column(Integer, default=0, nullable=False)
    withdrawal_amount = Column(Numeric(12, 2), default=0, nullable=False)
    unique_mule_accounts = Column(Integer, default=0, nullable=False)
    cross_state_count = Column(Integer, default=0, nullable=False)
    spike_flag = Column(Boolean, default=False, nullable=False)
    district = Column(String(64), nullable=False, index=True)
    state = Column(String(64), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    atm = relationship("ATMLocation", back_populates="risk_history")

    __table_args__ = (
        Index("idx_history_atm_date", "atm_id", "date"),
        Index("idx_history_state_district", "state", "district"),
    )


class Prediction(Base):
    __tablename__ = "predictions"

    prediction_id = Column(Integer, primary_key=True, autoincrement=True)
    atm_id = Column(String(64), ForeignKey("atm_locations.atm_id"), nullable=False, index=True)
    risk_score = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False, default=0.0)
    risk_level = Column(String(16), nullable=False, default="MEDIUM")
    prediction_horizon_hours = Column(Integer, default=24, nullable=False)
    model_version = Column(String(32), nullable=False, default="v1.0")
    predicted_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)

    atm = relationship("ATMLocation", back_populates="predictions")
    alerts = relationship("Alert", back_populates="prediction")

    __table_args__ = (
        CheckConstraint("risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')", name="check_risk_level"),
        Index("idx_prediction_atm_time", "atm_id", "predicted_at"),
    )


class Alert(Base):
    __tablename__ = "alerts"

    alert_id = Column(Integer, primary_key=True, autoincrement=True)
    atm_id = Column(String(64), ForeignKey("atm_locations.atm_id"), nullable=True, index=True)
    prediction_id = Column(Integer, ForeignKey("predictions.prediction_id"), nullable=True, index=True)
    district = Column(String(64), nullable=False, index=True)
    state = Column(String(64), nullable=False, index=True)
    severity = Column(String(16), nullable=False)
    detected_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)
    triggered_by = Column(String(32), nullable=False)
    complaint_count = Column(Integer, default=0, nullable=False)
    rolling_avg = Column(Float, default=0.0, nullable=False)
    cross_state = Column(Boolean, default=False, nullable=False)
    title = Column(String(255), nullable=False, default="ATM risk alert")
    message = Column(Text, nullable=False)
    status = Column(String(32), default="NEW", nullable=False)
    alert_group_id = Column(String(64), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    atm = relationship("ATMLocation", back_populates="alerts")
    prediction = relationship("Prediction", back_populates="alerts")
    deliveries = relationship("AlertDelivery", back_populates="alert")
    factors = relationship("AlertFactor", back_populates="alert")

    __table_args__ = (
        CheckConstraint("severity IN ('WARNING', 'CRITICAL')", name="check_alert_severity"),
        CheckConstraint("status IN ('NEW', 'ACKNOWLEDGED', 'IN_REVIEW', 'ESCALATED', 'RESOLVED', 'DISMISSED')", name="check_alert_status"),
        Index("idx_alert_status_state", "state", "status"),
        Index("idx_alert_atm_time", "atm_id", "detected_at"),
    )


class AlertFactor(Base):
    __tablename__ = "alert_factors"

    factor_id = Column(Integer, primary_key=True, autoincrement=True)
    alert_id = Column(Integer, ForeignKey("alerts.alert_id"), nullable=False, index=True)
    factor = Column(String(128), nullable=False)
    value = Column(Float, nullable=False)
    description = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    alert = relationship("Alert", back_populates="factors")


class AlertDelivery(Base):
    __tablename__ = "alert_deliveries"

    delivery_id = Column(Integer, primary_key=True, autoincrement=True)
    alert_id = Column(Integer, ForeignKey("alerts.alert_id"), nullable=False, index=True)
    channel = Column(String(16), nullable=False)
    recipient = Column(String(255), nullable=False)
    status = Column(String(16), default="PENDING", nullable=False)
    provider_message_id = Column(String(128), nullable=True)
    error_message = Column(Text, nullable=True)
    attempts = Column(Integer, default=0, nullable=False)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    alert = relationship("Alert", back_populates="deliveries")

    __table_args__ = (
        CheckConstraint("channel IN ('EMAIL', 'WHATSAPP')", name="check_delivery_channel"),
        CheckConstraint("status IN ('PENDING', 'SENT', 'FAILED')", name="check_delivery_status"),
        Index("idx_delivery_alert_channel", "alert_id", "channel"),
    )


class Investigation(Base):
    __tablename__ = "investigations"

    investigation_id = Column(Integer, primary_key=True, autoincrement=True)
    complaint_id = Column(String(64), ForeignKey("complaints.complaint_id"), nullable=False, index=True)
    assigned_officer_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    status = Column(String(32), default="OPEN", nullable=False)
    priority = Column(String(16), default="MEDIUM", nullable=False)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    complaint = relationship("Complaint", back_populates="investigations")
    events = relationship("InvestigationEvent", back_populates="investigation")

    __table_args__ = (
        CheckConstraint("status IN ('OPEN', 'IN_PROGRESS', 'CLOSED', 'ESCALATED')", name="check_investigation_status"),
        CheckConstraint("priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')", name="check_investigation_priority"),
    )


class InvestigationEvent(Base):
    __tablename__ = "investigation_events"

    event_id = Column(Integer, primary_key=True, autoincrement=True)
    investigation_id = Column(Integer, ForeignKey("investigations.investigation_id"), nullable=False, index=True)
    event_type = Column(String(64), nullable=False)
    description = Column(Text, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)

    investigation = relationship("Investigation", back_populates="events")


class EntityLink(Base):
    __tablename__ = "entity_links"

    link_id = Column(Integer, primary_key=True, autoincrement=True)
    source_type = Column(String(32), nullable=False)
    source_id = Column(String(128), nullable=False, index=True)
    target_type = Column(String(32), nullable=False)
    target_id = Column(String(128), nullable=False, index=True)
    link_type = Column(String(64), nullable=False)
    confidence = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    __table_args__ = (
        Index("idx_entity_links_pair", "source_type", "source_id", "target_type", "target_id"),
    )


class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    preference_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True, index=True)
    email_enabled = Column(Boolean, default=True, nullable=False)
    whatsapp_enabled = Column(Boolean, default=True, nullable=False)
    critical_alerts_only = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="notification_preferences")


class Watchlist(Base):
    __tablename__ = "watchlists"

    watchlist_id = Column(Integer, primary_key=True, autoincrement=True)
    entity_type = Column(String(32), nullable=False)
    entity_id = Column(String(128), nullable=False, index=True)
    reason = Column(Text, nullable=False)
    priority = Column(String(16), default="MEDIUM", nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    status = Column(String(16), default="ACTIVE", nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    __table_args__ = (
        CheckConstraint("priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')", name="check_watchlist_priority"),
        CheckConstraint("status IN ('ACTIVE', 'REVIEW', 'REMOVED')", name="check_watchlist_status"),
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    audit_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    action = Column(String(128), nullable=False)
    entity_type = Column(String(64), nullable=False)
    entity_id = Column(String(128), nullable=True)
    ip_address = Column(String(64), nullable=True)
    metadata_json = Column("metadata", JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)

    user = relationship("User", back_populates="audit_logs")

    __table_args__ = (
        Index("idx_audit_entity", "entity_type", "entity_id"),
    )
