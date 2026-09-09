import sys
import os
import json
from datetime import datetime, timezone, date

from app import create_app
from models import (
    db, User, UserRole,
    Manufacturer, Company, ProductCategory, Product,
    Jurisdiction, Plant, InspectorCategoryEligibility, InspectorJurisdictionEligibility,
    InspectionCase, CaseStatus, FinalDisposition,
    RegulatoryRule, RuleCategoryMapping, RuleRequirement,
    AuditLog, AuditActionType
)
from services.auth_service import generate_token
from services.impact_simulator_service import RegulatoryImpactSimulatorService

def run_admin_verification():
    print("=" * 80)
    print("PACKSURE PART 1: ADMIN MODULE & REGULATORY ARCHITECTURE VERIFICATION TEST")
    print("=" * 80)

    app = create_app()

    with app.app_context():
        # 1. Reset Database & Create all tables
        db.drop_all()
        db.create_all()
        print("[PASS] 1. Database connection & schema tables created successfully.")

        # 2. Seed 4-Role Users
        admin = User(email="admin@legalmetrology.gov.in", full_name="Director S. Rao", role=UserRole.ADMIN, badge_number="ADM-001")
        admin.set_password("Admin#2026")

        senior = User(email="senior@legalmetrology.gov.in", full_name="Assistant Controller Priya Verma", role=UserRole.SENIOR_OFFICER, badge_number="LMO-SR-092", jurisdiction_district="Central Delhi")
        senior.set_password("Senior#2026")

        inspector = User(email="inspector@legalmetrology.gov.in", full_name="Inspector Rahul Sharma", role=UserRole.INSPECTOR, badge_number="LMO-DEL-2024-884", jurisdiction_district="Ahmedabad District")
        inspector.set_password("Inspector#2026")

        company_user = User(email="compliance@britannia.co.in", full_name="Compliance Manager Britannia", role=UserRole.COMPANY, phone_number="1800-425-4449")
        company_user.set_password("Company#2026")

        db.session.add_all([admin, senior, inspector, company_user])
        db.session.commit()

        admin_token = generate_token(admin)
        senior_token = generate_token(senior)
        inspector_token = generate_token(inspector)
        company_token = generate_token(company_user)

        print(f"[PASS] 2. Four distinct roles created: {[r.value for r in UserRole]} (Count: {User.query.count()})")

    # Use Flask test client for API & RBAC verification
    client = app.test_client()

    # 3. RBAC Strict Verification
    # Senior attempting Admin User Create -> 403
    res_senior = client.post("/api/admin/users", 
        headers={"Authorization": f"Bearer {senior_token}"},
        json={"email": "hacker@test.com", "full_name": "Hacker", "role": "ADMIN"}
    )
    assert res_senior.status_code == 403, f"Expected 403 for Senior on Admin API, got {res_senior.status_code}"

    # Inspector attempting Admin User Create -> 403
    res_insp = client.post("/api/admin/users", 
        headers={"Authorization": f"Bearer {inspector_token}"},
        json={"email": "hacker2@test.com", "full_name": "Hacker 2", "role": "ADMIN"}
    )
    assert res_insp.status_code == 403, f"Expected 403 for Inspector on Admin API, got {res_insp.status_code}"

    # Company user attempting Admin User Create -> 403
    res_comp = client.post("/api/admin/users", 
        headers={"Authorization": f"Bearer {company_token}"},
        json={"email": "hacker3@test.com", "full_name": "Hacker 3", "role": "ADMIN"}
    )
    assert res_comp.status_code == 403, f"Expected 403 for Company on Admin API, got {res_comp.status_code}"

    print("[PASS] 3. Strict RBAC verification passed (Senior, Inspector, Company rejected with 403 on Admin APIs).")

    # 4. Admin Jurisdictions Management
    res_jur1 = client.post("/api/admin/jurisdictions",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"code": "GUJ-AHM", "name": "Ahmedabad District", "state": "Gujarat", "district": "Ahmedabad"}
    )
    assert res_jur1.status_code == 201, f"Failed creating jurisdiction: {res_jur1.data}"
    jur1_id = res_jur1.get_json()["jurisdiction"]["id"]

    res_jur2 = client.post("/api/admin/jurisdictions",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"code": "GUJ-GND", "name": "Gandhinagar Zone", "state": "Gujarat", "district": "Gandhinagar"}
    )
    assert res_jur2.status_code == 201
    jur2_id = res_jur2.get_json()["jurisdiction"]["id"]

    res_jur_list = client.get("/api/admin/jurisdictions", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_jur_list.get_json()["count"] == 2
    print(f"[PASS] 4. Jurisdictions created and listed (Count: {res_jur_list.get_json()['count']})")

    # 5. Admin Company Master Data Management
    res_comp_create = client.post("/api/admin/companies",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "name": "Britannia Industries Ltd",
            "legal_entity_name": "Britannia Industries Limited",
            "address": "5/1A, Hungerford Street",
            "city": "Kolkata",
            "state": "West Bengal",
            "pin_code": "700017",
            "contact_email": "compliance@britannia.co.in",
            "contact_phone": "1800-425-4449",
            "is_importer": False,
            "registration_number": "LMPC-MFR-2024-WB-098"
        }
    )
    assert res_comp_create.status_code == 201
    company_id = res_comp_create.get_json()["company"]["id"]

    res_comp_get = client.get(f"/api/admin/companies/{company_id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_comp_get.get_json()["company"]["name"] == "Britannia Industries Ltd"
    print(f"[PASS] 5. Company Master record created & retrieved (Company ID: {company_id})")

    # 6. Admin Plant / Location Management
    res_plant1 = client.post("/api/admin/plants",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "company_id": company_id,
            "plant_code": "PLT-AHM-01",
            "name": "Sanand Bakery Unit 1",
            "address": "GIDC Sanand Phase II",
            "city": "Ahmedabad",
            "state": "Gujarat",
            "pin_code": "382110",
            "jurisdiction_id": jur1_id,
            "contact_person": "Mr. Amit Patel",
            "contact_email": "sanand1@britannia.co.in"
        }
    )
    assert res_plant1.status_code == 201
    plant1_id = res_plant1.get_json()["plant"]["id"]

    res_plant2 = client.post("/api/admin/plants",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "company_id": company_id,
            "plant_code": "PLT-GND-01",
            "name": "Gandhinagar Dairy Facility",
            "address": "Electronic Estate Sector 25",
            "city": "Gandhinagar",
            "state": "Gujarat",
            "pin_code": "382024",
            "jurisdiction_id": jur2_id,
            "contact_person": "Ms. Rashmi Dave"
        }
    )
    assert res_plant2.status_code == 201

    res_plants = client.get("/api/admin/plants", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_plants.get_json()["count"] == 2
    print(f"[PASS] 6. Company Plants linked to Jurisdictions created (Count: {res_plants.get_json()['count']})")

    # 7. Categories Management
    res_cat1 = client.post("/api/admin/categories",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"category_code": "FOOD_BEV", "name": "Food & Beverages", "description": "Packaged food items"}
    )
    assert res_cat1.status_code == 201
    cat1_id = res_cat1.get_json()["category"]["id"]

    res_cat2 = client.post("/api/admin/categories",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"category_code": "BAKERY_BISCUITS", "name": "Biscuits & Bakery", "parent_id": cat1_id, "description": "Biscuits, cookies, rusks"}
    )
    assert res_cat2.status_code == 201
    cat2_id = res_cat2.get_json()["category"]["id"]

    res_cat3 = client.post("/api/admin/categories",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"category_code": "COSMETICS", "name": "Cosmetics & Personal Care", "description": "Soaps, shampoos, lotions"}
    )
    assert res_cat3.status_code == 201
    cat3_id = res_cat3.get_json()["category"]["id"]

    print(f"[PASS] 7. Product Category hierarchy created (Parent & Child categories configured)")

    # 8. Inspector Eligibility Configuration (Admin Permanent Configuration)
    with app.app_context():
        insp_user = User.query.filter_by(role=UserRole.INSPECTOR).first()
        insp_id = insp_user.id

    # Admin grants Inspector Category: Food & Beverages (cat1_id), Biscuits (cat2_id) and Jurisdiction: Ahmedabad (jur1_id)
    res_elig = client.post(f"/api/admin/inspectors/{insp_id}/eligibility",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "category_ids": [cat1_id, cat2_id],
            "jurisdiction_ids": [jur1_id]
        }
    )
    assert res_elig.status_code == 200

    # Query eligible inspectors for Food & Ahmedabad -> should return Inspector Rahul Sharma
    res_query_eligible = client.get(f"/api/admin/inspectors/eligible?category_id={cat1_id}&jurisdiction_id={jur1_id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_query_eligible.status_code == 200
    eligible_list = res_query_eligible.get_json()["eligible_inspectors"]
    assert len(eligible_list) == 1
    assert eligible_list[0]["id"] == insp_id

    # Query eligible inspectors for Cosmetics (cat3_id) & Ahmedabad -> should return EMPTY (since inspector is not certified for cosmetics)
    res_query_empty = client.get(f"/api/admin/inspectors/eligible?category_id={cat3_id}&jurisdiction_id={jur1_id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert len(res_query_empty.get_json()["eligible_inspectors"]) == 0

    print(f"[PASS] 8. Inspector Permanent Eligibility configured & verified (Filtered matching inspector vs non-matching category)")

    # 9. Rule Book, Versioning & Requirements Management
    with app.app_context():
        rule_mrp_v1 = RegulatoryRule(
            rule_code="RULE_6_1_E",
            version="v2022.1",
            title="Maximum Retail Price (All Inclusive)",
            description="MRP strictly inclusive of all taxes.",
            statutory_citation="Rule 6(1)(e), Legal Metrology (PC) Rules 2011",
            validation_logic_type="MRP_TAX_CLAUSE",
            effective_from=date(2022, 1, 1),
            is_active=True
        )
        db.session.add(rule_mrp_v1)
        db.session.flush()

        # Map to Food & Biscuits categories
        db.session.add(RuleCategoryMapping(rule_id=rule_mrp_v1.id, category_id=cat1_id))
        db.session.add(RuleCategoryMapping(rule_id=rule_mrp_v1.id, category_id=cat2_id))
        db.session.commit()
        rule_v1_id = rule_mrp_v1.id

    # Add Requirements to Rule
    res_req1 = client.post(f"/api/admin/rules/{rule_v1_id}/requirements",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "requirement_code": "REQ_MRP_INCL_TAX",
            "title": "Mandatory Tax Inclusivity Text",
            "requirement_type": "MANDATORY_DECLARATION",
            "description": "Must contain 'incl. of all taxes' or 'inclusive of all taxes'"
        }
    )
    assert res_req1.status_code == 201

    res_req2 = client.post(f"/api/admin/rules/{rule_v1_id}/requirements",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "requirement_code": "REQ_MRP_NUMERIC",
            "title": "Clear Numeric Retail Price in INR",
            "requirement_type": "MANDATORY_DECLARATION",
            "description": "Standard decimal price formatted in Rs. or INR"
        }
    )
    assert res_req2.status_code == 201

    # Create Version 2 of Rule: v2027.1
    res_v2 = client.post(f"/api/admin/rules/{rule_v1_id}/version",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "version": "v2027.1",
            "title": "Maximum Retail Price & Unit Sale Price Mandatory Standard",
            "effective_from": "2027-07-01",
            "statutory_citation": "Rule 6(1)(e) & 6(11) (2027 Amendment), Legal Metrology (PC) Rules",
            "clone_requirements": True
        }
    )
    assert res_v2.status_code == 201
    rule_v2_id = res_v2.get_json()["rule"]["id"]

    res_versions = client.get(f"/api/admin/rules/{rule_v1_id}/versions", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_versions.get_json()["count"] == 2
    print(f"[PASS] 9. Rule Book versioning and requirement specifications configured (Versions count: {res_versions.get_json()['count']})")

    # 10. Seed Products & Upcoming Inspection Cases for Regulatory Impact Simulator Test
    with app.app_context():
        p1 = Product(
            barcode="8901063012345",
            brand_name="Britannia Good Day",
            commodity_name="Butter Cookies",
            category_id=cat2_id,
            manufacturer_id=company_id,
            package_type="Pouch / Pillow Pack",
            default_net_quantity="200 g",
            default_mrp=45.00
        )
        p2 = Product(
            barcode="8901063054321",
            brand_name="Britannia Treat",
            commodity_name="Chocolate Cream Biscuits",
            category_id=cat2_id,
            manufacturer_id=company_id,
            package_type="Flow Wrap",
            default_net_quantity="150 g",
            default_mrp=30.00
        )
        db.session.add_all([p1, p2])
        db.session.commit()

        # Seed upcoming audit
        audit_case = InspectionCase(
            case_number="LM-2027-005001",
            product_id=p1.id,
            inspector_id=insp_id,
            status=CaseStatus.DRAFT,
            location_name="Ahmedabad Retail Hub"
        )
        db.session.add(audit_case)
        db.session.commit()

    # 11. Test Innovation #9: Regulatory Change Impact Simulator
    res_impact = client.get(f"/api/admin/rules/{rule_v2_id}/impact", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_impact.status_code == 200
    impact_data = res_impact.get_json()

    print("\n--- INNOVATION #9: REGULATORY CHANGE IMPACT SIMULATOR RESULT ---")
    print(f"Rule: {impact_data['rule']['rule_code']} ({impact_data['rule']['version']}) - Effective: {impact_data['rule']['effective_from']}")
    print(f"Summary: Affected Categories: {impact_data['summary']['affected_categories_count']}, "
          f"Affected Companies: {impact_data['summary']['affected_companies_count']}, "
          f"Affected Plants: {impact_data['summary']['affected_plants_count']}, "
          f"Affected Products: {impact_data['summary']['affected_products_count']}, "
          f"Affected Upcoming Audits: {impact_data['summary']['affected_upcoming_audits_count']}")
    
    assert impact_data["summary"]["affected_categories_count"] >= 2
    assert impact_data["summary"]["affected_companies_count"] >= 1
    assert impact_data["summary"]["affected_plants_count"] >= 2
    assert impact_data["summary"]["affected_products_count"] == 2
    assert impact_data["summary"]["affected_upcoming_audits_count"] == 1
    print("[PASS] 11. Innovation #9 Regulatory Change Impact Simulator calculated deterministic impact perfectly.")

    # 12. Admin Dashboard Stats & System Health
    res_stats = client.get("/api/admin/dashboard-stats", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_stats.status_code == 200
    stats = res_stats.get_json()["stats"]
    assert stats["companies"]["total"] >= 1
    assert stats["plants"]["total"] >= 2
    assert stats["jurisdictions"]["total"] >= 2
    assert stats["inspectors"]["total"] >= 1
    assert stats["rules"]["total"] >= 2
    print(f"[PASS] 12. Admin Dashboard metrics returned live system counters.")

    # 13. Audit Logs verification
    res_audit = client.get("/api/admin/audit-logs", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_audit.status_code == 200
    logs_count = res_audit.get_json()["count"]
    assert logs_count > 5
    print(f"[PASS] 13. Forensic administrative audit trail verified (Recorded {logs_count} actions).")

    print("\n" + "=" * 80)
    print("ALL 13 ADMIN ARCHITECTURE VERIFICATION TEST SUITES PASSED FLAWLESSLY!")
    print("=" * 80)

if __name__ == "__main__":
    run_admin_verification()
