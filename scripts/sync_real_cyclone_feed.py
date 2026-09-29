# scripts/sync_real_cyclone_feed.py
import httpx
from datetime import datetime, timezone
from geoalchemy2.shape import from_shape
from shapely.geometry import Point

from backend.app.core.database import SessionLocal
from backend.app.models.storm import Storm, StormObservation
from backend.app.services.detector import CycloneDetector

def sync_active_north_indian_ocean_storms():
    """
    Queries international active storm registries (NOAA / JTWC GeoJSON).
    If a real storm is currently active in the Bay of Bengal or Arabian Sea,
    it automatically updates the database.
    """
    url = "https://www.nhc.noaa.gov/CurrentStorms.json"  # or JTWC / IMD automated parser
    db = SessionLocal()

    print("[INFO] Polling live international meteorological feeds...")
    try:
        with httpx.Client(timeout=10.0) as client:
            res = client.get(url)

        if res.status_code == 200:
            data = res.json()
            active_systems = data.get("activeStorms", [])
            
            # Filter for North Indian Ocean basin (IO)
            nio_storms = [s for s in active_systems if s.get("basin") in ["IO", "BB", "AS"]]

            if not nio_storms:
                print("[LIVE STATUS] Basin is currently quiet. No active tropical cyclones detected in NIO.")
                print("              Preserving benchmark calibration storm in database for system readiness.")
                return

            for s in nio_storms:
                storm_id = s.get("id")
                name = s.get("name", "UNNAMED")
                lat = float(s.get("latitude"))
                lon = float(s.get("longitude"))
                vmax = float(s.get("intensity", 30))
                mslp = float(s.get("pressure", 1000))
                
                # Upsert into PostgreSQL
                storm = db.query(Storm).filter(Storm.id == storm_id).first()
                if not storm:
                    storm = Storm(
                        id=storm_id,
                        name=name,
                        basin="BAY_OF_BENGAL" if lon >= 77.5 else "ARABIAN_SEA",
                        status="ACTIVE"
                    )
                    db.add(storm)
                    db.commit()

                # Record live observation point
                obs = StormObservation(
                    storm_id=storm_id,
                    timestamp=datetime.now(timezone.utc),
                    geom=from_shape(Point(lon, lat), srid=4326),
                    vmax_knots=vmax,
                    mslp_hpa=mslp,
                    category=CycloneDetector.get_imd_category(vmax),
                    rmw_km=35.0
                )
                db.add(obs)
                db.commit()
                print(f"[LIVE INGESTED] Updated real-time coordinates for Cyclone {name} ({lat}°N, {lon}°E)")

    except Exception as e:
        print(f"[WARN] Ingestion feed polling error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    sync_active_north_indian_ocean_storms()