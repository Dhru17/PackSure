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

    force_refresh = request.args.get("refresh", "false").lower() == "true" or not os.path.exists(pdf_path)

    if force_refresh:
        # Build 16-field extracted_json mapping from stored Declarations
        field_key_map = {
            "PRODUCT_NAME": "product_name",
            "GENERIC_COMMODITY": "generic_commodity_name",
            "BRAND_NAME": "brand_name",
            "MANUFACTURER_NAME": "manufacturer_name",
            "MANUFACTURER_ADDRESS": "manufacturer_address",
            "PACKER_NAME": "packer_name",
            "IMPORTER_NAME": "importer_name",
            "NET_QUANTITY": "net_quantity",
            "UNIT": "unit",
            "MRP": "mrp",
            "MFG_DATE": "manufacturing_or_packing_date",
            "EXP_DATE": "exp_date",
            "LOT_NUMBER": "batch_or_lot_number",
            "CONSUMER_CARE_PHONE": "consumer_care_phone",
            "CONSUMER_CARE_EMAIL": "consumer_care_email",
            "CONSUMER_CARE_ADDRESS": "consumer_care_address",
            "COUNTRY_OF_ORIGIN": "country_of_origin",
            "UNIT_SALE_PRICE": "unit_sale_price",
            "BARCODE": "barcode",
            "FSSAI_NUMBER": "fssai_number"
        }

        ext_json = {}
        for d in case.declarations:
            f_type_str = d.field_type.value if hasattr(d.field_type, "value") else str(d.field_type)
            k = field_key_map.get(f_type_str, f_type_str.lower())
            surface = d.evidence.surface_type.value if d.evidence and hasattr(d.evidence, "surface_type") else "Packaging"
            ext_json[k] = {
                "value": d.extracted_value,
                "extracted_value": d.extracted_value,
                "confidence": d.confidence,
                "source_image": surface,
                "image_source": surface,
                "raw_ocr_text": d.raw_ocr_text or d.extracted_value or "",
                "raw_text": d.raw_ocr_text or d.extracted_value or ""
            }

        if "generic_commodity_name" in ext_json and "generic_name" not in ext_json:
            ext_json["generic_name"] = ext_json["generic_commodity_name"]
        if "brand_name" not in ext_json and case.product and case.product.brand_name:
            ext_json["brand_name"] = {
                "value": case.product.brand_name,
                "extracted_value": case.product.brand_name,
                "confidence": 0.95,
                "source_image": "Product Info",
                "raw_ocr_text": case.product.brand_name
            }

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
            "extracted_json": ext_json,
            "declarations": [d.to_dict() for d in case.declarations],
            "compliance_checks": [c.to_dict() for c in case.compliance_checks],
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
        else:
            report.file_size_bytes = os.path.getsize(pdf_path) if os.path.exists(pdf_path) else 0
            db.session.commit()

    return send_file(pdf_path, mimetype="application/pdf", as_attachment=False, download_name=pdf_filename)
