from collections import Counter
from backend.scripts.generate import (
    generate_mule_accounts,
    generate_batch_complaints,
    inject_spike_scenario,
    stream_live_complaint,
    reset_database
)
from backend.scripts.fetch_atms import ingest_atms
from backend.app.models import MuleAccount, Complaint, Alert, ATMRiskHistory


def test_mule_account_generation_and_cross_state(db_session):
    ingest_atms(db_session, target_count=50)
    mule_ids = generate_mule_accounts(db_session, num_mules=1000, cross_state_ratio=0.25)

    assert len(mule_ids) == 1000
    mules = db_session.query(MuleAccount).all()
    assert len(mules) == 1000

    cross_state_count = sum(1 for m in mules if m.is_cross_state)
    ratio = cross_state_count / len(mules)
    # Check >= 20% cross-state
    assert ratio >= 0.20


def test_batch_complaints_distribution(db_session):
    ingest_atms(db_session, target_count=50)
    mule_ids = generate_mule_accounts(db_session, num_mules=500, cross_state_ratio=0.25)
    # Generate 5 days with 1000 complaints/day for fast test
    total = generate_batch_complaints(db_session, days=5, complaints_per_day=1000, mule_ids=mule_ids)
    assert total >= 4000

    complaints = db_session.query(Complaint).all()
    assert len(complaints) == total

    # Check crime type distribution
    crime_counts = Counter(c.crime_type for c in complaints)
    otp_ratio = crime_counts["otp_fraud"] / total
    atm_ratio = crime_counts["atm_card_fraud"] / total
    inv_ratio = crime_counts["investment_scam"] / total

    # Check within ±5%
    assert 0.40 <= otp_ratio <= 0.50
    assert 0.25 <= atm_ratio <= 0.35
    assert 0.20 <= inv_ratio <= 0.30

    # Check top states
    state_counts = Counter(c.state for c in complaints)
    assert "Uttar Pradesh" in state_counts
    assert "Maharashtra" in state_counts
    assert "Rajasthan" in state_counts


def test_inject_spike_scenario(db_session):
    ingest_atms(db_session, target_count=50)
    result = inject_spike_scenario(db_session, stage="all")

    assert result["status"] == "injected"
    assert len(result["alerts_fired"]) == 2

    # Check alerts in DB
    alerts = db_session.query(Alert).all()
    assert len(alerts) >= 2
    severities = {a.severity for a in alerts}
    assert "CRITICAL" in severities
    assert "WARNING" in severities


def test_stream_live_complaint(db_session):
    ingest_atms(db_session, target_count=50)
    mule_ids = generate_mule_accounts(db_session, num_mules=50)
    comp = stream_live_complaint(db_session, mule_ids=mule_ids)

    assert comp is not None
    assert comp.complaint_id.startswith("COMP_LIVE_")
    assert comp.state is not None
    assert comp.district is not None
    assert comp.crime_type in ["otp_fraud", "atm_card_fraud", "investment_scam"]


def test_reset_database(db_session):
    ingest_atms(db_session, target_count=50)
    generate_mule_accounts(db_session, num_mules=50)
    assert db_session.query(MuleAccount).count() > 0

    reset_database(db_session)
    assert db_session.query(MuleAccount).count() == 0
    assert db_session.query(Complaint).count() == 0
    assert db_session.query(Alert).count() == 0
