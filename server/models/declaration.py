import enum
from datetime import datetime, timezone
from . import db

class DeclarationFieldType(str, enum.Enum):
    PRODUCT_NAME = "PRODUCT_NAME"
    GENERIC_COMMODITY = "GENERIC_COMMODITY"
    BRAND_NAME = "BRAND_NAME"
    MANUFACTURER_NAME = "MANUFACTURER_NAME"
    MANUFACTURER_ADDRESS = "MANUFACTURER_ADDRESS"
    PACKER_NAME = "PACKER_NAME"
    IMPORTER_NAME = "IMPORTER_NAME"
    NET_QUANTITY = "NET_QUANTITY"
    UNIT = "UNIT"
    MRP = "MRP"
    MFG_DATE = "MFG_DATE"
    EXP_DATE = "EXP_DATE"
    LOT_NUMBER = "LOT_NUMBER"
    CONSUMER_CARE_PHONE = "CONSUMER_CARE_PHONE"
    CONSUMER_CARE_EMAIL = "CONSUMER_CARE_EMAIL"
    CONSUMER_CARE_ADDRESS = "CONSUMER_CARE_ADDRESS"
    COUNTRY_OF_ORIGIN = "COUNTRY_OF_ORIGIN"
    UNIT_SALE_PRICE = "UNIT_SALE_PRICE"
    BARCODE = "BARCODE"
    FSSAI_NUMBER = "FSSAI_NUMBER"
    DIMENSIONS = "DIMENSIONS"

class ExtractionMethod(str, enum.Enum):
    OCR_TOKEN_MATCHER = "OCR_TOKEN_MATCHER"
    REGULAR_EXPRESSION = "REGULAR_EXPRESSION"
    AI_VISION_NORMALIZER = "AI_VISION_NORMALIZER"
    MANUAL_OVERRIDE = "MANUAL_OVERRIDE"

class VerificationStatus(str, enum.Enum):
    UNVERIFIED = "UNVERIFIED"
    VERIFIED = "VERIFIED"
    CORRECTED = "CORRECTED"
    REJECTED = "REJECTED"

class Declaration(db.Model):
    __tablename__ = "declarations"

    id = db.Column(db.Integer, primary_key=True)
    case_id = db.Column(db.Integer, db.ForeignKey("inspection_cases.id", ondelete="CASCADE"), nullable=False, index=True)
    evidence_id = db.Column(db.Integer, db.ForeignKey("package_evidences.id", ondelete="SET NULL"), nullable=True, index=True)
    
    field_type = db.Column(db.Enum(DeclarationFieldType, name="declaration_field_types"), nullable=False, index=True)
    title = db.Column(db.String(150), nullable=False)
    
    raw_ocr_text = db.Column(db.Text, nullable=True)
    extracted_value = db.Column(db.Text, nullable=True)
    normalized_value = db.Column(db.Text, nullable=True)
    confidence = db.Column(db.Float, default=0.0, nullable=False)
    
    # Normalized bounding box coordinates on evidence image (0.0 to 1.0)
    bbox_x = db.Column(db.Float, default=0.0, nullable=False)
    bbox_y = db.Column(db.Float, default=0.0, nullable=False)
    bbox_w = db.Column(db.Float, default=0.0, nullable=False)
    bbox_h = db.Column(db.Float, default=0.0, nullable=False)
    
    font_height_mm = db.Column(db.Float, nullable=True)
    is_calibrated = db.Column(db.Boolean, default=False, nullable=False)
    
    extraction_method = db.Column(db.Enum(ExtractionMethod, name="extraction_methods"), default=ExtractionMethod.OCR_TOKEN_MATCHER, nullable=False)
    verification_status = db.Column(db.Enum(VerificationStatus, name="verification_statuses"), default=VerificationStatus.UNVERIFIED, nullable=False, index=True)
    inspector_corrected_value = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "case_id": self.case_id,
            "evidence_id": self.evidence_id,
            "surface_name": self.evidence.surface_type.value if self.evidence and hasattr(self.evidence.surface_type, "value") else "Front",
            "field_type": self.field_type.value if hasattr(self.field_type, "value") else str(self.field_type),
            "title": self.title,
            "raw_ocr_text": self.raw_ocr_text,
            "extracted_value": self.extracted_value,
            "normalized_value": self.normalized_value,
            "confidence": round(self.confidence, 4),
            "bbox": {
                "x": round(self.bbox_x, 4),
                "y": round(self.bbox_y, 4),
                "w": round(self.bbox_w, 4),
                "h": round(self.bbox_h, 4)
            },
            "font_height_mm": self.font_height_mm,
            "is_calibrated": self.is_calibrated,
            "extraction_method": self.extraction_method.value if hasattr(self.extraction_method, "value") else str(self.extraction_method),
            "verification_status": self.verification_status.value if hasattr(self.verification_status, "value") else str(self.verification_status),
            "inspector_corrected_value": self.inspector_corrected_value
        }
