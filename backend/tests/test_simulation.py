import pytest
import httpx
from backend.app.main import app
from backend.app.database import get_db
from backend.app.auth import create_access_token
from backend.scripts.fetch_atms import ingest_atms
from backend.app.models import ATMLocation, Prediction


@pytest.fixture
def admin_token():
    token = create_access_token(data={"sub": "admin_user", "role": "admin"})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def lea_token():
    token = create_access_token(data={"sub": "lea_user", "role": "lea"})
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_simulation_endpoints(db_session, admin_token, lea_token):
    app.dependency_overrides[get_db] = lambda: db_session
    ingest_atms(db_session, target_count=50)

    try:
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
            # 1. Admin inject spike -> 200 OK
            payload = {"stage": "all", "fast": True}
            resp = await client.post("/simulation/inject-spike", json=payload, headers=admin_token)
            assert resp.status_code == 200
            data = resp.json()
            assert data["status"] == "injected"
            assert len(data["alerts_fired"]) == 2
            assert len(data["affected_atms"]) > 0

            # 2. Check predictions were recalculated
            resp_pred = await client.get("/predict", headers=admin_token)
            assert resp_pred.status_code == 200
            preds = resp_pred.json()["predictions"]
            assert len(preds) > 0

            # 3. LEA inject spike -> 403 Forbidden
            resp_lea = await client.post("/simulation/inject-spike", json=payload, headers=lea_token)
            assert resp_lea.status_code == 403

            # 4. Mode switch -> 200 OK
            mode_payload = {"mode": "scripted", "rate_per_second": 1.5}
            resp_mode = await client.post("/simulation/mode", json=mode_payload, headers=admin_token)
            assert resp_mode.status_code == 200
            assert resp_mode.json()["mode"] == "scripted"
            assert resp_mode.json()["rate_per_second"] == 1.5
    finally:
        app.dependency_overrides.pop(get_db, None)
