import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from database import SessionLocal, engine
import models
import random

# 25 realistic named Indian infrastructure projects with real coordinates
NAMED_PROJECTS = [
    {"name": "NH-44 Expansion (Delhi-Agra)", "type": "Highway", "lat": 27.18, "lng": 78.02},
    {"name": "Mumbai Metro Line 3", "type": "Railway", "lat": 19.076, "lng": 72.8777},
    {"name": "Navi Mumbai Greenfield Airport", "type": "Industrial", "lat": 19.0, "lng": 73.12},
    {"name": "Western Dedicated Freight Corridor", "type": "Railway", "lat": 23.25, "lng": 72.63},
    {"name": "Polavaram Dam Project", "type": "Dam", "lat": 17.247, "lng": 81.647},
    {"name": "Chennai-Bengaluru Expressway", "type": "Highway", "lat": 12.82, "lng": 78.7},
    {"name": "Jewar International Airport", "type": "Industrial", "lat": 28.11, "lng": 77.56},
    {"name": "Ken-Betwa River Link", "type": "Dam", "lat": 24.6, "lng": 80.3},
    {"name": "Ganga Expressway UP", "type": "Highway", "lat": 26.85, "lng": 80.91},
    {"name": "Ahmedabad-Mumbai Bullet Train", "type": "Railway", "lat": 21.17, "lng": 72.83},
    {"name": "Pancheshwar Dam (Uttarakhand)", "type": "Dam", "lat": 29.5, "lng": 80.2},
    {"name": "Bengaluru Suburban Railway", "type": "Railway", "lat": 12.97, "lng": 77.59},
    {"name": "Delhi-Meerut RRTS", "type": "Railway", "lat": 28.67, "lng": 77.45},
    {"name": "Char Dham Highway Project", "type": "Highway", "lat": 30.32, "lng": 78.03},
    {"name": "AIIMS Madurai Campus", "type": "Industrial", "lat": 9.92, "lng": 78.12},
    {"name": "Amaravati Capital City", "type": "Industrial", "lat": 16.51, "lng": 80.52},
    {"name": "Renukaji Dam (Himachal)", "type": "Dam", "lat": 30.6, "lng": 77.5},
    {"name": "Nagpur-Mumbai Samruddhi Expressway", "type": "Highway", "lat": 20.0, "lng": 76.0},
    {"name": "Kolkata East-West Metro", "type": "Railway", "lat": 22.57, "lng": 88.36},
    {"name": "Visakhapatnam-Chennai Industrial Corridor", "type": "Industrial", "lat": 15.5, "lng": 80.3},
    {"name": "Sardar Sarovar Canal Network", "type": "Dam", "lat": 21.83, "lng": 73.75},
    {"name": "Dwarka Expressway (Gurugram)", "type": "Highway", "lat": 28.46, "lng": 77.04},
    {"name": "Namma Metro Phase 3 (Bengaluru)", "type": "Railway", "lat": 13.02, "lng": 77.57},
    {"name": "Jal Jeevan Mission WTP Madhya Pradesh", "type": "Dam", "lat": 23.26, "lng": 77.41},
    {"name": "Paradip Refinery Expansion", "type": "Industrial", "lat": 20.32, "lng": 86.61},
]

def seed_projects():
    """Seeds 25 realistic named projects with injected delay correlations."""
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Only seed if DB is empty
    count = db.query(models.Project).count()
    if count > 0:
        print(f"Database already has {count} projects. Skipping seed.")
        db.close()
        return

    projects = []
    for item in NAMED_PROJECTS:
        land_area_ha = round(random.uniform(50.0, 4500.0), 2)
        affected_families = random.randint(20, 1800)
        compensation_disbursed_pct = round(random.uniform(0.05, 0.98), 2)
        sec11_delay_days = random.randint(0, 170)
        has_legal_dispute = random.random() < 0.4
        forest_clearance_pending = random.random() < 0.3
        historical_district_risk = round(random.uniform(0.1, 0.9), 2)

        # Enforce correlation: legal dispute + low compensation => HIGH delay
        if has_legal_dispute and compensation_disbursed_pct < 0.5:
            is_delayed = random.random() < 0.90  # >80% chance
            delay_days = random.randint(90, 400)
        elif forest_clearance_pending:
            is_delayed = random.random() < 0.55
            delay_days = random.randint(45, 250) if is_delayed else random.randint(0, 15)
        elif historical_district_risk > 0.7:
            is_delayed = random.random() < 0.45
            delay_days = random.randint(30, 180) if is_delayed else random.randint(0, 10)
        else:
            is_delayed = random.random() < 0.15
            delay_days = random.randint(10, 60) if is_delayed else random.randint(0, 5)

        p = models.Project(
            project_type=item["type"],
            land_area_ha=land_area_ha,
            affected_families=affected_families,
            compensation_disbursed_pct=compensation_disbursed_pct,
            sec11_delay_days=sec11_delay_days,
            has_legal_dispute=has_legal_dispute,
            forest_clearance_pending=forest_clearance_pending,
            historical_district_risk=historical_district_risk,
            is_delayed=is_delayed,
            delay_days=delay_days,
            latitude=item["lat"],
            longitude=item["lng"],
        )
        projects.append(p)

    db.bulk_save_objects(projects)
    db.commit()
    db.close()
    print(f"Seeded {len(projects)} realistic Indian infrastructure projects!")


if __name__ == "__main__":
    seed_projects()
