from datetime import datetime, timezone, date
import json
from . import db

class RegulatoryRule(db.Model):
    __tablename__ = "regulatory_rules"

    id = db.Column(db.Integer, primary_key=True)
    rule_code = db.Column(db.String(100), nullable=False, index=True) # e.g. RULE_6_1_E, RULE_6_10A, RULE_7_2, RULE_8_1
    version = db.Column(db.String(100), default="v2022.1", nullable=False, index=True) # e.g. v2022.1, v2026.1_GSR128E, v2026.2_GSR312E
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    statutory_citation = db.Column(db.String(255), nullable=False) # e.g. Rule 6(1)(e), Legal Metrology (PC) Rules 2011
    
    # Official Legal Authority & Gazette Notification Metadata
    government_authority = db.Column(
        db.String(255),
        default="Department of Consumer Affairs, Ministry of Consumer Affairs, Food and Public Distribution, Government of India",
        nullable=False
    )
    notification_reference = db.Column(db.String(100), nullable=True) # e.g. G.S.R. 128(E), G.S.R. 312(E), G.S.R. 779(E)
    notification_date = db.Column(db.Date, nullable=True) # e.g. 2026-02-13
    amendment_title = db.Column(db.String(255), nullable=True) # e.g. Legal Metrology (Packaged Commodities) Second Amendment Rules, 2026
    status = db.Column(db.String(50), default="ACTIVE", nullable=False, index=True) # ACTIVE, SUPERSEDED, FUTURE_SCHEDULED, DEPRECATED
    official_source = db.Column(db.String(255), default="The Gazette of India: Extraordinary", nullable=False)
    source_document = db.Column(db.String(255), default="Legal Metrology (Packaged Commodities) Rules, 2011", nullable=False)
    
    validation_logic_type = db.Column(db.String(100), nullable=False) # e.g. MANDATORY_DECLARATIONS, CHARACTER_HEIGHT, SURROUNDING_SPACE, ECOMMERCE_FILTER
    applicability_criteria_json = db.Column(db.Text, nullable=True) # JSON criteria (e.g. min_weight, imported_only, ecommerce_only)
    
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
    requirements = db.relationship("RuleRequirement", backref="rule", cascade="all, delete-orphan", lazy="select")

    def get_applicability(self):
        if self.applicability_criteria_json:
            try:
                return json.loads(self.applicability_criteria_json)
            except Exception:
                pass
        return {}

    def get_effective_status(self, check_date: date = None):
        """Determines legal status based on evaluation date."""
        d = check_date or date.today()
        if not self.is_active:
            return "INACTIVE"
        if self.effective_from and d < self.effective_from:
            return "FUTURE_SCHEDULED"
        if self.effective_to and d > self.effective_to:
            return "SUPERSEDED"
        return "ACTIVE"

    def to_dict(self, check_date: date = None):
        eff_status = self.get_effective_status(check_date)
        return {
            "id": self.id,
            "rule_code": self.rule_code,
            "version": self.version,
            "title": self.title,
            "description": self.description,
            "statutory_citation": self.statutory_citation,
            "government_authority": self.government_authority,
            "notification_reference": self.notification_reference,
            "notification_date": self.notification_date.isoformat() if self.notification_date else None,
            "amendment_title": self.amendment_title,
            "status": self.status or eff_status,
            "calculated_effective_status": eff_status,
            "official_source": self.official_source,
            "source_document": self.source_document,
            "validation_logic_type": self.validation_logic_type,
            "applicability_criteria": self.get_applicability(),
            "effective_from": self.effective_from.isoformat() if self.effective_from else None,
            "effective_to": self.effective_to.isoformat() if self.effective_to else None,
            "is_active": self.is_active,
            "requirements_count": len(self.requirements) if self.requirements else 0,
            "requirements": [req.to_dict() for req in self.requirements] if self.requirements else [],
            "categories_count": len(self.category_mappings) if self.category_mappings else 0,
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

class RuleRequirement(db.Model):
    __tablename__ = "rule_requirements"

    id = db.Column(db.Integer, primary_key=True)
    rule_id = db.Column(db.Integer, db.ForeignKey("regulatory_rules.id", ondelete="CASCADE"), nullable=False, index=True)
    requirement_code = db.Column(db.String(100), nullable=False, index=True) # e.g. REQ_MRP_INCLUSIVE, REQ_FONT_SIZE_2MM, REQ_NET_QTY_SI
    title = db.Column(db.String(255), nullable=False)
    requirement_type = db.Column(db.String(80), default="MANDATORY_DECLARATION", nullable=False) # MANDATORY_DECLARATION, PHYSICAL_MEASUREMENT, REQUIRED_DOCUMENT, FONT_SPECIFICATION, PLACEMENT_RULE
    description = db.Column(db.Text, nullable=True)
    condition_json = db.Column(db.Text, nullable=True)
    is_mandatory = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def get_condition(self):
        if self.condition_json:
            try:
                return json.loads(self.condition_json)
            except Exception:
                pass
        return {}

    def to_dict(self):
        return {
            "id": self.id,
            "rule_id": self.rule_id,
            "requirement_code": self.requirement_code,
            "title": self.title,
            "requirement_type": self.requirement_type,
            "description": self.description,
            "condition": self.get_condition(),
            "is_mandatory": self.is_mandatory,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
