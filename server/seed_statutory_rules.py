import os
import sys
from datetime import date
import json
import re

# Add server directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app import create_app
from models import db, RegulatoryRule, ComplianceCheck, Declaration, PackageEvidence

def seed_statutory_rules():
    app = create_app()
    with app.app_context():
        statutory_rules = [
            {
                'rule_code': 'RULE_6_1_A',
                'version': 'v2022.1_GSR779E',
                'title': 'Name & Complete Address of Manufacturer / Packer / Importer',
                'description': 'Every package shall bear the name and complete address of the manufacturer, or where the manufacturer is not the packer, the name and address of the manufacturer and packer, or in case of an imported commodity, the name and complete address of the importer.',
                'statutory_citation': 'Rule 6(1)(a), Legal Metrology (Packaged Commodities) Rules, 2011',
                'validation_logic_type': 'MANDATORY_DECLARATIONS',
                'applicability_criteria': {
                    'what_it_is_for': 'What is Rule 6(1)(a) for? It guarantees absolute manufacturer and packer traceability. Every buyer, inspector, and consumer court must know precisely which registered corporate entity manufactured, packed, or imported the goods and their exact physical location (including 6-digit postal PIN code) for product liability, safety recalls, and consumer grievance enforcement.',
                    'statutory_purpose': 'Legal Accountability & Complete Traceability. Prevents ghost manufacturing and ensures an accountable legal entity is clearly identified.',
                    'applicability_summary': 'Universal Requirement: Mandatory for 100% of pre-packaged commodities sold, stored, or distributed in India.',
                    'enforcement_guidance': 'Inspectors verify: (1) Legal entity name is clearly stated; (2) Complete physical address with premises/plot number, street, city, state, and valid PIN code; (3) If contract-packed, both manufacturer and packer roles are distinguished.',
                    'statutory_penalties': 'Legal Metrology Act, 2009 — Section 36(1): Fine up to ₹25,000 for first violation, up to ₹50,000 for second violation.',
                    'examples': {
                        'compliant': ['Manufactured & Packed by: Britannia Industries Ltd., Plot No. 1, Sector 1, Industrial Area, Bidadi, Ramanagara, Karnataka - 562109'],
                        'non_compliant': ['Printing only "Britannia Industries, Bangalore" without street address and PIN code']
                    }
                }
            },
            {
                'rule_code': 'RULE_6_1_B',
                'version': 'v2022.1_GSR779E',
                'title': 'Generic or Common Name of Commodity',
                'description': 'Every package shall bear the common or generic names of the commodity contained in the package and where the package contains more than one product, the name and quantity of each product.',
                'statutory_citation': 'Rule 6(1)(b), Legal Metrology (Packaged Commodities) Rules, 2011',
                'validation_logic_type': 'MANDATORY_DECLARATIONS',
                'applicability_criteria': {
                    'what_it_is_for': 'What is Rule 6(1)(b) for? It ensures that consumers are informed of the true generic nature of the product, preventing misleading branding. While companies use marketing brand names (e.g. "Good Day", "50-50", "Bourbon"), the package MUST explicitly state the standardized commodity name (e.g. "Butter Cookies", "Sweet and Salty Biscuits") so buyers understand exactly what they are purchasing.',
                    'statutory_purpose': 'Truth in Advertising & Consumer Right to Information. Prevents misleading marketing descriptors from obscuring the true identity of the product.',
                    'applicability_summary': 'Universal Requirement: Mandatory for all pre-packaged goods.',
                    'enforcement_guidance': 'Inspectors check that the generic or common trade name is conspicuously displayed on the Principal Display Panel, distinct from trademarked or fanciful brand names.',
                    'statutory_penalties': 'Legal Metrology Act, 2009 — Section 36(1): Fine up to ₹25,000 for first offence.',
                    'examples': {
                        'compliant': ['Brand: Britannia Good Day | Commodity: Butter Cookies'],
                        'non_compliant': ['Printing only "Good Day Rich Delights" with no generic commodity identifier']
                    }
                }
            },
            {
                'rule_code': 'RULE_6_1_C',
                'version': 'v2022.1_GSR779E',
                'title': 'Net Quantity in Standard SI Metric Units',
                'description': 'Every package shall bear the net quantity, in terms of the standard unit of weight or measure (SI metric unit) or number where the commodity is packed or sold by number. Use of non-standard symbols is strictly prohibited.',
                'statutory_citation': 'Rule 6(1)(c) & Rule 5, Legal Metrology (Packaged Commodities) Rules, 2011',
                'validation_logic_type': 'MANDATORY_DECLARATIONS',
                'applicability_criteria': {
                    'what_it_is_for': 'What is Rule 6(1)(c) for? It guarantees accurate, honest weight and measure declarations. It mandates the use of official International System of Units (SI) symbols — "g" (gram), "kg" (kilogram), "ml" (milliliter), "l" or "L" (liter), "m" (meter), or "N" / "U" (number). It strictly prohibits deceptive or non-standard symbols such as "gm", "gms", "kgs", "ltrs", or imperial weights (oz, lbs).',
                    'statutory_purpose': 'Measurement Integrity & Anti-Fraud Standard. Guarantees that buyers receive exactly the quantity paid for without misleading metric approximations.',
                    'applicability_summary': 'Universal Requirement: Mandatory for every pre-packaged commodity.',
                    'enforcement_guidance': 'Inspectors check: (1) Standard SI unit symbol (e.g. "200 g" NOT "200 gm" or "200 gms"); (2) Verification of net contents within permissible maximum allowable error (MAE) limits under Second Schedule.',
                    'statutory_penalties': 'Section 36(1) fine up to ₹25,000; short-weight violations incur enhanced penalties under Section 30 with fines up to ₹50,000 or imprisonment.',
                    'examples': {
                        'compliant': ['Net Weight: 200 g', 'Net Volume: 1 L', 'Net Qty: 6 N'],
                        'non_compliant': ['"Net Wt: 200 gm" (Illegal symbol "gm")', '"Net Contents: 1.5 ltrs" (Illegal symbol "ltrs")']
                    }
                }
            },
            {
                'rule_code': 'RULE_6_1_D',
                'version': 'v2022.1_GSR779E',
                'title': 'Month & Year of Manufacture / Pre-Packing',
                'description': 'Every package shall bear the month and year in which the commodity is manufactured or pre-packed or imported, conspicuously declared in legible numerals.',
                'statutory_citation': 'Rule 6(1)(d), Legal Metrology (Packaged Commodities) Rules, 2011',
                'validation_logic_type': 'MANDATORY_DECLARATIONS',
                'applicability_criteria': {
                    'what_it_is_for': 'What is Rule 6(1)(d) for? It informs consumers of the product age, allowing them to verify freshness, calculate shelf life, and avoid stale or expired products. It also provides an essential timestamp for inspectors to ensure that pricing changes and regulatory compliance correspond to the actual date of production.',
                    'statutory_purpose': 'Consumer Health, Freshness & Shelf-Life Verification. Prevents post-dated packaging and sale of aged inventory.',
                    'applicability_summary': 'Universal Requirement: Mandatory for all commodities except specific raw agricultural bulk produce.',
                    'enforcement_guidance': 'Inspectors check: (1) Conspicuous month and year (e.g. "08/2026", "AUG 2026"); (2) Verification against post-dating; (3) Cannot be erased, blurred, or covered by secondary stickers.',
                    'statutory_penalties': 'Legal Metrology Act, 2009 — Section 36(1): Fine up to ₹25,000.',
                    'examples': {
                        'compliant': ['Mfg Date: 08/2026', 'Packed: AUG 2026'],
                        'non_compliant': ['Omitting packing month', 'Post-dating product with a future manufacturing month']
                    }
                }
            },
            {
                'rule_code': 'RULE_6_1_E',
                'version': 'v2022.1_GSR779E',
                'title': 'Maximum Retail Price (MRP) (Inclusive of All Taxes)',
                'description': 'The retail sale price of the package shall be clearly formatted as "Maximum Retail Price Rs. ...... / ₹ ...... inclusive of all taxes" or "MRP Rs. ...... / ₹ ...... incl. of all taxes". No retailer may sell above this declared ceiling.',
                'statutory_citation': 'Rule 6(1)(e), Legal Metrology (Packaged Commodities) Rules, 2011',
                'validation_logic_type': 'MANDATORY_DECLARATIONS',
                'applicability_criteria': {
                    'what_it_is_for': 'What is Rule 6(1)(e) for? It protects consumers from price gouging, excessive retailer markups, and unexpected hidden charges. It establishes the mandatory ceiling price in Indian currency and requires that ALL taxes (GST, excise, state duties) are already included. Statements like "taxes extra" or scratching/stickering over the price are illegal offences.',
                    'statutory_purpose': 'Price Ceiling Protection & Anti-Profiteering. Guarantees that consumers never pay a single paisa above the printed price anywhere in India.',
                    'applicability_summary': 'Universal Requirement: Mandatory for all packaged commodities sold to retail consumers.',
                    'enforcement_guidance': 'Inspectors check: (1) Includes standard rupee symbol (₹ or Rs.); (2) Explicit wording "incl. of all taxes" or "inclusive of all taxes"; (3) No stickers pasted over original price; (4) Overcharging above MRP is strictly prosecuted.',
                    'statutory_penalties': 'Section 36(1) fine up to ₹25,000 for packaging defects. Overcharging beyond MRP carries separate prosecution under Section 36(2) with fines up to ₹50,000.',
                    'examples': {
                        'compliant': ['MRP ₹ 50.00 (incl. of all taxes)', 'MRP Rs. 120.00 inclusive of all taxes'],
                        'non_compliant': ['"MRP ₹ 50.00 + Local Taxes Extra" (STRICTLY ILLEGAL)', 'Altering printed MRP with a pen or adhesive price sticker']
                    }
                }
            },
            {
                'rule_code': 'RULE_6_1_N',
                'version': 'v2022.1_GSR779E',
                'title': 'Consumer Care & Grievance Redressal Details',
                'description': 'Every package shall bear the name, address, telephone number, and email address of the person or office who can be contacted by the consumer in case of complaints or queries.',
                'statutory_citation': 'Rule 6(1)(n), Legal Metrology (Packaged Commodities) Rules, 2011',
                'validation_logic_type': 'MANDATORY_DECLARATIONS',
                'applicability_criteria': {
                    'what_it_is_for': 'What is Rule 6(1)(n) for? It enforces every Indian consumer\'s fundamental right to redressal under the Consumer Protection Act. It mandates that every manufacturer or packer provide a four-part contact mechanism: (1) Contact designation or person, (2) Postal address, (3) Working phone / toll-free number, and (4) Direct email address for rapid grievance resolution.',
                    'statutory_purpose': 'Consumer Grievance Redressal & Corporate Accountability. Guarantees direct, frictionless communication channels for consumer complaints.',
                    'applicability_summary': 'Universal Requirement: Mandatory for all pre-packaged commodities sold in India.',
                    'enforcement_guidance': 'Inspectors verify all four components: designation/name, postal address, working phone/toll-free number, and valid email address. Missing phone or email constitutes a statutory violation.',
                    'statutory_penalties': 'Legal Metrology Act, 2009 — Section 36(1): Fine up to ₹25,000 for incomplete grievance details.',
                    'examples': {
                        'compliant': ['Consumer Care: Executive, Britannia Industries Ltd., Prestige Shantiniketan, Whitefield, Bangalore - 560048 | Tel: 1800-425-4449 | Email: feedback@britindia.com'],
                        'non_compliant': ['Giving only a website without an email or phone number', 'Providing a phone number that is disconnected or unregistered']
                    }
                }
            },
            {
                'rule_code': 'RULE_6_10',
                'version': 'v2022.1_GSR779E',
                'title': 'Country of Origin (Mandatory for Imported Goods)',
                'description': 'Every package containing an imported commodity shall bear the name of the country of origin or manufacture on the principal display panel or elsewhere conspicuously, clearly and legibly in such manner that it can be easily read by a consumer.',
                'statutory_citation': 'Rule 6(10), Legal Metrology (Packaged Commodities) Rules, 2011',
                'validation_logic_type': 'MANDATORY_DECLARATIONS',
                'applicability_criteria': {
                    'what_it_is_for': 'What is Rule 6(10) for? It requires mandatory declaration of the Country of Origin or Manufacture for all imported pre-packaged commodities sold in India. It guarantees complete origin transparency, empowers consumers to know whether a product is domestic or foreign, and strictly prevents deceptive labeling where imported commodities masquerade as domestically produced goods. For packages manufactured and packed within India, this rule is flagged as "NOT APPLICABLE" (Compliant by default), as the domestic manufacturer address under Rule 6(1)(a) already satisfies legal origin traceability.',
                    'statutory_purpose': 'Origin Transparency & Fair Trade Compliance. Protects consumers against deceptive provenance claims and guarantees verified traceability for customs, metrology, and cross-border trade standards.',
                    'applicability_summary': 'Mandatory for all Imported Pre-Packaged Goods. EXEMPT / NOT APPLICABLE for Domestic Goods (Made in India).',
                    'enforcement_guidance': 'Inspectors verify that imported commodities conspicuously declare "Country of Origin: [Country]" or "Made in [Country]" in English or Hindi (Devanagari script) on the Principal Display Panel (PDP) or directly alongside the registered importer name and address. Vague, non-sovereign descriptions like "Foreign Origin" or "Imported Confectionery" are rejected as violations.',
                    'statutory_penalties': 'Legal Metrology Act, 2009 — Section 36(1): Fine up to ₹25,000 for first violation, up to ₹50,000 for second violation, and up to ₹1,00,000 or imprisonment up to one year for subsequent non-compliance. Non-compliant imported packages are liable for seizure at customs and retail distribution.',
                    'examples': {
                        'compliant': ['Country of Origin: Switzerland', 'Manufactured in Vietnam | Imported & Marketed by: Parle Products Pvt Ltd, Mumbai'],
                        'non_compliant': ['Omitting Country of Origin on imported chocolate pack', 'Using ambiguous phrases like "Imported Ingredients" without declaring manufacturing country']
                    }
                }
            },
            {
                'rule_code': 'RULE_6_11',
                'version': 'v2022.1_GSR779E',
                'title': 'Unit Sale Price (USP) Mandatory Standard',
                'description': 'The unit sale price (USP) shall be declared on every pre-packaged commodity in Indian rupees and paise per g, kg, ml, l, or number, and shall be printed adjacent to or in close proximity with the Maximum Retail Price (MRP) in a font size that ensures equal conspicuousness.',
                'statutory_citation': 'Rule 6(11), Legal Metrology (Packaged Commodities) Rules, 2011 (Amended vide G.S.R. 779(E))',
                'validation_logic_type': 'MANDATORY_DECLARATIONS',
                'applicability_criteria': {
                    'what_it_is_for': 'What is Rule 6(11) for? It mandates that packages declare the Unit Sale Price (USP) — the cost per single unit of weight, volume, or count (e.g. ₹ 0.45 / g, ₹ 45.00 / 100g, ₹ 250.00 / kg, or ₹ 1.20 / ml) — printed right next to the Maximum Retail Price (MRP). This rule directly eliminates "shrinkflation" (where companies stealthily reduce package size from 100g to 85g while charging the same price) and enables consumers to easily compare prices across different package sizes and competing brands on store shelves.',
                    'statutory_purpose': 'Consumer Price Transparency & Anti-Shrinkflation Protection. Enacted by the Department of Consumer Affairs to ensure uniform, per-unit value comparison across varied pack sizes.',
                    'applicability_summary': 'Mandatory for packages containing net weight/volume greater than 1 kg or 1 liter, and specified consumer goods. Packages containing 1 unit (by number) or small packs where net qty equals 1 unit are exempt.',
                    'enforcement_guidance': 'Inspectors check: (1) USP is printed adjacent to or immediately below MRP; (2) Expressed in Rupees and Paise rounded to two decimal places; (3) Calculated using standard metric denominators (per g, per 100g, or per kg for solid items; per ml, per 100ml, or per l for liquids).',
                    'statutory_penalties': 'Legal Metrology Act, 2009 — Section 36(1): Fine up to ₹25,000 for first offence, ₹50,000 for second offence. Non-compliant packages may be seized from distribution channels.',
                    'examples': {
                        'compliant': ['MRP ₹ 90.00 (incl. of all taxes) | USP ₹ 0.45 / g', 'MRP ₹ 250.00 (incl. of all taxes) | USP ₹ 250.00 / kg'],
                        'non_compliant': ['MRP printed alone without Unit Sale Price on a 500g cereal pack', 'Declaring USP in tiny illegible font hidden in the corner away from MRP']
                    }
                }
            },
            {
                'rule_code': 'RULE_7',
                'version': 'v2022.1_GSR779E',
                'title': 'Numeral & Letter Font Size Standards (Schedule II)',
                'description': 'The height of any numeral and letter in mandatory declarations shall not be less than the minimum height prescribed in Table I (for net quantity based on package area) and Table II (for other statutory declarations).',
                'statutory_citation': 'Rule 7 & Schedule II, Table 1, Legal Metrology (Packaged Commodities) Rules, 2011',
                'validation_logic_type': 'CHARACTER_HEIGHT',
                'applicability_criteria': {
                    'what_it_is_for': 'What is Rule 7 for? It eliminates "microscopic fine print" deception. It sets strict mathematical minimum heights (in millimeters) for all letters and numerals printed on the package based on the total surface area of the Principal Display Panel (PDP). This ensures that critical statutory declarations (such as Net Quantity, MRP, and Ingredients) are effortlessly legible to consumers under normal lighting without requiring a magnifying glass.',
                    'statutory_purpose': 'Legibility & Conspicuousness Mandate. Prevents manufacturers from hiding critical consumer information in illegibly small fonts.',
                    'applicability_summary': 'Universal Measurement Requirement: Mandatory across all pre-packaged goods, scaled to package display area.',
                    'enforcement_guidance': 'Inspectors use optical calibration gauges and digital micrometers to measure letter and numeral heights against Schedule II Table 1: PDP up to 50 cm² requires min 1.0mm; PDP 50-100 cm² requires min 1.5mm; PDP 100-500 cm² requires min 2.0mm; PDP 500-1000 cm² requires min 4.0mm; PDP > 1000 cm² requires min 6.0mm.',
                    'statutory_penalties': 'Legal Metrology Act, 2009 — Section 36(1): Fine up to ₹25,000 for sub-standard font height; product packaging may require recall and re-labeling.',
                    'examples': {
                        'compliant': ['200g net quantity printed with numeral height >= 2.0mm on a 150 cm² Principal Display Panel'],
                        'non_compliant': ['Net quantity numerals printed at 0.8mm height on a large carton requiring 4.0mm minimum']
                    }
                }
            }
        ]

        rule_map = {}
        for rd in statutory_rules:
            r = RegulatoryRule.query.filter_by(rule_code=rd['rule_code']).first()
            app_json = json.dumps(rd.get('applicability_criteria', {}))
            if not r:
                r = RegulatoryRule(
                    rule_code=rd['rule_code'],
                    version=rd['version'],
                    title=rd['title'],
                    description=rd['description'],
                    statutory_citation=rd['statutory_citation'],
                    validation_logic_type=rd['validation_logic_type'],
                    applicability_criteria_json=app_json,
                    effective_from=date(2022, 12, 1),
                    is_active=True
                )
                db.session.add(r)
                db.session.flush()
                print(f"Created rule: {rd['rule_code']} - {rd['title']}")
            else:
                r.title = rd['title']
                r.description = rd['description']
                r.statutory_citation = rd['statutory_citation']
                r.validation_logic_type = rd['validation_logic_type']
                r.applicability_criteria_json = app_json
                db.session.flush()
                print(f"Updated rule: {rd['rule_code']} - {rd['title']}")
            rule_map[rd['rule_code']] = r

        db.session.commit()

        # Fix existing ComplianceChecks across all cases
        all_checks = ComplianceCheck.query.all()
        for chk in all_checks:
            decls = Declaration.query.filter_by(case_id=chk.case_id).all()
            evs = PackageEvidence.query.filter_by(case_id=chk.case_id).all()

            # Deduce rule code from expected_condition or evaluated_value
            val = (chk.evaluated_value or '').strip()
            exp = (chk.expected_condition or '').strip()

            target_code = None
            target_title = None

            if 'Manufacturer' in exp or 'PARLE' in val.upper() or 'UNIBIC' in val.upper() and ('PVT' in val.upper() or 'LTD' in val.upper() or '|' in val):
                target_code = 'RULE_6_1_A'
                target_title = 'Name & Address of Manufacturer / Packer'
            elif 'Commodity' in exp or val.lower() in ['butter cookies', 'parle biscuits', 'cookies', 'biscuits', 'rice', 'unibic']:
                target_code = 'RULE_6_1_B'
                target_title = 'Generic or Common Name of Commodity'
            elif 'Quantity' in exp or re.search(r'^\d+(\.\d+)?\s*(g|kg|ml|l|mg)$', val, re.IGNORECASE):
                target_code = 'RULE_6_1_C'
                target_title = 'Net Quantity & Standard Measurement Units'
            elif 'Manufacture' in exp or 'Date' in exp or re.search(r'\b(?:\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}\/\d{2,4})\b', val):
                target_code = 'RULE_6_1_D'
                target_title = 'Month & Year of Manufacture / Pre-Packing'
            elif 'Retail Price' in exp or 'MRP' in exp or val.startswith('Rs.') or val.startswith('₹'):
                target_code = 'RULE_6_1_E'
                target_title = 'Maximum Retail Price (MRP) (Inclusive of All Taxes)'
            elif 'Consumer Care' in exp or 'Tel:' in val or 'Call' in val or '1800' in val:
                target_code = 'RULE_6_1_N'
                target_title = 'Consumer Care & Grievance Redressal Details'
            elif 'Country' in exp or 'Domestic' in val or 'Import' in val:
                target_code = 'RULE_6_10'
                target_title = 'Country of Origin (For Imported Goods)'
            elif 'Unit Sale' in exp or 'USP' in exp or '/g' in val or '/kg' in val or 'Per 100g' in val or 'R0.' in val:
                target_code = 'RULE_6_11'
                target_title = 'Unit Sale Price (USP)'
            elif 'Font' in exp or 'PDP' in val or 'cm²' in val:
                target_code = 'RULE_7'
                target_title = 'Numeral & Letter Font Size Standards'

            if target_code and target_code in rule_map:
                chk.rule_id = rule_map[target_code].id
                chk.expected_condition = target_title

            # Match evidence and bbox from declarations if available
            matching_decl = None
            if val:
                matching_decl = next((d for d in decls if d.extracted_value and (d.extracted_value == val or val in d.extracted_value or d.extracted_value in val)), None)
            
            if matching_decl:
                if matching_decl.evidence_id:
                    chk.evidence_id = matching_decl.evidence_id
                if matching_decl.bbox_w > 0 or matching_decl.bbox_h > 0:
                    chk.bbox_json = json.dumps({
                        'x': matching_decl.bbox_x,
                        'y': matching_decl.bbox_y,
                        'w': matching_decl.bbox_w,
                        'h': matching_decl.bbox_h
                    })

        db.session.commit()
        print(f"Updated {len(all_checks)} existing compliance checks with distinct rules, evidence IDs, and bounding boxes!")

if __name__ == '__main__':
    seed_statutory_rules()
