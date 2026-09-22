import pytest
import httpx
from backend.app.main import app


@pytest.mark.asyncio
async def test_health_check_takes_precedence():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_invalid_api_route_returns_404_json():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/predict/invalid-endpoint-xyz")
        assert resp.status_code == 404
        data = resp.json()
        assert "not found" in data["detail"]


@pytest.mark.asyncio
async def test_spa_client_routes_serve_index_html():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        # Root route
        resp_root = await client.get("/")
        assert resp_root.status_code == 200
        assert "text/html" in resp_root.headers.get("content-type", "")
        assert "<div id=\"root\">" in resp_root.text

        # LEA client-side route
        resp_lea = await client.get("/lea")
        assert resp_lea.status_code == 200
        assert "text/html" in resp_lea.headers.get("content-type", "")
        assert "<div id=\"root\">" in resp_lea.text

        # Admin client-side route
        resp_admin = await client.get("/admin")
        assert resp_admin.status_code == 200
        assert "text/html" in resp_admin.headers.get("content-type", "")

        # Login client-side route
        resp_login = await client.get("/login")
        assert resp_login.status_code == 200
        assert "text/html" in resp_login.headers.get("content-type", "")
