import enum
import json
from datetime import datetime, timezone
from . import db

class InspectorReviewAction(str, enum.Enum):
    SUBMIT_FOR_REVIEW = "SUBMIT_FOR_REVIEW"
    DRAFT_SAVED = "DRAFT_SAVED"
    MODIFIED_DECLARATION = "MODIFIED_DECLARATION"
    FLAGGED_VIOLATION = "FLAGGED_VIOLATION"

class SeniorReviewAction(str, enum.Enum):
    APPROVE_FINAL = "APPROVE_FINAL"
    OVERRIDE_FINDING = "OVERRIDE_FINDING"
    RETURN_FOR_REINSPECTION = "RETURN_FOR_REINSPECTION"
    REQUEST_EVIDENCE = "REQUEST_EVIDENCE"

class InspectorReview(db.Model):
    __tablename__ = "inspector_reviews"

    id = db.Column(db.Integer, primary_key=True)
    case_id = db.Column(db.Integer, db.ForeignKey("inspection_cases.id", ondelete="CASCADE"), nullable=False, index=True)
    inspector_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    action = db.Column(db.Enum(InspectorReviewAction, name="inspector_review_actions"), default=InspectorReviewAction.SUBMIT_FOR_REVIEW, nullable=False)
    modified_fields_json = db.Column(db.Text, nullable=True)
    remarks = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    inspector = db.relationship("User", lazy="select")

    def to_dict(self):
        modified = {}
        if self.modified_fields_json:
            try:
                modified = json.loads(self.modified_fields_json)
            except Exception:
                pass
        return {
            "id": self.id,
            "case_id": self.case_id,
            "inspector_id": self.inspector_id,
            "inspector_name": self.inspector.full_name if self.inspector else None,
            "action": self.action.value if hasattr(self.action, "value") else str(self.action),
            "modified_fields": modified,
            "remarks": self.remarks,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class SeniorReview(db.Model):
    __tablename__ = "senior_reviews"

    id = db.Column(db.Integer, primary_key=True)
    case_id = db.Column(db.Integer, db.ForeignKey("inspection_cases.id", ondelete="CASCADE"), nullable=False, index=True)
    senior_officer_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    action = db.Column(db.Enum(SeniorReviewAction, name="senior_review_actions"), default=SeniorReviewAction.APPROVE_FINAL, nullable=False)
    override_reason = db.Column(db.Text, nullable=True) # Mandatory if action is OVERRIDE_FINDING
    statutory_justification = db.Column(db.Text, nullable=True)
    remarks = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    senior_officer = db.relationship("User", lazy="select")

    def to_dict(self):
        return {
            "id": self.id,
            "case_id": self.case_id,
            "senior_officer_id": self.senior_officer_id,
            "senior_officer_name": self.senior_officer.full_name if self.senior_officer else None,
            "action": self.action.value if hasattr(self.action, "value") else str(self.action),
            "override_reason": self.override_reason,
            "statutory_justification": self.statutory_justification,
            "remarks": self.remarks,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
