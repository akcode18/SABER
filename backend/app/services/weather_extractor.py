# backend/app/services/weather_extractor.py
import numpy as np

class AtmosphericExtractor:
    """
    Extracts key cyclone genesis and steering parameters:
    850 hPa relative vorticity (spinning motion) and MSLP.
    """
    
    @staticmethod
    def calculate_vorticity(u_wind: np.ndarray, v_wind: np.ndarray, dx: float = 25000.0, dy: float = 25000.0) -> np.ndarray:
        """
        Computes vertical component of relative vorticity:
        zeta = (dv/dx) - (du/dy)
        dx, dy in meters for ~0.25 degree resolution (~25 km).
        """
        dv_dx = np.gradient(v_wind, dx, axis=-1)
        du_dy = np.gradient(u_wind, dy, axis=-2)
        vorticity = dv_dx - du_dy
        return vorticity

    @staticmethod
    def generate_synthetic_atmosphere() -> dict:
        """Generates sample 0.25-degree wind and pressure grids for testing."""
        # 121 x 241 grid matches 0°N-30°N, 45°E-105°E at 0.25° spacing
        lat_points, lon_points = 121, 241
        
        # Typical background surface pressure ~1010 hPa
        mslp = np.full((lat_points, lon_points), 1012.0)
        
        # Inject a low-pressure depression in the Bay of Bengal (e.g., 994 hPa)
        y, x = np.ogrid[:lat_points, :lon_points]
        dist = np.sqrt((y - 65)**2 + (x - 170)**2)
        mslp -= 18.0 * np.exp(-dist / 15.0)
        
        # Tangential cyclonic counter-clockwise winds
        u_wind = np.random.normal(0, 2.0, (lat_points, lon_points))
        v_wind = np.random.normal(0, 2.0, (lat_points, lon_points))
        
        return {
            "mslp": mslp.astype(np.float32),
            "u850": u_wind.astype(np.float32),
            "v850": v_wind.astype(np.float32)
        }