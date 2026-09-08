import enum
import json
from datetime import datetime, timezone
from . import db

class AuditActionType(str, enum.Enum):
    USER_LOGIN = "USER_LOGIN"
    USER_LOGOUT = "USER_LOGOUT"
    CASE_CREATED = "CASE_CREATED"
    EVIDENCE_UPLOADED = "EVIDENCE_UPLOADED"
    AI_ANALYSIS_EXECUTED = "AI_ANALYSIS_EXECUTED"
    DECLARATION_EDITED = "DECLARATION_EDITED"
    CHECK_STATUS_CHANGED = "CHECK_STATUS_CHANGED"
    INSPECTOR_SUBMITTED = "INSPECTOR_SUBMITTED"
    SENIOR_OVERRIDE = "SENIOR_OVERRIDE"
    CASE_FINALIZED = "CASE_FINALIZED"
    RULE_MODIFIED = "RULE_MODIFIED"
    USER_MODIFIED = "USER_MODIFIED"

class AuditLog(db.Model):
    __tablename__ = "audit_logs"

    id = db.Column(db.Integer, primary_key=True)
    case_id = db.Column(db.Integer, db.ForeignKey("inspection_cases.id", ondelete="SET NULL"), nullable=True, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    action_type = db.Column(db.Enum(AuditActionType, name="audit_action_types"), nullable=False, index=True)
    entity_name = db.Column(db.String(100), nullable=False, index=True) # e.g. InspectionCase, Declaration, Violation
    entity_id = db.Column(db.String(100), nullable=False)
    
    previous_state_json = db.Column(db.Text, nullable=True)
    new_state_json = db.Column(db.Text, nullable=True)
    justification = db.Column(db.Text, nullable=True)
    ip_address = db.Column(db.String(60), nullable=True)
    
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    user = db.relationship("User", lazy="select")

    def to_dict(self):
        prev_s = {}
        new_s = {}
        if self.previous_state_json:
            try: prev_s = json.loads(self.previous_state_json)
            except Exception: pass
        if self.new_state_json:
            try: new_s = json.loads(self.new_state_json)
            except Exception: pass

        return {
            "id": self.id,
            "case_id": self.case_id,
            "user_id": self.user_id,
            "user_name": self.user.full_name if self.user else "System",
            "action_type": self.action_type.value if hasattr(self.action_type, "value") else str(self.action_type),
            "entity_name": self.entity_name,
            "entity_id": self.entity_id,
            "previous_state": prev_s,
            "new_state": new_s,
            "justification": self.justification,
            "ip_address": self.ip_address,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None
        }
