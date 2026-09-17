# 05: FastAPI auth skeleton

**What to build:** The FastAPI application with `POST /auth/login` working end-to-end — hardcoded demo credentials, JWT issuance, and token verification middleware. All other endpoints exist as 501 stubs so the routing structure is established. This is the foundation every other API ticket builds on.

**Blocked by:** 01 (DB must be available for the app to start)

**Status:** resolved

- [x] `POST /auth/login` with `{ "username", "password" }` returns `{ "access_token", "role", "expires_in": 28800 }` for valid credentials
- [x] `lea_user` / `lea_pass` → role `lea`; `admin_user` / `admin_pass` → role `admin`
- [x] Invalid credentials return HTTP 401 with an error message
- [x] Malformed request body returns HTTP 422
- [x] JWT is signed with HS256 using the `JWT_SECRET` env var; token expires after 8 hours
- [x] All protected endpoints require a valid `Authorization: Bearer <token>` header; missing or invalid token returns 401
- [x] Admin-only endpoints return 403 when called with a LEA token
- [x] All non-auth endpoints return 501 (not yet implemented) at this stage — stubs are fine
- [x] **No Docker** — all tests use `httpx.AsyncClient` with `ASGITransport` pointed at the FastAPI app instance; no server process, no ports, no containers
