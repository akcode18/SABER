# scripts/run_operational_feed.py
from datetime import datetime, timezone
from geoalchemy2.shape import from_shape
from shapely.geometry import Point, LineString, Polygon

from backend.app.core.database import SessionLocal
from backend.app.models.storm import Storm, StormObservation, ForecastRun
from backend.app.services.mosdac_client import MOSDACClient
from backend.app.services.insat_processor import INSATProcessor
from backend.app.services.ecmwf_client import ECMWFClient
from backend.app.services.detector import CycloneDetector
from backend.app.services.trajectory_predictor import TrajectoryPredictor

def run_operational_cycle():
    print("=" * 65)
    print("SABER OPERATIONAL CYCLE: MOSDAC & ECMWF INGESTION")
    print("=" * 65)

    db = SessionLocal()

    try:
        # 1. Ingest Raw Satellite Product
        raw_hdf5_path = MOSDACClient.fetch_latest_satellite_granule()
        print(f"[1/5] Ingested Satellite Granule: {raw_hdf5_path}")

        # 2. Radiometric Calibration & Spatial Slicing
        sat_matrix = INSATProcessor.process_hdf5(raw_hdf5_path)
        print(f"[2/5] Cropped North Indian Ocean Matrix: {sat_matrix.shape}")

        # 3. Detect Vortices
        detections = CycloneDetector.detect_and_identify(sat_matrix)
        if not detections:
            print("[INFO] No cyclonic vortex found in current frame.")
            return

        storm_info = detections[0]
        storm_id = storm_info["storm_id"]
        print(f"[3/5] Vortex Identified: {storm_id} ({storm_info['category']})")

        # 4. Fetch Live Steering Environment
        ecmwf = ECMWFClient()
        steering = ecmwf.fetch_regional_steering_flow()
        print(f"[4/5] Steering Currents: u={steering['steering_u']} m/s, v={steering['steering_v']} m/s ({steering['source']})")

        # Update or register storm entity
        existing_storm = db.query(Storm).filter(Storm.id == storm_id).first()
        if not existing_storm:
            new_storm = Storm(id=storm_id, name="REMAL", basin=storm_info["basin"], status="ACTIVE")
            db.add(new_storm)
            db.commit()

        # Save Observation Fix
        now = datetime.now(timezone.utc)
        obs_pt = Point(storm_info["lon"], storm_info["lat"])
        obs_record = StormObservation(
            storm_id=storm_id,
            timestamp=now,
            geom=from_shape(obs_pt, srid=4326),
            vmax_knots=storm_info["vmax_knots"],
            mslp_hpa=storm_info["mslp_hpa"],
            category=storm_info["category"],
            rmw_km=35.0
        )
        db.add(obs_record)

        # 5. Calculate Forecast using Live Atmospheric Vector
        forecast = TrajectoryPredictor.forecast_track(
            start_lat=storm_info["lat"],
            start_lon=storm_info["lon"],
            start_vmax=storm_info["vmax_knots"],
            start_mslp=storm_info["mslp_hpa"],
            steering_u=steering["steering_u"],
            steering_v=steering["steering_v"]
        )

        path_geom = LineString(forecast["linestring_coords"])
        cone_geom = Polygon(forecast["cone_polygon"])

        f_run = ForecastRun(
            storm_id=storm_id,
            run_cycle=now,
            model_name=f"PANGU_ECMWF_{steering['source']}",
            track_path=from_shape(path_geom, srid=4326),
            cone_of_uncertainty=from_shape(cone_geom, srid=4326)
        )
        db.add(f_run)
        db.commit()

        print(f"[5/5] Persisted Live Run to PostGIS. Active storm coordinates: ({storm_info['lat']}°N, {storm_info['lon']}°E)")
        print("\n[SUCCESS] Operational cycle completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Cycle execution failed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    run_operational_cycle()