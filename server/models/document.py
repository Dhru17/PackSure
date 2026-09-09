import enum
from datetime import datetime, timezone
from . import db

class DocumentStatus(str, enum.Enum):
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"

class CompanyDocument(db.Model):
    __tablename__ = "company_documents"

    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey("manufacturers.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = db.Column(db.Integer, db.ForeignKey("product_categories.id", ondelete="SET NULL"), nullable=True, index=True)
    plant_id = db.Column(db.Integer, db.ForeignKey("plants.id", ondelete="SET NULL"), nullable=True, index=True)
    
    document_type = db.Column(db.String(100), nullable=False, index=True) # e.g. MODEL_APPROVAL_CERTIFICATE, MANUFACTURING_LICENSE, PACKER_REGISTRATION, IMPORT_PERMIT
    title = db.Column(db.String(255), nullable=False)
    document_number = db.Column(db.String(100), nullable=True) # e.g. LM/REG/2024/7721
    file_url = db.Column(db.String(255), nullable=True)
    
    status = db.Column(db.Enum(DocumentStatus, name="document_statuses"), default=DocumentStatus.PENDING_VERIFICATION, nullable=False, index=True)
    rejection_reason = db.Column(db.Text, nullable=True) # Mandatory if rejected
    
    verified_by_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    verified_at = db.Column(db.DateTime, nullable=True)
    
    expiry_date = db.Column(db.Date, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    company = db.relationship("Manufacturer", lazy="select")
    category = db.relationship("ProductCategory", lazy="select")
    plant = db.relationship("Plant", lazy="select")
    verified_by = db.relationship("User", lazy="select")

    def to_dict(self):
        return {
            "id": self.id,
            "company_id": self.company_id,
            "company_name": self.company.name if self.company else None,
            "category_id": self.category_id,
            "category_name": self.category.name if self.category else None,
            "plant_id": self.plant_id,
            "plant_name": self.plant.name if self.plant else None,
            "document_type": self.document_type,
            "title": self.title,
            "document_number": self.document_number,
            "file_url": self.file_url,
            "status": self.status.value if hasattr(self.status, "value") else str(self.status),
            "rejection_reason": self.rejection_reason,
            "verified_by_name": self.verified_by.full_name if self.verified_by else None,
            "verified_at": self.verified_at.isoformat() if self.verified_at else None,
            "expiry_date": self.expiry_date.isoformat() if self.expiry_date else None,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
