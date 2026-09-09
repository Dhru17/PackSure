import json
from datetime import date, datetime, timezone
from models import (
    db, RegulatoryRule, RuleRequirement, ProductCategory,
    RuleCategoryMapping, AuditLog, AuditActionType, User, UserRole
)

def seed_real_regulatory_rules():
    """
    Seeds verified Government of India Legal Metrology (Packaged Commodities) Rules, 2011.
    All data is derived from official Gazette notifications and Department of Consumer Affairs.
    """
    print("--- Seeding Real Government of India Regulatory Rule Book ---")
    
    # 1. Ensure admin user exists for audit recording
    admin_user = User.query.filter_by(role=UserRole.ADMIN).first()
    admin_id = admin_user.id if admin_user else None

    # 2. Define Real Verified Rules
    rules_data = [
        {
            "rule_code": "RULE_6_MANDATORY_DECLARATIONS",
            "version": "v2022.1_GSR779E",
            "title": "Mandatory Declarations on Pre-Packaged Commodities",
            "description": "Every package shall bear thereon legible, definite and conspicuous declarations regarding manufacturer/packer/importer details, commodity name, net quantity, date of manufacture/packing/import, maximum retail price (MRP incl. of all taxes & unit sale price), consumer care details, and country of origin for imported goods.",
            "statutory_citation": "Rule 6(1), Legal Metrology (Packaged Commodities) Rules, 2011 (as amended vide G.S.R. 779(E))",
            "government_authority": "Department of Consumer Affairs, Ministry of Consumer Affairs, Food and Public Distribution, Government of India",
            "notification_reference": "G.S.R. 779(E)",
            "notification_date": date(2021, 11, 2),
            "amendment_title": "Legal Metrology (Packaged Commodities) Rules (Amendment), 2021",
            "effective_from": date(2022, 12, 1),
            "effective_to": None,
            "status": "ACTIVE",
            "official_source": "The Gazette of India: Extraordinary, Part II, Section 3, Sub-section (i)",
            "source_document": "Legal Metrology (Packaged Commodities) Rules, 2011",
            "validation_logic_type": "MANDATORY_DECLARATIONS",
            "applicability_criteria": {
                "is_universal_prepackaged": True,
                "notes": "Applies to all pre-packaged commodities sold, delivered or distributed in India."
            },
            "requirements": [
                {
                    "requirement_code": "REQ_6_1_A_NAME_ADDRESS",
                    "title": "Name and Complete Address of Manufacturer / Packer / Importer",
                    "requirement_type": "MANDATORY_DECLARATION",
                    "description": "The name and complete physical address of the manufacturer, or where manufacturer is not the packer, the name and address of the manufacturer and packer, and for imported goods, the name and address of the importer.",
                    "condition": {
                        "check_type": "DECLARATION_REQUIRED",
                        "declaration": "MANUFACTURER_INFO",
                        "applicability": { "is_universal": True },
                        "validation": { "require_name": True, "require_address": True, "require_pin_code": True }
                    },
                    "is_mandatory": True
                },
                {
                    "requirement_code": "REQ_6_1_B_COMMON_NAME",
                    "title": "Generic Name or Common Name of Commodity",
                    "requirement_type": "MANDATORY_DECLARATION",
                    "description": "The common or generic names of the commodity contained in the package and where the package contains more than one product, the name and quantity of each product.",
                    "condition": {
                        "check_type": "DECLARATION_REQUIRED",
                        "declaration": "COMMODITY_NAME",
                        "applicability": { "is_universal": True },
                        "validation": { "min_length": 2, "prohibit_misleading_descriptors": True }
                    },
                    "is_mandatory": True
                },
                {
                    "requirement_code": "REQ_6_1_C_NET_QUANTITY",
                    "title": "Net Quantity in Standard SI Units",
                    "requirement_type": "PHYSICAL_MEASUREMENT",
                    "description": "The net quantity, in terms of the standard unit of weight or measure (SI unit) or number where sold by number.",
                    "condition": {
                        "check_type": "DECLARATION_REQUIRED",
                        "declaration": "NET_QUANTITY",
                        "applicability": { "is_universal": True },
                        "validation": {
                            "allowed_units": ["g", "kg", "ml", "l", "m", "cm", "mm", "N", "U", "count"],
                            "require_standard_symbol": True
                        }
                    },
                    "is_mandatory": True
                },
                {
                    "requirement_code": "REQ_6_1_D_DATE_MFG_PACK",
                    "title": "Month and Year of Manufacture / Packing / Import",
                    "requirement_type": "MANDATORY_DECLARATION",
                    "description": "The month and year in which the commodity is manufactured or pre-packed or imported.",
                    "condition": {
                        "check_type": "DECLARATION_REQUIRED",
                        "declaration": "MFG_DATE",
                        "applicability": { "is_universal": True },
                        "validation": {
                            "format": ["MM/YYYY", "Month YYYY", "MM/YY"],
                            "reject_post_dated": True
                        }
                    },
                    "is_mandatory": True
                },
                {
                    "requirement_code": "REQ_6_1_E_MRP_INCLUSIVE_TAXES",
                    "title": "Maximum Retail Price (MRP Inclusive of all taxes) & Unit Sale Price",
                    "requirement_type": "MANDATORY_DECLARATION",
                    "description": "Retail sale price of the package clearly formatted as 'Maximum Retail Price Rs. ...... / ₹ ...... inclusive of all taxes' or 'MRP Rs. ...... / ₹ ...... incl. of all taxes' and Unit Sale Price where net quantity is more than one unit.",
                    "condition": {
                        "check_type": "DECLARATION_REQUIRED",
                        "declaration": "MRP",
                        "applicability": { "is_universal": True },
                        "validation": {
                            "must_contain_clause": "inclusive of all taxes",
                            "unit_sale_price_required_if_net_qty_gt_1": True
                        }
                    },
                    "is_mandatory": True
                },
                {
                    "requirement_code": "REQ_6_1_F_CONSUMER_CARE",
                    "title": "Consumer Care Redressal Details",
                    "requirement_type": "MANDATORY_DECLARATION",
                    "description": "Name, address, telephone number, and email address of the person or office who can be contacted in case of consumer complaints.",
                    "condition": {
                        "check_type": "DECLARATION_REQUIRED",
                        "declaration": "CONSUMER_CARE",
                        "applicability": { "is_universal": True },
                        "validation": { "require_phone": True, "require_email": True, "require_address": True }
                    },
                    "is_mandatory": True
                },
                {
                    "requirement_code": "REQ_6_1_G_COUNTRY_OF_ORIGIN",
                    "title": "Country of Origin for Imported Packages",
                    "requirement_type": "MANDATORY_DECLARATION",
                    "description": "The name of the country of origin or manufacture or assembly in case of imported pre-packaged commodities.",
                    "condition": {
                        "check_type": "DECLARATION_REQUIRED",
                        "declaration": "COUNTRY_OF_ORIGIN",
                        "applicability": { "product_conditions": { "is_imported": True } },
                        "validation": { "require_country_name": True }
                    },
                    "is_mandatory": True
                }
            ]
        },
        {
            "rule_code": "RULE_7_NUMERAL_LETTER_SIZE",
            "version": "v2022.1_GSR385E",
            "title": "Minimum Height of Numerals and Letters on Principal Display Panel",
            "description": "Height of any numeral and letter in declarations shall not be less than the minimum height prescribed in Table I (for Net Quantity based on PDP area) and Table II (for other declarations). Uncalibrated pixel scans require physical inspector verification.",
            "statutory_citation": "Rule 7(1) & 7(2) read with Table I & II, Legal Metrology (Packaged Commodities) Rules, 2011",
            "government_authority": "Department of Consumer Affairs, Ministry of Consumer Affairs, Food and Public Distribution, Government of India",
            "notification_reference": "G.S.R. 385(E)",
            "notification_date": date(2015, 5, 14),
            "amendment_title": "Legal Metrology (Packaged Commodities) (Amendment) Rules, 2015",
            "effective_from": date(2015, 5, 14),
            "effective_to": None,
            "status": "ACTIVE",
            "official_source": "The Gazette of India: Extraordinary, Part II, Section 3, Sub-section (i)",
            "source_document": "Legal Metrology (Packaged Commodities) Rules, 2011",
            "validation_logic_type": "CHARACTER_HEIGHT",
            "applicability_criteria": {
                "optical_measurement_note": "Physical height calculation requires optical calibration reference or inspector measurement entry.",
                "table_1_net_quantity": [
                    { "max_net_quantity_g_ml": 200, "pdp_area_cm2_max": 50, "min_height_mm": 1.0, "blown_formed_min_mm": 2.0 },
                    { "max_net_quantity_g_ml": 200, "pdp_area_cm2_max": 100, "min_height_mm": 1.5, "blown_formed_min_mm": 3.0 },
                    { "max_net_quantity_g_ml": 200, "pdp_area_cm2_max": 500, "min_height_mm": 2.5, "blown_formed_min_mm": 4.0 },
                    { "max_net_quantity_g_ml": 200, "pdp_area_cm2_max": 1000, "min_height_mm": 4.0, "blown_formed_min_mm": 6.0 },
                    { "max_net_quantity_g_ml": 200, "pdp_area_cm2_max": None, "min_height_mm": 6.0, "blown_formed_min_mm": 6.0 },
                    { "max_net_quantity_g_ml": 1000, "pdp_area_cm2_max": 100, "min_height_mm": 2.0, "blown_formed_min_mm": 3.0 },
                    { "max_net_quantity_g_ml": 1000, "pdp_area_cm2_max": 500, "min_height_mm": 2.5, "blown_formed_min_mm": 4.0 },
                    { "max_net_quantity_g_ml": 1000, "pdp_area_cm2_max": None, "min_height_mm": 4.0, "blown_formed_min_mm": 6.0 },
                    { "max_net_quantity_g_ml": None, "pdp_area_cm2_max": 500, "min_height_mm": 4.0, "blown_formed_min_mm": 6.0 },
                    { "max_net_quantity_g_ml": None, "pdp_area_cm2_max": None, "min_height_mm": 6.0, "blown_formed_min_mm": 6.0 }
                ],
                "table_2_other_declarations": [
                    { "pdp_area_cm2_max": 50, "min_height_mm": 1.0 },
                    { "pdp_area_cm2_max": 100, "min_height_mm": 1.5 },
                    { "pdp_area_cm2_max": 500, "min_height_mm": 2.0 },
                    { "pdp_area_cm2_max": 1000, "min_height_mm": 4.0 },
                    { "pdp_area_cm2_max": None, "min_height_mm": 6.0 }
                ]
            },
            "requirements": [
                {
                    "requirement_code": "REQ_7_2_TABLE1_NET_QTY_FONT",
                    "title": "Table I Minimum Character Height for Net Quantity",
                    "requirement_type": "PHYSICAL_MEASUREMENT",
                    "description": "The minimum height of numerals and letters for net quantity declaration in accordance with Table I based on PDP area and weight/volume category.",
                    "condition": {
                        "check_type": "CHARACTER_HEIGHT",
                        "declaration": "NET_QUANTITY",
                        "requires_calibration": True,
                        "fallback_status_on_uncalibrated": "MANUAL_VERIFICATION"
                    },
                    "is_mandatory": True
                },
                {
                    "requirement_code": "REQ_7_2_TABLE2_OTHER_DECLARATIONS_FONT",
                    "title": "Table II Minimum Character Height for General Declarations",
                    "requirement_type": "PHYSICAL_MEASUREMENT",
                    "description": "The minimum height of numerals and letters for general declarations (Manufacturer, MRP, Consumer Care) in accordance with Table II based on PDP area.",
                    "condition": {
                        "check_type": "CHARACTER_HEIGHT",
                        "declaration": "GENERAL_DECLARATIONS",
                        "requires_calibration": True,
                        "fallback_status_on_uncalibrated": "MANUAL_VERIFICATION"
                    },
                    "is_mandatory": True
                }
            ]
        },
        {
            "rule_code": "RULE_8_DECLARATION_PLACEMENT",
            "version": "v2011.1_ORIGINAL",
            "title": "Principal Display Panel Appearance & Surrounding Clear Space",
            "description": "Every declaration specified under Rule 6 shall appear on the principal display panel of the package and shall be conspicuous, legible and distinct. The declaration of net quantity shall be surrounded by clear space equal to the height of the numeral.",
            "statutory_citation": "Rule 8(1) & 8(2), Legal Metrology (Packaged Commodities) Rules, 2011",
            "government_authority": "Department of Consumer Affairs, Ministry of Consumer Affairs, Food and Public Distribution, Government of India",
            "notification_reference": "G.S.R. 202(E)",
            "notification_date": date(2011, 3, 7),
            "amendment_title": "Legal Metrology (Packaged Commodities) Rules, 2011",
            "effective_from": date(2011, 4, 1),
            "effective_to": None,
            "status": "ACTIVE",
            "official_source": "The Gazette of India: Extraordinary, Part II, Section 3, Sub-section (i)",
            "source_document": "Legal Metrology (Packaged Commodities) Rules, 2011",
            "validation_logic_type": "SURROUNDING_SPACE",
            "applicability_criteria": {
                "is_universal": True
            },
            "requirements": [
                {
                    "requirement_code": "REQ_8_1_PDP_PLACEMENT",
                    "title": "Mandatory Appearance on Principal Display Panel",
                    "requirement_type": "FORMAT_REQUIREMENT",
                    "description": "Declarations specified under Rule 6 must appear conspicuously on the Principal Display Panel.",
                    "condition": {
                        "check_type": "DECLARATION_PLACEMENT",
                        "target_surface": "PRINCIPAL_DISPLAY_PANEL",
                        "allowed_disposition": "CONSPICUOUS_GROUPED"
                    },
                    "is_mandatory": True
                },
                {
                    "requirement_code": "REQ_8_2_QUANTITY_SURROUNDING_SPACE",
                    "title": "Clear Surrounding Space for Net Quantity",
                    "requirement_type": "PHYSICAL_MEASUREMENT",
                    "description": "The declaration of net quantity shall be surrounded by clear space at least equal to the height of the numeral / letter.",
                    "condition": {
                        "check_type": "QUANTITY_SPACING",
                        "declaration": "NET_QUANTITY",
                        "min_clear_boundary_multiplier": 1.0,
                        "validation": { "require_unobstructed_padding": True }
                    },
                    "is_mandatory": True
                }
            ]
        },
        # RULE 6(10A) VERSION 1 (SUPERSEDED)
        {
            "rule_code": "RULE_6_10A_ECOMMERCE_ORIGIN",
            "version": "v2026.1_GSR128E",
            "title": "E-Commerce Searchable & Sortable Country of Origin Filter (First Insertion)",
            "description": "Inserted Rule 6(10A) concerning searchable and sortable country-of-origin filtering for imported products offered by e-commerce entities.",
            "statutory_citation": "Rule 6(10A), Legal Metrology (Packaged Commodities) Amendment Rules, 2026",
            "government_authority": "Department of Consumer Affairs, Ministry of Consumer Affairs, Food and Public Distribution, Government of India",
            "notification_reference": "G.S.R. 128(E)",
            "notification_date": date(2026, 2, 13),
            "amendment_title": "Legal Metrology (Packaged Commodities) Amendment Rules, 2026",
            "effective_from": date(2026, 7, 1),
            "effective_to": date(2027, 6, 30),
            "status": "SUPERSEDED",
            "official_source": "The Gazette of India: Extraordinary, Part II, Section 3, Sub-section (i)",
            "source_document": "Legal Metrology (Packaged Commodities) Rules, 2011",
            "validation_logic_type": "ECOMMERCE_FILTER",
            "applicability_criteria": {
                "channel": "ECOMMERCE",
                "is_imported": True,
                "scope": "Searchable and sortable country-of-origin filtering for imported products offered by e-commerce entities."
            },
            "requirements": [
                {
                    "requirement_code": "REQ_6_10A_V1_SEARCHABLE_FILTER",
                    "title": "Searchable & Sortable Country of Origin Filter for Imported Listings",
                    "requirement_type": "REQUIRED_DOCUMENT",
                    "description": "E-commerce platform must provide searchable and sortable origin filtering on listings for imported commodities.",
                    "condition": {
                        "check_type": "ECOMMERCE_PORTAL_FILTER",
                        "declaration": "COUNTRY_OF_ORIGIN",
                        "applicability": { "is_ecommerce": True, "is_imported": True },
                        "validation": { "searchable": True, "sortable": True }
                    },
                    "is_mandatory": True
                }
            ]
        },
        # RULE 6(10A) VERSION 2 (FUTURE / SCHEDULED)
        {
            "rule_code": "RULE_6_10A_ECOMMERCE_ORIGIN",
            "version": "v2026.2_GSR312E",
            "title": "E-Commerce Mandatory Country of Origin Searchable & Sortable Specification (Second Amendment)",
            "description": "Substituted Rule 6(10A) requiring every e-commerce entity offering an imported product for sale to ensure that the product listing contains a searchable and sortable filter specifying the country of origin.",
            "statutory_citation": "Rule 6(10A), Legal Metrology (Packaged Commodities) Second Amendment Rules, 2026",
            "government_authority": "Department of Consumer Affairs, Ministry of Consumer Affairs, Food and Public Distribution, Government of India",
            "notification_reference": "G.S.R. 312(E)",
            "notification_date": date(2026, 4, 27),
            "amendment_title": "Legal Metrology (Packaged Commodities) Second Amendment Rules, 2026",
            "effective_from": date(2027, 7, 1),
            "effective_to": None,
            "status": "FUTURE_SCHEDULED",
            "official_source": "The Gazette of India: Extraordinary, Part II, Section 3, Sub-section (i)",
            "source_document": "Legal Metrology (Packaged Commodities) Rules, 2011",
            "validation_logic_type": "ECOMMERCE_FILTER",
            "applicability_criteria": {
                "channel": "ECOMMERCE",
                "is_imported": True,
                "scope": "Substituted Rule 6(10A) requiring every e-commerce entity offering an imported product for sale to ensure that the product listing contains a searchable and sortable filter specifying the country of origin."
            },
            "requirements": [
                {
                    "requirement_code": "REQ_6_10A_V2_SUBSTITUTED_FILTER",
                    "title": "Mandatory E-Commerce Marketplace Listing Level Country of Origin Specification",
                    "requirement_type": "REQUIRED_DOCUMENT",
                    "description": "Mandatory sortable and searchable filter at individual product listing level for all imported items on e-commerce marketplaces.",
                    "condition": {
                        "check_type": "ECOMMERCE_PORTAL_FILTER",
                        "declaration": "COUNTRY_OF_ORIGIN",
                        "applicability": { "is_ecommerce": True, "is_imported": True },
                        "validation": { "searchable": True, "sortable": True, "enforce_marketplace_listing_level": True }
                    },
                    "is_mandatory": True
                }
            ]
        }
    ]

    all_categories = ProductCategory.query.all()
    created_count = 0
    updated_count = 0

    for r_data in rules_data:
        rule = RegulatoryRule.query.filter_by(rule_code=r_data["rule_code"], version=r_data["version"]).first()
        if not rule:
            rule = RegulatoryRule(
                rule_code=r_data["rule_code"],
                version=r_data["version"],
                title=r_data["title"],
                description=r_data["description"],
                statutory_citation=r_data["statutory_citation"],
                government_authority=r_data["government_authority"],
                notification_reference=r_data["notification_reference"],
                notification_date=r_data["notification_date"],
                amendment_title=r_data["amendment_title"],
                status=r_data["status"],
                official_source=r_data["official_source"],
                source_document=r_data["source_document"],
                validation_logic_type=r_data["validation_logic_type"],
                applicability_criteria_json=json.dumps(r_data["applicability_criteria"]),
                effective_from=r_data["effective_from"],
                effective_to=r_data["effective_to"],
                is_active=True
            )
            db.session.add(rule)
            db.session.flush()
            created_count += 1
        else:
            rule.title = r_data["title"]
            rule.description = r_data["description"]
            rule.statutory_citation = r_data["statutory_citation"]
            rule.government_authority = r_data["government_authority"]
            rule.notification_reference = r_data["notification_reference"]
            rule.notification_date = r_data["notification_date"]
            rule.amendment_title = r_data["amendment_title"]
            rule.status = r_data["status"]
            rule.official_source = r_data["official_source"]
            rule.source_document = r_data["source_document"]
            rule.validation_logic_type = r_data["validation_logic_type"]
            rule.applicability_criteria_json = json.dumps(r_data["applicability_criteria"])
            rule.effective_from = r_data["effective_from"]
            rule.effective_to = r_data["effective_to"]
            rule.is_active = True
            updated_count += 1

        # Seed Requirements
        for req_data in r_data.get("requirements", []):
            req = RuleRequirement.query.filter_by(rule_id=rule.id, requirement_code=req_data["requirement_code"]).first()
            if not req:
                req = RuleRequirement(
                    rule_id=rule.id,
                    requirement_code=req_data["requirement_code"],
                    title=req_data["title"],
                    requirement_type=req_data["requirement_type"],
                    description=req_data["description"],
                    condition_json=json.dumps(req_data["condition"]),
                    is_mandatory=req_data["is_mandatory"]
                )
                db.session.add(req)
            else:
                req.title = req_data["title"]
                req.requirement_type = req_data["requirement_type"]
                req.description = req_data["description"]
                req.condition_json = json.dumps(req_data["condition"])
                req.is_mandatory = req_data["is_mandatory"]

        # Map to relevant categories
        for cat in all_categories:
            mapping = RuleCategoryMapping.query.filter_by(rule_id=rule.id, category_id=cat.id).first()
            if not mapping:
                db.session.add(RuleCategoryMapping(
                    rule_id=rule.id,
                    category_id=cat.id,
                    is_exempt=False,
                    exception_notes="Statutory requirement applicable to category commodities."
                ))

        if admin_id:
            audit = AuditLog(
                user_id=admin_id,
                action_type=AuditActionType.RULE_MODIFIED,
                entity_name="RegulatoryRule",
                entity_id=str(rule.id),
                new_state_json=json.dumps(rule.to_dict()),
                justification=f"Seeded real Government of India rule {rule.rule_code} ({rule.version})."
            )
            db.session.add(audit)

    db.session.commit()
    print(f"[PASS] Real Government Rule Book seeded: {created_count} created, {updated_count} updated.")

if __name__ == "__main__":
    from app import create_app
    app = create_app()
    with app.app_context():
        seed_real_regulatory_rules()
