import enum
from datetime import datetime, timezone
from . import db

class CaseStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    EVIDENCE_PENDING = "EVIDENCE_PENDING"
    ANALYZING = "ANALYZING"
    ANALYSIS_COMPLETE = "ANALYSIS_COMPLETE"
    INSPECTOR_REVIEW = "INSPECTOR_REVIEW"
    SUBMITTED = "SUBMITTED"
    SENIOR_REVIEW = "SENIOR_REVIEW"
    RETURNED = "RETURNED"
    FINALIZED = "FINALIZED"

class FinalDisposition(str, enum.Enum):
    COMPLIANT = "COMPLIANT"
    NON_COMPLIANT = "NON_COMPLIANT"
    REQUIRES_FURTHER_INSPECTION = "REQUIRES_FURTHER_INSPECTION"

class InspectionCase(db.Model):
    __tablename__ = "inspection_cases"

    id = db.Column(db.Integer, primary_key=True)
    case_number = db.Column(db.String(100), unique=True, nullable=False, index=True) # e.g. LM-2026-001001
    
    product_id = db.Column(db.Integer, db.ForeignKey("products.id", ondelete="RESTRICT"), nullable=False, index=True)
    inspector_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    senior_reviewer_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    status = db.Column(db.Enum(CaseStatus, name="case_statuses"), default=CaseStatus.DRAFT, nullable=False, index=True)
    final_decision = db.Column(db.Enum(FinalDisposition, name="final_dispositions"), nullable=True, index=True)
    
    # Mathematical score & statutory check counters
    compliance_score = db.Column(db.Float, default=0.0, nullable=False)
    total_checks = db.Column(db.Integer, default=0, nullable=False)
    passed_checks = db.Column(db.Integer, default=0, nullable=False)
    failed_checks = db.Column(db.Integer, default=0, nullable=False)
    review_required_checks = db.Column(db.Integer, default=0, nullable=False)
    not_applicable_checks = db.Column(db.Integer, default=0, nullable=False)
    score_breakdown_text = db.Column(db.Text, nullable=True)
    
    # Field inspection metadata
    location_name = db.Column(db.String(255), nullable=True)
    geo_lat = db.Column(db.Float, nullable=True)
    geo_lng = db.Column(db.Float, nullable=True)
    source_type = db.Column(db.String(80), default="Physical Retail Package", nullable=False)
    
    inspector_remarks = db.Column(db.Text, nullable=True)
    senior_remarks = db.Column(db.Text, nullable=True)
    
    # Timestamps for complete audit trail
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    submitted_at = db.Column(db.DateTime, nullable=True)
    finalized_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    inspector = db.relationship("User", foreign_keys=[inspector_id], backref="assigned_inspections", lazy="select")
    senior_reviewer = db.relationship("User", foreign_keys=[senior_reviewer_id], backref="reviewed_inspections", lazy="select")
    
    evidences = db.relationship("PackageEvidence", backref="inspection_case", cascade="all, delete-orphan", lazy="select")
    declarations = db.relationship("Declaration", backref="inspection_case", cascade="all, delete-orphan", lazy="select")
    compliance_checks = db.relationship("ComplianceCheck", backref="inspection_case", cascade="all, delete-orphan", lazy="select")
    violations = db.relationship("Violation", backref="inspection_case", cascade="all, delete-orphan", lazy="select")
    inspector_reviews = db.relationship("InspectorReview", backref="inspection_case", cascade="all, delete-orphan", lazy="select")
    senior_reviews = db.relationship("SeniorReview", backref="inspection_case", cascade="all, delete-orphan", lazy="select")
    reports = db.relationship("InspectionReport", backref="inspection_case", cascade="all, delete-orphan", lazy="select")
    audit_logs = db.relationship("AuditLog", backref="inspection_case", cascade="all, delete-orphan", lazy="select")

    def to_dict(self):
        return {
            "id": self.id,
            "case_number": self.case_number,
            "product_id": self.product_id,
            "product": self.product.to_dict() if self.product else None,
            "inspector_id": self.inspector_id,
            "inspector_name": self.inspector.full_name if self.inspector else None,
            "inspector_badge": self.inspector.badge_number if self.inspector else None,
            "senior_reviewer_id": self.senior_reviewer_id,
            "senior_reviewer_name": self.senior_reviewer.full_name if self.senior_reviewer else None,
            "status": self.status.value if hasattr(self.status, "value") else str(self.status),
            "final_decision": self.final_decision.value if self.final_decision and hasattr(self.final_decision, "value") else (str(self.final_decision) if self.final_decision else None),
            "compliance_score": round(self.compliance_score, 1),
            "total_checks": self.total_checks,
            "passed_checks": self.passed_checks,
            "failed_checks": self.failed_checks,
            "review_required_checks": self.review_required_checks,
            "not_applicable_checks": self.not_applicable_checks,
            "score_breakdown_text": self.score_breakdown_text,
            "location_name": self.location_name,
            "geo_lat": self.geo_lat,
            "geo_lng": self.geo_lng,
            "source_type": self.source_type,
            "inspector_remarks": self.inspector_remarks,
            "senior_remarks": self.senior_remarks,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "submitted_at": self.submitted_at.isoformat() if self.submitted_at else None,
            "finalized_at": self.finalized_at.isoformat() if self.finalized_at else None
        }
