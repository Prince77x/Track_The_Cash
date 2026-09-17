import pytest
import httpx
from backend.app.main import app


@pytest.mark.asyncio
async def test_auth_login_lea_success():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/auth/login",
            json={"username": "lea_user", "password": "lea_pass"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["role"] == "lea"
        assert data["expires_in"] == 28800


@pytest.mark.asyncio
async def test_auth_login_admin_success():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/auth/login",
            json={"username": "admin_user", "password": "admin_pass"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["role"] == "admin"


@pytest.mark.asyncio
async def test_auth_login_invalid_credentials():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/auth/login",
            json={"username": "wrong_user", "password": "wrong_password"}
        )
        assert response.status_code == 401
        assert "Invalid username or password" in response.json()["detail"]


@pytest.mark.asyncio
async def test_auth_login_malformed_body():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/auth/login",
            json={"username": "lea_user"}  # missing password
        )
        assert response.status_code == 422
