import os
import uuid
import json
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, g, send_from_directory
import cv2

from config import Config
from models import (
    db, InspectionCase, CaseStatus, FinalDisposition,
    Product, PackageEvidence, OCRDetection, SurfaceType, QualityVerdict,
    Declaration, DeclarationFieldType, ExtractionMethod, VerificationStatus,
    RegulatoryRule, ComplianceCheck, Violation, CheckStatus, ViolationSeverity,
    AuditLog, AuditActionType
)
from services.auth_service import require_auth
from services.vision_analyzer import VisionAnalyzer
from services.ocr_service import OCRService
from services.rule_engine import LegalMetrologyRuleEngine

inspections_bp = Blueprint("inspections_bp", __name__, url_prefix="/api/inspections")

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
    case = InspectionCase.query.get_or_404(case_id)
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
    case = InspectionCase.query.get_or_404(case_id)
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

@inspections_bp.route("/<int:case_id>/analyze", methods=["POST"])
@require_auth
def run_analysis(case_id):
    case = InspectionCase.query.get_or_404(case_id)
    evidences = PackageEvidence.query.filter_by(case_id=case.id).all()
    if not evidences:
        return jsonify({"error": "Cannot run analysis without uploaded packaging evidence."}), 400

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

    # 4. Save Structured Declarations
    for ed in eval_decls:
        dtype_str = ed.get("declaration_type", "PRODUCT_NAME")
        try:
            dtype = DeclarationFieldType(dtype_str)
        except ValueError:
            dtype = DeclarationFieldType.PRODUCT_NAME

        source_panel = ed.get("source_panel") or ed.get("image_source") or "FRONT"
        matching_ev = next((e for e in evidences if e.surface_type.value.upper() == str(source_panel).upper()), evidences[0])

        bbox = ed.get("bbox", {})
        decl = Declaration(
            case_id=case.id,
            evidence_id=matching_ev.id,
            field_type=dtype,
            title=ed.get("title", "Declaration"),
            raw_ocr_text=ed.get("raw_ocr_text", ""),
            extracted_value=ed.get("extracted_value", ""),
            confidence=ed.get("confidence", 0.0),
            bbox_x=bbox.get("x", 0.0),
            bbox_y=bbox.get("y", 0.0),
            bbox_w=bbox.get("w", 0.0),
            bbox_h=bbox.get("h", 0.0),
            extraction_method=ExtractionMethod.OCR_TOKEN_MATCHER,
            verification_status=VerificationStatus.UNVERIFIED
        )
        db.session.add(decl)

    # 5. Save Compliance Checks & Violations against Database Rules
    for ed in eval_decls:
        rule_code = ed.get("rule_name", "RULE_6").split(" - ")[0].replace(" ", "_").upper()
        rule = RegulatoryRule.query.filter(RegulatoryRule.rule_code.ilike(f"%{rule_code}%")).first()
        if not rule:
            rule = RegulatoryRule.query.first() # fallback default

        source_panel = ed.get("source_panel") or ed.get("image_source") or "FRONT"
        matching_ev = next((e for e in evidences if e.surface_type.value.upper() == str(source_panel).upper()), evidences[0])

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
            expected_condition=ed.get("title", ""),
            evidence_id=matching_ev.id
        )
        db.session.add(chk)

    for v in violations:
        viol = Violation(
            case_id=case.id,
            rule_code=v.get("rule_number", "Rule 6"),
            violation_title=v.get("issue") or v.get("title", "Potential Non-Compliance"),
            description=v.get("reason_for_decision") or v.get("reason_for_failure", ""),
            severity=ViolationSeverity.HIGH,
            evidence_snippet=v.get("ocr_evidence", "N/A"),
            evidence_image_id=evidences[0].id
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
