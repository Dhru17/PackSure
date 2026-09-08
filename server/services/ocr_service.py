import re
import os
import cv2
import numpy as np

from services.vision_analyzer import VisionAnalyzer

# Singleton RapidOCR engine
_RAPID_OCR_INSTANCE = None

def get_ocr_engine():
    global _RAPID_OCR_INSTANCE
    if _RAPID_OCR_INSTANCE is None:
        try:
            from rapidocr_onnxruntime import RapidOCR
            _RAPID_OCR_INSTANCE = RapidOCR()
        except Exception as e:
            print(f"Warning: RapidOCR initialization error: {e}")
            try:
                from paddleocr import PaddleOCR
                _RAPID_OCR_INSTANCE = PaddleOCR(use_angle_cls=False, lang='en')
            except Exception as e2:
                print(f"Warning: PaddleOCR initialization error: {e2}")
                _RAPID_OCR_INSTANCE = None
    return _RAPID_OCR_INSTANCE


ocr_engine = get_ocr_engine


class OCRService:
    """
    Authoritative OCR Detection, Recognition & Label-Value Matching Service.
    - Uses PP-OCRv4 / RapidOCR on OpenCV preprocessed images.
    - Preserves bounding boxes, confidence scores, and image sources.
    - Employs spatial and sequential token parsing (Label-Value Matcher).
    - Multi-image information fusion across Front, Back, Price Flap, and Side panels.
    - Never generates violations if OCR failed.
    """

    @classmethod
    def scan_single_image(cls, image_path, panel_name='Main Face'):
        """
        Runs OpenCV Preprocessing + PP-OCRv4 detection & recognition on a single image.
        Returns a list of detected text blocks with normalized coordinates and confidence.
        """
        if not image_path or not os.path.exists(image_path):
            return []

        # Read original image dimensions
        orig_img = cv2.imread(image_path)
        if orig_img is None:
            return []
        img_h, img_w = orig_img.shape[:2]

        # STEP 3: Preprocess image with OpenCV (CLAHE, deskew, noise filtering)
        enhanced_img, _ = VisionAnalyzer.preprocess_image_for_ocr(image_path)
        ocr_input = enhanced_img if enhanced_img is not None else orig_img

        engine = get_ocr_engine()
        if engine is None:
            return []

        blocks = []
        try:
            res, _ = engine(ocr_input)
            if res:
                for item in res:
                    # item format in RapidOCR: [box_points, text, score]
                    # box_points: [[x1, y1], [x2, y2], [x3, y3], [x4, y4]]
                    pts, text, score = item[0], item[1].strip(), float(item[2])
                    if not text:
                        continue

                    # Calculate axis-aligned bounding box
                    xs = [p[0] for p in pts]
                    ys = [p[1] for p in pts]
                    min_x, max_x = max(0, min(xs)), min(img_w, max(xs))
                    min_y, max_y = max(0, min(ys)), min(img_h, max(ys))

                    w_px = max(max_x - min_x, 1)
                    h_px = max(max_y - min_y, 1)

                    norm_bbox = {
                        'x': round(min_x / img_w, 4),
                        'y': round(min_y / img_h, 4),
                        'w': round(w_px / img_w, 4),
                        'h': round(h_px / img_h, 4),
                        'pixel_box': [int(min_x), int(min_y), int(w_px), int(h_px)],
                        'polygon': [[round(p[0]/img_w, 4), round(p[1]/img_h, 4)] for p in pts]
                    }

                    blocks.append({
                        'text': text,
                        'confidence': round(score, 4),
                        'bbox': norm_bbox,
                        'panel_name': panel_name,
                        'image_path': image_path
                    })
        except Exception as e:
            print(f"Error running OCR on {image_path}: {e}")

        # STEP 8: Barcode detection via pyzbar and OpenCV BarcodeDetector
        barcodes = VisionAnalyzer.detect_barcodes_robust(image_path, panel_name=panel_name)
        for bc in barcodes:
            blocks.append({
                'text': f"BARCODE: {bc['barcode_number']} ({bc['barcode_type']})",
                'confidence': bc['confidence'],
                'bbox': bc['bounding_box'],
                'panel_name': panel_name,
                'image_path': image_path,
                'is_barcode': True,
                'barcode_number': bc['barcode_number'],
                'barcode_type': bc['barcode_type']
            })

        return blocks

    @classmethod
    def extract_from_multi_panels(cls, panel_images, manual_text_override=None, package_info=None):
        """
        STEP 6 & 7 — Multi-Image Fusion and Structured 16-Field Extraction.
        Extracts and merges declarations across multiple packaging faces.
        Returns:
        1. structured_fields (The 16 mandatory & optional fields with evidence)
        2. all_ocr_blocks (All raw OCR blocks detected across all panels)
        3. ocr_success (True if OCR successfully extracted text from at least one image)
        """
        all_blocks = []
        panels_scanned = 0

        for panel in panel_images:
            p_name = panel.get('panel_name', 'Main Face')
            img_path = panel.get('image_path')
            if img_path and os.path.exists(img_path):
                panels_scanned += 1
                panel_blocks = cls.scan_single_image(img_path, panel_name=p_name)
                all_blocks.extend(panel_blocks)

        ocr_success = len(all_blocks) > 0

        # Build default structured record
        structured = cls._init_structured_json()

        if not ocr_success:
            if manual_text_override and manual_text_override.strip():
                structured = cls._parse_manual_override(manual_text_override, structured)
            return structured, all_blocks, ocr_success

        # STEP 5: Run Label-Value Matcher on OCR blocks
        cls._run_label_value_matcher(all_blocks, structured, package_info)

        # If manual text override provided, fill in missing fields with low confidence
        if manual_text_override and manual_text_override.strip():
            structured = cls._fill_missing_from_manual(manual_text_override, structured)

        return structured, all_blocks, ocr_success

    @classmethod
    def _init_structured_json(cls):
        """Initializes the 16 structured fields with empty evidence."""
        fields = [
            'brand_name',
            'product_name',
            'generic_commodity_name',
            'generic_name',
            'manufacturer_name',
            'manufacturer_address',
            'packer_name',
            'importer_name',
            'net_quantity',
            'unit',
            'mrp',
            'manufacturing_or_packing_date',
            'batch_or_lot_number',
            'consumer_care_phone',
            'consumer_care_email',
            'consumer_care_address',
            'country_of_origin',
            'barcode',
            'fssai_number'
        ]
        result = {}
        for f in fields:
            result[f] = {
                'value': None,
                'extracted_value': None,
                'confidence': 0.0,
                'source_image': None,
                'image_source': None,
                'bounding_box': {'x': 0.0, 'y': 0.0, 'w': 0.0, 'h': 0.0},
                'raw_ocr_text': '',
                'raw_text': ''
            }
        return result

    @classmethod
    def _set_field(cls, structured, field_name, value, confidence, image_source, bbox, raw_text):
        """Sets field value ensuring both new and backward-compatible keys are populated."""
        if not value:
            return
        val_str = str(value).strip()
        record = {
            'value': val_str,
            'extracted_value': val_str,
            'confidence': round(float(confidence), 4),
            'source_image': image_source,
            'image_source': image_source,
            'bounding_box': bbox,
            'raw_ocr_text': raw_text.strip(),
            'raw_text': raw_text.strip()
        }
        structured[field_name] = record
        # Sync generic_commodity_name and generic_name
        if field_name == 'generic_commodity_name':
            structured['generic_name'] = record
        elif field_name == 'generic_name':
            structured['generic_commodity_name'] = record

    @classmethod
    def _update_field_if_better(cls, structured, field_name, value, confidence, image_source, bbox, raw_text):
        """Updates a field if the candidate has higher OCR confidence or current is empty."""
        current = structured.get(field_name, {})
        curr_conf = current.get('confidence', 0.0)
        curr_val = current.get('value') or current.get('extracted_value')
        if value and (confidence > curr_conf or not curr_val):
            cls._set_field(structured, field_name, value, confidence, image_source, bbox, raw_text)

    # -------------------------------------------------------------
    # STEP 5 — LABEL-VALUE MATCHER (CRITICAL ENGINE)
    # -------------------------------------------------------------
    @classmethod
    def _run_label_value_matcher(cls, blocks, structured, package_info=None):
        """
        Converts raw OCR tokens into verified key-value pairs.
        Prevents storing field labels ('MFG DATE', 'LOT NO') as values.
        """
        cls._match_mrp(blocks, structured)
        cls._match_net_quantity(blocks, structured)
        cls._match_mfg_date(blocks, structured)
        cls._match_lot_number(blocks, structured)
        cls._match_manufacturer_and_address(blocks, structured)
        cls._match_consumer_care(blocks, structured)
        cls._match_barcode(blocks, structured)
        cls._match_fssai(blocks, structured)
        cls._match_country_of_origin(blocks, structured)
        cls._match_brand_and_commodity(blocks, structured, package_info)

    @classmethod
    def _match_mfg_date(cls, blocks, structured):
        """
        Extracts actual date of manufacture / packing.
        Accepts: MM/YYYY, MMM YYYY, Month YYYY, DD/MM/YYYY, etc.
        Never stores 'MFG DATE' or 'PKD' label as the date!
        """
        # Patterns for actual date values
        date_val_pattern = re.compile(
            r'(?:'
            r'(?:0[1-9]|1[0-2])[\/\-\.\s](?:20\d\d|\d\d)|'
            r'(?:0[1-9]|[12]\d|3[01])[\/\-\.\s](?:0[1-9]|1[0-2])[\/\-\.\s](?:20\d\d|\d\d)|'
            r'(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*[\s\,\-\.\/]+(?:20\d\d|\d\d)|'
            r'(?:0[1-9]|[12]\d|3[01])[\s\,\-\.\/]+(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*[\s\,\-\.\/]+(?:20\d\d|\d\d)'
            r')',
            re.IGNORECASE
        )

        label_keywords = re.compile(r'\b(mfg(\s+date)?|mfd|date\s+of\s+mfg|pkd|packed|date\s+of\s+packing|best\s+before|exp(\s+date)?|use\s+by)\b', re.IGNORECASE)

        # 1. Inline extraction: e.g. "MFG DATE: AUG 2026" or "MFD 15/08/2026"
        for b in blocks:
            txt = b['text']
            if label_keywords.search(txt):
                match = date_val_pattern.search(txt)
                if match:
                    val = match.group(0).strip()
                    cls._update_field_if_better(
                        structured, 'manufacturing_or_packing_date',
                        val, b['confidence'], b['panel_name'], b['bbox'], txt
                    )
                    return

        # 2. Sequential / Lookahead extraction:
        # If block i is label "MFG DATE" or "PKD", check blocks i+1 to i+3
        for i, b in enumerate(blocks):
            txt = b['text'].strip()
            # If line is strictly or predominantly a date label
            if label_keywords.search(txt):
                for j in range(i + 1, min(i + 4, len(blocks))):
                    next_b = blocks[j]
                    next_txt = next_b['text'].strip()
                    match = date_val_pattern.search(next_txt)
                    if match:
                        val = match.group(0).strip()
                        comb_text = f"{txt} -> {next_txt}"
                        cls._update_field_if_better(
                            structured, 'manufacturing_or_packing_date',
                            val, next_b['confidence'], next_b['panel_name'], next_b['bbox'], comb_text
                        )
                        return

        # 3. Fallback to any standalone date token found on Price Flap or Back Face
        for b in blocks:
            txt = b['text'].strip()
            match = date_val_pattern.search(txt)
            if match:
                val = match.group(0).strip()
                # Ensure it's not a phone number or PIN code
                if not re.search(r'\b\d{6}\b', val) and not re.search(r'\b1800\b', val):
                    cls._update_field_if_better(
                        structured, 'manufacturing_or_packing_date',
                        val, b['confidence'] * 0.85, b['panel_name'], b['bbox'], txt
                    )
                    return

    @classmethod
    def _match_lot_number(cls, blocks, structured):
        """
        Extracts actual Batch or Lot number (e.g. L23145A, B-492).
        Never stores 'LOT NO' label as the lot number!
        """
        lot_label = re.compile(r'\b(lot(\s+no)?|batch(\s+no)?|b\.?\s*no|batch|lot)\s*[\:\-\.]*', re.IGNORECASE)

        # 1. Inline match: e.g. "LOT NO: L23145A" or "B.No. 4921A"
        for b in blocks:
            txt = b['text']
            match = re.search(r'\b(?:lot\s*no|batch\s*no|b\.?\s*no|lot|batch)\s*[\:\-\.]\s*([A-Za-z0-9\-\/]{3,16})\b', txt, re.IGNORECASE)
            if match:
                val = match.group(1).strip()
                if val.upper() not in ['DATE', 'PRICE', 'MRP', 'NO', 'NUMBER']:
                    cls._update_field_if_better(
                        structured, 'batch_or_lot_number',
                        val, b['confidence'], b['panel_name'], b['bbox'], txt
                    )
                    return

        # 2. Sequential match: Block i has label, Block i+1 has code
        for i, b in enumerate(blocks):
            txt = b['text'].strip()
            if lot_label.search(txt):
                for j in range(i + 1, min(i + 3, len(blocks))):
                    next_txt = blocks[j]['text'].strip()
                    # Check if next_txt looks like a lot number (3-16 chars alphanumeric)
                    if re.match(r'^[A-Za-z0-9\-\/]{3,16}$', next_txt):
                        if next_txt.upper() not in ['DATE', 'PRICE', 'MRP', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL']:
                            comb = f"{txt} {next_txt}"
                            cls._update_field_if_better(
                                structured, 'batch_or_lot_number',
                                next_txt, blocks[j]['confidence'], blocks[j]['panel_name'], blocks[j]['bbox'], comb
                            )
                            return

    @classmethod
    def _match_mrp(cls, blocks, structured):
        """
        Extracts MRP price and checks for mandatory 'inclusive of all taxes'.
        """
        price_num_pattern = re.compile(r'(?:₹|rs\.?|mrp[\s\:\-\.]*(?:₹|rs\.?)?)\s*([\d,]+(?:\.\d{1,2})?)', re.IGNORECASE)
        mrp_kw = re.compile(r'\b(mrp|m\.r\.p\b|max(\.|\s)?retail\s+price|price|₹|rs\.?)\b', re.IGNORECASE)

        for b in blocks:
            txt = b['text']
            if mrp_kw.search(txt):
                match = price_num_pattern.search(txt)
                if match:
                    val = match.group(0).strip()
                    cls._update_field_if_better(
                        structured, 'mrp',
                        val, b['confidence'], b['panel_name'], b['bbox'], txt
                    )

        # If mrp label was separate from price numerals
        if not structured['mrp']['value']:
            for i, b in enumerate(blocks):
                txt = b['text'].strip()
                if re.match(r'^(?:mrp|m\.r\.p\.?|max\.?\s*retail\s*price)[\s\:\-\.]*$', txt, re.IGNORECASE):
                    for j in range(i + 1, min(i + 3, len(blocks))):
                        next_txt = blocks[j]['text'].strip()
                        m = re.search(r'([\d,]+(?:\.\d{1,2})?)', next_txt)
                        if m:
                            val = f"₹ {m.group(1)}"
                            comb = f"{txt} {next_txt}"
                            cls._update_field_if_better(
                                structured, 'mrp',
                                val, blocks[j]['confidence'], blocks[j]['panel_name'], blocks[j]['bbox'], comb
                            )
                            break

        # Check for Unit Sale Price (USP)
        for b in blocks:
            txt = b['text']
            if re.search(r'\b(usp|unit\s+sale\s+price)\b|(?:\/|\bper\b)\s*(?:kg|g|100g|ml|l|unit|piece|item)\b', txt, re.IGNORECASE):
                cls._update_field_if_better(
                    structured, 'unit_sale_price',
                    txt, b['confidence'], b['panel_name'], b['bbox'], txt
                )

    @classmethod
    def _match_net_quantity(cls, blocks, structured):
        """
        Extracts numeric Net Quantity and Unit.
        Captures standard SI units (g, kg, ml, l, m) and detects non-standard variants.
        """
        qty_pattern = re.compile(
            r'(?:net\s*(?:qty|quantity|wt|weight|content)s?[\s\:\-]+)?'
            r'(\d+(?:\.\d+)?)\s*'
            r'(g|gms?|kg|kgs?|ml|ltrs?|l|L|mg|units?|pieces?|pcs|capsules?|N|U)\b',
            re.IGNORECASE
        )

        for b in blocks:
            txt = b['text']
            match = qty_pattern.search(txt)
            if match:
                val = match.group(1).strip()
                unit = match.group(2).strip()
                cls._update_field_if_better(
                    structured, 'net_quantity',
                    val, b['confidence'], b['panel_name'], b['bbox'], txt
                )
                cls._update_field_if_better(
                    structured, 'unit',
                    unit, b['confidence'], b['panel_name'], b['bbox'], txt
                )

    @classmethod
    def _match_manufacturer_and_address(cls, blocks, structured):
        """
        Extracts Manufacturer/Packer Name and complete postal address.
        Aggregates multi-line address blocks following 'MFD BY:' / 'MANUFACTURED BY:'.
        """
        mfg_kw = re.compile(r'\b(mfd\s+by|manufactured\s+by|mfg\s+by|producer|packer|packed\s+by|pkd\s+by)\b', re.IGNORECASE)
        address_markers = re.compile(r'\b\d{6}\b|road|street|nagar|plot|industrial|phase|city|india|dist|state|estate|village|taluk|lane', re.IGNORECASE)

        # 1. Look for explicit manufacturer label and capture subsequent address lines
        for i, b in enumerate(blocks):
            txt = b['text'].strip()
            if mfg_kw.search(txt):
                # Clean label prefix
                clean_name = re.sub(r'^(?:mfd\s+by|manufactured\s+by|mfg\s+by|packed\s+by|pkd\s+by)[\s\:\-\.]*', '', txt, flags=re.IGNORECASE).strip()
                if not clean_name and i + 1 < len(blocks):
                    clean_name = blocks[i + 1]['text'].strip()

                if clean_name:
                    cls._update_field_if_better(
                        structured, 'manufacturer_name',
                        clean_name, b['confidence'], b['panel_name'], b['bbox'], txt
                    )

                # Gather address lines from current and next 1-4 blocks
                address_parts = []
                if address_markers.search(txt):
                    address_parts.append(txt)

                for j in range(i + 1, min(i + 5, len(blocks))):
                    next_txt = blocks[j]['text'].strip()
                    # Stop if next section reached
                    if re.search(r'\b(consumer\s+care|mrp|fssai|net\s+wt|lic\s+no|batch)\b', next_txt, re.IGNORECASE):
                        break
                    if address_markers.search(next_txt) or len(next_txt) > 8:
                        address_parts.append(next_txt)

                if address_parts:
                    full_address = ", ".join(address_parts)
                    cls._update_field_if_better(
                        structured, 'manufacturer_address',
                        full_address, b['confidence'], b['panel_name'], b['bbox'], full_address
                    )
                return

        # 2. If manufacturer address is still missing, scan for blocks with 6-digit PIN code + street/city
        for b in blocks:
            txt = b['text']
            if re.search(r'\b\d{6}\b', txt) and address_markers.search(txt):
                cls._update_field_if_better(
                    structured, 'manufacturer_address',
                    txt, b['confidence'], b['panel_name'], b['bbox'], txt
                )
                break

    @classmethod
    def _match_consumer_care(cls, blocks, structured):
        """
        Extracts Consumer Care Phone, Email, and Grievance Address.
        """
        phone_pattern = re.compile(r'(\b1800[-\s]?\d{3}[-\s]?\d{3,4}\b|\b\+?91[-\s]?[6-9]\d{9}\b|\b[6-9]\d{9}\b|\btel\s*[:\-\.]?\s*[\d\-]+|\bcall\s*[:\-\.]?\s*[\d\-]+)', re.IGNORECASE)
        email_pattern = re.compile(r'([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)')
        care_kw = re.compile(r'\b(consumer\s+care|customer\s+care|feedback|complaint|helpline|query)\b', re.IGNORECASE)

        for b in blocks:
            txt = b['text']
            # Phone match
            p_match = phone_pattern.search(txt)
            if p_match:
                cls._update_field_if_better(
                    structured, 'consumer_care_phone',
                    p_match.group(0).strip(), b['confidence'], b['panel_name'], b['bbox'], txt
                )

            # Email match
            e_match = email_pattern.search(txt)
            if e_match:
                cls._update_field_if_better(
                    structured, 'consumer_care_email',
                    e_match.group(0).strip(), b['confidence'], b['panel_name'], b['bbox'], txt
                )

            # Care address
            if care_kw.search(txt):
                cls._update_field_if_better(
                    structured, 'consumer_care_address',
                    txt, b['confidence'], b['panel_name'], b['bbox'], txt
                )

    @classmethod
    def _match_barcode(cls, blocks, structured):
        """Extracts Barcode number and bounding box from barcode detection blocks."""
        for b in blocks:
            if b.get('is_barcode'):
                cls._set_field(
                    structured, 'barcode',
                    b['barcode_number'], b['confidence'], b['panel_name'], b['bbox'], b['text']
                )
                return

    @classmethod
    def _match_fssai(cls, blocks, structured):
        """Extracts 14-digit FSSAI License Number."""
        fssai_pattern = re.compile(r'\b(?:fssai|lic(\.|\s)?no\.?)?[\s\:\-\.]*(\d{14})\b', re.IGNORECASE)
        for b in blocks:
            txt = b['text']
            match = fssai_pattern.search(txt)
            if match:
                val = match.group(1) if match.group(1) else match.group(0)
                cls._update_field_if_better(
                    structured, 'fssai_number',
                    val.strip(), b['confidence'], b['panel_name'], b['bbox'], txt
                )
                return

    @classmethod
    def _match_country_of_origin(cls, blocks, structured):
        """Extracts Country of Origin declaration."""
        origin_pattern = re.compile(r'\b(country\s+of\s+origin|made\s+in|product\s+of)\s*[:\-]?\s*([a-zA-Z\s]+)', re.IGNORECASE)
        for b in blocks:
            txt = b['text']
            match = origin_pattern.search(txt)
            if match:
                country = match.group(2).strip()
                val = f"Country of Origin: {country}" if country else txt
                cls._update_field_if_better(
                    structured, 'country_of_origin',
                    val, b['confidence'], b['panel_name'], b['bbox'], txt
                )
                return

    @classmethod
    def _match_brand_and_commodity(cls, blocks, structured, package_info=None):
        """
        Differentiates Brand Name from Generic Commodity Name.
        Ensures Brand != Commodity (e.g. Brand=UNIBIC, Commodity=Cookies / Biscuits).
        """
        commodity_kw = re.compile(r'\b(commodity|name\s+of\s+commodity|product\s+name|category)\s*[:\-]\s*(.+)', re.IGNORECASE)

        # 1. Look for explicit commodity declaration
        for b in blocks:
            txt = b['text']
            m = commodity_kw.search(txt)
            if m:
                cls._update_field_if_better(
                    structured, 'generic_commodity_name',
                    m.group(2).strip(), b['confidence'], b['panel_name'], b['bbox'], txt
                )
                break

        # 2. Package info override
        if package_info:
            brand_in = package_info.get('brand', '').strip()
            comm_in = package_info.get('commodity_name', '').strip()

            if brand_in and brand_in.lower() != 'inspected product':
                cls._update_field_if_better(
                    structured, 'brand_name',
                    brand_in, 0.95, 'User Input / Front Face', {'x': 0.1, 'y': 0.05, 'w': 0.8, 'h': 0.08}, brand_in
                )

            if comm_in and comm_in.lower() != 'packaged commodity':
                cls._update_field_if_better(
                    structured, 'generic_commodity_name',
                    comm_in, 0.95, 'User Input / Front Face', {'x': 0.1, 'y': 0.15, 'w': 0.8, 'h': 0.08}, comm_in
                )

        # 3. If commodity still equals brand or is missing, search PDP blocks
        brand_val = structured['brand_name'].get('value')
        comm_val = structured['generic_commodity_name'].get('value')

        common_commodities = [
            'biscuits', 'cookies', 'wafer', 'rusk', 'bread', 'cake',
            'atta', 'flour', 'rice', 'wheat', 'dal', 'pulses', 'sugar', 'salt',
            'milk', 'butter', 'ghee', 'cheese', 'paneer', 'curd',
            'tea', 'coffee', 'juice', 'water', 'oil', 'chips', 'namkeen', 'snack',
            'noodles', 'pasta', 'soap', 'shampoo', 'detergent', 'toothpaste'
        ]

        if not comm_val or (brand_val and comm_val.lower() == brand_val.lower()):
            for b in blocks:
                txt_lower = b['text'].lower()
                for c in common_commodities:
                    if c in txt_lower and (not brand_val or c != brand_val.lower()):
                        cls._set_field(
                            structured, 'generic_commodity_name',
                            c.capitalize(), b['confidence'], b['panel_name'], b['bbox'], b['text']
                        )
                        break
                if structured['generic_commodity_name'].get('value'):
                    break

        # Populate product_name
        b_name = structured['brand_name'].get('value') or 'Packaged Product'
        c_name = structured['generic_commodity_name'].get('value') or 'Commodity'
        cls._set_field(
            structured, 'product_name',
            f"{b_name} {c_name}".strip(), 0.90, 'Unified', {'x': 0.1, 'y': 0.1, 'w': 0.8, 'h': 0.1}, f"{b_name} {c_name}"
        )

    @classmethod
    def _fill_missing_from_manual(cls, manual_text, structured):
        """Fills remaining empty fields from user manual text override with low confidence."""
        # Simple extraction helper
        lines = [l.strip() for l in manual_text.split('\n') if l.strip()]
        for line in lines:
            if ':' in line:
                k, v = line.split(':', 1)
                k_norm = k.strip().lower().replace(' ', '_')
                v_str = v.strip()
                if v_str and k_norm in structured and not structured[k_norm].get('value'):
                    cls._set_field(structured, k_norm, v_str, 0.75, 'Manual Override', {'x': 0.1, 'y': 0.1, 'w': 0.8, 'h': 0.05}, line)
        return structured
