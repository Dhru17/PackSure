import os
import json
import unittest
from datetime import datetime, timezone, timedelta
from app import create_app
from models import (
    db, User, UserRole, InspectionCase, CaseStatus, FinalDisposition,
    Product, Manufacturer, ProductCategory, Plant, Jurisdiction,
    RegulatoryRule, Violation, ViolationSeverity, InspectorReview, SeniorReview,
    SystemicPattern, PatternStatus, InspectorJurisdictionEligibility, InspectorCategoryEligibility
)

class SeniorOfficerModuleTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.app.config["TESTING"] = True
        cls.client = cls.app.test_client()

        with cls.app.app_context():
            # Get or create test senior officer
            cls.senior = User.query.filter_by(email="senior@legalmetrology.gov.in").first()
            if not cls.senior:
                cls.senior = User(
                    email="senior@legalmetrology.gov.in",
                    full_name="Dr. Rajesh Senior Officer",
                    role=UserRole.SENIOR_OFFICER,
                    badge_number="SO-DEL-001"
                )
                db.session.add(cls.senior)
            cls.senior.set_password("Senior#2026")

            # Get or create test inspector
            cls.inspector = User.query.filter_by(email="inspector@legalmetrology.gov.in").first()
            if not cls.inspector:
                cls.inspector = User(
                    email="inspector@legalmetrology.gov.in",
                    full_name="Inspector Amit Sharma",
                    role=UserRole.INSPECTOR,
                    badge_number="INSP-DL-4401"
                )
                db.session.add(cls.inspector)
            cls.inspector.set_password("Inspector#2026")

            db.session.commit()

    def get_token(self, email, password):
        res = self.client.post("/api/auth/login", json={"email": email, "password": password})
        self.assertEqual(res.status_code, 200, f"Login failed for {email}: {res.get_json()}")
        return res.get_json()["token"]

    def setUp(self):
        self.senior_token = self.get_token("senior@legalmetrology.gov.in", "Senior#2026")
        self.inspector_token = self.get_token("inspector@legalmetrology.gov.in", "Inspector#2026")

    def test_01_senior_overview_metrics(self):
        """Test Senior Officer dashboard overview counters and metrics."""
        res = self.client.get(
            "/api/reviews/overview",
            headers={"Authorization": f"Bearer {self.senior_token}"}
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("workload", data)
        self.assertIn("pending_adjudications", data["workload"])
        self.assertIn("scheduled_audits", data["workload"])
        self.assertIn("systemic_patterns", data["workload"])
        print("[OK] Test 01 Passed: Senior Overview metrics returned.")

    def test_02_eligible_inspectors_endpoint(self):
        """Test fetching eligible inspectors with workload recommendation."""
        res = self.client.get(
            "/api/inspections/eligible-inspectors",
            headers={"Authorization": f"Bearer {self.senior_token}"}
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("inspectors", data)
        self.assertGreater(len(data["inspectors"]), 0)
        first = data["inspectors"][0]
        self.assertIn("workload_status", first)
        self.assertIn("is_eligible", first)
        self.assertIn("is_recommended", first)
        print(f"[OK] Test 02 Passed: {len(data['inspectors'])} eligible inspectors fetched with workload status.")

    def test_03_schedule_audit_with_rule_version_and_eligibility(self):
        """Test scheduling an audit binds active rule version and valid inspector."""
        with self.app.app_context():
            mfg = Manufacturer.query.first()
            plant = Plant.query.first()
            cat = ProductCategory.query.first()
            insp = User.query.filter_by(role=UserRole.INSPECTOR).first()
            mfg_id = mfg.id if mfg else 1
            plant_id = plant.id if plant else None
            cat_id = cat.id if cat else 1
            insp_id = insp.id if insp else 1

        tomorrow = (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%d")
        payload = {
            "company_id": mfg_id,
            "plant_id": plant_id,
            "category_id": cat_id,
            "brand_name": "Senior Test Biscuits 400g",
            "commodity_name": "Biscuits",
            "inspector_id": insp_id,
            "scheduled_date": tomorrow,
            "instructions": "Verify Net Quantity font height under Rule 7 and USP under Rule 6(10A)."
        }

        res = self.client.post(
            "/api/inspections/schedule",
            headers={"Authorization": f"Bearer {self.senior_token}"},
            json=payload
        )
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertIn("case", data)
        scheduled_case = data["case"]
        self.assertEqual(scheduled_case["status"], "DRAFT")
        self.assertIsNotNone(scheduled_case["rule_version"])
        self.assertEqual(scheduled_case["inspector_id"], insp_id)
        print(f"[OK] Test 03 Passed: Audit {scheduled_case['case_number']} scheduled with rule version {scheduled_case['rule_version']}.")

    def test_04_schedule_audit_rejects_missing_or_invalid_inspector(self):
        """Test scheduling rejects missing or non-inspector users with HTTP 400."""
        res = self.client.post(
            "/api/inspections/schedule",
            headers={"Authorization": f"Bearer {self.senior_token}"},
            json={"brand_name": "Invalid Test", "scheduled_date": "2026-10-10"}
        )
        self.assertEqual(res.status_code, 400)

        # Invalid user ID
        res2 = self.client.post(
            "/api/inspections/schedule",
            headers={"Authorization": f"Bearer {self.senior_token}"},
            json={"brand_name": "Invalid Test", "inspector_id": 999999, "scheduled_date": "2026-10-10"}
        )
        self.assertEqual(res2.status_code, 400)
        print("[OK] Test 04 Passed: Invalid inspector rejected with HTTP 400.")

    def test_05_list_and_update_scheduled_audits(self):
        """Test listing scheduled audits and rescheduling/updating instructions."""
        res = self.client.get(
            "/api/inspections/scheduled?status=UPCOMING",
            headers={"Authorization": f"Bearer {self.senior_token}"}
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("audits", data)
        self.assertGreater(len(data["audits"]), 0)
        target_case_id = data["audits"][0]["id"]

        # Update / reschedule
        new_date = (datetime.now(timezone.utc) + timedelta(days=3)).strftime("%Y-%m-%d")
        res_update = self.client.put(
            f"/api/inspections/{target_case_id}/schedule",
            headers={"Authorization": f"Bearer {self.senior_token}"},
            json={"scheduled_date": new_date, "instructions": "Updated supervisory instructions."}
        )
        self.assertEqual(res_update.status_code, 200)
        print(f"[OK] Test 05 Passed: Scheduled audit #{target_case_id} rescheduled.")

    def test_06_return_for_reinspection_mandatory_reason_and_cycle(self):
        """Test returning a submitted case requires mandatory reason and increments cycle."""
        # Create a submitted test case
        with self.app.app_context():
            prod = Product.query.first()
            insp = User.query.filter_by(role=UserRole.INSPECTOR).first()
            test_case = InspectionCase(
                case_number=f"LM-TEST-RET-{datetime.now().timestamp()}",
                product_id=prod.id if prod else 1,
                inspector_id=insp.id if insp else 1,
                status=CaseStatus.SUBMITTED,
                review_cycle=1,
                compliance_score=70.0,
                failed_checks=1
            )
            db.session.add(test_case)
            db.session.commit()
            case_id = test_case.id

        # 1. Attempt return with empty reason -> must fail with 400
        res_empty = self.client.post(
            f"/api/reviews/{case_id}/return",
            headers={"Authorization": f"Bearer {self.senior_token}"},
            json={"reason": "   "}
        )
        self.assertEqual(res_empty.status_code, 400)

        # 2. Return with valid reason
        res_valid = self.client.post(
            f"/api/reviews/{case_id}/return",
            headers={"Authorization": f"Bearer {self.senior_token}"},
            json={"reason": "Measurement photo for back panel MRP is unreadable. Re-upload high resolution image.", "statutory_citation": "Rule 6(1)(e)"}
        )
        self.assertEqual(res_valid.status_code, 200)
        ret_data = res_valid.get_json()
        self.assertEqual(ret_data["status"], "RETURNED")
        self.assertEqual(ret_data["review_cycle"], 2)
        print(f"[OK] Test 06 Passed: Case #{case_id} returned to inspector with cycle incremented to {ret_data['review_cycle']}.")

    def test_07_finalize_inspection_case(self):
        """Test final approval freezes case and records senior officer sign-off."""
        with self.app.app_context():
            prod = Product.query.first()
            insp = User.query.filter_by(role=UserRole.INSPECTOR).first()
            test_case = InspectionCase(
                case_number=f"LM-TEST-FIN-{datetime.now().timestamp()}",
                product_id=prod.id if prod else 1,
                inspector_id=insp.id if insp else 1,
                status=CaseStatus.SUBMITTED,
                compliance_score=100.0,
                failed_checks=0
            )
            db.session.add(test_case)
            db.session.commit()
            case_id = test_case.id

        res = self.client.post(
            f"/api/reviews/{case_id}/finalize",
            headers={"Authorization": f"Bearer {self.senior_token}"},
            json={
                "action": "APPROVE_COMPLIANT",
                "remarks": "All Legal Metrology declarations verified and compliant."
            }
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "FINALIZED")
        self.assertEqual(data["final_decision"], "COMPLIANT")
        print(f"[OK] Test 07 Passed: Case #{case_id} successfully finalized with status {data['status']}.")

    def test_08_systemic_intelligence_patterns(self):
        """Test Innovation #5 systemic violation pattern detection and triage action."""
        # 1. Fetch patterns
        res = self.client.get(
            "/api/reviews/intelligence/patterns",
            headers={"Authorization": f"Bearer {self.senior_token}"}
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("patterns", data)
        self.assertGreater(len(data["patterns"]), 0)
        pat = data["patterns"][0]
        self.assertIn("pattern_code", pat)
        self.assertIn("confidence_score", pat)

        # 2. Update pattern status
        res_action = self.client.post(
            f"/api/reviews/intelligence/patterns/{pat['id']}/action",
            headers={"Authorization": f"Bearer {self.senior_token}"},
            json={
                "status": "CONFIRMED_PATTERN",
                "notes": "Verified systemic trend across biscuit SKUs. Scheduled factory audit."
            }
        )
        self.assertEqual(res_action.status_code, 200)
        updated_pat = res_action.get_json()["pattern"]
        self.assertEqual(updated_pat["status"], "CONFIRMED_PATTERN")
        print(f"[OK] Test 08 Passed: Systemic pattern {pat['pattern_code']} triaged to CONFIRMED_PATTERN.")

    def test_09_strict_rbac_senior_cannot_mutate_rules(self):
        """Test RBAC: Senior Officer cannot create or edit master rules (must return 403)."""
        res = self.client.post(
            "/api/rules",
            headers={"Authorization": f"Bearer {self.senior_token}"},
            json={"rule_code": "ILLEGAL_MUTATION", "title": "Tamper Test"}
        )
        self.assertEqual(res.status_code, 403)
        print("[OK] Test 09 Passed: Senior Officer RBAC strictly enforced (HTTP 403 on rule creation).")

if __name__ == "__main__":
    unittest.main()
