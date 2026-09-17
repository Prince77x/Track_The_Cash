import pytest
import httpx
import datetime
from unittest.mock import patch
from backend.app.main import app
from backend.app.database import get_db
from backend.app.auth import create_access_token
from backend.app.models import Complaint, Alert, MuleAccount, utc_now
from backend.app.ml.spike_detector import evaluate_spike_rule, detect_spikes


def test_evaluate_spike_rule_edge_cases():
    # 1. Zero rolling average -> no spike
    is_spike, sev = evaluate_spike_rule(count_6h=10, rolling_avg_7d=0.0)
    assert is_spike is False
    assert sev is None

    # 2. Count exactly equals 2x rolling avg -> no spike
    is_spike, sev = evaluate_spike_rule(count_6h=10, rolling_avg_7d=5.0)
    assert is_spike is False

    # 3. Count exceeds 2x rolling avg -> WARNING
    is_spike, sev = evaluate_spike_rule(count_6h=11, rolling_avg_7d=5.0, is_cross_state=False)
    assert is_spike is True
    assert sev == "WARNING"

    # 4. Count exceeds 2x rolling avg with cross-state -> CRITICAL
    is_spike, sev = evaluate_spike_rule(count_6h=11, rolling_avg_7d=5.0, is_cross_state=True)
    assert is_spike is True
    assert sev == "CRITICAL"


@pytest.fixture
def admin_token():
    token = create_access_token(data={"sub": "admin_user", "role": "admin"})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def lea_token():
    token = create_access_token(data={"sub": "lea_user", "role": "lea"})
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_alerts_endpoints_and_deduplication(db_session, admin_token, lea_token):
    app.dependency_overrides[get_db] = lambda: db_session
    now = utc_now()

    # Seed complaints in Noida: past 7 days baseline + last 6h spike
    # Baseline: 1 complaint/day for 6 days
    for d in range(1, 7):
        db_session.add(Complaint(
            complaint_id=f"COMP_BASE_{d}",
            timestamp=now - datetime.timedelta(days=d),
            state="Uttar Pradesh",
            district="Noida",
            crime_type="otp_fraud",
            amount_inr=20000.0,
            status="resolved"
        ))

    # Spike in last 6h: 20 complaints
    for i in range(20):
        db_session.add(Complaint(
            complaint_id=f"COMP_SPIKE_{i}",
            timestamp=now - datetime.timedelta(minutes=30),
            state="Uttar Pradesh",
            district="Noida",
            crime_type="otp_fraud",
            amount_inr=50000.0,
            status="pending"
        ))

    db_session.commit()

    try:
        with patch("backend.app.ml.spike_detector.send_alert_email") as mock_send_email:
            mock_send_email.return_value = {"status": "sent"}

            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
                # 1. First spike check
                resp = await client.get("/alerts/spike-check", headers=lea_token)
                assert resp.status_code == 200
                data = resp.json()
                assert len(data["spikes"]) >= 1
                spike_noida = next(s for s in data["spikes"] if s["district"] == "Noida")
                assert spike_noida["complaint_count"] == 20
                assert spike_noida["severity"] in ["WARNING", "CRITICAL"]

                # Check email was dispatched once
                assert mock_send_email.call_count == 1

                # 2. Second spike check immediately -> deduplication prevents duplicate email
                resp2 = await client.get("/alerts/spike-check", headers=lea_token)
                assert resp2.status_code == 200
                # Email call count should still be 1 (deduplicated)
                assert mock_send_email.call_count == 1

                # 3. Manual alert trigger with Admin token -> 200 OK
                manual_payload = {
                    "district": "Jaipur",
                    "severity": "CRITICAL",
                    "message": "Manual emergency field alert for Jaipur ATM zone"
                }
                resp_manual = await client.post("/alerts/trigger", json=manual_payload, headers=admin_token)
                assert resp_manual.status_code == 200
                assert resp_manual.json()["status"] == "sent"

                # 4. Manual alert trigger with LEA token -> 403 Forbidden
                resp_forbidden = await client.post("/alerts/trigger", json=manual_payload, headers=lea_token)
                assert resp_forbidden.status_code == 403

                # 5. Alert feed endpoint
                resp_feed = await client.get("/alerts/feed", headers=lea_token)
                assert resp_feed.status_code == 200
                feed = resp_feed.json()
                assert len(feed) >= 2  # Includes auto spike and manual trigger
    finally:
        app.dependency_overrides.pop(get_db, None)
