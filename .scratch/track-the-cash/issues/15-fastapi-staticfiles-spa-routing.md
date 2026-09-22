# 15: FastAPI StaticFiles mounting & SPA fallback routing

**What to build:** Serve the built React single-page application directly from FastAPI using Starlette / FastAPI `StaticFiles`. Implement an SPA fallback route that returns `index.html` for client-side navigation (`/login`, `/lea`, `/admin`, etc.), while ensuring all REST API routes and OpenAPI docs remain functional and invalid API calls return proper JSON 404/errors.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] FastAPI mounts static asset directories (e.g. `frontend/dist/assets` or `static/assets`) on `/assets`
- [x] Root route `/` serves `frontend/dist/index.html`
- [x] Catch-all route handler (`/{full_path:path}`) returns `index.html` for non-API client routes
- [x] All REST endpoints (`/auth`, `/predict`, `/heatmap`, `/alerts`, `/analytics`, `/reports`, `/simulation`, `/docs`, `/openapi.json`) take routing precedence and are never swallowed by the SPA fallback
- [x] Direct browser refreshes on `/lea` and `/admin` render the React app without 404 errors
