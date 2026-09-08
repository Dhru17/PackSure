import os
import sys
import json
import time
import requests
from io import BytesIO
from PIL import Image, ImageDraw, ImageFilter

API_BASE = "http://127.0.0.1:5055"

def print_header(title):
    print(f"\n{'='*70}\n {title}\n{'='*70}")

def generate_synthetic_label(include_all=True):
    """Generates a synthetic high-contrast package label for testing."""
    img = Image.new('RGB', (800, 600), color=(225, 225, 225))
    draw = ImageDraw.Draw(img)
    draw.rectangle([20, 20, 780, 580], outline=(20, 20, 40), width=6)
    
    # Add barcode pattern to provide rich texture & high edge contrast
    for x in range(500, 700, 6):
        draw.line([(x, 400), (x, 520)], fill=(10, 10, 10), width=3)
    
    draw.text((40, 40), "BRITANNIA GOOD DAY BUTTER COOKIES", fill=(10, 10, 10))
    draw.text((40, 80), "Net Quantity: 200 g", fill=(10, 10, 10))
    if include_all:
        draw.text((40, 120), "MRP: Rs 40.00 (Incl. of all taxes)", fill=(10, 10, 10))
        draw.text((40, 160), "Unit Sale Price: Rs 0.20 / g", fill=(10, 10, 10))
    draw.text((40, 200), "Mfg Date: 05/2026", fill=(10, 10, 10))
    draw.text((40, 240), "Manufactured & Packed By: Britannia Industries Ltd., Kolkata - 700017", fill=(10, 10, 10))
    if include_all:
        draw.text((40, 280), "Consumer Care: Call 1800-425-4449 or Email: feedback@britindia.com", fill=(10, 10, 10))
    draw.text((40, 320), "Country of Origin: India", fill=(10, 10, 10))
    
    buf = BytesIO()
    img.save(buf, format='JPEG', quality=95)
    buf.seek(0)
    return buf.getvalue()

def generate_blurry_image():
    """Generates a blurry image to trigger OpenCV quality diagnostics."""
    img = Image.new('RGB', (300, 200), color=(180, 180, 180))
    draw = ImageDraw.Draw(img)
    draw.text((30, 30), "Low Quality Deficient Sample", fill=(120, 120, 120))
    img = img.filter(ImageFilter.GaussianBlur(radius=8))
    buf = BytesIO()
    img.save(buf, format='JPEG', quality=30)
    buf.seek(0)
    return buf.getvalue()

def run_inspector_refinement_suite():
    print_header("RUNNING INSPECTOR OFFICER MODULE 10-SCENARIO TEST SUITE")
    
    # 0. AUTHENTICATION SETUP
    res = requests.post(f"{API_BASE}/api/auth/login", json={
        "email": "inspector@legalmetrology.gov.in",
        "password": "Inspector#2026"
    })
    assert res.status_code == 200, f"Inspector login failed: {res.text}"
    insp_token = res.json()["token"]
    insp_headers = {"Authorization": f"Bearer {insp_token}"}
    print("[PASS] [Auth] Inspector authenticated successfully.")

    res = requests.post(f"{API_BASE}/api/auth/login", json={
        "email": "senior@legalmetrology.gov.in",
        "password": "Senior#2026"
    })
    assert res.status_code == 200, f"Senior login failed: {res.text}"
    senior_token = res.json()["token"]
    senior_headers = {"Authorization": f"Bearer {senior_token}"}
    print("[PASS] [Auth] Senior Officer authenticated successfully.")

    # 1. SCENARIO A: FULLY COMPLIANT PRODUCT WORKFLOW
    print_header("SCENARIO A: FULLY COMPLIANT CASE WORKFLOW")
    prod_res = requests.post(f"{API_BASE}/api/products", headers=insp_headers, json={
        "barcode": f"8901030{int(time.time())}",
        "brand_name": "Britannia",
        "commodity_name": "Good Day Butter Cookies 200g",
        "package_type": "BOX",
        "default_net_quantity": "200 g",
        "default_mrp": 40.0,
        "pdp_width_cm": 15.0,
        "pdp_height_cm": 10.0,
        "pdp_area_cm2": 150.0
    })
    assert prod_res.status_code == 201
    prod_id = prod_res.json()["product"]["id"]

    case_res = requests.post(f"{API_BASE}/api/inspections", headers=insp_headers, json={
        "product_id": prod_id,
        "location_name": "Central Retail Store, New Delhi"
    })
    assert case_res.status_code == 201
    case_a_id = case_res.json()["inspection"]["id"]
    case_a_num = case_res.json()["inspection"]["case_number"]
    print(f"[PASS] Case #{case_a_id} ({case_a_num}) created in DRAFT.")

    ev_bytes = generate_synthetic_label(include_all=True)
    ev_res = requests.post(
        f"{API_BASE}/api/inspections/{case_a_id}/evidence",
        headers=insp_headers,
        data={"surface_type": "FRONT"},
        files={"image": ("front_label.jpg", ev_bytes, "image/jpeg")}
    )
    assert ev_res.status_code == 201
    print(f"[PASS] Evidence uploaded for surface FRONT with verdict: {ev_res.json()['evidence']['quality_verdict']}")

    ana_res = requests.post(f"{API_BASE}/api/inspections/{case_a_id}/analyze", headers=insp_headers)
    assert ana_res.status_code == 200
    print(f"[PASS] AI Analysis executed. Total checks: {ana_res.json()['summary']['total_checks']}, Score: {ana_res.json()['summary']['compliance_score']}%")

    sub_res = requests.post(f"{API_BASE}/api/reviews/{case_a_id}/inspector", headers=insp_headers, json={
        "remarks": "Package inspection completed. All mandatory declarations verified on FRONT face.",
        "corrections": {}
    })
    assert sub_res.status_code == 200
    assert sub_res.json()["status"] == "SUBMITTED"
    print(f"[PASS] Inspector submitted case #{case_a_id} to Senior Review queue.")

    sen_res = requests.post(f"{API_BASE}/api/reviews/{case_a_id}/senior-action", headers=senior_headers, json={
        "action": "APPROVE_COMPLIANT",
        "remarks": "Verified and approved as fully compliant."
    })
    assert sen_res.status_code == 200
    assert sen_res.json()["final_decision"] == "COMPLIANT"
    print(f"[PASS] Scenario A completed: Case #{case_a_id} finalized as COMPLIANT.")

    # 2. SCENARIO B: MISSING MANDATORY DECLARATION
    print_header("SCENARIO B: MISSING MANDATORY DECLARATION")
    case_b_res = requests.post(f"{API_BASE}/api/inspections", headers=insp_headers, json={
        "product_id": prod_id,
        "location_name": "Surveillance Check 2"
    })
    case_b_id = case_b_res.json()["inspection"]["id"]

    ev_b_bytes = generate_synthetic_label(include_all=False)
    requests.post(
        f"{API_BASE}/api/inspections/{case_b_id}/evidence",
        headers=insp_headers,
        data={"surface_type": "FRONT"},
        files={"image": ("partial_label.jpg", ev_b_bytes, "image/jpeg")}
    )
    ana_b_res = requests.post(f"{API_BASE}/api/inspections/{case_b_id}/analyze", headers=insp_headers)
    assert ana_b_res.status_code == 200
    summary_b = ana_b_res.json()["summary"]
    assert summary_b["failed_checks"] > 0, "Expected at least 1 failed check for missing MRP"
    print(f"[PASS] Rule engine correctly flagged {summary_b['failed_checks']} missing mandatory declaration(s).")

    sub_b_res = requests.post(f"{API_BASE}/api/reviews/{case_b_id}/inspector", headers=insp_headers, json={
        "remarks": "Missing statutory MRP and Consumer Care declarations on retail unit.",
        "corrections": {}
    })
    assert sub_b_res.status_code == 200
    print(f"[PASS] Scenario B completed: Case #{case_b_id} submitted with non-compliance findings.")

    # 3. SCENARIO C: INCORRECT AI EXTRACTION & HITL SEPARATION
    print_header("SCENARIO C: INCORRECT AI EXTRACTION & HITL SEPARATION")
    case_c_res = requests.post(f"{API_BASE}/api/inspections", headers=insp_headers, json={
        "product_id": prod_id,
        "location_name": "Surveillance Check 3"
    })
    case_c_id = case_c_res.json()["inspection"]["id"]
    requests.post(
        f"{API_BASE}/api/inspections/{case_c_id}/evidence",
        headers=insp_headers,
        data={"surface_type": "FRONT"},
        files={"image": ("label_c.jpg", generate_synthetic_label(include_all=True), "image/jpeg")}
    )
    requests.post(f"{API_BASE}/api/inspections/{case_c_id}/analyze", headers=insp_headers)

    detail_c = requests.get(f"{API_BASE}/api/inspections/{case_c_id}", headers=insp_headers).json()
    mrp_decl = next((d for d in detail_c["declarations"] if "MRP" in d["field_type"]), None)
    assert mrp_decl is not None, "MRP declaration not found in case"
    raw_extracted_val = mrp_decl["extracted_value"]

    corrected_val = "Rs 45.00"
    requests.post(f"{API_BASE}/api/reviews/{case_c_id}/inspector", headers=insp_headers, json={
        "remarks": "Inspector corrected MRP based on physical stamp.",
        "corrections": {str(mrp_decl["id"]): corrected_val}
    })

    updated_c = requests.get(f"{API_BASE}/api/inspections/{case_c_id}", headers=insp_headers).json()
    updated_mrp = next(d for d in updated_c["declarations"] if d["id"] == mrp_decl["id"])
    assert updated_mrp["extracted_value"] == raw_extracted_val, "Raw extracted value was overwritten!"
    assert updated_mrp["inspector_corrected_value"] == corrected_val, "Inspector correction not saved!"
    assert updated_mrp["verification_status"] == "CORRECTED", "Verification status not set to CORRECTED!"
    print(f"[PASS] Scenario C: Raw AI value ('{raw_extracted_val}') and Inspector value ('{corrected_val}') preserved distinctly.")

    # 4. SCENARIO D: MULTI-SURFACE EVIDENCE HANDLING
    print_header("SCENARIO D: MULTI-SURFACE EVIDENCE HANDLING")
    case_d_res = requests.post(f"{API_BASE}/api/inspections", headers=insp_headers, json={
        "product_id": prod_id,
        "location_name": "Multi-Surface Check"
    })
    case_d_id = case_d_res.json()["inspection"]["id"]

    requests.post(
        f"{API_BASE}/api/inspections/{case_d_id}/evidence",
        headers=insp_headers,
        data={"surface_type": "FRONT"},
        files={"image": ("front.jpg", generate_synthetic_label(include_all=True), "image/jpeg")}
    )
    requests.post(
        f"{API_BASE}/api/inspections/{case_d_id}/evidence",
        headers=insp_headers,
        data={"surface_type": "BACK"},
        files={"image": ("back.jpg", generate_synthetic_label(include_all=True), "image/jpeg")}
    )

    detail_d = requests.get(f"{API_BASE}/api/inspections/{case_d_id}", headers=insp_headers).json()
    assert len(detail_d["evidences"]) == 2, "Expected 2 evidence records"
    surfaces = {e["surface_type"] for e in detail_d["evidences"]}
    assert surfaces == {"FRONT", "BACK"}, f"Surfaces mismatch: {surfaces}"
    print(f"[PASS] Scenario D: Multiple packaging surfaces {surfaces} successfully attached to Case #{case_d_id}.")

    # 5. SCENARIO E: POOR IMAGE QUALITY DETECTION
    print_header("SCENARIO E: POOR IMAGE QUALITY DETECTION")
    case_e_res = requests.post(f"{API_BASE}/api/inspections", headers=insp_headers, json={
        "product_id": prod_id,
        "location_name": "Quality Check"
    })
    case_e_id = case_e_res.json()["inspection"]["id"]
    blurry_bytes = generate_blurry_image()
    ev_e_res = requests.post(
        f"{API_BASE}/api/inspections/{case_e_id}/evidence",
        headers=insp_headers,
        data={"surface_type": "FRONT"},
        files={"image": ("blurry.jpg", blurry_bytes, "image/jpeg")}
    )
    assert ev_e_res.status_code == 201
    ev_data = ev_e_res.json()["evidence"]
    assert "blur_score" in ev_data and ev_data["blur_score"] is not None
    assert "quality_verdict" in ev_data
    print(f"[PASS] Scenario E: OpenCV blur score = {ev_data['blur_score']:.1f}, Verdict = {ev_data['quality_verdict']}")

    # 6. SCENARIO F: RETURNED INSPECTION WORKFLOW
    print_header("SCENARIO F: RETURNED INSPECTION WORKFLOW")
    remand_res = requests.post(f"{API_BASE}/api/reviews/{case_b_id}/senior-action", headers=senior_headers, json={
        "action": "RETURN_FOR_REINSPECTION",
        "remarks": "Please recapture back panel showing manufacturer license and consumer care phone.",
        "statutory_justification": "Evidence incomplete for statutory notice under Rule 6(1)(n)."
    })
    assert remand_res.status_code == 200
    assert remand_res.json()["status"] == "RETURNED"
    print(f"[PASS] Senior Officer remanded Case #{case_b_id} with status: RETURNED.")

    ov_res = requests.get(f"{API_BASE}/api/inspections/overview", headers=insp_headers)
    assert ov_res.status_code == 200
    ov_data = ov_res.json()
    assert ov_data["workload"]["returned_cases"] >= 1
    returned_item = next((item for item in ov_data["urgent_actions"] if item["id"] == case_b_id), None)
    assert returned_item is not None, "Remanded case not found in Inspector urgent_actions!"
    print(f"[PASS] Inspector Overview correctly displays remanded Case #{case_b_id} with directive: '{returned_item['senior_remarks']}'")

    requests.post(
        f"{API_BASE}/api/inspections/{case_b_id}/evidence",
        headers=insp_headers,
        data={"surface_type": "BACK"},
        files={"image": ("back_clear.jpg", generate_synthetic_label(include_all=True), "image/jpeg")}
    )
    requests.post(f"{API_BASE}/api/inspections/{case_b_id}/analyze", headers=insp_headers)
    resub_res = requests.post(f"{API_BASE}/api/reviews/{case_b_id}/inspector", headers=insp_headers, json={
        "remarks": "Re-captured back packaging face under uniform lighting. Resubmitting for final adjudication.",
        "corrections": {}
    })
    assert resub_res.status_code == 200
    assert resub_res.json()["status"] == "SUBMITTED"
    print(f"[PASS] Scenario F completed: Remanded Case #{case_b_id} updated with new evidence and resubmitted.")

    # 7. SCENARIO G: NEGATIVE RBAC TESTS
    print_header("SCENARIO G: NEGATIVE RBAC SECURITY GUARDS")
    sen_act_res = requests.post(f"{API_BASE}/api/reviews/{case_a_id}/senior-action", headers=insp_headers, json={
        "action": "APPROVE_COMPLIANT"
    })
    assert sen_act_res.status_code == 403, f"Expected 403, got {sen_act_res.status_code}"
    print("[PASS] Inspector blocked from Senior Officer adjudication endpoint (HTTP 403).")

    adm_user_res = requests.post(f"{API_BASE}/api/admin/users", headers=insp_headers, json={
        "email": "hacker@domain.com",
        "full_name": "Hacker",
        "password": "Password123"
    })
    assert adm_user_res.status_code == 403, f"Expected 403, got {adm_user_res.status_code}"
    print("[PASS] Inspector blocked from Admin user provisioning endpoint (HTTP 403).")

    # 8. SCENARIO H: INVALID STATE TRANSITIONS
    print_header("SCENARIO H: INVALID STATE TRANSITIONS")
    fresh_case = requests.post(f"{API_BASE}/api/inspections", headers=insp_headers, json={
        "product_id": prod_id
    }).json()["inspection"]
    fresh_id = fresh_case["id"]

    premature_res = requests.post(f"{API_BASE}/api/reviews/{fresh_id}/inspector", headers=insp_headers, json={
        "remarks": "Trying to bypass analysis"
    })
    assert premature_res.status_code == 400, f"Expected 400, got {premature_res.status_code}"
    print("[PASS] Premature submission on DRAFT case rejected by state machine (HTTP 400).")

    # 9. SCENARIO I: RULE APPLICABILITY & PDP DIMENSIONS
    print_header("SCENARIO I: RULE APPLICABILITY & PDP DIMENSIONS")
    detail_a = requests.get(f"{API_BASE}/api/inspections/{case_a_id}", headers=insp_headers).json()
    assert len(detail_a["compliance_checks"]) > 0
    print(f"[PASS] Metrology rule engine evaluated {len(detail_a['compliance_checks'])} applicable statutory rules.")

    # 10. SCENARIO J: TRI-PARTITE AUDIT TRAIL INTEGRITY
    print_header("SCENARIO J: TRI-PARTITE AUDIT TRAIL INTEGRITY")
    audit_res = requests.get(f"{API_BASE}/api/inspections/{case_a_id}", headers=insp_headers).json()
    audit_actions = [a["action_type"] for a in audit_res["audit_logs"]]
    print(f"Recorded Audit Trail for Case #{case_a_id}: {audit_actions}")
    
    assert "CASE_CREATED" in audit_actions
    assert "EVIDENCE_UPLOADED" in audit_actions
    assert "AI_ANALYSIS_EXECUTED" in audit_actions
    assert "INSPECTOR_SUBMITTED" in audit_actions
    assert "CASE_FINALIZED" in audit_actions or "SENIOR_OVERRIDE" in audit_actions
    print("[PASS] Complete tri-partite audit trail preserved: Raw AI -> Inspector Verification -> Senior Finalization.")

    print_header("ALL 10 SCENARIOS PASSED WITH 100% SUCCESS!")

if __name__ == "__main__":
    run_inspector_refinement_suite()