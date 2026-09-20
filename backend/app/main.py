from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.config import settings
from backend.app.database import Base, engine
from backend.app.routers import (
    admin,
    alerts,
    analytics,
    atms,
    auth,
    complaints,
    demo,
    heatmap,
    investigations,
    mule_accounts,
    network,
    notifications,
    predict,
    predictions,
    reports,
    simulation,
    transactions,
)

app = FastAPI(
    title="Track the Cash API",
    description="Predictive Analytics Framework for Cybercrime Complaints to Forecast Likely Cash Withdrawal Locations",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(auth.legacy_router)
app.include_router(complaints.router)
app.include_router(transactions.router)
app.include_router(mule_accounts.router)
app.include_router(atms.router)
app.include_router(predictions.router)
app.include_router(alerts.router)
app.include_router(alerts.legacy_router)
app.include_router(investigations.router)
app.include_router(network.router)
app.include_router(notifications.router)
app.include_router(admin.router)
app.include_router(demo.router)
app.include_router(predict.router)
app.include_router(heatmap.router)
app.include_router(analytics.router)
app.include_router(reports.router)
app.include_router(simulation.router)

if settings.DATABASE_URL.startswith("sqlite"):
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Track the Cash API"}
