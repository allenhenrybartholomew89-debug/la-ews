from sqlalchemy import Boolean, Column, Integer, String, Float
from database import Base
from pydantic import BaseModel
from typing import List, Optional

# SQLAlchemy Model
class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    project_type = Column(String, index=True)
    land_area_ha = Column(Float)
    affected_families = Column(Integer)
    compensation_disbursed_pct = Column(Float)
    sec11_delay_days = Column(Integer)
    has_legal_dispute = Column(Boolean)
    forest_clearance_pending = Column(Boolean)
    historical_district_risk = Column(Float)
    
    # Target Variables
    is_delayed = Column(Boolean)
    delay_days = Column(Integer)
    
    # Optional geospatial mock features for the map
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

# Pydantic Schemas
class ProjectBase(BaseModel):
    project_type: str
    land_area_ha: float
    affected_families: int
    compensation_disbursed_pct: float
    sec11_delay_days: int
    has_legal_dispute: bool
    forest_clearance_pending: bool
    historical_district_risk: float

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: int
    is_delayed: Optional[bool] = None
    delay_days: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    risk_score: Optional[int] = None
    risk_level: Optional[str] = None
    
    class Config:
        from_attributes = True

class ShapValue(BaseModel):
    feature: str
    impact: float

class PredictionResponse(BaseModel):
    risk_score: int
    risk_level: str
    shap_values: List[ShapValue]
    actionable_recommendation: str
