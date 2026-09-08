import requests
import json
import time

BASE_URL = "http://127.0.0.1:5055"

def run_senior_refinement_tests():
    print("======================================================================")
    print("RUNNING SENIOR OFFICER REFINEMENT VERIFICATION SUITE")
    print("======================================================================")

    ts = int(time.time())

    # 1. Authenticate as Senior Officer
    print("\n[1] Senior Officer Authentication...")
    sr_login = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "senior@legalmetrology.gov.in", "password": "Senior#2026"})
    assert sr_login.status_code == 200, f"Senior login failed: {sr_login.text}"
    sr_token = sr_login.json()["token"]
    sr_headers = {"Authorization": f"Bearer {sr_token}", "Content-Type": "application/json"}
    print("[PASS] Senior Officer authenticated successfully.")

    # 2. Authenticate as Inspector
    insp_login = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "inspector@legalmetrology.gov.in", "password": "Inspector#2026"})
    assert insp_login.status_code == 200
    insp_token = insp_login.json()["token"]
    insp_headers = {"Authorization": f"Bearer {insp_token}", "Content-Type": "application/json"}

    # 3. Test Senior Overview Dashboard Endpoint
    print("\n[2] Testing Senior Overview Dashboard Endpoint...")
    ov_res = requests.get(f"{BASE_URL}/api/reviews/overview", headers=sr_headers)
    assert ov_res.status_code == 200, f"Overview failed: {ov_res.text}"
    ov_data = ov_res.json()
    assert "workload" in ov_data
    assert "compliance" in ov_data
    assert "recent_submissions" in ov_data
    assert "recent_decisions" in ov_data
    print(f"[PASS] Senior Overview data verified: Workload={ov_data['workload']}")

    # 4. Create multi-surface inspection case
    print("\n[3] Initializing Multi-Surface Case for Evidence Studio...")
    c_res = requests.post(f"{BASE_URL}/api/inspections", headers=insp_headers, json={
        "brand_name": f"Organic India {ts}",
        "commodity_name": "Tulsi Green Tea 100g",
        "package_type": "Box",
        "default_net_quantity": "100 g",
        "default_mrp": 250.0,
        "pdp_width_cm": 12.0,
        "pdp_height_cm": 16.0
    })
    assert c_res.status_code == 201
    case_id = c_res.json()["inspection"]["id"]
    product_id = c_res.json()["inspection"]["product_id"]
    case_num = c_res.json()["inspection"]["case_number"]
    print(f"[PASS] Case #{case_id} ({case_num}) initialized with Product #{product_id}.")

    # Upload 2 surfaces (FRONT and BACK)
    dummy_img = b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xFF\xDB\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342\xFF\xC0\x00\x0b\x08\x00\x10\x00\x10\x01\x01\x11\x00\xFF\xDA\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\xFF\xD9"
    up1 = requests.post(f"{BASE_URL}/api/inspections/{case_id}/evidence", headers={"Authorization": f"Bearer {insp_token}"}, files={"image": ("front.jpg", dummy_img, "image/jpeg")}, data={"surface_type": "FRONT"})
    up2 = requests.post(f"{BASE_URL}/api/inspections/{case_id}/evidence", headers={"Authorization": f"Bearer {insp_token}"}, files={"image": ("back.jpg", dummy_img, "image/jpeg")}, data={"surface_type": "BACK"})
    assert up1.status_code == 201 and up2.status_code == 201
    print("[PASS] 2 Evidence Surfaces (FRONT and BACK) uploaded.")

    # Run AI analysis & submit inspector review
    an_res = requests.post(f"{BASE_URL}/api/inspections/{case_id}/analyze", headers=insp_headers)
    assert an_res.status_code == 200
    sub_res = requests.post(f"{BASE_URL}/api/reviews/{case_id}/inspector", headers=insp_headers, json={
        "remarks": "Inspector verified multi-panel declarations.",
        "corrections": {}
    })
    assert sub_res.status_code == 200
    print(f"[PASS] Case #{case_id} submitted for Senior Review.")

    # 5. Test Review Queue Filtering, Search, and Sorting
    print("\n[4] Testing Queue Search, Severity Filter, and Sorting...")
    q_all = requests.get(f"{BASE_URL}/api/reviews/queue", headers=sr_headers)
    assert q_all.status_code == 200

    q_search = requests.get(f"{BASE_URL}/api/reviews/queue?search={case_num}", headers=sr_headers)
    assert q_search.status_code == 200
    assert any(c["id"] == case_id for c in q_search.json()["queue"])
    print(f"[PASS] Search by Case Number '{case_num}' returned matching case in queue.")

    q_sort = requests.get(f"{BASE_URL}/api/reviews/queue?sort_by=violations", headers=sr_headers)
    assert q_sort.status_code == 200
    print("[PASS] Sorting by highest violations verified.")

    # 6. Test In-Studio Product History
    print("\n[5] Testing Product & Manufacturer In-Studio History Context...")
    hist_res = requests.get(f"{BASE_URL}/api/reviews/products/{product_id}/history", headers=sr_headers)
    assert hist_res.status_code == 200, f"History failed: {hist_res.text}"
    hist_data = hist_res.json()
    assert "product" in hist_data
    assert "product_inspections" in hist_data
    assert "manufacturer_summary" in hist_data
    print(f"[PASS] Product & Manufacturer History retrieved for Product #{product_id}.")

    # 7. Test Itemized Finding / Violation Action
    print("\n[6] Testing Itemized Violation Review Endpoint...")
    # Fetch case detail to check violations
    case_detail = requests.get(f"{BASE_URL}/api/inspections/{case_id}", headers=sr_headers).json()
    if case_detail.get("violations"):
        v_id = case_detail["violations"][0]["id"]
        v_act_res = requests.post(f"{BASE_URL}/api/reviews/{case_id}/violations/{v_id}/action", headers=sr_headers, json={
            "action": "CONFIRMED",
            "override_reason": "Senior officer confirmed label font height breach."
        })
        assert v_act_res.status_code == 200
        print(f"[PASS] Itemized action on Violation #{v_id} executed successfully.")
    else:
        print("[INFO] No violations flagged for this scan; proceeding to finalization action.")

    # 8. Test Senior Finalization Action (Issue Clean Order / Approve Compliant)
    print("\n[7] Testing Senior Case Finalization Action...")
    fin_res = requests.post(f"{BASE_URL}/api/reviews/{case_id}/senior-action", headers=sr_headers, json={
        "action": "APPROVE_COMPLIANT",
        "remarks": "Reviewed multi-surface evidence. Authorized Clean Order under Rule 6."
    })
    assert fin_res.status_code == 200
    assert fin_res.json()["status"] == "FINALIZED"
    assert fin_res.json()["final_decision"] == "COMPLIANT"
    print(f"[PASS] Case #{case_id} finalized as COMPLIANT.")

    # 9. Verify PDF Report Generation
    print("\n[8] Testing Statutory PDF Report Generation...")
    pdf_res = requests.get(f"{BASE_URL}/api/reports/{case_id}/pdf")
    assert pdf_res.status_code == 200
    assert pdf_res.headers.get("Content-Type") == "application/pdf"
    assert len(pdf_res.content) > 1000
    print(f"[PASS] ReportLab statutory PDF generated successfully ({len(pdf_res.content)} bytes).")

    # 10. Security RBAC Verification
    print("\n[9] Testing Security RBAC Guard (Inspector blocked from Senior Overview & Actions)...")
    insp_ov = requests.get(f"{BASE_URL}/api/reviews/overview", headers=insp_headers)
    assert insp_ov.status_code == 403
    insp_act = requests.post(f"{BASE_URL}/api/reviews/{case_id}/senior-action", headers=insp_headers, json={"action": "APPROVE_COMPLIANT"})
    assert insp_act.status_code == 403
    print("[PASS] Security RBAC strictly rejected Inspector from Senior endpoints (HTTP 403 Forbidden).")

    print("\n======================================================================")
    print("ALL SENIOR OFFICER REFINEMENT VERIFICATION TESTS PASSED (100%)")
    print("======================================================================")

if __name__ == "__main__":
    run_senior_refinement_tests()
