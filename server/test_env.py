import sys, os
from importlib.metadata import version

print("=" * 60)
print("PACKSURE ENVIRONMENT VERIFICATION TEST")
print("=" * 60)
print("Python Executable:", sys.executable)
print("Prefix / Venv:", sys.prefix)
print("In Virtual Env?:", sys.prefix != sys.base_prefix)

# 1. Flask & Extensions
import flask
import flask_cors
import flask_sqlalchemy
print(f"[OK] Flask: v{version('flask')}")
print(f"[OK] Flask-CORS: v{version('flask-cors')}")
print(f"[OK] Flask-SQLAlchemy: v{version('flask-sqlalchemy')}")

# 2. SQLAlchemy
import sqlalchemy
print(f"[OK] SQLAlchemy: v{version('sqlalchemy')}")

# 3. OpenCV, NumPy, Pillow
import cv2
import numpy as np
import PIL
from PIL import Image, ImageDraw
print(f"[OK] OpenCV: v{cv2.__version__}")
print(f"[OK] NumPy: v{np.__version__}")
print(f"[OK] Pillow: v{PIL.__version__}")

# 4. ReportLab
import reportlab
print(f"[OK] ReportLab: v{reportlab.__version__}")

# 5. Security & Auth (JWT, Passlib, Bcrypt)
import jwt
import passlib
import bcrypt
print(f"[OK] PyJWT: v{version('pyjwt')}")
print(f"[OK] Passlib: v{version('passlib')}")
print(f"[OK] Bcrypt: v{version('bcrypt')}")

# 6. Dotenv & Requests & Pytest
import dotenv
import requests
import pytest
print(f"[OK] Python-Dotenv: v{version('python-dotenv')}")
print(f"[OK] Requests: v{version('requests')}")
print(f"[OK] Pytest: v{version('pytest')}")

# 7. OCR (RapidOCR)
from rapidocr_onnxruntime import RapidOCR
engine = RapidOCR()
print("[OK] RapidOCR: Initialized successfully with ONNX Runtime!")

# --- Functional Execution Tests ---
print("\n--- RUNNING FUNCTIONAL VERIFICATION SUITE ---")

# Test A: Flask & SQLAlchemy DB Initialization
app = flask.Flask("test_app")
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
db = flask_sqlalchemy.SQLAlchemy(app)
with app.app_context():
    db.create_all()
print("[PASS] Test A: Flask + SQLAlchemy in-memory database initialized")

# Test B: OpenCV & Pillow image creation and manipulation
test_img = np.zeros((100, 200, 3), dtype=np.uint8)
cv2.putText(test_img, "MRP Rs 50", (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)
laplacian = cv2.Laplacian(cv2.cvtColor(test_img, cv2.COLOR_BGR2GRAY), cv2.CV_64F).var()
print(f"[PASS] Test B: OpenCV image processing & Laplacian blur check ({laplacian:.1f})")

# Test C: OCR execution on synthetic text
ocr_res, _ = engine(test_img)
extracted_txt = ocr_res[0][1] if ocr_res else "None"
print(f"[PASS] Test C: RapidOCR inference executed (Detected: \"{extracted_txt}\")")

# Test D: JWT Token creation & verification
secret = "packsure-test-secret"
token = jwt.encode({"sub": "inspector_1", "role": "INSPECTOR"}, secret, algorithm="HS256")
decoded = jwt.decode(token, secret, algorithms=["HS256"])
assert decoded["role"] == "INSPECTOR"
print("[PASS] Test D: JWT token generation and validation verified")

# Test E: ReportLab PDF construction in-memory
from io import BytesIO
from reportlab.pdfgen import canvas
buf = BytesIO()
c = canvas.Canvas(buf)
c.drawString(100, 750, "Packsure Compliance Certificate")
c.save()
assert len(buf.getvalue()) > 500
print(f"[PASS] Test E: ReportLab PDF stream generation verified ({len(buf.getvalue())} bytes)")

print("\n" + "=" * 60)
print("ALL PHASE 1 ENVIRONMENT TESTS PASSED WITH ZERO ERRORS!")
print("=" * 60)
