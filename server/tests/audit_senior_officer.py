import requests
import json

BASE_URL = "http://127.0.0.1:5055"

def audit_senior_officer():
    print("==================================================")
    print("LIVE AUDIT: SENIOR OFFICER MODULE ENDPOINTS")
    print("==================================================")

    # 1. Login as Senior Officer
    print("\n[1] Testing Senior Officer Authentication...")
    sr_login = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "senior@legalmetrology.gov.in",
        "password": "Senior#2026"
    })
    print(f"Status: {sr_login.status_code}")
    assert sr_login.status_code == 200, f"Senior login failed: {sr_login.text}"
    sr_data = sr_login.json()
    sr_token = sr_data["token"]
    sr_user = sr_data["user"]
    sr_headers = {"Authorization": f"Bearer {sr_token}", "Content-Type": "application/json"}
    print(f"[PASS] Senior Officer authenticated: {sr_user['full_name']} (Role: {sr_user['role']}, Badge: {sr_user.get('badge_number')})")

    # 2. Login as Inspector to verify RBAC
    print("\n[2] Testing RBAC Security: Inspector blocked from Senior Adjudication Actions...")
    insp_login = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "inspector@legalmetrology.gov.in",
        "password": "Inspector#2026"
    })
    insp_token = insp_login.json()["token"]
    insp_headers = {"Authorization": f"Bearer {insp_token}", "Content-Type": "application/json"}

    # Attempt senior action with inspector token on case 1
    blocked_action = requests.post(f"{BASE_URL}/api/reviews/1/senior-action", headers=insp_headers, json={
        "action": "APPROVE_COMPLIANT"
    })
    print(f"Inspector attempting senior-action returned: {blocked_action.status_code}")
    assert blocked_action.status_code == 403, f"Expected 403 Forbidden, got {blocked_action.status_code}"
    print("[PASS] RBAC properly blocks Inspectors from Senior Adjudication (HTTP 403).")

    # 3. Test Review Queue Endpoint
    print("\n[3] Testing GET /api/reviews/queue...")
    queue_res = requests.get(f"{BASE_URL}/api/reviews/queue", headers=sr_headers)
    print(f"Queue Status: {queue_res.status_code}")
    assert queue_res.status_code == 200
    queue_data = queue_res.json()
    print(f"[PASS] Queue retrieved successfully: {queue_data['count']} cases awaiting review.")
    if queue_data["count"] > 0:
        c0 = queue_data["queue"][0]
        print(f"       Sample Case: #{c0['id']} ({c0['case_number']}) - Status: {c0['status']}, Failed Checks: {c0.get('failed_checks')}")

    # 4. Test Analytics Summary Endpoint
    print("\n[4] Testing GET /api/analytics/summary...")
    sum_res = requests.get(f"{BASE_URL}/api/analytics/summary", headers=sr_headers)
    print(f"Analytics Summary Status: {sum_res.status_code}")
    assert sum_res.status_code == 200
    sum_data = sum_res.json()
    print(f"[PASS] Analytics Summary: Total Cases={sum_data.get('total_cases')}, Finalized={sum_data.get('finalized_cases')}, Compliant={sum_data.get('compliant_cases')}, Non-Compliant={sum_data.get('non_compliant_cases')}, Pending Review={sum_data.get('pending_senior_review')}, Rate={sum_data.get('compliance_rate')}%")

    # 5. Test Repeat Violators Endpoint
    print("\n[5] Testing GET /api/analytics/repeat-violators...")
    viol_res = requests.get(f"{BASE_URL}/api/analytics/repeat-violators", headers=sr_headers)
    print(f"Repeat Violators Status: {viol_res.status_code}")
    assert viol_res.status_code == 200
    viol_data = viol_res.json()
    print(f"[PASS] Repeat Violators list retrieved: {len(viol_data.get('repeat_violators', []))} entities found.")
    for v in viol_data.get("repeat_violators", [])[:3]:
        print(f"       Manufacturer: {v['manufacturer_name']} | Inspections: {v['total_inspections']} | Violations: {v['total_violations']}")

    # 6. Test Reports Endpoint
    print("\n[6] Testing GET /api/reports/:case_id/pdf...")
    pdf_res = requests.get(f"{BASE_URL}/api/reports/1/pdf", headers=sr_headers)
    print(f"PDF Report Status: {pdf_res.status_code}, Content-Type: {pdf_res.headers.get('Content-Type')}, Size: {len(pdf_res.content)} bytes")
    assert pdf_res.status_code == 200
    print("[PASS] ReportLab statutory PDF report generated/streamed successfully.")

    # 7. Test Inspection Detail Retrieval for Senior Review
    print("\n[7] Testing GET /api/inspections/:case_id with full relations...")
    case_detail = requests.get(f"{BASE_URL}/api/inspections/1", headers=sr_headers)
    assert case_detail.status_code == 200
    cd = case_detail.json()
    print(f"[PASS] Case detail: Ref={cd['case_number']}, Status={cd['status']}, Evidences={len(cd.get('evidences', []))}, Declarations={len(cd.get('declarations', []))}, Checks={len(cd.get('compliance_checks', []))}, Violations={len(cd.get('violations', []))}")

    # 8. Test State Machine Protection: Cannot adjudicate a DRAFT case
    print("\n[8] Testing State Machine: Cannot adjudicate DRAFT case...")
    # Create fresh draft case
    draft_create = requests.post(f"{BASE_URL}/api/inspections", headers=insp_headers, json={"brand_name": "Audit Test", "commodity_name": "Audit Sample"})
    draft_id = draft_create.json()["inspection"]["id"]
    draft_action = requests.post(f"{BASE_URL}/api/reviews/{draft_id}/senior-action", headers=sr_headers, json={"action": "APPROVE_COMPLIANT"})
    print(f"Adjudicating DRAFT case status: {draft_action.status_code}")
    assert draft_action.status_code == 400
    print(f"[PASS] Correctly rejected with error: {draft_action.json().get('error')}")

    print("\n==================================================")
    print("LIVE SENIOR OFFICER API AUDIT COMPLETE (100% PASS)")
    print("==================================================")

if __name__ == "__main__":
    audit_senior_officer()
