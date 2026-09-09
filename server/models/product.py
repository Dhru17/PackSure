from datetime import datetime, timezone
from . import db

class Manufacturer(db.Model):
    __tablename__ = "manufacturers"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False, index=True)
    legal_entity_name = db.Column(db.String(255), nullable=True)
    address = db.Column(db.Text, nullable=True)
    city = db.Column(db.String(100), nullable=True)
    state = db.Column(db.String(100), nullable=True, index=True)
    pin_code = db.Column(db.String(20), nullable=True, index=True)
    contact_email = db.Column(db.String(255), nullable=True)
    contact_phone = db.Column(db.String(50), nullable=True)
    is_importer = db.Column(db.Boolean, default=False, nullable=False)
    registration_number = db.Column(db.String(100), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    
    # Analytics aggregation counters
    total_inspections = db.Column(db.Integer, default=0, nullable=False)
    total_violations = db.Column(db.Integer, default=0, nullable=False)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    products = db.relationship("Product", backref="manufacturer", lazy="select")
    plants = db.relationship("Plant", backref="company", cascade="all, delete-orphan", lazy="select")
    users = db.relationship("User", backref="company_profile", lazy="select")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "legal_name": self.legal_entity_name or self.name,
            "legal_entity_name": self.legal_entity_name,
            "address": self.address,
            "city": self.city,
            "state": self.state,
            "pin_code": self.pin_code,
            "contact_email": self.contact_email,
            "contact_phone": self.contact_phone,
            "is_importer": self.is_importer,
            "registration_number": self.registration_number,
            "is_active": self.is_active,
            "plants_count": len(self.plants) if self.plants else 0,
            "products_count": len(self.products) if self.products else 0,
            "total_inspections": self.total_inspections,
            "total_violations": self.total_violations,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

# Alias Company to Manufacturer for clean architectural naming
Company = Manufacturer

class ProductCategory(db.Model):
    __tablename__ = "product_categories"

    id = db.Column(db.Integer, primary_key=True)
    category_code = db.Column(db.String(100), unique=True, nullable=False, index=True)
    name = db.Column(db.String(150), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey("product_categories.id", ondelete="SET NULL"), nullable=True)
    description = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    subcategories = db.relationship("ProductCategory", backref=db.backref("parent", remote_side=[id]), lazy="select")
    products = db.relationship("Product", backref="category", lazy="select")

    def to_dict(self):
        return {
            "id": self.id,
            "category_code": self.category_code,
            "name": self.name,
            "parent_id": self.parent_id,
            "description": self.description,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    barcode = db.Column(db.String(100), unique=True, nullable=True, index=True)
    brand_name = db.Column(db.String(150), nullable=False, index=True)
    commodity_name = db.Column(db.String(255), nullable=False, index=True)
    category_id = db.Column(db.Integer, db.ForeignKey("product_categories.id", ondelete="RESTRICT"), nullable=True, index=True)
    manufacturer_id = db.Column(db.Integer, db.ForeignKey("manufacturers.id", ondelete="SET NULL"), nullable=True, index=True)
    package_type = db.Column(db.String(80), default="Rectangular Box", nullable=False)
    
    default_net_quantity = db.Column(db.String(100), nullable=True)
    default_mrp = db.Column(db.Float, nullable=True)
    is_imported = db.Column(db.Boolean, default=False, nullable=False)
    country_of_origin = db.Column(db.String(100), default="India", nullable=True)
    
    pdp_width_cm = db.Column(db.Float, nullable=True)
    pdp_height_cm = db.Column(db.Float, nullable=True)
    pdp_area_cm2 = db.Column(db.Float, nullable=True)
    
    metadata_json = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    inspections = db.relationship("InspectionCase", backref="product", lazy="select")

    def to_dict(self):
        return {
            "id": self.id,
            "barcode": self.barcode,
            "brand_name": self.brand_name,
            "commodity_name": self.commodity_name,
            "category_id": self.category_id,
            "category_name": self.category.name if self.category else None,
            "manufacturer_id": self.manufacturer_id,
            "manufacturer_name": self.manufacturer.name if self.manufacturer else None,
            "package_type": self.package_type,
            "default_net_quantity": self.default_net_quantity,
            "default_mrp": self.default_mrp,
            "is_imported": self.is_imported,
            "country_of_origin": self.country_of_origin,
            "pdp_width_cm": self.pdp_width_cm,
            "pdp_height_cm": self.pdp_height_cm,
            "pdp_area_cm2": self.pdp_area_cm2,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
