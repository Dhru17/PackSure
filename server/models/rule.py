from datetime import datetime, timezone
import json
from . import db

class RegulatoryRule(db.Model):
    __tablename__ = "regulatory_rules"

    id = db.Column(db.Integer, primary_key=True)
    rule_code = db.Column(db.String(100), nullable=False, index=True) # e.g. RULE_6_1_E
    version = db.Column(db.String(50), default="v2022.1", nullable=False, index=True) # e.g. v2022.1, v2026.1
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    statutory_citation = db.Column(db.String(255), nullable=False) # e.g. Rule 6(1)(e), Legal Metrology (PC) Rules 2011
    source_document = db.Column(db.String(255), default="Legal Metrology (Packaged Commodities) Rules, 2011", nullable=False)
    
    validation_logic_type = db.Column(db.String(100), nullable=False) # e.g. MRP_TAX_CLAUSE, SI_UNIT_CHECK, USP_THRESHOLD
    applicability_criteria_json = db.Column(db.Text, nullable=True) # JSON criteria (e.g. min_weight, imported_only)
    
    effective_from = db.Column(db.Date, nullable=False)
    effective_to = db.Column(db.Date, nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False, index=True)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        db.UniqueConstraint("rule_code", "version", name="uq_rule_code_version"),
    )

    category_mappings = db.relationship("RuleCategoryMapping", backref="rule", cascade="all, delete-orphan", lazy="select")
    compliance_checks = db.relationship("ComplianceCheck", backref="rule", lazy="select")

    def get_applicability(self):
        if self.applicability_criteria_json:
            try:
                return json.loads(self.applicability_criteria_json)
            except Exception:
                pass
        return {}

    def to_dict(self):
        return {
            "id": self.id,
            "rule_code": self.rule_code,
            "version": self.version,
            "title": self.title,
            "description": self.description,
            "statutory_citation": self.statutory_citation,
            "source_document": self.source_document,
            "validation_logic_type": self.validation_logic_type,
            "applicability_criteria": self.get_applicability(),
            "effective_from": self.effective_from.isoformat() if self.effective_from else None,
            "effective_to": self.effective_to.isoformat() if self.effective_to else None,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class RuleCategoryMapping(db.Model):
    __tablename__ = "rule_category_mappings"

    id = db.Column(db.Integer, primary_key=True)
    rule_id = db.Column(db.Integer, db.ForeignKey("regulatory_rules.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = db.Column(db.Integer, db.ForeignKey("product_categories.id", ondelete="CASCADE"), nullable=False, index=True)
    is_exempt = db.Column(db.Boolean, default=False, nullable=False)
    exception_notes = db.Column(db.Text, nullable=True)

    category = db.relationship("ProductCategory", backref="rule_mappings", lazy="select")

    __table_args__ = (
        db.UniqueConstraint("rule_id", "category_id", name="uq_rule_category"),
    )
