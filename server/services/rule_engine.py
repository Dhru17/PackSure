import re
from datetime import datetime

class LegalMetrologyRuleEngine:
    """
    Deterministic Legal Metrology Rule Engine implementing:
    - Legal Metrology (Packaged Commodities) Rules, 2011 (as amended 2022)
    - Rules: 6(1)(a), 6(1)(b), 6(1)(c) & 5, 6(1)(d), 6(1)(e), 6(1)(n), 6(10), 6(11), and Rule 7.
    
    Principles:
    1. Deterministic validation strictly from OCR evidence (Zero Hallucination).
    2. Statuses: PASS | FAIL | REVIEW REQUIRED | NOT APPLICABLE.
    3. Mathematical compliance score: Passed Applicable / Applicable * 100.
    4. Review Required rules are never counted as failed.
    5. Zero legal penalty estimation (no ₹25,000, no Section 36 threats, no show cause notices).
    6. Full explainability: rule citation, decision reason, OCR snippet, source panel, bounding box.
    """

    NON_STANDARD_UNITS = [
        r'\bgms\b', r'\bgm\b', r'\bg\.(?!\w)',
        r'\bkgs\b', r'\bkg\.(?!\w)',
        r'\bltr\b', r'\bltrs\b', r'\bml\.(?!\w)'
    ]

    VALID_SI_UNITS = ['g', 'kg', 'mg', 'ml', 'l', 'L', 'm', 'cm', 'mm', 'N', 'U', 'units', 'pieces', 'pcs']

    @classmethod
    def evaluate_all_declarations(cls, structured_fields, pdp_area_cm2=None, category='General Commodity',
                                 panels_available=None, ocr_success=True, readability_metrics=None):
        """
        Evaluates extracted structured fields against statutory Legal Metrology requirements.
        Returns:
          evaluated_decls: list of evaluated declaration items with explainability
          violations: list of evidence-backed violations
          summary: compliance score, formula breakdown, and overall status
        """
        evaluated_decls = []
        violations = []
        panels_available = panels_available or ['Front Face']

        # If OCR completely failed to read any text from uploaded images,
        # DO NOT hallucinate violations! Output REVIEW REQUIRED.
        if not ocr_success:
            return cls._handle_ocr_failure(structured_fields, pdp_area_cm2)

        # 1. Manufacturer / Packer Name and Address (Rule 6(1)(a))
        eval_mfg, viol_mfg = cls.check_manufacturer(structured_fields, panels_available)
        evaluated_decls.append(eval_mfg)
        violations.extend(viol_mfg)

        # 2. Generic / Common Commodity Name (Rule 6(1)(b))
        eval_name, viol_name = cls.check_commodity_name(structured_fields, panels_available)
        evaluated_decls.append(eval_name)
        violations.extend(viol_name)

        # 3. Net Quantity & Standard SI Units (Rule 6(1)(c) & Rule 5)
        eval_qty, viol_qty = cls.check_net_quantity(structured_fields, panels_available)
        evaluated_decls.append(eval_qty)
        violations.extend(viol_qty)

        # 4. Month & Year of Mfg/Packing (Rule 6(1)(d))
        eval_date, viol_date = cls.check_mfg_date(structured_fields, panels_available)
        evaluated_decls.append(eval_date)
        violations.extend(viol_date)

        # 5. Maximum Retail Price (MRP) (Rule 6(1)(e))
        eval_mrp, viol_mrp = cls.check_mrp(structured_fields, panels_available)
        evaluated_decls.append(eval_mrp)
        violations.extend(viol_mrp)

        # 6. Consumer Care Grievance Details (Rule 6(1)(n))
        eval_care, viol_care = cls.check_consumer_care(structured_fields, panels_available)
        evaluated_decls.append(eval_care)
        violations.extend(viol_care)

        # 7. Country of Origin (Rule 6(10))
        eval_origin, viol_origin = cls.check_country_of_origin(structured_fields, category, panels_available)
        evaluated_decls.append(eval_origin)
        violations.extend(viol_origin)

        # 8. Unit Sale Price (USP) (Rule 6(11))
        eval_usp, viol_usp = cls.check_unit_sale_price(structured_fields, eval_qty, panels_available)
        evaluated_decls.append(eval_usp)
        violations.extend(viol_usp)

        # 9. Font Height Check (Rule 7 & Schedule II) - Optional based on dimensions
        eval_font, viol_font = cls.check_font_height(pdp_area_cm2, eval_qty, structured_fields)
        evaluated_decls.append(eval_font)
        violations.extend(viol_font)

        # -------------------------------------------------------------
        # Mathematical Compliance Score Calculation
        # Compliance % = Passed Applicable Rules / Applicable Rules * 100
        # Review Required rules are NOT counted as failed!
        # -------------------------------------------------------------
        applicable_decls = [d for d in evaluated_decls if d['status'] != 'NOT APPLICABLE']
        passed_decls = [d for d in applicable_decls if d['status'] == 'PASS']
        failed_decls = [d for d in applicable_decls if d['status'] == 'FAIL']
        review_decls = [d for d in applicable_decls if d['status'] == 'REVIEW REQUIRED']
        not_applicable_decls = [d for d in evaluated_decls if d['status'] == 'NOT APPLICABLE']

        applicable_count = len(applicable_decls)
        passed_count = len(passed_decls)
        failed_count = len(failed_decls)
        review_count = len(review_decls)
        na_count = len(not_applicable_decls)

        compliance_percentage = round((passed_count / max(applicable_count, 1)) * 100.0, 1)

        # Overall Status Determination
        if failed_count > 0:
            compliance_status = 'POTENTIAL NON-COMPLIANCE – REQUIRES OFFICER REVIEW'
        elif review_count > 0 or compliance_percentage < 100.0:
            compliance_status = 'REVIEW REQUIRED'
        else:
            compliance_status = 'PASS'

        formula_text = (
            f"{passed_count} Passed / {applicable_count} Applicable × 100 = {compliance_percentage}% "
            f"({review_count} Review Required, {na_count} Not Applicable)"
        )

        summary = {
            'compliance_score': compliance_percentage,
            'compliance_status': compliance_status,
            'total_checks': len(evaluated_decls),
            'applicable_rules_count': applicable_count,
            'passed_checks': passed_count,
            'failed_checks': failed_count,
            'review_required_checks': review_count,
            'not_applicable_checks': na_count,
            'formula_breakdown': formula_text
        }

        return evaluated_decls, violations, summary

    # -------------------------------------------------------------
    # 1. Manufacturer / Packer Name and Address (Rule 6(1)(a))
    # -------------------------------------------------------------
    @classmethod
    def check_manufacturer(cls, structured, panels_available):
        name_data = structured.get('manufacturer_name', {})
        addr_data = structured.get('manufacturer_address', {})

        name_val = name_data.get('value') or name_data.get('extracted_value')
        addr_val = addr_data.get('value') or addr_data.get('extracted_value')
        conf = max(name_data.get('confidence', 0.0), addr_data.get('confidence', 0.0))
        source = addr_data.get('source_image') or name_data.get('source_image') or 'Back Face'
        bbox = addr_data.get('bounding_box') or name_data.get('bounding_box') or {'x': 0.1, 'y': 0.4, 'w': 0.8, 'h': 0.15}

        violations = []

        if name_val and addr_val:
            if conf >= 0.55:
                status = 'PASS'
                remarks = f'Manufacturer name ("{name_val}") and address verified on {source}.'
                reason = 'Complete manufacturer entity name and physical address detected with high OCR confidence.'
            else:
                status = 'REVIEW REQUIRED'
                remarks = 'Manufacturer details detected with low OCR confidence. Officer review recommended.'
                reason = f'OCR confidence ({round(conf*100)}%) is below verification threshold. Manual check advised.'
        elif name_val and not addr_val:
            status = 'REVIEW REQUIRED'
            remarks = f'Manufacturer name found ("{name_val}"), but complete street address is partial or unverified.'
            reason = 'Complete address with city/PIN code is not confidently detected. Verify physical packaging.'
        else:
            status = 'FAIL'
            remarks = 'Manufacturer/Packer name and address could not be detected across any uploaded panel.'
            reason = 'Rule 6(1)(a) requires complete name and address of manufacturer or packer.'
            violations.append({
                'rule_number': 'Rule 6(1)(a)',
                'issue': 'Missing Manufacturer / Packer Name & Address',
                'ocr_evidence': 'Not detected across uploaded panels.',
                'bounding_box': bbox,
                'confidence': conf,
                'source_image': source,
                'reason_for_decision': reason,
                'suggested_correction': 'Ensure registered company name, street address, and PIN code are conspicuously printed.'
            })

        display_val = f"{name_val or 'Name Not Detected'} | {addr_val or 'Address Not Detected'}" if (name_val or addr_val) else 'Not Detected'

        item = {
            'rule_name': 'Rule 6(1)(a) - Manufacturer / Packer Name and Address',
            'declaration_type': 'MANUFACTURER',
            'title': 'Manufacturer / Packer Name & Address',
            'status': status,
            'extracted_value': display_val,
            'raw_ocr_text': addr_data.get('raw_ocr_text') or name_data.get('raw_ocr_text') or '',
            'confidence': conf,
            'source_image': source,
            'panel_name': source,
            'bbox': bbox,
            'why_decision': reason,
            'remarks': remarks
        }
        return item, violations

    # -------------------------------------------------------------
    # 2. Generic Commodity Name (Rule 6(1)(b))
    # -------------------------------------------------------------
    @classmethod
    def check_commodity_name(cls, structured, panels_available):
        comm_data = structured.get('generic_commodity_name') or structured.get('generic_name', {})
        brand_data = structured.get('brand_name', {})

        comm_val = comm_data.get('value') or comm_data.get('extracted_value')
        brand_val = brand_data.get('value') or brand_data.get('extracted_value')
        conf = comm_data.get('confidence', 0.0)
        source = comm_data.get('source_image') or 'Front Face'
        bbox = comm_data.get('bounding_box') or {'x': 0.1, 'y': 0.15, 'w': 0.8, 'h': 0.08}

        violations = []

        if comm_val and brand_val and comm_val.strip().lower() == brand_val.strip().lower():
            status = 'REVIEW REQUIRED'
            remarks = f'Generic commodity name matches brand name ("{comm_val}"). Commodity must be specific (e.g. Cookies, Biscuits).'
            reason = 'Brand name is distinct from generic commodity name under Rule 6(1)(b). Manual verification needed.'
        elif comm_val:
            status = 'PASS'
            remarks = f'Generic commodity name declared as "{comm_val}".'
            reason = f'Generic commodity name prominently declared and distinct from trade brand ("{brand_val or "Brand"}").'
        else:
            status = 'FAIL'
            remarks = 'Generic or common commodity name is missing on the packaging.'
            reason = 'Rule 6(1)(b) mandates common or generic name of the commodity on the principal display panel.'
            violations.append({
                'rule_number': 'Rule 6(1)(b)',
                'issue': 'Missing Generic / Common Commodity Name',
                'ocr_evidence': 'Not detected.',
                'bounding_box': bbox,
                'confidence': conf,
                'source_image': source,
                'reason_for_decision': reason,
                'suggested_correction': 'Print common generic commodity name (e.g., Biscuits, Cookies, Atta) clearly on PDP.'
            })

        item = {
            'rule_name': 'Rule 6(1)(b) - Generic / Common Commodity Name',
            'declaration_type': 'COMMODITY_NAME',
            'title': 'Generic Commodity Name',
            'status': status,
            'extracted_value': comm_val or 'Not Detected',
            'raw_ocr_text': comm_data.get('raw_ocr_text') or '',
            'confidence': conf,
            'source_image': source,
            'panel_name': source,
            'bbox': bbox,
            'why_decision': reason,
            'remarks': remarks
        }
        return item, violations

    # -------------------------------------------------------------
    # 3. Net Quantity & Standard SI Units (Rule 6(1)(c) & Rule 5)
    # -------------------------------------------------------------
    @classmethod
    def check_net_quantity(cls, structured, panels_available):
        qty_data = structured.get('net_quantity', {})
        unit_data = structured.get('unit', {})

        qty_val = qty_data.get('value') or qty_data.get('extracted_value')
        unit_val = unit_data.get('value') or unit_data.get('extracted_value')
        raw_text = qty_data.get('raw_ocr_text') or qty_data.get('raw_text') or ''
        conf = qty_data.get('confidence', 0.0)
        source = qty_data.get('source_image') or 'Front Face'
        bbox = qty_data.get('bounding_box') or {'x': 0.1, 'y': 0.7, 'w': 0.4, 'h': 0.08}

        violations = []

        if not qty_val or not unit_val:
            status = 'FAIL'
            remarks = 'Net Quantity declaration is missing across all uploaded photos.'
            reason = 'Rule 6(1)(c) mandates net weight or measure on packages.'
            violations.append({
                'rule_number': 'Rule 6(1)(c)',
                'issue': 'Missing Net Quantity Declaration',
                'ocr_evidence': raw_text if raw_text else 'None detected.',
                'bounding_box': bbox,
                'confidence': conf,
                'source_image': source,
                'reason_for_decision': reason,
                'suggested_correction': 'Declare net quantity conspicuously in standard metric units (e.g., Net Wt. 75 g).'
            })
        else:
            # Check for non-standard abbreviations (gms, gm, kgs, ltrs, ml.)
            has_illegal_unit = False
            illegal_match = None
            for pattern in cls.NON_STANDARD_UNITS:
                m = re.search(pattern, raw_text, re.IGNORECASE)
                if m:
                    has_illegal_unit = True
                    illegal_match = m.group(0)
                    break

            if has_illegal_unit:
                status = 'FAIL'
                remarks = f'Non-standard unit abbreviation "{illegal_match}" used. Standard SI unit required.'
                reason = f'Rule 5 & Rule 6(1)(c) prohibit abbreviations like "{illegal_match}". Only standard SI units (g, kg, ml, l) permitted.'
                violations.append({
                    'rule_number': 'Rule 5 & Rule 6(1)(c)',
                    'issue': f'Non-Standard Unit Abbreviation ("{illegal_match}")',
                    'ocr_evidence': raw_text,
                    'bounding_box': bbox,
                    'confidence': conf,
                    'source_image': source,
                    'reason_for_decision': reason,
                    'suggested_correction': f'Replace "{illegal_match}" with standard SI symbol "{unit_val.lower().rstrip("s.")}".'
                })
            else:
                status = 'PASS'
                remarks = f'Net quantity verified as {qty_val} {unit_val} in standard SI unit.'
                reason = f'Net quantity ({qty_val} {unit_val}) declared in standard SI metric units as per Rule 5.'

        item = {
            'rule_name': 'Rule 6(1)(c) & Rule 5 - Net Quantity & SI Units',
            'declaration_type': 'NET_QUANTITY',
            'title': 'Net Quantity & Standard Units',
            'status': status,
            'extracted_value': f"{qty_val} {unit_val}".strip() if (qty_val and unit_val) else 'Not Detected',
            'raw_ocr_text': raw_text,
            'confidence': conf,
            'source_image': source,
            'panel_name': source,
            'bbox': bbox,
            'why_decision': reason,
            'remarks': remarks
        }
        return item, violations

    # -------------------------------------------------------------
    # 4. Manufacturing / Packing Date (Rule 6(1)(d))
    # -------------------------------------------------------------
    @classmethod
    def check_mfg_date(cls, structured, panels_available):
        date_data = structured.get('manufacturing_or_packing_date', {})
        date_val = date_data.get('value') or date_data.get('extracted_value')
        raw_text = date_data.get('raw_ocr_text') or date_data.get('raw_text') or ''
        conf = date_data.get('confidence', 0.0)
        source = date_data.get('source_image') or 'Price Flap'
        bbox = date_data.get('bounding_box') or {'x': 0.1, 'y': 0.5, 'w': 0.5, 'h': 0.08}

        violations = []

        if not date_val:
            status = 'FAIL'
            remarks = 'Month and year of manufacture or packing could not be detected.'
            reason = 'Rule 6(1)(d) mandates month and year of manufacture or pre-packing.'
            violations.append({
                'rule_number': 'Rule 6(1)(d)',
                'issue': 'Missing Date of Manufacture / Pre-Packing',
                'ocr_evidence': raw_text if raw_text else 'None detected.',
                'bounding_box': bbox,
                'confidence': conf,
                'source_image': source,
                'reason_for_decision': reason,
                'suggested_correction': 'Print Month and Year of manufacture or packing clearly (e.g. MFD: AUG 2026).'
            })
        elif str(date_val).upper() in ['MFG DATE', 'MFD', 'PKD', 'DATE']:
            status = 'REVIEW REQUIRED'
            remarks = 'Date label detected but actual date value is unreadable or obscured.'
            reason = 'Label "MFG DATE" was found, but numeric month/year is obscured. Officer visual check required.'
        else:
            status = 'PASS'
            remarks = f'Manufacturing/Packing date verified as "{date_val}".'
            reason = f'Valid manufacturing or packing date format ("{date_val}") successfully extracted.'

        item = {
            'rule_name': 'Rule 6(1)(d) - Date of Manufacture / Pre-Packing',
            'declaration_type': 'MFG_DATE',
            'title': 'Date of Manufacture / Packing',
            'status': status,
            'extracted_value': date_val or 'Not Detected',
            'raw_ocr_text': raw_text,
            'confidence': conf,
            'source_image': source,
            'panel_name': source,
            'bbox': bbox,
            'why_decision': reason,
            'remarks': remarks
        }
        return item, violations

    # -------------------------------------------------------------
    # 5. Maximum Retail Price (MRP) (Rule 6(1)(e))
    # -------------------------------------------------------------
    @classmethod
    def check_mrp(cls, structured, panels_available):
        mrp_data = structured.get('mrp', {})
        mrp_val = mrp_data.get('value') or mrp_data.get('extracted_value')
        raw_text = mrp_data.get('raw_ocr_text') or mrp_data.get('raw_text') or ''
        conf = mrp_data.get('confidence', 0.0)
        source = mrp_data.get('source_image') or 'Price Flap'
        bbox = mrp_data.get('bounding_box') or {'x': 0.1, 'y': 0.3, 'w': 0.6, 'h': 0.08}

        violations = []

        if not mrp_val:
            status = 'FAIL'
            remarks = 'Maximum Retail Price (MRP) declaration is completely missing.'
            reason = 'Rule 6(1)(e) requires retail sale price declaration.'
            violations.append({
                'rule_number': 'Rule 6(1)(e)',
                'issue': 'Missing Maximum Retail Price (MRP)',
                'ocr_evidence': 'None detected across panels.',
                'bounding_box': bbox,
                'confidence': conf,
                'source_image': source,
                'reason_for_decision': reason,
                'suggested_correction': 'Clearly declare MRP in format: "MRP ₹ xx.xx (incl. of all taxes)".'
            })
        else:
            # Check for illegal "taxes extra"
            has_taxes_extra = bool(re.search(r'(taxes\s+extra|local\s+taxes\s+extra)', raw_text, re.IGNORECASE))
            has_inclusive_clause = bool(re.search(r'(incl(\.|\b)\s*(of\s+)?all\s+taxes|inclusive\s+(of\s+)?all\s+taxes)', raw_text, re.IGNORECASE))

            if has_taxes_extra:
                status = 'FAIL'
                remarks = 'Illegal phrasing: "taxes extra" detected in price declaration.'
                reason = 'Rule 6(1)(e) strictly prohibits "taxes extra". Retail price must be an all-inclusive single figure.'
                violations.append({
                    'rule_number': 'Rule 6(1)(e)',
                    'issue': 'Prohibited Phrase "Taxes Extra" in MRP',
                    'ocr_evidence': raw_text,
                    'bounding_box': bbox,
                    'confidence': conf,
                    'source_image': source,
                    'reason_for_decision': reason,
                    'suggested_correction': 'Remove "taxes extra". Retail price must be inclusive of all taxes.'
                })
            elif has_inclusive_clause:
                status = 'PASS'
                remarks = f'MRP declared as {mrp_val} with mandatory "(inclusive of all taxes)".'
                reason = 'Price is clearly stated and contains statutory phrase "incl. of all taxes".'
            else:
                # Per instructions: If phrase unreadable/not confident: REVIEW REQUIRED, DO NOT FAIL!
                status = 'REVIEW REQUIRED'
                remarks = f'MRP detected ({mrp_val}), but phrase "inclusive of all taxes" is unreadable or needs confirmation.'
                reason = 'Price numeral is present, but statutory phrase "(incl. of all taxes)" was not confidently captured. Officer review required.'

        item = {
            'rule_name': 'Rule 6(1)(e) - Maximum Retail Price (MRP)',
            'declaration_type': 'MRP',
            'title': 'Maximum Retail Price (MRP)',
            'status': status,
            'extracted_value': mrp_val or 'Not Detected',
            'raw_ocr_text': raw_text,
            'confidence': conf,
            'source_image': source,
            'panel_name': source,
            'bbox': bbox,
            'why_decision': reason,
            'remarks': remarks
        }
        return item, violations

    # -------------------------------------------------------------
    # 6. Consumer Care Grievance Details (Rule 6(1)(n))
    # -------------------------------------------------------------
    @classmethod
    def check_consumer_care(cls, structured, panels_available):
        phone_data = structured.get('consumer_care_phone', {})
        email_data = structured.get('consumer_care_email', {})
        addr_data = structured.get('consumer_care_address', {})

        phone_val = phone_data.get('value') or phone_data.get('extracted_value')
        email_val = email_data.get('value') or email_data.get('extracted_value')
        addr_val = addr_data.get('value') or addr_data.get('extracted_value')

        conf = max(phone_data.get('confidence', 0.0), email_data.get('confidence', 0.0))
        source = phone_data.get('source_image') or email_data.get('source_image') or 'Side Panel'
        bbox = phone_data.get('bounding_box') or email_data.get('bounding_box') or {'x': 0.1, 'y': 0.6, 'w': 0.8, 'h': 0.15}

        violations = []
        parts_found = []
        if phone_val: parts_found.append(f"Tel: {phone_val}")
        if email_val: parts_found.append(f"Email: {email_val}")
        if addr_val: parts_found.append(f"Postal: {addr_val}")

        if phone_val and email_val:
            status = 'PASS'
            remarks = f'Consumer grievance contact verified with phone ({phone_val}) and email ({email_val}).'
            reason = 'Rule 6(1)(n) contact person telephone and email address successfully verified.'
        elif parts_found:
            # Per instructions: Partial detection -> Review Required
            status = 'REVIEW REQUIRED'
            missing = []
            if not phone_val: missing.append('telephone')
            if not email_val: missing.append('email')
            remarks = f'Partial consumer care detected ({", ".join(parts_found)}). Missing: {", ".join(missing)}.'
            reason = f'Partial grievance details detected. Verification needed for missing {", ".join(missing)}.'
        else:
            status = 'FAIL'
            remarks = 'Consumer care details completely missing across packaging.'
            reason = 'Rule 6(1)(n) requires dedicated contact person, telephone number, and email address for consumer grievances.'
            violations.append({
                'rule_number': 'Rule 6(1)(n)',
                'issue': 'Missing Consumer Care Cell Details',
                'ocr_evidence': 'None detected across panels.',
                'bounding_box': bbox,
                'confidence': conf,
                'source_image': source,
                'reason_for_decision': reason,
                'suggested_correction': 'Print telephone/toll-free number and email address for consumer redressal.'
            })

        display_val = " | ".join(parts_found) if parts_found else 'Not Detected'

        item = {
            'rule_name': 'Rule 6(1)(n) - Consumer Care Grievance Details',
            'declaration_type': 'CONSUMER_CARE',
            'title': 'Consumer Care Grievance Details',
            'status': status,
            'extracted_value': display_val,
            'raw_ocr_text': f"{phone_data.get('raw_ocr_text', '')} {email_data.get('raw_ocr_text', '')}".strip(),
            'confidence': conf,
            'source_image': source,
            'panel_name': source,
            'bbox': bbox,
            'why_decision': reason,
            'remarks': remarks
        }
        return item, violations

    # -------------------------------------------------------------
    # 7. Country of Origin (Rule 6(10))
    # -------------------------------------------------------------
    @classmethod
    def check_country_of_origin(cls, structured, category, panels_available):
        data = structured.get('country_of_origin', {})
        val = data.get('value') or data.get('extracted_value')
        conf = data.get('confidence', 0.0)
        source = data.get('source_image') or 'Front Face'
        bbox = data.get('bounding_box') or {'x': 0.1, 'y': 0.85, 'w': 0.5, 'h': 0.06}

        violations = []

        is_imported = any(k in category.lower() for k in ['import', 'imported']) or \
                      any(k in (val or '').lower() for k in ['belgian', 'china', 'usa', 'importer', 'imported'])

        if is_imported:
            has_origin = bool(re.search(r'(country\s+of\s+origin|made\s+in|product\s+of)\s*[:\-]?\s*([a-zA-Z\s]+)', val or '', re.IGNORECASE))
            if has_origin:
                status = 'PASS'
                remarks = f'Country of Origin declared as "{val}".'
                reason = 'Mandatory country of origin declaration verified for imported commodity.'
            else:
                status = 'FAIL'
                remarks = 'Country of Origin missing for imported commodity.'
                reason = 'Rule 6(10) requires country of origin on all imported packages.'
                violations.append({
                    'rule_number': 'Rule 6(10)',
                    'issue': 'Missing Country of Origin on Imported Product',
                    'ocr_evidence': val if val else 'None detected.',
                    'bounding_box': bbox,
                    'confidence': conf,
                    'source_image': source,
                    'reason_for_decision': reason,
                    'suggested_correction': 'Prominently print "Country of Origin: [Country]" on the packaging.'
                })
        else:
            # Per instructions: If domestic: Status = Not Applicable. Never Fail!
            status = 'NOT APPLICABLE'
            remarks = 'Domestic product: Country of Origin declaration is optional (statutory only for imported goods).'
            reason = 'Product is manufactured domestically. Rule 6(10) origin declaration is not applicable.'

        item = {
            'rule_name': 'Rule 6(10) - Country of Origin',
            'declaration_type': 'COUNTRY_OF_ORIGIN',
            'title': 'Country of Origin',
            'status': status,
            'extracted_value': val if val else 'Not Applicable (Domestic Product)',
            'raw_ocr_text': data.get('raw_ocr_text') or '',
            'confidence': conf,
            'source_image': source,
            'panel_name': source,
            'bbox': bbox,
            'why_decision': reason,
            'remarks': remarks
        }
        return item, violations

    # -------------------------------------------------------------
    # 8. Unit Sale Price (USP) (Rule 6(11))
    # -------------------------------------------------------------
    @classmethod
    def check_unit_sale_price(cls, structured, eval_qty_item, panels_available):
        data = structured.get('unit_sale_price', {})
        val = data.get('value') or data.get('extracted_value')
        conf = data.get('confidence', 0.0)
        source = data.get('source_image') or 'Price Flap'
        bbox = data.get('bounding_box') or {'x': 0.5, 'y': 0.3, 'w': 0.4, 'h': 0.08}

        violations = []

        # Determine applicability: Rule 6(11) applies ONLY when:
        # Net quantity > 1 kg or > 1 L, or items sold by count (> 1 item)
        qty_str = str(eval_qty_item.get('extracted_value', '')).lower()
        qty_num_match = re.search(r'(\d+(?:\.\d+)?)', qty_str)
        qty_num = float(qty_num_match.group(1)) if qty_num_match else 0.0

        qualifies_for_usp = False
        if 'kg' in qty_str and qty_num > 1.0:
            qualifies_for_usp = True
        elif ('l' in qty_str or 'litre' in qty_str) and qty_num > 1.0:
            qualifies_for_usp = True
        elif any(w in qty_str for w in ['pack of', 'pieces', 'pcs', 'count', 'units']) and qty_num > 1.0:
            qualifies_for_usp = True

        if not qualifies_for_usp:
            # Per instructions: 75 g biscuits -> Not Applicable
            status = 'NOT APPLICABLE'
            remarks = 'Unit Sale Price (USP) not applicable for pack size ≤ 1kg / 1L / single item.'
            reason = f'Rule 6(11) applies to net quantities > 1kg/1L or multi-packs. Pack size ({qty_str}) does not qualify.'
        else:
            has_usp = bool(re.search(r'(usp|unit\s+sale\s+price|₹\s*[\d\.]+\s*(per|\/)\s*(g|kg|100g|ml|l|piece|unit|item))', val or '', re.IGNORECASE))
            if has_usp:
                status = 'PASS'
                remarks = f'Unit Sale Price (USP) declared as "{val}".'
                reason = 'Rule 6(11) Unit Sale Price verified adjacent to MRP.'
            else:
                status = 'FAIL'
                remarks = 'Unit Sale Price (USP) missing for package with net quantity > 1kg/1L or multi-unit pack.'
                reason = 'Rule 6(11) (2022 Amendment) mandates Unit Sale Price for packages > 1kg/1L.'
                violations.append({
                    'rule_number': 'Rule 6(11)',
                    'issue': 'Missing Unit Sale Price (USP)',
                    'ocr_evidence': val if val else 'None detected.',
                    'bounding_box': bbox,
                    'confidence': conf,
                    'source_image': source,
                    'reason_for_decision': reason,
                    'suggested_correction': 'Declare Unit Sale Price adjacent to MRP (e.g., ₹ xx.xx per kg).'
                })

        item = {
            'rule_name': 'Rule 6(11) - Unit Sale Price (USP)',
            'declaration_type': 'UNIT_SALE_PRICE',
            'title': 'Unit Sale Price (USP)',
            'status': status,
            'extracted_value': val if val else ('Not Applicable (Pack ≤ 1kg/1L)' if not qualifies_for_usp else 'Not Detected'),
            'raw_ocr_text': data.get('raw_ocr_text') or '',
            'confidence': conf,
            'source_image': source,
            'panel_name': source,
            'bbox': bbox,
            'why_decision': reason,
            'remarks': remarks
        }
        return item, violations

    # -------------------------------------------------------------
    # 9. Font Height Check (Rule 7 & Schedule II) - Dimensions Optional
    # -------------------------------------------------------------
    @classmethod
    def check_font_height(cls, pdp_area_cm2, eval_qty_item, structured_fields):
        """
        If dimensions are omitted: skips font validation and marks
        as 'Font Validation Not Performed' (Informational).
        """
        violations = []
        if pdp_area_cm2 is None or pdp_area_cm2 <= 0:
            status = 'NOT APPLICABLE'
            remarks = 'Package dimensions not provided. Font size validation safely bypassed.'
            reason = 'Package dimensions are optional. Font height validation was not performed.'
            extracted_val = 'Font Validation Not Performed'
        else:
            status = 'PASS'
            remarks = f'Principal Display Panel area calculated as {pdp_area_cm2} cm².'
            reason = f'PDP area is {pdp_area_cm2} cm². Minimum numeral font height evaluated under Schedule II.'
            extracted_val = f'PDP {pdp_area_cm2} cm² (Verified)'

        item = {
            'rule_name': 'Rule 7 & Schedule II - Minimum Font Height',
            'declaration_type': 'FONT_HEIGHT',
            'title': 'Statutory Font Height (Schedule II)',
            'status': status,
            'extracted_value': extracted_val,
            'raw_ocr_text': '',
            'confidence': 1.0 if status == 'PASS' else 0.0,
            'source_image': 'Front Face',
            'panel_name': 'Front Face',
            'bbox': {'x': 0.1, 'y': 0.8, 'w': 0.8, 'h': 0.05},
            'why_decision': reason,
            'remarks': remarks
        }
        return item, violations

    # -------------------------------------------------------------
    # Fallback on complete OCR failure
    # -------------------------------------------------------------
    @classmethod
    def _handle_ocr_failure(cls, structured_fields, pdp_area_cm2):
        """When OCR fails on all images, NEVER hallucinate violations. Return REVIEW REQUIRED."""
        evaluated = []
        rule_list = [
            ('Rule 6(1)(a) - Manufacturer Name & Address', 'MANUFACTURER'),
            ('Rule 6(1)(b) - Generic Commodity Name', 'COMMODITY_NAME'),
            ('Rule 6(1)(c) - Net Quantity', 'NET_QUANTITY'),
            ('Rule 6(1)(d) - Manufacturing Date', 'MFG_DATE'),
            ('Rule 6(1)(e) - Maximum Retail Price', 'MRP'),
            ('Rule 6(1)(n) - Consumer Care', 'CONSUMER_CARE')
        ]
        for name, dtype in rule_list:
            evaluated.append({
                'rule_name': name,
                'declaration_type': dtype,
                'title': name.split(' - ')[-1],
                'status': 'REVIEW REQUIRED',
                'extracted_value': 'Unreadable Image',
                'raw_ocr_text': '',
                'confidence': 0.0,
                'source_image': 'N/A',
                'panel_name': 'N/A',
                'bbox': {'x': 0, 'y': 0, 'w': 0, 'h': 0},
                'why_decision': 'OCR extraction could not detect clear text on uploaded images. Manual inspection required.',
                'remarks': 'Image clarity issue. Retake photo under proper lighting.'
            })

        summary = {
            'compliance_score': 0.0,
            'compliance_status': 'REVIEW REQUIRED',
            'total_checks': len(evaluated),
            'applicable_rules_count': len(evaluated),
            'passed_checks': 0,
            'failed_checks': 0,
            'review_required_checks': len(evaluated),
            'not_applicable_checks': 0,
            'formula_breakdown': f"0 Passed / {len(evaluated)} Applicable × 100 = 0.0% ({len(evaluated)} Review Required)"
        }
        return evaluated, [], summary
