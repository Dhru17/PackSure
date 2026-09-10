import os
import sqlite3
from app import create_app
from models import db
from config import Config

def migrate_database():
    print("--- Running Packsure Database Migration ---")
    app = create_app()
    with app.app_context():
        db.create_all()
        
        # Check SQLite db columns for regulatory_rules table
        db_path = Config.SQLALCHEMY_DATABASE_URI.replace("sqlite:///", "")
        if os.path.exists(db_path):
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Check existing columns in regulatory_rules
            cursor.execute("PRAGMA table_info(regulatory_rules);")
            columns = [info[1] for info in cursor.fetchall()]
            
            new_columns = [
                ("government_authority", "VARCHAR(255) DEFAULT 'Department of Consumer Affairs, Ministry of Consumer Affairs, Food and Public Distribution, Government of India' NOT NULL"),
                ("notification_reference", "VARCHAR(100)"),
                ("notification_date", "DATE"),
                ("amendment_title", "VARCHAR(255)"),
                ("status", "VARCHAR(50) DEFAULT 'ACTIVE' NOT NULL"),
                ("official_source", "VARCHAR(255) DEFAULT 'The Gazette of India: Extraordinary' NOT NULL")
            ]
            
            for col_name, col_type in new_columns:
                if col_name not in columns:
                    print(f"Adding column '{col_name}' to 'regulatory_rules'...")
                    try:
                        cursor.execute(f"ALTER TABLE regulatory_rules ADD COLUMN {col_name} {col_type};")
                    except Exception as e:
                        print(f"Notice adding column {col_name}: {e}")

            # Check users table for company_id
            cursor.execute("PRAGMA table_info(users);")
            user_cols = [info[1] for info in cursor.fetchall()]
            if "company_id" not in user_cols:
                print("Adding column 'company_id' to 'users'...")
                try:
                    cursor.execute("ALTER TABLE users ADD COLUMN company_id INTEGER REFERENCES companies(id);")
                except Exception as e:
                    print(f"Notice adding column company_id: {e}")

            conn.commit()
            conn.close()
            print("[PASS] SQLite schema columns verified and updated.")

    from seed_regulatory_rules import seed_real_regulatory_rules
    with app.app_context():
        seed_real_regulatory_rules()

if __name__ == "__main__":
    migrate_database()
