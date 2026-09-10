import os
import uuid
import re
import cv2
from flask import Blueprint, request, jsonify
from config import Config
from models import db, Product, Manufacturer, ProductCategory, InspectionCase
from services.auth_service import require_auth
from services.ocr_service import OCRService
from services.vision_analyzer import VisionAnalyzer

products_bp = Blueprint("products_bp", __name__, url_prefix="/api/products")

@products_bp.route("", methods=["GET"])
@require_auth
def list_products():
    search = request.args.get("search", "").strip()
    category_id = request.args.get("category_id")
    limit = int(request.args.get("limit", 50))

    query = Product.query
    if search:
        query = query.filter(
            (Product.brand_name.ilike(f"%{search}%")) |
            (Product.commodity_name.ilike(f"%{search}%")) |
            (Product.barcode.ilike(f"%{search}%"))
        )
    if category_id:
        query = query.filter_by(category_id=int(category_id))

    products = query.order_by(Product.created_at.desc()).limit(limit).all()
    return jsonify({
        "products": [p.to_dict() for p in products],
        "count": len(products)
    })

@products_bp.route("/lookup/<barcode>", methods=["GET"])
@require_auth
def lookup_barcode(barcode):
    barcode = barcode.strip()
    product = Product.query.filter_by(barcode=barcode).first()
    
    if not product:
        return jsonify({"found": False, "product": None, "previous_inspections": []})

    # Retrieve prior inspection records for context
    prior_scans = InspectionCase.query.filter_by(product_id=product.id).order_by(InspectionCase.created_at.desc()).limit(5).all()
    prior_list = []
    for s in prior_scans:
        prior_list.append({
            "id": s.id,
            "case_number": s.case_number,
            "status": s.status.value if hasattr(s.status, "value") else str(s.status),
            "final_decision": s.final_decision.value if s.final_decision and hasattr(s.final_decision, "value") else None,
            "compliance_score": s.compliance_score,
            "failed_checks": s.failed_checks,
            "inspector_name": s.inspector.full_name if s.inspector else None,
            "created_at": s.created_at.isoformat() if s.created_at else None
        })

    return jsonify({
        "found": True,
        "product": product.to_dict(),
        "previous_inspections": prior_list
    })

@products_bp.route("/scan-barcode", methods=["POST"])
@require_auth
def scan_barcode_endpoint():
    """
    High-accuracy barcode scan endpoint using native zxing-cpp, pyzbar, and 4-way rotation sweeps.
    """
    if "file" not in request.files or not request.files["file"].filename:
        return jsonify({"error": "No image file uploaded."}), 400

    f = request.files["file"]
    ext = os.path.splitext(f.filename)[1].lower() or ".jpg"
    unique_name = f"scan_{uuid.uuid4().hex[:8]}{ext}"
    save_path = os.path.join(Config.UPLOAD_FOLDER, unique_name)
    f.save(save_path)

    # 1. Multi-Engine Barcode Detection (zxing-cpp + pyzbar + OpenCV with 4 rotations)
    barcodes = VisionAnalyzer.detect_barcodes_robust(save_path, panel_name="SCAN")
    detected_barcode = barcodes[0]["barcode_number"] if barcodes else None

    # 2. Fallback OCR structured label-value matching
    if not detected_barcode:
        text_blocks = OCRService.scan_single_image(save_path, panel_name="SCAN")
        structured = OCRService._init_structured_json()
        OCRService._run_label_value_matcher(text_blocks, structured)
        b_val = structured.get("barcode", {}).get("value")
        if b_val:
            detected_barcode = b_val

    if not detected_barcode:
        return jsonify({
            "success": False,
            "barcode": None,
            "found": False,
            "message": "No barcode recognized in the uploaded photo. Please try a clearer picture."
        }), 200

    # Look up in product catalog
    catalog_prod = Product.query.filter_by(barcode=detected_barcode).first()
    return jsonify({
        "success": True,
        "barcode": detected_barcode,
        "found": bool(catalog_prod),
        "product": catalog_prod.to_dict() if catalog_prod else None,
        "message": f"Barcode {detected_barcode} successfully detected!"
    })

@products_bp.route("", methods=["POST"])
@require_auth
def create_product():
    data = request.get_json() or {}
    brand = data.get("brand_name", "").strip()
    commodity = data.get("commodity_name", "").strip()
    barcode = data.get("barcode", "").strip() or None

    if not brand or not commodity:
        return jsonify({"error": "Brand name and commodity name are required."}), 400

    # If barcode exists, check for conflict
    if barcode:
        existing = Product.query.filter_by(barcode=barcode).first()
        if existing:
            return jsonify({"product": existing.to_dict(), "message": "Existing product record selected."})

    # Manufacturer resolution
    mfg_id = data.get("manufacturer_id")
    mfg_name = data.get("manufacturer_name", "").strip()
    if not mfg_id and mfg_name:
        mfg = Manufacturer.query.filter_by(name=mfg_name).first()
        if not mfg:
            mfg = Manufacturer(name=mfg_name, address=data.get("manufacturer_address", "Registered Address"))
            db.session.add(mfg)
            db.session.flush()
        mfg_id = mfg.id
    if not mfg_id:
        default_mfg = Manufacturer.query.first()
        if default_mfg:
            mfg_id = default_mfg.id

    # Category resolution
    cat_id = data.get("category_id")
    cat_name = data.get("category_name", "").strip()
    if not cat_id and cat_name:
        cat = ProductCategory.query.filter(
            (ProductCategory.name.ilike(f"%{cat_name}%")) |
            (ProductCategory.category_code.ilike(f"%{cat_name}%"))
        ).first()
        if cat:
            cat_id = cat.id
    if not cat_id:
        default_cat = ProductCategory.query.first()
        if default_cat:
            cat_id = default_cat.id

    product = Product(
        barcode=barcode,
        brand_name=brand,
        commodity_name=commodity,
        category_id=cat_id,
        manufacturer_id=mfg_id,
        package_type=data.get("package_type", "Rectangular Box"),
        default_net_quantity=data.get("default_net_quantity"),
        default_mrp=float(data.get("default_mrp")) if data.get("default_mrp") else None,
        is_imported=bool(data.get("is_imported", False)),
        country_of_origin=data.get("country_of_origin", "India"),
        pdp_width_cm=float(data.get("pdp_width_cm")) if data.get("pdp_width_cm") else None,
        pdp_height_cm=float(data.get("pdp_height_cm")) if data.get("pdp_height_cm") else None
    )
    if product.pdp_width_cm and product.pdp_height_cm:
        product.pdp_area_cm2 = round(product.pdp_width_cm * product.pdp_height_cm, 1)

    db.session.add(product)
    db.session.commit()
    return jsonify({"product": product.to_dict()}), 201

@products_bp.route("/identify-image", methods=["POST"])
@require_auth
def identify_product_image():
    """
    Analyzes an uploaded product image using Barcode Detection and RapidOCR / PaddleOCR.
    Identifies the brand, commodity name, net quantity, and MRP, and matches with catalog.
    """
    if "file" not in request.files or not request.files["file"].filename:
        return jsonify({"error": "No image file uploaded."}), 400

    f = request.files["file"]
    ext = os.path.splitext(f.filename)[1].lower() or ".jpg"
    unique_name = f"ident_{uuid.uuid4().hex[:8]}{ext}"
    save_path = os.path.join(Config.UPLOAD_FOLDER, unique_name)
    f.save(save_path)
    file_url = f"/api/media/uploads/{unique_name}"

    # 1. High-Performance Multi-Engine Barcode Detection (zxing-cpp + pyzbar + OpenCV with 4 rotations)
    detected_barcode = None
    try:
        barcodes = VisionAnalyzer.detect_barcodes_robust(save_path, panel_name="FRONT")
        if barcodes:
            detected_barcode = barcodes[0]["barcode_number"]
    except Exception as e:
        print(f"Barcode detection error on {save_path}: {e}")

    # If barcode found, check if it matches a catalog product
    if detected_barcode:
        catalog_prod = Product.query.filter_by(barcode=detected_barcode).first()
        if catalog_prod:
            return jsonify({
                "found": True,
                "method": "BARCODE_MATCH",
                "barcode": detected_barcode,
                "product": catalog_prod.to_dict(),
                "extracted_fields": {
                    "brand_name": catalog_prod.brand_name,
                    "commodity_name": catalog_prod.commodity_name,
                    "category_name": catalog_prod.category.name if catalog_prod.category else "General Packaged Commodity",
                    "package_type": catalog_prod.package_type or "BOX",
                    "default_net_quantity": catalog_prod.default_net_quantity or "",
                    "default_mrp": catalog_prod.default_mrp or 0,
                    "is_imported": catalog_prod.is_imported,
                    "country_of_origin": catalog_prod.country_of_origin or "India",
                    "pdp_width_cm": catalog_prod.pdp_width_cm or 10,
                    "pdp_height_cm": catalog_prod.pdp_height_cm or 10,
                    "pdp_area_cm2": catalog_prod.pdp_area_cm2 or 100,
                    "manufacturer_name": catalog_prod.manufacturer.name if catalog_prod.manufacturer else "Registered Manufacturer"
                },
                "image_url": file_url,
                "detected_texts": [f"Barcode: {detected_barcode}"],
                "message": f"Barcode {detected_barcode} detected! Matched catalog product '{catalog_prod.brand_name}'."
            })

    # 2. AI OCR Pass: Detect all text on the package front
    text_blocks = OCRService.scan_single_image(save_path, panel_name="FRONT")
    extracted_texts = [b["text"].strip() for b in text_blocks if b.get("text")]
    combined_lower = " ".join(extracted_texts).lower()

    # Parse structured fields from OCR tokens using OCRService matcher
    structured = OCRService._init_structured_json()
    OCRService._run_label_value_matcher(text_blocks, structured)

    if not detected_barcode:
        b_val = structured.get("barcode", {}).get("value")
        if b_val:
            detected_barcode = b_val

    # 3. Match against existing registered catalog products
    all_products = Product.query.all()
    matched_product = None
    
    # Priority matching: exact or strong substring of brand or commodity
    for p in all_products:
        b_name = (p.brand_name or "").lower()
        c_name = (p.commodity_name or "").lower()
        if b_name and len(b_name) >= 3 and b_name in combined_lower:
            matched_product = p
            break
        if c_name and len(c_name) >= 4 and c_name in combined_lower:
            matched_product = p
            break

    extracted_brand = structured.get('brand_name', {}).get('value')
    extracted_commodity = structured.get('generic_commodity_name', {}).get('value') or structured.get('generic_name', {}).get('value')
    extracted_net_qty = structured.get('net_quantity', {}).get('value')
    raw_mrp = structured.get('mrp', {}).get('value')
    extracted_mrp = None
    if raw_mrp:
        try:
            mrp_clean = re.sub(r"[^\d.]", "", raw_mrp)
            if mrp_clean:
                extracted_mrp = float(mrp_clean)
        except Exception:
            pass

    # Heuristic for Brand & Commodity if not caught by structured matcher
    if not extracted_brand and extracted_texts:
        filtered = [t for t in extracted_texts if not any(w in t.lower() for w in ['pass', 'fail', 'review', 'licence', 'fssai', 'net', 'mrp', 'batch'])]
        if filtered:
            extracted_brand = filtered[0]
            if not extracted_commodity and len(filtered) > 1:
                extracted_commodity = filtered[1]

    if matched_product:
        p_dict = matched_product.to_dict()
        return jsonify({
            "found": True,
            "method": "CATALOG_OCR_MATCH",
            "barcode": matched_product.barcode or detected_barcode,
            "product": p_dict,
            "extracted_fields": {
                "brand_name": matched_product.brand_name,
                "commodity_name": matched_product.commodity_name,
                "category_name": matched_product.category.name if matched_product.category else "General Packaged Commodity",
                "package_type": matched_product.package_type or "BOX",
                "default_net_quantity": extracted_net_qty or matched_product.default_net_quantity or "",
                "default_mrp": extracted_mrp or matched_product.default_mrp or 0,
                "is_imported": matched_product.is_imported,
                "country_of_origin": matched_product.country_of_origin or "India",
                "pdp_width_cm": matched_product.pdp_width_cm or 10,
                "pdp_height_cm": matched_product.pdp_height_cm or 10,
                "pdp_area_cm2": matched_product.pdp_area_cm2 or 100,
                "manufacturer_name": matched_product.manufacturer.name if matched_product.manufacturer else "Registered Manufacturer"
            },
            "image_url": file_url,
            "detected_texts": extracted_texts[:8],
            "message": f"AI recognized '{matched_product.brand_name}' ({matched_product.commodity_name}) from package text!"
        })

    # If new product not yet registered in catalog: return extracted OCR fields
    return jsonify({
        "found": False,
        "method": "AI_OCR_EXTRACTION",
        "barcode": detected_barcode,
        "product": None,
        "extracted_fields": {
            "brand_name": extracted_brand or "Identified Commodity",
            "commodity_name": extracted_commodity or (extracted_texts[0] if extracted_texts else "Packaged Commodity"),
            "category_name": "General Packaged Commodity",
            "package_type": "BOX",
            "default_net_quantity": extracted_net_qty or "",
            "default_mrp": extracted_mrp or 0,
            "is_imported": False,
            "country_of_origin": "India",
            "pdp_width_cm": 10,
            "pdp_height_cm": 10,
            "pdp_area_cm2": 100,
            "manufacturer_name": "Registered Manufacturer"
        },
        "image_url": file_url,
        "detected_texts": extracted_texts[:8],
        "message": f"AI extracted text from package. Pre-filled details below for your verification."
    })
