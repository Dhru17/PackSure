from app import create_app
from models import db, SystemicPattern, InspectionCase
import sqlalchemy

app = create_app()
with app.app_context():
    db.create_all()
    print("Database tables created/verified successfully.")
    
    # Check if columns exist in inspection_cases, and add if needed
    inspector = sqlalchemy.inspect(db.engine)
    columns = [c["name"] for c in inspector.get_columns("inspection_cases")]
    print(f"Existing columns in inspection_cases: {columns}")
    
    with db.engine.connect() as conn:
        if "scheduled_date" not in columns:
            conn.execute(sqlalchemy.text("ALTER TABLE inspection_cases ADD COLUMN scheduled_date DATETIME;"))
            print("Added scheduled_date column.")
        if "scheduled_by_id" not in columns:
            conn.execute(sqlalchemy.text("ALTER TABLE inspection_cases ADD COLUMN scheduled_by_id INTEGER;"))
            print("Added scheduled_by_id column.")
        if "plant_id" not in columns:
            conn.execute(sqlalchemy.text("ALTER TABLE inspection_cases ADD COLUMN plant_id INTEGER;"))
            print("Added plant_id column.")
        if "review_cycle" not in columns:
            conn.execute(sqlalchemy.text("ALTER TABLE inspection_cases ADD COLUMN review_cycle INTEGER DEFAULT 1;"))
            print("Added review_cycle column.")
        if "rule_version" not in columns:
            conn.execute(sqlalchemy.text("ALTER TABLE inspection_cases ADD COLUMN rule_version VARCHAR(100) DEFAULT 'v2022.1';"))
            print("Added rule_version column.")
        conn.commit()
    print("Migration finished cleanly.")
