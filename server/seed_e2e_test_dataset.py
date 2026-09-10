"""
PackSure — End-to-End Test Dataset Seeder
Creates realistic test data for the 4-module master verification:
- Company: ABC Foods Pvt. Ltd.
- Plant: Ahmedabad Manufacturing Plant (Gujarat jurisdiction)
- Category: Packaged Food
- Products:
  1. ABC Premium Biscuits 200 g
  2. ABC Cookies 100 g
  3. ABC Namkeen 500 g
  4. ABC Imported Chocolate 100 g
- Users:
  - Admin: admin@legalmetrology.gov.in
  - Senior Officer: senior.gujarat@legalmetrology.gov.in
  - Company User: compliance@abcfoods.com
  - Inspector A (Gujarat + Packaged Food -> Eligible)
  - Inspector B (Gujarat + NOT Packaged Food -> Ineligible)
  - Inspector C (Rajasthan + Packaged Food -> Ineligible for Ahmedabad)
"""

import sys
from datetime import datetime, timezone, date
from werkzeug.security import generate_password_hash
from app import create_app
from models import (
    db, User, UserRole, Manufacturer, Company, Plant, Jurisdiction,
    ProductCategory, Product, InspectorCategoryEligibility, InspectorJurisdictionEligibility,
    RegulatoryRule, RuleCategoryMapping
)

def seed_e2e_dataset():
    app = create_app()
    with app.app_context():
        print("=== SEEDING REALISTIC E2E TEST DATASET ===")

        # 1. Jurisdictions
        guj_jur = Jurisdiction.query.filter_by(code="GUJ-AHM").first()
        if not guj_jur:
            guj_jur = Jurisdiction(
                code="GUJ-AHM",
                name="Ahmedabad District",
                state="Gujarat",
                district="Ahmedabad",
                description="Ahmedabad Municipal & Industrial Enforcement Zone",
                is_active=True
            )
            db.session.add(guj_jur)

        raj_jur = Jurisdiction.query.filter_by(code="RAJ-JPR").first()
        if not raj_jur:
            raj_jur = Jurisdiction(
                code="RAJ-JPR",
                name="Jaipur District",
                state="Rajasthan",
                district="Jaipur",
                description="Jaipur Metropolitan Enforcement Zone",
                is_active=True
            )
            db.session.add(raj_jur)
        db.session.flush()

        # 2. Categories
        food_cat = ProductCategory.query.filter_by(category_code="PKG-FOOD").first()
        if not food_cat:
            food_cat = ProductCategory(
                category_code="PKG-FOOD",
                name="Packaged Food",
                description="Packaged Food & Edible Commodities under Schedule II",
                is_active=True
            )
            db.session.add(food_cat)

        elec_cat = ProductCategory.query.filter_by(category_code="ELECTRONICS").first()
        if not elec_cat:
            elec_cat = ProductCategory(
                category_code="ELECTRONICS",
                name="Consumer Electronics",
                description="Electronic Products & Home Appliances",
                is_active=True
            )
            db.session.add(elec_cat)
        db.session.flush()

        # 3. Company (ABC Foods Pvt. Ltd.)
        company = Manufacturer.query.filter_by(registration_number="LMPC/GJ/2026/00912").first()
        if not company:
            company = Manufacturer(
                name="ABC Foods Pvt. Ltd.",
                legal_entity_name="ABC Foods Private Limited",
                registration_number="LMPC/GJ/2026/00912",
                address="Plot 42, GIDC Industrial Estate, Sanand",
                city="Ahmedabad",
                state="Gujarat",
                pin_code="382110",
                contact_email="compliance@abcfoods.com",
                contact_phone="+91-79-4001-2026",
                is_importer=False,
                is_active=True
            )
            db.session.add(company)
            db.session.flush()

        # 4. Plant (Ahmedabad Manufacturing Plant)
        plant = Plant.query.filter_by(plant_code="PLT-AHM-ABC01").first()
        if not plant:
            plant = Plant(
                company_id=company.id,
                plant_code="PLT-AHM-ABC01",
                name="Ahmedabad Manufacturing Plant",
                address="Plot 42, Sector 3, Sanand GIDC",
                city="Ahmedabad",
                state="Gujarat",
                pin_code="382110",
                jurisdiction_id=guj_jur.id,
                contact_person="Rajendra Patel (Plant Head)",
                contact_email="plant.ahmedabad@abcfoods.com",
                contact_phone="+91-79-4001-2027",
                is_active=True
            )
            db.session.add(plant)
            db.session.flush()

        # 5. Products for ABC Foods
        products_meta = [
            {
                "barcode": "8908001001001",
                "brand_name": "ABC",
                "commodity_name": "ABC Premium Biscuits 200 g",
                "package_type": "Pillow Pouch / Box",
                "default_net_quantity": "200 g",
                "default_mrp": 50.0,
                "pdp_width_cm": 12.0,
                "pdp_height_cm": 15.0,
                "category_id": food_cat.id
            },
            {
                "barcode": "8908001001002",
                "brand_name": "ABC",
                "commodity_name": "ABC Cookies 100 g",
                "package_type": "Foil Wrap",
                "default_net_quantity": "100 g",
                "default_mrp": 30.0,
                "pdp_width_cm": 10.0,
                "pdp_height_cm": 14.0,
                "category_id": food_cat.id
            },
            {
                "barcode": "8908001001003",
                "brand_name": "ABC",
                "commodity_name": "ABC Namkeen 500 g",
                "package_type": "Standup Pouch",
                "default_net_quantity": "500 g",
                "default_mrp": 120.0,
                "pdp_width_cm": 15.0,
                "pdp_height_cm": 22.0,
                "category_id": food_cat.id
            },
            {
                "barcode": "8908001001004",
                "brand_name": "ABC",
                "commodity_name": "ABC Imported Chocolate 100 g",
                "package_type": "Carton Box",
                "default_net_quantity": "100 g",
                "default_mrp": 150.0,
                "pdp_width_cm": 10.0,
                "pdp_height_cm": 18.0,
                "category_id": food_cat.id
            }
        ]

        for p_data in products_meta:
            existing_p = Product.query.filter_by(barcode=p_data["barcode"]).first()
            if not existing_p:
                prod = Product(
                    manufacturer_id=company.id,
                    category_id=p_data["category_id"],
                    brand_name=p_data["brand_name"],
                    commodity_name=p_data["commodity_name"],
                    barcode=p_data["barcode"],
                    package_type=p_data["package_type"],
                    default_net_quantity=p_data["default_net_quantity"],
                    default_mrp=p_data["default_mrp"],
                    pdp_width_cm=p_data["pdp_width_cm"],
                    pdp_height_cm=p_data["pdp_height_cm"],
                    pdp_area_cm2=round(p_data["pdp_width_cm"] * p_data["pdp_height_cm"], 1)
                )
                db.session.add(prod)
        db.session.flush()

        # 6. Users & Credentials
        users_meta = [
            {
                "email": "admin@legalmetrology.gov.in",
                "password": "Admin#2026",
                "full_name": "National Administrator",
                "role": UserRole.ADMIN,
                "badge_number": "ADMIN-NAT-01",
                "jurisdiction_district": "Central Headquarters",
                "jurisdiction_state": "Delhi",
                "company_id": None
            },
            {
                "email": "senior.gujarat@legalmetrology.gov.in",
                "password": "Senior#2026",
                "full_name": "Dr. Rameshwar Vora (Senior Officer)",
                "role": UserRole.SENIOR_OFFICER,
                "badge_number": "SO-GUJ-001",
                "jurisdiction_district": "Ahmedabad",
                "jurisdiction_state": "Gujarat",
                "company_id": None
            },
            {
                "email": "compliance@abcfoods.com",
                "password": "Abc#2026",
                "full_name": "Pooja Mehta (Compliance Lead)",
                "role": UserRole.COMPANY,
                "badge_number": "CMP-ABC-01",
                "jurisdiction_district": "Ahmedabad",
                "jurisdiction_state": "Gujarat",
                "company_id": company.id
            },
            {
                "email": "inspector.a@legalmetrology.gov.in",
                "password": "Inspector#2026",
                "full_name": "Inspector A (Gujarat - Food Qualified)",
                "role": UserRole.INSPECTOR,
                "badge_number": "INS-GUJ-001",
                "jurisdiction_district": "Ahmedabad",
                "jurisdiction_state": "Gujarat",
                "company_id": None
            },
            {
                "email": "inspector.b@legalmetrology.gov.in",
                "password": "Inspector#2026",
                "full_name": "Inspector B (Gujarat - Non-Food Qualified)",
                "role": UserRole.INSPECTOR,
                "badge_number": "INS-GUJ-002",
                "jurisdiction_district": "Ahmedabad",
                "jurisdiction_state": "Gujarat",
                "company_id": None
            },
            {
                "email": "inspector.c@legalmetrology.gov.in",
                "password": "Inspector#2026",
                "full_name": "Inspector C (Rajasthan - Food Qualified)",
                "role": UserRole.INSPECTOR,
                "badge_number": "INS-RAJ-001",
                "jurisdiction_district": "Jaipur",
                "jurisdiction_state": "Rajasthan",
                "company_id": None
            }
        ]

        created_users = {}
        for u_data in users_meta:
            user = User.query.filter_by(email=u_data["email"]).first()
            if not user:
                user = User(
                    email=u_data["email"],
                    password_hash="temp",
                    full_name=u_data["full_name"],
                    role=u_data["role"],
                    badge_number=u_data["badge_number"],
                    jurisdiction_district=u_data["jurisdiction_district"],
                    company_id=u_data["company_id"],
                    is_active=True
                )
                user.set_password(u_data["password"])
                db.session.add(user)
            else:
                user.set_password(u_data["password"])
                user.role = u_data["role"]
                user.is_active = True
                user.company_id = u_data["company_id"]
            db.session.flush()
            created_users[u_data["email"]] = user

        # 7. Configure Inspector Eligibility
        # Inspector A: Gujarat jurisdiction + Packaged Food category (ELIGIBLE)
        insp_a = created_users["inspector.a@legalmetrology.gov.in"]
        db.session.query(InspectorJurisdictionEligibility).filter_by(inspector_id=insp_a.id).delete()
        db.session.query(InspectorCategoryEligibility).filter_by(inspector_id=insp_a.id).delete()
        db.session.add(InspectorJurisdictionEligibility(inspector_id=insp_a.id, jurisdiction_id=guj_jur.id, is_active=True))
        db.session.add(InspectorCategoryEligibility(inspector_id=insp_a.id, category_id=food_cat.id, is_active=True))

        # Inspector B: Gujarat jurisdiction + Electronics ONLY (NOT Food -> INELIGIBLE)
        insp_b = created_users["inspector.b@legalmetrology.gov.in"]
        db.session.query(InspectorJurisdictionEligibility).filter_by(inspector_id=insp_b.id).delete()
        db.session.query(InspectorCategoryEligibility).filter_by(inspector_id=insp_b.id).delete()
        db.session.add(InspectorJurisdictionEligibility(inspector_id=insp_b.id, jurisdiction_id=guj_jur.id, is_active=True))
        db.session.add(InspectorCategoryEligibility(inspector_id=insp_b.id, category_id=elec_cat.id, is_active=True))

        # Inspector C: Rajasthan jurisdiction + Packaged Food (NOT Gujarat -> INELIGIBLE for Ahmedabad plant)
        insp_c = created_users["inspector.c@legalmetrology.gov.in"]
        db.session.query(InspectorJurisdictionEligibility).filter_by(inspector_id=insp_c.id).delete()
        db.session.query(InspectorCategoryEligibility).filter_by(inspector_id=insp_c.id).delete()
        db.session.add(InspectorJurisdictionEligibility(inspector_id=insp_c.id, jurisdiction_id=raj_jur.id, is_active=True))
        db.session.add(InspectorCategoryEligibility(inspector_id=insp_c.id, category_id=food_cat.id, is_active=True))

        # 8. Ensure Real Regulatory Rule Book is mapped to Packaged Food category
        rules = RegulatoryRule.query.all()
        for r in rules:
            m = RuleCategoryMapping.query.filter_by(rule_id=r.id, category_id=food_cat.id).first()
            if not m:
                db.session.add(RuleCategoryMapping(rule_id=r.id, category_id=food_cat.id, is_exempt=False))

        db.session.commit()
        print("=== E2E TEST DATASET SEEDED SUCCESSFULLY ===")

if __name__ == "__main__":
    seed_e2e_dataset()
