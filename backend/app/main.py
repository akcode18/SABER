# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.v1.endpoints import storms

app = FastAPI(
    title="SABER Cyclone Tracking API",
    description="Operational Tropical Cyclone Intelligence System for the North Indian Ocean",
    version="1.0.0"
)

# Allow Next.js frontend to query backend without CORS restrictions
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(storms.router, prefix="/api/v1/storms", tags=["Storms"])

@app.get("/")
def health_check():
    return {
        "project": "SABER",
        "status": "online",
        "monitoring_region": "North Indian Ocean (Bay of Bengal & Arabian Sea)"
    }