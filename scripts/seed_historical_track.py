# scripts/seed_historical_track.py
from datetime import datetime, timedelta, timezone
from geoalchemy2.shape import from_shape
from shapely.geometry import Point

from backend.app.core.database import SessionLocal
from backend.app.models.storm import Storm, StormObservation

def seed_past_track():
    db = SessionLocal()
    storm_id = "SABER-BAY-2026-01"
    
    # Historical fixes leading up to current position over past 24 hours
    # Moves northwestward across the Bay of Bengal
    history = [
        {"dt_hours_ago": 24, "lat": 10.2, "lon": 89.4, "vmax": 25.0, "mslp": 1004.0, "cat": "Depression (D)"},
        {"dt_hours_ago": 18, "lat": 11.1, "lon": 88.5, "vmax": 30.0, "mslp": 1000.0, "cat": "Deep Depression (DD)"},
        {"dt_hours_ago": 12, "lat": 12.0, "lon": 87.4, "vmax": 38.0, "mslp": 992.0, "cat": "Cyclonic Storm (CS)"},
        {"dt_hours_ago": 6,  "lat": 12.9, "lon": 86.6, "vmax": 45.0, "mslp": 984.0, "cat": "Cyclonic Storm (CS)"},
    ]

    now = datetime.now(timezone.utc)
    print(f"Seeding historical track for {storm_id}...")

    for pt in history:
        t_stamp = now - timedelta(hours=pt["dt_hours_ago"])
        obs_point = Point(pt["lon"], pt["lat"])
        obs = StormObservation(
            storm_id=storm_id,
            timestamp=t_stamp,
            geom=from_shape(obs_point, srid=4326),
            vmax_knots=pt["vmax"],
            mslp_hpa=pt["mslp"],
            category=pt["cat"],
            rmw_km=40.0
        )
        db.add(obs)

    db.commit()
    db.close()
    print("[SUCCESS] Past track points inserted into PostGIS.")

if __name__ == "__main__":
    seed_past_track()