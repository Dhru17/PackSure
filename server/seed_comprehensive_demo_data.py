"""
PackSure — Master Comprehensive Demo & Testing Dataset Seeder
Populates rich, interconnected demonstration data across ALL four portals:
- Admin (Rules, Categories, Jurisdictions, Systemic Patterns, Impact Simulator)
- Senior Officer (Workload, Pending Reviews, Returned Cases, Systemic Intelligence, History)
- Inspector (Assigned Audits, In-Field Cases, Evidence, Declarations, Review Workspace)
- Company (Plants, Products, Document Submissions, Upcoming Audits, Audit History)
"""

import sys
import os
from datetime import datetime, timezone, timedelta, date
from werkzeug.security import generate_password_hash
from app import create_app
from seed_regulatory_rules import seed_real_regulatory_rules
from models import (
    db, User, UserRole, Manufacturer, ProductCategory, Product, Jurisdiction, Plant,
    InspectorCategoryEligibility, InspectorJurisdictionEligibility,
    InspectionCase, CaseStatus, FinalDisposition,
    PackageEvidence, OCRDetection, SurfaceType, QualityVerdict,
    Declaration, DeclarationFieldType, ExtractionMethod, VerificationStatus,
    RegulatoryRule, RuleCategoryMapping, RuleRequirement,
    ComplianceCheck, Violation, CheckStatus, ViolationSeverity, InspectorDecision, SeniorDecision,
    InspectorReview, SeniorReview, InspectorReviewAction, SeniorReviewAction,
    InspectionReport, AuditLog, AuditActionType,
    SystemicPattern, PatternStatus,
    CompanyDocument, DocumentStatus,
    Notification
)
from services.report_generator import ReportGenerator
from config import Config

def seed_comprehensive_data():
    app = create_app()
    with app.app_context():
        print("===============================================================")
        print("SEEDING COMPREHENSIVE PACKSURE DEMO DATASET ACROSS ALL MODULES")
        print("===============================================================")

        # -------------------------------------------------------------
        # 1. JURISDICTIONS
        # -------------------------------------------------------------
        print("1. Seeding Jurisdictions...")
        jur_configs = [
            {"code": "GUJ-AHM", "name": "Ahmedabad District", "state": "Gujarat", "district": "Ahmedabad", "description": "Ahmedabad Municipal & Sanand Industrial Corridor"},
            {"code": "GUJ-SUR", "name": "Surat District", "state": "Gujarat", "district": "Surat", "description": "Surat Industrial & Textile Metrology Zone"},
            {"code": "GUJ-RJK", "name": "Rajkot District", "state": "Gujarat", "district": "Rajkot", "description": "Saurashtra Regional Enforcement Zone"},
            {"code": "MAH-MUM", "name": "Mumbai Metropolitan", "state": "Maharashtra", "district": "Mumbai", "description": "Mumbai Port & Commercial Enforcement Circle"},
            {"code": "RAJ-JPR", "name": "Jaipur District", "state": "Rajasthan", "district": "Jaipur", "description": "Jaipur Metropolitan Enforcement Zone"},
            {"code": "DEL-NDL", "name": "New Delhi Central", "state": "Delhi", "district": "New Delhi", "description": "National Capital Legal Metrology Division"}
        ]
        jurisdictions = {}
        for cfg in jur_configs:
            jur = Jurisdiction.query.filter_by(code=cfg["code"]).first()
            if not jur:
                jur = Jurisdiction(
                    code=cfg["code"],
                    name=cfg["name"],
                    state=cfg["state"],
                    district=cfg["district"],
                    description=cfg["description"],
                    is_active=True
                )
                db.session.add(jur)
                db.session.flush()
            jurisdictions[cfg["code"]] = jur
        db.session.commit()

        # -------------------------------------------------------------
        # 2. PRODUCT CATEGORIES
        # -------------------------------------------------------------
        print("2. Seeding Product Categories...")
        cat_configs = [
            {"code": "PKG-FOOD", "name": "Packaged Food & Edibles", "description": "Biscuits, Confectionery, Snacks, and Packaged Commodities under Schedule II"},
            {"code": "ELECTRONICS", "name": "Consumer Electronics & Appliances", "description": "Electronic Goods, Mobile Phones, Chargers, and Home Appliances"},
            {"code": "COSMETICS", "name": "Cosmetics & Personal Care", "description": "Soaps, Shampoos, Lotions, Creams, and Toiletries"},
            {"code": "BEVERAGES", "name": "Beverages & Edible Oils", "description": "Bottled Juices, Soft Drinks, Tea, Coffee, and Edible Oils"},
            {"code": "PHARMA-OTC", "name": "Over-The-Counter Healthcare", "description": "Health Supplements, Bandages, and OTC Medical Devices"}
        ]
        categories = {}
        for cfg in cat_configs:
            cat = ProductCategory.query.filter_by(category_code=cfg["code"]).first()
            if not cat:
                cat = ProductCategory(
                    category_code=cfg["code"],
                    name=cfg["name"],
                    description=cfg["description"],
                    is_active=True
                )
                db.session.add(cat)
                db.session.flush()
            categories[cfg["code"]] = cat
        db.session.commit()

        # -------------------------------------------------------------
        # 3. STATUTORY REGULATORY RULES
        # -------------------------------------------------------------
        print("3. Seeding Official Regulatory Rule Book...")
        seed_real_regulatory_rules()

        # Fetch active rules
        all_rules = RegulatoryRule.query.filter_by(is_active=True).all()
        rule_map = {r.rule_code: r for r in all_rules}
        primary_rule = all_rules[0] if all_rules else None

        # -------------------------------------------------------------
        # 4. USERS (ADMIN, SENIOR OFFICER, INSPECTORS, COMPANY)
        # -------------------------------------------------------------
        print("4. Seeding Users across all roles...")
        users_config = [
            {
                "email": "admin@legalmetrology.gov.in",
                "password": "Admin#2026",
                "name": "Dr. Rajesh Sharma (Director General)",
                "role": UserRole.ADMIN,
                "district": "New Delhi",
                "badge_number": "LM-HQ-001"
            },
            {
                "email": "senior.gujarat@legalmetrology.gov.in",
                "password": "Senior#2026",
                "name": "Vikram Desai (Senior Controller)",
                "role": UserRole.SENIOR_OFFICER,
                "district": "Ahmedabad",
                "badge_number": "LM-SR-GJ-101"
            },
            {
                "email": "senior@legalmetrology.gov.in",
                "password": "Senior#2026",
                "name": "Vikram Desai (Senior Controller)",
                "role": UserRole.SENIOR_OFFICER,
                "district": "Ahmedabad",
                "badge_number": "LM-SR-GJ-100"
            },
            {
                "email": "inspector.gujarat@legalmetrology.gov.in",
                "password": "Inspector#2026",
                "name": "Priya Mehta (Legal Metrology Officer)",
                "role": UserRole.INSPECTOR,
                "district": "Ahmedabad",
                "badge_number": "LMO-GJ-4042"
            },
            {
                "email": "inspector@legalmetrology.gov.in",
                "password": "Inspector#2026",
                "name": "Priya Mehta (Legal Metrology Officer)",
                "role": UserRole.INSPECTOR,
                "district": "Ahmedabad",
                "badge_number": "LMO-GJ-4040"
            },
            {
                "email": "inspector.surat@legalmetrology.gov.in",
                "password": "Inspector#2026",
                "name": "Amit Patel (Field Inspector)",
                "role": UserRole.INSPECTOR,
                "district": "Surat",
                "badge_number": "LMO-GJ-5089"
            },
            {
                "email": "compliance@abcfoods.com",
                "password": "Company#2026",
                "name": "Ananya Sen (Compliance Head - ABC Foods)",
                "role": UserRole.COMPANY,
                "district": "Ahmedabad",
                "badge_number": "CORP-ABC-01"
            },
            {
                "email": "compliance@britannia.co.in",
                "password": "Company#2026",
                "name": "Rajesh Nambiar (Regulatory Compliance Manager)",
                "role": UserRole.COMPANY,
                "district": "Ahmedabad",
                "badge_number": "CORP-BRIT-01"
            }
        ]

        users = {}
        for u_cfg in users_config:
            u = User.query.filter_by(email=u_cfg["email"]).first()
            if not u:
                u = User(
                    email=u_cfg["email"],
                    full_name=u_cfg["name"],
                    role=u_cfg["role"],
                    jurisdiction_district=u_cfg["district"],
                    badge_number=u_cfg["badge_number"],
                    is_active=True
                )
                db.session.add(u)
                db.session.flush()
            else:
                u.full_name = u_cfg["name"]
                u.role = u_cfg["role"]
                u.jurisdiction_district = u_cfg["district"]
                u.badge_number = u_cfg["badge_number"]
                u.is_active = True
            u.set_password(u_cfg["password"])
            users[u_cfg["email"]] = u
        db.session.commit()

        # Set Inspector Category & Jurisdiction Eligibility
        insp_priya = users["inspector.gujarat@legalmetrology.gov.in"]
        for cat_key in ["PKG-FOOD", "ELECTRONICS", "BEVERAGES"]:
            cat_obj = categories.get(cat_key)
            if cat_obj and not InspectorCategoryEligibility.query.filter_by(inspector_id=insp_priya.id, category_id=cat_obj.id).first():
                db.session.add(InspectorCategoryEligibility(inspector_id=insp_priya.id, category_id=cat_obj.id, is_active=True))

        for jur_key in ["GUJ-AHM", "GUJ-SUR"]:
            jur_obj = jurisdictions.get(jur_key)
            if jur_obj and not InspectorJurisdictionEligibility.query.filter_by(inspector_id=insp_priya.id, jurisdiction_id=jur_obj.id).first():
                db.session.add(InspectorJurisdictionEligibility(inspector_id=insp_priya.id, jurisdiction_id=jur_obj.id, is_active=True))
        db.session.commit()

        # -------------------------------------------------------------
        # 5. COMPANIES & PLANTS
        # -------------------------------------------------------------
        print("5. Seeding Companies and Manufacturing Plants...")
        companies_data = [
            {
                "reg": "LMPC/GJ/2026/00912",
                "name": "ABC Foods Pvt. Ltd.",
                "legal": "ABC Foods Private Limited",
                "email": "compliance@abcfoods.com",
                "city": "Ahmedabad",
                "state": "Gujarat",
                "importer": False,
                "plants": [
                    {"name": "Sanand Automated Packaging Plant", "code": "PLANT-SANAND-01", "city": "Ahmedabad", "state": "Gujarat", "jur": "GUJ-AHM"},
                    {"name": "Naroda Confectionery Unit", "code": "PLANT-NARODA-02", "city": "Ahmedabad", "state": "Gujarat", "jur": "GUJ-AHM"}
                ]
            },
            {
                "reg": "LMPC/GJ/2025/00112",
                "name": "Britannia Industries Ltd.",
                "legal": "Britannia Industries Limited",
                "email": "compliance@britannia.co.in",
                "city": "Ahmedabad",
                "state": "Gujarat",
                "importer": False,
                "plants": [
                    {"name": "Ahmedabad Bakery Unit", "code": "PLANT-BRIT-AHM-01", "city": "Ahmedabad", "state": "Gujarat", "jur": "GUJ-AHM"}
                ]
            },
            {
                "reg": "LMPC/GJ/2025/00431",
                "name": "XYZ Consumer Brands Ltd.",
                "legal": "XYZ Consumer Products India Limited",
                "email": "regulatory@xyzbrands.com",
                "city": "Surat",
                "state": "Gujarat",
                "importer": True,
                "plants": [
                    {"name": "Surat Edible Oils Facility", "code": "PLANT-SURAT-01", "city": "Surat", "state": "Gujarat", "jur": "GUJ-SUR"}
                ]
            },
            {
                "reg": "LMPC/MH/2026/00115",
                "name": "PQR Industries Ltd.",
                "legal": "PQR Agro & Beverage Industries Limited",
                "email": "compliance@pqrind.com",
                "city": "Mumbai",
                "state": "Maharashtra",
                "importer": False,
                "plants": [
                    {"name": "Bhiwandi Packaging Hub", "code": "PLANT-BHIWANDI-01", "city": "Mumbai", "state": "Maharashtra", "jur": "MAH-MUM"}
                ]
            }
        ]

        mfg_map = {}
        plant_map = {}
        for c_data in companies_data:
            mfg = Manufacturer.query.filter_by(registration_number=c_data["reg"]).first()
            if not mfg:
                mfg = Manufacturer(
                    name=c_data["name"],
                    legal_entity_name=c_data["legal"],
                    registration_number=c_data["reg"],
                    address=f"Plot 101, Industrial Area, {c_data['city']}",
                    city=c_data["city"],
                    state=c_data["state"],
                    pin_code="380015",
                    contact_email=c_data["email"],
                    contact_phone="+91-79-2680-1122",
                    is_importer=c_data["importer"],
                    is_active=True
                )
                db.session.add(mfg)
                db.session.flush()
            mfg_map[c_data["name"]] = mfg

            # Link Company Users to their company profiles
            if c_data["name"] == "ABC Foods Pvt. Ltd.":
                u_comp = users.get("compliance@abcfoods.com")
                if u_comp:
                    u_comp.company_id = mfg.id
            elif c_data["name"] == "Britannia Industries Ltd.":
                u_brit = users.get("compliance@britannia.co.in")
                if u_brit:
                    u_brit.company_id = mfg.id

            # Add Plants
            for p_info in c_data["plants"]:
                plant = Plant.query.filter_by(plant_code=p_info["code"]).first()
                if not plant:
                    jur = jurisdictions.get(p_info["jur"])
                    plant = Plant(
                        company_id=mfg.id,
                        jurisdiction_id=jur.id if jur else None,
                        name=p_info["name"],
                        plant_code=p_info["code"],
                        address=f"GIDC Industrial Zone, {p_info['city']}",
                        city=p_info["city"],
                        state=p_info["state"],
                        pin_code="382170",
                        contact_person="Plant Operations Manager",
                        contact_email=mfg.contact_email,
                        is_active=True
                    )
                    db.session.add(plant)
                    db.session.flush()
                plant_map[p_info["code"]] = plant
        db.session.commit()

        # -------------------------------------------------------------
        # 6. COMPANY STATUTORY DOCUMENTS
        # -------------------------------------------------------------
        print("6. Seeding Company Statutory Documents...")
        abc_mfg = mfg_map.get("ABC Foods Pvt. Ltd.")
        brit_mfg = mfg_map.get("Britannia Industries Ltd.")
        sanand_plant = plant_map.get("PLANT-SANAND-01")
        brit_plant = plant_map.get("PLANT-BRIT-AHM-01")

        doc_configs = [
            # ABC Foods Documents
            {"company": abc_mfg, "plant": sanand_plant, "type": "LMPC_CERTIFICATE", "title": "Legal Metrology Rule 27 Pre-Packer Registration", "num": "LMPC/REG/GJ/2026/00912", "status": DocumentStatus.VERIFIED, "notes": "Registered manufacturer and packer of edible products under LMPC 2011."},
            {"company": abc_mfg, "plant": sanand_plant, "type": "FSSAI_LICENSE", "title": "FSSAI Central Manufacturing License", "num": "FSSAI-10019021004812", "status": DocumentStatus.VERIFIED, "notes": "FSSAI License valid up to 31-Dec-2028 for bakery & snack products."},
            {"company": abc_mfg, "plant": sanand_plant, "type": "POLLUTION_CONSENT", "title": "Gujarat Pollution Control Board Consent (CC&A)", "num": "GPCB/CCA/AHM/2025/1102", "status": DocumentStatus.VERIFIED, "notes": "Consent to operate industrial packaging line in Sanand."},
            {"company": abc_mfg, "plant": sanand_plant, "type": "FACTORY_LICENSE", "title": "Chief Inspector of Factories Operating License", "num": "CIF/GJ/2026/4401", "status": DocumentStatus.PENDING_VERIFICATION, "notes": "Annual renewal submitted; awaiting supervisory verification."},
            {"company": abc_mfg, "plant": sanand_plant, "type": "WEIGHTS_MEASURES", "title": "Legal Metrology Verification of Check-Weigher Scales", "num": "LM/VER/AHM/2026/089", "status": DocumentStatus.VERIFIED, "notes": "Calibrated electronic weighing scale valid until Nov 2026."},
            
            # Britannia Industries Documents
            {"company": brit_mfg, "plant": brit_plant, "type": "LMPC_CERTIFICATE", "title": "LMPC Rule 27 Pre-Packer Certificate", "num": "LMPC/REG/GJ/2025/00112", "status": DocumentStatus.VERIFIED, "notes": "Authorized manufacturer and packer of biscuits and bakery commodities."},
            {"company": brit_mfg, "plant": brit_plant, "type": "FSSAI_LICENSE", "title": "FSSAI Central License - Ahmedabad Bakery", "num": "FSSAI-10012021001199", "status": DocumentStatus.VERIFIED, "notes": "Central FSSAI manufacturing license for biscuit product lines."}
        ]

        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)

        for d_cfg in doc_configs:
            comp_obj = d_cfg["company"]
            if not comp_obj:
                continue
            existing_doc = CompanyDocument.query.filter_by(company_id=comp_obj.id, document_type=d_cfg["type"]).first()
            if not existing_doc:
                doc = CompanyDocument(
                    company_id=comp_obj.id,
                    plant_id=d_cfg["plant"].id if d_cfg["plant"] else None,
                    document_type=d_cfg["type"],
                    title=d_cfg["title"],
                    document_number=d_cfg["num"],
                    status=d_cfg["status"],
                    file_url=f"/uploads/documents/{comp_obj.id}_{d_cfg['type'].lower()}.pdf",
                    notes=d_cfg["notes"],
                    created_at=datetime.now(timezone.utc) - timedelta(days=15)
                )
                db.session.add(doc)
                db.session.flush()
                existing_doc = doc

            # Pre-generate valid PDF certificate file on disk
            pdf_fname = f"statutory_cert_{existing_doc.id}.pdf"
            pdf_path = os.path.join(Config.UPLOAD_FOLDER, pdf_fname)
            ReportGenerator.generate_statutory_certificate_pdf(existing_doc.to_dict(), pdf_path)

            named_pdf = f"{comp_obj.id}_{d_cfg['type'].lower()}.pdf"
            named_path = os.path.join(Config.UPLOAD_FOLDER, named_pdf)
            ReportGenerator.generate_statutory_certificate_pdf(existing_doc.to_dict(), named_path)

        db.session.commit()

        # -------------------------------------------------------------
        # 7. PRODUCTS CATALOG
        # -------------------------------------------------------------
        print("7. Seeding Products Catalog...")
        products_data = [
            {
                "mfg": "ABC Foods Pvt. Ltd.",
                "cat": "PKG-FOOD",
                "barcode": "8901030881201",
                "brand": "ABC Master",
                "name": "ABC Premium Butter Cookies 200 g",
                "package_type": "BOX",
                "net_qty": "200 g",
                "mrp": 45.0,
                "pdp_w": 18.0, "pdp_h": 12.0, "pdp_area": 216.0
            },
            {
                "mfg": "ABC Foods Pvt. Ltd.",
                "cat": "PKG-FOOD",
                "barcode": "8901030881202",
                "brand": "ABC Delight",
                "name": "ABC Digestive Oats Biscuits 100 g",
                "package_type": "POUCH",
                "net_qty": "100 g",
                "mrp": 25.0,
                "pdp_w": 14.0, "pdp_h": 10.0, "pdp_area": 140.0
            },
            {
                "mfg": "ABC Foods Pvt. Ltd.",
                "cat": "PKG-FOOD",
                "barcode": "8901030881203",
                "brand": "ABC Crispy",
                "name": "ABC Spicy Aloo Bhujia Namkeen 500 g",
                "package_type": "POUCH",
                "net_qty": "500 g",
                "mrp": 120.0,
                "pdp_w": 22.0, "pdp_h": 16.0, "pdp_area": 352.0
            },
            {
                "mfg": "ABC Foods Pvt. Ltd.",
                "cat": "PKG-FOOD",
                "barcode": "8901030881204",
                "brand": "ABC Royal",
                "name": "ABC Imported Dark Chocolate 100 g",
                "package_type": "BOX",
                "net_qty": "100 g",
                "mrp": 175.0,
                "is_imported": True,
                "coo": "Switzerland",
                "pdp_w": 15.0, "pdp_h": 8.0, "pdp_area": 120.0
            },
            {
                "mfg": "XYZ Consumer Brands Ltd.",
                "cat": "BEVERAGES",
                "barcode": "8902040992301",
                "brand": "XYZ Gold",
                "name": "XYZ Refined Sunflower Oil 1 L",
                "package_type": "BOTTLE",
                "net_qty": "1 L",
                "mrp": 160.0,
                "pdp_w": 12.0, "pdp_h": 20.0, "pdp_area": 240.0
            },
            {
                "mfg": "PQR Industries Ltd.",
                "cat": "BEVERAGES",
                "barcode": "8903050113401",
                "brand": "PQR Pure",
                "name": "PQR Almond Health Drink 250 ml",
                "package_type": "TETRA_PAK",
                "net_qty": "250 ml",
                "mrp": 35.0,
                "pdp_w": 10.0, "pdp_h": 15.0, "pdp_area": 150.0
            }
        ]

        products = {}
        for p_cfg in products_data:
            prod = Product.query.filter_by(barcode=p_cfg["barcode"]).first()
            if not prod:
                mfg_obj = mfg_map[p_cfg["mfg"]]
                cat_obj = categories[p_cfg["cat"]]
                prod = Product(
                    manufacturer_id=mfg_obj.id,
                    category_id=cat_obj.id,
                    barcode=p_cfg["barcode"],
                    brand_name=p_cfg["brand"],
                    commodity_name=p_cfg["name"],
                    package_type=p_cfg["package_type"],
                    default_net_quantity=p_cfg["net_qty"],
                    default_mrp=p_cfg["mrp"],
                    is_imported=p_cfg.get("is_imported", False),
                    country_of_origin=p_cfg.get("coo", "India"),
                    pdp_width_cm=p_cfg["pdp_w"],
                    pdp_height_cm=p_cfg["pdp_h"],
                    pdp_area_cm2=p_cfg["pdp_area"]
                )
                db.session.add(prod)
                db.session.flush()
            products[p_cfg["barcode"]] = prod
        db.session.commit()

        # -------------------------------------------------------------
        # 8. INSPECTION CASES ACROSS ALL STATUSES
        # -------------------------------------------------------------
        print("8. Seeding Inspection Cases across multiple lifecycle stages...")
        senior_vikram = users["senior.gujarat@legalmetrology.gov.in"]
        insp_priya = users["inspector.gujarat@legalmetrology.gov.in"]
        sanand_plant = plant_map["PLANT-SANAND-01"]
        naroda_plant = plant_map["PLANT-NARODA-02"]

        cases_config = [
            # Case 1: FINALIZED COMPLIANT
            {
                "case_num": "PS-2026-GJ-00101",
                "product_barcode": "8901030881201",
                "status": CaseStatus.FINALIZED,
                "final_decision": FinalDisposition.COMPLIANT,
                "passed_checks": 7,
                "failed_checks": 0,
                "compliance_score": 100.0,
                "plant": sanand_plant,
                "created_days_ago": 20,
                "senior_remarks": "Fully compliant with Legal Metrology (Packaged Commodities) Rules 2011. Clean digital clearance granted."
            },
            # Case 2: FINALIZED WITH STATUTORY VIOLATION
            {
                "case_num": "PS-2026-GJ-00102",
                "product_barcode": "8901030881203",
                "status": CaseStatus.FINALIZED,
                "final_decision": FinalDisposition.NON_COMPLIANT,
                "passed_checks": 5,
                "failed_checks": 2,
                "compliance_score": 71.4,
                "plant": sanand_plant,
                "created_days_ago": 12,
                "senior_remarks": "Statutory non-compliance confirmed under Rule 6(1) (Missing Consumer Care Helpline). Statutory compounding notice issued."
            },
            # Case 3: PENDING SENIOR REVIEW
            {
                "case_num": "PS-2026-GJ-00103",
                "product_barcode": "8901030881202",
                "status": CaseStatus.SENIOR_REVIEW,
                "passed_checks": 6,
                "failed_checks": 1,
                "review_required_checks": 0,
                "compliance_score": 85.7,
                "plant": naroda_plant,
                "created_days_ago": 2,
                "inspector_remarks": "Physical packaging sampled from plant packaging line. PDP font height measured at 1.8mm against required 2.0mm."
            },
            # Case 4: RETURNED TO INSPECTOR
            {
                "case_num": "PS-2026-GJ-00104",
                "product_barcode": "8901030881204",
                "status": CaseStatus.RETURNED,
                "passed_checks": 4,
                "failed_checks": 1,
                "review_required_checks": 1,
                "compliance_score": 66.7,
                "plant": sanand_plant,
                "created_days_ago": 4,
                "inspector_remarks": "Imported chocolate packaging evidence captured.",
                "senior_remarks": "Please re-examine the back panel importer sticker. Ensure Importer License number and Country of Origin font height are accurately measured."
            },
            # Case 5: TO VERIFY / INSPECTOR REVIEW
            {
                "case_num": "PS-2026-GJ-00105",
                "product_barcode": "8901030881201",
                "status": CaseStatus.INSPECTOR_REVIEW,
                "passed_checks": 6,
                "failed_checks": 1,
                "review_required_checks": 1,
                "compliance_score": 75.0,
                "plant": sanand_plant,
                "created_days_ago": 1,
                "inspector_remarks": "Automated OCR extraction complete. Ready for field inspector verification of declarations."
            },
            # Case 6: UPCOMING MANDATED AUDIT
            {
                "case_num": "PS-2026-GJ-00106",
                "product_barcode": "8901030881203",
                "status": CaseStatus.DRAFT,
                "scheduled_date": datetime.now(timezone.utc) + timedelta(days=3),
                "plant": sanand_plant,
                "created_days_ago": 0,
                "senior_remarks": "Scheduled statutory surveillance audit for packaged Namkeen batch weights & declarations."
            },
            # Case 7: UPCOMING MANDATED AUDIT #2
            {
                "case_num": "PS-2026-GJ-00107",
                "product_barcode": "8901030881204",
                "status": CaseStatus.DRAFT,
                "scheduled_date": datetime.now(timezone.utc) + timedelta(days=7),
                "plant": naroda_plant,
                "created_days_ago": 0,
                "senior_remarks": "Scheduled plant audit for imported confectionery consignments."
            }
        ]

        for c_cfg in cases_config:
            ic = InspectionCase.query.filter_by(case_number=c_cfg["case_num"]).first()
            prod = products[c_cfg["product_barcode"]]
            if not ic:
                ic = InspectionCase(
                    case_number=c_cfg["case_num"],
                    product_id=prod.id,
                    plant_id=c_cfg["plant"].id,
                    inspector_id=insp_priya.id,
                    senior_reviewer_id=senior_vikram.id,
                    status=c_cfg["status"],
                    final_decision=c_cfg.get("final_decision"),
                    scheduled_date=c_cfg.get("scheduled_date"),
                    scheduled_by_id=senior_vikram.id if c_cfg.get("scheduled_date") else None,
                    location_name=f"{c_cfg['plant'].name}, {c_cfg['plant'].city}",
                    source_type="FACTORY_AUDIT",
                    passed_checks=c_cfg.get("passed_checks", 0),
                    failed_checks=c_cfg.get("failed_checks", 0),
                    review_required_checks=c_cfg.get("review_required_checks", 0),
                    compliance_score=c_cfg.get("compliance_score", 0.0),
                    inspector_remarks=c_cfg.get("inspector_remarks"),
                    senior_remarks=c_cfg.get("senior_remarks"),
                    created_at=datetime.now(timezone.utc) - timedelta(days=c_cfg["created_days_ago"]),
                    updated_at=datetime.now(timezone.utc) - timedelta(hours=c_cfg["created_days_ago"] * 6)
                )
                db.session.add(ic)
                db.session.flush()

                # Add Package Evidence, Declarations, Checks for active/finalized cases
                if c_cfg["status"] != CaseStatus.DRAFT:
                    # Evidence
                    ev1 = PackageEvidence(
                        case_id=ic.id,
                        surface_type=SurfaceType.FRONT,
                        storage_path=f"uploads/evidence/{ic.id}_front.jpg",
                        original_filename=f"{c_cfg['case_num']}_front_pdp.jpg",
                        mime_type="image/jpeg",
                        width_px=1920,
                        height_px=1080,
                        quality_verdict=QualityVerdict.READABLE
                    )
                    ev2 = PackageEvidence(
                        case_id=ic.id,
                        surface_type=SurfaceType.BACK,
                        storage_path=f"uploads/evidence/{ic.id}_back.jpg",
                        original_filename=f"{c_cfg['case_num']}_back_panel.jpg",
                        mime_type="image/jpeg",
                        width_px=1920,
                        height_px=1080,
                        quality_verdict=QualityVerdict.READABLE
                    )
                    db.session.add_all([ev1, ev2])
                    db.session.flush()

                    # Declarations
                    dec_mrp = Declaration(
                        case_id=ic.id,
                        evidence_id=ev1.id,
                        field_type=DeclarationFieldType.MRP,
                        title="Maximum Retail Price (MRP)",
                        raw_ocr_text=f"MRP Rs. {prod.default_mrp:.2f} (incl. of all taxes)",
                        extracted_value=f"MRP Rs. {prod.default_mrp:.2f} (incl. of all taxes)",
                        normalized_value=str(prod.default_mrp),
                        confidence=0.98,
                        extraction_method=ExtractionMethod.OCR_TOKEN_MATCHER,
                        verification_status=VerificationStatus.VERIFIED,
                        font_height_mm=3.2
                    )
                    dec_qty = Declaration(
                        case_id=ic.id,
                        evidence_id=ev1.id,
                        field_type=DeclarationFieldType.NET_QUANTITY,
                        title="Net Quantity",
                        raw_ocr_text=f"Net Qty: {prod.default_net_quantity}",
                        extracted_value=f"Net Qty: {prod.default_net_quantity}",
                        normalized_value=prod.default_net_quantity,
                        confidence=0.96,
                        extraction_method=ExtractionMethod.OCR_TOKEN_MATCHER,
                        verification_status=VerificationStatus.VERIFIED,
                        font_height_mm=3.0
                    )
                    dec_cc = Declaration(
                        case_id=ic.id,
                        evidence_id=ev2.id,
                        field_type=DeclarationFieldType.CONSUMER_CARE_EMAIL,
                        title="Consumer Care Helpline",
                        raw_ocr_text="Toll Free: 1800-425-2026 | Email: care@abcfoods.com",
                        extracted_value="care@abcfoods.com",
                        normalized_value="care@abcfoods.com",
                        confidence=0.94,
                        extraction_method=ExtractionMethod.OCR_TOKEN_MATCHER,
                        verification_status=VerificationStatus.VERIFIED,
                        font_height_mm=2.1
                    )
                    db.session.add_all([dec_mrp, dec_qty, dec_cc])
                    db.session.flush()

                    # Compliance Checks
                    if primary_rule:
                        chk1 = ComplianceCheck(
                            case_id=ic.id,
                            rule_id=primary_rule.id,
                            status=CheckStatus.PASS,
                            confidence=0.98,
                            reason_explanation="MRP format contains statutory prefix and tax-inclusive declaration.",
                            evaluated_value=f"Rs. {prod.default_mrp:.2f}",
                            expected_condition="MRP declared in INR inclusive of all taxes"
                        )
                        
                        is_viol_case = (c_cfg["case_num"] in ["PS-2026-GJ-00102", "PS-2026-GJ-00104"])
                        chk2 = ComplianceCheck(
                            case_id=ic.id,
                            rule_id=primary_rule.id,
                            status=CheckStatus.FAIL if is_viol_case else CheckStatus.PASS,
                            confidence=0.95,
                            reason_explanation="Consumer Care contact missing complete physical postal address." if is_viol_case else "Consumer care email, telephone and postal address verified.",
                            evaluated_value="Email only" if is_viol_case else "Phone + Email + Address",
                            expected_condition="Telephone, Email, and Physical Postal Address"
                        )

                        db.session.add_all([chk1, chk2])
                        db.session.flush()

                        if is_viol_case:
                            viol = Violation(
                                case_id=ic.id,
                                check_id=chk2.id,
                                rule_code=primary_rule.rule_code,
                                violation_title="Missing Physical Grievance Redressal Postal Address",
                                description="Consumer care declaration does not contain manufacturer physical grievance address.",
                                severity=ViolationSeverity.HIGH,
                                evidence_image_id=ev2.id,
                                inspector_decision=InspectorDecision.ACCEPTED,
                                senior_decision=SeniorDecision.CONFIRMED
                            )
                            db.session.add(viol)

                    # Inspection Report if finalized
                    if c_cfg["status"] == CaseStatus.FINALIZED:
                        rep = InspectionReport(
                            case_id=ic.id,
                            report_number=f"REP-{c_cfg['case_num']}",
                            storage_path=f"/reports/{c_cfg['case_num']}_report.pdf",
                            file_size_bytes=142850,
                            generated_by_id=senior_vikram.id,
                            generated_at=datetime.now(timezone.utc) - timedelta(days=c_cfg["created_days_ago"] - 1)
                        )
                        db.session.add(rep)
        db.session.commit()

        # -------------------------------------------------------------
        # 9. SYSTEMIC PATTERNS (INNOVATION #5)
        # -------------------------------------------------------------
        print("9. Seeding Systemic Violation Intelligence Patterns...")
        patterns_data = [
            {
                "code": "PAT-2026-ABC-01",
                "mfg_name": "ABC Foods Pvt. Ltd.",
                "rule_code": primary_rule.rule_code if primary_rule else "RULE_6_MANDATORY_DECLARATIONS",
                "citation": primary_rule.statutory_citation if primary_rule else "Rule 6(1)(h) of LM(PC) Rules 2011",
                "title": "Recurring Missing Consumer Care Physical Address across Biscuits Category",
                "description": "Multi-product surveillance detected recurring omission of complete manufacturer physical grievance address on 4 distinct cookie & biscuit SKU labels.",
                "severity": "HIGH",
                "status": PatternStatus.CONFIRMED_PATTERN,
                "confidence": 0.94,
                "affected_count": 4,
                "products_json": '["ABC Premium Butter Cookies 200 g", "ABC Digestive Oats Biscuits 100 g", "ABC Spicy Aloo Bhujia Namkeen 500 g", "ABC Royal Chocolate 100 g"]',
                "notes": "Supervisory order issued: Enterprise directed to update packaging cylinders within 30 days."
            },
            {
                "code": "PAT-2026-XYZ-02",
                "mfg_name": "XYZ Consumer Brands Ltd.",
                "rule_code": primary_rule.rule_code if primary_rule else "RULE_6_MANDATORY_DECLARATIONS",
                "citation": "Rule 7 read with Table 1 of LM(PC) Rules 2011",
                "title": "Sub-Calibrated Font Height on Edible Oil Principal Display Panels",
                "description": "Systemic aggregation detected font heights under 2.0 mm on 1L and 5L edible oil containers against statutory 4.0 mm requirement.",
                "severity": "MEDIUM",
                "status": PatternStatus.UNDER_REVIEW,
                "confidence": 0.88,
                "affected_count": 2,
                "products_json": '["XYZ Refined Sunflower Oil 1 L", "XYZ Mustard Oil 5 L"]',
                "notes": "Under review by Senior Controller for Surat jurisdiction."
            },
            {
                "code": "PAT-2026-PQR-03",
                "mfg_name": "PQR Industries Ltd.",
                "rule_code": primary_rule.rule_code if primary_rule else "RULE_6_MANDATORY_DECLARATIONS",
                "citation": "Rule 6(1)(e) of LM(PC) Rules 2011",
                "title": "Inconsistent Month/Year Pre-packing Format across Beverage Line",
                "description": "Non-standard month formatting detected across Tetra Pak packaging lines.",
                "severity": "LOW",
                "status": PatternStatus.NEW,
                "confidence": 0.82,
                "affected_count": 2,
                "products_json": '["PQR Almond Health Drink 250 ml", "PQR Mango Beverage 200 ml"]',
                "notes": "Awaiting initial supervisory determination."
            }
        ]

        for p_cfg in patterns_data:
            mfg_obj = mfg_map[p_cfg["mfg_name"]]
            existing_pat = SystemicPattern.query.filter_by(pattern_code=p_cfg["code"]).first()
            if not existing_pat:
                pat = SystemicPattern(
                    pattern_code=p_cfg["code"],
                    pattern_type="BRAND_WIDE_DEFECT",
                    manufacturer_id=mfg_obj.id,
                    rule_code=p_cfg["rule_code"],
                    rule_citation=p_cfg["citation"],
                    title=p_cfg["title"],
                    description=p_cfg["description"],
                    severity=p_cfg["severity"],
                    confidence_score=p_cfg["confidence"],
                    occurrence_count=p_cfg["affected_count"],
                    affected_products_count=p_cfg["affected_count"],
                    affected_product_names_json=p_cfg["products_json"],
                    status=p_cfg["status"],
                    first_detected_at=datetime.now(timezone.utc) - timedelta(days=7),
                    senior_officer_notes=p_cfg["notes"]
                )
                db.session.add(pat)
        db.session.commit()

        # -------------------------------------------------------------
        # 10. SYSTEM NOTIFICATIONS
        # -------------------------------------------------------------
        print("10. Seeding System Notifications...")
        Notification.query.delete()
        db.session.commit()

        abc_mfg = mfg_map.get("ABC Foods Pvt. Ltd.")
        brit_mfg = mfg_map.get("Britannia Industries Ltd.")

        notif_configs = [
            # Senior Officer Notifications
            {
                "user": users.get("senior.gujarat@legalmetrology.gov.in"),
                "company_id": None,
                "title": "New Inspection Submitted for Review",
                "message": "Inspector Priya Mehta submitted Case #PS-2026-GJ-00103 (ABC Digestive Biscuits) for supervisory determination.",
                "type": "REVIEW_SUBMITTED"
            },
            {
                "user": users.get("senior@legalmetrology.gov.in"),
                "company_id": None,
                "title": "New Inspection Submitted for Review",
                "message": "Inspector Priya Mehta submitted Case #PS-2026-GJ-00103 (ABC Digestive Biscuits) for supervisory determination.",
                "type": "REVIEW_SUBMITTED"
            },
            {
                "user": users.get("senior.gujarat@legalmetrology.gov.in"),
                "company_id": None,
                "title": "Systemic Pattern Alert Flagged",
                "message": "Recurring Consumer Care non-compliance detected across 4 SKUs of ABC Foods Pvt. Ltd.",
                "type": "SYSTEMIC_ALERT"
            },

            # Inspector Notifications
            {
                "user": users.get("inspector.gujarat@legalmetrology.gov.in"),
                "company_id": None,
                "title": "Upcoming Mandated Audit Assigned",
                "message": "Senior Officer Vikram Desai scheduled plant audit #PS-2026-GJ-00106 at Sanand Plant.",
                "type": "AUDIT_SCHEDULED"
            },
            {
                "user": users.get("inspector@legalmetrology.gov.in"),
                "company_id": None,
                "title": "Upcoming Mandated Audit Assigned",
                "message": "Senior Officer Vikram Desai scheduled plant audit #PS-2026-GJ-00106 at Sanand Plant.",
                "type": "AUDIT_SCHEDULED"
            },
            {
                "user": users.get("inspector.gujarat@legalmetrology.gov.in"),
                "company_id": None,
                "title": "Case Returned for Reinspection",
                "message": "Case #PS-2026-GJ-00104 returned with supervisory instructions on imported labels.",
                "type": "CASE_RETURNED"
            },

            # Company: ABC Foods Pvt. Ltd.
            {
                "user": users.get("compliance@abcfoods.com"),
                "company_id": abc_mfg.id if abc_mfg else None,
                "title": "Upcoming Plant Compliance Audit (Case #PS-2026-GJ-00106)",
                "message": "Statutory surveillance audit scheduled on Sanand Automated Packaging Plant on October 15, 2026.",
                "type": "AUDIT_SCHEDULED"
            },
            {
                "user": users.get("compliance@abcfoods.com"),
                "company_id": abc_mfg.id if abc_mfg else None,
                "title": "Finalized Compliance Certificate Issued",
                "message": "Legal Metrology verification complete for ABC Premium Butter Cookies (Case #PS-2026-GJ-00101). Final disposition: PASS.",
                "type": "REPORT_FINALIZED"
            },
            {
                "user": users.get("compliance@abcfoods.com"),
                "company_id": abc_mfg.id if abc_mfg else None,
                "title": "Statutory Document Verified",
                "message": "LMPC Pre-Packer Certificate (#LMPC/GJ/2026/00912) has been officially verified by the Legal Metrology Department.",
                "type": "DOCUMENT_VERIFIED"
            },
            {
                "user": users.get("compliance@abcfoods.com"),
                "company_id": abc_mfg.id if abc_mfg else None,
                "title": "Regulatory Notice: Annual Verification Renewal",
                "message": "Annual reverification of digital check-weighers and net quantity filling equipment is due within 30 days.",
                "type": "WARNING"
            },
            {
                "user": users.get("compliance@abcfoods.com"),
                "company_id": abc_mfg.id if abc_mfg else None,
                "title": "Advisory: Schedule II Mandatory Font Height",
                "message": "Department advisory regarding mandatory font heights for Net Quantity and MRP declarations under Rule 6(1)(e).",
                "type": "GENERAL"
            },

            # Company: Britannia Industries Ltd.
            {
                "user": users.get("compliance@britannia.co.in"),
                "company_id": brit_mfg.id if brit_mfg else None,
                "title": "Upcoming Factory Surveillance Audit",
                "message": "Annual statutory audit scheduled for Ahmedabad Bakery Unit under Jurisdiction GUJ-AHM.",
                "type": "AUDIT_SCHEDULED"
            },
            {
                "user": users.get("compliance@britannia.co.in"),
                "company_id": brit_mfg.id if brit_mfg else None,
                "title": "Compliance Certificate Issued",
                "message": "Finalized verification report generated for Good Day Butter Cookies (Compliance Score: 98%).",
                "type": "REPORT_FINALIZED"
            },
            {
                "user": users.get("compliance@britannia.co.in"),
                "company_id": brit_mfg.id if brit_mfg else None,
                "title": "LMPC Registration Certificate Validated",
                "message": "Pre-Packer Manufacturer Registration LMPC/GJ/2025/00112 validated by Controller of Legal Metrology.",
                "type": "DOCUMENT_VERIFIED"
            }
        ]

        for n_cfg in notif_configs:
            if not n_cfg["user"]:
                continue
            notif = Notification(
                user_id=n_cfg["user"].id,
                company_id=n_cfg["company_id"],
                title=n_cfg["title"],
                message=n_cfg["message"],
                notification_type=n_cfg["type"],
                is_read=False,
                created_at=datetime.now(timezone.utc) - timedelta(hours=2)
            )
            db.session.add(notif)
        db.session.commit()

        print("===============================================================")
        print("MASTER DEMO DATASET SEEDED SUCCESSFULLY WITH ZERO ERRORS!")
        print("===============================================================")

if __name__ == "__main__":
    seed_comprehensive_data()
