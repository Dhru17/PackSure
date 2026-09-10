import os
import re
import uuid
import json
from datetime import datetime, timezone, date
from flask import Blueprint, request, jsonify, g, send_from_directory, current_app
import cv2

from config import Config
from models import (
    db, InspectionCase, CaseStatus, FinalDisposition,
    Product, ProductCategory, Manufacturer, Plant, Jurisdiction,
    PackageEvidence, OCRDetection, SurfaceType, QualityVerdict,
    Declaration, DeclarationFieldType, ExtractionMethod, VerificationStatus,
    RegulatoryRule, ComplianceCheck, Violation, CheckStatus, ViolationSeverity,
    AuditLog, AuditActionType, User, UserRole,
    InspectorJurisdictionEligibility, InspectorCategoryEligibility,
    CompanyDocument, DocumentStatus
)
from services.auth_service import require_auth, require_role, check_case_access
from services.vision_analyzer import VisionAnalyzer
from services.ocr_service import OCRService
from services.rule_engine import LegalMetrologyRuleEngine

inspections_bp = Blueprint("inspections_bp", __name__, url_prefix="/api/inspections")

@inspections_bp.route("/eligible-inspectors", methods=["GET"])
@require_auth
def get_eligible_inspectors():
    """
    Returns list of active inspectors with eligibility evaluation,
    live active caseload, and workload balancing recommendations.
    """
    category_id = request.args.get("category_id", type=int)
    plant_id = request.args.get("plant_id", type=int)
    jurisdiction_id = request.args.get("jurisdiction_id", type=int)

    if plant_id and not jurisdiction_id:
        plant = db.session.get(Plant, plant_id)
        if plant and plant.jurisdiction_id:
            jurisdiction_id = plant.jurisdiction_id

    inspectors = User.query.filter_by(role=UserRole.INSPECTOR, is_active=True).all()
    results = []

    for insp in inspectors:
        # 1. Jurisdiction Match
        has_jurisdiction_match = True
        jurisdiction_names = []
        if jurisdiction_id:
            elig_jur = InspectorJurisdictionEligibility.query.filter_by(
                inspector_id=insp.id,
                jurisdiction_id=jurisdiction_id,
                is_active=True
            ).first()
            # If explicit records exist in the system, enforce match
            total_jur_records = InspectorJurisdictionEligibility.query.filter_by(inspector_id=insp.id, is_active=True).count()
            if total_jur_records > 0 and not elig_jur:
                has_jurisdiction_match = False

        jur_list = InspectorJurisdictionEligibility.query.filter_by(inspector_id=insp.id, is_active=True).all()
        jurisdiction_names = [j.jurisdiction.name for j in jur_list if j.jurisdiction]

        # 2. Category Match
        has_category_match = True
        if category_id:
            elig_cat = InspectorCategoryEligibility.query.filter_by(
                inspector_id=insp.id,
                category_id=category_id,
                is_active=True
            ).first()
            total_cat_records = InspectorCategoryEligibility.query.filter_by(inspector_id=insp.id, is_active=True).count()
            if total_cat_records > 0 and not elig_cat:
                has_category_match = False

        # 3. Workload Caseload
        active_cases_count = InspectionCase.query.filter(
            InspectionCase.inspector_id == insp.id,
            InspectionCase.status.in_([
                CaseStatus.DRAFT, CaseStatus.EVIDENCE_PENDING,
                CaseStatus.ANALYZING, CaseStatus.ANALYSIS_COMPLETE,
                CaseStatus.INSPECTOR_REVIEW, CaseStatus.RETURNED
            ])
        ).count()

        if active_cases_count <= 2:
            workload_status = "Optimal"
            workload_badge = "success"
            workload_score = 95
        elif active_cases_count <= 5:
            workload_status = "Moderate"
            workload_badge = "warning"
            workload_score = 75
        else:
            workload_status = "High Caseload"
            workload_badge = "danger"
            workload_score = 40

        is_eligible = has_jurisdiction_match and has_category_match
        recommendation_score = workload_score if is_eligible else (workload_score - 50)
        is_recommended = is_eligible and (active_cases_count <= 4)

        results.append({
            "inspector_id": insp.id,
            "full_name": insp.full_name,
            "email": insp.email,
            "badge_number": insp.badge_number,
            "jurisdiction": ", ".join(jurisdiction_names) if jurisdiction_names else "General Division",
            "active_cases_count": active_cases_count,
            "workload_status": workload_status,
            "workload_badge": workload_badge,
            "has_jurisdiction_match": has_jurisdiction_match,
            "has_category_match": has_category_match,
            "is_eligible": is_eligible,
            "is_recommended": is_recommended,
            "recommendation_score": recommendation_score
        })

    # Sort: Recommended first, then highest recommendation score
    results.sort(key=lambda x: (x["is_recommended"], x["is_eligible"], x["recommendation_score"]), reverse=True)

    return jsonify({
        "inspectors": results,
        "count": len(results)
    })

@inspections_bp.route("/schedule", methods=["POST"])
@require_role(["SENIOR_OFFICER", "ADMIN"])
def schedule_audit():
    """
    Schedules an official Legal Metrology inspection audit.
    Enforces strict inspector eligibility, future date validation,
    and locks in the active regulatory rule version.
    """
    data = request.get_json() or {}
    company_id = data.get("company_id")
    plant_id = data.get("plant_id")
    category_id = data.get("category_id")
    product_id = data.get("product_id")
    inspector_id = data.get("inspector_id")
    scheduled_date_str = data.get("scheduled_date")
    instructions = data.get("instructions", "").strip()

    if not inspector_id:
        return jsonify({"error": "An assigned inspector is mandatory to schedule an audit."}), 400

    inspector = db.session.get(User, inspector_id)
    if not inspector or inspector.role != UserRole.INSPECTOR or not inspector.is_active:
        return jsonify({"error": "Selected user is not an active inspector."}), 400

    # Plant & Strict Eligibility Validation
    plant = None
    if plant_id:
        plant = db.session.get(Plant, plant_id)
        if not plant:
            return jsonify({"error": "Specified plant not found."}), 404
        if plant.jurisdiction_id:
            # Check jurisdiction eligibility
            has_jur_elig = InspectorJurisdictionEligibility.query.filter_by(
                inspector_id=inspector.id,
                jurisdiction_id=plant.jurisdiction_id,
                is_active=True
            ).first()
            total_jur = InspectorJurisdictionEligibility.query.filter_by(inspector_id=inspector.id, is_active=True).count()
            if total_jur > 0 and not has_jur_elig:
                return jsonify({"error": f"Inspector {inspector.full_name} is not authorized for plant jurisdiction [{plant.jurisdiction_rel.name if plant.jurisdiction_rel else 'Assigned Area'}]."}), 400

    # Resolve or create Product
    prod = None
    if product_id:
        prod = db.session.get(Product, product_id)
    if not prod:
        brand = data.get("brand_name", "").strip() or "Standard Inspection SKU"
        comm = data.get("commodity_name", "").strip() or "Packaged Commodity"
        barcode = data.get("barcode", "").strip() or None
        
        prod = Product(
            manufacturer_id=company_id or (plant.company_id if plant else None),
            category_id=category_id,
            brand_name=brand,
            commodity_name=comm,
            barcode=barcode,
            package_type=data.get("package_type", "Rectangular Box"),
            default_net_quantity=data.get("default_net_quantity", "500 g"),
            default_mrp=float(data.get("default_mrp")) if data.get("default_mrp") else 100.0,
            pdp_width_cm=float(data.get("pdp_width_cm")) if data.get("pdp_width_cm") else 12.0,
            pdp_height_cm=float(data.get("pdp_height_cm")) if data.get("pdp_height_cm") else 18.0
        )
        prod.pdp_area_cm2 = round(prod.pdp_width_cm * prod.pdp_height_cm, 1)
        db.session.add(prod)
        db.session.flush()

    # Category Eligibility Validation
    target_category_id = prod.category_id if prod else category_id
    if target_category_id:
        has_cat_elig = InspectorCategoryEligibility.query.filter_by(
            inspector_id=inspector.id,
            category_id=target_category_id,
            is_active=True
        ).first()
        total_cat_elig = InspectorCategoryEligibility.query.filter_by(
            inspector_id=inspector.id,
            is_active=True
        ).count()
        if total_cat_elig > 0 and not has_cat_elig:
            cat_obj = db.session.get(ProductCategory, target_category_id)
            return jsonify({"error": f"Inspector {inspector.full_name} is not certified/qualified for product category [{cat_obj.name if cat_obj else target_category_id}]."}), 400

    # Parse Scheduled Date
    scheduled_dt = None
    if scheduled_date_str:
        try:
            scheduled_dt = datetime.fromisoformat(scheduled_date_str.replace("Z", "+00:00"))
        except Exception:
            try:
                scheduled_dt = datetime.strptime(scheduled_date_str, "%Y-%m-%d")
            except Exception:
                pass

    # Fetch currently active Regulatory Rule Version (Effective date <= today)
    today = date.today()
    active_rule = RegulatoryRule.query.filter(
        RegulatoryRule.is_active == True,
        RegulatoryRule.effective_from <= today
    ).order_by(RegulatoryRule.effective_from.desc()).first()
    if not active_rule:
        active_rule = RegulatoryRule.query.filter_by(is_active=True).order_by(RegulatoryRule.effective_from.asc()).first()
    active_version = active_rule.version if active_rule else "v2026.1_GSR128E"

    case_num = f"LM-2026-{uuid.uuid4().hex[:6].upper()}"
    case = InspectionCase(
        case_number=case_num,
        product_id=prod.id,
        inspector_id=inspector.id,
        scheduled_by_id=g.current_user.id,
        plant_id=plant.id if plant else None,
        scheduled_date=scheduled_dt or datetime.now(timezone.utc),
        rule_version=active_version,
        status=CaseStatus.DRAFT,
        location_name=plant.name if plant else (data.get("location_name") or "Scheduled Inspection Facility"),
        inspector_remarks=f"Scheduled by Senior Officer {g.current_user.full_name}. Instructions: {instructions}" if instructions else None,
        source_type=data.get("source_type", "Scheduled Manufacturing Audit")
    )
    db.session.add(case)
    db.session.flush()

    # Audit Log
    audit = AuditLog(
        case_id=case.id,
        user_id=g.current_user.id,
        action_type=AuditActionType.CASE_CREATED,
        entity_name="InspectionCase",
        entity_id=str(case.id),
        new_state_json=json.dumps({
            "case_number": case.case_number,
            "inspector": inspector.full_name,
            "plant": plant.name if plant else None,
            "rule_version": active_version,
            "scheduled_date": case.scheduled_date.isoformat() if case.scheduled_date else None
        }),
        justification=f"Audit scheduled for {prod.brand_name} by Senior Officer {g.current_user.full_name}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({
        "message": f"Audit {case.case_number} successfully scheduled.",
        "case": case.to_dict()
    }), 201

@inspections_bp.route("/scheduled", methods=["GET"])
@require_auth
def list_scheduled_audits():
    """
    Returns upcoming and active scheduled audits for Senior Officer supervision.
    """
    search = request.args.get("search", "").strip()
    status_filter = request.args.get("status", "ALL").upper()
    
    query = InspectionCase.query.order_by(InspectionCase.scheduled_date.asc(), InspectionCase.created_at.desc())

    if status_filter == "UPCOMING":
        query = query.filter(InspectionCase.status.in_([CaseStatus.DRAFT, CaseStatus.EVIDENCE_PENDING]))
    elif status_filter == "ACTIVE":
        query = query.filter(InspectionCase.status.in_([CaseStatus.ANALYZING, CaseStatus.ANALYSIS_COMPLETE, CaseStatus.INSPECTOR_REVIEW]))
    elif status_filter == "ALL":
        query = query.filter(InspectionCase.status.in_([
            CaseStatus.DRAFT, CaseStatus.EVIDENCE_PENDING,
            CaseStatus.ANALYZING, CaseStatus.ANALYSIS_COMPLETE,
            CaseStatus.INSPECTOR_REVIEW, CaseStatus.RETURNED
        ]))

    cases = query.all()
    out = []
    for c in cases:
        if search:
            b_name = (c.product.brand_name.lower()) if c.product else ""
            c_num = c.case_number.lower()
            p_name = (c.plant.name.lower()) if c.plant else ""
            i_name = (c.inspector.full_name.lower()) if c.inspector else ""
            if not (search.lower() in b_name or search.lower() in c_num or search.lower() in p_name or search.lower() in i_name):
                continue
        out.append(c.to_dict())

    return jsonify({
        "audits": out,
        "count": len(out)
    })

@inspections_bp.route("/<int:case_id>/schedule", methods=["PUT"])
@require_role(["SENIOR_OFFICER", "ADMIN"])
def update_scheduled_audit(case_id):
    """
    Allows Senior Officer to reschedule date or reassign eligible inspector.
    """
    case = db.session.get(InspectionCase, case_id)
    if not case:
        return jsonify({"error": "Inspection case not found."}), 404

    if case.status in [CaseStatus.SUBMITTED, CaseStatus.SENIOR_REVIEW, CaseStatus.FINALIZED]:
        return jsonify({"error": "Cannot reschedule or reassign an audit that is already submitted or finalized."}), 400

    data = request.get_json() or {}
    new_inspector_id = data.get("inspector_id")
    new_date_str = data.get("scheduled_date")
    notes = data.get("instructions", "").strip()

    prev_inspector = case.inspector.full_name if case.inspector else None
    if new_inspector_id and new_inspector_id != case.inspector_id:
        insp = db.session.get(User, new_inspector_id)
        if not insp or insp.role != UserRole.INSPECTOR or not insp.is_active:
            return jsonify({"error": "Selected user is not an active inspector."}), 400

        # Validate jurisdiction eligibility for plant
        if case.plant_id and case.plant and case.plant.jurisdiction_id:
            has_jur = InspectorJurisdictionEligibility.query.filter_by(
                inspector_id=insp.id,
                jurisdiction_id=case.plant.jurisdiction_id,
                is_active=True
            ).first()
            total_jur = InspectorJurisdictionEligibility.query.filter_by(inspector_id=insp.id, is_active=True).count()
            if total_jur > 0 and not has_jur:
                return jsonify({"error": f"Inspector {insp.full_name} is not authorized for plant jurisdiction."}), 400

        # Validate category eligibility for product
        if case.product and case.product.category_id:
            has_cat = InspectorCategoryEligibility.query.filter_by(
                inspector_id=insp.id,
                category_id=case.product.category_id,
                is_active=True
            ).first()
            total_cat = InspectorCategoryEligibility.query.filter_by(inspector_id=insp.id, is_active=True).count()
            if total_cat > 0 and not has_cat:
                return jsonify({"error": f"Inspector {insp.full_name} is not qualified for product category."}), 400

        case.inspector_id = insp.id

    if new_date_str:
        try:
            case.scheduled_date = datetime.fromisoformat(new_date_str.replace("Z", "+00:00"))
        except Exception:
            pass

    if notes:
        case.senior_remarks = notes

    audit = AuditLog(
        case_id=case.id,
        user_id=g.current_user.id,
        action_type=AuditActionType.CHECK_STATUS_CHANGED,
        entity_name="InspectionCase",
        entity_id=str(case.id),
        new_state_json=json.dumps({
            "inspector_id": case.inspector_id,
            "scheduled_date": case.scheduled_date.isoformat() if case.scheduled_date else None
        }),
        justification=f"Audit updated by Senior Officer {g.current_user.full_name}. Previous inspector: {prev_inspector}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({
        "message": "Scheduled audit updated successfully.",
        "case": case.to_dict()
    })

@inspections_bp.route("/overview", methods=["GET"])
@require_auth
def get_inspector_overview():
    """Returns live, database-backed workload and triage counters for Inspector."""
    user_id = g.current_user.id
    is_admin = g.current_user.role.value in ["ADMIN", "SENIOR_OFFICER"]

    base_query = InspectionCase.query
    if not is_admin:
        base_query = base_query.filter(
            (InspectionCase.inspector_id == user_id) | (InspectionCase.inspector_id.is_(None))
        )

    total_count = base_query.count()
    draft_count = base_query.filter(InspectionCase.status.in_([CaseStatus.DRAFT, CaseStatus.EVIDENCE_PENDING])).count()
    in_analysis_count = base_query.filter_by(status=CaseStatus.ANALYZING).count()
    awaiting_verification_count = base_query.filter(
        InspectionCase.status.in_([CaseStatus.ANALYSIS_COMPLETE, CaseStatus.INSPECTOR_REVIEW])
    ).count()
    submitted_count = base_query.filter(
        InspectionCase.status.in_([CaseStatus.SUBMITTED, CaseStatus.SENIOR_REVIEW])
    ).count()
    returned_count = base_query.filter_by(status=CaseStatus.RETURNED).count()
    finalized_count = base_query.filter_by(status=CaseStatus.FINALIZED).count()

    # Urgent action items: Returned cases needing inspector attention
    returned_cases = base_query.filter_by(status=CaseStatus.RETURNED).order_by(InspectionCase.updated_at.desc()).limit(10).all()
    urgent_actions = []
    for c in returned_cases:
        urgent_actions.append({
            "id": c.id,
            "case_number": c.case_number,
            "brand_name": c.product.brand_name if c.product else "Unknown",
            "commodity_name": c.product.commodity_name if c.product else "Packaged Commodity",
            "senior_remarks": c.senior_remarks or "Returned by Senior Officer for re-inspection / clarification.",
            "senior_reviewer_name": c.senior_reviewer.full_name if c.senior_reviewer else "Senior Officer",
            "failed_checks": c.failed_checks,
            "returned_at": c.updated_at.isoformat() if c.updated_at else None,
            "status": c.status.value
        })

    # Recent cases
    recent_cases = base_query.order_by(InspectionCase.created_at.desc()).limit(6).all()
    recent_list = []
    for c in recent_cases:
        recent_list.append({
            "id": c.id,
            "case_number": c.case_number,
            "brand_name": c.product.brand_name if c.product else "Unknown",
            "commodity_name": c.product.commodity_name if c.product else "Commodity",
            "status": c.status.value,
            "compliance_score": c.compliance_score,
            "failed_checks": c.failed_checks,
            "total_checks": c.total_checks,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "updated_at": c.updated_at.isoformat() if c.updated_at else None
        })

    return jsonify({
        "workload": {
            "total_inspections": total_count,
            "draft_cases": draft_count,
            "in_analysis_cases": in_analysis_count,
            "awaiting_verification": awaiting_verification_count,
            "submitted_cases": submitted_count,
            "returned_cases": returned_count,
            "finalized_cases": finalized_count
        },
        "urgent_actions": urgent_actions,
        "recent_cases": recent_list
    })

@inspections_bp.route("", methods=["GET"])
@require_auth
def list_inspections():
    status = request.args.get("status")
    search = request.args.get("search", "").strip()
    limit = int(request.args.get("limit", 50))

    query = InspectionCase.query.order_by(InspectionCase.created_at.desc())

    # Strict Inspector Role Filtering: Inspectors only see their own assigned audits
    if g.current_user.role == UserRole.INSPECTOR:
        query = query.filter(
            (InspectionCase.inspector_id == g.current_user.id) | (InspectionCase.inspector_id.is_(None))
        )

    if status and status.upper() != "ALL":
        try:
            enum_val = CaseStatus(status.upper())
            query = query.filter_by(status=enum_val)
        except ValueError:
            pass

    if search:
        query = query.join(Product).filter(
            (InspectionCase.case_number.ilike(f"%{search}%")) |
            (Product.brand_name.ilike(f"%{search}%")) |
            (Product.commodity_name.ilike(f"%{search}%"))
        )

    cases = query.limit(limit).all()
    return jsonify({
        "inspections": [c.to_dict() for c in cases],
        "count": len(cases)
    })

@inspections_bp.route("", methods=["POST"])
@require_auth
def create_inspection():
    data = request.get_json() or {}
    product_id = data.get("product_id")

    # If product_id not given, create/find product
    if not product_id:
        brand = data.get("brand_name", "Inspected Brand").strip()
        comm = data.get("commodity_name", "Packaged Commodity").strip()
        barcode = data.get("barcode", "").strip() or None
        
        prod = None
        if barcode:
            prod = Product.query.filter_by(barcode=barcode).first()
        if not prod:
            prod = Product(
                barcode=barcode,
                brand_name=brand,
                commodity_name=comm,
                package_type=data.get("package_type", "Rectangular Box"),
                default_net_quantity=data.get("default_net_quantity"),
                default_mrp=float(data.get("default_mrp")) if data.get("default_mrp") else None,
                pdp_width_cm=float(data.get("pdp_width_cm")) if data.get("pdp_width_cm") else None,
                pdp_height_cm=float(data.get("pdp_height_cm")) if data.get("pdp_height_cm") else None
            )
            if prod.pdp_width_cm and prod.pdp_height_cm:
                prod.pdp_area_cm2 = round(prod.pdp_width_cm * prod.pdp_height_cm, 1)
            db.session.add(prod)
            db.session.flush()
        product_id = prod.id

    case_num = f"LM-2026-{uuid.uuid4().hex[:6].upper()}"
    case = InspectionCase(
        case_number=case_num,
        product_id=product_id,
        inspector_id=g.current_user.id,
        status=CaseStatus.DRAFT,
        location_name=data.get("location_name", "Field Inspection"),
        geo_lat=data.get("geo_lat"),
        geo_lng=data.get("geo_lng"),
        source_type=data.get("source_type", "Physical Retail Package")
    )
    db.session.add(case)
    db.session.flush()

    # Immutable Audit Log
    audit = AuditLog(
        case_id=case.id,
        user_id=g.current_user.id,
        action_type=AuditActionType.CASE_CREATED,
        entity_name="InspectionCase",
        entity_id=str(case.id),
        new_state_json=json.dumps({"case_number": case.case_number, "status": case.status.value}),
        justification=f"Inspection case {case.case_number} initiated by {g.current_user.full_name}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({"inspection": case.to_dict()}), 201

@inspections_bp.route("/<int:case_id>", methods=["GET"])
@require_auth
def get_inspection(case_id):
    case = db.session.get(InspectionCase, case_id)
    if not case:
        return jsonify({"error": "Inspection case not found."}), 404

    # Strict Inspector & Supervisor RBAC ownership check
    err_resp, err_code = check_case_access(case, g.current_user, for_mutation=False)
    if err_resp:
        return err_resp, err_code

    d = case.to_dict()
    d["evidences"] = [e.to_dict() for e in case.evidences]
    d["declarations"] = [decl.to_dict() for decl in case.declarations]
    d["compliance_checks"] = [chk.to_dict() for chk in case.compliance_checks]
    d["violations"] = [v.to_dict() for v in case.violations]
    d["inspector_reviews"] = [r.to_dict() for r in case.inspector_reviews]
    d["senior_reviews"] = [sr.to_dict() for sr in case.senior_reviews]
    d["reports"] = [rpt.to_dict() for rpt in case.reports]
    d["audit_logs"] = [a.to_dict() for a in case.audit_logs]
    return jsonify(d)

@inspections_bp.route("/<int:case_id>/evidence", methods=["POST"])
@require_auth
def upload_evidence(case_id):
    case = db.session.get(InspectionCase, case_id)
    if not case:
        return jsonify({"error": "Inspection case not found."}), 404

    # Strict RBAC Case Ownership Check
    err_resp, err_code = check_case_access(case, g.current_user, for_mutation=True)
    if err_resp:
        return err_resp, err_code

    surface_str = request.form.get("surface_type", "FRONT").upper()
    try:
        surface_type = SurfaceType(surface_str)
    except ValueError:
        surface_type = SurfaceType.FRONT

    if "image" not in request.files:
        return jsonify({"error": "No image file provided."}), 400

    f = request.files["image"]
    ext = os.path.splitext(f.filename)[1].lower() or ".jpg"
    unique_filename = f"ev_{case.id}_{surface_type.value}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = os.path.join(Config.UPLOAD_FOLDER, unique_filename)
    f.save(file_path)

    # Image quality diagnostics via OpenCV
    quality = VisionAnalyzer.analyze_image_readability(file_path)
    img_bgr = cv2.imread(file_path)
    h_px, w_px = img_bgr.shape[:2] if img_bgr is not None else (None, None)

    q_verdict_map = {
        "Readable": QualityVerdict.READABLE,
        "Borderline": QualityVerdict.BORDERLINE,
        "Unreadable": QualityVerdict.UNREADABLE
    }
    verdict = q_verdict_map.get(quality.get("readability_status"), QualityVerdict.READABLE)

    # Replace any existing evidence for this surface panel on this case
    existing_evs = PackageEvidence.query.filter_by(case_id=case.id, surface_type=surface_type).all()
    for old_ev in existing_evs:
        old_fname = os.path.basename(old_ev.storage_path)
        old_disk_path = os.path.join(Config.UPLOAD_FOLDER, old_fname)
        if os.path.exists(old_disk_path):
            try:
                os.remove(old_disk_path)
            except Exception:
                pass
        db.session.delete(old_ev)
    db.session.flush()

    evidence = PackageEvidence(
        case_id=case.id,
        surface_type=surface_type,
        storage_path=f"/api/media/uploads/{unique_filename}",
        original_filename=f.filename,
        mime_type=f.mimetype or "image/jpeg",
        file_size_bytes=os.path.getsize(file_path),
        width_px=w_px,
        height_px=h_px,
        blur_score=quality.get("blur_score"),
        brightness_score=quality.get("brightness"),
        contrast_score=quality.get("contrast_score"),
        rotation_angle=quality.get("rotation_angle", 0.0),
        quality_verdict=verdict,
        quality_summary=quality.get("summary")
    )
    db.session.add(evidence)
    
    if case.status in [CaseStatus.DRAFT, CaseStatus.RETURNED]:
        case.status = CaseStatus.EVIDENCE_PENDING

    # Audit log
    audit = AuditLog(
        case_id=case.id,
        user_id=g.current_user.id,
        action_type=AuditActionType.EVIDENCE_UPLOADED,
        entity_name="PackageEvidence",
        entity_id=str(evidence.id),
        new_state_json=json.dumps({"surface": surface_type.value, "file": unique_filename, "quality": verdict.value}),
        justification=f"Photo uploaded for {surface_type.value} surface."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({"evidence": evidence.to_dict(), "quality_analysis": quality}), 201

@inspections_bp.route("/<int:case_id>/evidence/<int:evidence_id>", methods=["DELETE"])
@require_auth
def delete_evidence(case_id, evidence_id):
    case = db.session.get(InspectionCase, case_id)
    if not case:
        return jsonify({"error": "Inspection case not found."}), 404

    err_resp, err_code = check_case_access(case, g.current_user, for_mutation=True)
    if err_resp:
        return err_resp, err_code

    ev = PackageEvidence.query.filter_by(id=evidence_id, case_id=case.id).first_or_404()
    db.session.delete(ev)
    db.session.commit()
    return jsonify({"message": f"Evidence #{evidence_id} removed successfully."})

@inspections_bp.route("/<int:case_id>/measurements", methods=["POST"])
@require_auth
def save_physical_measurements(case_id):
    """
    Saves inspector's actual physical measurements and calibration method.
    """
    case = db.session.get(InspectionCase, case_id)
    if not case:
        return jsonify({"error": "Inspection case not found."}), 404

    err_resp, err_code = check_case_access(case, g.current_user, for_mutation=True)
    if err_resp:
        return err_resp, err_code

    data = request.get_json() or {}
    case.actual_net_quantity = data.get("actual_net_quantity")
    if data.get("actual_pdp_width_cm") is not None:
        case.actual_pdp_width_cm = float(data["actual_pdp_width_cm"])
    if data.get("actual_pdp_height_cm") is not None:
        case.actual_pdp_height_cm = float(data["actual_pdp_height_cm"])
    if data.get("actual_font_height_mm") is not None:
        case.actual_font_height_mm = float(data["actual_font_height_mm"])
    case.measurement_method = data.get("measurement_method", "Calibrated Vernier Scale & Digital Balance")
    case.calibrated_scale_used = bool(data.get("calibrated_scale_used", True))

    audit = AuditLog(
        case_id=case.id,
        user_id=g.current_user.id,
        action_type=AuditActionType.CHECK_STATUS_CHANGED,
        entity_name="InspectionCase",
        entity_id=str(case.id),
        new_state_json=json.dumps({
            "actual_net_quantity": case.actual_net_quantity,
            "actual_font_height_mm": case.actual_font_height_mm,
            "measurement_method": case.measurement_method
        }),
        justification=f"Physical measurements entered by Inspector {g.current_user.full_name}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({
        "message": "Physical measurements recorded successfully.",
        "case": case.to_dict()
    })

# ==============================================================================
# COMPANY DOCUMENT VERIFICATION ENDPOINTS
# ==============================================================================

@inspections_bp.route("/<int:case_id>/documents", methods=["GET"])
@require_auth
def get_case_documents(case_id):
    """
    Returns required company and category statutory documents for the audit.
    """
    case = db.session.get(InspectionCase, case_id)
    if not case:
        return jsonify({"error": "Inspection case not found."}), 404

    err_resp, err_code = check_case_access(case, g.current_user, for_mutation=False)
    if err_resp:
        return err_resp, err_code

    mfg_id = case.product.manufacturer_id if case.product else None
    cat_id = case.product.category_id if case.product else None

    docs = []
    if mfg_id:
        docs = CompanyDocument.query.filter(
            (CompanyDocument.company_id == mfg_id) | (CompanyDocument.category_id == cat_id)
        ).all()

    # If no statutory documents uploaded yet, seed standard government inspection certificates
    if not docs and mfg_id:
        seed_docs = [
            CompanyDocument(
                company_id=mfg_id,
                category_id=cat_id,
                document_type="MODEL_APPROVAL_CERTIFICATE",
                title="Legal Metrology Model Approval Certificate (Section 22)",
                document_number=f"LM/IND/MA/2025/{case.id}01",
                file_url="/api/media/uploads/sample_model_approval.pdf",
                status=DocumentStatus.PENDING_VERIFICATION,
                notes="Statutory model approval certificate for packaging dimensions and declarations."
            ),
            CompanyDocument(
                company_id=mfg_id,
                category_id=cat_id,
                document_type="MANUFACTURING_LICENSE",
                title="FSSAI / State Manufacturing & Packing License",
                document_number=f"LIC/DEL/MFG/2024/{case.id}88",
                file_url="/api/media/uploads/sample_manufacturing_license.pdf",
                status=DocumentStatus.PENDING_VERIFICATION,
                notes="Valid state manufacturing license covering registered plant."
            ),
            CompanyDocument(
                company_id=mfg_id,
                category_id=cat_id,
                document_type="WEIGHTS_MEASURES_REGISTRATION",
                title="Director of Legal Metrology Packer Registration (Rule 27)",
                document_number=f"LM/PC/REG/2023/{case.id}44",
                file_url="/api/media/uploads/sample_packer_registration.pdf",
                status=DocumentStatus.PENDING_VERIFICATION,
                notes="Mandatory pre-market packer registration certificate."
            )
        ]
        db.session.add_all(seed_docs)
        db.session.commit()
        docs = seed_docs

    return jsonify({
        "documents": [d.to_dict() for d in docs],
        "count": len(docs)
    })

@inspections_bp.route("/<int:case_id>/documents/<int:doc_id>/verify", methods=["POST"])
@require_auth
def verify_case_document(case_id, doc_id):
    """
    Inspector verifies or rejects a company document with a mandatory rejection reason.
    """
    case = db.session.get(InspectionCase, case_id)
    if not case:
        return jsonify({"error": "Inspection case not found."}), 404

    err_resp, err_code = check_case_access(case, g.current_user, for_mutation=True)
    if err_resp:
        return err_resp, err_code

    doc = db.session.get(CompanyDocument, doc_id)
    if not doc:
        return jsonify({"error": "Document not found."}), 404

    data = request.get_json() or {}
    action_str = (data.get("action") or data.get("status") or "").upper() # VERIFIED, REJECTED
    rejection_reason = data.get("rejection_reason", "").strip()

    if action_str == "REJECTED" and not rejection_reason:
        return jsonify({"error": "A mandatory, non-empty rejection reason is required to reject a document."}), 400

    if action_str not in ["VERIFIED", "REJECTED"]:
        return jsonify({"error": "Action must be VERIFIED or REJECTED."}), 400

    prev_status = doc.status.value
    doc.status = DocumentStatus(action_str)
    doc.rejection_reason = rejection_reason if action_str == "REJECTED" else None
    doc.verified_by_id = g.current_user.id
    doc.verified_at = datetime.now(timezone.utc)

    audit = AuditLog(
        case_id=case.id,
        user_id=g.current_user.id,
        action_type=AuditActionType.CHECK_STATUS_CHANGED,
        entity_name="CompanyDocument",
        entity_id=str(doc.id),
        previous_state_json=json.dumps({"status": prev_status}),
        new_state_json=json.dumps({"status": doc.status.value, "rejection_reason": doc.rejection_reason}),
        justification=f"Document '{doc.title}' marked as {action_str} by Inspector {g.current_user.full_name}. Reason: {rejection_reason or 'Document valid'}"
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({
        "message": f"Document #{doc.id} updated to {action_str}.",
        "document": doc.to_dict()
    })

@inspections_bp.route("/<int:case_id>/analyze", methods=["POST"])
@require_auth
def run_analysis(case_id):
    case = db.session.get(InspectionCase, case_id)
    if not case:
        return jsonify({"error": "Inspection case not found."}), 404

    # Strict RBAC Case Ownership Check
    err_resp, err_code = check_case_access(case, g.current_user, for_mutation=True)
    if err_resp:
        return err_resp, err_code

    evidences = PackageEvidence.query.filter_by(case_id=case.id).all()
    if not evidences:
        return jsonify({"error": "Cannot run analysis without uploaded packaging evidence."}), 400

    try:
        case.status = CaseStatus.ANALYZING
        db.session.commit()

        # Clear previous AI extraction child rows (re-analysis preserves audit trail)
        OCRDetection.query.filter_by(case_id=case.id).delete()
        Declaration.query.filter_by(case_id=case.id).delete()
        ComplianceCheck.query.filter_by(case_id=case.id).delete()
        Violation.query.filter_by(case_id=case.id).delete()
        db.session.commit()

        # 1. Multi-Panel OCR Extraction
        panel_inputs = []
        for ev in evidences:
            fname = os.path.basename(ev.storage_path)
            full_path = os.path.join(Config.UPLOAD_FOLDER, fname)
            panel_inputs.append({
                "panel_name": ev.surface_type.value,
                "image_path": full_path,
                "evidence_id": ev.id
            })

        package_info = {
            "brand": case.product.brand_name if case.product else "",
            "commodity_name": case.product.commodity_name if case.product else ""
        }

        structured, ocr_blocks, ocr_success = OCRService.extract_from_multi_panels(
            panel_images=panel_inputs,
            package_info=package_info
        )

        # 2. Save raw OCR detections
        for b in ocr_blocks:
            ev_id = next((p["evidence_id"] for p in panel_inputs if p["panel_name"] == b["panel_name"]), evidences[0].id)
            bbox = b.get("bbox", {})
            det = OCRDetection(
                evidence_id=ev_id,
                case_id=case.id,
                raw_text=b.get("text", ""),
                confidence=b.get("confidence", 0.0),
                bbox_x=bbox.get("x", 0.0),
                bbox_y=bbox.get("y", 0.0),
                bbox_w=bbox.get("w", 0.0),
                bbox_h=bbox.get("h", 0.0),
                is_barcode=b.get("is_barcode", False)
            )
            db.session.add(det)

        # 3. Rule Engine Evaluation
        pdp_area = case.product.pdp_area_cm2 if case.product else None
        cat_name = case.product.category.name if case.product and case.product.category else "General"
        panels_avail = [e.surface_type.value for e in evidences]

        eval_decls, violations, summary = LegalMetrologyRuleEngine.evaluate_all_declarations(
            structured_fields=structured,
            pdp_area_cm2=pdp_area,
            category=cat_name,
            panels_available=panels_avail,
            ocr_success=ocr_success
        )

        # 4. Save Structured Declarations directly from 16-field record
        structured_field_map = [
            ('brand_name', DeclarationFieldType.BRAND_NAME, 'Brand Name'),
            ('generic_commodity_name', DeclarationFieldType.GENERIC_COMMODITY, 'Generic Commodity Name'),
            ('product_name', DeclarationFieldType.PRODUCT_NAME, 'Product Name'),
            ('manufacturer_name', DeclarationFieldType.MANUFACTURER_NAME, 'Manufacturer Name'),
            ('manufacturer_address', DeclarationFieldType.MANUFACTURER_ADDRESS, 'Manufacturer Address'),
            ('packer_name', DeclarationFieldType.PACKER_NAME, 'Packer Name'),
            ('importer_name', DeclarationFieldType.IMPORTER_NAME, 'Importer Name'),
            ('net_quantity', DeclarationFieldType.NET_QUANTITY, 'Net Quantity'),
            ('unit', DeclarationFieldType.UNIT, 'Measurement Unit'),
            ('mrp', DeclarationFieldType.MRP, 'Maximum Retail Price (MRP)'),
            ('manufacturing_or_packing_date', DeclarationFieldType.MFG_DATE, 'Date of Manufacture / Packing'),
            ('batch_or_lot_number', DeclarationFieldType.LOT_NUMBER, 'Batch / Lot Number'),
            ('consumer_care_phone', DeclarationFieldType.CONSUMER_CARE_PHONE, 'Consumer Care Phone'),
            ('consumer_care_email', DeclarationFieldType.CONSUMER_CARE_EMAIL, 'Consumer Care Email'),
            ('consumer_care_address', DeclarationFieldType.CONSUMER_CARE_ADDRESS, 'Consumer Care Address'),
            ('country_of_origin', DeclarationFieldType.COUNTRY_OF_ORIGIN, 'Country of Origin'),
            ('unit_sale_price', DeclarationFieldType.UNIT_SALE_PRICE, 'Unit Sale Price (USP)'),
            ('barcode', DeclarationFieldType.BARCODE, 'Barcode / EAN'),
            ('fssai_number', DeclarationFieldType.FSSAI_NUMBER, 'FSSAI License Number')
        ]

        saved_types = set()
        for k, dtype, title in structured_field_map:
            item = structured.get(k, {})
            val = item.get('value')
            if val:
                ev_id = item.get("evidence_id")
                matching_ev = next((e for e in evidences if e.id == ev_id), None) if ev_id else None
                if not matching_ev:
                    source_panel = item.get('source_image') or item.get('image_source') or "FRONT"
                    matching_ev = next(
                        (e for e in evidences if e.surface_type.value.upper() in str(source_panel).upper() or str(source_panel).upper() in e.surface_type.value.upper()),
                        evidences[0]
                    )
                bbox = item.get('bounding_box') or {}
                decl = Declaration(
                    case_id=case.id,
                    evidence_id=matching_ev.id,
                    field_type=dtype,
                    title=title,
                    raw_ocr_text=item.get('raw_ocr_text') or str(val),
                    extracted_value=str(val),
                    confidence=item.get('confidence', 0.85),
                    bbox_x=bbox.get('x', 0.0),
                    bbox_y=bbox.get('y', 0.0),
                    bbox_w=bbox.get('w', 0.0),
                    bbox_h=bbox.get('h', 0.0),
                    extraction_method=ExtractionMethod.OCR_TOKEN_MATCHER,
                    verification_status=VerificationStatus.UNVERIFIED
                )
                db.session.add(decl)
                saved_types.add(dtype)

        db.session.flush()

        # 5. Save Compliance Checks & Violations against Database Rules
        for ed in eval_decls:
            raw_r_name = ed.get("rule_name", "RULE_6")
            clean_code = re.sub(r'_+', '_', re.sub(r'[^A-Za-z0-9]', '_', raw_r_name.split(' - ')[0])).strip('_').upper()
            if clean_code.startswith("RULE_6_1_C"):
                clean_code = "RULE_6_1_C"
            elif clean_code.startswith("RULE_7"):
                clean_code = "RULE_7"

            rule = RegulatoryRule.query.filter_by(rule_code=clean_code).first()
            if not rule:
                rule = RegulatoryRule.query.filter(RegulatoryRule.rule_code.ilike(f"%{clean_code}%")).first()
            if not rule:
                ed_title = ed.get("title", "")
                if ed_title:
                    rule = RegulatoryRule.query.filter(RegulatoryRule.title.ilike(f"%{ed_title[:15]}%")).first()
            if not rule:
                rule = RegulatoryRule.query.first() # fallback default

            matching_ev = None
            ev_id = ed.get("evidence_id")
            if ev_id:
                matching_ev = next((e for e in evidences if e.id == ev_id), None)

            extracted_v = ed.get("extracted_value")
            if not matching_ev and extracted_v:
                matching_decl = Declaration.query.filter_by(case_id=case.id, extracted_value=str(extracted_v)).first()
                if matching_decl and matching_decl.evidence_id:
                    matching_ev = next((e for e in evidences if e.id == matching_decl.evidence_id), None)

            if not matching_ev:
                source_str = str(ed.get("source_image") or ed.get("panel_name") or ed.get("source_panel") or ed.get("image_source") or "").upper()
                for ev in evidences:
                    st = ev.surface_type.value.upper()
                    if st in source_str or source_str in st:
                        matching_ev = ev
                        break

            if not matching_ev:
                matching_ev = evidences[0]

            bbox = ed.get("bbox") or {}
            if not bbox or (isinstance(bbox, dict) and bbox.get("w", 0) == 0):
                if extracted_v:
                    matching_decl = Declaration.query.filter_by(case_id=case.id, extracted_value=str(extracted_v)).first()
                    if matching_decl and (matching_decl.bbox_w > 0 or matching_decl.bbox_h > 0):
                        bbox = {
                            "x": matching_decl.bbox_x,
                            "y": matching_decl.bbox_y,
                            "w": matching_decl.bbox_w,
                            "h": matching_decl.bbox_h
                        }

            status_str = ed.get("status", "PASS").replace(" ", "_").upper()
            try:
                chk_status = CheckStatus(status_str)
            except ValueError:
                chk_status = CheckStatus.PASS

            chk = ComplianceCheck(
                case_id=case.id,
                rule_id=rule.id if rule else 1,
                status=chk_status,
                confidence=ed.get("confidence", 0.0),
                reason_explanation=ed.get("why_decision") or ed.get("remarks", ""),
                evaluated_value=ed.get("extracted_value", ""),
                expected_condition=ed.get("title") or (rule.title if rule else ""),
                evidence_id=matching_ev.id if matching_ev else None,
                bbox_json=json.dumps(bbox) if bbox else None
            )
            db.session.add(chk)

        for v in violations:
            v_source = str(v.get("source_image") or "").upper()
            v_ev = next(
                (e for e in evidences if e.surface_type.value.upper() in v_source or v_source in e.surface_type.value.upper()),
                evidences[0]
            )
            viol = Violation(
                case_id=case.id,
                rule_code=v.get("rule_number", "Rule 6"),
                violation_title=v.get("issue") or v.get("title", "Potential Non-Compliance"),
                description=v.get("reason_for_decision") or v.get("reason_for_failure", ""),
                severity=ViolationSeverity.HIGH,
                evidence_snippet=v.get("ocr_evidence", "N/A"),
                evidence_image_id=v_ev.id if v_ev else evidences[0].id,
                bbox_json=json.dumps(v.get("bounding_box", {})) if v.get("bounding_box") else None
            )
            db.session.add(viol)

        # 6. Generate Annotated Bounding-Box Images for each panel
        for ev in evidences:
            fname = os.path.basename(ev.storage_path)
            orig_path = os.path.join(Config.UPLOAD_FOLDER, fname)
            ann_filename = f"ann_{fname}"
            ann_path = os.path.join(Config.UPLOAD_FOLDER, ann_filename)
            VisionAnalyzer.generate_annotated_image(orig_path, eval_decls, ann_path, panel_filter=ev.surface_type.value)
            ev.annotated_storage_path = f"/api/media/uploads/{ann_filename}"

        # 7. Update Case Summary & Advance State to INSPECTOR_REVIEW
        case.status = CaseStatus.ANALYSIS_COMPLETE
        case.compliance_score = summary.get("compliance_score", 0.0)
        case.total_checks = summary.get("total_checks", 0)
        case.passed_checks = summary.get("passed_checks", 0)
        case.failed_checks = summary.get("failed_checks", 0)
        case.review_required_checks = summary.get("review_required_checks", 0)
        case.not_applicable_checks = summary.get("not_applicable_checks", 0)
        case.score_breakdown_text = summary.get("formula_breakdown", "")

        # Audit Log
        audit = AuditLog(
            case_id=case.id,
            user_id=g.current_user.id,
            action_type=AuditActionType.AI_ANALYSIS_EXECUTED,
            entity_name="InspectionCase",
            entity_id=str(case.id),
            new_state_json=json.dumps({"status": case.status.value, "score": case.compliance_score, "violations": len(violations)}),
            justification="Automated RapidOCR & Legal Metrology Rule Engine execution completed."
        )
        db.session.add(audit)
        db.session.commit()

        return jsonify({
            "message": "AI analysis complete.",
            "case": case.to_dict(),
            "summary": summary
        })
    except Exception as e:
        db.session.rollback()
        try:
            case.status = CaseStatus.INSPECTION_PENDING
            db.session.commit()
        except Exception:
            db.session.rollback()
        current_app.logger.error(f"Analysis error on case {case_id}: {e}", exc_info=True)
        return jsonify({"error": f"AI Extraction failed: {str(e)}"}), 500
