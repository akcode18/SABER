# scripts/seed_cyclone_arnab.py
from datetime import datetime, timezone, timedelta
from geoalchemy2.shape import from_shape
from shapely.geometry import Point, LineString, Polygon
from backend.app.core.database import SessionLocal
from backend.app.models.storm import Storm, StormObservation, ForecastRun

def seed_cyclone_arnab():
    db = SessionLocal()
    try:
        storm_id = "CYCLONE-2026-ARNAB"
        print(f"[*] Ingesting Lifecycle Data for: {storm_id}...")

        # 1. Clean existing records for this storm
        db.query(ForecastRun).filter(ForecastRun.storm_id == storm_id).delete()
        db.query(StormObservation).filter(StormObservation.storm_id == storm_id).delete()
        db.query(Storm).filter(Storm.id == storm_id).delete()
        db.commit()

        # 2. Base Storm Entity
        base_time = datetime.now(timezone.utc) - timedelta(hours=36)
        storm = Storm(
            id=storm_id,
            name="ARNAB",
            basin="BAY_OF_BENGAL",
            status="ACTIVE",
            first_detected_at=base_time
        )
        db.add(storm)
        db.commit()

        # 3. Observed Lifetime Track History (Genesis -> Severe Cyclonic Storm)
        track_points = [
            {"offset_h": 0, "lat": 10.8, "lon": 91.5, "vmax": 25.0, "mslp": 1004.0, "cat": "Low Pressure Area"},
            {"offset_h": 12, "lat": 12.2, "lon": 89.4, "vmax": 35.0, "mslp": 998.0, "cat": "Depression (D)"},
            {"offset_h": 24, "lat": 14.1, "lon": 87.2, "vmax": 50.0, "mslp": 988.0, "cat": "Cyclonic Storm (CS)"},
            {"offset_h": 36, "lat": 15.8, "lon": 85.5, "vmax": 75.0, "mslp": 974.0, "cat": "Very Severe Cyclonic Storm (VSCS)"}
        ]

        for pt in track_points:
            obs = StormObservation(
                storm_id=storm_id,
                timestamp=base_time + timedelta(hours=pt["offset_h"]),
                geom=from_shape(Point(pt["lon"], pt["lat"]), srid=4326),
                vmax_knots=pt["vmax"],
                mslp_hpa=pt["mslp"],
                category=pt["cat"],
                rmw_km=28.0
            )
            db.add(obs)
        db.commit()

        # 4. Forward 120-hour Forecast Trajectory to Landfall & Dissipation
        latest_pt = track_points[-1]
        forecast_coords = [
            [latest_pt["lon"], latest_pt["lat"]],
            [84.4, 17.2],  # +12h (Accelerating NW)
            [83.8, 18.5],  # +24h (Approaching North Andhra/South Odisha coast)
            [83.2, 19.8],  # +36h (LANDFALL Zone: Near Gopalpur/Kalingapatnam)
            [82.6, 21.2],  # +48h (Weakening inland over Odisha)
            [82.0, 22.8]   # +72h (Depression remnant over East Central India)
        ]

        # IMD Standard Uncertainty Cone Polygon around forecast path
        cone_coords = [
            [85.5, 15.8],
            [85.6, 17.6],
            [85.2, 19.3],
            [84.6, 20.8],
            [83.8, 22.3],
            [82.0, 23.5],
            [80.5, 22.5],
            [81.8, 20.2],
            [82.4, 18.8],
            [83.0, 17.0],
            [85.5, 15.8]
        ]

        forecast_run = ForecastRun(
            storm_id=storm_id,
            run_cycle=datetime.now(timezone.utc),
            model_name="SABER_GNN_STEERING_OPERATIONAL",
            track_path=from_shape(LineString(forecast_coords), srid=4326),
            cone_of_uncertainty=from_shape(Polygon(cone_coords), srid=4326)
        )
        db.add(forecast_run)
        db.commit()

        print("[SUCCESS] Cyclone ARNAB successfully ingested with observations and landfall forecast.")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to seed Cyclone ARNAB: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_cyclone_arnab()