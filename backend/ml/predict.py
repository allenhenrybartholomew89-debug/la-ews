import os
import numpy as np
import joblib
import pandas as pd
import shap
from models import ProjectCreate

model_path = os.path.join(os.path.dirname(__file__), 'xgb_model.joblib')
encoder_path = os.path.join(os.path.dirname(__file__), 'label_encoder.joblib')

_clf_cache = None
_le_cache = None


def load_artifacts():
    global _clf_cache, _le_cache
    if _clf_cache is not None and _le_cache is not None:
        return _clf_cache, _le_cache
    if os.path.exists(model_path) and os.path.exists(encoder_path):
        _clf_cache = joblib.load(model_path)
        _le_cache = joblib.load(encoder_path)
        return _clf_cache, _le_cache
    return None, None


def predict_project(project: ProjectCreate):
    clf, le = load_artifacts()
    if not clf:
        return {
            "risk_score": 0,
            "risk_level": "Unknown",
            "shap_values": [],
            "actionable_recommendation": "Model not trained yet. Call POST /api/v1/train first."
        }

    features = [
        "project_type", "land_area_ha", "affected_families",
        "compensation_disbursed_pct", "sec11_delay_days",
        "has_legal_dispute", "forest_clearance_pending",
        "historical_district_risk"
    ]

    df = pd.DataFrame([project.dict()])[features]
    df['project_type'] = le.transform(df['project_type'].astype(str))

    # Predict probability of delay
    prob = float(clf.predict_proba(df)[0][1])
    risk_score = int(min(max(prob * 100, 0), 100))

    if risk_score > 70:
        risk_level = "High"
    elif risk_score > 35:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    # SHAP Explanations — force cast every value to plain float
    shap_list = []
    try:
        explainer = shap.TreeExplainer(clf)
        shap_vals = explainer.shap_values(df)[0]
        shap_list = [
            {"feature": features[i], "impact": float(np.float64(shap_vals[i]))}
            for i in range(len(features))
        ]
        shap_list = sorted(shap_list, key=lambda x: abs(x["impact"]), reverse=True)[:3]
    except Exception:
        shap_list = []

    # Contextual recommendation
    rec = "Project is on track. Continue monitoring standard indicators."
    if risk_score > 70:
        if project.has_legal_dispute:
            rec = "⚠️ HIGH RISK — Prioritize legal dispute resolution immediately. Engage district collector for mediation."
        elif project.compensation_disbursed_pct < 0.5:
            rec = "⚠️ HIGH RISK — Expedite compensation disbursement above 50% to prevent community protests and court orders."
        elif project.forest_clearance_pending:
            rec = "⚠️ HIGH RISK — Fast-track forest/environmental clearance via MoEFCC portal."
        else:
            rec = "⚠️ HIGH RISK — Review all pending clearances and statutory obligations."
    elif risk_score > 35:
        rec = "⚡ MEDIUM RISK — Monitor weekly. Address any pending legal or clearance items proactively."

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "shap_values": shap_list,
        "actionable_recommendation": rec
    }
