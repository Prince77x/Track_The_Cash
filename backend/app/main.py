import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from backend.app.routers import (
    auth,
    predict,
    heatmap,
    alerts,
    analytics,
    reports,
    simulation
)

app = FastAPI(
    title="Track the Cash API",
    description="AI-Powered Predictive Analytics Framework for Cybercrime Cash-Out Hotspots",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register REST API routers
app.include_router(auth.router)
app.include_router(predict.router)
app.include_router(heatmap.router)
app.include_router(alerts.router)
app.include_router(analytics.router)
app.include_router(reports.router)
app.include_router(simulation.router)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Track the Cash API"}


# Determine static / frontend dist directory
FRONTEND_DIST = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
)

# Mount /assets if frontend has been built
assets_dir = os.path.join(FRONTEND_DIST, "assets")
if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")


@app.get("/{full_path:path}", include_in_schema=False)
async def serve_spa_or_static(full_path: str = ""):
    # 1. If requesting a specific file that exists inside dist (e.g., favicon, icons)
    if full_path:
        target_file = os.path.join(FRONTEND_DIST, full_path)
        if os.path.isfile(target_file):
            return FileResponse(target_file)

    # 2. Known API prefixes: if reached here, it means the API route does not exist -> 404
    api_prefixes = (
        "auth",
        "predict",
        "heatmap",
        "alerts",
        "analytics",
        "reports",
        "simulation",
        "health",
        "docs",
        "openapi.json",
        "redoc"
    )
    first_segment = full_path.split("/")[0] if full_path else ""
    if first_segment in api_prefixes:
        raise HTTPException(
            status_code=404,
            detail=f"API endpoint '/{full_path}' not found"
        )

    # 3. For all client-side React routes (/login, /lea, /admin, /) return index.html
    index_file = os.path.join(FRONTEND_DIST, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)

    return {
        "status": "online",
        "service": "Track the Cash API",
        "notice": "Frontend build not found. Run 'npm run build' in frontend directory."
    }
