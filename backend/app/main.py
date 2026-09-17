from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
