# backend/app/api/v1/endpoints/storms.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from geoalchemy2.shape import to_shape

from backend.app.core.database import get_db
from backend.app.models.storm import Storm, StormObservation, ForecastRun

router = APIRouter()

@router.get("/active")
def get_active_storms(db: Session = Depends(get_db)):
    """Returns all active cyclones in the North Indian Ocean."""
    storms = db.query(Storm).filter(Storm.status == "ACTIVE").all()
    return storms

@router.get("/{storm_id}/geojson")
def get_storm_geojson(storm_id: str, db: Session = Depends(get_db)):
    """
    Returns a GeoJSON FeatureCollection formatted for Mapbox GL / Deck.gl:
      - Historical & Current observation points
      - 120-hour forecast trajectory (LineString)
      - Dynamic Cone of Uncertainty (Polygon)
    """
    storm = db.query(Storm).filter(Storm.id == storm_id).first()
    if not storm:
        raise HTTPException(status_code=404, detail="Storm not found")

    features = []

    # 1. Observation Points
    observations = db.query(StormObservation).filter(StormObservation.storm_id == storm_id).all()
    for obs in observations:
        point = to_shape(obs.geom)
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [round(point.x, 3), round(point.y, 3)]
            },
            "properties": {
                "layer_type": "observation",
                "timestamp": obs.timestamp.isoformat(),
                "vmax_knots": obs.vmax_knots,
                "mslp_hpa": obs.mslp_hpa,
                "category": obs.category
            }
        })

    # 2. Latest Forecast Run
    latest_forecast = (
        db.query(ForecastRun)
        .filter(ForecastRun.storm_id == storm_id)
        .order_by(ForecastRun.run_cycle.desc())
        .first()
    )

    if latest_forecast:
        # Trajectory path (LineString)
        line = to_shape(latest_forecast.track_path)
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": list(line.coords)
            },
            "properties": {
                "layer_type": "forecast_track",
                "model": latest_forecast.model_name
            }
        })

        # Uncertainty Cone (Polygon)
        cone = to_shape(latest_forecast.cone_of_uncertainty)
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [list(cone.exterior.coords)]
            },
            "properties": {
                "layer_type": "cone_of_uncertainty",
                "model": latest_forecast.model_name
            }
        })

    return {
        "type": "FeatureCollection",
        "storm_id": storm_id,
        "name": storm.name,
        "basin": storm.basin,
        "features": features
    }


from backend.app.services.landfall_engine import LandfallAssessmentEngine
from backend.app.services.trajectory_predictor import TrajectoryPredictor

@router.get("/{storm_id}/landfall-risk")
def get_landfall_risk(storm_id: str, db: Session = Depends(get_db)):
    """
    Returns coastal impact assessments and IMD alert levels 
    for vulnerable Indian coastal districts based on the latest trajectory.
    """
    storm = db.query(Storm).filter(Storm.id == storm_id).first()
    if not storm:
        raise HTTPException(status_code=404, detail="Storm not found")

    latest_obs = (
        db.query(StormObservation)
        .filter(StormObservation.storm_id == storm_id)
        .order_by(StormObservation.timestamp.desc())
        .first()
    )

    if not latest_obs:
        return {"storm_id": storm_id, "districts_at_risk": []}

    obs_pt = to_shape(latest_obs.geom)

    # Compute trajectory
    forecast = TrajectoryPredictor.forecast_track(
        start_lat=obs_pt.y,
        start_lon=obs_pt.x,
        start_vmax=latest_obs.vmax_knots or 45.0,
        start_mslp=latest_obs.mslp_hpa or 985.0
    )

    risk_report = LandfallAssessmentEngine.evaluate_landfall_risk(forecast["track_points"])

    return {
        "storm_id": storm_id,
        "storm_name": storm.name,
        "basin": storm.basin,
        "total_districts_impacted": len(risk_report),
        "district_alerts": risk_report
    }