import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
REPORTS_DIR = DATA_DIR / "reports"
SAMPLES_DIR = DATA_DIR / "samples"

for d in [DATA_DIR, UPLOAD_DIR, REPORTS_DIR, SAMPLES_DIR]:
    os.makedirs(d, exist_ok=True)

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "packsure-lmpc-dev-secret-key-2026-sih")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "packsure-jwt-secret-key-2026-sih-32chars-min")
    JWT_ACCESS_TOKEN_EXPIRES_HOURS = 24

    PORT = int(os.environ.get("PORT", 5055))
    HOST = "127.0.0.1"

    # Database: Supports PostgreSQL via DATABASE_URL or SQLite standalone for local dev
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        f"sqlite:///{DATA_DIR / 'packsure_metrology.db'}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    MAX_CONTENT_LENGTH = 64 * 1024 * 1024 # 64 MB

    UPLOAD_FOLDER = str(UPLOAD_DIR)
    REPORTS_FOLDER = str(REPORTS_DIR)
    SAMPLES_FOLDER = str(SAMPLES_DIR)
