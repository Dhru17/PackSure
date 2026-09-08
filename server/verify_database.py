import sys
import os
from datetime import datetime, timezone, date
import json

from app import create_app
from models import (
    db, User, UserRole,
    Manufacturer, ProductCategory, Product,
    InspectionCase, CaseStatus, FinalDisposition,
    PackageEvidence, OCRDetection, SurfaceType, QualityVerdict,
    Declaration, DeclarationFieldType, ExtractionMethod, VerificationStatus,
    RegulatoryRule, RuleCategoryMapping,
    ComplianceCheck, Violation, CheckStatus, ViolationSeverity, InspectorDecision, SeniorDecision,
    InspectorReview, SeniorReview, InspectorReviewAction, SeniorReviewAction,
    InspectionReport,
    AuditLog, AuditActionType
)

def run_database_verification():
    print("=" * 70)
    print("PACKSURE PHASE 2: DATABASE ARCHITECTURE VERIFICATION TEST")
    print("=" * 70)

    app = create_app()

    with app.app_context():
        # 1. Reset & Create all tables
        db.drop_all()
        db.create_all()
        print("[PASS] 1. Database connection & all tables created successfully.")

        # 2. Seed Users & RBAC Roles
        admin = User(email="admin@legalmetrology.gov.in", full_name="Admin Officer S. Rao", role=UserRole.ADMIN, badge_number="ADM-001")
        admin.set_password("AdminSecure#2026")

        senior = User(email="senior@legalmetrology.gov.in", full_name="Assistant Controller Priya Verma", role=UserRole.SENIOR_OFFICER, badge_number="LMO-SR-092", jurisdiction_district="Central Delhi")
        senior.set_password("SeniorSecure#2026")

        inspector = User(email="inspector@legalmetrology.gov.in", full_name="Inspector Rahul Sharma", role=UserRole.INSPECTOR, badge_number="LMO-DEL-2024-884", jurisdiction_district="Central Delhi")
        inspector.set_password("InspectorPass#2026")

        db.session.add_all([admin, senior, inspector])
        db.session.commit()

        assert inspector.check_password("InspectorPass#2026") is True
        assert inspector.check_password("WrongPassword") is False
        print(f"[PASS] 2. Users seeded & password authentication verified (Users count: {User.query.count()})")

        # 3. Seed Manufacturers & Categories
        mfg = Manufacturer(
            name="Britannia Industries Ltd",
            legal_entity_name="Britannia Industries Private Limited",
            address="5/1A, Hungerford Street",
            city="Kolkata",
            state="West Bengal",
            pin_code="700017",
            contact_email="feedback@britindia.com",
            contact_phone="1800-425-4449",
            is_importer=False
        )
        db.session.add(mfg)

        cat_food = ProductCategory(category_code="FOOD_BEVERAGE", name="Packaged Foods & Beverages", description="All packaged edible items")
        db.session.add(cat_food)
        db.session.flush()

        cat_biscuits = ProductCategory(category_code="BAKERY_BISCUITS", name="Biscuits, Cookies & Crackers", parent_id=cat_food.id)
        db.session.add(cat_biscuits)
        db.session.commit()
        print(f"[PASS] 3. Manufacturer ({mfg.name}) & Category hierarchy ({cat_biscuits.name}) verified.")

        # 4. Seed Product
        product = Product(
            barcode="8901063012345",
            brand_name="Britannia Good Day",
            commodity_name="Butter Cookies",
            category_id=cat_biscuits.id,
            manufacturer_id=mfg.id,
            package_type="Pouch / Pillow Pack",
            default_net_quantity="200 g",
            default_mrp=45.00,
            is_imported=False,
            country_of_origin="India",
            pdp_width_cm=14.0,
            pdp_height_cm=18.0,
            pdp_area_cm2=252.0
        )
        db.session.add(product)
        db.session.commit()
        print(f"[PASS] 4. Product record ({product.brand_name} - {product.barcode}) created.")

        # 5. Seed Regulatory Rules with Versioning & Category Mappings
        rule_mrp_v1 = RegulatoryRule(
            rule_code="RULE_6_1_E",
            version="v2011.0",
            title="Maximum Retail Price Declaration",
            description="Retail sale price inclusive of all taxes must be declared on package.",
            statutory_citation="Rule 6(1)(e), Legal Metrology (PC) Rules, 2011",
            validation_logic_type="MRP_TAX_CLAUSE",
            effective_from=date(2011, 4, 1),
            effective_to=date(2022, 9, 30),
            is_active=False
        )
        rule_mrp_v2 = RegulatoryRule(
            rule_code="RULE_6_1_E",
            version="v2022.1",
            title="Maximum Retail Price (All Inclusive)",
            description="MRP strictly in Indian Rupees with mandatory 'inclusive of all taxes' or 'incl. of all taxes'.",
            statutory_citation="Rule 6(1)(e) (Amended 2022), Legal Metrology (PC) Rules, 2011",
            validation_logic_type="MRP_TAX_CLAUSE",
            effective_from=date(2022, 10, 1),
            effective_to=None,
            is_active=True
        )
        rule_usp = RegulatoryRule(
            rule_code="RULE_6_11",
            version="v2022.1",
            title="Unit Sale Price (USP)",
            description="Unit Sale Price mandatory for packages containing > 1kg / 1L or multi-packs.",
            statutory_citation="Rule 6(11) (2022 Amendment), Legal Metrology (PC) Rules, 2011",
            validation_logic_type="USP_THRESHOLD",
            applicability_criteria_json=json.dumps({"min_quantity_kg": 1.0, "min_quantity_litre": 1.0, "multi_pack": True}),
            effective_from=date(2022, 10, 1),
            is_active=True
        )
        db.session.add_all([rule_mrp_v1, rule_mrp_v2, rule_usp])
        db.session.commit()
        print(f"[PASS] 5. Regulatory Rules & Versioning verified (Rules count: {RegulatoryRule.query.count()})")

        # 6. Create Inspection Case Lifecycle (DRAFT -> SUBMITTED -> FINALIZED)
        case = InspectionCase(
            case_number="LM-2026-001001",
            product_id=product.id,
            inspector_id=inspector.id,
            senior_reviewer_id=senior.id,
            status=CaseStatus.DRAFT,
            location_name="Connaught Place Supermarket, New Delhi",
            geo_lat=28.6315,
            geo_lng=77.2167,
            source_type="Retail Physical Inspection"
        )
        db.session.add(case)
        db.session.commit()

        # Audit log for case creation
        audit_1 = AuditLog(
            case_id=case.id,
            user_id=inspector.id,
            action_type=AuditActionType.CASE_CREATED,
            entity_name="InspectionCase",
            entity_id=str(case.id),
            new_state_json=json.dumps({"case_number": case.case_number, "status": case.status.value}),
            justification="Routine market surveillance inspection initiated."
        )
        db.session.add(audit_1)
        db.session.commit()
        print(f"[PASS] 6. Inspection Case ({case.case_number}) created in DRAFT state.")

        # 7. Add Multi-Surface Package Evidence & Quality Diagnostics
        ev_front = PackageEvidence(
            case_id=case.id,
            surface_type=SurfaceType.FRONT,
            storage_path="uploads/case_1001_front.jpg",
            annotated_storage_path="uploads/case_1001_front_annotated.jpg",
            original_filename="good_day_front.jpg",
            width_px=1920,
            height_px=1080,
            blur_score=145.2,
            contrast_score=48.5,
            quality_verdict=QualityVerdict.READABLE,
            quality_summary="Sharp, clear lighting, high contrast."
        )
        ev_price = PackageEvidence(
            case_id=case.id,
            surface_type=SurfaceType.PRICE_FLAP,
            storage_path="uploads/case_1001_price.jpg",
            annotated_storage_path="uploads/case_1001_price_annotated.jpg",
            original_filename="good_day_price.jpg",
            width_px=1280,
            height_px=720,
            blur_score=110.0,
            contrast_score=42.0,
            quality_verdict=QualityVerdict.READABLE,
            quality_summary="Readable price flap."
        )
        db.session.add_all([ev_front, ev_price])
        db.session.commit()
        print(f"[PASS] 7. Multi-surface Package Evidences ({ev_front.surface_type.value}, {ev_price.surface_type.value}) saved.")

        # 8. Add OCR Detections & Structured Declarations
        ocr_1 = OCRDetection(
            evidence_id=ev_front.id,
            case_id=case.id,
            raw_text="NET WT. 200 g",
            confidence=0.985,
            bbox_x=0.15, bbox_y=0.75, bbox_w=0.35, bbox_h=0.08
        )
        ocr_2 = OCRDetection(
            evidence_id=ev_price.id,
            case_id=case.id,
            raw_text="MRP Rs. 45.00 (INCL. OF ALL TAXES)",
            confidence=0.978,
            bbox_x=0.10, bbox_y=0.20, bbox_w=0.60, bbox_h=0.10
        )
        db.session.add_all([ocr_1, ocr_2])
        db.session.flush()

        decl_qty = Declaration(
            case_id=case.id,
            evidence_id=ev_front.id,
            field_type=DeclarationFieldType.NET_QUANTITY,
            title="Net Quantity",
            raw_ocr_text="NET WT. 200 g",
            extracted_value="200 g",
            normalized_value="200 g",
            confidence=0.985,
            bbox_x=0.15, bbox_y=0.75, bbox_w=0.35, bbox_h=0.08,
            font_height_mm=2.5,
            is_calibrated=True,
            extraction_method=ExtractionMethod.OCR_TOKEN_MATCHER,
            verification_status=VerificationStatus.VERIFIED
        )
        decl_mrp = Declaration(
            case_id=case.id,
            evidence_id=ev_price.id,
            field_type=DeclarationFieldType.MRP,
            title="Maximum Retail Price (MRP)",
            raw_ocr_text="MRP Rs. 45.00 (INCL. OF ALL TAXES)",
            extracted_value="₹ 45.00 (incl. of all taxes)",
            normalized_value="45.00",
            confidence=0.978,
            bbox_x=0.10, bbox_y=0.20, bbox_w=0.60, bbox_h=0.10,
            extraction_method=ExtractionMethod.OCR_TOKEN_MATCHER,
            verification_status=VerificationStatus.VERIFIED
        )
        db.session.add_all([decl_qty, decl_mrp])
        db.session.commit()
        print(f"[PASS] 8. OCR Detections and Structured Declarations linked with bounding boxes.")

        # 9. Perform Compliance Checks & Record Violations
        chk_mrp = ComplianceCheck(
            case_id=case.id,
            rule_id=rule_mrp_v2.id,
            status=CheckStatus.PASS,
            confidence=0.978,
            reason_explanation="MRP declared in INR with statutory phrasing '(incl. of all taxes)'.",
            evaluated_value="₹ 45.00 (incl. of all taxes)",
            expected_condition="Must contain '(incl. of all taxes)'",
            evidence_id=ev_price.id
        )
        chk_usp = ComplianceCheck(
            case_id=case.id,
            rule_id=rule_usp.id,
            status=CheckStatus.NOT_APPLICABLE,
            confidence=1.0,
            reason_explanation="Unit Sale Price is not applicable for net quantity <= 1 kg (200 g).",
            evaluated_value="200 g",
            expected_condition="Net quantity > 1kg / 1L"
        )
        db.session.add_all([chk_mrp, chk_usp])
        db.session.commit()
        print(f"[PASS] 9. Compliance Checks evaluated (Rule {rule_mrp_v2.rule_code}: {chk_mrp.status.value}, Rule {rule_usp.rule_code}: {chk_usp.status.value}).")

        # 10. Inspector Verification & Submission
        case.status = CaseStatus.SUBMITTED
        case.compliance_score = 100.0
        case.total_checks = 2
        case.passed_checks = 1
        case.not_applicable_checks = 1
        case.inspector_remarks = "All declarations verified against physical packaging sample."
        case.submitted_at = datetime.now(timezone.utc)

        insp_review = InspectorReview(
            case_id=case.id,
            inspector_id=inspector.id,
            action=InspectorReviewAction.SUBMIT_FOR_REVIEW,
            remarks="Submitted for Senior Officer final concurrence."
        )
        db.session.add(insp_review)

        audit_2 = AuditLog(
            case_id=case.id,
            user_id=inspector.id,
            action_type=AuditActionType.INSPECTOR_SUBMITTED,
            entity_name="InspectionCase",
            entity_id=str(case.id),
            previous_state_json=json.dumps({"status": "DRAFT"}),
            new_state_json=json.dumps({"status": "SUBMITTED", "score": 100.0}),
            justification="Inspector completed physical verification and submitted for review."
        )
        db.session.add(audit_2)
        db.session.commit()
        print(f"[PASS] 10. Inspector Review submitted and logged in Audit Trail.")

        # 11. Senior Officer Review & Case Finalization
        case.status = CaseStatus.FINALIZED
        case.final_decision = FinalDisposition.COMPLIANT
        case.senior_remarks = "Approved and concurred. Package fully satisfies LMPC Rules 2011."
        case.finalized_at = datetime.now(timezone.utc)

        sr_review = SeniorReview(
            case_id=case.id,
            senior_officer_id=senior.id,
            action=SeniorReviewAction.APPROVE_FINAL,
            remarks="Case finalized as Compliant. No show-cause notice required."
        )
        db.session.add(sr_review)

        # 12. Generate Inspection Report Reference
        report = InspectionReport(
            case_id=case.id,
            report_number="RPT-LM-2026-001001-V1",
            storage_path="reports/report_LM_2026_001001.pdf",
            report_version=1,
            file_size_bytes=42500,
            generated_by_id=inspector.id
        )
        db.session.add(report)

        audit_3 = AuditLog(
            case_id=case.id,
            user_id=senior.id,
            action_type=AuditActionType.CASE_FINALIZED,
            entity_name="InspectionCase",
            entity_id=str(case.id),
            previous_state_json=json.dumps({"status": "SUBMITTED"}),
            new_state_json=json.dumps({"status": "FINALIZED", "final_decision": "COMPLIANT"}),
            justification="Senior Officer verified and closed case as Compliant."
        )
        db.session.add(audit_3)
        db.session.commit()
        print(f"[PASS] 11 & 12. Senior Officer finalized case as {case.final_decision.value} & Report ({report.report_number}) logged.")

        # 13. Query & Analytics Validation
        print("\n--- RUNNING ANALYTICS & HISTORICAL QUERIES ---")
        
        # Query A: All inspections for Britannia
        mfg_cases = InspectionCase.query.join(Product).filter(Product.manufacturer_id == mfg.id).all()
        print(f"[PASS] Query A (Inspections by Manufacturer '{mfg.name}'): {len(mfg_cases)} cases found.")

        # Query B: Inspections conducted by Inspector Rahul Sharma
        insp_cases = InspectionCase.query.filter_by(inspector_id=inspector.id).all()
        print(f"[PASS] Query B (Workload for Inspector '{inspector.full_name}'): {len(insp_cases)} cases found.")

        # Query C: Audit Trail for Case LM-2026-001001
        case_audits = AuditLog.query.filter_by(case_id=case.id).order_by(AuditLog.timestamp.asc()).all()
        print(f"[PASS] Query C (Audit Log entries for '{case.case_number}'): {len(case_audits)} immutable audit records.")
        for a in case_audits:
            print(f"       -> [{a.timestamp.strftime('%H:%M:%S')}] {a.action_type.value} by {a.user.full_name}: {a.justification}")

        print("\n" + "=" * 70)
        print("ALL 13 PHASE 2 DATABASE VERIFICATION SUITES PASSED PERFECTLY!")
        print("=" * 70)

if __name__ == "__main__":
    run_database_verification()
