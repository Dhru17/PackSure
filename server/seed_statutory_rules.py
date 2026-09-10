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
                'title': 'Name & Address of Manufacturer / Packer',
                'description': 'Name and complete address of the manufacturer, or packer, or importer.',
                'statutory_citation': 'Rule 6(1)(a), Legal Metrology (Packaged Commodities) Rules, 2011',
                'validation_logic_type': 'MANDATORY_DECLARATIONS'
            },
            {
                'rule_code': 'RULE_6_1_B',
                'version': 'v2022.1_GSR779E',
                'title': 'Generic or Common Name of Commodity',
                'description': 'The common or generic names of the commodity contained in the package, distinct from brand name.',
                'statutory_citation': 'Rule 6(1)(b), Legal Metrology (Packaged Commodities) Rules, 2011',
                'validation_logic_type': 'MANDATORY_DECLARATIONS'
            },
            {
                'rule_code': 'RULE_6_1_C',
                'version': 'v2022.1_GSR779E',
                'title': 'Net Quantity & Standard Measurement Units',
                'description': 'Net quantity declared in standard SI units (g, kg, ml, l, m, N) or number.',
                'statutory_citation': 'Rule 6(1)(c) & Rule 5, Legal Metrology (Packaged Commodities) Rules, 2011',
                'validation_logic_type': 'MANDATORY_DECLARATIONS'
            },
            {
                'rule_code': 'RULE_6_1_D',
                'version': 'v2022.1_GSR779E',
                'title': 'Month & Year of Manufacture / Pre-Packing',
                'description': 'Month and year of manufacture, packing or import conspicuously declared.',
                'statutory_citation': 'Rule 6(1)(d), Legal Metrology (Packaged Commodities) Rules, 2011',
                'validation_logic_type': 'MANDATORY_DECLARATIONS'
            },
            {
                'rule_code': 'RULE_6_1_E',
                'version': 'v2022.1_GSR779E',
                'title': 'Maximum Retail Price (MRP) (Inclusive of All Taxes)',
                'description': 'Maximum Retail Price (MRP) inclusive of all taxes clearly printed.',
                'statutory_citation': 'Rule 6(1)(e), Legal Metrology (Packaged Commodities) Rules, 2011',
                'validation_logic_type': 'MANDATORY_DECLARATIONS'
            },
            {
                'rule_code': 'RULE_6_1_N',
                'version': 'v2022.1_GSR779E',
                'title': 'Consumer Care & Grievance Redressal Details',
                'description': 'Name, address, phone number, and email of consumer grievance officer.',
                'statutory_citation': 'Rule 6(1)(n), Legal Metrology (Packaged Commodities) Rules, 2011',
                'validation_logic_type': 'MANDATORY_DECLARATIONS'
            },
            {
                'rule_code': 'RULE_6_10',
                'version': 'v2022.1_GSR779E',
                'title': 'Country of Origin (For Imported Goods)',
                'description': 'Name of country of origin or manufacture for imported pre-packaged goods.',
                'statutory_citation': 'Rule 6(10), Legal Metrology (Packaged Commodities) Rules, 2011',
                'validation_logic_type': 'MANDATORY_DECLARATIONS'
            },
            {
                'rule_code': 'RULE_6_11',
                'version': 'v2022.1_GSR779E',
                'title': 'Unit Sale Price (USP)',
                'description': 'Unit sale price declared in rupees and paise per g, kg, ml, l, or number.',
                'statutory_citation': 'Rule 6(11), Legal Metrology (Packaged Commodities) Rules, 2011',
                'validation_logic_type': 'MANDATORY_DECLARATIONS'
            },
            {
                'rule_code': 'RULE_7',
                'version': 'v2022.1_GSR779E',
                'title': 'Numeral & Letter Font Size Standards',
                'description': 'Minimum font and numeral heights matching Principal Display Panel area as per Schedule II Table 1.',
                'statutory_citation': 'Rule 7 & Schedule II, Legal Metrology (Packaged Commodities) Rules, 2011',
                'validation_logic_type': 'CHARACTER_HEIGHT'
            }
        ]

        rule_map = {}
        for rd in statutory_rules:
            r = RegulatoryRule.query.filter_by(rule_code=rd['rule_code']).first()
            if not r:
                r = RegulatoryRule(
                    rule_code=rd['rule_code'],
                    version=rd['version'],
                    title=rd['title'],
                    description=rd['description'],
                    statutory_citation=rd['statutory_citation'],
                    validation_logic_type=rd['validation_logic_type'],
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
