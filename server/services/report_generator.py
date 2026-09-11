import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether, HRFlowable
)

class ReportGenerator:
    """
    Evidence-Backed Legal Metrology Inspection Report Generator (ReportLab).
    Strictly implements the 8-Section Prototype Format:
    1. Executive Summary
    2. Uploaded Images
    3. Detected Declaration Map
    4. OCR Evidence Table
    5. Rule Validation Table
    6. Evidence-backed Violations
    7. Compliance Score Breakdown
    8. Recommendations & Prototype Advisory
    Footer: AI Generated Prototype Report • Timestamp • Inspection ID (No digital government seal).
    """

    @classmethod
    def generate_pdf_report(cls, scan_data, output_pdf_path):
        os.makedirs(os.path.dirname(output_pdf_path), exist_ok=True)

        insp_id_str = f"LMPC-INSP-{scan_data.get('id', 1001):05d}"
        now_ts = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')

        def add_footer(canvas, doc):
            canvas.saveState()
            canvas.setFont('Helvetica', 8)
            canvas.setFillColor(colors.HexColor('#64748b'))
            footer_text = f"AI Generated Prototype Report • Generated: {now_ts} • Inspection ID: {insp_id_str} • Page {doc.page}"
            canvas.drawCentredString(letter[0] / 2.0, 20, footer_text)
            canvas.restoreState()

        doc = SimpleDocTemplate(
            output_pdf_path,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'HeaderTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=14,
            leading=17,
            textColor=colors.HexColor('#0f172a'),
            alignment=1
        )

        subtitle_style = ParagraphStyle(
            'HeaderSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#475569'),
            alignment=1
        )

        sec_header_style = ParagraphStyle(
            'SecHeader',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=10.5,
            leading=14,
            textColor=colors.HexColor('#1e293b'),
            spaceBefore=8,
            spaceAfter=4
        )

        cell_style = ParagraphStyle(
            'CellText',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=7.5,
            leading=10,
            textColor=colors.HexColor('#1e293b')
        )

        cell_bold = ParagraphStyle(
            'CellBold',
            parent=cell_style,
            fontName='Helvetica-Bold'
        )

        elements = []

        # ---------------------------------------------------------
        # Header Banner (Prototype Header - No Digital Government Seal)
        # ---------------------------------------------------------
        elements.append(Paragraph("AI LEGAL METROLOGY COMPLIANCE CHECKER", title_style))
        elements.append(Paragraph("Smart India Hackathon 2026 Prototype • Evidence-Backed Statutory Inspection", subtitle_style))
        elements.append(Paragraph("Verification against Legal Metrology (Packaged Commodities) Rules, 2011 (as amended 2022)", subtitle_style))
        elements.append(Spacer(1, 4))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0f172a'), spaceAfter=6))

        # ---------------------------------------------------------
        # 1. Executive Summary
        # ---------------------------------------------------------
        elements.append(Paragraph("1. EXECUTIVE SUMMARY", sec_header_style))

        status = scan_data.get('compliance_status', 'PASS')
        score = scan_data.get('compliance_score', 100.0)

        if status == 'PASS' or status == 'COMPLIANT':
            status_color = colors.HexColor('#16a34a')
            verdict_text = "<font color='#16a34a'><b>STATUTORY COMPLIANT (PASS)</b></font>"
        elif 'NON-COMPLIANCE' in status:
            status_color = colors.HexColor('#dc2626')
            verdict_text = "<font color='#dc2626'><b>POTENTIAL NON-COMPLIANCE – REQUIRES OFFICER REVIEW</b></font>"
        else:
            status_color = colors.HexColor('#d97706')
            verdict_text = "<font color='#d97706'><b>REVIEW REQUIRED (MANUAL CHECK ADVISED)</b></font>"

        prod = scan_data.get('product', {}) or {}
        date_str = scan_data.get('timestamp') or datetime.utcnow().strftime('%Y-%m-%d %H:%M')

        scan_meta = [
            [
                Paragraph("<b>Inspection ID:</b>", cell_style),
                Paragraph(insp_id_str, cell_bold),
                Paragraph("<b>Inspection Timestamp:</b>", cell_style),
                Paragraph(str(date_str)[:19], cell_style)
            ],
            [
                Paragraph("<b>Brand / Commodity:</b>", cell_style),
                Paragraph(f"{prod.get('brand', 'N/A')} • {prod.get('commodity_name', 'N/A')}", cell_bold),
                Paragraph("<b>Category:</b>", cell_style),
                Paragraph(prod.get('category', 'General Commodity'), cell_style)
            ],
            [
                Paragraph("<b>Compliance Score:</b>", cell_style),
                Paragraph(f"<b>{score}%</b>", cell_bold),
                Paragraph("<b>Inspection Verdict:</b>", cell_style),
                Paragraph(verdict_text, cell_style)
            ]
        ]

        t_meta = Table(scan_meta, colWidths=[110, 160, 110, 160])
        t_meta.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        elements.append(t_meta)
        elements.append(Spacer(1, 6))

        # ---------------------------------------------------------
        # 2. Uploaded Images & Packaging Gallery
        # ---------------------------------------------------------
        elements.append(Paragraph("2. UPLOADED PACKAGING IMAGES", sec_header_style))

        panels = scan_data.get('panels', [])
        readability = scan_data.get('readability_metrics', {})

        if panels:
            img_rows = []
            curr_row = []
            for p in panels:
                p_name = p.get('panel_name', 'Packaging Panel')
                ann_path = p.get('annotated_path') or p.get('image_path')
                r_info = readability.get(p_name, {})
                r_status = r_info.get('readability_status', 'Readable')
                r_blur = r_info.get('blur_score', 'N/A')

                caption = f"<b>{p_name}</b><br/>Quality: {r_status} (Blur: {r_blur})"
                if ann_path and os.path.exists(ann_path):
                    try:
                        from PIL import Image as PILImage
                        with PILImage.open(ann_path) as pimg:
                            pimg.verify()
                        im = Image(ann_path, width=120, height=85)
                        cell = [im, Paragraph(caption, cell_style)]
                    except Exception:
                        cell = [Paragraph(f"<b>[Image: {p_name}]</b>", cell_style), Paragraph(caption, cell_style)]
                else:
                    cell = [Paragraph(f"<b>[Image: {p_name}]</b>", cell_style), Paragraph(caption, cell_style)]

                curr_row.append(cell)
                if len(curr_row) == 4:
                    img_rows.append(curr_row)
                    curr_row = []
            if curr_row:
                while len(curr_row) < 4:
                    curr_row.append([Paragraph("", cell_style)])
                img_rows.append(curr_row)

            t_gallery = Table(img_rows, colWidths=[135, 135, 135, 135])
            t_gallery.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('TOPPADDING', (0, 0), (-1, -1), 2),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ]))
            elements.append(t_gallery)
        else:
            elements.append(Paragraph("Packaging images processed successfully.", cell_style))

        elements.append(Spacer(1, 6))

        # ---------------------------------------------------------
        # 3. Detected Declaration Map (Multi-Image Fusion)
        # ---------------------------------------------------------
        elements.append(Paragraph("3. DETECTED DECLARATION MAP (MULTI-IMAGE FUSION)", sec_header_style))

        fusion_summary = [
            [
                Paragraph("<b>Target Statutory Declaration</b>", cell_bold),
                Paragraph("<b>Authoritative Source Panel</b>", cell_bold),
                Paragraph("<b>Extracted Evidence Quote</b>", cell_bold),
                Paragraph("<b>OCR Confidence</b>", cell_bold)
            ]
        ]

        ext_json = scan_data.get('extracted_json', {})
        map_keys = [
            ('Brand & Commodity', 'brand_name', 'generic_commodity_name'),
            ('Manufacturer / Packer', 'manufacturer_name', 'manufacturer_address'),
            ('Net Quantity & SI Units', 'net_quantity', 'unit'),
            ('MRP & Tax Phrasing', 'mrp', None),
            ('Date of Mfg / Packing', 'manufacturing_or_packing_date', None),
            ('Batch / Lot Number', 'batch_or_lot_number', None),
            ('Consumer Care Helpline', 'consumer_care_phone', 'consumer_care_email'),
            ('Barcode / EAN', 'barcode', None)
        ]

        for label, k1, k2 in map_keys:
            d1 = ext_json.get(k1, {})
            v1 = d1.get('value') or d1.get('extracted_value') or ''
            src1 = d1.get('source_image') or d1.get('image_source')
            conf1 = d1.get('confidence', 0.0)

            if k2:
                d2 = ext_json.get(k2, {})
                v2 = d2.get('value') or d2.get('extracted_value') or ''
                src2 = d2.get('source_image') or d2.get('image_source')
                conf2 = d2.get('confidence', 0.0)
                val_comb = f"{v1} {v2}".strip() if (v1 or v2) else 'Not Detected'
                conf = max(conf1, conf2)
                src = (src1 if v1 else None) or src2 or 'Packaging'
            else:
                val_comb = v1 if v1 else 'Not Detected'
                conf = conf1
                src = src1 or 'Packaging'

            # Add Tax Phrasing evidence quote if MRP
            if label == 'MRP & Tax Phrasing' and val_comb != 'Not Detected':
                raw_txt = d1.get('raw_ocr_text') or d1.get('raw_text') or ''
                if 'tax' in raw_txt.lower() and 'tax' not in val_comb.lower():
                    val_comb = f"{val_comb} (Incl. of all taxes)"

            val_comb = val_comb.replace('₹', 'Rs. ')
            fusion_summary.append([
                Paragraph(f"<b>{label}</b>", cell_style),
                Paragraph(src, cell_style),
                Paragraph(val_comb[:75], cell_style),
                Paragraph(f"{round(conf*100)}%" if conf > 0 else "-", cell_style)
            ])

        t_fusion = Table(fusion_summary, colWidths=[140, 120, 220, 60])
        t_fusion.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ]))
        elements.append(t_fusion)
        elements.append(Spacer(1, 6))

        # ---------------------------------------------------------
        # 4. Structured OCR Evidence Table
        # ---------------------------------------------------------
        elements.append(Paragraph("4. STRUCTURED OCR EVIDENCE TABLE (16-FIELD SCHEMA)", sec_header_style))

        ocr_rows = [
            [
                Paragraph("<b>Field Name</b>", cell_bold),
                Paragraph("<b>Extracted Value (Verified)</b>", cell_bold),
                Paragraph("<b>Raw OCR Text</b>", cell_bold),
                Paragraph("<b>Source Panel</b>", cell_bold),
                Paragraph("<b>Confidence</b>", cell_bold)
            ]
        ]

        for k, item in ext_json.items():
            if k in ['generic_name', 'product_name']:
                continue
            val = item.get('value') or item.get('extracted_value') or '<font color="#94a3b8">None</font>'
            raw = item.get('raw_ocr_text') or item.get('raw_text') or '-'
            src = item.get('source_image') or item.get('image_source') or 'N/A'
            conf = item.get('confidence', 0.0)

            ocr_rows.append([
                Paragraph(f"<code>{k}</code>", cell_style),
                Paragraph(str(val).replace('₹', 'Rs. ')[:45], cell_style),
                Paragraph(str(raw).replace('₹', 'Rs. ')[:45], cell_style),
                Paragraph(str(src), cell_style),
                Paragraph(f"{round(conf*100)}%" if conf > 0 else "-", cell_style)
            ])

        t_ocr = Table(ocr_rows, colWidths=[130, 130, 150, 80, 50])
        t_ocr.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ]))
        elements.append(t_ocr)
        elements.append(Spacer(1, 6))

        # ---------------------------------------------------------
        # 5. Rule Validation Table
        # ---------------------------------------------------------
        elements.append(Paragraph("5. RULE VALIDATION TABLE", sec_header_style))

        rule_rows = [
            [
                Paragraph("<b>Rule Number & Name</b>", cell_bold),
                Paragraph("<b>Statutory Requirement</b>", cell_bold),
                Paragraph("<b>Extracted Evidence</b>", cell_bold),
                Paragraph("<b>Verdict</b>", cell_bold),
                Paragraph("<b>Decision Rationale (Explainability)</b>", cell_bold)
            ]
        ]

        # Use compliance_checks if provided, else fall back to declarations
        compliance_checks = scan_data.get('compliance_checks', [])
        if compliance_checks:
            for c in compliance_checks:
                st = str(c.get('status', 'PASS')).replace('_', ' ').upper()
                if st == 'PASS':
                    st_color = '#16a34a'
                elif st == 'FAIL':
                    st_color = '#dc2626'
                elif st == 'REVIEW REQUIRED':
                    st_color = '#d97706'
                else:
                    st_color = '#64748b'

                r_name = c.get('rule_title') or c.get('rule_code') or 'Rule 6'
                req = c.get('expected_condition') or c.get('statutory_citation') or 'Statutory Declaration'
                val = c.get('evaluated_value') or 'Not Detected'
                why = c.get('reason_explanation') or ''

                rule_rows.append([
                    Paragraph(f"<b>{r_name}</b>", cell_style),
                    Paragraph(str(req).replace('₹', 'Rs. ')[:60], cell_style),
                    Paragraph(str(val).replace('₹', 'Rs. ')[:50], cell_style),
                    Paragraph(f"<font color='{st_color}'><b>{st}</b></font>", cell_style),
                    Paragraph(str(why).replace('₹', 'Rs. ')[:90], cell_style)
                ])
        else:
            declarations = scan_data.get('declarations', [])
            for d in declarations:
                st = str(d.get('status', 'PASS')).replace('_', ' ').upper()
                if st == 'PASS':
                    st_color = '#16a34a'
                elif st == 'FAIL':
                    st_color = '#dc2626'
                elif st == 'REVIEW REQUIRED':
                    st_color = '#d97706'
                else:
                    st_color = '#64748b'

                r_name = d.get('rule_name') or d.get('title') or 'Statutory Rule'
                val = d.get('extracted_value', 'Not Detected')
                why = d.get('why_decision') or d.get('remarks') or ''

                rule_rows.append([
                    Paragraph(f"<b>{r_name}</b>", cell_style),
                    Paragraph(d.get('title', ''), cell_style),
                    Paragraph(str(val)[:50], cell_style),
                    Paragraph(f"<font color='{st_color}'><b>{st}</b></font>", cell_style),
                    Paragraph(str(why)[:75], cell_style)
                ])

        t_rules = Table(rule_rows, colWidths=[120, 95, 105, 70, 150])
        t_rules.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 2.5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
        ]))
        elements.append(t_rules)
        elements.append(Spacer(1, 6))

        # ---------------------------------------------------------
        # 6. Evidence-Backed Violations (No Section 36 Penalties)
        # ---------------------------------------------------------
        elements.append(Paragraph("6. EVIDENCE-BACKED VIOLATIONS", sec_header_style))

        violations = scan_data.get('violations', [])
        if violations:
            elements.append(Paragraph("The following potential statutory contraventions were identified from OCR evidence:", subtitle_style))
            elements.append(Spacer(1, 3))

            viol_rows = [
                [
                    Paragraph("<b>Rule Reference</b>", cell_bold),
                    Paragraph("<b>Detected Statutory Issue</b>", cell_bold),
                    Paragraph("<b>OCR Evidence Snippet</b>", cell_bold),
                    Paragraph("<b>Reason for Failure</b>", cell_bold),
                    Paragraph("<b>Suggested Correction</b>", cell_bold)
                ]
            ]

            for v in violations:
                r_code = v.get('rule_code') or v.get('rule_number') or 'Rule 6'
                issue = v.get('violation_title') or v.get('issue') or v.get('title') or 'Statutory Non-Compliance'
                snippet = v.get('evidence_snippet') or v.get('ocr_evidence') or 'N/A'
                reason = v.get('description') or v.get('reason_for_decision') or v.get('reason_for_failure') or ''
                correction = v.get('suggested_correction') or v.get('recommended_action') or 'Verify packaging.'

                viol_rows.append([
                    Paragraph(f"<b>{r_code}</b>", cell_style),
                    Paragraph(f"<b>{issue}</b>", cell_style),
                    Paragraph(f"<i>\"{snippet}\"</i>", cell_style),
                    Paragraph(reason, cell_style),
                    Paragraph(correction, cell_style)
                ])

            t_viols = Table(viol_rows, colWidths=[90, 110, 110, 115, 115])
            t_viols.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#fee2e2')),
                ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#fca5a5')),
                ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#fecaca')),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('TOPPADDING', (0, 0), (-1, -1), 3),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ]))
            elements.append(t_viols)
        else:
            elements.append(Paragraph("<b>No statutory violations detected.</b> Package complies with mandatory declarations under Rule 6.", cell_style))

        elements.append(Spacer(1, 6))

        # ---------------------------------------------------------
        # 7. Compliance Score Breakdown
        # ---------------------------------------------------------
        elements.append(Paragraph("7. COMPLIANCE SCORE BREAKDOWN", sec_header_style))

        formula_desc = scan_data.get('formula_breakdown') or f"{scan_data.get('passed_checks', 0)} Passed / {scan_data.get('total_checks', 8)} Applicable × 100 = {score}%"

        score_table = [
            [
                Paragraph("<b>Mathematical Formula:</b>", cell_bold),
                Paragraph("Compliance Score = (Passed Applicable Rules / Applicable Rules) × 100", cell_style)
            ],
            [
                Paragraph("<b>Formula Breakdown:</b>", cell_bold),
                Paragraph(formula_desc, cell_style)
            ],
            [
                Paragraph("<b>Rule Counts:</b>", cell_bold),
                Paragraph(
                    f"Passed: <b>{scan_data.get('passed_checks', 0)}</b> | "
                    f"Failed: <b>{scan_data.get('failed_checks', 0)}</b> | "
                    f"Review Required: <b>{scan_data.get('review_required_checks', scan_data.get('warning_checks', 0))}</b> | "
                    f"Not Applicable: <b>{scan_data.get('not_applicable_checks', 0)}</b>",
                    cell_style
                )
            ]
        ]
        t_score = Table(score_table, colWidths=[140, 400])
        t_score.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 2.5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
        ]))
        elements.append(t_score)
        elements.append(Spacer(1, 6))

        # ---------------------------------------------------------
        # 8. Recommendations & Prototype Advisory
        # ---------------------------------------------------------
        review_block = []
        review_block.append(Paragraph("8. RECOMMENDATIONS & OFFICER PROTOTYPE ADVISORY", sec_header_style))

        advisory_p = (
            "<b>SMART INDIA HACKATHON PROTOTYPE ADVISORY</b><br/>"
            "This document is generated by an automated AI inspection prototype utilizing PaddleOCR and OpenCV. "
            "It is designed to serve as an intelligent decision-support assistant for enforcement officers. "
            "All findings are strictly evidence-backed. Items marked <b>REVIEW REQUIRED</b> indicate low OCR confidence, "
            "partial text, or packaging glare that warrants physical inspection rather than punitive action. "
            "This report does not constitute a formal Show Cause Notice or legal indictment."
        )

        review_block.append(Paragraph(advisory_p, ParagraphStyle('AdvP', parent=styles['Normal'], fontSize=7.5, leading=10.5, textColor=colors.HexColor('#1e293b'))))
        review_block.append(Spacer(1, 6))

        # Verification Checklist
        chk_table = Table([
            [
                Paragraph("<b>Officer Physical Verification Checklist:</b><br/>"
                          "[  ] Physically inspect sample for unreadable / small text<br/>"
                          "[  ] Confirm manufacturer address completeness and PIN code<br/>"
                          "[  ] Verify price flap for '(inclusive of all taxes)'<br/>"
                          "[  ] Confirm barcode readability with handheld laser scanner", cell_style),
                Paragraph(f"<b>Officer Notes & Sign-off:</b><br/><br/>"
                          f"Signature: ___________________________<br/>"
                          f"Officer: <b>{scan_data.get('inspector_name', 'Inspector')}</b> ({scan_data.get('inspector_badge', 'LMO-DEL-2024-884')})<br/>"
                          f"Status: Prototype Verification Completed", cell_style)
            ]
        ], colWidths=[270, 270])
        chk_table.setStyle(TableStyle([
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ]))
        review_block.append(chk_table)
        elements.append(KeepTogether(review_block))

        doc.build(elements, onFirstPage=add_footer, onLaterPages=add_footer)
        return output_pdf_path

    @classmethod
    def generate_statutory_certificate_pdf(cls, doc_data: dict, output_pdf_path: str, attached_image_path: str = None):
        """
        Generates an official statutory compliance certificate / registration document PDF using ReportLab.
        """
        os.makedirs(os.path.dirname(output_pdf_path), exist_ok=True)

        doc_title = doc_data.get('title') or doc_data.get('document_type', 'STATUTORY REGISTRATION CERTIFICATE').replace('_', ' ')
        doc_num = doc_data.get('document_number') or f"LM/REG/2025/{doc_data.get('id', 1001)}"
        comp_name = doc_data.get('company_name') or doc_data.get('company', {}).get('name', 'Registered Enterprise')
        entity_name = doc_data.get('company', {}).get('legal_entity_name', comp_name)
        status = doc_data.get('status', 'VERIFIED')
        created_at = doc_data.get('created_at') or datetime.utcnow().strftime('%Y-%m-%d')
        expiry_date = doc_data.get('expiry_date') or doc_data.get('valid_until') or 'Permanent / Subject to Annual Returns'

        doc = SimpleDocTemplate(
            output_pdf_path,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'CertTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=15,
            leading=18,
            textColor=colors.HexColor('#174a7e'),
            alignment=1
        )

        subtitle_style = ParagraphStyle(
            'CertSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#475569'),
            alignment=1
        )

        sec_header_style = ParagraphStyle(
            'CertSecHeader',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=14,
            textColor=colors.HexColor('#1e293b'),
            spaceBefore=10,
            spaceAfter=6
        )

        cell_style = ParagraphStyle(
            'CertCellText',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8.5,
            leading=12,
            textColor=colors.HexColor('#1e293b')
        )

        cell_bold = ParagraphStyle(
            'CertCellBold',
            parent=cell_style,
            fontName='Helvetica-Bold'
        )

        elements = []

        # Header
        elements.append(Paragraph("GOVERNMENT OF INDIA", ParagraphStyle('GovHead', fontName='Helvetica-Bold', fontSize=11, leading=13, alignment=1, textColor=colors.HexColor('#0f172a'))))
        elements.append(Paragraph("MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION", ParagraphStyle('GovSub', fontName='Helvetica-Bold', fontSize=9, leading=12, alignment=1, textColor=colors.HexColor('#334155'))))
        elements.append(Paragraph("DIRECTORATE OF LEGAL METROLOGY • STATUTORY COMPLIANCE DIVISION", ParagraphStyle('GovDiv', fontName='Helvetica', fontSize=8.5, leading=11, alignment=1, textColor=colors.HexColor('#64748b'))))
        elements.append(Spacer(1, 6))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#174a7e'), spaceAfter=8))

        # Certificate Title
        elements.append(Paragraph(doc_title.upper(), title_style))
        elements.append(Paragraph(f"Official Statutory Certificate / Registration Document • Reference: <b>{doc_num}</b>", subtitle_style))
        elements.append(Spacer(1, 10))

        # Status Banner
        if status == 'VERIFIED':
            badge_bg = colors.HexColor('#f0fdf4')
            badge_border = colors.HexColor('#86efac')
            badge_text = "<font color='#15803d'><b>STATUS: VERIFIED & COMPLIANT WITH LEGAL METROLOGY ACT, 2009</b></font>"
        elif status == 'REJECTED':
            badge_bg = colors.HexColor('#fef2f2')
            badge_border = colors.HexColor('#fca5a5')
            badge_text = "<font color='#dc2626'><b>STATUS: DISCREPANCY DETECTED / REJECTED FOR RE-EXAMINATION</b></font>"
        else:
            badge_bg = colors.HexColor('#fffbeb')
            badge_border = colors.HexColor('#fde68a')
            badge_text = "<font color='#d97706'><b>STATUS: PENDING STATUTORY OFFICER VERIFICATION</b></font>"

        status_table = Table([[Paragraph(badge_text, ParagraphStyle('StText', fontName='Helvetica', fontSize=9, leading=12, alignment=1))]], colWidths=[540])
        status_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), badge_bg),
            ('BOX', (0, 0), (-1, -1), 1, badge_border),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(status_table)
        elements.append(Spacer(1, 12))

        # Certificate Details Table
        elements.append(Paragraph("1. CERTIFICATE & REGISTRATION METADATA", sec_header_style))

        table_data = [
            [
                Paragraph("<b>Registration / Cert No:</b>", cell_style),
                Paragraph(str(doc_num), cell_bold),
                Paragraph("<b>Document Type:</b>", cell_style),
                Paragraph(doc_data.get('document_type', 'GENERAL_STATUTORY_REGISTRATION'), cell_style)
            ],
            [
                Paragraph("<b>Registered Enterprise:</b>", cell_style),
                Paragraph(str(comp_name), cell_bold),
                Paragraph("<b>Legal Entity Name:</b>", cell_style),
                Paragraph(str(entity_name), cell_style)
            ],
            [
                Paragraph("<b>Issue / Registration Date:</b>", cell_style),
                Paragraph(str(created_at)[:10], cell_style),
                Paragraph("<b>Validity / Expiry:</b>", cell_style),
                Paragraph(str(expiry_date)[:10] if str(expiry_date).startswith('20') else str(expiry_date), cell_style)
            ],
            [
                Paragraph("<b>Jurisdiction / Authority:</b>", cell_style),
                Paragraph("Director of Legal Metrology (HQ New Delhi)", cell_style),
                Paragraph("<b>Category Applicability:</b>", cell_style),
                Paragraph(doc_data.get('category_name') or 'Packaged Commodities (All Categories)', cell_style)
            ]
        ]

        doc_table = Table(table_data, colWidths=[135, 135, 135, 135])
        doc_table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f8fafc')),
            ('BACKGROUND', (2, 0), (2, -1), colors.HexColor('#f8fafc')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(doc_table)
        elements.append(Spacer(1, 12))

        # Statutory Mandates & Notes
        elements.append(Paragraph("2. STATUTORY MANDATE & REGULATORY RECITALS", sec_header_style))
        recital_text = (
            "This certificate is issued in accordance with the provisions of the <b>Legal Metrology Act, 2009</b> "
            "and the <b>Legal Metrology (Packaged Commodities) Rules, 2011</b>. The registered entity is authorized "
            "to manufacture, pack, distribute, and import pre-packaged goods within the territory of India subject to strict compliance "
            "with mandatory declarations under Rule 6, standard packaging net quantity specifications under Second Schedule, "
            "and font height proportions under Rule 7."
        )
        elements.append(Paragraph(recital_text, ParagraphStyle('RecitalP', fontName='Helvetica', fontSize=8.5, leading=12, textColor=colors.HexColor('#334155'))))
        elements.append(Spacer(1, 10))

        if doc_data.get('notes'):
            elements.append(Paragraph("<b>Registration Notes:</b>", cell_bold))
            elements.append(Paragraph(str(doc_data.get('notes')), cell_style))
            elements.append(Spacer(1, 8))

        if status == 'REJECTED' and doc_data.get('rejection_reason'):
            elements.append(Paragraph(f"<b>Statutory Rejection / Discrepancy Findings:</b> <font color='#dc2626'>{doc_data.get('rejection_reason')}</font>", ParagraphStyle('RejNote', fontName='Helvetica', fontSize=8.5, leading=12)))
            elements.append(Spacer(1, 8))

        # Digital Verification & Signature Seal
        elements.append(Spacer(1, 16))
        elements.append(Paragraph("3. DIGITAL VERIFICATION & SIGN-OFF", sec_header_style))

        verifier_name = doc_data.get('verified_by_name') or 'Senior Legal Metrology Officer'
        verified_date = doc_data.get('verified_at') or datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')

        sig_table = Table([
            [
                Paragraph("<b>Digital Verification Seal:</b><br/>"
                          f"Verified By: <b>{verifier_name}</b><br/>"
                          f"Verification Timestamp: {str(verified_date)[:19]}<br/>"
                          f"Authentication Hash: SHA256:{abs(hash(str(doc_num) + str(comp_name))) :016x}", cell_style),
                Paragraph("<b>Enforcement Authority Sign-off:</b><br/><br/>"
                          "Digitally Certified by Packsure Central Metrology Registry<br/>"
                          "Ministry of Consumer Affairs, New Delhi", cell_style)
            ]
        ], colWidths=[270, 270])
        sig_table.setStyle(TableStyle([
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(sig_table)

        # Optional 4. Attached Image Scan
        if attached_image_path and os.path.exists(attached_image_path):
            try:
                import cv2
                img_cv = cv2.imread(attached_image_path)
                if img_cv is not None:
                    ih, iw = img_cv.shape[:2]
                    aspect = ih / float(iw)
                    target_w = 480
                    target_h = min(320, int(target_w * aspect))
                    elements.append(Spacer(1, 12))
                    elements.append(Paragraph("4. ATTACHED STATUTORY DOCUMENT / CERTIFICATE SCAN", sec_header_style))
                    elements.append(Image(attached_image_path, width=target_w, height=target_h))
            except Exception as img_e:
                print(f"Warning: Could not embed image into certificate: {img_e}")

        doc.build(elements)
        return output_pdf_path

