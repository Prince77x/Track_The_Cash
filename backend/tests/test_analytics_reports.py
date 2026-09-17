import pytest
import httpx
import datetime
from backend.app.main import app
from backend.app.database import get_db
from backend.app.auth import create_access_token
from backend.app.models import Complaint, Prediction, ATMLocation, utc_now


@pytest.fixture
def admin_token():
    token = create_access_token(data={"sub": "admin_user", "role": "admin"})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def lea_token():
    token = create_access_token(data={"sub": "lea_user", "role": "lea"})
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_analytics_velocity_endpoint(db_session, admin_token, lea_token):
    app.dependency_overrides[get_db] = lambda: db_session
    now = utc_now()

    # Seed complaints in UP and Maharashtra
    for d in range(5):
        db_session.add(Complaint(
            complaint_id=f"COMP_UP_{d}",
            timestamp=now - datetime.timedelta(days=d),
            state="Uttar Pradesh",
            district="Lucknow",
            crime_type="otp_fraud",
            amount_inr=30000.0,
            status="pending"
        ))
        db_session.add(Complaint(
            complaint_id=f"COMP_MH_{d}",
            timestamp=now - datetime.timedelta(days=d),
            state="Maharashtra",
            district="Mumbai",
            crime_type="atm_card_fraud",
            amount_inr=40000.0,
            status="pending"
        ))
    db_session.commit()

    try:
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
            # 1. Admin access -> 200 OK
            resp = await client.get("/analytics/velocity?days=7", headers=admin_token)
            assert resp.status_code == 200
            data = resp.json()
            assert "trend" in data
            assert len(data["trend"]) > 0

            # 2. LEA access -> 403 Forbidden
            resp_lea = await client.get("/analytics/velocity", headers=lea_token)
            assert resp_lea.status_code == 403

            # 3. Unauthenticated -> 401
            resp_unauth = await client.get("/analytics/velocity")
            assert resp_unauth.status_code == 401
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_reports_csv_export(db_session, admin_token, lea_token):
    app.dependency_overrides[get_db] = lambda: db_session
    now = utc_now()

    # Seed ATM and prediction
    atm = ATMLocation(
        atm_id="ATM_EXP_001",
        lat=19.0760,
        lng=72.8777,
        state="Maharashtra",
        district="Mumbai",
        bank_name="ICICI Bank"
    )
    db_session.add(atm)
    p = Prediction(atm_id="ATM_EXP_001", risk_score=0.78, predicted_at=now)
    db_session.add(p)
    db_session.commit()

    try:
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
            # 1. Admin download -> 200 OK with CSV
            resp = await client.get("/reports/export", headers=admin_token)
            assert resp.status_code == 200
            assert "text/csv" in resp.headers["content-type"]
            assert 'attachment; filename="predictions.csv"' in resp.headers.get("content-disposition", "")

            csv_text = resp.text
            assert "atm_id,lat,lng,district,state,bank_name,risk_score,predicted_at,cross_state_flag,stale" in csv_text
            assert "ATM_EXP_001" in csv_text
            assert "Maharashtra" in csv_text
            assert "0.78" in csv_text

            # 2. LEA download -> 403
            resp_lea = await client.get("/reports/export", headers=lea_token)
            assert resp_lea.status_code == 403
    finally:
        app.dependency_overrides.pop(get_db, None)
