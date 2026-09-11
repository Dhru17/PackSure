import enum
import json
from datetime import datetime, timezone
from . import db

class SurfaceType(str, enum.Enum):
    FRONT = "FRONT"
    BACK = "BACK"
    LEFT = "LEFT"
    RIGHT = "RIGHT"
    TOP = "TOP"
    BOTTOM = "BOTTOM"
    PRICE_FLAP = "PRICE_FLAP"
    LABEL = "LABEL"
    ADDITIONAL = "ADDITIONAL"

class QualityVerdict(str, enum.Enum):
    READABLE = "READABLE"
    BORDERLINE = "BORDERLINE"
    UNREADABLE = "UNREADABLE"

class PackageEvidence(db.Model):
    __tablename__ = "package_evidences"

    id = db.Column(db.Integer, primary_key=True)
    case_id = db.Column(db.Integer, db.ForeignKey("inspection_cases.id", ondelete="CASCADE"), nullable=False, index=True)
    surface_type = db.Column(db.Enum(SurfaceType, name="surface_types"), default=SurfaceType.FRONT, nullable=False, index=True)
    
    storage_path = db.Column(db.String(500), nullable=False)
    annotated_storage_path = db.Column(db.String(500), nullable=True)
    original_filename = db.Column(db.String(255), nullable=False)
    mime_type = db.Column(db.String(100), default="image/jpeg", nullable=False)
    file_size_bytes = db.Column(db.Integer, nullable=True)
    
    width_px = db.Column(db.Integer, nullable=True)
    height_px = db.Column(db.Integer, nullable=True)
    mm_per_pixel_scale = db.Column(db.Float, nullable=True)
    
    # Pre-OCR image quality gate metrics
    blur_score = db.Column(db.Float, nullable=True)
    brightness_score = db.Column(db.Float, nullable=True)
    contrast_score = db.Column(db.Float, nullable=True)
    rotation_angle = db.Column(db.Float, default=0.0)
    quality_verdict = db.Column(db.Enum(QualityVerdict, name="quality_verdicts"), default=QualityVerdict.READABLE, nullable=False)
    quality_summary = db.Column(db.Text, nullable=True)

    # AI 6-Panel Classification & Mismatch Detection
    predicted_surface = db.Column(db.String(50), nullable=True)
    is_surface_mismatch = db.Column(db.Boolean, default=False, nullable=False)
    surface_mismatch_warning = db.Column(db.Text, nullable=True)
    features_detected_json = db.Column(db.Text, nullable=True)
    
    captured_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    ocr_detections = db.relationship("OCRDetection", backref="evidence", cascade="all, delete-orphan", lazy="select")
    declarations = db.relationship("Declaration", backref="evidence", lazy="select")

    def to_dict(self):
        features = []
        if self.features_detected_json:
            try:
                features = json.loads(self.features_detected_json)
            except Exception:
                pass
        return {
            "id": self.id,
            "case_id": self.case_id,
            "surface_type": self.surface_type.value if hasattr(self.surface_type, "value") else str(self.surface_type),
            "storage_path": self.storage_path,
            "annotated_storage_path": self.annotated_storage_path,
            "original_filename": self.original_filename,
            "width_px": self.width_px,
            "height_px": self.height_px,
            "mm_per_pixel_scale": self.mm_per_pixel_scale,
            "blur_score": self.blur_score,
            "brightness_score": self.brightness_score,
            "contrast_score": self.contrast_score,
            "quality_verdict": self.quality_verdict.value if hasattr(self.quality_verdict, "value") else str(self.quality_verdict),
            "quality_summary": self.quality_summary,
            "predicted_surface": self.predicted_surface or (self.surface_type.value if hasattr(self.surface_type, "value") else str(self.surface_type)),
            "is_surface_mismatch": bool(self.is_surface_mismatch),
            "surface_mismatch_warning": self.surface_mismatch_warning,
            "features_detected": features,
            "captured_at": self.captured_at.isoformat() if self.captured_at else None
        }

class OCRDetection(db.Model):
    __tablename__ = "ocr_detections"

    id = db.Column(db.Integer, primary_key=True)
    evidence_id = db.Column(db.Integer, db.ForeignKey("package_evidences.id", ondelete="CASCADE"), nullable=False, index=True)
    case_id = db.Column(db.Integer, db.ForeignKey("inspection_cases.id", ondelete="CASCADE"), nullable=False, index=True)
    
    raw_text = db.Column(db.Text, nullable=False)
    confidence = db.Column(db.Float, default=0.0, nullable=False)
    
    # Normalized bounding box coordinates (0.0 to 1.0)
    bbox_x = db.Column(db.Float, default=0.0, nullable=False)
    bbox_y = db.Column(db.Float, default=0.0, nullable=False)
    bbox_w = db.Column(db.Float, default=0.0, nullable=False)
    bbox_h = db.Column(db.Float, default=0.0, nullable=False)
    
    polygon_json = db.Column(db.Text, nullable=True)
    line_number = db.Column(db.Integer, nullable=True)
    is_barcode = db.Column(db.Boolean, default=False, nullable=False)
    detected_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        polygon = []
        if self.polygon_json:
            try:
                polygon = json.loads(self.polygon_json)
            except Exception:
                pass
        return {
            "id": self.id,
            "evidence_id": self.evidence_id,
            "case_id": self.case_id,
            "raw_text": self.raw_text,
            "confidence": round(self.confidence, 4),
            "bbox": {
                "x": round(self.bbox_x, 4),
                "y": round(self.bbox_y, 4),
                "w": round(self.bbox_w, 4),
                "h": round(self.bbox_h, 4)
            },
            "polygon": polygon,
            "is_barcode": self.is_barcode
        }
