# scripts/seed_historical_cyclones.py
from backend.app.core.database import engine

COMPREHENSIVE_HISTORICAL_DATA = [
    {
        "id": "HIST-1999-ODISHA-SUPER",
        "name": "ODISHA 1999",
        "basin": "BAY_OF_BENGAL",
        "status": "HISTORICAL",
        "start_date": "1999-10-25 00:00:00+00",
        "fixes": [
            {"lat": 11.5, "lon": 95.5, "vmax": 35.0, "mslp": 1004.0, "cat": "Cyclonic Storm"},
            {"lat": 14.5, "lon": 90.5, "vmax": 75.0, "mslp": 980.0, "cat": "Very Severe CS"},
            {"lat": 17.0, "lon": 88.0, "vmax": 120.0, "mslp": 938.0, "cat": "Extremely Severe CS"},
            {"lat": 19.0, "lon": 87.0, "vmax": 140.0, "mslp": 912.0, "cat": "Super Cyclonic Storm"},
            {"lat": 19.9, "lon": 86.6, "vmax": 140.0, "mslp": 912.0, "cat": "Super Cyclonic Storm"},  # Landfall Paradip
            {"lat": 20.5, "lon": 86.4, "vmax": 65.0, "mslp": 978.0, "cat": "Very Severe CS"}
        ]
    },
    {
        "id": "HIST-2014-HUDHUD",
        "name": "HUDHUD",
        "basin": "BAY_OF_BENGAL",
        "status": "HISTORICAL",
        "start_date": "2014-10-07 06:00:00+00",
        "fixes": [
            {"lat": 11.8, "lon": 92.5, "vmax": 35.0, "mslp": 1000.0, "cat": "Cyclonic Storm"},
            {"lat": 14.0, "lon": 88.5, "vmax": 60.0, "mslp": 988.0, "cat": "Severe CS"},
            {"lat": 16.0, "lon": 85.5, "vmax": 85.0, "mslp": 965.0, "cat": "Very Severe CS"},
            {"lat": 17.7, "lon": 83.3, "vmax": 115.0, "mslp": 940.0, "cat": "Extremely Severe CS"},  # Landfall Visakhapatnam
            {"lat": 18.5, "lon": 82.5, "vmax": 50.0, "mslp": 990.0, "cat": "Severe CS"}
        ]
    },
    {
        "id": "HIST-2017-OCKHI",
        "name": "OCKHI",
        "basin": "ARABIAN_SEA",
        "status": "HISTORICAL",
        "start_date": "2017-11-29 00:00:00+00",
        "fixes": [
            {"lat": 6.5, "lon": 80.5, "vmax": 30.0, "mslp": 1004.0, "cat": "Deep Depression"},
            {"lat": 7.5, "lon": 77.5, "vmax": 45.0, "mslp": 996.0, "cat": "Cyclonic Storm"},        # South of Kanyakumari
            {"lat": 8.8, "lon": 74.2, "vmax": 85.0, "mslp": 975.0, "cat": "Very Severe CS"},
            {"lat": 11.5, "lon": 70.0, "vmax": 95.0, "mslp": 962.0, "cat": "Very Severe CS"},
            {"lat": 16.5, "lon": 70.2, "vmax": 55.0, "mslp": 990.0, "cat": "Severe CS"},
            {"lat": 20.0, "lon": 72.0, "vmax": 30.0, "mslp": 1002.0, "cat": "Deep Depression"}
        ]
    },
    {
        "id": "HIST-2018-TITLI",
        "name": "TITLI",
        "basin": "BAY_OF_BENGAL",
        "status": "HISTORICAL",
        "start_date": "2018-10-08 00:00:00+00",
        "fixes": [
            {"lat": 14.0, "lon": 88.8, "vmax": 35.0, "mslp": 1000.0, "cat": "Cyclonic Storm"},
            {"lat": 16.5, "lon": 86.0, "vmax": 65.0, "mslp": 984.0, "cat": "Very Severe CS"},
            {"lat": 18.8, "lon": 84.5, "vmax": 85.0, "mslp": 970.0, "cat": "Very Severe CS"},       # Landfall Palasa, AP/Odisha
            {"lat": 19.5, "lon": 84.8, "vmax": 45.0, "mslp": 992.0, "cat": "Cyclonic Storm"}
        ]
    },
    {
        "id": "HIST-2019-FANI",
        "name": "FANI",
        "basin": "BAY_OF_BENGAL",
        "status": "HISTORICAL",
        "start_date": "2019-04-26 06:00:00+00",
        "fixes": [
            {"lat": 5.2, "lon": 88.5, "vmax": 25.0, "mslp": 1004.0, "cat": "Depression"},
            {"lat": 8.0, "lon": 86.9, "vmax": 45.0, "mslp": 994.0, "cat": "Cyclonic Storm"},
            {"lat": 11.5, "lon": 84.8, "vmax": 75.0, "mslp": 974.0, "cat": "Very Severe CS"},
            {"lat": 15.1, "lon": 84.1, "vmax": 115.0, "mslp": 937.0, "cat": "Extremely Severe CS"},
            {"lat": 19.6, "lon": 85.8, "vmax": 110.0, "mslp": 942.0, "cat": "Extremely Severe CS"}, # Landfall Puri, Odisha
            {"lat": 21.0, "lon": 86.8, "vmax": 50.0, "mslp": 985.0, "cat": "Severe CS"}
        ]
    },
    {
        "id": "HIST-2020-AMPHAN",
        "name": "AMPHAN",
        "basin": "BAY_OF_BENGAL",
        "status": "HISTORICAL",
        "start_date": "2020-05-16 00:00:00+00",
        "fixes": [
            {"lat": 10.4, "lon": 86.4, "vmax": 35.0, "mslp": 1000.0, "cat": "Cyclonic Storm"},
            {"lat": 11.8, "lon": 86.2, "vmax": 65.0, "mslp": 982.0, "cat": "Very Severe CS"},
            {"lat": 13.5, "lon": 86.3, "vmax": 115.0, "mslp": 940.0, "cat": "Extremely Severe CS"},
            {"lat": 15.6, "lon": 86.7, "vmax": 140.0, "mslp": 907.0, "cat": "Super Cyclonic Storm"},
            {"lat": 18.2, "lon": 87.2, "vmax": 105.0, "mslp": 950.0, "cat": "Extremely Severe CS"},
            {"lat": 21.6, "lon": 88.3, "vmax": 85.0, "mslp": 960.0, "cat": "Very Severe CS"},      # Landfall West Bengal/Sundarbans
            {"lat": 23.0, "lon": 88.8, "vmax": 45.0, "mslp": 988.0, "cat": "Cyclonic Storm"}
        ]
    },
    {
        "id": "HIST-2021-TAUKTAE",
        "name": "TAUKTAE",
        "basin": "ARABIAN_SEA",
        "status": "HISTORICAL",
        "start_date": "2021-05-14 00:00:00+00",
        "fixes": [
            {"lat": 10.5, "lon": 72.8, "vmax": 30.0, "mslp": 1004.0, "cat": "Deep Depression"},
            {"lat": 13.0, "lon": 72.5, "vmax": 50.0, "mslp": 992.0, "cat": "Severe CS"},
            {"lat": 16.0, "lon": 71.5, "vmax": 80.0, "mslp": 970.0, "cat": "Very Severe CS"},
            {"lat": 19.0, "lon": 71.0, "vmax": 115.0, "mslp": 948.0, "cat": "Extremely Severe CS"},
            {"lat": 20.8, "lon": 71.1, "vmax": 95.0, "mslp": 960.0, "cat": "Very Severe CS"},       # Landfall Saurashtra/Una, Gujarat
            {"lat": 22.5, "lon": 71.8, "vmax": 40.0, "mslp": 995.0, "cat": "Cyclonic Storm"}
        ]
    },
    {
        "id": "HIST-2021-YAAS",
        "name": "YAAS",
        "basin": "BAY_OF_BENGAL",
        "status": "HISTORICAL",
        "start_date": "2021-05-23 00:00:00+00",
        "fixes": [
            {"lat": 16.0, "lon": 90.0, "vmax": 35.0, "mslp": 998.0, "cat": "Cyclonic Storm"},
            {"lat": 18.0, "lon": 88.5, "vmax": 55.0, "mslp": 985.0, "cat": "Severe CS"},
            {"lat": 20.5, "lon": 87.5, "vmax": 75.0, "mslp": 970.0, "cat": "Very Severe CS"},
            {"lat": 21.3, "lon": 87.0, "vmax": 75.0, "mslp": 970.0, "cat": "Very Severe CS"},       # Landfall South of Balasore, Odisha
            {"lat": 22.5, "lon": 86.0, "vmax": 35.0, "mslp": 992.0, "cat": "Cyclonic Storm"}
        ]
    },
    {
        "id": "HIST-2022-MANDOUS",
        "name": "MANDOUS",
        "basin": "BAY_OF_BENGAL",
        "status": "HISTORICAL",
        "start_date": "2022-12-06 12:00:00+00",
        "fixes": [
            {"lat": 9.2, "lon": 84.8, "vmax": 35.0, "mslp": 1002.0, "cat": "Cyclonic Storm"},
            {"lat": 10.8, "lon": 82.5, "vmax": 50.0, "mslp": 992.0, "cat": "Severe CS"},
            {"lat": 12.3, "lon": 80.5, "vmax": 45.0, "mslp": 998.0, "cat": "Cyclonic Storm"},
            {"lat": 12.6, "lon": 80.2, "vmax": 40.0, "mslp": 1000.0, "cat": "Cyclonic Storm"}       # Landfall Mamallapuram, Tamil Nadu
        ]
    },
    {
        "id": "HIST-2023-BIPARJOY",
        "name": "BIPARJOY",
        "basin": "ARABIAN_SEA",
        "status": "HISTORICAL",
        "start_date": "2023-06-06 00:00:00+00",
        "fixes": [
            {"lat": 12.0, "lon": 66.0, "vmax": 30.0, "mslp": 1002.0, "cat": "Deep Depression"},
            {"lat": 13.9, "lon": 66.0, "vmax": 55.0, "mslp": 988.0, "cat": "Severe CS"},
            {"lat": 17.0, "lon": 67.2, "vmax": 90.0, "mslp": 956.0, "cat": "Extremely Severe CS"},
            {"lat": 20.8, "lon": 66.9, "vmax": 75.0, "mslp": 970.0, "cat": "Very Severe CS"},
            {"lat": 23.2, "lon": 68.6, "vmax": 65.0, "mslp": 978.0, "cat": "Very Severe CS"},       # Landfall Naliya/Kutch, Gujarat
            {"lat": 24.5, "lon": 70.5, "vmax": 35.0, "mslp": 995.0, "cat": "Cyclonic Storm"}
        ]
    },
    {
        "id": "HIST-2023-MICHAUNG",
        "name": "MICHAUNG",
        "basin": "BAY_OF_BENGAL",
        "status": "HISTORICAL",
        "start_date": "2023-12-01 00:00:00+00",
        "fixes": [
            {"lat": 10.0, "lon": 84.5, "vmax": 35.0, "mslp": 1002.0, "cat": "Cyclonic Storm"},
            {"lat": 12.8, "lon": 81.2, "vmax": 50.0, "mslp": 992.0, "cat": "Severe CS"},            # Inundation of Chennai Coast
            {"lat": 15.2, "lon": 80.3, "vmax": 55.0, "mslp": 988.0, "cat": "Severe CS"},            # Landfall Bapatla, Andhra Pradesh
            {"lat": 16.5, "lon": 80.5, "vmax": 30.0, "mslp": 1002.0, "cat": "Deep Depression"}
        ]
    },
    {
        "id": "HIST-2024-REMAL",
        "name": "REMAL",
        "basin": "BAY_OF_BENGAL",
        "status": "HISTORICAL",
        "start_date": "2024-05-24 00:00:00+00",
        "fixes": [
            {"lat": 15.0, "lon": 88.5, "vmax": 30.0, "mslp": 1002.0, "cat": "Deep Depression"},
            {"lat": 18.2, "lon": 89.2, "vmax": 45.0, "mslp": 994.0, "cat": "Cyclonic Storm"},
            {"lat": 20.8, "lon": 89.4, "vmax": 60.0, "mslp": 984.0, "cat": "Severe CS"},
            {"lat": 21.9, "lon": 89.3, "vmax": 65.0, "mslp": 980.0, "cat": "Severe CS"},            # Landfall Sagar Island / Khepupara
            {"lat": 23.5, "lon": 90.0, "vmax": 35.0, "mslp": 995.0, "cat": "Cyclonic Storm"}
        ]
    },
    {
        "id": "HIST-2024-DANA",
        "name": "DANA",
        "basin": "BAY_OF_BENGAL",
        "status": "HISTORICAL",
        "start_date": "2024-10-22 00:00:00+00",
        "fixes": [
            {"lat": 14.5, "lon": 90.0, "vmax": 30.0, "mslp": 1004.0, "cat": "Deep Depression"},
            {"lat": 16.8, "lon": 89.1, "vmax": 45.0, "mslp": 996.0, "cat": "Cyclonic Storm"},
            {"lat": 19.5, "lon": 88.0, "vmax": 60.0, "mslp": 986.0, "cat": "Severe CS"},
            {"lat": 20.8, "lon": 86.9, "vmax": 65.0, "mslp": 982.0, "cat": "Severe CS"},            # Landfall Dhamra/Kendrapara, Odisha
            {"lat": 21.6, "lon": 86.2, "vmax": 35.0, "mslp": 998.0, "cat": "Cyclonic Storm"}
        ]
    }
]

def seed_archive():
    print("=" * 65)
    print("SEEDING COMPREHENSIVE NORTH INDIAN OCEAN CYCLONE ARCHIVE (1999–2024)")
    print("=" * 65)

    with engine.raw_connection() as raw_conn:
        cursor = raw_conn.cursor()
        try:
            for c in COMPREHENSIVE_HISTORICAL_DATA:
                storm_id = c["id"]
                name = c["name"]
                basin = c["basin"]
                status = c["status"]
                first_detected = c["start_date"]

                # 1. Upsert Storm Entity
                cursor.execute(f"""
                    INSERT INTO storms (id, name, basin, status, first_detected_at, last_updated_at)
                    VALUES ('{storm_id}', '{name}', '{basin}', '{status}', '{first_detected}', NOW())
                    ON CONFLICT (id) DO UPDATE SET 
                        name = EXCLUDED.name,
                        status = EXCLUDED.status,
                        first_detected_at = EXCLUDED.first_detected_at;
                """)

                # 2. Clear old observation fixes for this storm
                cursor.execute(f"DELETE FROM storm_observations WHERE storm_id = '{storm_id}';")

                # 3. Direct PostGIS geometry inserts
                for pt in c["fixes"]:
                    lon = pt["lon"]
                    lat = pt["lat"]
                    vmax = pt["vmax"]
                    mslp = pt["mslp"]
                    cat = pt["cat"].replace("'", "''")

                    sql = f"""
                        INSERT INTO storm_observations (
                            storm_id, timestamp, geom, vmax_knots, mslp_hpa, category, rmw_km
                        ) VALUES (
                            '{storm_id}',
                            '{first_detected}',
                            ST_SetSRID(ST_MakePoint({lon}, {lat}), 4326),
                            {vmax},
                            {mslp},
                            '{cat}',
                            30.0
                        );
                    """
                    cursor.execute(sql)

                print(f" -> Persisted: Cyclone {name:<16} ({basin:<14}) | Fixes: {len(c['fixes'])}")

            raw_conn.commit()
            print("\n[SUCCESS] All historical cyclones seeded into PostGIS successfully!")

        except Exception as e:
            raw_conn.rollback()
            print(f"[ERROR] Seeding failed: {e}")
            raise
        finally:
            cursor.close()

if __name__ == "__main__":
    seed_archive()