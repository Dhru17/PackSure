from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# Import all models to register with db.metadata
from .user import User, UserRole
from .product import Manufacturer, ProductCategory, Product, Company
from .organization import Jurisdiction, Plant, InspectorCategoryEligibility, InspectorJurisdictionEligibility
from .inspection import InspectionCase, CaseStatus, FinalDisposition
from .evidence import PackageEvidence, OCRDetection, SurfaceType, QualityVerdict
from .declaration import Declaration, DeclarationFieldType, ExtractionMethod, VerificationStatus
from .rule import RegulatoryRule, RuleCategoryMapping, RuleRequirement
from .compliance import ComplianceCheck, Violation, CheckStatus, ViolationSeverity, InspectorDecision, SeniorDecision
from .review import InspectorReview, SeniorReview, InspectorReviewAction, SeniorReviewAction
from .report import InspectionReport
from .audit import AuditLog, AuditActionType
from .systemic_pattern import SystemicPattern, PatternStatus
from .document import CompanyDocument, DocumentStatus
from .notification import Notification

__all__ = [
    "db",
    "User", "UserRole",
    "Manufacturer", "Company", "ProductCategory", "Product",
    "Jurisdiction", "Plant", "InspectorCategoryEligibility", "InspectorJurisdictionEligibility",
    "InspectionCase", "CaseStatus", "FinalDisposition",
    "PackageEvidence", "OCRDetection", "SurfaceType", "QualityVerdict",
    "Declaration", "DeclarationFieldType", "ExtractionMethod", "VerificationStatus",
    "RegulatoryRule", "RuleCategoryMapping", "RuleRequirement",
    "ComplianceCheck", "Violation", "CheckStatus", "ViolationSeverity", "InspectorDecision", "SeniorDecision",
    "InspectorReview", "SeniorReview", "InspectorReviewAction", "SeniorReviewAction",
    "InspectionReport",
    "AuditLog", "AuditActionType",
    "SystemicPattern", "PatternStatus",
    "CompanyDocument", "DocumentStatus",
    "Notification"
]
