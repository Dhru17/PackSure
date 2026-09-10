from datetime import datetime, timezone
from . import db

class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey("manufacturers.id", ondelete="CASCADE"), nullable=True, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    case_id = db.Column(db.Integer, db.ForeignKey("inspection_cases.id", ondelete="SET NULL"), nullable=True, index=True)
    
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    notification_type = db.Column(db.String(100), default="GENERAL", nullable=False, index=True)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    action_link = db.Column(db.String(255), nullable=True)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    company = db.relationship("Manufacturer", lazy="select")
    user = db.relationship("User", lazy="select")
    inspection_case = db.relationship("InspectionCase", lazy="select")

    def to_dict(self):
        return {
            "id": self.id,
            "company_id": self.company_id,
            "user_id": self.user_id,
            "case_id": self.case_id,
            "case_number": self.inspection_case.case_number if self.inspection_case else None,
            "title": self.title,
            "message": self.message,
            "notification_type": self.notification_type,
            "is_read": self.is_read,
            "action_link": self.action_link,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
