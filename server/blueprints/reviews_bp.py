from flask import Blueprint, request, jsonify, g
from datetime import datetime, timezone, date
from sqlalchemy import func
import json

import re
from models import (
    db, InspectionCase, Declaration, InspectorReview, SeniorReview,
    AuditLog, CaseStatus, InspectorReviewAction, SeniorReviewAction,
    FinalDisposition, AuditActionType, Violation, Product, Manufacturer,
    VerificationStatus, DeclarationFieldType, SystemicPattern, PatternStatus,
    Plant, User, PackageEvidence, SurfaceType, ComplianceCheck, CheckStatus,
    SeniorDecision, ViolationSeverity, RegulatoryRule
)
from services.auth_service import require_auth, require_role, check_case_access
from services.systemic_intelligence_service import SystemicIntelligenceService

reviews_bp = Blueprint("reviews_bp", __name__, url_prefix="/api/reviews")

@reviews_bp.route("/overview", methods=["GET"])
@require_role(["SENIOR_OFFICER", "ADMIN"])
def get_senior_overview():
    """Returns live supervisory workload & triage metrics for Senior Officer."""
    pending_count = InspectionCase.query.filter(
        InspectionCase.status.in_([CaseStatus.SUBMITTED, CaseStatus.SENIOR_REVIEW])
    ).count()

    high_priority_count = InspectionCase.query.filter(
        InspectionCase.status.in_([CaseStatus.SUBMITTED, CaseStatus.SENIOR_REVIEW]),
        InspectionCase.failed_checks > 0
    ).count()

    returned_count = InspectionCase.query.filter_by(status=CaseStatus.RETURNED).count()

    scheduled_count = InspectionCase.query.filter(
        InspectionCase.status.in_([CaseStatus.DRAFT, CaseStatus.EVIDENCE_PENDING]),
        InspectionCase.scheduled_date.isnot(None)
    ).count()

    active_in_field_count = InspectionCase.query.filter(
        InspectionCase.status.in_([CaseStatus.ANALYZING, CaseStatus.ANALYSIS_COMPLETE, CaseStatus.INSPECTOR_REVIEW])
    ).count()

    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_finalized_count = InspectionCase.query.filter(
        InspectionCase.status == CaseStatus.FINALIZED,
        InspectionCase.finalized_at >= today_start
    ).count()

    systemic_patterns_count = SystemicPattern.query.filter(
        SystemicPattern.status.in_([PatternStatus.NEW, PatternStatus.UNDER_REVIEW, PatternStatus.CONFIRMED_PATTERN])
    ).count()

    compliant_count = InspectionCase.query.filter_by(final_decision=FinalDisposition.COMPLIANT).count()
    non_compliant_count = InspectionCase.query.filter_by(final_decision=FinalDisposition.NON_COMPLIANT).count()
    further_insp_count = InspectionCase.query.filter_by(final_decision=FinalDisposition.REQUIRES_FURTHER_INSPECTION).count()

    # Recent submissions
    recent_submissions = InspectionCase.query.filter(
        InspectionCase.status.in_([CaseStatus.SUBMITTED, CaseStatus.SENIOR_REVIEW])
    ).order_by(InspectionCase.submitted_at.desc(), InspectionCase.created_at.desc()).limit(5).all()

    # Recent Senior Decisions
    recent_reviews = SeniorReview.query.order_by(SeniorReview.created_at.desc()).limit(6).all()
    decisions_list = []
    for sr in recent_reviews:
        c = sr.inspection_case
        decisions_list.append({
            "id": sr.id,
            "case_id": sr.case_id,
            "case_number": c.case_number if c else f"Case #{sr.case_id}",
            "brand_name": c.product.brand_name if (c and c.product) else "Unknown",
            "action": sr.action.value if hasattr(sr.action, "value") else str(sr.action),
            "remarks": sr.remarks,
            "override_reason": sr.override_reason,
            "reviewer_name": sr.senior_officer.full_name if sr.senior_officer else "Senior Officer",
            "timestamp": sr.created_at.isoformat() if sr.created_at else None
        })

    # Recent Systemic Patterns Preview
    patterns = SystemicIntelligenceService.analyze_and_sync_patterns()[:3]

    return jsonify({
        "workload": {
            "pending_adjudications": pending_count,
            "high_priority_cases": high_priority_count,
            "returned_cases": returned_count,
            "scheduled_audits": scheduled_count,
            "active_in_field": active_in_field_count,
            "today_finalized": today_finalized_count,
            "systemic_patterns": systemic_patterns_count
        },
        "compliance": {
            "compliant": compliant_count,
            "non_compliant": non_compliant_count,
            "requires_further_inspection": further_insp_count
        },
        "recent_submissions": [
            {
                "id": c.id,
                "case_number": c.case_number,
                "brand_name": c.product.brand_name if c.product else "Unknown",
                "commodity_name": c.product.commodity_name if c.product else "Commodity",
                "inspector_name": c.inspector.full_name if c.inspector else "Inspector",
                "failed_checks": c.failed_checks,
                "submitted_at": c.submitted_at.isoformat() if c.submitted_at else c.created_at.isoformat()
            } for c in recent_submissions
        ],
        "recent_decisions": decisions_list,
        "recent_patterns": patterns
    })

@reviews_bp.route("/queue", methods=["GET"])
@require_auth
def get_review_queue():
    """Returns inspection cases awaiting senior officer review with search, filter, and sorting."""
    search = request.args.get("search", "").strip().lower()
    status_filter = request.args.get("status", "ALL").upper()
    severity_filter = request.args.get("severity", "ALL").upper()
    category_id = request.args.get("category_id")
    sort_by = request.args.get("sort_by", "newest").lower()

    query = InspectionCase.query.join(Product, Product.id == InspectionCase.product_id, isouter=True)

    if status_filter == "ALL":
        query = query.filter(InspectionCase.status.in_([CaseStatus.SUBMITTED, CaseStatus.SENIOR_REVIEW]))
    else:
        try:
            query = query.filter(InspectionCase.status == CaseStatus(status_filter))
        except ValueError:
            query = query.filter(InspectionCase.status.in_([CaseStatus.SUBMITTED, CaseStatus.SENIOR_REVIEW]))

    if category_id and category_id.isdigit():
        query = query.filter(Product.category_id == int(category_id))

    if severity_filter == "HIGH":
        query = query.filter(InspectionCase.failed_checks > 0)
    elif severity_filter == "CLEAN":
        query = query.filter(InspectionCase.failed_checks == 0)

    # Sorting
    if sort_by == "oldest":
        query = query.order_by(InspectionCase.created_at.asc())
    elif sort_by == "violations":
        query = query.order_by(InspectionCase.failed_checks.desc(), InspectionCase.created_at.desc())
    elif sort_by == "priority":
        query = query.order_by(InspectionCase.failed_checks.desc(), InspectionCase.compliance_score.asc())
    else: # newest
        query = query.order_by(InspectionCase.created_at.desc())

    cases = query.all()
    out = []
    for c in cases:
        d = c.to_dict()
        d["product"] = c.product.to_dict() if c.product else None
        d["inspector_name"] = c.inspector.full_name if c.inspector else None
        
        if search:
            mfg_name = (c.product.manufacturer.name.lower()) if (c.product and c.product.manufacturer) else ""
            brand_name = c.product.brand_name.lower() if c.product else ""
            comm_name = c.product.commodity_name.lower() if c.product else ""
            case_num = c.case_number.lower()
            insp_name = c.inspector.full_name.lower() if c.inspector else ""

            if not (search in case_num or search in brand_name or search in comm_name or search in mfg_name or search in insp_name):
                continue

        out.append(d)

    return jsonify({
        "queue": out,
        "count": len(out)
    })

@reviews_bp.route("/products/<int:product_id>/history", methods=["GET"])
@require_role(["SENIOR_OFFICER", "ADMIN"])
def get_product_history(product_id):
    """Returns historical inspection and violation context for a product & its manufacturer."""
    prod = db.session.get(Product, product_id)
    if not prod:
        return jsonify({"error": "Product not found."}), 404

    prod_inspections = InspectionCase.query.filter(
        InspectionCase.product_id == prod.id,
        InspectionCase.status == CaseStatus.FINALIZED
    ).order_by(InspectionCase.finalized_at.desc()).limit(10).all()

    mfg_history = []
    mfg_total_inspections = 0
    mfg_total_violations = 0
    if prod.manufacturer_id:
        mfg_cases = InspectionCase.query.join(Product).filter(
            Product.manufacturer_id == prod.manufacturer_id,
            InspectionCase.status == CaseStatus.FINALIZED
        ).order_by(InspectionCase.finalized_at.desc()).limit(10).all()

        mfg_total_inspections = InspectionCase.query.join(Product).filter(
            Product.manufacturer_id == prod.manufacturer_id,
            InspectionCase.status == CaseStatus.FINALIZED
        ).count()

        mfg_total_violations = db.session.query(func.count(Violation.id)).join(
            InspectionCase, Violation.case_id == InspectionCase.id
        ).join(
            Product, InspectionCase.product_id == Product.id
        ).filter(Product.manufacturer_id == prod.manufacturer_id).scalar() or 0

        mfg_history = [
            {
                "case_id": c.id,
                "case_number": c.case_number,
                "brand_name": c.product.brand_name if c.product else "N/A",
                "final_decision": c.final_decision.value if c.final_decision else "N/A",
                "compliance_score": c.compliance_score,
                "failed_checks": c.failed_checks,
                "finalized_at": c.finalized_at.isoformat() if c.finalized_at else None
            } for c in mfg_cases
        ]

    return jsonify({
        "product": {
            "id": prod.id,
            "brand_name": prod.brand_name,
            "commodity_name": prod.commodity_name,
            "manufacturer_name": prod.manufacturer.name if prod.manufacturer else None
        },
        "product_inspections": [
            {
                "case_id": c.id,
                "case_number": c.case_number,
                "final_decision": c.final_decision.value if c.final_decision else "N/A",
                "compliance_score": c.compliance_score,
                "failed_checks": c.failed_checks,
                "finalized_at": c.finalized_at.isoformat() if c.finalized_at else None
            } for c in prod_inspections
        ],
        "manufacturer_summary": {
            "manufacturer_id": prod.manufacturer_id,
            "name": prod.manufacturer.name if prod.manufacturer else "N/A",
            "total_inspections": mfg_total_inspections,
            "total_violations": mfg_total_violations,
            "recent_cases": mfg_history
        }
    })

@reviews_bp.route("/<int:case_id>/inspector", methods=["POST"])
@require_auth
def inspector_submit(case_id):
    case = db.session.get(InspectionCase, case_id)
    if not case:
        return jsonify({"error": "Inspection case not found."}), 404

    # Strict Inspector Case Ownership & Status Check
    err_resp, err_code = check_case_access(case, g.current_user, for_mutation=True)
    if err_resp:
        return err_resp, err_code
        
    if case.status in [CaseStatus.DRAFT, CaseStatus.EVIDENCE_PENDING, CaseStatus.ANALYZING]:
        return jsonify({"error": "Cannot submit inspector review before AI extraction & analysis is completed."}), 400

    # Mandatory Package Evidence Check (Both Front and Back must exist)
    evidences = PackageEvidence.query.filter_by(case_id=case.id).all()
    surfaces = [e.surface_type.value.upper() for e in evidences if e.surface_type]
    has_front = any("FRONT" in s for s in surfaces)
    has_back = any("BACK" in s for s in surfaces)
    if not (has_front and has_back):
        return jsonify({
            "error": "Compulsory packaging evidence missing. Both Front Face and Back Face package images are mandatory before submitting to Senior Officer."
        }), 400

    data = request.get_json() or {}
    remarks = data.get("remarks", "")
    corrections = data.get("corrections", {})
    signature_hash = data.get("signature_hash", "") or f"SIG-{g.current_user.id}-{int(datetime.now(timezone.utc).timestamp())}"

    for key, corr_val in corrections.items():
        decl = None
        if str(key).isdigit():
            decl = db.session.get(Declaration, int(key))
        else:
            try:
                ft_enum = DeclarationFieldType(str(key))
                decl = Declaration.query.filter_by(case_id=case.id, field_type=ft_enum).first()
            except Exception:
                decl = Declaration.query.filter_by(case_id=case.id, field_type=str(key)).first()
        
        if decl and decl.case_id == case.id:
            val_str = str(corr_val).strip() if corr_val is not None else ""
            if val_str and val_str != decl.extracted_value:
                decl.inspector_corrected_value = val_str
                decl.verification_status = VerificationStatus.CORRECTED
            else:
                decl.verification_status = VerificationStatus.VERIFIED

    prev_status = case.status.value
    case.status = CaseStatus.SUBMITTED
    case.inspector_remarks = remarks
    case.signed_by_name = data.get("signed_by_name") or g.current_user.full_name
    case.signed_at = datetime.now(timezone.utc)
    case.digital_signature_hash = signature_hash

    insp_rev = InspectorReview(
        case_id=case.id,
        inspector_id=g.current_user.id,
        action=InspectorReviewAction.SUBMIT_FOR_REVIEW,
        modified_fields_json=json.dumps(corrections),
        remarks=remarks
    )
    db.session.add(insp_rev)

    audit = AuditLog(
        case_id=case.id,
        user_id=g.current_user.id,
        action_type=AuditActionType.INSPECTOR_SUBMITTED,
        entity_name="InspectionCase",
        entity_id=str(case.id),
        previous_state_json=json.dumps({"status": prev_status, "cycle": case.review_cycle}),
        new_state_json=json.dumps({
            "status": case.status.value,
            "corrections": corrections,
            "cycle": case.review_cycle,
            "signed_by": case.signed_by_name,
            "signature_hash": case.digital_signature_hash
        }),
        justification=remarks or f"Inspector {g.current_user.full_name} verified declarations, digitally signed report, and submitted for supervisory review."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({
        "message": f"Inspection #{case.case_number} digitally signed and submitted to senior review queue.",
        "case_id": case.id,
        "status": case.status.value,
        "review_cycle": case.review_cycle,
        "signed_by": case.signed_by_name,
        "signed_at": case.signed_at.isoformat() if case.signed_at else None,
        "case": case.to_dict()
    })

@reviews_bp.route("/<int:case_id>/violations/<int:violation_id>/action", methods=["POST"])
@require_role(["SENIOR_OFFICER", "ADMIN"])
def itemized_violation_action(case_id, violation_id):
    """Senior Officer itemized review of an individual violation."""
    case = db.session.get(InspectionCase, case_id)
    if not case:
        return jsonify({"error": "Case not found."}), 404
        
    viol = Violation.query.filter_by(id=violation_id, case_id=case.id).first_or_404()

    data = request.get_json() or {}
    action_str = data.get("action", "").upper() # CONFIRMED, OVERRIDDEN, DISMISSED
    override_reason = data.get("override_reason", "").strip()
    statutory_just = data.get("statutory_justification", "").strip()

    if not action_str:
        return jsonify({"error": "Action is required (CONFIRMED, OVERRIDDEN, DISMISSED)."}), 400

    if action_str in ["OVERRIDDEN", "DISMISSED"] and not (override_reason or statutory_just):
        return jsonify({"error": "Statutory justification or override reason is mandatory when altering a finding."}), 400

    prev_decision = viol.senior_decision
    try:
        viol.senior_decision = SeniorDecision(action_str)
    except Exception:
        viol.senior_decision = SeniorDecision.UPHELD
    viol.senior_override_reason = f"{override_reason} | {statutory_just}".strip(" |")

    # Link check and update status
    chk = None
    if viol.check_id:
        chk = db.session.get(ComplianceCheck, viol.check_id)
    if not chk and viol.rule_code:
        clean_v_code = re.sub(r'[^A-Za-z0-9]', '_', viol.rule_code).strip('_').upper()
        chk = ComplianceCheck.query.join(RegulatoryRule, ComplianceCheck.rule_id == RegulatoryRule.id).filter(
            ComplianceCheck.case_id == case.id,
            (RegulatoryRule.rule_code == viol.rule_code) | 
            (RegulatoryRule.rule_code == clean_v_code) |
            (RegulatoryRule.rule_code.ilike(f"%{clean_v_code[:8]}%"))
        ).first()

    if chk and not viol.check_id:
        viol.check_id = chk.id

    # If action is OVERRIDDEN or DISMISSED, also update the related ComplianceCheck to PASS
    if action_str in ["OVERRIDDEN", "DISMISSED"]:
        if chk and chk.status != CheckStatus.PASS:
            chk.status = CheckStatus.PASS
            chk.reason_explanation = f"[Senior {action_str}]: {viol.senior_override_reason} | {chk.reason_explanation}"

            # Recalculate case metrics
            db.session.flush()
            passed_c = ComplianceCheck.query.filter_by(case_id=case.id, status=CheckStatus.PASS).count()
            failed_c = ComplianceCheck.query.filter_by(case_id=case.id, status=CheckStatus.FAIL).count()
            review_c = ComplianceCheck.query.filter_by(case_id=case.id, status=CheckStatus.REVIEW_REQUIRED).count()
            na_c = ComplianceCheck.query.filter_by(case_id=case.id, status=CheckStatus.NOT_APPLICABLE).count()
            applicable_c = passed_c + failed_c + review_c
            case.passed_checks = passed_c
            case.failed_checks = failed_c
            case.review_required_checks = review_c
            case.not_applicable_checks = na_c
            case.compliance_score = round((passed_c / max(applicable_c, 1)) * 100.0, 1)
            case.score_breakdown_text = f"{passed_c} Passed / {applicable_c} Applicable × 100 = {case.compliance_score}% ({review_c} Review Required)"
    elif action_str == "CONFIRMED":
        if chk and chk.status == CheckStatus.REVIEW_REQUIRED:
            chk.status = CheckStatus.FAIL
            chk.reason_explanation = f"[Senior Confirmed Non-Compliance]: {viol.senior_override_reason or 'Upheld by senior officer'} | {chk.reason_explanation}"
            db.session.flush()
            passed_c = ComplianceCheck.query.filter_by(case_id=case.id, status=CheckStatus.PASS).count()
            failed_c = ComplianceCheck.query.filter_by(case_id=case.id, status=CheckStatus.FAIL).count()
            review_c = ComplianceCheck.query.filter_by(case_id=case.id, status=CheckStatus.REVIEW_REQUIRED).count()
            na_c = ComplianceCheck.query.filter_by(case_id=case.id, status=CheckStatus.NOT_APPLICABLE).count()
            applicable_c = passed_c + failed_c + review_c
            case.passed_checks = passed_c
            case.failed_checks = failed_c
            case.review_required_checks = review_c
            case.not_applicable_checks = na_c
            case.compliance_score = round((passed_c / max(applicable_c, 1)) * 100.0, 1)
            case.score_breakdown_text = f"{passed_c} Passed / {applicable_c} Applicable × 100 = {case.compliance_score}% ({review_c} Review Required)"

    audit = AuditLog(
        case_id=case.id,
        user_id=g.current_user.id,
        action_type=AuditActionType.SENIOR_OVERRIDE if action_str in ["OVERRIDDEN", "DISMISSED"] else AuditActionType.CASE_FINALIZED,
        entity_name="Violation",
        entity_id=str(viol.id),
        previous_state_json=json.dumps({"decision": prev_decision.value if hasattr(prev_decision, "value") else str(prev_decision)}),
        new_state_json=json.dumps({"decision": action_str, "reason": viol.senior_override_reason}),
        justification=viol.senior_override_reason or f"Senior Officer itemized adjudication: {action_str}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({
        "message": f"Violation #{viol.id} decision updated to {action_str}.",
        "violation": viol.to_dict(),
        "case": case.to_dict()
    })

@reviews_bp.route("/<int:case_id>/checks/<int:check_id>/action", methods=["POST"])
@require_role(["SENIOR_OFFICER", "ADMIN"])
def itemized_check_action(case_id, check_id):
    """Senior Officer itemized review of an individual compliance check."""
    case = db.session.get(InspectionCase, case_id)
    if not case:
        return jsonify({"error": "Case not found."}), 404

    chk = ComplianceCheck.query.filter_by(id=check_id, case_id=case.id).first_or_404()

    data = request.get_json() or {}
    action_str = data.get("action", "").upper() # CONFIRMED, OVERRIDDEN, DISMISSED
    override_reason = (data.get("override_reason") or "").strip()
    statutory_just = (data.get("statutory_justification") or "").strip()
    justification_text = f"{override_reason} | {statutory_just}".strip(" |")

    if not action_str:
        return jsonify({"error": "Action is required (CONFIRMED, OVERRIDDEN, DISMISSED)."}), 400

    if action_str in ["OVERRIDDEN", "DISMISSED"] and not justification_text:
        return jsonify({"error": "Statutory justification or override reason is mandatory when altering a finding."}), 400

    prev_status = chk.status.value

    # Find any related violation for this check
    chk_code = chk.rule.rule_code if chk.rule else ""
    clean_chk_code = re.sub(r'[^A-Za-z0-9]', '_', chk_code).strip('_').upper() if chk_code else ""
    related_viols = Violation.query.filter(
        (Violation.case_id == case.id) &
        (
            (Violation.check_id == chk.id) | 
            (Violation.rule_code == chk_code) |
            (Violation.rule_code.ilike(f"%{chk_code}%")) |
            (Violation.rule_code.ilike(f"%{clean_chk_code[:8]}%"))
        )
    ).all()

    if action_str == "CONFIRMED":
        for v in related_viols:
            try:
                v.senior_decision = SeniorDecision.CONFIRMED
            except Exception:
                v.senior_decision = SeniorDecision.UPHELD
            if justification_text:
                v.senior_override_reason = justification_text
    elif action_str == "OVERRIDDEN":
        if chk.status in [CheckStatus.FAIL, CheckStatus.REVIEW_REQUIRED]:
            chk.status = CheckStatus.PASS
            chk.reason_explanation = f"[Senior Override to Compliant]: {justification_text} | {chk.reason_explanation}"
            for v in related_viols:
                try:
                    v.senior_decision = SeniorDecision.OVERRIDDEN
                except Exception:
                    v.senior_decision = SeniorDecision.DISMISSED
                v.senior_override_reason = justification_text
        else:
            chk.status = CheckStatus.FAIL
            chk.reason_explanation = f"[Senior Override to Non-Compliant]: {justification_text} | {chk.reason_explanation}"
            if not related_viols:
                new_v = Violation(
                    case_id=case.id,
                    check_id=chk.id,
                    rule_code=chk_code or "RULE_6",
                    violation_title=f"Non-Compliance Finding: {chk.expected_condition or (chk.rule.title if chk.rule else 'Statutory Rule')}",
                    description=justification_text,
                    severity=ViolationSeverity.HIGH,
                    senior_decision=SeniorDecision.UPHELD,
                    senior_override_reason=justification_text,
                    evidence_image_id=chk.evidence_id
                )
                db.session.add(new_v)
    elif action_str == "DISMISSED":
        chk.status = CheckStatus.PASS
        chk.reason_explanation = f"[Senior Dismissed as Non-Issue]: {justification_text or 'De minimis / non-statutory variation'} | {chk.reason_explanation}"
        for v in related_viols:
            v.senior_decision = SeniorDecision.DISMISSED
            v.senior_override_reason = justification_text or "Dismissed by Senior Officer"

    # Recalculate case compliance counts & score
    db.session.flush()
    passed_c = ComplianceCheck.query.filter_by(case_id=case.id, status=CheckStatus.PASS).count()
    failed_c = ComplianceCheck.query.filter_by(case_id=case.id, status=CheckStatus.FAIL).count()
    review_c = ComplianceCheck.query.filter_by(case_id=case.id, status=CheckStatus.REVIEW_REQUIRED).count()
    na_c = ComplianceCheck.query.filter_by(case_id=case.id, status=CheckStatus.NOT_APPLICABLE).count()
    applicable_c = passed_c + failed_c + review_c

    case.passed_checks = passed_c
    case.failed_checks = failed_c
    case.review_required_checks = review_c
    case.not_applicable_checks = na_c
    case.compliance_score = round((passed_c / max(applicable_c, 1)) * 100.0, 1)
    case.score_breakdown_text = f"{passed_c} Passed / {applicable_c} Applicable × 100 = {case.compliance_score}% ({review_c} Review Required)"

    # Audit log
    audit = AuditLog(
        case_id=case.id,
        user_id=g.current_user.id,
        action_type=AuditActionType.SENIOR_OVERRIDE if action_str in ["OVERRIDDEN", "DISMISSED"] else AuditActionType.CASE_FINALIZED,
        entity_name="ComplianceCheck",
        entity_id=str(chk.id),
        previous_state_json=json.dumps({"status": prev_status}),
        new_state_json=json.dumps({"status": chk.status.value, "decision": action_str, "reason": justification_text}),
        justification=justification_text or f"Senior Officer adjudication on check #{chk.id}: {action_str}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({
        "message": f"Check #{chk.id} decision updated to {action_str}.",
        "check": chk.to_dict(),
        "case": case.to_dict()
    })

@reviews_bp.route("/<int:case_id>/return", methods=["POST"])
@require_role(["SENIOR_OFFICER", "ADMIN"])
def return_for_reinspection(case_id):
    """
    Returns an inspection case to the inspector for correction/re-inspection.
    Requires mandatory non-empty return reason. Increments review cycle.
    """
    case = db.session.get(InspectionCase, case_id)
    if not case:
        return jsonify({"error": "Inspection case not found."}), 404

    data = request.get_json() or {}
    return_reason = (data.get("reason") or data.get("remarks") or "").strip()
    statutory_citation = (data.get("statutory_citation") or "").strip()

    if not return_reason:
        return jsonify({"error": "A mandatory, non-empty return reason must be provided to return a case for re-inspection."}), 400

    prev_status = case.status.value
    prev_cycle = case.review_cycle or 1

    case.status = CaseStatus.RETURNED
    case.final_decision = FinalDisposition.REQUIRES_FURTHER_INSPECTION
    case.senior_reviewer_id = g.current_user.id
    case.senior_remarks = return_reason
    case.review_cycle = prev_cycle + 1

    sr_rev = SeniorReview(
        case_id=case.id,
        senior_officer_id=g.current_user.id,
        action=SeniorReviewAction.RETURN_FOR_REINSPECTION,
        override_reason=return_reason,
        statutory_justification=statutory_citation,
        remarks=f"[Cycle {prev_cycle} Return]: {return_reason}"
    )
    db.session.add(sr_rev)

    audit = AuditLog(
        case_id=case.id,
        user_id=g.current_user.id,
        action_type=AuditActionType.SENIOR_OVERRIDE,
        entity_name="InspectionCase",
        entity_id=str(case.id),
        previous_state_json=json.dumps({"status": prev_status, "cycle": prev_cycle}),
        new_state_json=json.dumps({"status": case.status.value, "cycle": case.review_cycle, "return_reason": return_reason}),
        justification=f"Returned for correction: {return_reason}"
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({
        "message": f"Case #{case.case_number} successfully returned to inspector for re-inspection.",
        "case_id": case.id,
        "status": case.status.value,
        "review_cycle": case.review_cycle,
        "final_decision": case.final_decision.value,
        "case": case.to_dict()
    })

@reviews_bp.route("/<int:case_id>/finalize", methods=["POST"])
@reviews_bp.route("/<int:case_id>/senior-action", methods=["POST"])
@require_role(["SENIOR_OFFICER", "ADMIN"])
def senior_officer_action(case_id):
    case = db.session.get(InspectionCase, case_id)
    if not case:
        return jsonify({"error": "Inspection case not found."}), 404

    if case.status in [CaseStatus.DRAFT, CaseStatus.EVIDENCE_PENDING, CaseStatus.ANALYZING]:
        return jsonify({"error": "Cannot adjudicate or finalize a case that is still in DRAFT/ANALYZING state."}), 400

    data = request.get_json() or {}
    action_str = data.get("action", "").upper()
    override_reason = (data.get("override_reason") or "").strip()
    statutory_just = (data.get("statutory_justification") or "").strip()
    remarks = (data.get("remarks") or "").strip()
    violation_id = data.get("violation_id")

    prev_status = case.status.value
    prev_disposition = case.final_decision.value if case.final_decision else None

    # Handle per-violation override
    if violation_id:
        viol = Violation.query.filter_by(id=int(violation_id), case_id=case.id).first()
        if viol:
            viol.senior_decision = action_str
            viol.senior_override_reason = f"{override_reason} | {statutory_just}".strip(" |")

    # Handle case-level finalization actions
    senior_action = SeniorReviewAction.APPROVE_FINAL
    audit_action = AuditActionType.CASE_FINALIZED

    if action_str in ["APPROVE_COMPLIANT", "COMPLIANT"]:
        senior_action = SeniorReviewAction.OVERRIDE_FINDING if (override_reason or case.failed_checks > 0) else SeniorReviewAction.APPROVE_FINAL
        if senior_action == SeniorReviewAction.OVERRIDE_FINDING:
            audit_action = AuditActionType.SENIOR_OVERRIDE
        case.status = CaseStatus.FINALIZED
        case.final_decision = FinalDisposition.COMPLIANT
        case.finalized_at = datetime.now(timezone.utc)
    elif action_str in ["APPROVE_VIOLATIONS", "NON_COMPLIANT"]:
        senior_action = SeniorReviewAction.APPROVE_FINAL
        case.status = CaseStatus.FINALIZED
        case.final_decision = FinalDisposition.NON_COMPLIANT
        case.finalized_at = datetime.now(timezone.utc)
    elif action_str == "RETURN_FOR_REINSPECTION":
        if not (remarks or override_reason):
            return jsonify({"error": "A return reason is mandatory when returning for re-inspection."}), 400
        senior_action = SeniorReviewAction.RETURN_FOR_REINSPECTION
        audit_action = AuditActionType.SENIOR_OVERRIDE
        case.status = CaseStatus.RETURNED
        case.final_decision = FinalDisposition.REQUIRES_FURTHER_INSPECTION
        case.review_cycle = (case.review_cycle or 1) + 1
    elif action_str == "DISMISS_CASE":
        senior_action = SeniorReviewAction.OVERRIDE_FINDING
        audit_action = AuditActionType.SENIOR_OVERRIDE
        case.status = CaseStatus.FINALIZED
        case.final_decision = FinalDisposition.COMPLIANT
        case.finalized_at = datetime.now(timezone.utc)
    else:
        return jsonify({"error": f"Invalid action: {action_str}"}), 400

    case.senior_reviewer_id = g.current_user.id
    case.senior_remarks = remarks or override_reason

    sr_rev = SeniorReview(
        case_id=case.id,
        senior_officer_id=g.current_user.id,
        action=senior_action,
        override_reason=override_reason,
        statutory_justification=statutory_just,
        remarks=remarks
    )
    db.session.add(sr_rev)

    # Audit Log
    audit = AuditLog(
        case_id=case.id,
        user_id=g.current_user.id,
        action_type=audit_action,
        entity_name="InspectionCase",
        entity_id=str(case.id),
        previous_state_json=json.dumps({"status": prev_status, "disposition": prev_disposition}),
        new_state_json=json.dumps({
            "status": case.status.value,
            "final_decision": case.final_decision.value if case.final_decision else None,
            "action": action_str
        }),
        justification=statutory_just or override_reason or remarks or "Senior officer adjudication decision."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({
        "message": f"Senior action [{action_str}] recorded successfully.",
        "case_id": case.id,
        "status": case.status.value,
        "final_decision": case.final_decision.value if case.final_decision else None,
        "case": case.to_dict()
    })

# ==============================================================================
# INNOVATION #5: BRAND-WIDE SYSTEMIC VIOLATION INTELLIGENCE ENDPOINTS
# ==============================================================================

@reviews_bp.route("/intelligence/patterns", methods=["GET"])
@require_role(["SENIOR_OFFICER", "ADMIN"])
def get_systemic_patterns():
    """
    Returns detected brand-wide / product-line systemic non-compliance patterns.
    Triggers analytical pattern discovery and returns prioritized list.
    """
    status_filter = request.args.get("status")
    patterns = SystemicIntelligenceService.analyze_and_sync_patterns()
    if status_filter and status_filter.upper() != "ALL":
        patterns = [p for p in patterns if p.get("status") == status_filter.upper()]
    return jsonify({
        "patterns": patterns,
        "count": len(patterns)
    })

@reviews_bp.route("/intelligence/patterns/<int:pattern_id>/action", methods=["POST"])
@require_role(["SENIOR_OFFICER", "ADMIN"])
def update_pattern_action(pattern_id):
    """
    Allows Senior Officer to review, flag, confirm or dismiss a systemic pattern.
    """
    data = request.get_json() or {}
    status_str = data.get("status", "").upper()
    notes = data.get("notes", "").strip()

    if not status_str:
        return jsonify({"error": "Status is required (UNDER_REVIEW, CONFIRMED_PATTERN, DISMISSED)."}), 400

    updated, err = SystemicIntelligenceService.update_pattern_status(
        pattern_id=pattern_id,
        status_str=status_str,
        notes=notes,
        user_id=g.current_user.id
    )
    if err:
        return jsonify({"error": err}), 400

    return jsonify({
        "message": f"Systemic pattern #{pattern_id} updated to {status_str}.",
        "pattern": updated
    })
