# backend/app/models/storm.py
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, func
from geoalchemy2 import Geometry
from backend.app.core.database import Base

class Storm(Base):
    __tablename__ = "storms"

    id = Column(String(64), primary_key=True)
    name = Column(String(64), default="UNNAMED")
    basin = Column(String(32), nullable=False)
    status = Column(String(32), nullable=False)
    first_detected_at = Column(DateTime(timezone=True), server_default=func.now())
    last_updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class StormObservation(Base):
    __tablename__ = "storm_observations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    storm_id = Column(String(64), ForeignKey("storms.id", ondelete="CASCADE"))
    timestamp = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    geom = Column(Geometry(geometry_type="POINT", srid=4326), nullable=False)
    vmax_knots = Column(Float)
    mslp_hpa = Column(Float)
    category = Column(String(32))
    rmw_km = Column(Float, nullable=True)

class ForecastRun(Base):
    __tablename__ = "forecast_runs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    storm_id = Column(String(64), ForeignKey("storms.id", ondelete="CASCADE"))
    run_cycle = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    model_name = Column(String(64), nullable=False)
    track_path = Column(Geometry(geometry_type="LINESTRING", srid=4326))
    cone_of_uncertainty = Column(Geometry(geometry_type="POLYGON", srid=4326))