import enum
import json
from datetime import datetime, timezone
from . import db

class PatternStatus(str, enum.Enum):
    NEW = "NEW"
    UNDER_REVIEW = "UNDER_REVIEW"
    CONFIRMED_PATTERN = "CONFIRMED_PATTERN"
    DISMISSED = "DISMISSED"

class SystemicPattern(db.Model):
    __tablename__ = "systemic_patterns"

    id = db.Column(db.Integer, primary_key=True)
    pattern_code = db.Column(db.String(80), unique=True, nullable=False, index=True)
    pattern_type = db.Column(db.String(80), nullable=False) # e.g. BRAND_WIDE_DEFECT, CATEGORY_DEFECT, PLANT_RECURRING
    
    manufacturer_id = db.Column(db.Integer, db.ForeignKey("manufacturers.id", ondelete="CASCADE"), nullable=True, index=True)
    category_id = db.Column(db.Integer, db.ForeignKey("product_categories.id", ondelete="SET NULL"), nullable=True, index=True)
    
    rule_code = db.Column(db.String(100), nullable=False, index=True) # e.g. RULE_6_1_A, RULE_6_10A
    rule_citation = db.Column(db.String(255), nullable=False)
    
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    severity = db.Column(db.String(50), default="HIGH", nullable=False) # HIGH, MEDIUM, LOW
    confidence_score = db.Column(db.Float, default=0.85, nullable=False) # e.g. 0.92
    
    occurrence_count = db.Column(db.Integer, default=1, nullable=False)
    affected_products_count = db.Column(db.Integer, default=1, nullable=False)
    affected_product_names_json = db.Column(db.Text, nullable=True)
    
    status = db.Column(db.Enum(PatternStatus, name="pattern_statuses"), default=PatternStatus.NEW, nullable=False, index=True)
    senior_officer_notes = db.Column(db.Text, nullable=True)
    
    reviewed_by_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = db.Column(db.DateTime, nullable=True)
    
    first_detected_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    manufacturer = db.relationship("Manufacturer", lazy="select")
    category = db.relationship("ProductCategory", lazy="select")
    reviewed_by = db.relationship("User", lazy="select")

    def get_affected_products(self):
        if self.affected_product_names_json:
            try:
                return json.loads(self.affected_product_names_json)
            except Exception:
                pass
        return []

    def to_dict(self):
        return {
            "id": self.id,
            "pattern_code": self.pattern_code,
            "pattern_type": self.pattern_type,
            "manufacturer_id": self.manufacturer_id,
            "manufacturer_name": self.manufacturer.name if self.manufacturer else None,
            "category_id": self.category_id,
            "category_name": self.category.name if self.category else None,
            "rule_code": self.rule_code,
            "rule_citation": self.rule_citation,
            "title": self.title,
            "description": self.description,
            "severity": self.severity,
            "confidence_score": round(self.confidence_score, 2),
            "occurrence_count": self.occurrence_count,
            "affected_products_count": self.affected_products_count,
            "affected_products": self.get_affected_products(),
            "status": self.status.value if hasattr(self.status, "value") else str(self.status),
            "senior_officer_notes": self.senior_officer_notes,
            "reviewed_by_name": self.reviewed_by.full_name if self.reviewed_by else None,
            "reviewed_at": self.reviewed_at.isoformat() if self.reviewed_at else None,
            "first_detected_at": self.first_detected_at.isoformat() if self.first_detected_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
