from flask import Blueprint, jsonify, request
from sqlalchemy import func
from models import db, InspectionCase, Violation, Product, Manufacturer, ProductCategory, User, UserRole, CaseStatus, FinalDisposition
from services.auth_service import require_auth, require_role

analytics_bp = Blueprint("analytics_bp", __name__, url_prefix="/api/analytics")

@analytics_bp.route("/summary", methods=["GET"])
@require_auth
def get_summary():
    total_cases = InspectionCase.query.count()
    finalized_cases = InspectionCase.query.filter_by(status=CaseStatus.FINALIZED).count()
    compliant = InspectionCase.query.filter_by(final_decision=FinalDisposition.COMPLIANT).count()
    non_compliant = InspectionCase.query.filter_by(final_decision=FinalDisposition.NON_COMPLIANT).count()
    pending_senior = InspectionCase.query.filter(
        InspectionCase.status.in_([CaseStatus.SUBMITTED, CaseStatus.ANALYSIS_COMPLETE, CaseStatus.SENIOR_REVIEW])
    ).count()

    comp_rate = round((compliant / max(finalized_cases, 1)) * 100.0, 1) if finalized_cases > 0 else 0.0

    # Rule violation distribution
    violations = Violation.query.all()
    rule_dist = {}
    for v in violations:
        r_code = v.rule_code
        rule_dist[r_code] = rule_dist.get(r_code, 0) + 1

    return jsonify({
        "total_cases": total_cases,
        "finalized_cases": finalized_cases,
        "compliant_cases": compliant,
        "non_compliant_cases": non_compliant,
        "pending_senior_review": pending_senior,
        "compliance_rate": comp_rate,
        "total_violations": len(violations),
        "rule_distribution": rule_dist
    })

@analytics_bp.route("/repeat-violators", methods=["GET"])
@require_role(["SENIOR_OFFICER", "ADMIN"])
def get_repeat_violators():
    """Identifies manufacturers with recurring contraventions across multiple inspections."""
    results = db.session.query(
        Manufacturer.name,
        func.count(InspectionCase.id).label("total_inspections"),
        func.count(Violation.id).label("total_violations")
    ).join(Product, Product.manufacturer_id == Manufacturer.id)\
     .join(InspectionCase, InspectionCase.product_id == Product.id)\
     .outerjoin(Violation, Violation.case_id == InspectionCase.id)\
     .group_by(Manufacturer.id)\
     .order_by(func.count(Violation.id).desc())\
     .limit(10).all()

    violator_list = []
    for row in results:
        violator_list.append({
            "manufacturer_name": row[0],
            "total_inspections": row[1],
            "total_violations": row[2] or 0
        })

    return jsonify({"repeat_violators": violator_list})
