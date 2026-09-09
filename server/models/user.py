import enum
from datetime import datetime, timezone
import bcrypt
from . import db

class UserRole(str, enum.Enum):
    INSPECTOR = "INSPECTOR"
    SENIOR_OFFICER = "SENIOR_OFFICER"
    ADMIN = "ADMIN"
    COMPANY = "COMPANY"

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum(UserRole, name="user_roles"), nullable=False, default=UserRole.INSPECTOR, index=True)
    badge_number = db.Column(db.String(100), nullable=True)
    jurisdiction_district = db.Column(db.String(150), nullable=True, index=True)
    phone_number = db.Column(db.String(50), nullable=True)
    company_id = db.Column(db.Integer, db.ForeignKey("manufacturers.id", ondelete="SET NULL"), nullable=True, index=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    last_login_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Permanent Eligibility Relationships (Admin-configured)
    category_eligibilities = db.relationship("InspectorCategoryEligibility", foreign_keys="InspectorCategoryEligibility.inspector_id", backref="inspector", cascade="all, delete-orphan", lazy="select")
    jurisdiction_eligibilities = db.relationship("InspectorJurisdictionEligibility", foreign_keys="InspectorJurisdictionEligibility.inspector_id", backref="inspector", cascade="all, delete-orphan", lazy="select")

    def set_password(self, password: str):
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

    def check_password(self, password: str) -> bool:
        if not self.password_hash:
            return False
        return bcrypt.checkpw(password.encode("utf-8"), self.password_hash.encode("utf-8"))

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "role": self.role.value if hasattr(self.role, "value") else str(self.role),
            "badge_number": self.badge_number,
            "jurisdiction_district": self.jurisdiction_district,
            "phone_number": self.phone_number,
            "company_id": self.company_id,
            "is_active": self.is_active,
            "last_login_at": self.last_login_at.isoformat() if self.last_login_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
