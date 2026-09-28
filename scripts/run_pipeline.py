# scripts/run_pipeline.py
from datetime import datetime, timezone
from geoalchemy2.shape import from_shape
from shapely.geometry import Point, LineString, Polygon

from backend.app.core.database import SessionLocal
from backend.app.models.storm import Storm, StormObservation, ForecastRun
from backend.app.services.insat_processor import INSATProcessor
from backend.app.services.detector import CycloneDetector
from backend.app.services.trajectory_predictor import TrajectoryPredictor

def main():
    print("=" * 60)
    print("RUNNING SABER LOCAL PIPELINE (Detection -> Predict -> DB)")
    print("=" * 60)

    db = SessionLocal()

    try:
        # 1. Ingestion
        print("\n[1/4] Ingesting North Indian Ocean Satellite Matrix...")
        frame = INSATProcessor.generate_synthetic_frame()

        # 2. Detection & Identification
        print("[2/4] Running Detection & Identification Engine...")
        storms = CycloneDetector.detect_and_identify(frame)
        if not storms:
            print("[INFO] No active cyclonic systems detected.")
            return

        active_storm = storms[0]
        storm_id = active_storm["storm_id"]
        print(f"      -> Detected: {storm_id} | Category: {active_storm['category']}")

        # Register storm
        existing_storm = db.query(Storm).filter(Storm.id == storm_id).first()
        if not existing_storm:
            new_storm = Storm(
                id=storm_id,
                name="UNNAMED",
                basin=active_storm["basin"],
                status="ACTIVE"
            )
            db.add(new_storm)
            db.commit()
            print(f"      -> Stored storm record in DB: {storm_id}")

        # 3. Store Observation Point
        now_utc = datetime.now(timezone.utc)
        obs_point = Point(active_storm["lon"], active_storm["lat"]) # Longitude first in GIS
        obs_record = StormObservation(
            storm_id=storm_id,
            timestamp=now_utc,
            geom=from_shape(obs_point, srid=4326),
            vmax_knots=active_storm["vmax_knots"],
            mslp_hpa=active_storm["mslp_hpa"],
            category=active_storm["category"],
            rmw_km=35.0
        )
        db.add(obs_record)
        db.commit()
        print(f"      -> Stored Observation Point: ({active_storm['lat']}°N, {active_storm['lon']}°E)")

        # 4. Generate Trajectory & Uncertainty Cone
        print("\n[3/4] Computing 120h Trajectory & Uncertainty Cone...")
        forecast = TrajectoryPredictor.forecast_track(
            start_lat=active_storm["lat"],
            start_lon=active_storm["lon"],
            start_vmax=active_storm["vmax_knots"],
            start_mslp=active_storm["mslp_hpa"]
        )

        path_geom = LineString(forecast["linestring_coords"])
        cone_geom = Polygon(forecast["cone_polygon"])

        forecast_record = ForecastRun(
            storm_id=storm_id,
            run_cycle=now_utc,
            model_name="SABER_LOCAL_V1",
            track_path=from_shape(path_geom, srid=4326),
            cone_of_uncertainty=from_shape(cone_geom, srid=4326)
        )
        db.add(forecast_record)
        db.commit()
        print(f"      -> Stored Forecast Run: LineString ({len(forecast['linestring_coords'])} points)")
        print(f"      -> Stored Uncertainty Cone: Polygon ({len(forecast['cone_polygon'])} vertices)")

        print("\n[4/4] Pipeline Complete! All data saved into PostGIS.")

    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] Pipeline failed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()