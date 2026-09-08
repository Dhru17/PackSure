import enum
import json
from datetime import datetime, timezone
from . import db

class CheckStatus(str, enum.Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    NOT_APPLICABLE = "NOT_APPLICABLE"

class ViolationSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class InspectorDecision(str, enum.Enum):
    ACCEPTED = "ACCEPTED"
    DISPUTED = "DISPUTED"
    AMENDED = "AMENDED"

class SeniorDecision(str, enum.Enum):
    UPHELD = "UPHELD"
    OVERRULED = "OVERRULED"
    DISMISSED = "DISMISSED"

class ComplianceCheck(db.Model):
    __tablename__ = "compliance_checks"

    id = db.Column(db.Integer, primary_key=True)
    case_id = db.Column(db.Integer, db.ForeignKey("inspection_cases.id", ondelete="CASCADE"), nullable=False, index=True)
    rule_id = db.Column(db.Integer, db.ForeignKey("regulatory_rules.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    status = db.Column(db.Enum(CheckStatus, name="check_statuses"), default=CheckStatus.PASS, nullable=False, index=True)
    confidence = db.Column(db.Float, default=0.0, nullable=False)
    reason_explanation = db.Column(db.Text, nullable=False)
    evaluated_value = db.Column(db.Text, nullable=True)
    expected_condition = db.Column(db.Text, nullable=True)
    
    evidence_id = db.Column(db.Integer, db.ForeignKey("package_evidences.id", ondelete="SET NULL"), nullable=True, index=True)
    bbox_json = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    evidence = db.relationship("PackageEvidence", backref="compliance_checks", lazy="select")
    violations = db.relationship("Violation", backref="compliance_check", cascade="all, delete-orphan", lazy="select")

    def to_dict(self):
        bbox = {}
        if self.bbox_json:
            try:
                bbox = json.loads(self.bbox_json)
            except Exception:
                pass
        return {
            "id": self.id,
            "case_id": self.case_id,
            "rule_id": self.rule_id,
            "rule_code": self.rule.rule_code if self.rule else None,
            "rule_title": self.rule.title if self.rule else None,
            "statutory_citation": self.rule.statutory_citation if self.rule else None,
            "status": self.status.value if hasattr(self.status, "value") else str(self.status),
            "confidence": round(self.confidence, 4),
            "reason_explanation": self.reason_explanation,
            "evaluated_value": self.evaluated_value,
            "expected_condition": self.expected_condition,
            "evidence_id": self.evidence_id,
            "bbox": bbox,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class Violation(db.Model):
    __tablename__ = "violations"

    id = db.Column(db.Integer, primary_key=True)
    case_id = db.Column(db.Integer, db.ForeignKey("inspection_cases.id", ondelete="CASCADE"), nullable=False, index=True)
    check_id = db.Column(db.Integer, db.ForeignKey("compliance_checks.id", ondelete="CASCADE"), nullable=True, index=True)
    
    rule_code = db.Column(db.String(100), nullable=False, index=True)
    violation_title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    severity = db.Column(db.Enum(ViolationSeverity, name="violation_severities"), default=ViolationSeverity.HIGH, nullable=False, index=True)
    
    evidence_snippet = db.Column(db.Text, nullable=True)
    evidence_image_id = db.Column(db.Integer, db.ForeignKey("package_evidences.id", ondelete="SET NULL"), nullable=True, index=True)
    bbox_json = db.Column(db.Text, nullable=True)
    
    inspector_decision = db.Column(db.Enum(InspectorDecision, name="inspector_decisions"), default=InspectorDecision.ACCEPTED, nullable=False)
    inspector_notes = db.Column(db.Text, nullable=True)
    
    senior_decision = db.Column(db.Enum(SeniorDecision, name="senior_decisions"), default=SeniorDecision.UPHELD, nullable=False)
    senior_override_reason = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    evidence_image = db.relationship("PackageEvidence", backref="violations", lazy="select")

    def to_dict(self):
        bbox = {}
        if self.bbox_json:
            try:
                bbox = json.loads(self.bbox_json)
            except Exception:
                pass
        return {
            "id": self.id,
            "case_id": self.case_id,
            "check_id": self.check_id,
            "rule_code": self.rule_code,
            "violation_title": self.violation_title,
            "description": self.description,
            "severity": self.severity.value if hasattr(self.severity, "value") else str(self.severity),
            "evidence_snippet": self.evidence_snippet,
            "evidence_image_id": self.evidence_image_id,
            "bbox": bbox,
            "inspector_decision": self.inspector_decision.value if hasattr(self.inspector_decision, "value") else str(self.inspector_decision),
            "inspector_notes": self.inspector_notes,
            "senior_decision": self.senior_decision.value if hasattr(self.senior_decision, "value") else str(self.senior_decision),
            "senior_override_reason": self.senior_override_reason,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
