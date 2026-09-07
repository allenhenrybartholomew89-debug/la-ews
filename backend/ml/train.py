import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import joblib
import mlflow
from database import SessionLocal
import models

def train():
    db = SessionLocal()
    data = db.query(models.Project).all()
    db.close()
    
    if not data:
        print("No data found")
        return {"status": "no data"}
    
    df = pd.DataFrame([{col.name: getattr(d, col.name) for col in d.__table__.columns} for d in data])
    
    features = [
        "project_type", "land_area_ha", "affected_families", 
        "compensation_disbursed_pct", "sec11_delay_days", 
        "has_legal_dispute", "forest_clearance_pending", 
        "historical_district_risk"
    ]
    target = "is_delayed"
    
    X = df[features].copy()
    y = df[target].copy()
    
    # Encode categorical
    le = LabelEncoder()
    X['project_type'] = le.fit_transform(X['project_type'])
    
    joblib.dump(le, os.path.join(os.path.dirname(__file__), 'label_encoder.joblib'))
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    mlflow.set_experiment("sih26017-delay-prediction")
    with mlflow.start_run():
        clf = xgb.XGBClassifier(use_label_encoder=False, eval_metric='logloss', max_depth=4)
        clf.fit(X_train, y_train)
        
        acc = clf.score(X_test, y_test)
        mlflow.log_metric("accuracy", acc)
        
        # Save model
        model_path = os.path.join(os.path.dirname(__file__), 'xgb_model.joblib')
        joblib.dump(clf, model_path)
    
    return {"status": "trained", "accuracy": acc}

if __name__ == "__main__":
    train()
