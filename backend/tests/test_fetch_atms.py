from backend.scripts.fetch_atms import ingest_atms, generate_fallback_atms
from backend.app.models import ATMLocation


def test_generate_fallback_atms():
    atms = generate_fallback_atms(target_count=1000)
    assert len(atms) >= 1000
    for atm in atms:
        assert atm["atm_id"].startswith("ATM_")
        assert -90 <= atm["lat"] <= 90
        assert -180 <= atm["lng"] <= 180
        assert len(atm["state"]) > 0
        assert len(atm["district"]) > 0
        assert len(atm["bank_name"]) > 0


def test_ingest_atms_idempotence(db_session):
    # Run once
    count1 = ingest_atms(db_session, target_count=1000)
    assert count1 >= 1000

    # Run second time
    count2 = ingest_atms(db_session, target_count=1000)
    assert count2 == count1

    # Check DB contents
    first_atm = db_session.query(ATMLocation).first()
    assert first_atm is not None
    assert first_atm.atm_id is not None
    assert first_atm.lat is not None
    assert first_atm.lng is not None
    assert first_atm.state is not None
    assert first_atm.district is not None
