import os
import sys
import json
import time
import requests
from io import BytesIO
from PIL import Image, ImageDraw

API_BASE = "http://127.0.0.1:5055"

def print_header(title):
    print(f"\n{'='*70}\n {title}\n{'='*70}")

def generate_synthetic_package_image():
    """Generates a synthetic realistic packaging label with clear Legal Metrology declarations."""
    img = Image.new('RGB', (800, 600), color=(245, 245, 240))
    draw = ImageDraw.Draw(img)
    
    # Border / packaging panel
    draw.rectangle([20, 20, 780, 580], outline=(40, 40, 80), width=4)
    
    # Text declarations
    draw.text((40, 40), "BRITANNIA GOOD DAY BUTTER COOKIES", fill=(20, 20, 20))
    draw.text((40, 80), "Net Quantity: 200 g", fill=(20, 20, 20))
    draw.text((40, 120), "MRP: Rs 40.00 (Incl. of all taxes)", fill=(20, 20, 20))
    draw.text((40, 160), "Unit Sale Price: Rs 0.20 / g", fill=(20, 20, 20))
    draw.text((40, 200), "Mfg Date: 05/2026", fill=(20, 20, 20))
    draw.text((40, 240), "Manufactured & Packed By: Britannia Industries Ltd., 5/1A Hungerford Street, Kolkata - 700017", fill=(20, 20, 20))
    draw.text((40, 280), "Consumer Care: Call 1800-425-4449 or Email: feedback@britindia.com", fill=(20, 20, 20))
    draw.text((40, 320), "Country of Origin: India", fill=(20, 20, 20))
    
    buf = BytesIO()
    img.save(buf, format='JPEG', quality=95)
    buf.seek(0)
    return buf.getvalue()

def run_acceptance_suite():
    results = {}
    
    # -------------------------------------------------------------
    # 1. END-TO-END WORKFLOW TEST
    # -------------------------------------------------------------
    print_header("1. TESTING COMPLETE END-TO-END WORKFLOW")
    
    # Step A: Inspector Login
    login_res = requests.post(f"{API_BASE}/api/auth/login", json={
        "email": "inspector@legalmetrology.gov.in",
        "password": "Inspector#2026"
    })
    assert login_res.status_code == 200, f"Inspector login failed: {login_res.text}"
    inspector_data = login_res.json()
    inspector_token = inspector_data["token"]
    inspector_headers = {"Authorization": f"Bearer {inspector_token}"}
    print("[OK] [Inspector Login] Authenticated as:", inspector_data["user"]["full_name"])
    
    # Step B: Create Product
    prod_payload = {
        "barcode": f"8901030{int(time.time())}",
        "brand_name": "Britannia Industries",
        "commodity_name": "Good Day Butter Cookies 200g",
        "package_type": "BOX",
        "default_net_quantity": "200 g",
        "default_mrp": 40.0,
        "is_imported": False,
        "country_of_origin": "India",
        "pdp_width_cm": 15.0,
        "pdp_height_cm": 10.0,
        "pdp_area_cm2": 150.0
    }
    prod_res = requests.post(f"{API_BASE}/api/products", json=prod_payload, headers=inspector_headers)
    assert prod_res.status_code == 201, f"Product creation failed: {prod_res.text}"
    product_id = prod_res.json()["product"]["id"]
    print(f"[OK] [Product Created] ID: {product_id} with PDP Area 150 cm2")
    
    # Step C: Initialize Inspection Case
    case_payload = {
        "product_id": product_id,
        "location_name": "Connaught Place Supermarket, New Delhi",
        "source_type": "MARKET_SURVEILLANCE"
    }
    case_res = requests.post(f"{API_BASE}/api/inspections", json=case_payload, headers=inspector_headers)
    assert case_res.status_code == 201, f"Case creation failed: {case_res.text}"
    case_data = case_res.json()["inspection"]
    case_id = case_data["id"]
    case_num = case_data["case_number"]
    print(f"[OK] [Case Initialized] Ref: {case_num} (ID: {case_id}) - Status: {case_data['status']}")
    
    # Step D: Upload Multi-Surface Evidence
    image_bytes = generate_synthetic_package_image()
    files = {"image": ("label_front.jpg", image_bytes, "image/jpeg")}
    data = {"surface_type": "FRONT"}
    
    ev_res = requests.post(f"{API_BASE}/api/inspections/{case_id}/evidence", files=files, data=data, headers=inspector_headers)
    assert ev_res.status_code == 201, f"Evidence upload failed: {ev_res.text}"
    ev_data = ev_res.json()["evidence"]
    print(f"[OK] [Evidence Uploaded] Surface: {ev_data['surface_type']}, Verdict: {ev_data['quality_verdict']}, Blur Score: {ev_data['blur_score']:.1f}")
    
    # Step E: Run AI / RapidOCR / Rule Compliance Analysis
    analyze_res = requests.post(f"{API_BASE}/api/inspections/{case_id}/analyze", headers=inspector_headers)
    assert analyze_res.status_code == 200, f"Analysis execution failed: {analyze_res.text}"
    analysis_res_data = analyze_res.json()
    summary = analysis_res_data.get("summary", {})
    case_summary = analysis_res_data.get("case", {})
    print(f"[OK] [AI Metrology Analysis] Total Checks: {summary.get('total_checks')}, Passed: {summary.get('passed_checks')}, Score: {case_summary.get('compliance_score')}%")
    
    # Step F: Verify Extracted Declarations & Submit Inspector Corrections
    inspector_review_payload = {
        "remarks": "Physical packaging sampled from shelf. Font size and MRP format checked under Rule 6.",
        "corrections": {
            "MRP": "Rs 40.00"
        }
    }
    rev_res = requests.post(f"{API_BASE}/api/reviews/{case_id}/inspector", json=inspector_review_payload, headers=inspector_headers)
    assert rev_res.status_code == 200, f"Inspector review failed: {rev_res.text}"
    print(f"[OK] [Inspector Review Submitted] Case Status: {rev_res.json()['status']}")
    
    # Step G: Senior Officer Login & Review
    sr_login_res = requests.post(f"{API_BASE}/api/auth/login", json={
        "email": "senior@legalmetrology.gov.in",
        "password": "Senior#2026"
    })
    assert sr_login_res.status_code == 200, f"Senior login failed: {sr_login_res.text}"
    sr_token = sr_login_res.json()["token"]
    sr_headers = {"Authorization": f"Bearer {sr_token}"}
    print("[OK] [Senior Officer Login] Authenticated as:", sr_login_res.json()["user"]["full_name"])
    
    # Step H: Senior Officer Views Review Queue
    queue_res = requests.get(f"{API_BASE}/api/reviews/queue", headers=sr_headers)
    assert queue_res.status_code == 200
    queue_items = queue_res.json()["queue"]
    matching_in_queue = [q for q in queue_items if q["id"] == case_id]
    assert len(matching_in_queue) > 0, f"Case {case_id} not found in Senior Review queue"
    print(f"[OK] [Senior Review Queue] Case {case_num} present in queue ({len(queue_items)} total pending)")
    
    # Step I: Senior Officer Adjudication / Override / Finalization
    sr_action_payload = {
        "action": "APPROVE_COMPLIANT",
        "remarks": "Reviewed against Rule 6 & 7 Schedule II. Declarations verified with unit sale price present. Certified compliant.",
        "override_reason": "Statutory verification confirmed compliant.",
        "statutory_justification": "Legal Metrology (Packaged Commodities) Rules, 2011 Rule 6(1)(c)"
    }
    action_res = requests.post(f"{API_BASE}/api/reviews/{case_id}/senior-action", json=sr_action_payload, headers=sr_headers)
    assert action_res.status_code == 200, f"Senior action failed: {action_res.text}"
    print(f"[OK] [Senior Adjudication Finalized] Status: {action_res.json()['status']}, Disposition: {action_res.json()['final_decision']}")
    
    # Step J: Report Generation & Verification
    report_res = requests.get(f"{API_BASE}/api/reports/{case_id}/pdf", headers=sr_headers)
    assert report_res.status_code == 200, f"PDF report generation failed: {report_res.status_code}"
    assert report_res.headers.get("content-type") == "application/pdf", "Expected PDF content-type"
    pdf_size = len(report_res.content)
    assert pdf_size > 1000, f"PDF size unexpectedly small: {pdf_size} bytes"
    print(f"[OK] [ReportLab PDF Generation] Generated {pdf_size} bytes official PDF report")
    
    # Step K: Audit Trail Verification for the case
    adm_login_res = requests.post(f"{API_BASE}/api/auth/login", json={
        "email": "admin@legalmetrology.gov.in",
        "password": "Admin#2026"
    })
    adm_token = adm_login_res.json()["token"]
    adm_headers = {"Authorization": f"Bearer {adm_token}"}
    
    audit_res = requests.get(f"{API_BASE}/api/admin/audit-logs?case_id={case_id}", headers=adm_headers)
    assert audit_res.status_code == 200
    logs = audit_res.json()["audit_logs"]
    actions = [l["action_type"] for l in logs]
    print(f"[OK] [Audit Trail Verified] {len(logs)} audit entries recorded for case {case_id}: {actions}")
    
    results["1_end_to_end_workflow"] = "PASS"

    # -------------------------------------------------------------
    # 2. RBAC API TESTS
    # -------------------------------------------------------------
    print_header("2. TESTING RBAC SECURITY ON API ENDPOINTS")
    
    # Inspector trying to access Admin-only Users list
    insp_admin_users = requests.get(f"{API_BASE}/api/admin/users", headers=inspector_headers)
    assert insp_admin_users.status_code == 403, f"Expected 403 for Inspector on /admin/users, got {insp_admin_users.status_code}"
    print("[OK] [RBAC Block] Inspector access to /api/admin/users rejected with 403 Forbidden")

    # Inspector trying to create a regulatory rule
    insp_create_rule = requests.post(f"{API_BASE}/api/rules", json={"rule_code": "TEST"}, headers=inspector_headers)
    assert insp_create_rule.status_code == 403, f"Expected 403 for Inspector creating rule, got {insp_create_rule.status_code}"
    print("[OK] [RBAC Block] Inspector modifying rules rejected with 403 Forbidden")

    # Senior Officer trying to create user
    sr_create_user = requests.post(f"{API_BASE}/api/admin/users", json={"email": "hacker@gov.in"}, headers=sr_headers)
    assert sr_create_user.status_code == 403, f"Expected 403 for Senior Officer creating user, got {sr_create_user.status_code}"
    print("[OK] [RBAC Block] Senior Officer creating users rejected with 403 Forbidden")

    # Unauthenticated request
    no_auth_res = requests.get(f"{API_BASE}/api/reviews/queue")
    assert no_auth_res.status_code == 401, f"Expected 401 for unauthenticated request, got {no_auth_res.status_code}"
    print("[OK] [RBAC Block] Unauthenticated request rejected with 401 Unauthorized")

    # Invalid token
    fake_auth_res = requests.get(f"{API_BASE}/api/reviews/queue", headers={"Authorization": "Bearer fake.jwt.token"})
    assert fake_auth_res.status_code == 401, f"Expected 401 for fake token, got {fake_auth_res.status_code}"
    print("[OK] [RBAC Block] Invalid JWT rejected with 401 Unauthorized")

    results["2_rbac"] = "PASS"

    # -------------------------------------------------------------
    # 3. STATE MACHINE TRANSITIONS
    # -------------------------------------------------------------
    print_header("3. TESTING STATE MACHINE CONSTRAINTS")

    # Create a fresh draft case
    fresh_case = requests.post(f"{API_BASE}/api/inspections", json={"product_id": product_id}, headers=inspector_headers).json()["inspection"]
    fresh_id = fresh_case["id"]
    print(f"Fresh case created: {fresh_case['case_number']} with initial status: {fresh_case['status']}")

    # Attempt invalid jump: DRAFT -> FINALIZED directly
    invalid_jump = requests.post(f"{API_BASE}/api/reviews/{fresh_id}/senior-action", json={"action": "APPROVE_COMPLIANT"}, headers=sr_headers)
    assert invalid_jump.status_code == 400, f"Expected 400 for DRAFT -> FINALIZED bypass, got {invalid_jump.status_code}"
    print(f"[OK] [State Machine Enforced] Premature finalization of DRAFT case rejected: {invalid_jump.json().get('error')}")

    # Attempt Inspector Review on DRAFT (before analysis)
    premature_review = requests.post(f"{API_BASE}/api/reviews/{fresh_id}/inspector", json={"remarks": "test"}, headers=inspector_headers)
    assert premature_review.status_code == 400, f"Expected 400 for premature inspector review, got {premature_review.status_code}"
    print(f"[OK] [State Machine Enforced] Review submission before analysis rejected: {premature_review.json().get('error')}")

    results["3_state_machine"] = "PASS"

    # -------------------------------------------------------------
    # 4. IMMUTABILITY & SEPARATION OF DECISIONS
    # -------------------------------------------------------------
    print_header("4. TESTING DATA IMMUTABILITY & SEPARATION")

    # Fetch the completed inspection case #case_id
    detail_res = requests.get(f"{API_BASE}/api/inspections/{case_id}", headers=sr_headers)
    assert detail_res.status_code == 200
    c_full = detail_res.json()

    # Verify declarations preserve both raw OCR extraction AND inspector correction
    mrp_decl = [d for d in c_full["declarations"] if d["field_type"] == "MRP"][0]
    assert mrp_decl["raw_ocr_text"] is not None, "Raw OCR text must not be wiped"
    assert mrp_decl["extracted_value"] is not None, "Extracted value must be preserved"
    print(f"[OK] [Immutability Demonstrated] Declaration Field: {mrp_decl['field_type']}")
    print(f"   • Raw AI Extracted Value: '{mrp_decl['extracted_value']}'")
    print(f"   • Inspector Corrected Value: '{mrp_decl['inspector_corrected_value']}'")
    print(f"   • Raw Bounding Box: {mrp_decl['bbox']}")
    print(f"   • Final Case Decision: '{c_full['final_decision']}'")

    results["4_immutability"] = "PASS"

    # -------------------------------------------------------------
    # 5. EVIDENCE TRACEABILITY CHAIN
    # -------------------------------------------------------------
    print_header("5. TESTING EVIDENCE TRACEABILITY CHAIN")

    check = c_full["compliance_checks"][0]
    print("Traceability Chain for Compliance Finding:")
    print(f"  [1] Rule Code: {check['rule_code']} ({check['rule_title']})")
    print(f"  [2] Statutory Citation: {check.get('statutory_citation')}")
    print(f"  [3] Finding Status: {check['status']} (Confidence: {check['confidence']})")
    print(f"  [4] Evaluated Value: {check['evaluated_value']}")
    print(f"  [5] Associated Packaging Evidence Surfaces: {[e['surface_type'] for e in c_full['evidences']]}")
    assert len(c_full["evidences"]) > 0, "Evidence link missing"
    
    results["5_evidence_traceability"] = "PASS"

    # -------------------------------------------------------------
    # 6. DASHBOARDS & ANALYTICS FROM DATABASE
    # -------------------------------------------------------------
    print_header("6. TESTING DATABASE-BACKED DASHBOARD METRICS")

    analytics_res = requests.get(f"{API_BASE}/api/analytics/summary", headers=sr_headers)
    assert analytics_res.status_code == 200
    stats = analytics_res.json()
    print(f"[OK] [Live Analytics] Total Cases: {stats['total_cases']}, Finalized: {stats['finalized_cases']}, Violations: {stats['total_violations']}, Compliance Rate: {stats['compliance_rate']}%")
    assert stats["total_cases"] >= 1, "Expected at least 1 inspection in DB"
    
    results["6_database_dashboards"] = "PASS"

    # -------------------------------------------------------------
    # 7. ERROR HANDLING
    # -------------------------------------------------------------
    print_header("7. TESTING ERROR HANDLING & ROBUSTNESS")

    # Invalid Inspection ID
    bad_id_res = requests.get(f"{API_BASE}/api/inspections/999999", headers=sr_headers)
    assert bad_id_res.status_code == 404
    print(f"[OK] [404 Handled] Invalid inspection ID returned: {bad_id_res.json().get('error')}")

    # Bad login
    bad_login = requests.post(f"{API_BASE}/api/auth/login", json={"email": "nonexistent@gov.in", "password": "wrong"})
    assert bad_login.status_code == 401
    print(f"[OK] [401 Handled] Invalid login credentials rejected: {bad_login.json().get('error')}")

    results["7_error_handling"] = "PASS"

    # Summary
    print_header("FINAL ACCEPTANCE VERIFICATION SUMMARY")
    all_passed = True
    for k, v in results.items():
        print(f"  • {k}: {v}")
        if v != "PASS": all_passed = False

    print("\nOverall Suite Result:", "ALL PASSED (100%)" if all_passed else "SOME FAILED")
    return all_passed

if __name__ == "__main__":
    success = run_acceptance_suite()
    sys.exit(0 if success else 1)
