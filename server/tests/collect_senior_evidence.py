import requests
import json
import time

BASE_URL = "http://127.0.0.1:5055"

def run_evidence_collection():
    print("======================================================================")
    print("SENIOR OFFICER EXPLICIT AUDIT EVIDENCE COLLECTION (3 SCENARIOS)")
    print("======================================================================")

    # Auth Tokens
    sr_login = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "senior@legalmetrology.gov.in", "password": "Senior#2026"})
    assert sr_login.status_code == 200
    sr_token = sr_login.json()["token"]
    sr_headers = {"Authorization": f"Bearer {sr_token}", "Content-Type": "application/json"}

    insp_login = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "inspector@legalmetrology.gov.in", "password": "Inspector#2026"})
    assert insp_login.status_code == 200
    insp_token = insp_login.json()["token"]
    insp_headers = {"Authorization": f"Bearer {insp_token}", "Content-Type": "application/json"}

    # -------------------------------------------------------------------------
    # SCENARIO A: COMPLIANT CASE ADJUDICATION (Clean Package -> Approve Compliant)
    # -------------------------------------------------------------------------
    print("\n----------------------------------------------------------------------")
    print("SCENARIO A: COMPLIANT CASE (Field Submission -> Senior Approve Compliant)")
    print("----------------------------------------------------------------------")
    # Step 1: Create Case
    c_a_res = requests.post(f"{BASE_URL}/api/inspections", headers=insp_headers, json={
        "brand_name": "Tata Salt",
        "commodity_name": "Vacuum Evaporated Iodized Salt",
        "package_type": "Pouch",
        "default_net_quantity": "1 kg",
        "default_mrp": 28.0,
        "pdp_width_cm": 15.0,
        "pdp_height_cm": 20.0
    })
    case_a_id = c_a_res.json()["inspection"]["id"]
    case_a_num = c_a_res.json()["inspection"]["case_number"]
    print(f"[A1] Case Initialized: ID={case_a_id}, Ref={case_a_num}, Status=DRAFT")

    # Step 2: Upload Evidence
    dummy_img = b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xFF\xDB\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342\xFF\xC0\x00\x0b\x08\x00\x10\x00\x10\x01\x01\x11\x00\xFF\xDA\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\xFF\xD9"
    up_a = requests.post(f"{BASE_URL}/api/inspections/{case_a_id}/evidence", headers={"Authorization": f"Bearer {insp_token}"}, files={"image": ("tata_salt_front.jpg", dummy_img, "image/jpeg")}, data={"surface_type": "FRONT"})
    assert up_a.status_code == 201

    # Step 3: Run Analysis & Submit Inspector Review
    an_a = requests.post(f"{BASE_URL}/api/inspections/{case_a_id}/analyze", headers=insp_headers)
    assert an_a.status_code == 200
    sub_a = requests.post(f"{BASE_URL}/api/reviews/{case_a_id}/inspector", headers=insp_headers, json={
        "remarks": "All mandatory declarations present with verified font sizes.",
        "corrections": {}
    })
    assert sub_a.status_code == 200
    print(f"[A2] Inspector Review Submitted -> Case #{case_a_id} Status: {sub_a.json()['status']}")

    # Step 4: Verify Case in Senior Review Queue
    queue_res = requests.get(f"{BASE_URL}/api/reviews/queue", headers=sr_headers)
    assert queue_res.status_code == 200
    q_matches = [c for c in queue_res.json()["queue"] if c["id"] == case_a_id]
    assert len(q_matches) == 1, "Case A not found in review queue"
    print(f"[A3] Senior Queue Discovery Verified: Case #{case_a_id} present in queue.")

    # Step 5: Senior Adjudication (Issue Clean Order / Approve Compliant)
    adj_a = requests.post(f"{BASE_URL}/api/reviews/{case_a_id}/senior-action", headers=sr_headers, json={
        "action": "APPROVE_COMPLIANT",
        "remarks": "Reviewed label scans and Schedule II height compliance. Package compliant."
    })
    assert adj_a.status_code == 200
    print(f"[A4] Senior Adjudication Executed: Status={adj_a.json()['status']}, Disposition={adj_a.json()['final_decision']}")

    # Step 6: Verify Database Record
    case_a_db = requests.get(f"{BASE_URL}/api/inspections/{case_a_id}", headers=sr_headers).json()
    assert case_a_db["status"] == "FINALIZED"
    assert case_a_db["final_decision"] == "COMPLIANT"
    assert case_a_db["senior_reviewer_name"] == "Assistant Controller Priya Verma"
    assert len(case_a_db["senior_reviews"]) == 1
    print(f"[A5] Database Verification: Status={case_a_db['status']}, Reviewer={case_a_db['senior_reviewer_name']}, Finalized At={case_a_db['finalized_at']}")

    # Step 7: Verify Audit Log
    audit_a = requests.get(f"{BASE_URL}/api/admin/audit-logs?case_id={case_a_id}", headers={"Authorization": f"Bearer {sr_token}"}).json()
    audit_events_a = [l["action_type"] for l in audit_a.get("audit_logs", [])]
    print(f"[A6] Audit Trail Events: {audit_events_a}")
    assert "CASE_FINALIZED" in audit_events_a

    # -------------------------------------------------------------------------
    # SCENARIO B: NON-COMPLIANT CASE (Violations Flagged -> Issue Sec 36 Notice)
    # -------------------------------------------------------------------------
    print("\n----------------------------------------------------------------------")
    print("SCENARIO B: NON-COMPLIANT CASE (Violations -> Issue Section 36 Notice)")
    print("----------------------------------------------------------------------")
    c_b_res = requests.post(f"{BASE_URL}/api/inspections", headers=insp_headers, json={
        "brand_name": "Generic Spices Co",
        "commodity_name": "Garam Masala 100g",
        "package_type": "Box",
        "pdp_width_cm": 8.0,
        "pdp_height_cm": 12.0
    })
    case_b_id = c_b_res.json()["inspection"]["id"]
    requests.post(f"{BASE_URL}/api/inspections/{case_b_id}/evidence", headers={"Authorization": f"Bearer {insp_token}"}, files={"image": ("spices_front.jpg", dummy_img, "image/jpeg")}, data={"surface_type": "FRONT"})
    requests.post(f"{BASE_URL}/api/inspections/{case_b_id}/analyze", headers=insp_headers)
    requests.post(f"{BASE_URL}/api/reviews/{case_b_id}/inspector", headers=insp_headers, json={
        "remarks": "Missing consumer care details and date of manufacture.",
        "corrections": {}
    })
    print(f"[B1] Case #{case_b_id} Submitted with Violations.")

    # Senior Officer Adjudicates Non-Compliance
    adj_b = requests.post(f"{BASE_URL}/api/reviews/{case_b_id}/senior-action", headers=sr_headers, json={
        "action": "APPROVE_VIOLATIONS",
        "statutory_justification": "Section 36(1) of Legal Metrology Act, 2009",
        "remarks": "Issue compoundable statutory notice under Section 36."
    })
    assert adj_b.status_code == 200
    print(f"[B2] Senior Action Executed: Status={adj_b.json()['status']}, Disposition={adj_b.json()['final_decision']}")

    case_b_db = requests.get(f"{BASE_URL}/api/inspections/{case_b_id}", headers=sr_headers).json()
    assert case_b_db["status"] == "FINALIZED"
    assert case_b_db["final_decision"] == "NON_COMPLIANT"
    print(f"[B3] Database Verification: Status={case_b_db['status']}, Disposition={case_b_db['final_decision']}")

    # -------------------------------------------------------------------------
    # SCENARIO C: HUMAN-IN-THE-LOOP OVERRIDE & REMAND (Return for Reinspection)
    # -------------------------------------------------------------------------
    print("\n----------------------------------------------------------------------")
    print("SCENARIO C: HUMAN-IN-THE-LOOP OVERRIDE & REMAND FOR REINSPECTION")
    print("----------------------------------------------------------------------")
    c_c_res = requests.post(f"{BASE_URL}/api/inspections", headers=insp_headers, json={
        "brand_name": "Himalayan Herbs Ltd",
        "commodity_name": "Herbal Green Tea 50g",
        "pdp_width_cm": 10.0,
        "pdp_height_cm": 15.0
    })
    case_c_id = c_c_res.json()["inspection"]["id"]
    requests.post(f"{BASE_URL}/api/inspections/{case_c_id}/evidence", headers={"Authorization": f"Bearer {insp_token}"}, files={"image": ("green_tea.jpg", dummy_img, "image/jpeg")}, data={"surface_type": "FRONT"})
    requests.post(f"{BASE_URL}/api/inspections/{case_c_id}/analyze", headers=insp_headers)
    
    # Inspector makes correction
    requests.post(f"{BASE_URL}/api/reviews/{case_c_id}/inspector", headers=insp_headers, json={
        "remarks": "Corrected net quantity declaration from field reading.",
        "corrections": {"NET_QUANTITY": "50 g"}
    })
    print(f"[C1] Case #{case_c_id} Submitted with Inspector Correction: NET_QUANTITY = '50 g'")

    # Senior Officer Remands back for Reinspection
    adj_c = requests.post(f"{BASE_URL}/api/reviews/{case_c_id}/senior-action", headers=sr_headers, json={
        "action": "RETURN_FOR_REINSPECTION",
        "override_reason": "Back panel photo is missing barcode and MRP label.",
        "statutory_justification": "Rule 6(1)(d) multi-panel verification required.",
        "remarks": "Inspector must capture top and bottom flap evidence."
    })
    assert adj_c.status_code == 200
    print(f"[C2] Senior Remand Executed: Status={adj_c.json()['status']}, Disposition={adj_c.json()['final_decision']}")

    # Verify Database State Transition to RETURNED
    case_c_db = requests.get(f"{BASE_URL}/api/inspections/{case_c_id}", headers=sr_headers).json()
    assert case_c_db["status"] == "RETURNED"
    assert case_c_db["final_decision"] == "REQUIRES_FURTHER_INSPECTION"
    print(f"[C3] Database Verification: Status={case_c_db['status']}, Disposition={case_c_db['final_decision']}")

    # Verify Audit Record for Remand
    audit_c = requests.get(f"{BASE_URL}/api/admin/audit-logs?case_id={case_c_id}", headers={"Authorization": f"Bearer {sr_token}"}).json()
    audit_events_c = [l["action_type"] for l in audit_c.get("audit_logs", [])]
    assert "SENIOR_OVERRIDE" in audit_events_c
    print(f"[C4] Audit Record Verified: {audit_events_c}")

    # -------------------------------------------------------------------------
    # PDF REPORT INSPECTION PROOF
    # -------------------------------------------------------------------------
    print("\n----------------------------------------------------------------------")
    print("STATUTORY REPORT PDF VERIFICATION")
    print("----------------------------------------------------------------------")
    pdf_res = requests.get(f"{BASE_URL}/api/reports/{case_a_id}/pdf")
    assert pdf_res.status_code == 200
    assert pdf_res.headers.get("Content-Type") == "application/pdf"
    assert len(pdf_res.content) > 1000
    print(f"[PDF] Report for Case #{case_a_id} generated: {len(pdf_res.content)} bytes, Content-Type: application/pdf")

    print("\n======================================================================")
    print("ALL 3 SENIOR OFFICER LIVE EVIDENCE SCENARIOS EXECUTED WITH 100% SUCCESS")
    print("======================================================================")

if __name__ == "__main__":
    run_evidence_collection()
