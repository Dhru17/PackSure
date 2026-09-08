from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# Import all models to register with db.metadata
from .user import User, UserRole
from .product import Manufacturer, ProductCategory, Product
from .inspection import InspectionCase, CaseStatus, FinalDisposition
from .evidence import PackageEvidence, OCRDetection, SurfaceType, QualityVerdict
from .declaration import Declaration, DeclarationFieldType, ExtractionMethod, VerificationStatus
from .rule import RegulatoryRule, RuleCategoryMapping
from .compliance import ComplianceCheck, Violation, CheckStatus, ViolationSeverity, InspectorDecision, SeniorDecision
from .review import InspectorReview, SeniorReview, InspectorReviewAction, SeniorReviewAction
from .report import InspectionReport
from .audit import AuditLog, AuditActionType

__all__ = [
    "db",
    "User", "UserRole",
    "Manufacturer", "ProductCategory", "Product",
    "InspectionCase", "CaseStatus", "FinalDisposition",
    "PackageEvidence", "OCRDetection", "SurfaceType", "QualityVerdict",
    "Declaration", "DeclarationFieldType", "ExtractionMethod", "VerificationStatus",
    "RegulatoryRule", "RuleCategoryMapping",
    "ComplianceCheck", "Violation", "CheckStatus", "ViolationSeverity", "InspectorDecision", "SeniorDecision",
    "InspectorReview", "SeniorReview", "InspectorReviewAction", "SeniorReviewAction",
    "InspectionReport",
    "AuditLog", "AuditActionType"
]
