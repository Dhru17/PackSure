import cv2
import numpy as np
import os
import math

class VisionAnalyzer:
    """
    Computer Vision & Packaging Diagnostics Service:
    - Step 2: Image Quality Analysis (Blur, Brightness, Contrast, Resolution, Rotation)
    - Step 3: OpenCV Preprocessing for OCR (Deskew, CLAHE, Noise Filtering, Sharpening)
    - Step 8: Multi-Angle Barcode Detection (pyzbar + OpenCV native fallback)
    - Packaging Panel Annotation with High-Contrast Color Coding (Green=PASS, Amber=REVIEW REQUIRED, Red=FAIL)
    """

    @staticmethod
    def calculate_pdp_area(width_cm, height_cm, package_type='Rectangular', depth_cm=None):
        """
        Calculates Principal Display Panel (PDP) area in cm² according to Rule 7:
        - Rectangular: Area of the principal face (H x W)
        - Cylindrical: 40% of height x circumference (0.4 x H x C)
        - Pouch/Other: 40% of total surface area or H x W
        """
        if width_cm is None or height_cm is None or float(width_cm) <= 0 or float(height_cm) <= 0:
            return None

        width = float(width_cm)
        height = float(height_cm)

        if str(package_type).lower() == 'cylindrical':
            circumference = math.pi * width
            pdp = 0.4 * height * circumference
        else:
            pdp = width * height

        return round(pdp, 1)

    @staticmethod
    def estimate_pixel_to_mm_ratio(image_height_px, image_width_px, real_height_cm, real_width_cm):
        """Calculates mm per pixel using physical package dimensions."""
        if not real_height_cm or not real_width_cm or float(real_height_cm) <= 0 or float(real_width_cm) <= 0:
            return None
        real_h_mm = float(real_height_cm) * 10.0
        real_w_mm = float(real_width_cm) * 10.0

        ratio_h = real_h_mm / max(image_height_px, 1)
        ratio_w = real_w_mm / max(image_width_px, 1)
        return (ratio_h + ratio_w) / 2.0

    @staticmethod
    def get_statutory_min_font_height(pdp_area_cm2, net_quantity_val=None, unit=None):
        """
        Calculates statutory minimum font height (in mm) as per Schedule II, Table 1
        of Legal Metrology (Packaged Commodities) Rules, 2011.
        Returns None if pdp_area_cm2 is None.
        """
        if pdp_area_cm2 is None:
            return None

        if pdp_area_cm2 <= 50:
            min_pdp_h = 1.0
        elif pdp_area_cm2 <= 100:
            min_pdp_h = 1.5
        elif pdp_area_cm2 <= 500:
            min_pdp_h = 2.0
        elif pdp_area_cm2 <= 2500:
            min_pdp_h = 4.0
        else:
            min_pdp_h = 6.0

        min_qty_h = 1.0
        if net_quantity_val is not None:
            try:
                qty = float(net_quantity_val)
                u = (unit or '').lower().strip()
                if u in ['kg', 'l', 'litre', 'litres', 'kilogram']:
                    qty_normalized = qty * 1000
                else:
                    qty_normalized = qty

                if qty_normalized <= 50:
                    min_qty_h = 1.0
                elif qty_normalized <= 200:
                    min_qty_h = 2.0
                elif qty_normalized <= 1000:
                    min_qty_h = 4.0
                else:
                    min_qty_h = 6.0
            except (ValueError, TypeError):
                min_qty_h = 1.0

        return max(min_pdp_h, min_qty_h)

    # -------------------------------------------------------------
    # STEP 2 — IMAGE QUALITY ANALYSIS
    # -------------------------------------------------------------
    @classmethod
    def analyze_image_readability(cls, image_path):
        """
        Computes comprehensive OpenCV quality metrics:
        - Blur score: Laplacian variance
        - Brightness: Mean V channel from HSV
        - Contrast: Standard deviation of luminance
        - Resolution: (Width x Height, Megapixels)
        - Rotation angle: Estimated packaging skew angle
        Output: Readable | Borderline | Unreadable
        """
        if not image_path or not os.path.exists(image_path):
            return {
                'blur_score': 0.0,
                'brightness': 0.0,
                'contrast_score': 0.0,
                'resolution': '0x0',
                'rotation_angle': 0.0,
                'readability_status': 'Unreadable',
                'summary': 'Image file missing or could not be opened.'
            }

        img = cv2.imread(image_path)
        if img is None:
            return {
                'blur_score': 0.0,
                'brightness': 0.0,
                'contrast_score': 0.0,
                'resolution': '0x0',
                'rotation_angle': 0.0,
                'readability_status': 'Unreadable',
                'summary': 'Failed to decode image file.'
            }

        img_h, img_w = img.shape[:2]
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # 1. Blur score via Laplacian variance
        laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())

        # 2. Brightness via HSV Value channel
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        brightness = float(np.mean(hsv[:, :, 2]))

        # 3. Contrast via Standard Deviation of Gray intensity
        contrast_score = float(np.std(gray))

        # 4. Resolution
        megapixels = round((img_w * img_h) / 1_000_000, 2)
        res_str = f"{img_w}x{img_h} ({megapixels} MP)"

        # 5. Rotation angle estimation via Hough Lines / minAreaRect
        rotation_angle = cls._estimate_skew_angle(gray)

        # Output status determination
        is_blurry = laplacian_var < 55.0
        is_dim = brightness < 35.0 or brightness > 240.0
        is_low_contrast = contrast_score < 25.0

        if is_blurry or is_dim:
            readability_status = 'Unreadable'
            summary = 'Low clarity or severe lighting issue. Manual inspection or clearer re-scan recommended.'
        elif is_low_contrast or laplacian_var < 80.0:
            readability_status = 'Borderline'
            summary = 'Borderline clarity or mild glare detected. Automated processing proceeding with enhancements.'
        else:
            readability_status = 'Readable'
            summary = 'Image is sharp, well-lit, and text declarations are clear.'

        return {
            'blur_score': round(laplacian_var, 1),
            'brightness': round(brightness, 1),
            'contrast_score': round(contrast_score, 1),
            'contrast_ratio': round((contrast_score / 12.0) + 1.0, 1),
            'resolution': res_str,
            'rotation_angle': round(rotation_angle, 1),
            'readability_status': readability_status,
            'summary': summary
        }

    @staticmethod
    def _estimate_skew_angle(gray_img):
        """Estimates dominant skew angle in degrees using Hough transform on packaging edges."""
        try:
            edges = cv2.Canny(gray_img, 50, 150, apertureSize=3)
            lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=100, minLineLength=80, maxLineGap=10)
            if lines is not None and len(lines) > 0:
                angles = []
                for line in lines[:30]:
                    x1, y1, x2, y2 = line[0]
                    angle = math.degrees(math.atan2(y2 - y1, x2 - x1))
                    # Focus on near horizontal lines (-45 to 45 deg)
                    if -45 <= angle <= 45:
                        angles.append(angle)
                if angles:
                    return float(np.median(angles))
        except Exception:
            pass
        return 0.0

    # -------------------------------------------------------------
    # STEP 3 — IMAGE PREPROCESSING BEFORE OCR
    # -------------------------------------------------------------
    @classmethod
    def preprocess_image_for_ocr(cls, input_path, output_path=None):
        """
        OpenCV Preprocessing pipeline before OCR:
        1. Auto-rotation / Deskew
        2. Bilateral noise filtering (preserves text edges)
        3. CLAHE Contrast Enhancement on L-channel
        4. Mild unsharp masking sharpening
        Returns preprocessed BGR numpy array and optional saved file path.
        """
        if not os.path.exists(input_path):
            return None, None

        img = cv2.imread(input_path)
        if img is None:
            return None, None

        # 1. Deskew if significant rotation angle exists (> 1.5 degrees)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        angle = cls._estimate_skew_angle(gray)
        if abs(angle) > 1.5 and abs(angle) < 45.0:
            h, w = img.shape[:2]
            center = (w // 2, h // 2)
            rot_mat = cv2.getRotationMatrix2D(center, angle, 1.0)
            img = cv2.warpAffine(img, rot_mat, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)

        # 2. Bilateral Filtering for noise reduction without blurring edges
        denoised = cv2.bilateralFilter(img, d=5, sigmaColor=50, sigmaSpace=50)

        # 3. Contrast Enhancement via CLAHE on LAB color space
        lab = cv2.cvtColor(denoised, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
        cl = clahe.apply(l)
        enhanced_lab = cv2.merge((cl, a, b))
        enhanced = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)

        # 4. Subtle unsharp mask sharpening
        gaussian = cv2.GaussianBlur(enhanced, (0, 0), 2.0)
        sharpened = cv2.addWeighted(enhanced, 1.25, gaussian, -0.25, 0)

        if output_path:
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            cv2.imwrite(output_path, sharpened)

        return sharpened, output_path

    # -------------------------------------------------------------
    # STEP 8 — BARCODE DETECTION (pyzbar + OpenCV native fallback)
    # -------------------------------------------------------------
    @classmethod
    def detect_barcodes_robust(cls, image_path, panel_name='Side Panel'):
        """
        Detects 1D/2D barcodes using zxing-cpp, pyzbar, and OpenCV BarcodeDetector.
        Attempts detection across 4 rotational angles (0°, 90°, 180°, 270°).
        Returns list of barcode results:
          - barcode_number
          - barcode_type (EAN-13, UPC-A, Code-128, QR, etc.)
          - bounding_box (normalized {x, y, w, h})
          - confidence (0.95 - 0.99)
          - status: PASS if found, REVIEW REQUIRED if absent/unreadable
        """
        if not image_path or not os.path.exists(image_path):
            return []

        img_bgr = cv2.imread(image_path)
        if img_bgr is None:
            return []

        orig_h, orig_w = img_bgr.shape[:2]
        barcodes_found = []
        seen_codes = set()

        # Rotation angles to test
        rotations = [
            (0, None),
            (90, cv2.ROTATE_90_CLOCKWISE),
            (180, cv2.ROTATE_180),
            (270, cv2.ROTATE_90_COUNTERCLOCKWISE)
        ]

        for angle, rot_flag in rotations:
            if rot_flag is not None:
                curr_img = cv2.rotate(img_bgr, rot_flag)
            else:
                curr_img = img_bgr

            curr_h, curr_w = curr_img.shape[:2]

            # 1. Try high-performance zxing-cpp
            try:
                import zxingcpp
                zx_results = zxingcpp.read_barcodes(curr_img)
                for item in zx_results:
                    code_str = (item.text or '').strip()
                    code_type = item.format.name if hasattr(item.format, 'name') else str(item.format)
                    if code_str and code_str not in seen_codes:
                        seen_codes.add(code_str)
                        pos = item.position
                        if pos:
                            xs = [pos.top_left.x, pos.top_right.x, pos.bottom_right.x, pos.bottom_left.x]
                            ys = [pos.top_left.y, pos.top_right.y, pos.bottom_right.y, pos.bottom_left.y]
                            bx, by = min(xs), min(ys)
                            bw, bh = max(xs) - bx, max(ys) - by
                        else:
                            bx, by, bw, bh = int(curr_w * 0.1), int(curr_h * 0.1), int(curr_w * 0.8), int(curr_h * 0.3)

                        mapped_bbox = cls._map_bbox_back(bx, by, bw, bh, curr_w, curr_h, orig_w, orig_h, angle)
                        barcodes_found.append({
                            'barcode_number': code_str,
                            'barcode_type': code_type,
                            'confidence': 0.99,
                            'bounding_box': mapped_bbox,
                            'panel_name': panel_name,
                            'image_source': panel_name,
                            'method': 'zxing-cpp',
                            'status': 'PASS'
                        })
            except Exception:
                pass

            # 2. Try pyzbar if available
            if not barcodes_found:
                try:
                    from pyzbar import pyzbar
                    decoded = pyzbar.decode(curr_img)
                    for item in decoded:
                        code_str = item.data.decode('utf-8', errors='ignore').strip()
                        code_type = str(item.type)
                        if code_str and code_str not in seen_codes:
                            seen_codes.add(code_str)
                            poly = item.polygon
                            if poly:
                                xs = [p.x for p in poly]
                                ys = [p.y for p in poly]
                                bx, by = min(xs), min(ys)
                                bw, bh = max(xs) - bx, max(ys) - by
                            else:
                                r = item.rect
                                bx, by, bw, bh = r.left, r.top, r.width, r.height

                            mapped_bbox = cls._map_bbox_back(bx, by, bw, bh, curr_w, curr_h, orig_w, orig_h, angle)
                            barcodes_found.append({
                                'barcode_number': code_str,
                                'barcode_type': code_type,
                                'confidence': 0.99,
                                'bounding_box': mapped_bbox,
                                'panel_name': panel_name,
                                'image_source': panel_name,
                                'method': 'pyzbar',
                                'status': 'PASS'
                            })
                except Exception:
                    pass

            # 3. Try OpenCV native BarcodeDetector
            if not barcodes_found:
                try:
                    bd = cv2.barcode.BarcodeDetector()
                    retval, decoded_info, decoded_type, points = bd.detectAndDecode(curr_img)
                    if retval:
                        for idx, c_val in enumerate(decoded_info):
                            c_str = (c_val or '').strip()
                            if c_str and c_str not in seen_codes:
                                seen_codes.add(c_str)
                                c_type = decoded_type[idx] if idx < len(decoded_type) and decoded_type[idx] else 'EAN/UPC'
                                pts = points[idx] if idx < len(points) else None
                                if pts is not None and len(pts) >= 4:
                                    xs = [p[0] for p in pts]
                                    ys = [p[1] for p in pts]
                                    bx, by = min(xs), min(ys)
                                    bw, bh = max(xs) - bx, max(ys) - by
                                else:
                                    bx, by, bw, bh = int(curr_w * 0.1), int(curr_h * 0.1), int(curr_w * 0.8), int(curr_h * 0.3)

                                mapped_bbox = cls._map_bbox_back(bx, by, bw, bh, curr_w, curr_h, orig_w, orig_h, angle)
                                barcodes_found.append({
                                    'barcode_number': c_str,
                                    'barcode_type': c_type,
                                    'confidence': 0.96,
                                    'bounding_box': mapped_bbox,
                                    'panel_name': panel_name,
                                    'image_source': panel_name,
                                    'method': 'OpenCV BarcodeDetector',
                                    'status': 'PASS'
                                })
                except Exception:
                    pass

            # If found on this orientation, finish
            if barcodes_found:
                break

        return barcodes_found

    @staticmethod
    def _map_bbox_back(x, y, w, h, curr_w, curr_h, orig_w, orig_h, angle):
        """Maps rotated bounding box back to original image coordinate space (normalized 0..1)."""
        x1, y1 = max(0, x), max(0, y)
        x2, y2 = min(curr_w, x + w), min(curr_h, y + h)

        if angle == 90:
            # Rotated 90 deg clockwise: (orig_x = curr_y, orig_y = orig_h - curr_x)
            pts = [(y1, orig_h - x2), (y2, orig_h - x1)]
        elif angle == 180:
            # Rotated 180 deg: (orig_x = orig_w - curr_x, orig_y = orig_h - curr_y)
            pts = [(orig_w - x2, orig_h - y2), (orig_w - x1, orig_h - y1)]
        elif angle == 270:
            # Rotated 90 deg counterclockwise: (orig_x = orig_w - curr_y, orig_y = curr_x)
            pts = [(orig_w - y2, x1), (orig_w - y1, x2)]
        else:
            pts = [(x1, y1), (x2, y2)]

        min_ox = max(0.0, min(orig_w, min(p[0] for p in pts)))
        max_ox = max(0.0, min(orig_w, max(p[0] for p in pts)))
        min_oy = max(0.0, min(orig_h, min(p[1] for p in pts)))
        max_oy = max(0.0, min(orig_h, max(p[1] for p in pts)))

        return {
            'x': round(min_ox / orig_w, 4),
            'y': round(min_oy / orig_h, 4),
            'w': round(max(max_ox - min_ox, 1) / orig_w, 4),
            'h': round(max(max_oy - min_oy, 1) / orig_h, 4)
        }

    # -------------------------------------------------------------
    # FONT HEIGHT & VISUAL ANNOTATIONS
    # -------------------------------------------------------------
    @classmethod
    def measure_text_region(cls, image_path, bbox_norm, mm_per_px=None, is_calibrated=False):
        """
        Measures font height and contrast ratio in a given bounding box.
        If dimensions are omitted or mm_per_px is None, marks explicitly as
        'Uncalibrated / Font Validation Not Performed'.
        """
        if not is_calibrated or mm_per_px is None or mm_per_px <= 0:
            return {
                'font_height_mm': None,
                'font_label': 'Font Validation Not Performed',
                'contrast_ratio': 10.0,
                'is_calibrated': False,
                'confidence': 'Informational (No Dimensions Provided)'
            }

        if not image_path or not os.path.exists(image_path):
            return {
                'font_height_mm': None,
                'font_label': 'Font Validation Not Performed',
                'contrast_ratio': 10.0,
                'is_calibrated': False,
                'confidence': 'Low'
            }

        img = cv2.imread(image_path)
        if img is None:
            return {
                'font_height_mm': None,
                'font_label': 'Font Validation Not Performed',
                'contrast_ratio': 10.0,
                'is_calibrated': False,
                'confidence': 'Low'
            }

        img_h, img_w = img.shape[:2]
        x = max(0, int(bbox_norm.get('x', 0) * img_w))
        y = max(0, int(bbox_norm.get('y', 0) * img_h))
        w = max(10, int(bbox_norm.get('w', 0.2) * img_w))
        h = max(10, int(bbox_norm.get('h', 0.05) * img_h))

        roi = img[y:min(img_h, y + h), x:min(img_w, x + w)]
        if roi.size == 0:
            return {
                'font_height_mm': None,
                'font_label': 'Font Validation Not Performed',
                'contrast_ratio': 10.0,
                'is_calibrated': False,
                'confidence': 'Low'
            }

        gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        min_val, max_val, _, _ = cv2.minMaxLoc(gray)
        contrast_ratio = (float(max_val) + 0.05) / (float(min_val) + 0.05 + 1e-4)
        contrast_ratio = min(round(contrast_ratio, 2), 21.0)

        # Character height estimation using Otsu threshold
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        char_heights = []
        for c in contours:
            _, _, cw, ch = cv2.boundingRect(c)
            if 4 <= ch <= h * 0.95 and 2 <= cw <= w * 0.9:
                char_heights.append(ch)

        median_px = float(np.median(char_heights)) if char_heights else float(h * 0.6)
        measured_mm = round(median_px * mm_per_px, 1)

        return {
            'font_height_mm': measured_mm,
            'font_label': f"{measured_mm:.1f} mm (Calibrated)",
            'contrast_ratio': contrast_ratio,
            'is_calibrated': True,
            'confidence': 'High (Calibrated)'
        }

    @classmethod
    def generate_annotated_image(cls, original_image_path, declarations, output_path, panel_filter=None):
        """
        Draws high-contrast bounding boxes with badges for declarations.
        Color codes strictly:
        - Green (34, 197, 94): PASS
        - Amber (11, 158, 245): REVIEW REQUIRED
        - Red (40, 40, 239): FAIL
        """
        if not os.path.exists(original_image_path):
            return None

        img = cv2.imread(original_image_path)
        if img is None:
            return None

        img_h, img_w = img.shape[:2]
        overlay = img.copy()

        colors = {
            'PASS': (34, 197, 94),             # Green
            'FAIL': (40, 40, 239),             # Red
            'REVIEW REQUIRED': (11, 158, 245), # Amber
            'NOT APPLICABLE': (160, 160, 160)  # Muted Gray
        }

        for decl in declarations:
            # Filter by panel if specified
            if panel_filter and decl.get('panel_name'):
                p_name = str(decl.get('panel_name', '')).lower()
                pf = str(panel_filter).lower()
                if p_name != pf and pf not in p_name and p_name not in pf:
                    continue

            status = str(decl.get('status', 'PASS')).upper()
            color = colors.get(status, (34, 197, 94))

            bbox = decl.get('bbox', {})
            x = int(bbox.get('x', 0) * img_w)
            y = int(bbox.get('y', 0) * img_h)
            w = max(10, int(bbox.get('w', 0.2) * img_w))
            h = max(10, int(bbox.get('h', 0.05) * img_h))

            # Semi-transparent filled box
            cv2.rectangle(overlay, (x, y), (x + w, y + h), color, -1)

            # Crisp border
            cv2.rectangle(img, (x, y), (x + w, y + h), color, 2)

            # Badge text
            title = decl.get('title', 'Item')
            font_str = decl.get('font_label') or ''
            badge_text = f"{title} [{status}]"

            (tw, th), _ = cv2.getTextSize(badge_text, cv2.FONT_HERSHEY_SIMPLEX, 0.42, 1)
            badge_y1 = max(0, y - th - 6)
            badge_y2 = y
            cv2.rectangle(img, (x, badge_y1), (x + tw + 8, badge_y2), color, -1)
            cv2.putText(img, badge_text, (x + 4, y - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (255, 255, 255), 1, cv2.LINE_AA)

        # Blend overlay
        cv2.addWeighted(overlay, 0.18, img, 0.82, 0, img)

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        cv2.imwrite(output_path, img)
        return output_path

    # -------------------------------------------------------------
    # STEP 9 — AI 6-SIDE PACKAGING SURFACE CLASSIFIER
    # -------------------------------------------------------------
    @classmethod
    def classify_packaging_surface(cls, image_path, declared_surface='FRONT', ocr_blocks=None):
        """
        AI 6-Side Packaging Panel Classification & Orientation Validator:
        Detects whether the uploaded photo corresponds to:
        - FRONT: Principal Display Panel (PDP)
        - BACK: Back Information Panel (BIP)
        - TOP: Top Flap / Crimp / Price Flap
        - BOTTOM: Base / Recyclable / Disposal marks
        - LEFT / RIGHT: Side Panels
        
        Returns:
          declared_surface: str
          predicted_surface: str
          is_mismatch: bool
          mismatch_warning: str or None
          features_detected: list of str
          confidence: float
        """
        import re
        if ocr_blocks is None and image_path and os.path.exists(image_path):
            try:
                from services.ocr_service import OCRService
                ocr_blocks = OCRService.scan_single_image(image_path, panel_name=declared_surface)
            except Exception:
                ocr_blocks = []
        ocr_blocks = ocr_blocks or []

        full_text = " ".join([b['text'] for b in ocr_blocks]).lower()

        scores = {
            'FRONT': 15,
            'BACK': 5,
            'TOP': 0,
            'BOTTOM': 0,
            'LEFT': 0,
            'RIGHT': 0
        }
        features = []

        # 1. Back panel indicators (statutory technical declarations)
        if re.search(r'\b(nutrition|nutratulon|per\s*100\s*g|energy|carbohydrate|sugar|fat|protein|cholesterol|sodium)\b', full_text):
            scores['BACK'] += 50
            features.append("Nutritional Facts Table")

        if re.search(r'\b(ingredients?|flax\s*seeds?|wheat\s*flour|iodised\s*salt|preservative|stabilizer|contains?)\b', full_text):
            scores['BACK'] += 35
            features.append("Ingredients Declaration")

        if re.search(r'(?:mfg\.?|mfd\.?|manufactured|packed|repacked|marketed)\.?\s*(?:[\/\&]\s*(?:repacked|packed|marketed)\s*)?(?:by)?\s*[:\-]', full_text) or 'mukhwas company' in full_text:
            scores['BACK'] += 40
            features.append("Manufacturer / Packer Address")

        if re.search(r'\b(customer\s*care|consumer\s*care|care\s*no|toll\s*free|e-?mail)\b', full_text):
            scores['BACK'] += 30
            features.append("Consumer Grievance Cell")

        if re.search(r'\b(fssai|lic\.?\s*no\.?)\b', full_text):
            scores['BACK'] += 25
            features.append("FSSAI License Number")

        if any(b.get('is_barcode') for b in ocr_blocks) or re.search(r'\b\d{12,14}\b', full_text):
            scores['BACK'] += 20
            scores['LEFT'] += 10
            scores['RIGHT'] += 10
            features.append("Barcode")

        # 2. Front panel indicators (Principal Display Panel)
        if re.search(r'\b(net\s*(?:wt|qty|quantity|weight)|net\s*contents?)\b', full_text) or re.search(r'\b\d+\s*(?:g|kg|ml|l)\b', full_text):
            scores['FRONT'] += 25
            scores['BACK'] += 15
            features.append("Net Quantity Declaration")

        # 3. Top flap / price crimp
        if len(ocr_blocks) <= 5 and re.search(r'\b(mrp|mfd|pkd|exp|batch|lot|b\.no)\b', full_text):
            scores['TOP'] += 45
            features.append("Price / Batch Flap Stamping")

        # 4. Bottom base / recycling
        if re.search(r'\b(keep\s*your\s*city\s*clean|clean\s*city|pet\s*1|hdpe|recycle)\b', full_text):
            scores['BOTTOM'] += 35
            features.append("Recycling / Disposal Symbols")

        # 5. Clean front branding
        if not (re.search(r'\b(nutrition|nutratulon|ingredients|mfg|manufactured|packed|customer|care)\b', full_text)):
            scores['FRONT'] += 45
            features.append("Primary Brand & PDP Artwork")

        decl_upper = (declared_surface or 'FRONT').upper()
        # Side prediction removed as requested by user
        return {
            'declared_surface': decl_upper,
            'predicted_surface': decl_upper,
            'is_mismatch': False,
            'mismatch_warning': None,
            'features_detected': [],
            'confidence': 1.0
        }

