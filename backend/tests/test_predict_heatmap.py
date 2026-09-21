import time
import pytest
import httpx
import datetime
from backend.app.main import app
from backend.app.database import get_db
from backend.app.auth import create_access_token
from backend.app.models import ATMLocation, Prediction, MuleAccount, utc_now


@pytest.fixture
def auth_header():
    token = create_access_token(data={"sub": "lea_user", "role": "lea"})
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_predict_and_heatmap_unauthorized():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/predict")
        assert resp.status_code == 401

        resp = await client.get("/heatmap")
        assert resp.status_code == 401


@pytest.mark.asyncio
async def test_predict_and_heatmap_endpoints(db_session, auth_header):
    # Seed DB with ATMs and predictions
    now = utc_now()
    atm1 = ATMLocation(
        atm_id="ATM_PRED_001",
        lat=28.6139,
        lng=77.2090,
        state="Delhi",
        district="New Delhi",
        bank_name="SBI"
    )
    atm2 = ATMLocation(
        atm_id="ATM_PRED_002",
        lat=26.8467,
        lng=80.9462,
        state="Uttar Pradesh",
        district="Lucknow",
        bank_name="HDFC"
    )
    db_session.add_all([atm1, atm2])

    p1 = Prediction(atm_id="ATM_PRED_001", risk_score=0.92, predicted_at=now)
    p2 = Prediction(
        atm_id="ATM_PRED_002",
        risk_score=0.35,
        predicted_at=now - datetime.timedelta(hours=25)  # stale
    )
    db_session.add_all([p1, p2])
    db_session.commit()

    # Override get_db in app
    app.dependency_overrides[get_db] = lambda: db_session

    try:
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
            t0 = time.time()
            resp = await client.get("/predict", headers=auth_header)
            latency = time.time() - t0

            assert resp.status_code == 200
            assert latency < 0.300  # < 300ms

            data = resp.json()
            assert "predictions" in data
            preds = data["predictions"]
            assert len(preds) == 2

            # Sorted descending by risk_score
            assert preds[0]["atm_id"] == "ATM_PRED_001"
            assert preds[0]["risk_score"] == 0.92
            assert preds[0]["stale"] is False

            assert preds[1]["atm_id"] == "ATM_PRED_002"
            assert preds[1]["risk_score"] == 0.35
            assert preds[1]["stale"] is True  # > 24 hours old

            # Test filter by state
            resp_filtered = await client.get("/predict?state=Delhi", headers=auth_header)
            assert resp_filtered.status_code == 200
            filtered_data = resp_filtered.json()["predictions"]
            assert len(filtered_data) == 1
            assert filtered_data[0]["state"] == "Delhi"

            # Test /heatmap endpoint
            resp_map = await client.get("/heatmap", headers=auth_header)
            assert resp_map.status_code == 200
            geo = resp_map.json()
            assert geo["type"] == "FeatureCollection"
            assert len(geo["features"]) == 2

            f1 = next(f for f in geo["features"] if f["properties"]["atm_id"] == "ATM_PRED_001")
            assert f1["properties"]["severity"] == "high"
            assert f1["geometry"]["coordinates"] == [77.2090, 28.6139]

            f2 = next(f for f in geo["features"] if f["properties"]["atm_id"] == "ATM_PRED_002")
            assert f2["properties"]["severity"] == "low"

            resp_score = await client.post(
                "/predict/score",
                headers=auth_header,
                json={
                    "state": "Delhi",
                    "district": "New Delhi",
                    "complaint_velocity_6h": 18,
                    "district_fraud_density": 7.5,
                    "mule_proximity_km": 3.5,
                    "atm_count_in_district": 20,
                    "cross_state_flag": True,
                    "limit": 5,
                },
            )
            assert resp_score.status_code == 200
            body = resp_score.json()
            assert "predictions" in body
            assert len(body["predictions"]) >= 1
            assert 0.0 <= body["predictions"][0]["risk_score"] <= 1.0
            assert body["predictions"][0]["state"] == "Delhi"
    finally:
        app.dependency_overrides.pop(get_db, None)
