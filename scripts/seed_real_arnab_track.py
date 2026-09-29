# scripts/seed_real_arnab_track.py
from datetime import datetime, timezone
from geoalchemy2.shape import from_shape
from shapely.geometry import Point, LineString
from backend.app.core.database import SessionLocal
from backend.app.models.storm import Storm, StormObservation, ForecastRun

def seed_verified_arnab():
    db = SessionLocal()
    storm_id = "BOB-2026-ARNAB-DD"
    print(f"[*] Ingesting verified IMD track for {storm_id}...")

    try:
        # Clear any earlier test entries
        db.query(ForecastRun).filter(ForecastRun.storm_id.in_([storm_id, "CYCLONE-2026-ARNAB"])).delete()
        db.query(StormObservation).filter(StormObservation.storm_id.in_([storm_id, "CYCLONE-2026-ARNAB"])).delete()
        db.query(Storm).filter(Storm.id.in_([storm_id, "CYCLONE-2026-ARNAB"])).delete()
        db.commit()

        # Real System Record (Classified as DISSIPATED after landfall)
        storm = Storm(
            id=storm_id,
            name="ARNAB (DEEP DEPRESSION)",
            basin="BAY_OF_BENGAL",
            status="DISSIPATED",
            first_detected_at=datetime(2026, 9, 22, 6, 0, tzinfo=timezone.utc)
        )
        db.add(storm)
        db.commit()

        # Verified IMD Track: Central Bay -> Kalingapatnam Landfall -> Nuapada / Chhattisgarh Dissipation
        real_fixes = [
            {"time": "2026-09-22T06:00:00Z", "lat": 16.2, "lon": 86.8, "vmax": 25.0, "mslp": 1002.0, "cat": "Well-Marked Low (WML)"},
            {"time": "2026-09-22T18:00:00Z", "lat": 16.8, "lon": 85.9, "vmax": 28.0, "mslp": 998.0, "cat": "Depression (D)"},
            {"time": "2026-09-23T06:00:00Z", "lat": 17.5, "lon": 85.2, "vmax": 32.0, "mslp": 994.0, "cat": "Deep Depression (DD)"},
            {"time": "2026-09-23T18:00:00Z", "lat": 18.1, "lon": 84.4, "vmax": 35.0, "mslp": 990.0, "cat": "Deep Depression (Peak Intensity)"},
            {"time": "2026-09-24T00:00:00Z", "lat": 18.3, "lon": 84.1, "vmax": 30.0, "mslp": 994.0, "cat": "Landfall (SW of Kalingapatnam)"},
            {"time": "2026-09-24T12:00:00Z", "lat": 19.4, "lon": 83.2, "vmax": 25.0, "mslp": 998.0, "cat": "Inland Depression (Odisha)"},
            {"time": "2026-09-25T06:00:00Z", "lat": 20.5, "lon": 82.5, "vmax": 20.0, "mslp": 1002.0, "cat": "Dissipating Remnant (Nuapada)"},
        ]

        coords = []
        for fix in real_fixes:
            coords.append([fix["lon"], fix["lat"]])
            obs = StormObservation(
                storm_id=storm_id,
                timestamp=datetime.fromisoformat(fix["time"]),
                geom=from_shape(Point(fix["lon"], fix["lat"]), srid=4326),
                vmax_knots=fix["vmax"],
                mslp_hpa=fix["mslp"],
                category=fix["cat"],
                rmw_km=35.0
            )
            db.add(obs)
        db.commit()

        # Save the historical track path
        fc = ForecastRun(
            storm_id=storm_id,
            run_cycle=datetime(2026, 9, 23, 18, 0, tzinfo=timezone.utc),
            model_name="IMD_VERIFIED_TRACK",
            track_path=from_shape(LineString(coords), srid=4326),
            cone_of_uncertainty=None
        )
        db.add(fc)
        db.commit()

        print("[SUCCESS] Verified IMD track for Arnab (Deep Depression) persisted.")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Seeding failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_verified_arnab()