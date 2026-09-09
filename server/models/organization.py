from datetime import datetime, timezone
from . import db

class Jurisdiction(db.Model):
    __tablename__ = "jurisdictions"

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False, index=True) # e.g. GUJ-AHM, DEL-CENTRAL
    name = db.Column(db.String(150), nullable=False) # e.g. Ahmedabad District, Central Delhi
    state = db.Column(db.String(100), nullable=False, index=True) # e.g. Gujarat, Delhi
    district = db.Column(db.String(100), nullable=True) # e.g. Ahmedabad, New Delhi
    description = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    plants = db.relationship("Plant", backref="jurisdiction_rel", lazy="select")
    inspector_eligibilities = db.relationship("InspectorJurisdictionEligibility", backref="jurisdiction", cascade="all, delete-orphan", lazy="select")

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "name": self.name,
            "state": self.state,
            "district": self.district,
            "description": self.description,
            "is_active": self.is_active,
            "plants_count": len(self.plants) if self.plants else 0,
            "inspectors_count": len(self.inspector_eligibilities) if self.inspector_eligibilities else 0,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class Plant(db.Model):
    __tablename__ = "plants"

    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey("manufacturers.id", ondelete="CASCADE"), nullable=False, index=True)
    plant_code = db.Column(db.String(50), nullable=False, index=True) # e.g. PLT-AHM-01
    name = db.Column(db.String(255), nullable=False) # e.g. Sanand Manufacturing Unit 1
    address = db.Column(db.Text, nullable=True)
    city = db.Column(db.String(100), nullable=True)
    state = db.Column(db.String(100), nullable=True, index=True)
    pin_code = db.Column(db.String(20), nullable=True)
    jurisdiction_id = db.Column(db.Integer, db.ForeignKey("jurisdictions.id", ondelete="SET NULL"), nullable=True, index=True)
    
    contact_person = db.Column(db.String(150), nullable=True)
    contact_email = db.Column(db.String(255), nullable=True)
    contact_phone = db.Column(db.String(50), nullable=True)
    
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "company_id": self.company_id,
            "company_name": self.company.name if self.company else None,
            "plant_code": self.plant_code,
            "name": self.name,
            "address": self.address,
            "city": self.city,
            "state": self.state,
            "pin_code": self.pin_code,
            "jurisdiction_id": self.jurisdiction_id,
            "jurisdiction_name": self.jurisdiction_rel.name if self.jurisdiction_rel else None,
            "jurisdiction_code": self.jurisdiction_rel.code if self.jurisdiction_rel else None,
            "contact_person": self.contact_person,
            "contact_email": self.contact_email,
            "contact_phone": self.contact_phone,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class InspectorCategoryEligibility(db.Model):
    __tablename__ = "inspector_category_eligibilities"

    id = db.Column(db.Integer, primary_key=True)
    inspector_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = db.Column(db.Integer, db.ForeignKey("product_categories.id", ondelete="CASCADE"), nullable=False, index=True)
    certified_date = db.Column(db.Date, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    category = db.relationship("ProductCategory", lazy="select")

    __table_args__ = (
        db.UniqueConstraint("inspector_id", "category_id", name="uq_inspector_category"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "inspector_id": self.inspector_id,
            "category_id": self.category_id,
            "category_code": self.category.category_code if self.category else None,
            "category_name": self.category.name if self.category else None,
            "certified_date": self.certified_date.isoformat() if self.certified_date else None,
            "notes": self.notes,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class InspectorJurisdictionEligibility(db.Model):
    __tablename__ = "inspector_jurisdiction_eligibilities"

    id = db.Column(db.Integer, primary_key=True)
    inspector_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    jurisdiction_id = db.Column(db.Integer, db.ForeignKey("jurisdictions.id", ondelete="CASCADE"), nullable=False, index=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        db.UniqueConstraint("inspector_id", "jurisdiction_id", name="uq_inspector_jurisdiction"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "inspector_id": self.inspector_id,
            "jurisdiction_id": self.jurisdiction_id,
            "jurisdiction_code": self.jurisdiction.code if self.jurisdiction else None,
            "jurisdiction_name": self.jurisdiction.name if self.jurisdiction else None,
            "jurisdiction_state": self.jurisdiction.state if self.jurisdiction else None,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
