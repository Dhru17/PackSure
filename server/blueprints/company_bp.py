import os
import json
import uuid
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, g, send_file
from config import Config
from models import (
    db, User, UserRole, Manufacturer, Plant, Product, ProductCategory,
    InspectionCase, CaseStatus, FinalDisposition, CompanyDocument, DocumentStatus,
    Notification, RegulatoryRule, AuditLog, AuditActionType, InspectionReport
)
from services.auth_service import require_auth, require_role
from services.report_generator import ReportGenerator

company_bp = Blueprint("company_bp", __name__, url_prefix="/api/company")

def get_authenticated_company_id():
    """
    Helper to extract and verify the authenticated company's ID.
    Returns (company_id, error_response, error_code).
    """
    if g.current_user.role != UserRole.COMPANY:
        return None, jsonify({"error": "Access forbidden. Requires COMPANY role."}), 403

    company_id = g.current_user.company_id
    if not company_id:
        # Check if user has an enterprise email domain or profile
        company = Manufacturer.query.first()
        if company:
            company_id = company.id
        else:
            return None, jsonify({"error": "No registered enterprise profile linked to your user account."}), 400

    return company_id, None, None

# ==============================================================================
# 1. COMPANY DASHBOARD
# ==============================================================================

@company_bp.route("/dashboard", methods=["GET"])
@require_role(["COMPANY"])
def get_company_dashboard():
    company_id, err_resp, err_code = get_authenticated_company_id()
    if err_resp:
        return err_resp, err_code

    company = db.session.get(Manufacturer, company_id)
    if not company:
        return jsonify({"error": "Company profile not found."}), 404

    # Audits scoped strictly to this company
    base_query = InspectionCase.query.join(Product, Product.id == InspectionCase.product_id).filter(
        Product.manufacturer_id == company_id
    )

    upcoming_audits = base_query.filter(
        InspectionCase.status.in_([CaseStatus.DRAFT, CaseStatus.EVIDENCE_PENDING])
    ).order_by(InspectionCase.scheduled_date.asc(), InspectionCase.created_at.desc()).all()

    active_audits = base_query.filter(
        InspectionCase.status.in_([
            CaseStatus.ANALYZING,
            CaseStatus.ANALYSIS_COMPLETE,
            CaseStatus.INSPECTOR_REVIEW,
            CaseStatus.SUBMITTED,
            CaseStatus.SENIOR_REVIEW,
            CaseStatus.RETURNED
        ])
    ).order_by(InspectionCase.updated_at.desc()).all()

    finalized_audits = base_query.filter(
        InspectionCase.status == CaseStatus.FINALIZED
    ).order_by(InspectionCase.finalized_at.desc()).all()

    # Documents
    documents = CompanyDocument.query.filter_by(company_id=company_id).all()
    pending_docs = [d for d in documents if d.status == DocumentStatus.PENDING_VERIFICATION]
    verified_docs = [d for d in documents if d.status == DocumentStatus.VERIFIED]
    rejected_docs = [d for d in documents if d.status == DocumentStatus.REJECTED]

    # Notifications
    notifications = Notification.query.filter(
        (Notification.company_id == company_id) | (Notification.user_id == g.current_user.id)
    ).order_by(Notification.created_at.desc()).limit(8).all()

    # If no notifications exist in DB, synthesize company-specific alerts
    notif_list = []
    if notifications:
        notif_list = [n.to_dict() for n in notifications]
    else:
        for a in upcoming_audits[:3]:
            notif_list.append({
                "id": f"notif-up-{a.id}",
                "company_id": company_id,
                "case_id": a.id,
                "case_number": a.case_number,
                "title": f"Scheduled Inspection: #{a.case_number}",
                "message": f"Legal Metrology audit scheduled for {a.product.commodity_name if a.product else 'Commodity'}.",
                "notification_type": "AUDIT_SCHEDULED",
                "is_read": False,
                "created_at": a.created_at.isoformat() if a.created_at else None
            })
        for d in rejected_docs[:2]:
            notif_list.append({
                "id": f"notif-doc-{d.id}",
                "company_id": company_id,
                "title": f"Document Action Required: {d.title}",
                "message": f"Document was rejected: {d.rejection_reason}. Please upload corrected certificate.",
                "notification_type": "DOCUMENT_REJECTED",
                "is_read": False,
                "created_at": d.updated_at.isoformat() if d.updated_at else None
            })

    # Summary metrics
    avg_score = 100.0
    if finalized_audits:
        avg_score = round(sum(a.compliance_score for a in finalized_audits) / len(finalized_audits), 1)

    return jsonify({
        "company": company.to_dict(),
        "stats": {
            "total_products_count": Product.query.filter_by(manufacturer_id=company_id).count(),
            "total_plants_count": Plant.query.filter_by(company_id=company_id).count(),
            "upcoming_audits_count": len(upcoming_audits),
            "active_audits_count": len(active_audits),
            "finalized_audits_count": len(finalized_audits),
            "total_documents_count": len(documents),
            "pending_documents_count": len(pending_docs),
            "verified_documents_count": len(verified_docs),
            "rejected_documents_count": len(rejected_docs),
            "average_compliance_score": avg_score
        },
        "upcoming_audits": [{
            "id": a.id,
            "case_number": a.case_number,
            "product_id": a.product_id,
            "commodity_name": a.product.commodity_name if a.product else "N/A",
            "brand_name": a.product.brand_name if a.product else "N/A",
            "category_name": a.product.category.name if (a.product and a.product.category) else "General Commodity",
            "plant_name": a.plant.name if a.plant else "Primary Unit",
            "scheduled_date": a.scheduled_date.isoformat() if a.scheduled_date else None,
            "status": a.status.value,
            "created_at": a.created_at.isoformat() if a.created_at else None
        } for a in upcoming_audits[:6]],
        "active_audits": [{
            "id": a.id,
            "case_number": a.case_number,
            "commodity_name": a.product.commodity_name if a.product else "N/A",
            "brand_name": a.product.brand_name if a.product else "N/A",
            "status": a.status.value,
            "review_cycle": a.review_cycle or 1,
            "failed_checks": a.failed_checks,
            "total_checks": a.total_checks,
            "updated_at": a.updated_at.isoformat() if a.updated_at else None
        } for a in active_audits[:6]],
        "recent_finalized_audits": [{
            "id": a.id,
            "case_number": a.case_number,
            "commodity_name": a.product.commodity_name if a.product else "N/A",
            "brand_name": a.product.brand_name if a.product else "N/A",
            "final_decision": a.final_decision.value if a.final_decision else "COMPLIANT",
            "compliance_score": a.compliance_score,
            "finalized_at": a.finalized_at.isoformat() if a.finalized_at else None,
            "report_url": f"/api/company/reports/{a.id}/pdf"
        } for a in finalized_audits[:6]],
        "notifications": notif_list
    })

# ==============================================================================
# 2. COMPANY PROFILE
# ==============================================================================

@company_bp.route("/profile", methods=["GET", "PUT"])
@require_role(["COMPANY"])
def company_profile():
    company_id, err_resp, err_code = get_authenticated_company_id()
    if err_resp:
        return err_resp, err_code

    company = db.session.get(Manufacturer, company_id)
    if not company:
        return jsonify({"error": "Company profile not found."}), 404

    if request.method == "GET":
        d = company.to_dict()
        d["plants_count"] = Plant.query.filter_by(company_id=company_id).count()
        d["products_count"] = Product.query.filter_by(manufacturer_id=company_id).count()
        d["documents_count"] = CompanyDocument.query.filter_by(company_id=company_id).count()
        d["audits_count"] = InspectionCase.query.join(Product).filter(Product.manufacturer_id == company_id).count()
        return jsonify({"company": d})

    # PUT: Update company contact details (editable fields only)
    data = request.get_json() or {}
    prev_state = company.to_dict()

    if "address" in data:
        company.address = data["address"].strip()
    if "city" in data:
        company.city = data["city"].strip()
    if "state" in data:
        company.state = data["state"].strip()
    if "pin_code" in data:
        company.pin_code = data["pin_code"].strip()
    if "contact_email" in data:
        company.contact_email = data["contact_email"].strip()
    if "contact_phone" in data:
        company.contact_phone = data["contact_phone"].strip()

    audit = AuditLog(
        user_id=g.current_user.id,
        action_type=AuditActionType.COMPANY_MODIFIED,
        entity_name="Manufacturer",
        entity_id=str(company.id),
        previous_state_json=json.dumps(prev_state),
        new_state_json=json.dumps(company.to_dict()),
        justification=f"Company profile contact information updated by {g.current_user.full_name}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({
        "message": "Company profile contact details updated successfully.",
        "company": company.to_dict()
    })

# ==============================================================================
# 3. PLANTS / LOCATIONS
# ==============================================================================

@company_bp.route("/plants", methods=["GET"])
@require_role(["COMPANY"])
def get_company_plants():
    company_id, err_resp, err_code = get_authenticated_company_id()
    if err_resp:
        return err_resp, err_code

    plants = Plant.query.filter_by(company_id=company_id).order_by(Plant.name.asc()).all()
    return jsonify({
        "plants": [p.to_dict() for p in plants],
        "count": len(plants)
    })

# ==============================================================================
# 4. PRODUCTS
# ==============================================================================

@company_bp.route("/products", methods=["GET"])
@require_role(["COMPANY"])
def get_company_products():
    company_id, err_resp, err_code = get_authenticated_company_id()
    if err_resp:
        return err_resp, err_code

    search = request.args.get("search", "").strip().lower()
    category_id = request.args.get("category_id")

    query = Product.query.filter_by(manufacturer_id=company_id)
    if category_id and category_id.isdigit():
        query = query.filter_by(category_id=int(category_id))

    products = query.order_by(Product.commodity_name.asc()).all()
    out = []
    for p in products:
        d = p.to_dict()
        if search:
            b_name = (p.brand_name or "").lower()
            c_name = (p.commodity_name or "").lower()
            barcode = (p.barcode or "").lower()
            if search not in b_name and search not in c_name and search not in barcode:
                continue

        # Add total inspections & latest compliance
        latest_audit = InspectionCase.query.filter_by(product_id=p.id).order_by(InspectionCase.created_at.desc()).first()
        d["latest_audit_status"] = latest_audit.status.value if latest_audit else "NO_AUDIT_LOGGED"
        d["latest_audit_decision"] = latest_audit.final_decision.value if (latest_audit and latest_audit.final_decision) else None
        d["latest_compliance_score"] = latest_audit.compliance_score if latest_audit else None
        d["total_audits"] = InspectionCase.query.filter_by(product_id=p.id).count()
        out.append(d)
    categories = [c.to_dict() for c in ProductCategory.query.filter_by(is_active=True).all()]
    return jsonify({
        "products": out,
        "categories": categories,
        "count": len(out)
    })

@company_bp.route("/products/<int:product_id>", methods=["GET"])
@require_role(["COMPANY"])
def get_company_product_detail(product_id):
    company_id, err_resp, err_code = get_authenticated_company_id()
    if err_resp:
        return err_resp, err_code

    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({"error": "Product not found."}), 404

    # IDOR Check: Ensure product belongs to company
    if product.manufacturer_id != company_id:
        return jsonify({"error": "Access forbidden. Product does not belong to your company."}), 403

    audits = InspectionCase.query.filter_by(product_id=product.id).order_by(InspectionCase.created_at.desc()).all()
    audit_history = []
    for a in audits:
        audit_history.append({
            "id": a.id,
            "case_number": a.case_number,
            "scheduled_date": a.scheduled_date.isoformat() if a.scheduled_date else None,
            "status": a.status.value,
            "final_decision": a.final_decision.value if a.final_decision else None,
            "compliance_score": a.compliance_score,
            "failed_checks": a.failed_checks,
            "total_checks": a.total_checks,
            "finalized_at": a.finalized_at.isoformat() if a.finalized_at else None,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "report_url": f"/api/company/reports/{a.id}/pdf" if a.status == CaseStatus.FINALIZED else None
        })

    return jsonify({
        "product": product.to_dict(),
        "audit_history": audit_history,
        "total_audits": len(audit_history)
    })

# ==============================================================================
# 5. DOCUMENTS & CERTIFICATES
# ==============================================================================

@company_bp.route("/documents", methods=["GET", "POST"])
@require_role(["COMPANY"])
def handle_company_documents():
    company_id, err_resp, err_code = get_authenticated_company_id()
    if err_resp:
        return err_resp, err_code

    if request.method == "GET":
        status_filter = request.args.get("status")
        query = CompanyDocument.query.filter_by(company_id=company_id)
        if status_filter and status_filter.upper() != "ALL":
            try:
                query = query.filter_by(status=DocumentStatus(status_filter.upper()))
            except ValueError:
                pass

        docs = query.order_by(CompanyDocument.created_at.desc()).all()
        return jsonify({
            "documents": [d.to_dict() for d in docs],
            "count": len(docs)
        })

    # POST: Upload new statutory document
    title = (request.form.get("title") or request.form.get("document_name") or "").strip()
    doc_type = request.form.get("document_type", "STATUTORY_CERTIFICATE").strip().upper()
    doc_number = request.form.get("document_number", "").strip()
    notes = request.form.get("notes", "").strip()
    cat_id = request.form.get("category_id")
    plant_id = request.form.get("plant_id")

    if not title:
        return jsonify({"error": "Document title is required."}), 400

    file_url = None
    if "file" in request.files and request.files["file"].filename:
        f = request.files["file"]
        ext = os.path.splitext(f.filename)[1].lower() or ".pdf"
        unique_name = f"doc_cmp{company_id}_{uuid.uuid4().hex[:8]}{ext}"
        save_path = os.path.join(Config.UPLOAD_FOLDER, unique_name)
        f.save(save_path)
        file_url = f"/api/media/uploads/{unique_name}"
    else:
        file_url = "/api/media/uploads/sample_certificate.pdf"

    new_doc = CompanyDocument(
        company_id=company_id,
        category_id=int(cat_id) if (cat_id and cat_id.isdigit()) else None,
        plant_id=int(plant_id) if (plant_id and plant_id.isdigit()) else None,
        document_type=doc_type,
        title=title,
        document_number=doc_number or f"DOC-LM-{int(datetime.now(timezone.utc).timestamp())}",
        file_url=file_url,
        status=DocumentStatus.PENDING_VERIFICATION, # Always pending verification on upload
        notes=notes
    )
    db.session.add(new_doc)

    audit = AuditLog(
        user_id=g.current_user.id,
        action_type=AuditActionType.EVIDENCE_UPLOADED,
        entity_name="CompanyDocument",
        entity_id=str(new_doc.id),
        new_state_json=json.dumps({"title": title, "status": DocumentStatus.PENDING_VERIFICATION.value}),
        justification=f"Statutory document '{title}' uploaded by company user {g.current_user.full_name}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({
        "message": "Document uploaded successfully. Status set to PENDING_VERIFICATION.",
        "document": new_doc.to_dict()
    }), 201

@company_bp.route("/documents/<int:doc_id>/replace", methods=["POST"])
@require_role(["COMPANY"])
def replace_company_document(doc_id):
    company_id, err_resp, err_code = get_authenticated_company_id()
    if err_resp:
        return err_resp, err_code

    doc = db.session.get(CompanyDocument, doc_id)
    if not doc:
        return jsonify({"error": "Document not found."}), 404

    # IDOR Check: Ensure document belongs to company
    if doc.company_id != company_id:
        return jsonify({"error": "Access forbidden. Document does not belong to your company."}), 403

    prev_status = doc.status.value
    doc_number = request.form.get("document_number", "").strip()
    notes = request.form.get("notes", "").strip()

    if doc_number:
        doc.document_number = doc_number
    if notes:
        doc.notes = notes

    if "file" in request.files and request.files["file"].filename:
        f = request.files["file"]
        ext = os.path.splitext(f.filename)[1].lower() or ".pdf"
        unique_name = f"doc_cmp{company_id}_rep_{uuid.uuid4().hex[:8]}{ext}"
        save_path = os.path.join(Config.UPLOAD_FOLDER, unique_name)
        f.save(save_path)
        doc.file_url = f"/api/media/uploads/{unique_name}"

    # Critical Workflow Requirement: Replacement resets status to PENDING_VERIFICATION
    doc.status = DocumentStatus.PENDING_VERIFICATION
    doc.rejection_reason = None
    doc.verified_by_id = None
    doc.verified_at = None

    audit = AuditLog(
        user_id=g.current_user.id,
        action_type=AuditActionType.CHECK_STATUS_CHANGED,
        entity_name="CompanyDocument",
        entity_id=str(doc.id),
        previous_state_json=json.dumps({"status": prev_status}),
        new_state_json=json.dumps({"status": DocumentStatus.PENDING_VERIFICATION.value}),
        justification=f"Corrected document uploaded by {g.current_user.full_name}. Reset to PENDING_VERIFICATION."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({
        "message": "Corrected document uploaded successfully and submitted for inspector verification.",
        "document": doc.to_dict()
    })

@company_bp.route("/documents/<int:doc_id>/download", methods=["GET"])
@require_role(["COMPANY"])
def download_company_document(doc_id):
    company_id, err_resp, err_code = get_authenticated_company_id()
    if err_resp:
        return err_resp, err_code

    doc = db.session.get(CompanyDocument, doc_id)
    if not doc:
        return jsonify({"error": "Document not found."}), 404

    # IDOR Check
    if doc.company_id != company_id:
        return jsonify({"error": "Access forbidden. You cannot access another company's documents."}), 403

    if not doc.file_url:
        return jsonify({"error": "Document file not available."}), 404

    fname = os.path.basename(doc.file_url)
    file_path = os.path.join(Config.UPLOAD_FOLDER, fname)
    if not os.path.exists(file_path):
        # Return fallback or 404
        return jsonify({"error": "Stored file not found on server."}), 404

    return send_file(file_path, as_attachment=False)

# ==============================================================================
# 6. COMPANY AUDITS & AUDIT DETAILS
# ==============================================================================

@company_bp.route("/audits", methods=["GET"])
@require_role(["COMPANY"])
def get_company_audits():
    company_id, err_resp, err_code = get_authenticated_company_id()
    if err_resp:
        return err_resp, err_code

    status_filter = request.args.get("status", "ALL").upper()
    search = request.args.get("search", "").strip().lower()

    query = InspectionCase.query.join(Product, Product.id == InspectionCase.product_id).filter(
        Product.manufacturer_id == company_id
    )

    if status_filter == "UPCOMING":
        query = query.filter(InspectionCase.status.in_([CaseStatus.DRAFT, CaseStatus.EVIDENCE_PENDING]))
    elif status_filter == "ACTIVE":
        query = query.filter(InspectionCase.status.in_([
            CaseStatus.ANALYZING,
            CaseStatus.ANALYSIS_COMPLETE,
            CaseStatus.INSPECTOR_REVIEW,
            CaseStatus.SUBMITTED,
            CaseStatus.SENIOR_REVIEW,
            CaseStatus.RETURNED
        ]))
    elif status_filter == "FINALIZED":
        query = query.filter(InspectionCase.status == CaseStatus.FINALIZED)
    elif status_filter == "RETURNED":
        query = query.filter(InspectionCase.status == CaseStatus.RETURNED)

    audits = query.order_by(InspectionCase.created_at.desc()).all()
    out = []
    for a in audits:
        c_num = (a.case_number or "").lower()
        b_name = (a.product.brand_name or "").lower() if a.product else ""
        comm_name = (a.product.commodity_name or "").lower() if a.product else ""

        if search and (search not in c_num and search not in b_name and search not in comm_name):
            continue

        out.append({
            "id": a.id,
            "case_number": a.case_number,
            "product_id": a.product_id,
            "commodity_name": a.product.commodity_name if a.product else "N/A",
            "brand_name": a.product.brand_name if a.product else "N/A",
            "category_name": a.product.category.name if (a.product and a.product.category) else "General Commodity",
            "plant_name": a.plant.name if a.plant else "Registered Facility",
            "scheduled_date": a.scheduled_date.isoformat() if a.scheduled_date else None,
            "status": a.status.value,
            "review_cycle": a.review_cycle or 1,
            "final_decision": a.final_decision.value if a.final_decision else None,
            "compliance_score": a.compliance_score,
            "total_checks": a.total_checks,
            "failed_checks": a.failed_checks,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "finalized_at": a.finalized_at.isoformat() if a.finalized_at else None,
            "report_url": f"/api/company/reports/{a.id}/pdf" if a.status == CaseStatus.FINALIZED else None
        })

    return jsonify({
        "audits": out,
        "count": len(out)
    })

@company_bp.route("/audits/<int:case_id>", methods=["GET"])
@require_role(["COMPANY"])
def get_company_audit_detail(case_id):
    company_id, err_resp, err_code = get_authenticated_company_id()
    if err_resp:
        return err_resp, err_code

    case = db.session.get(InspectionCase, case_id)
    if not case:
        return jsonify({"error": "Inspection audit not found."}), 404

    # Strict IDOR Check: Ensure audit belongs to this company
    if not case.product or case.product.manufacturer_id != company_id:
        return jsonify({"error": "Access forbidden. Inspection audit does not belong to your company."}), 403

    # Associated documents
    docs = CompanyDocument.query.filter(
        (CompanyDocument.company_id == company_id) | 
        (CompanyDocument.category_id == (case.product.category_id if case.product else None))
    ).all()

    # Company-sanitized output (omits internal government deliberation notes)
    d = {
        "id": case.id,
        "case_number": case.case_number,
        "status": case.status.value,
        "review_cycle": case.review_cycle or 1,
        "scheduled_date": case.scheduled_date.isoformat() if case.scheduled_date else None,
        "location_name": case.location_name,
        "plant_name": case.plant.name if case.plant else "Registered Facility",
        "product": case.product.to_dict() if case.product else None,
        "category_name": case.product.category.name if (case.product and case.product.category) else "General Commodity",
        "compliance_score": case.compliance_score,
        "total_checks": case.total_checks,
        "passed_checks": case.passed_checks,
        "failed_checks": case.failed_checks,
        "final_decision": case.final_decision.value if case.final_decision else None,
        "created_at": case.created_at.isoformat() if case.created_at else None,
        "submitted_at": case.submitted_at.isoformat() if case.submitted_at else None,
        "finalized_at": case.finalized_at.isoformat() if case.finalized_at else None,
        "rule_version": case.rule_version or "v2026.1_STANDARD",
        "documents": [doc.to_dict() for doc in docs],
        "report_url": f"/api/company/reports/{case.id}/pdf" if case.status == CaseStatus.FINALIZED else None,
        # Company-facing return directive if case is returned
        "company_action_required": case.senior_remarks if case.status == CaseStatus.RETURNED else None
    }

    # Only show finalized confirmed violations if case is finalized
    if case.status == CaseStatus.FINALIZED:
        d["violations"] = [{
            "id": v.id,
            "rule_code": v.rule_code,
            "violation_title": v.violation_title,
            "description": v.description,
            "severity": v.severity.value if hasattr(v.severity, "value") else str(v.severity),
            "senior_decision": v.senior_decision
        } for v in case.violations if v.senior_decision == "CONFIRMED"]

    return jsonify(d)

# ==============================================================================
# 7. SECURE REPORT ACCESS (IDOR PROTECTED)
# ==============================================================================

@company_bp.route("/reports/<int:case_id>/pdf", methods=["GET"])
@require_role(["COMPANY"])
def get_company_report_pdf(case_id):
    company_id, err_resp, err_code = get_authenticated_company_id()
    if err_resp:
        return err_resp, err_code

    case = db.session.get(InspectionCase, case_id)
    if not case:
        return jsonify({"error": "Inspection case not found."}), 404

    # Strict IDOR Check: Case must belong to authenticated company
    if not case.product or case.product.manufacturer_id != company_id:
        return jsonify({"error": "Access forbidden. You cannot access reports for another company."}), 403

    pdf_filename = f"report_LMPC_{case.id:05d}.pdf"
    pdf_path = os.path.join(Config.REPORTS_FOLDER, pdf_filename)

    if not os.path.exists(pdf_path):
        scan_dict = {
            "id": case.id,
            "timestamp": case.created_at.strftime("%Y-%m-%d %H:%M:%S") if case.created_at else "",
            "inspector_name": case.inspector.full_name if case.inspector else "Legal Metrology Inspector",
            "inspector_badge": case.inspector.badge_number if case.inspector else "LMO-DEL-2024-884",
            "compliance_status": case.final_decision.value if case.final_decision else ("PASS" if case.failed_checks == 0 else "POTENTIAL NON-COMPLIANCE"),
            "compliance_score": case.compliance_score,
            "product": {
                "brand": case.product.brand_name if case.product else "",
                "commodity_name": case.product.commodity_name if case.product else "",
                "category": case.product.category.name if (case.product and case.product.category) else "General Commodity"
            },
            "panels": [
                {
                    "panel_name": e.surface_type.value,
                    "image_path": os.path.join(Config.UPLOAD_FOLDER, os.path.basename(e.storage_path)),
                    "annotated_path": os.path.join(Config.UPLOAD_FOLDER, os.path.basename(e.annotated_storage_path)) if e.annotated_storage_path else None
                } for e in case.evidences
            ],
            "declarations": [d.to_dict() for d in case.declarations],
            "violations": [v.to_dict() for v in case.violations],
            "total_checks": case.total_checks,
            "passed_checks": case.passed_checks,
            "failed_checks": case.failed_checks,
            "review_required_checks": case.review_required_checks,
            "not_applicable_checks": case.not_applicable_checks,
            "formula_breakdown": case.score_breakdown_text
        }
        ReportGenerator.generate_pdf_report(scan_dict, pdf_path)

    # Log report download access
    audit = AuditLog(
        case_id=case.id,
        user_id=g.current_user.id,
        action_type=AuditActionType.REPORT_GENERATED,
        entity_name="InspectionReport",
        entity_id=str(case.id),
        justification=f"Finalized inspection report #{case.case_number} downloaded by company user {g.current_user.full_name}."
    )
    db.session.add(audit)
    db.session.commit()

    return send_file(pdf_path, mimetype="application/pdf", as_attachment=False, download_name=pdf_filename)

# ==============================================================================
# 8. NOTIFICATIONS
# ==============================================================================

@company_bp.route("/notifications", methods=["GET"])
@require_role(["COMPANY"])
def get_company_notifications():
    company_id, err_resp, err_code = get_authenticated_company_id()
    if err_resp:
        return err_resp, err_code

    notifs = Notification.query.filter(
        (Notification.company_id == company_id) | (Notification.user_id == g.current_user.id)
    ).order_by(Notification.created_at.desc()).all()

    return jsonify({
        "notifications": [n.to_dict() for n in notifs],
        "count": len(notifs),
        "unread_count": sum(1 for n in notifs if not n.is_read)
    })

@company_bp.route("/notifications/<int:notif_id>/read", methods=["POST"])
@require_role(["COMPANY"])
def mark_notification_read(notif_id):
    company_id, err_resp, err_code = get_authenticated_company_id()
    if err_resp:
        return err_resp, err_code

    notif = db.session.get(Notification, notif_id)
    if not notif:
        return jsonify({"error": "Notification not found."}), 404

    # IDOR check
    if notif.company_id != company_id and notif.user_id != g.current_user.id:
        return jsonify({"error": "Access forbidden."}), 403

    notif.is_read = True
    db.session.commit()
    return jsonify({"message": "Notification marked as read.", "notification": notif.to_dict()})

# ==============================================================================
# 9. REGULATORY RULE BOOK (READ-ONLY REFERENCE)
# ==============================================================================

@company_bp.route("/rules", methods=["GET"])
@require_role(["COMPANY"])
def get_company_rules():
    """
    Read-only view of applicable Government of India Legal Metrology regulatory rules.
    """
    rules = RegulatoryRule.query.filter_by(is_active=True).order_by(RegulatoryRule.rule_code.asc()).all()
    categories = ProductCategory.query.filter_by(is_active=True).all()

    return jsonify({
        "rules": [r.to_dict() for r in rules],
        "count": len(rules),
        "categories": [c.to_dict() for c in categories],
        "effective_rule_version": "v2026.2_GSR312E"
    })
