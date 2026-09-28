# backend/app/services/trajectory_predictor.py
import math
from typing import List, Dict, Any

class TrajectoryPredictor:
    """
    Computes forecasted cyclone track points and uncertainty cones
    from t=0 out to t=120 hours using environmental steering flow.
    """

    # Empirical mean forecast error radii (km) for the North Indian Ocean (IMD baseline)
    CONE_RADII_KM = {
        6: 30.0,
        12: 55.0,
        24: 85.0,
        36: 115.0,
        48: 145.0,
        72: 210.0,
        96: 280.0,
        120: 350.0
    }

    @staticmethod
    def forecast_track(
        start_lat: float,
        start_lon: float,
        start_vmax: float,
        start_mslp: float,
        steering_u: float = -4.5,  # Typical westward steering (m/s)
        steering_v: float = 3.2    # Northward component (m/s)
    ) -> Dict[str, Any]:
        """
        Generates 6-hourly trajectory coordinates out to 120 hours
        and constructs a GeoJSON Polygon for the cone of uncertainty.
        """
        track_points = []
        curr_lat = start_lat
        curr_lon = start_lon
        curr_vmax = start_vmax
        curr_mslp = start_mslp

        # Generate forecast steps
        for hour in [0, 6, 12, 18, 24, 36, 48, 60, 72, 84, 96, 108, 120]:
            if hour > 0:
                dt_hours = 6 if hour <= 24 else 12
                dt_seconds = dt_hours * 3600.0

                # Beta-drift: Coriolis effect adds a slight northwestward pull
                beta_drift_v = 1.2
                beta_drift_u = -0.8

                eff_u = steering_u + beta_drift_u
                eff_v = steering_v + beta_drift_v

                # Conversion: 1 degree latitude ≈ 111,000 meters
                delta_lat = (eff_v * dt_seconds) / 111000.0
                cos_lat = math.cos(math.radians(curr_lat))
                delta_lon = (eff_u * dt_seconds) / (111000.0 * max(cos_lat, 0.1))

                curr_lat += delta_lat
                curr_lon += delta_lon

                # Intensity evolution
                if hour <= 48:
                    curr_vmax = min(curr_vmax + 3.0, 130.0)
                    curr_mslp = max(curr_mslp - 2.5, 930.0)
                else:
                    curr_vmax = max(curr_vmax - 4.0, 20.0)
                    curr_mslp = min(curr_mslp + 3.0, 1008.0)

            track_points.append({
                "forecast_hour": hour,
                "lat": round(curr_lat, 3),
                "lon": round(curr_lon, 3),
                "vmax_knots": round(curr_vmax, 1),
                "mslp_hpa": round(curr_mslp, 1),
                "error_radius_km": TrajectoryPredictor.CONE_RADII_KM.get(hour, hour * 2.8)
            })

        cone_polygon = TrajectoryPredictor._generate_cone_polygon(track_points)
        linestring_coords = [[pt["lon"], pt["lat"]] for pt in track_points]

        return {
            "track_points": track_points,
            "linestring_coords": linestring_coords,
            "cone_polygon": cone_polygon
        }

    @staticmethod
    def _generate_cone_polygon(track_points: List[dict]) -> List[List[float]]:
        left_side = []
        right_side = []

        for pt in track_points:
            lat = pt["lat"]
            lon = pt["lon"]
            r_km = pt["error_radius_km"]

            d_lat = r_km / 111.0
            d_lon = r_km / (111.0 * max(math.cos(math.radians(lat)), 0.1))

            left_side.append([round(lon - d_lon, 3), round(lat + d_lat * 0.5, 3)])
            right_side.append([round(lon + d_lon, 3), round(lat - d_lat * 0.5, 3)])

        polygon_ring = left_side + right_side[::-1]
        polygon_ring.append(polygon_ring[0])  # Close ring
        return polygon_ring