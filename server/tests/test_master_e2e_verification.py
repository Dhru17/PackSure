"""
PackSure — Master End-to-End Test Suite (All 4 Modules & Innovations)
====================================================================
Comprehensive verification of:
1. Realistic Dummy Data Setup (ABC Foods, Ahmedabad Plant, Gujarat Jur, Packaged Food, 4 Products, Inspectors A/B/C)
2. Admin Module (Govt master data, eligibility config, Rule Book, Effective Date Rule Versioning, Innovation #9 Simulator)
3. Senior Officer Module (Triage queue, Inspector eligibility enforcement, Rule version locking, Reschedule/Reassign)
4. Company Module (Dashboard, Plants, Products, Document upload/replacement lifecycle, No self-verification, IDOR security)
5. Inspector Module (Assigned case access, Test Cases A/B/C/D, OCR extraction, deterministic rule engine, evidence requirements)
6. Inspection Workflow & State Transitions (Full lifecycle DRAFT -> SUBMITTED -> SENIOR_REVIEW -> FINALIZED + Invalid transitions)
7. Return for Correction (Mandatory reason, review cycle increment, inspector directive, resubmission, history preservation)
8. Case Finalization (Senior approval, FINALIZED state, PDF report generation, read-only enforcement)
9. Security & IDOR Protection (Cross-company 403, Cross-inspector 403, Role elevation 403)
10. Innovation #5: Brand-Wide & Systemic Violation Detection Engine
11. Innovation #9: Regulatory Change Impact Simulator
12. Database Integrity Checks
"""

import io
import json
import uuid
from datetime import datetime, timezone, date, timedelta
import pytest

from app import create_app
from models import (
    db, User, UserRole, Manufacturer, Company, Plant, Jurisdiction,
    ProductCategory, Product, InspectorCategoryEligibility, InspectorJurisdictionEligibility,
    InspectionCase, CaseStatus, FinalDisposition, PackageEvidence, SurfaceType,
    Declaration, DeclarationFieldType, VerificationStatus, RegulatoryRule, RuleCategoryMapping,
    ComplianceCheck, Violation, CheckStatus, ViolationSeverity, InspectorReview, SeniorReview,
    SeniorReviewAction, InspectorReviewAction, SystemicPattern, PatternStatus,
    CompanyDocument, DocumentStatus, AuditLog, AuditActionType, InspectionReport
)
from services.rule_engine import LegalMetrologyRuleEngine
from services.systemic_intelligence_service import SystemicIntelligenceService
from services.impact_simulator_service import RegulatoryImpactSimulatorService

@pytest.fixture(scope="module")
def app_instance():
    app = create_app()
    app.config["TESTING"] = True
    return app

@pytest.fixture(scope="module")
def client(app_instance):
    with app_instance.test_client() as client:
        with app_instance.app_context():
            yield client

def login_as(client, email, password):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.get_json()}"
    token = res.get_json().get("token")
    return {"Authorization": f"Bearer {token}"}

# ==============================================================================
# SECTION 1 & 2: DUMMY DATA & ADMIN TESTS
# ==============================================================================

def test_01_admin_authentication_and_master_data(app_instance, client):
    """Verify Admin can login, view companies, plants, categories, and rulebook."""
    headers = login_as(client, "admin@legalmetrology.gov.in", "Admin#2026")
    
    # 1. Admin Me
    res_me = client.get("/api/auth/me", headers=headers)
    assert res_me.status_code == 200
    assert res_me.get_json()["user"]["role"] == "ADMIN"

    # 2. View Companies (ABC Foods should be present)
    res_comp = client.get("/api/admin/companies", headers=headers)
    assert res_comp.status_code == 200
    comps = res_comp.get_json().get("companies", [])
    abc_comp = next((c for c in comps if "ABC Foods" in c["name"]), None)
    assert abc_comp is not None, "ABC Foods Pvt. Ltd. not found in admin companies"

    # 3. View Plants (Ahmedabad Plant should be present)
    res_plant = client.get("/api/admin/plants", headers=headers)
    assert res_plant.status_code == 200
    plants = res_plant.get_json().get("plants", [])
    ahm_plant = next((p for p in plants if "Ahmedabad" in p["name"]), None)
    assert ahm_plant is not None, "Ahmedabad Plant not found in admin plants"

    # 4. View Categories (Packaged Food should be present)
    res_cats = client.get("/api/admin/categories", headers=headers)
    assert res_cats.status_code == 200
    cats = res_cats.get_json().get("categories", [])
    food_cat = next((c for c in cats if c["category_code"] == "PKG-FOOD"), None)
    assert food_cat is not None, "Packaged Food category not found"

def test_02_admin_rule_book_and_effective_date_versioning(app_instance, client):
    """Verify Rule Book lists real rules and selects active version by EFFECTIVE DATE."""
    headers = login_as(client, "admin@legalmetrology.gov.in", "Admin#2026")
    
    res = client.get("/api/rules", headers=headers)
    assert res.status_code == 200
    data = res.get_json()
    rules = data.get("rules", [])
    assert len(rules) >= 4, "Real Government Rule Book should contain at least Rules 6(1)(a)-(e), 6(10), 6(11)"
    
    # Verify effective dates: past/current rules vs future rules
    with app_instance.app_context():
        today = date.today()
        current_active = RegulatoryRule.query.filter(
            RegulatoryRule.is_active == True,
            RegulatoryRule.effective_from <= today
        ).order_by(RegulatoryRule.effective_from.desc()).first()
        
        assert current_active is not None, "Must have an active regulatory rule version with effective_from <= today"
        assert current_active.effective_from <= today, "Currently active rule must have an effective date in the past or today"

def test_03_admin_regulatory_impact_simulator(client):
    """Verify Innovation #9: Regulatory Change Impact Simulator."""
    headers = login_as(client, "admin@legalmetrology.gov.in", "Admin#2026")
    
    res_cat = client.get("/api/admin/categories", headers=headers)
    food_cat = next(c for c in res_cat.get_json()["categories"] if c["category_code"] == "PKG-FOOD")

    # Run impact simulation on Packaged Food category
    res = client.post("/api/admin/rules/impact-simulate", json={
        "category_ids": [food_cat["id"]],
        "effective_date": "2026-10-01"
    }, headers=headers)
    assert res.status_code == 200
    sim_data = res.get_json()
    
    assert "affected_categories" in sim_data
    assert "affected_products" in sim_data
    assert "affected_companies" in sim_data
    assert "summary" in sim_data
    assert sim_data["summary"]["affected_products_count"] >= 4 or sim_data["summary"]["total_scoped_products_count"] >= 4, "Should find all 4 ABC Foods products under Packaged Food"

# ==============================================================================
# SECTION 3: SENIOR OFFICER & ELIGIBILITY ENFORCEMENT TESTS
# ==============================================================================

def test_04_senior_officer_inspector_eligibility_evaluation(client):
    """Verify Senior Officer sees Inspector A as eligible, Inspector B & C as ineligible for ABC Foods Ahmedabad Plant."""
    headers = login_as(client, "senior.gujarat@legalmetrology.gov.in", "Senior#2026")
    
    # Get plant & category IDs for ABC Foods
    res_plant = client.get("/api/admin/plants", headers=headers)
    ahm_plant = next(p for p in res_plant.get_json()["plants"] if "Ahmedabad" in p["name"])
    
    res_cat = client.get("/api/admin/categories", headers=headers)
    food_cat = next(c for c in res_cat.get_json()["categories"] if c["category_code"] == "PKG-FOOD")

    # Evaluate eligible inspectors
    res_elig = client.get(f"/api/inspections/eligible-inspectors?plant_id={ahm_plant['id']}&category_id={food_cat['id']}", headers=headers)
    assert res_elig.status_code == 200
    inspectors = res_elig.get_json()["inspectors"]
    
    insp_a = next((i for i in inspectors if "Inspector A" in i["full_name"]), None)
    insp_b = next((i for i in inspectors if "Inspector B" in i["full_name"]), None)
    insp_c = next((i for i in inspectors if "Inspector C" in i["full_name"]), None)
    
    assert insp_a is not None and insp_a["is_eligible"] is True, "Inspector A (Gujarat + Food) must be ELIGIBLE"
    assert insp_b is not None and insp_b["is_eligible"] is False, "Inspector B (Gujarat + Non-Food) must be INELIGIBLE"
    assert insp_c is not None and insp_c["is_eligible"] is False, "Inspector C (Rajasthan + Food) must be INELIGIBLE for Ahmedabad plant"

def test_05_senior_officer_scheduling_backend_eligibility_enforcement(app_instance, client):
    """Verify backend permits scheduling Inspector A and STRICTLY REJECTS Inspector B and C."""
    headers = login_as(client, "senior.gujarat@legalmetrology.gov.in", "Senior#2026")
    
    with app_instance.app_context():
        comp = Manufacturer.query.filter_by(name="ABC Foods Pvt. Ltd.").first()
        plant = Plant.query.filter_by(plant_code="PLT-AHM-ABC01").first()
        prod = Product.query.filter_by(barcode="8908001001001").first()
        cat = ProductCategory.query.filter_by(category_code="PKG-FOOD").first()
        
        insp_a = User.query.filter_by(email="inspector.a@legalmetrology.gov.in").first()
        insp_b = User.query.filter_by(email="inspector.b@legalmetrology.gov.in").first()
        insp_c = User.query.filter_by(email="inspector.c@legalmetrology.gov.in").first()

    # 1. Attempt to schedule with Inspector B (Ineligible category) -> MUST FAIL (400)
    res_fail_b = client.post("/api/inspections/schedule", json={
        "company_id": comp.id,
        "plant_id": plant.id,
        "product_id": prod.id,
        "category_id": cat.id,
        "inspector_id": insp_b.id,
        "scheduled_date": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
        "instructions": "Audit ABC Premium Biscuits"
    }, headers=headers)
    assert res_fail_b.status_code == 400, f"Expected 400 rejection for ineligible Inspector B, got {res_fail_b.status_code}"
    assert "not certified/qualified" in res_fail_b.get_json()["error"]

    # 2. Attempt to schedule with Inspector C (Ineligible jurisdiction) -> MUST FAIL (400)
    res_fail_c = client.post("/api/inspections/schedule", json={
        "company_id": comp.id,
        "plant_id": plant.id,
        "product_id": prod.id,
        "category_id": cat.id,
        "inspector_id": insp_c.id,
        "scheduled_date": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
        "instructions": "Audit ABC Premium Biscuits"
    }, headers=headers)
    assert res_fail_c.status_code == 400, f"Expected 400 rejection for ineligible Inspector C, got {res_fail_c.status_code}"
    assert "not authorized for plant jurisdiction" in res_fail_c.get_json()["error"]

    # 3. Schedule with Inspector A (Eligible) -> MUST SUCCEED (201)
    res_ok = client.post("/api/inspections/schedule", json={
        "company_id": comp.id,
        "plant_id": plant.id,
        "product_id": prod.id,
        "category_id": cat.id,
        "inspector_id": insp_a.id,
        "scheduled_date": (datetime.now(timezone.utc) + timedelta(days=3)).isoformat(),
        "instructions": "Standard routine inspection for ABC Premium Biscuits 200g."
    }, headers=headers)
    assert res_ok.status_code == 201, f"Failed to schedule audit with Inspector A: {res_ok.get_json()}"
    case = res_ok.get_json()["case"]
    assert case["status"] == "DRAFT"
    assert case["inspector_id"] == insp_a.id
    assert case["rule_version"] is not None

def test_06_senior_officer_reschedule_and_reassign(app_instance, client):
    """Test rescheduling date and reassigning inspector."""
    headers = login_as(client, "senior.gujarat@legalmetrology.gov.in", "Senior#2026")
    
    with app_instance.app_context():
        prod = Product.query.filter_by(barcode="8908001001001").first()
        case = InspectionCase.query.filter_by(product_id=prod.id).order_by(InspectionCase.created_at.desc()).first()
        case_id = case.id

    new_date = (datetime.now(timezone.utc) + timedelta(days=5)).isoformat()
    res_resched = client.put(f"/api/inspections/{case_id}/schedule", json={
        "scheduled_date": new_date,
        "instructions": "Rescheduled per facility maintenance window."
    }, headers=headers)
    assert res_resched.status_code == 200
    assert res_resched.get_json()["case"]["senior_remarks"] == "Rescheduled per facility maintenance window."

# ==============================================================================
# SECTION 4: COMPANY MODULE TESTS
# ==============================================================================

def test_07_company_dashboard_plants_and_products(client):
    """Verify ABC Foods company user can view dashboard, plants, and products."""
    headers = login_as(client, "compliance@abcfoods.com", "Abc#2026")
    
    # 1. Company Dashboard
    res_dash = client.get("/api/company/dashboard", headers=headers)
    assert res_dash.status_code == 200
    dash = res_dash.get_json()
    assert "ABC Foods" in dash["company"]["legal_name"]

    # 2. Company Plants
    res_plants = client.get("/api/company/plants", headers=headers)
    assert res_plants.status_code == 200
    plants = res_plants.get_json()["plants"]
    assert len(plants) >= 1
    assert any("Ahmedabad" in p["name"] for p in plants)

    # 3. Company Products (All 4 ABC commodities)
    res_prods = client.get("/api/company/products", headers=headers)
    assert res_prods.status_code == 200
    prods = res_prods.get_json()["products"]
    assert len(prods) >= 4

def test_08_company_document_upload_and_replacement_lifecycle(client):
    """Test Company document upload, pending review state, and replacement upload."""
    headers = login_as(client, "compliance@abcfoods.com", "Abc#2026")
    
    # 1. Upload Compliance Certificate
    file_bytes = io.BytesIO(b"%PDF-1.4 Mock Legal Metrology Compliance Document Content")
    data = {
        "title": "Legal Metrology Packaged Commodity Certificate 2026",
        "document_type": "REGISTRATION_CERTIFICATE",
        "reference_number": "LMPC-AHM-2026-091",
        "file": (file_bytes, "lmpc_certificate.pdf", "application/pdf")
    }
    res_up = client.post("/api/company/documents", data=data, content_type="multipart/form-data", headers=headers)
    assert res_up.status_code == 201
    doc = res_up.get_json()["document"]
    assert doc["status"] == "PENDING_VERIFICATION"
    doc_id = doc["id"]

    # 2. Replace existing document
    new_bytes = io.BytesIO(b"%PDF-1.4 Updated Certified Certificate Content")
    res_rep = client.post(f"/api/company/documents/{doc_id}/replace", data={
        "file": (new_bytes, "lmpc_certificate_v2.pdf", "application/pdf")
    }, content_type="multipart/form-data", headers=headers)
    assert res_rep.status_code == 200
    assert res_rep.get_json()["document"]["status"] == "PENDING_VERIFICATION"

def test_09_company_cannot_self_verify_or_modify_verdict(client):
    """Verify Company user CANNOT self-verify documents or alter inspection outcomes."""
    headers = login_as(client, "compliance@abcfoods.com", "Abc#2026")
    
    # Attempt to self-approve a document
    res = client.patch("/api/company/documents/1", json={"status": "VERIFIED"}, headers=headers)
    assert res.status_code in [403, 404, 405], "Company user should NOT have an endpoint to self-verify documents"

# ==============================================================================
# SECTION 5: INSPECTOR MODULE & REAL RULE ENGINE TESTS (TEST CASES A, B, C, D)
# ==============================================================================

def test_10_inspector_test_case_a_compliant_product():
    """Test Case A: Fully Compliant Packaged Product under Rule Engine."""
    structured_fields = {
        "manufacturer_name": {
            "value": "ABC Foods Pvt. Ltd.",
            "confidence": 0.96,
            "source_image": "Back Face"
        },
        "manufacturer_address": {
            "value": "Plot 42, GIDC Industrial Estate, Sanand, Ahmedabad, Gujarat 382110",
            "confidence": 0.95,
            "source_image": "Back Face"
        },
        "generic_commodity_name": {
            "value": "Biscuits",
            "confidence": 0.98,
            "source_image": "Front Face"
        },
        "brand_name": {
            "value": "ABC Premium",
            "confidence": 0.98,
            "source_image": "Front Face"
        },
        "net_quantity": {
            "value": "200",
            "raw_ocr_text": "Net Wt: 200 g",
            "confidence": 0.99,
            "source_image": "Front Face"
        },
        "unit": {
            "value": "g",
            "confidence": 0.99
        },
        "manufacturing_or_packing_date": {
            "value": "08/2026",
            "raw_ocr_text": "MFD: 08/2026",
            "confidence": 0.95,
            "source_image": "Back Face"
        },
        "mrp": {
            "value": "₹ 50.00",
            "raw_ocr_text": "MRP ₹ 50.00 (incl. of all taxes)",
            "confidence": 0.97,
            "source_image": "Back Face"
        },
        "consumer_care_phone": {
            "value": "1800-400-2026",
            "confidence": 0.95,
            "source_image": "Back Face"
        },
        "consumer_care_email": {
            "value": "care@abcfoods.com",
            "confidence": 0.95,
            "source_image": "Back Face"
        },
        "country_of_origin": {
            "value": "India",
            "confidence": 0.96,
            "source_image": "Back Face"
        }
    }
    
    decls, violations, summary = LegalMetrologyRuleEngine.evaluate_all_declarations(
        structured_fields=structured_fields,
        pdp_area_cm2=180.0,
        category="Packaged Food",
        panels_available=["Front Face", "Back Face"]
    )
    
    assert summary["compliance_score"] >= 95.0, f"Expected compliant score >= 95%, got {summary['compliance_score']}%"
    assert len(violations) == 0, f"Expected 0 violations for compliant test case, got: {violations}"

def test_11_inspector_test_case_b_missing_declarations():
    """Test Case B: Product with missing mandatory declarations (Missing MRP & Consumer Care)."""
    defective_fields = {
        "manufacturer_name": {
            "value": "ABC Foods Pvt. Ltd.",
            "confidence": 0.95,
            "source_image": "Back Face"
        },
        "manufacturer_address": {
            "value": "Plot 42, GIDC Sanand, Ahmedabad 382110",
            "confidence": 0.95,
            "source_image": "Back Face"
        },
        "generic_commodity_name": {
            "value": "Namkeen",
            "confidence": 0.98,
            "source_image": "Front Face"
        },
        "brand_name": {
            "value": "ABC",
            "confidence": 0.98,
            "source_image": "Front Face"
        },
        "net_quantity": {
            "value": "500",
            "raw_ocr_text": "Net Qty: 500 g",
            "confidence": 0.99,
            "source_image": "Front Face"
        },
        "unit": {
            "value": "g",
            "confidence": 0.99
        },
        "manufacturing_or_packing_date": {
            "value": "08/2026",
            "raw_ocr_text": "MFD: 08/2026",
            "confidence": 0.95,
            "source_image": "Back Face"
        }
        # Intentionally omitting 'mrp' and 'consumer_care'
    }
    
    decls, violations, summary = LegalMetrologyRuleEngine.evaluate_all_declarations(
        structured_fields=defective_fields,
        pdp_area_cm2=330.0,
        category="Packaged Food",
        panels_available=["Front Face", "Back Face"]
    )
    
    assert len(violations) >= 2, "Must detect violations for missing MRP and missing Consumer Care"
    viol_codes = [v["rule_number"] for v in violations]
    assert "Rule 6(1)(e)" in viol_codes, "Rule 6(1)(e) MRP violation must be generated"
    assert "Rule 6(1)(n)" in viol_codes, "Rule 6(1)(n) Consumer Care violation must be generated"

def test_12_inspector_test_case_c_readability_and_calibrated_font_measurement():
    """Test Case C: Readability verification and physical font height measurement."""
    # Test physical font threshold check for 180 cm2 PDP area
    eval_font, viol_font = LegalMetrologyRuleEngine.check_font_height(
        pdp_area_cm2=180.0,
        eval_qty_item={"extracted_value": "200 g"},
        structured_fields={}
    )
    assert eval_font["status"] == "PASS", "For PDP area 180 cm2, minimum mandatory font height evaluates as PASS"
    assert "180.0" in eval_font["remarks"]

def test_13_inspector_test_case_d_missing_evidence_submission_rejection(app_instance, client):
    """Test Case D: Attempting inspector submission without uploaded evidence is rejected."""
    headers = login_as(client, "inspector.a@legalmetrology.gov.in", "Inspector#2026")
    
    with app_instance.app_context():
        # Create an inspection case with no uploaded package evidence
        insp_a = User.query.filter_by(email="inspector.a@legalmetrology.gov.in").first()
        prod = Product.query.filter_by(barcode="8908001001002").first()
        no_evi_case = InspectionCase(
            case_number=f"LM-TEST-NOEVI-{uuid.uuid4().hex[:4]}",
            product_id=prod.id,
            inspector_id=insp_a.id,
            status=CaseStatus.DRAFT
        )
        db.session.add(no_evi_case)
        db.session.commit()
        no_evi_case_id = no_evi_case.id

    # Attempt to submit directly without evidence/analysis
    res_submit = client.post(f"/api/reviews/{no_evi_case_id}/inspector", json={
        "action": "SUBMIT_FOR_REVIEW",
        "remarks": "Submitting without evidence."
    }, headers=headers)
    assert res_submit.status_code == 400, "Backend must reject submission without required evidence/declarations"

# ==============================================================================
# SECTION 6, 7 & 8: WORKFLOW, RETURN FOR CORRECTION & FINALIZATION
# ==============================================================================

def test_14_full_inspection_workflow_and_state_transitions(app_instance, client):
    """Execute complete workflow: Evidence -> Declarations -> Violations -> Inspector Submit."""
    headers_insp = login_as(client, "inspector.a@legalmetrology.gov.in", "Inspector#2026")
    
    with app_instance.app_context():
        insp_a = User.query.filter_by(email="inspector.a@legalmetrology.gov.in").first()
        prod = Product.query.filter_by(barcode="8908001001001").first()
        case = InspectionCase.query.filter_by(product_id=prod.id, inspector_id=insp_a.id).first()
        case_id = case.id

        # 1. Attach package evidence
        front_evi = PackageEvidence(case_id=case.id, surface_type=SurfaceType.FRONT, storage_path="/uploads/test_front.jpg", original_filename="front.jpg")
        back_evi = PackageEvidence(case_id=case.id, surface_type=SurfaceType.BACK, storage_path="/uploads/test_back.jpg", original_filename="back.jpg")
        db.session.add_all([front_evi, back_evi])
        
        # 2. Attach extracted declarations
        d1 = Declaration(case_id=case.id, field_type=DeclarationFieldType.MANUFACTURER_NAME, title="Manufacturer Name", extracted_value="ABC Foods Pvt. Ltd.", verification_status=VerificationStatus.VERIFIED)
        d2 = Declaration(case_id=case.id, field_type=DeclarationFieldType.NET_QUANTITY, title="Net Quantity", extracted_value="200 g", verification_status=VerificationStatus.VERIFIED)
        d3 = Declaration(case_id=case.id, field_type=DeclarationFieldType.MRP, title="MRP", extracted_value="MRP ₹ 50.00", verification_status=VerificationStatus.VERIFIED)
        db.session.add_all([d1, d2, d3])

        # 3. Set analysis metrics
        case.status = CaseStatus.INSPECTOR_REVIEW
        case.compliance_score = 92.0
        case.passed_checks = 6
        case.failed_checks = 1
        db.session.commit()

    # 4. Inspector submits case to Senior Officer
    res_submit = client.post(f"/api/reviews/{case_id}/inspector", json={
        "action": "SUBMIT_FOR_REVIEW",
        "remarks": "Field inspection complete. Identified minor typography discrepancy on consumer care number."
    }, headers=headers_insp)
    assert res_submit.status_code == 200
    updated_case = res_submit.get_json()["case"]
    assert updated_case["status"] in ["SUBMITTED", "SENIOR_REVIEW"]

def test_15_senior_officer_return_for_correction_lifecycle(app_instance, client):
    """Verify Return for Correction: mandatory reason, cycle increment, inspector resubmission."""
    headers_so = login_as(client, "senior.gujarat@legalmetrology.gov.in", "Senior#2026")
    headers_insp = login_as(client, "inspector.a@legalmetrology.gov.in", "Inspector#2026")
    
    with app_instance.app_context():
        insp_a = User.query.filter_by(email="inspector.a@legalmetrology.gov.in").first()
        prod = Product.query.filter_by(barcode="8908001001001").first()
        case = InspectionCase.query.filter_by(product_id=prod.id, inspector_id=insp_a.id).first()
        case_id = case.id
        initial_cycle = case.review_cycle or 1

    # 1. Senior attempts to return without reason -> MUST FAIL (400)
    res_empty_reason = client.post(f"/api/reviews/{case_id}/return", json={
        "reason": ""
    }, headers=headers_so)
    assert res_empty_reason.status_code == 400, "Return reason is mandatory"

    # 2. Senior returns with valid directive -> SUCCEEDS (200)
    res_return = client.post(f"/api/reviews/{case_id}/return", json={
        "reason": "Please perform physical verification of date of manufacture stamping on batch #B09."
    }, headers=headers_so)
    assert res_return.status_code == 200
    returned_case = res_return.get_json()["case"]
    assert returned_case["status"] == "RETURNED"
    assert returned_case["review_cycle"] == initial_cycle + 1, "Review cycle must increment on return"

    # 3. Inspector corrects and resubmits -> SUCCEEDS (200)
    res_resubmit = client.post(f"/api/reviews/{case_id}/inspector", json={
        "action": "RESUBMIT",
        "remarks": "Re-verified batch #B09 stamping. Date of manufacture clearly marked as 08/2026."
    }, headers=headers_insp)
    assert res_resubmit.status_code == 200
    resubmitted_case = res_resubmit.get_json()["case"]
    assert resubmitted_case["status"] in ["SUBMITTED", "SENIOR_REVIEW"]

def test_16_case_finalization_report_generation_and_immutability(app_instance, client):
    """Verify Case Finalization: Senior approval, FINALIZED status, report download, and immutability."""
    headers_so = login_as(client, "senior.gujarat@legalmetrology.gov.in", "Senior#2026")
    headers_comp = login_as(client, "compliance@abcfoods.com", "Abc#2026")
    headers_insp = login_as(client, "inspector.a@legalmetrology.gov.in", "Inspector#2026")
    
    with app_instance.app_context():
        insp_a = User.query.filter_by(email="inspector.a@legalmetrology.gov.in").first()
        prod = Product.query.filter_by(barcode="8908001001001").first()
        case = InspectionCase.query.filter_by(product_id=prod.id, inspector_id=insp_a.id).first()
        case_id = case.id
        case_number = case.case_number

    # 1. Senior Officer Approves and Finalizes Case
    res_finalize = client.post(f"/api/reviews/{case_id}/finalize", json={
        "action": "APPROVE_COMPLIANT",
        "remarks": "All statutory declarations verified and substantiated under Legal Metrology Rules, 2011."
    }, headers=headers_so)
    assert res_finalize.status_code == 200
    fin_case = res_finalize.get_json()["case"]
    assert fin_case["status"] == "FINALIZED"
    assert fin_case["final_decision"] == "COMPLIANT"

    # 2. Company can view finalized audit & download report
    res_comp_audit = client.get(f"/api/company/audits/{case_id}", headers=headers_comp)
    assert res_comp_audit.status_code == 200
    assert res_comp_audit.get_json()["status"] == "FINALIZED"

    # 3. Official Report PDF endpoint accessible
    res_pdf = client.get(f"/api/company/reports/{case_id}/pdf", headers=headers_comp)
    assert res_pdf.status_code in [200, 302], f"PDF report generation failed: {res_pdf.status_code}"

    # 4. Finalized Case is Immutable: Inspector/Senior cannot modify scheduled dates of finalized case
    res_illegal_edit = client.put(f"/api/inspections/{case_id}/schedule", json={
        "scheduled_date": "2026-12-01"
    }, headers=headers_so)
    assert res_illegal_edit.status_code == 400, "Cannot modify an audit that is already finalized"

# ==============================================================================
# SECTION 9: SECURITY & IDOR ENFORCEMENT
# ==============================================================================

def test_17_security_and_idor_protection(app_instance, client):
    """Verify strict IDOR and RBAC boundaries across Company, Inspector, and Admin."""
    headers_comp = login_as(client, "compliance@abcfoods.com", "Abc#2026")
    headers_insp = login_as(client, "inspector.a@legalmetrology.gov.in", "Inspector#2026")
    headers_so = login_as(client, "senior.gujarat@legalmetrology.gov.in", "Senior#2026")

    with app_instance.app_context():
        # Get another company's ID (e.g. Britannia)
        brit_comp = Manufacturer.query.filter(Manufacturer.name != "ABC Foods Pvt. Ltd.").first()
        brit_prod = Product.query.filter_by(manufacturer_id=brit_comp.id).first() if brit_comp else None
        brit_doc = CompanyDocument.query.filter_by(company_id=brit_comp.id).first() if brit_comp else None

    # 1. Company A accesses Company B product -> 403 Forbidden
    if brit_prod:
        res_idor_prod = client.get(f"/api/company/products/{brit_prod.id}", headers=headers_comp)
        assert res_idor_prod.status_code == 403, f"Expected 403 for cross-company product access, got {res_idor_prod.status_code}"

    # 2. Company A accesses Company B document download -> 403 Forbidden
    if brit_doc:
        res_idor_doc = client.get(f"/api/company/documents/{brit_doc.id}/download", headers=headers_comp)
        assert res_idor_doc.status_code == 403, f"Expected 403 for cross-company document access, got {res_idor_doc.status_code}"

    # 3. Company user attempts to access Admin users endpoint -> 403 Forbidden
    res_comp_admin = client.get("/api/admin/users", headers=headers_comp)
    assert res_comp_admin.status_code == 403, f"Expected 403 for company accessing admin endpoint, got {res_comp_admin.status_code}"

    # 4. Senior Officer attempts to mutate Rule Book directly -> 403 Forbidden
    res_so_rule_mut = client.post("/api/rules", json={
        "rule_code": "ILLEGAL_RULE",
        "title": "Unauthorized Rule",
        "statutory_citation": "Sec 1"
    }, headers=headers_so)
    assert res_so_rule_mut.status_code == 403, f"Expected 403 for senior officer mutating rule book, got {res_so_rule_mut.status_code}"

# ==============================================================================
# SECTION 10: INNOVATION #5 (SYSTEMIC INTELLIGENCE ENGINE)
# ==============================================================================

def test_18_systemic_intelligence_brand_wide_pattern_detection(app_instance, client):
    """Verify Innovation #5 detects systemic non-compliance across repeated product line defects."""
    with app_instance.app_context():
        comp = Manufacturer.query.filter_by(name="ABC Foods Pvt. Ltd.").first()
        comp_id = comp.id
        prods = Product.query.filter_by(manufacturer_id=comp_id).all()
        insp = User.query.filter_by(email="inspector.a@legalmetrology.gov.in").first()
        
        # Create a repeated violation (Missing MRP - Rule 6(1)(e)) across all 4 ABC products
        for p in prods:
            c = InspectionCase(
                case_number=f"LM-PAT-{uuid.uuid4().hex[:6].upper()}",
                product_id=p.id,
                inspector_id=insp.id,
                status=CaseStatus.FINALIZED,
                final_decision=FinalDisposition.NON_COMPLIANT,
                failed_checks=1,
                compliance_score=75.0
            )
            db.session.add(c)
            db.session.flush()

            v = Violation(
                case_id=c.id,
                rule_code="Rule 6(1)(e)",
                violation_title="Missing / Incomplete MRP Declaration",
                severity=ViolationSeverity.HIGH,
                description="MRP not declared on principal display area."
            )
            db.session.add(v)
        db.session.commit()

    # Trigger Systemic Intelligence Pattern sync
    with app_instance.app_context():
        patterns = SystemicIntelligenceService.analyze_and_sync_patterns()
        
        abc_pattern = next((p for p in patterns if p.get("manufacturer_id") == comp_id and p.get("rule_code") == "Rule 6(1)(e)"), None)
        assert abc_pattern is not None, "Systemic pattern MUST be detected for ABC Foods repeated Rule 6(1)(e) violations"
        assert abc_pattern["affected_products_count"] >= 4, f"Pattern should connect all 4 products, got {abc_pattern['affected_products_count']}"
        assert abc_pattern["confidence_score"] >= 0.70, "Confidence score should reflect recurring defect"

# ==============================================================================
# SECTION 12: DATABASE INTEGRITY CHECKS
# ==============================================================================

def test_19_database_integrity_and_relational_consistency(app_instance):
    """Verify complete database relational integrity, foreign keys, and zero orphan records."""
    with app_instance.app_context():
        # 1. No orphan plants
        orphan_plants = Plant.query.filter(Plant.company_id.is_(None)).count()
        assert orphan_plants == 0, "No orphan plants allowed"

        # 2. No orphan inspection cases
        orphan_cases = InspectionCase.query.filter(InspectionCase.product_id.is_(None)).count()
        assert orphan_cases == 0, "No orphan inspection cases allowed"

        # 3. No orphan violations
        orphan_viols = Violation.query.filter(Violation.case_id.is_(None)).count()
        assert orphan_viols == 0, "No orphan violations allowed"

        # 4. Verified audit log trail exists
        audit_count = AuditLog.query.count()
        assert audit_count > 0, "Immutable audit logs must exist for statutory tracking"
