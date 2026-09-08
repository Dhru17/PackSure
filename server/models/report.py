from datetime import datetime, timezone
from . import db

class InspectionReport(db.Model):
    __tablename__ = "inspection_reports"

    id = db.Column(db.Integer, primary_key=True)
    case_id = db.Column(db.Integer, db.ForeignKey("inspection_cases.id", ondelete="CASCADE"), nullable=False, index=True)
    report_number = db.Column(db.String(100), unique=True, nullable=False, index=True) # e.g. RPT-LM-2026-001001-V1
    
    storage_path = db.Column(db.String(500), nullable=False)
    report_version = db.Column(db.Integer, default=1, nullable=False)
    file_size_bytes = db.Column(db.Integer, nullable=True)
    mime_type = db.Column(db.String(50), default="application/pdf", nullable=False)
    
    generated_by_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    generated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    generator = db.relationship("User", lazy="select")

    def to_dict(self):
        return {
            "id": self.id,
            "case_id": self.case_id,
            "report_number": self.report_number,
            "storage_path": self.storage_path,
            "report_version": self.report_version,
            "file_size_bytes": self.file_size_bytes,
            "generated_by_id": self.generated_by_id,
            "generated_by_name": self.generator.full_name if self.generator else None,
            "generated_at": self.generated_at.isoformat() if self.generated_at else None
        }
