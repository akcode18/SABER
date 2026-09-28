-- scripts/init_db.sql
-- Enable PostGIS spatial engine
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Tropical Cyclone Registry Table
CREATE TABLE IF NOT EXISTS storms (
    id VARCHAR(64) PRIMARY KEY,              -- e.g., 'SABER-2026-BOB01'
    name VARCHAR(64) DEFAULT 'UNNAMED',      -- e.g., 'DANA', 'REMAL'
    basin VARCHAR(32) NOT NULL,              -- 'BAY_OF_BENGAL' or 'ARABIAN_SEA'
    status VARCHAR(32) NOT NULL,             -- 'ACTIVE', 'LANDFALL', 'DISSIPATED'
    first_detected_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Observed / Live Track Fixes
CREATE TABLE IF NOT EXISTS storm_observations (
    id SERIAL PRIMARY KEY,
    storm_id VARCHAR(64) REFERENCES storms(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL,
    geom GEOMETRY(Point, 4326) NOT NULL,     -- Longitude, Latitude (WGS 84)
    vmax_knots DOUBLE PRECISION,             -- Max Sustained Wind Speed (kt)
    mslp_hpa DOUBLE PRECISION,               -- Minimum Central Pressure (hPa)
    category VARCHAR(32),                    -- IMD scale: 'D', 'DD', 'CS', 'SCS', 'VSCS', 'ESCS', 'SuCS'
    rmw_km DOUBLE PRECISION                  -- Radius of Maximum Winds (km)
);

-- 3. Trajectory Predictions
CREATE TABLE IF NOT EXISTS forecast_runs (
    id SERIAL PRIMARY KEY,
    storm_id VARCHAR(64) REFERENCES storms(id) ON DELETE CASCADE,
    run_cycle TIMESTAMPTZ NOT NULL,          -- Model run timestamp (e.g., 00Z / 12Z)
    model_name VARCHAR(64) NOT NULL,         -- 'PANGU_CUDA', 'GRAPHCAST', 'IMD_OFFICIAL'
    track_path GEOMETRY(LineString, 4326),   -- Forecasted path polyline
    cone_of_uncertainty GEOMETRY(Polygon, 4326) -- Spatial error dispersion polygon
);

-- Spatial Indices (GIST) for sub-millisecond geographic queries
CREATE INDEX IF NOT EXISTS idx_obs_geom ON storm_observations USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_forecast_path ON forecast_runs USING GIST (track_path);
CREATE INDEX IF NOT EXISTS idx_forecast_cone ON forecast_runs USING GIST (cone_of_uncertainty);