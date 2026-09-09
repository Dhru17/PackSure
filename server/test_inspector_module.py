import os
import sys
import io
import json
import requests

BASE_URL = "http://127.0.0.1:5055/api"

def run_tests():
    print("==================================================")
    print("PACKSURE PART 3 — INSPECTOR MODULE E2E TEST SUITE")
    print("==================================================")

    session = requests.Session()

    # 1. Login as Admin to seed defaults and create test users
    print("\n[1] Seeding defaults & setting up test accounts...")
    res = session.post(f"{BASE_URL}/auth/seed-defaults")

    # Login as Inspector 1 (default inspector)
    res = session.post(f"{BASE_URL}/auth/login", json={"email": "inspector@legalmetrology.gov.in", "password": "Inspector#2026"})
    assert res.status_code == 200, f"Inspector login failed: {res.text}"
    insp1_token = res.json()["token"]
    insp1_user = res.json()["user"]
    print(f"[PASS] Logged in as Inspector 1: {insp1_user['email']} (ID: {insp1_user['id']})")

    # Login as Senior Officer
    res = session.post(f"{BASE_URL}/auth/login", json={"email": "senior@legalmetrology.gov.in", "password": "Senior#2026"})
    assert res.status_code == 200, f"Senior Officer login failed: {res.text}"
    senior_token = res.json()["token"]
    print("[PASS] Logged in as Senior Officer")

    # Login as Admin to create Inspector 2 (Unassigned Inspector)
    res = session.post(f"{BASE_URL}/auth/login", json={"email": "admin@legalmetrology.gov.in", "password": "Admin#2026"})
    assert res.status_code == 200
    admin_token = res.json()["token"]

    # Create/Get Inspector 2
    session.post(f"{BASE_URL}/admin/users", headers={"Authorization": f"Bearer {admin_token}"}, json={
        "email": "inspector2@legalmetrology.gov.in",
        "password": "Inspector2#2026",
        "full_name": "Inspector Priya Sharma",
        "role": "INSPECTOR",
        "badge_number": "LM-DEL-999"
    })
    res = session.post(f"{BASE_URL}/auth/login", json={"email": "inspector2@legalmetrology.gov.in", "password": "Inspector2#2026"})
    assert res.status_code == 200, f"Inspector 2 login failed: {res.text}"
    insp2_token = res.json()["token"]
    insp2_user = res.json()["user"]
    print(f"[PASS] Logged in as Inspector 2 (Unassigned): {insp2_user['email']} (ID: {insp2_user['id']})")

    # 2. Inspector 1 creates a new product and inspection case
    print("\n[2] Creating Product & Inspection Case assigned to Inspector 1...")
    insp1_headers = {"Authorization": f"Bearer {insp1_token}"}
    insp2_headers = {"Authorization": f"Bearer {insp2_token}"}
    senior_headers = {"Authorization": f"Bearer {senior_token}"}

    res = session.post(f"{BASE_URL}/products", headers=insp1_headers, json={
        "barcode": f"TEST-INSP-{os.urandom(4).hex()}",
        "brand_name": "Haldiram's",
        "commodity_name": "Bhujia Sev 400g",
        "category_name": "Namkeen & Snacks",
        "package_type": "POUCH",
        "default_net_quantity": "400 g",
        "default_mrp": 90.0,
        "is_imported": False,
        "country_of_origin": "India",
        "pdp_width_cm": 18.0,
        "pdp_height_cm": 12.0,
        "pdp_area_cm2": 216.0,
        "manufacturer_name": "Haldiram Snacks Pvt Ltd"
    })
    assert res.status_code == 201, f"Product create failed: {res.text}"
    product = res.json()["product"]

    res = session.post(f"{BASE_URL}/inspections", headers=insp1_headers, json={
        "product_id": product["id"],
        "location_name": "Central Retail Hub, Delhi",
        "source_type": "FIELD_SAMPLE"
    })
    assert res.status_code == 201, f"Case create failed: {res.text}"
    case = res.json()["inspection"]
    case_id = case["id"]
    print(f"[PASS] Created Case #{case['case_number']} (ID: {case_id}) assigned to Inspector 1 (ID: {case['inspector_id']})")

    # 3. Test RBAC: Inspector 2 cannot view/mutate Inspector 1's case
    print("\n[3] Testing Strict Inspector Case Ownership & Security (RBAC)...")
    res = session.get(f"{BASE_URL}/inspections/{case_id}", headers=insp2_headers)
    assert res.status_code == 403, f"Expected 403 for unassigned inspector, got {res.status_code}: {res.text}"
    print("[PASS] Unassigned Inspector 2 access rejected with HTTP 403 Forbidden")

    # Assigned Inspector 1 can access
    res = session.get(f"{BASE_URL}/inspections/{case_id}", headers=insp1_headers)
    assert res.status_code == 200, f"Expected 200 for assigned inspector, got {res.status_code}"
    print("[PASS] Assigned Inspector 1 access granted with HTTP 200 OK")

    # 4. Test Calibrated Physical Measurements Saving
    print("\n[4] Testing Physical Measurements Recording (Rule 7 & 8)...")
    res = session.post(f"{BASE_URL}/inspections/{case_id}/measurements", headers=insp1_headers, json={
        "actual_net_quantity": "402.5 g",
        "actual_pdp_width_cm": 18.0,
        "actual_pdp_height_cm": 12.0,
        "actual_font_height_mm": 4.5,
        "measurement_method": "Standard Vernier Caliper & Calibrated Scale",
        "calibrated_scale_used": True
    })
    assert res.status_code == 200, f"Measurements save failed: {res.text}"
    saved_case = res.json()["case"]
    assert saved_case["actual_net_quantity"] == "402.5 g"
    assert saved_case["actual_font_height_mm"] == 4.5
    assert saved_case["calibrated_scale_used"] is True
    print("[PASS] Calibrated Physical Measurements saved and verified in DB")

    # 5. Test Company Statutory Document Verification
    print("\n[5] Testing Company Statutory Document Verification...")
    res = session.get(f"{BASE_URL}/inspections/{case_id}/documents", headers=insp1_headers)
    assert res.status_code == 200, f"Failed to get documents: {res.text}"
    docs = res.json()["documents"]
    print(f"[PASS] Retrieved {len(docs)} statutory document(s) for case company")
    
    if len(docs) > 0:
        doc_id = docs[0]["id"]
        # Test reject without reason -> should fail 400
        res = session.post(f"{BASE_URL}/inspections/{case_id}/documents/{doc_id}/verify", headers=insp1_headers, json={
            "status": "REJECTED"
        })
        assert res.status_code == 400, "Rejection without reason should be blocked with 400"
        print("[PASS] Rejection without mandatory reason blocked with HTTP 400")

        # Test approve document
        res = session.post(f"{BASE_URL}/inspections/{case_id}/documents/{doc_id}/verify", headers=insp1_headers, json={
            "status": "VERIFIED",
            "notes": "Verified against National Metrology & FSSAI Register"
        })
        assert res.status_code == 200, f"Document verification failed: {res.text}"
        print(f"[PASS] Document #{doc_id} verified successfully")

    # 6. Test Evidence Upload & Mandatory Front/Back Submission Gate
    print("\n[6] Testing Evidence Upload & Mandatory Front/Back Panel Enforcement...")
    # Upload only FRONT image first
    dummy_img = io.BytesIO(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82")
    files = {"image": ("front_panel.png", dummy_img, "image/png")}
    data = {"surface_type": "FRONT"}
    res = session.post(f"{BASE_URL}/inspections/{case_id}/evidence", headers=insp1_headers, files=files, data=data)
    assert res.status_code == 201, f"Front evidence upload failed: {res.text}"
    print("[PASS] Uploaded FRONT panel image (OpenCV diagnostics computed)")

    # Run AI Analysis
    res = session.post(f"{BASE_URL}/inspections/{case_id}/analyze", headers=insp1_headers)
    assert res.status_code == 200, f"Analysis failed: {res.text}"
    print("[PASS] RapidOCR & Regulatory Rule Engine evaluation executed")

    # Attempt to submit without BACK panel -> should fail 400
    res = session.post(f"{BASE_URL}/reviews/{case_id}/inspector", headers=insp1_headers, json={
        "remarks": "Incomplete submission test",
        "signed_by_name": "Inspector Ramesh Kumar"
    })
    assert res.status_code == 400, f"Expected 400 for missing BACK panel, got {res.status_code}: {res.text}"
    assert "Back Face" in res.json().get("error", "") or "Back" in res.json().get("error", "")
    print("[PASS] Submission without mandatory BACK panel blocked with HTTP 400 Bad Request")

    # Now upload BACK panel image
    dummy_img2 = io.BytesIO(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82")
    files2 = {"image": ("back_panel.png", dummy_img2, "image/png")}
    data2 = {"surface_type": "BACK"}
    res = session.post(f"{BASE_URL}/inspections/{case_id}/evidence", headers=insp1_headers, files=files2, data=data2)
    assert res.status_code == 201, f"Back evidence upload failed: {res.text}"
    print("[PASS] Uploaded BACK panel image")

    # 7. Test Inspector Digital Signature & Submission
    print("\n[7] Testing Inspector Submission & Digital Signature Attestation...")
    res = session.post(f"{BASE_URL}/reviews/{case_id}/inspector", headers=insp1_headers, json={
        "remarks": "Sample verified in field. All mandatory declarations confirmed against Schedule 2.",
        "corrections": {"NET_QUANTITY": "Verified 402.5 g"},
        "signed_by_name": "Inspector Ramesh Kumar"
    })
    assert res.status_code == 200, f"Inspector submit failed: {res.text}"
    submitted_case = res.json()["case"]
    assert submitted_case["status"] == "SUBMITTED"
    assert submitted_case["signed_by_name"] == "Inspector Ramesh Kumar"
    assert submitted_case["digital_signature_hash"] is not None
    print(f"[PASS] Case submitted with Digital Signature Hash: {submitted_case['digital_signature_hash']}")

    # 8. Test Mutation Lock on Submitted Case
    print("\n[8] Testing Mutation Lock on SUBMITTED Case...")
    res = session.post(f"{BASE_URL}/inspections/{case_id}/measurements", headers=insp1_headers, json={
        "actual_net_quantity": "500 g"
    })
    assert res.status_code == 400 or res.status_code == 403, f"Mutation on submitted case should be blocked: {res.status_code}"
    print("[PASS] Mutation on SUBMITTED case blocked to protect audit integrity")

    # 9. Test Senior Officer Return & Resubmission Cycle Tracking
    print("\n[9] Testing Return for Correction & Resubmission Cycle Tracking...")
    res = session.post(f"{BASE_URL}/reviews/{case_id}/return", headers=senior_headers, json={
        "reason": "Please re-check the MRP font height and provide explicit optical micrometer measurement."
    })
    assert res.status_code == 200, f"Senior return failed: {res.text}"
    returned_case = res.json()["case"]
    assert returned_case["status"] == "RETURNED"
    assert returned_case["review_cycle"] == 2
    print(f"[PASS] Case returned to Inspector (Review Cycle: {returned_case['review_cycle']})")

    # Inspector can now edit measurements and resubmit
    res = session.post(f"{BASE_URL}/inspections/{case_id}/measurements", headers=insp1_headers, json={
        "actual_font_height_mm": 4.8,
        "measurement_method": "Optical Micrometer & Analytical Balance"
    })
    assert res.status_code == 200, f"Measurement edit failed: {res.text}"

    # Inspector resubmits
    res = session.post(f"{BASE_URL}/reviews/{case_id}/inspector", headers=insp1_headers, json={
        "remarks": "Updated font height measurement using Optical Micrometer (4.8 mm verified).",
        "signed_by_name": "Inspector Ramesh Kumar"
    })
    assert res.status_code == 200, f"Resubmission failed: {res.text}"
    resubmitted_case = res.json()["case"]
    assert resubmitted_case["status"] == "SUBMITTED"
    assert resubmitted_case["review_cycle"] == 2
    print("[PASS] Resubmission successful, Case back in SUBMITTED state with Cycle 2")

    # 10. Senior Finalizes Case & Verify Precedent Archive
    print("\n[10] Finalizing Case & Testing Final Immutability...")
    res = session.post(f"{BASE_URL}/reviews/{case_id}/finalize", headers=senior_headers, json={
        "action": "APPROVE_COMPLIANT",
        "statutory_justification": "All requirements verified compliant under Rule 6, 7 & 8."
    })
    assert res.status_code == 200, f"Finalize failed: {res.text}"
    final_case = res.json()["case"]
    assert final_case["status"] == "FINALIZED"
    assert final_case["final_decision"] == "COMPLIANT"
    print("[PASS] Case finalized as COMPLIANT by Senior Officer")

    # Test PDF report generation
    res = session.get(f"{BASE_URL}/reports/{case_id}/pdf", headers=insp1_headers)
    assert res.status_code == 200, f"PDF report generation failed: {res.status_code}"
    print(f"[PASS] Legal Metrology Inspection PDF Report generated ({len(res.content)} bytes)")

    print("\n==================================================")
    print("[PASS] ALL PART 3 INSPECTOR MODULE TESTS PASSED (100%)")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
