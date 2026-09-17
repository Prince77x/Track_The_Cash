import datetime
from sqlalchemy import inspect
from backend.app.models import (
    MuleAccount,
    Complaint,
    ATMLocation,
    ATMRiskHistory,
    Prediction,
    Alert
)


def test_tables_created(test_engine):
    inspector = inspect(test_engine)
    table_names = inspector.get_table_names()

    expected_tables = {
        "mule_accounts",
        "complaints",
        "atm_locations",
        "atm_risk_history",
        "predictions",
        "alerts"
    }
    assert expected_tables.issubset(set(table_names))


def test_insert_and_query_models(db_session):
    now = datetime.datetime.now(datetime.timezone.utc)

    # 1. ATM location
    atm = ATMLocation(
        atm_id="ATM_TEST_001",
        lat=28.6139,
        lng=77.2090,
        state="Delhi",
        district="New Delhi",
        bank_name="SBI"
    )
    db_session.add(atm)

    # 2. Mule Account
    mule = MuleAccount(
        mule_id="MULE_TEST_001",
        registered_state="Uttar Pradesh",
        registered_district="Noida",
        registered_lat=28.5355,
        registered_lng=77.3910,
        account_bank="HDFC",
        is_cross_state=True,
        linked_atm_ids=["ATM_TEST_001"]
    )
    db_session.add(mule)

    # 3. Complaint
    complaint = Complaint(
        complaint_id="COMP_TEST_001",
        timestamp=now,
        state="Rajasthan",
        district="Jaipur",
        crime_type="otp_fraud",
        amount_inr=50000.0,
        mule_account_id="MULE_TEST_001",
        status="pending"
    )
    db_session.add(complaint)

    # 4. ATM Risk History
    history = ATMRiskHistory(
        atm_id="ATM_TEST_001",
        date=datetime.date.today(),
        risk_score=0.85,
        complaint_count=12,
        spike_flag=True,
        district="New Delhi",
        state="Delhi"
    )
    db_session.add(history)

    # 5. Prediction
    pred = Prediction(
        atm_id="ATM_TEST_001",
        risk_score=0.88,
        predicted_at=now
    )
    db_session.add(pred)

    # 6. Alert
    alert = Alert(
        district="Noida",
        state="Uttar Pradesh",
        severity="CRITICAL",
        detected_at=now,
        triggered_by="auto",
        complaint_count=25,
        rolling_avg=8.5,
        cross_state=True,
        message="Velocity spike in Noida"
    )
    db_session.add(alert)
    db_session.commit()

    # Query back
    queried_atm = db_session.query(ATMLocation).filter_by(atm_id="ATM_TEST_001").first()
    assert queried_atm is not None
    assert queried_atm.bank_name == "SBI"

    queried_complaint = db_session.query(Complaint).filter_by(complaint_id="COMP_TEST_001").first()
    assert queried_complaint is not None
    assert queried_complaint.mule_account.is_cross_state is True

    queried_alert = db_session.query(Alert).filter_by(district="Noida").first()
    assert queried_alert is not None
    assert queried_alert.severity == "CRITICAL"
