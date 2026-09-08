import os
from flask import Blueprint, jsonify, send_file, request, g
from config import Config
from models import db, InspectionCase, InspectionReport, AuditLog, AuditActionType
from services.auth_service import require_auth
from services.report_generator import ReportGenerator

reports_bp = Blueprint("reports_bp", __name__, url_prefix="/api/reports")

@reports_bp.route("/<int:case_id>/pdf", methods=["GET"])
def get_report_pdf(case_id):
    case = InspectionCase.query.get_or_404(case_id)
    pdf_filename = f"report_LMPC_{case.id:05d}.pdf"
    pdf_path = os.path.join(Config.REPORTS_FOLDER, pdf_filename)

    if not os.path.exists(pdf_path):
        # Prepare scan dictionary format expected by ReportGenerator
        scan_dict = {
            "id": case.id,
            "timestamp": case.created_at.strftime("%Y-%m-%d %H:%M:%S") if case.created_at else "",
            "inspector_name": case.inspector.full_name if case.inspector else "Inspector",
            "inspector_badge": case.inspector.badge_number if case.inspector else "LMO-DEL-2024-884",
            "compliance_status": case.final_decision.value if case.final_decision else ("PASS" if case.failed_checks == 0 else "POTENTIAL NON-COMPLIANCE"),
            "compliance_score": case.compliance_score,
            "product": {
                "brand": case.product.brand_name if case.product else "",
                "commodity_name": case.product.commodity_name if case.product else "",
                "category": case.product.category.name if case.product and case.product.category else "General Commodity"
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

        report = InspectionReport.query.filter_by(case_id=case.id).first()
        if not report:
            report = InspectionReport(
                case_id=case.id,
                report_number=f"RPT-LM-2026-{case.id:05d}-V1",
                storage_path=f"/api/reports/{case.id}/pdf",
                report_version=1,
                file_size_bytes=os.path.getsize(pdf_path) if os.path.exists(pdf_path) else 0
            )
            db.session.add(report)
            db.session.commit()

    return send_file(pdf_path, mimetype="application/pdf", as_attachment=False, download_name=pdf_filename)
