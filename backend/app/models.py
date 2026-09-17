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
    crime_type = Column(String(32), nullable=False)
    amount_inr = Column(Float, nullable=False)
    mule_account_id = Column(String(64), ForeignKey("mule_accounts.mule_id"), nullable=True, index=True)
    status = Column(String(32), default="pending", nullable=False)

    __table_args__ = (
        CheckConstraint(
            "crime_type IN ('otp_fraud', 'atm_card_fraud', 'investment_scam')",
            name="check_crime_type"
        ),
        CheckConstraint(
            "status IN ('pending', 'resolved')",
            name="check_complaint_status"
        ),
    )

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
