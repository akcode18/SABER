# scripts/run_real_satellite_feed.py
import os
from datetime import datetime, timezone
from geoalchemy2.shape import from_shape
from shapely.geometry import Point, LineString, Polygon

from backend.app.core.database import SessionLocal
from backend.app.models.storm import Storm, StormObservation, ForecastRun
from backend.app.services.insat_processor import INSATProcessor
from backend.app.services.detector import CycloneDetector
from backend.app.services.trajectory_predictor import TrajectoryPredictor

H5_PATH = "data/satellite_raw/3RIMG_20260927_1249_L1B_STD.h5"

def process_real_satellite():
    print("=" * 65)
    print("INGESTING ACTUAL INSAT-3DR/3DS LEVEL-1B SATELLITE DATA")
    print("=" * 65)

    if not os.path.exists(H5_PATH):
        print(f"[ERROR] Cannot find {H5_PATH}. Check file path.")
        return

    # 1. Ingest, calibrate to Kelvin, crop to NIO [0-30°N, 45-105°E]
    print(f"\n[1/4] Processing HDF5 array from: {H5_PATH}")
    sat_matrix = INSATProcessor.process_hdf5(H5_PATH)
    print(f"      -> Processed matrix shape: {sat_matrix.shape}")
    print(f"      -> Min Brightness Temp (convective core): {sat_matrix.min():.3f}")

    # 2. Run real-time detection & vortex center fix
    print("[2/4] Running automated vortex localization & intensity estimation...")
    detections = CycloneDetector.detect_and_identify(sat_matrix)

    if not detections:
        print("[INFO] No active cyclonic systems detected in current satellite frame.")
        return

    storm_info = detections[0]
    storm_id = storm_info["storm_id"]
    print(f"      -> Identified System: {storm_id}")
    print(f"      -> Center: {storm_info['lat']}°N, {storm_info['lon']}°E")
    print(f"      -> Peak Sustained Wind: {storm_info['vmax_knots']} kt ({storm_info['category']})")
    print(f"      -> Central Minimum Pressure: {storm_info['mslp_hpa']} hPa")

    # 3. Save to PostGIS database
    db = SessionLocal()
    try:
        storm = db.query(Storm).filter(Storm.id == storm_id).first()
        if not storm:
            storm = Storm(
                id=storm_id,
                name="ACTIVE SYSTEM",
                basin=storm_info["basin"],
                status="ACTIVE"
            )
            db.add(storm)
            db.commit()

        # Add timestamped live observation fix
        now_utc = datetime.now(timezone.utc)
        obs = StormObservation(
            storm_id=storm_id,
            timestamp=now_utc,
            geom=from_shape(Point(storm_info["lon"], storm_info["lat"]), srid=4326),
            vmax_knots=storm_info["vmax_knots"],
            mslp_hpa=storm_info["mslp_hpa"],
            category=storm_info["category"],
            rmw_km=30.0
        )
        db.add(obs)
        db.commit()

        # 4. Generate 120-hour forecast trajectory & cone from real position
        print("\n[3/4] Computing real-time steering trajectory & cone of uncertainty...")
        forecast = TrajectoryPredictor.forecast_track(
            start_lat=storm_info["lat"],
            start_lon=storm_info["lon"],
            start_vmax=storm_info["vmax_knots"],
            start_mslp=storm_info["mslp_hpa"]
        )

        # Clear older forecast runs for this storm
        db.query(ForecastRun).filter(ForecastRun.storm_id == storm_id).delete()
        db.commit()

        forecast_record = ForecastRun(
            storm_id=storm_id,
            run_cycle=now_utc,
            model_name="SABER_REALTIME_STEERING",
            track_path=from_shape(LineString(forecast["linestring_coords"]), srid=4326),
            cone_of_uncertainty=from_shape(Polygon(forecast["cone_polygon"]), srid=4326)
        )
        db.add(forecast_record)
        db.commit()

        print("[4/4] Live database updated! Refresh your web browser.")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Database save failed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    process_real_satellite()