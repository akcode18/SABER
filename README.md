# SABER: Satellite-Based AI for Bay of Bengal & Arabian Sea Cyclone Tracking

SABER is an operational tropical cyclone intelligence system tailored for the North Indian Ocean basin (Bay of Bengal & Arabian Sea). It integrates thermal infrared satellite data from ISRO's INSAT-3DR/3DS with numerical environmental flow fields to provide real-time vortex detection, center-fixing, intensity categorization (IMD Scale), 120-hour track forecasts, and coastal district landfall vulnerability alerts.

---

## System Architecture

[ ISRO MOSDAC / INSAT-3DR ]    [ ECMWF / GFS 0.25° NWP ]
│                              │
▼                              ▼
[ Ingestion & Calibration ]    [ Steering Vector Extraction ]
│                              │
└──────────────┬───────────────┘
│
▼
[ Detection & Classification Engine ]
• YOLOv8-OBB Vortex Detection
• Multi-Task Intensity Estimation (IMD Scale)
• 120h Trajectory & Dynamic Uncertainty Cone
│
▼
[ PostgreSQL 16 + PostGIS 3.4 ]
│
▼
[ FastAPI Asynchronous Backend ]
│
▼
[ Next.js 14 + MapLibre GL Dashboard ]
• Official Survey of India Sovereign Boundary
• Real-time Landfall ETA & Surge Risk Drawer


---

## Features
- **Vortex Localization & Classification:** Converts sensor digital numbers to calibrated brightness temperatures (Kelvin) to categorize systems under the IMD 7-stage cyclone scale.
- **Dynamic 120-Hour Forecast Cones:** Computes empirical multi-step error polygons representing forecast uncertainty.
- **Coastal Landfall Vulnerability:** Projects track vectors against major Indian coastal districts (Odisha, West Bengal, Andhra Pradesh, Tamil Nadu, Gujarat) with automatic IMD Red, Orange, and Yellow alert tier assignment.
- **Geographic Compliance:** Implements official Survey of India administrative boundary overlays across Jammu & Kashmir and Ladakh.

---

## Quick Start (Local Setup)

### 1. Prerequisites
- Docker Desktop
- Node.js 20+
- Python 3.11+

### 2. Environment Initialization
```bash
git clone [https://github.com/your-username/saber.git](https://github.com/your-username/saber.git)
cd saber

# Spin up PostGIS and Redis
docker compose up -d postgres redis

# Install Python Backend Dependencies
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt

# Run initial pipeline seeder
$env:PYTHONPATH="."
python scripts/run_pipeline.py
python scripts/seed_historical_track.py


