# backend/app/services/landfall_engine.py
import math
from typing import List, Dict, Any

class LandfallAssessmentEngine:
    """
    Evaluates landfall impact zones along the Indian coastline,
    calculating estimated time of arrival (ETA), peak winds, and IMD alert tiers.
    """

    # Major vulnerable coastal districts along the North Indian Ocean basin
    INDIAN_COASTAL_DISTRICTS = [
        {"name": "Puri", "state": "Odisha", "lat": 19.813, "lon": 85.831, "coast": "EAST"},
        {"name": "Jagatsinghpur (Paradip)", "state": "Odisha", "lat": 20.264, "lon": 86.666, "coast": "EAST"},
        {"name": "Kendrapara", "state": "Odisha", "lat": 20.502, "lon": 86.422, "coast": "EAST"},
        {"name": "Bhadrak", "state": "Odisha", "lat": 21.057, "lon": 86.495, "coast": "EAST"},
        {"name": "Balasore", "state": "Odisha", "lat": 21.493, "lon": 86.913, "coast": "EAST"},
        {"name": "South 24 Parganas (Sundarbans)", "state": "West Bengal", "lat": 21.821, "lon": 88.641, "coast": "EAST"},
        {"name": "East Medinipur (Digha)", "state": "West Bengal", "lat": 21.626, "lon": 87.507, "coast": "EAST"},
        {"name": "Visakhapatnam", "state": "Andhra Pradesh", "lat": 17.686, "lon": 83.218, "coast": "EAST"},
        {"name": "Srikakulam", "state": "Andhra Pradesh", "lat": 18.296, "lon": 83.896, "coast": "EAST"},
        {"name": "Chennai", "state": "Tamil Nadu", "lat": 13.082, "lon": 80.270, "coast": "EAST"},
        {"name": "Kutch", "state": "Gujarat", "lat": 23.242, "lon": 69.666, "coast": "WEST"},
        {"name": "Jamnagar", "state": "Gujarat", "lat": 22.470, "lon": 70.057, "coast": "WEST"},
        {"name": "Gir Somnath", "state": "Gujarat", "lat": 20.901, "lon": 70.362, "coast": "WEST"}
    ]

    @staticmethod
    def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Great-circle distance between two geographic coordinates in km."""
        r = 6371.0
        d_lat = math.radians(lat2 - lat1)
        d_lon = math.radians(lon2 - lon1)
        a = (
            math.sin(d_lat / 2.0) ** 2
            + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2.0) ** 2
        )
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return r * c

    @classmethod
    def evaluate_landfall_risk(cls, track_points: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Intersects the forecast track points with coastal district nodes
        and assigns IMD color-coded warning alert tiers.
        """
        district_assessments = []

        for district in cls.INDIAN_COASTAL_DISTRICTS:
            min_dist_km = float("inf")
            impact_point = None

            for pt in track_points:
                dist = cls.haversine_distance_km(
                    district["lat"], district["lon"], pt["lat"], pt["lon"]
                )
                if dist < min_dist_km:
                    min_dist_km = dist
                    impact_point = pt

            # Proximity corridor threshold: 250 km from the center
            if impact_point and min_dist_km <= 250.0:
                eta_hours = impact_point.get("forecast_hour", 0)
                vmax = impact_point.get("vmax_knots", 0.0)

                # Assign IMD Warning Protocols
                if eta_hours <= 24 and min_dist_km <= 100.0:
                    alert_level = "RED"
                    action = "Take Immediate Evacuation & Protection Action (Landfall Imminent)"
                elif eta_hours <= 48 and min_dist_km <= 180.0:
                    alert_level = "ORANGE"
                    action = "Be Prepared: High Coastal Wind & Rough Sea Warning"
                else:
                    alert_level = "YELLOW"
                    action = "Be Updated: Cyclone Watch Active"

                # Standard hydrodynamic heuristic for peak surge height (meters)
                surge_estimate_m = round(max(0.5, (vmax - 30.0) * 0.04), 1) if vmax > 34 else 0.5

                district_assessments.append({
                    "district": district["name"],
                    "state": district["state"],
                    "coordinates": [district["lon"], district["lat"]],
                    "closest_approach_km": round(min_dist_km, 1),
                    "eta_hours": eta_hours,
                    "estimated_sustained_wind_kt": vmax,
                    "estimated_surge_m": surge_estimate_m,
                    "alert_level": alert_level,
                    "action_required": action
                })

        district_assessments.sort(key=lambda d: (d["eta_hours"], d["closest_approach_km"]))
        return district_assessments