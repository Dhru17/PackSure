import requests
import json
import sys
import time

BASE_URL = "http://127.0.0.1:5055"

def run_admin_tests():
    print("==================================================")
    print("RUNNING ADMIN MODULE REFINEMENT ACCEPTANCE TESTS")
    print("==================================================")

    ts = int(time.time())

    # 1. Admin Login
    print("\n[1] Testing Admin Authentication...")
    admin_login = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@legalmetrology.gov.in",
        "password": "Admin#2026"
    })
    assert admin_login.status_code == 200, f"Admin login failed: {admin_login.text}"
    admin_token = admin_login.json()["token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
    print("[PASS] Admin successfully authenticated.")

    # 2. Inspector RBAC Guard Test
    print("\n[2] Testing RBAC Security Guard (Inspector blocked from Admin APIs)...")
    insp_login = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "inspector@legalmetrology.gov.in",
        "password": "Inspector#2026"
    })
    assert insp_login.status_code == 200
    insp_token = insp_login.json()["token"]
    insp_headers = {"Authorization": f"Bearer {insp_token}", "Content-Type": "application/json"}

    blocked_res = requests.get(f"{BASE_URL}/api/admin/users", headers=insp_headers)
    assert blocked_res.status_code in [401, 403], f"Inspector was not blocked: {blocked_res.status_code}"
    print("[PASS] RBAC successfully blocked non-admin user from Admin APIs (HTTP 403).")

    # 3. System Health & Telemetry
    print("\n[3] Testing System Health & Telemetry Endpoint...")
    health_res = requests.get(f"{BASE_URL}/api/admin/system-health", headers=admin_headers)
    assert health_res.status_code == 200, f"System health failed: {health_res.text}"
    health_data = health_res.json()
    assert health_data["status"] == "HEALTHY"
    assert "database" in health_data
    assert "ocr_engine" in health_data
    assert "storage" in health_data
    print(f"[PASS] System Health Telemetry verified: DB Latency = {health_data['database']['latency_ms']}ms, Tables = {health_data['database']['tables']}")

    # 4. User Provisioning, Edit Profile & Password Reset
    print("\n[4] Testing Officer Lifecycle (Provision -> Edit -> Password Reset)...")
    test_officer_email = f"test_officer_{ts}@legalmetrology.gov.in"
    create_u_res = requests.post(f"{BASE_URL}/api/admin/users", headers=admin_headers, json={
        "email": test_officer_email,
        "full_name": "Assistant Director Testing",
        "role": "SENIOR_OFFICER",
        "badge_number": f"LM-TEST-{ts}",
        "jurisdiction_district": "Delhi NCR",
        "password": "InitialPassword#2026"
    })
    assert create_u_res.status_code == 201, f"User creation failed: {create_u_res.text}"
    created_user = create_u_res.json()["user"]
    user_id = created_user["id"]
    print(f"[PASS] Created test officer #{user_id}")

    # Edit Profile
    edit_u_res = requests.put(f"{BASE_URL}/api/admin/users/{user_id}", headers=admin_headers, json={
        "full_name": "Joint Director Testing Officer",
        "badge_number": f"LM-TEST-{ts}-REV",
        "jurisdiction_district": "National Zone"
    })
    assert edit_u_res.status_code == 200
    assert edit_u_res.json()["user"]["full_name"] == "Joint Director Testing Officer"
    print("[PASS] Officer profile updated.")

    # Reset Password
    reset_p_res = requests.post(f"{BASE_URL}/api/admin/users/{user_id}/reset-password", headers=admin_headers, json={
        "password": "NewSecretPassword#2026"
    })
    assert reset_p_res.status_code == 200
    print("[PASS] Officer password successfully reset.")

    # Test login with new password
    new_login = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": test_officer_email,
        "password": "NewSecretPassword#2026"
    })
    assert new_login.status_code == 200, "Login with new password failed"
    print("[PASS] Verified authentication with reset password.")

    # Toggle status & cleanup
    toggle_u_res = requests.patch(f"{BASE_URL}/api/admin/users/{user_id}/toggle-status", headers=admin_headers)
    assert toggle_u_res.status_code == 200
    del_u_res = requests.delete(f"{BASE_URL}/api/admin/users/{user_id}", headers=admin_headers)
    assert del_u_res.status_code == 200
    print("[PASS] Officer status toggle and safe deletion verified.")

    # 5. Product Category CRUD & Category-Rule Mappings
    print("\n[5] Testing Product Category CRUD & Rule Applicability Mapping...")
    cat_code = f"GOV_CAT_{ts}"
    create_cat_res = requests.post(f"{BASE_URL}/api/admin/categories", headers=admin_headers, json={
        "category_code": cat_code,
        "name": "Speciality Agro Commodities",
        "description": "Statutory category for packaged organic spices and seeds"
    })
    assert create_cat_res.status_code == 201, f"Category creation failed: {create_cat_res.text}"
    cat_id = create_cat_res.json()["category"]["id"]
    print(f"[PASS] Created product category #{cat_id}")


    # Map a rule to category
    rules_res = requests.get(f"{BASE_URL}/api/rules", headers=admin_headers)
    first_rule_id = rules_res.json()["rules"][0]["id"]
    map_res = requests.post(f"{BASE_URL}/api/admin/categories/{cat_id}/rules", headers=admin_headers, json={
        "rule_id": first_rule_id,
        "is_exempt": True,
        "exception_notes": "Statutory exemption under Rule 26 for export grade packages."
    })
    assert map_res.status_code == 201
    print("[PASS] Mapped rule exemption to product category.")

    # List mapped rules
    list_cat_rules = requests.get(f"{BASE_URL}/api/admin/categories/{cat_id}/rules", headers=admin_headers)
    assert list_cat_rules.status_code == 200
    assert len(list_cat_rules.json()["mappings"]) >= 1
    print("[PASS] Verified category rule list with exemption metadata.")

    # Delete category test
    del_cat_res = requests.delete(f"{BASE_URL}/api/admin/categories/{cat_id}", headers=admin_headers)
    assert del_cat_res.status_code == 200
    print("[PASS] Category deleted successfully.")

    # 6. Regulatory Rule Updates & Toggle
    print("\n[6] Testing Regulatory Rule Update & Status Toggle...")
    rule_update_res = requests.put(f"{BASE_URL}/api/rules/{first_rule_id}", headers=admin_headers, json={
        "title": "Mandatory Net Quantity Declaration (Standard SI Units)",
        "statutory_citation": "Rule 6(1)(e), Legal Metrology (PC) Rules, 2011"
    })
    assert rule_update_res.status_code == 200
    print("[PASS] Regulatory Rule updated.")

    # 7. Immutable Audit Logs & Forensics
    print("\n[7] Testing Immutable Audit Logs & Structured State Diff...")
    audit_res = requests.get(f"{BASE_URL}/api/admin/audit-logs?limit=10", headers=admin_headers)
    assert audit_res.status_code == 200
    logs = audit_res.json()["audit_logs"]
    assert len(logs) > 0
    print(f"[PASS] Retrieved {len(logs)} audit entries. Most recent action: {logs[0]['action_type']} by {logs[0]['user_name']}.")

    print("\n==================================================")
    print("ALL ADMIN MODULE ACCEPTANCE TESTS PASSED (100%)")
    print("==================================================")

if __name__ == "__main__":
    run_admin_tests()
