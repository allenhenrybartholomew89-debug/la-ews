# backend/main.py
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import database
import models
from models import ProjectResponse, PredictionResponse, ProjectCreate
from ml.predict import predict_project
import ml.train

models.Base.metadata.create_all(bind=database.engine)

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Seed the database and train the XGBoost model on first launch."""
    db = database.SessionLocal()
    count = db.query(models.Project).count()
    db.close()

    if count == 0:
        print("[LA-EWS] No project records detected — auto-seeding database...")
        from scripts.generate_data import seed_projects
        seed_projects()

        model_path = os.path.join(os.path.dirname(__file__), "ml", "xgb_model.joblib")
        if not os.path.exists(model_path):
            print("[LA-EWS] No trained model detected — auto-training XGBoost pipeline...")
            ml.train.train()

    yield


app = FastAPI(title="LA-EWS | Land Acquisition Early Warning System API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root_redirect():
    return RedirectResponse(url="/docs")


@app.get("/api/v1/projects", response_model=list[ProjectResponse])
def get_projects(skip: int = 0, limit: int = 1000, db: Session = Depends(database.get_db)):
    """Return all projects with live risk scores computed by the XGBoost ML model."""
    projects = db.query(models.Project).offset(skip).limit(limit).all()
    result = []
    for p in projects:
        try:
            pred = predict_project(ProjectCreate(
                project_type=p.project_type,
                land_area_ha=p.land_area_ha,
                affected_families=p.affected_families,
                compensation_disbursed_pct=p.compensation_disbursed_pct,
                sec11_delay_days=p.sec11_delay_days,
                has_legal_dispute=p.has_legal_dispute,
                forest_clearance_pending=p.forest_clearance_pending,
                historical_district_risk=p.historical_district_risk,
            ))
            risk_score = pred["risk_score"]
            risk_level = pred["risk_level"]
        except Exception:
            risk_score = 0
            risk_level = "Low"

        p_dict = {
            **{c.name: getattr(p, c.name) for c in p.__table__.columns},
            "risk_score": risk_score,
            "risk_level": risk_level,
        }
        result.append(p_dict)
    return result


@app.get("/api/v1/projects/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(database.get_db)):
    """Return a single project with its live risk score."""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    try:
        pred = predict_project(ProjectCreate(
            project_type=project.project_type,
            land_area_ha=project.land_area_ha,
            affected_families=project.affected_families,
            compensation_disbursed_pct=project.compensation_disbursed_pct,
            sec11_delay_days=project.sec11_delay_days,
            has_legal_dispute=project.has_legal_dispute,
            forest_clearance_pending=project.forest_clearance_pending,
            historical_district_risk=project.historical_district_risk,
        ))
        risk_score = pred["risk_score"]
        risk_level = pred["risk_level"]
    except Exception:
        risk_score = 0
        risk_level = "Low"

    p_dict = {
        **{c.name: getattr(project, c.name) for c in project.__table__.columns},
        "risk_score": risk_score,
        "risk_level": risk_level,
    }
    return p_dict


@app.post("/api/v1/predict", response_model=PredictionResponse)
def predict(request: ProjectCreate):
    """Run an ad-hoc XGBoost prediction with SHAP explanations."""
    return predict_project(request)


@app.post("/api/v1/train")
def train_model():
    """Retrain the XGBoost model from the current database contents."""
    return ml.train.train()


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)