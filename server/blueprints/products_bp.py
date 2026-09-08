from flask import Blueprint, request, jsonify
from models import db, Product, Manufacturer, ProductCategory, InspectionCase
from services.auth_service import require_auth

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
            mfg = Manufacturer(name=mfg_name, address=data.get("manufacturer_address", ""))
            db.session.add(mfg)
            db.session.flush()
        mfg_id = mfg.id

    cat_id = data.get("category_id")

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
