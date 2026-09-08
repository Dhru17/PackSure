from flask import Blueprint, request, jsonify, g
import json
import os
import shutil
from datetime import datetime, timezone
from models import (
    db, User, UserRole, AuditLog, AuditActionType, InspectionCase,
    ProductCategory, Product, RegulatoryRule, RuleCategoryMapping
)
from services.auth_service import require_role

admin_bp = Blueprint("admin_bp", __name__, url_prefix="/api/admin")

# ==========================================
# 1. USER & RBAC MANAGEMENT
# ==========================================

@admin_bp.route("/users", methods=["GET"])
@require_role(["ADMIN"])
def list_users():
    role_filter = request.args.get("role")
    status_filter = request.args.get("status")
    search = request.args.get("search", "").strip().lower()

    query = User.query.order_by(User.created_at.desc())
    if role_filter and role_filter != "ALL":
        query = query.filter_by(role=UserRole(role_filter))
    if status_filter and status_filter != "ALL":
        is_active = (status_filter == "ACTIVE")
        query = query.filter_by(is_active=is_active)
    
    users = query.all()
    if search:
        users = [
            u for u in users
            if search in u.email.lower()
            or search in (u.full_name or "").lower()
            or search in (u.badge_number or "").lower()
            or search in (u.jurisdiction_district or "").lower()
        ]

    return jsonify({"users": [u.to_dict() for u in users], "count": len(users)})

@admin_bp.route("/users", methods=["POST"])
@require_role(["ADMIN"])
def create_user():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    full_name = data.get("full_name", "").strip()
    role_str = data.get("role", "INSPECTOR").upper()
    password = data.get("password", "Pass#2026")

    if not email or not full_name:
        return jsonify({"error": "Email and Full Name are required."}), 400

    try:
        role = UserRole(role_str)
    except ValueError:
        return jsonify({"error": f"Invalid role. Must be one of {[r.value for r in UserRole]}"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "A user with this email already exists."}), 400

    user = User(
        email=email,
        full_name=full_name,
        role=role,
        badge_number=data.get("badge_number"),
        jurisdiction_district=data.get("jurisdiction_district", "National"),
        phone_number=data.get("phone_number")
    )
    user.set_password(password)
    db.session.add(user)
    db.session.flush()

    audit = AuditLog(
        user_id=g.current_user.id,
        action_type=AuditActionType.USER_MODIFIED,
        entity_name="User",
        entity_id=str(user.id),
        new_state_json=json.dumps({"email": user.email, "role": user.role.value, "full_name": user.full_name, "badge": user.badge_number}),
        justification=f"New officer account provisioned by Administrator {g.current_user.full_name}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({"user": user.to_dict()}), 201

@admin_bp.route("/users/<int:user_id>", methods=["PUT"])
@require_role(["ADMIN"])
def update_user(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404

    data = request.get_json() or {}
    prev_state = {
        "full_name": user.full_name,
        "role": user.role.value,
        "badge_number": user.badge_number,
        "jurisdiction_district": user.jurisdiction_district,
        "phone_number": user.phone_number,
        "is_active": user.is_active
    }

    if "full_name" in data and data["full_name"].strip():
        user.full_name = data["full_name"].strip()
    if "role" in data:
        try:
            user.role = UserRole(data["role"].upper())
        except ValueError:
            return jsonify({"error": f"Invalid role {data['role']}"}), 400
    if "badge_number" in data:
        user.badge_number = data["badge_number"].strip()
    if "jurisdiction_district" in data:
        user.jurisdiction_district = data["jurisdiction_district"].strip()
    if "phone_number" in data:
        user.phone_number = data["phone_number"].strip()
    if "is_active" in data:
        user.is_active = bool(data["is_active"])

    new_state = {
        "full_name": user.full_name,
        "role": user.role.value,
        "badge_number": user.badge_number,
        "jurisdiction_district": user.jurisdiction_district,
        "phone_number": user.phone_number,
        "is_active": user.is_active
    }

    audit = AuditLog(
        user_id=g.current_user.id,
        action_type=AuditActionType.USER_MODIFIED,
        entity_name="User",
        entity_id=str(user.id),
        previous_state_json=json.dumps(prev_state),
        new_state_json=json.dumps(new_state),
        justification=data.get("justification", f"Officer profile updated by Admin {g.current_user.full_name}.")
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({"message": "User profile updated successfully.", "user": user.to_dict()})

@admin_bp.route("/users/<int:user_id>/reset-password", methods=["POST"])
@require_role(["ADMIN"])
def reset_password(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404

    data = request.get_json() or {}
    new_password = data.get("password")
    if not new_password or len(new_password) < 6:
        return jsonify({"error": "Password must be at least 6 characters."}), 400

    user.set_password(new_password)

    audit = AuditLog(
        user_id=g.current_user.id,
        action_type=AuditActionType.USER_MODIFIED,
        entity_name="User",
        entity_id=str(user.id),
        new_state_json=json.dumps({"password_reset": True, "reset_at": datetime.now(timezone.utc).isoformat()}),
        justification=f"Password credential reset by Administrator {g.current_user.full_name}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({"message": f"Password for {user.email} successfully reset."})

@admin_bp.route("/users/<int:user_id>/toggle-status", methods=["PATCH"])
@require_role(["ADMIN"])
def toggle_user_status(user_id):
    if g.current_user.id == user_id:
        return jsonify({"error": "Administrator cannot deactivate their own active account."}), 400

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404

    prev_status = user.is_active
    user.is_active = not user.is_active

    audit = AuditLog(
        user_id=g.current_user.id,
        action_type=AuditActionType.USER_MODIFIED,
        entity_name="User",
        entity_id=str(user.id),
        previous_state_json=json.dumps({"is_active": prev_status}),
        new_state_json=json.dumps({"is_active": user.is_active}),
        justification=f"Account status toggled to {'ACTIVE' if user.is_active else 'INACTIVE'} by Admin {g.current_user.full_name}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({
        "message": f"User account {'activated' if user.is_active else 'deactivated'} successfully.",
        "user": user.to_dict()
    })

@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
@require_role(["ADMIN"])
def delete_user(user_id):
    if g.current_user.id == user_id:
        return jsonify({"error": "Administrator cannot delete their own account."}), 400

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404

    cases_count = InspectionCase.query.filter_by(inspector_id=user.id).count()
    if cases_count > 0:
        user.is_active = False
        audit = AuditLog(
            user_id=g.current_user.id,
            action_type=AuditActionType.USER_MODIFIED,
            entity_name="User",
            entity_id=str(user.id),
            previous_state_json=json.dumps({"is_active": True}),
            new_state_json=json.dumps({"is_active": False, "deleted": False}),
            justification=f"User has {cases_count} associated statutory inspection cases. Safely deactivated to preserve legal audit trail."
        )
        db.session.add(audit)
        db.session.commit()
        return jsonify({
            "message": f"User has {cases_count} associated inspection cases. Account was safely DEACTIVATED to preserve statutory case records.",
            "soft_deleted": True,
            "user": user.to_dict()
        })

    deleted_info = {"id": user.id, "email": user.email, "full_name": user.full_name}
    db.session.delete(user)
    audit = AuditLog(
        user_id=g.current_user.id,
        action_type=AuditActionType.USER_MODIFIED,
        entity_name="User",
        entity_id=str(user_id),
        previous_state_json=json.dumps(deleted_info),
        new_state_json=json.dumps({"deleted": True}),
        justification=f"Officer account {deleted_info['email']} permanently deleted by Administrator {g.current_user.full_name}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({"message": f"Officer account {deleted_info['email']} deleted successfully.", "soft_deleted": False})


# ==========================================
# 2. PRODUCT CATEGORY MANAGEMENT
# ==========================================

@admin_bp.route("/categories", methods=["GET"])
@require_role(["ADMIN", "SENIOR_OFFICER", "INSPECTOR"])
def list_categories():
    categories = ProductCategory.query.order_by(ProductCategory.name.asc()).all()
    out = []
    for c in categories:
        c_dict = c.to_dict()
        c_dict["parent_name"] = c.parent.name if c.parent else None
        c_dict["subcategories_count"] = len(c.subcategories) if c.subcategories else 0
        c_dict["products_count"] = len(c.products) if c.products else 0
        c_dict["rules_count"] = RuleCategoryMapping.query.filter_by(category_id=c.id).count()
        out.append(c_dict)
    return jsonify({"categories": out, "count": len(out)})

@admin_bp.route("/categories", methods=["POST"])
@require_role(["ADMIN"])
def create_category():
    data = request.get_json() or {}
    category_code = data.get("category_code", "").strip().upper()
    name = data.get("name", "").strip()

    if not category_code or not name:
        return jsonify({"error": "Category Code and Name are required."}), 400

    if ProductCategory.query.filter_by(category_code=category_code).first():
        return jsonify({"error": f"Category code '{category_code}' already exists."}), 400

    parent_id = data.get("parent_id")
    if parent_id == "" or parent_id == 0:
        parent_id = None
    elif parent_id is not None:
        parent_id = int(parent_id)

    cat = ProductCategory(
        category_code=category_code,
        name=name,
        parent_id=parent_id,
        description=data.get("description", ""),
        is_active=bool(data.get("is_active", True))
    )
    db.session.add(cat)
    db.session.flush()

    audit = AuditLog(
        user_id=g.current_user.id,
        action_type=AuditActionType.RULE_MODIFIED,
        entity_name="ProductCategory",
        entity_id=str(cat.id),
        new_state_json=json.dumps({"code": cat.category_code, "name": cat.name, "parent_id": cat.parent_id}),
        justification=f"New product category '{cat.name}' created by Admin {g.current_user.full_name}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({"category": cat.to_dict()}), 201

@admin_bp.route("/categories/<int:category_id>", methods=["PUT"])
@require_role(["ADMIN"])
def update_category(category_id):
    cat = db.session.get(ProductCategory, category_id)
    if not cat:
        return jsonify({"error": "Category not found."}), 404

    data = request.get_json() or {}
    prev_state = cat.to_dict()

    if "name" in data and data["name"].strip():
        cat.name = data["name"].strip()
    if "category_code" in data and data["category_code"].strip():
        new_code = data["category_code"].strip().upper()
        existing = ProductCategory.query.filter_by(category_code=new_code).first()
        if existing and existing.id != cat.id:
            return jsonify({"error": f"Category code '{new_code}' already exists."}), 400
        cat.category_code = new_code
    if "parent_id" in data:
        pid = data["parent_id"]
        cat.parent_id = int(pid) if pid and int(pid) != cat.id else None
    if "description" in data:
        cat.description = data["description"]
    if "is_active" in data:
        cat.is_active = bool(data["is_active"])

    audit = AuditLog(
        user_id=g.current_user.id,
        action_type=AuditActionType.RULE_MODIFIED,
        entity_name="ProductCategory",
        entity_id=str(cat.id),
        previous_state_json=json.dumps(prev_state),
        new_state_json=json.dumps(cat.to_dict()),
        justification=f"Product category '{cat.name}' updated by Admin {g.current_user.full_name}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({"category": cat.to_dict()})

@admin_bp.route("/categories/<int:category_id>/toggle-status", methods=["PATCH"])
@require_role(["ADMIN"])
def toggle_category_status(category_id):
    cat = db.session.get(ProductCategory, category_id)
    if not cat:
        return jsonify({"error": "Category not found."}), 404

    prev_status = cat.is_active
    cat.is_active = not cat.is_active

    audit = AuditLog(
        user_id=g.current_user.id,
        action_type=AuditActionType.RULE_MODIFIED,
        entity_name="ProductCategory",
        entity_id=str(cat.id),
        previous_state_json=json.dumps({"is_active": prev_status}),
        new_state_json=json.dumps({"is_active": cat.is_active}),
        justification=f"Category '{cat.name}' status toggled to {'ACTIVE' if cat.is_active else 'INACTIVE'}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({"message": f"Category {'activated' if cat.is_active else 'deactivated'} successfully.", "category": cat.to_dict()})

@admin_bp.route("/categories/<int:category_id>", methods=["DELETE"])
@require_role(["ADMIN"])
def delete_category(category_id):
    cat = db.session.get(ProductCategory, category_id)
    if not cat:
        return jsonify({"error": "Category not found."}), 404

    products_count = Product.query.filter_by(category_id=cat.id).count()
    if products_count > 0:
        return jsonify({"error": f"Cannot delete category '{cat.name}' because {products_count} product(s) are associated with it. Deactivate it instead."}), 400

    RuleCategoryMapping.query.filter_by(category_id=cat.id).delete()
    ProductCategory.query.filter_by(parent_id=cat.id).update({"parent_id": None})

    deleted_info = cat.to_dict()
    db.session.delete(cat)
    audit = AuditLog(
        user_id=g.current_user.id,
        action_type=AuditActionType.RULE_MODIFIED,
        entity_name="ProductCategory",
        entity_id=str(category_id),
        previous_state_json=json.dumps(deleted_info),
        new_state_json=json.dumps({"deleted": True}),
        justification=f"Product category '{deleted_info['name']}' deleted by Admin {g.current_user.full_name}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({"message": f"Category '{deleted_info['name']}' deleted successfully."})


# ==========================================
# 3. CATEGORY -> RULE MAPPINGS
# ==========================================

@admin_bp.route("/categories/<int:category_id>/rules", methods=["GET"])
@require_role(["ADMIN", "SENIOR_OFFICER"])
def list_category_rules(category_id):
    cat = db.session.get(ProductCategory, category_id)
    if not cat:
        return jsonify({"error": "Category not found."}), 404

    mappings = RuleCategoryMapping.query.filter_by(category_id=category_id).all()
    rules_data = []
    for m in mappings:
        rule_dict = m.rule.to_dict()
        rule_dict["mapping_id"] = m.id
        rule_dict["is_exempt"] = m.is_exempt
        rule_dict["exception_notes"] = m.exception_notes
        rules_data.append(rule_dict)

    return jsonify({
        "category": cat.to_dict(),
        "mappings": rules_data,
        "count": len(rules_data)
    })

@admin_bp.route("/categories/<int:category_id>/rules", methods=["POST"])
@require_role(["ADMIN"])
def map_category_rule(category_id):
    cat = db.session.get(ProductCategory, category_id)
    if not cat:
        return jsonify({"error": "Category not found."}), 404

    data = request.get_json() or {}
    rule_id = data.get("rule_id")
    if not rule_id:
        return jsonify({"error": "rule_id is required."}), 400

    rule = db.session.get(RegulatoryRule, int(rule_id))
    if not rule:
        return jsonify({"error": "Regulatory Rule not found."}), 404

    is_exempt = bool(data.get("is_exempt", False))
    exception_notes = data.get("exception_notes", "")

    mapping = RuleCategoryMapping.query.filter_by(category_id=category_id, rule_id=rule.id).first()
    if mapping:
        mapping.is_exempt = is_exempt
        mapping.exception_notes = exception_notes
    else:
        mapping = RuleCategoryMapping(
            category_id=category_id,
            rule_id=rule.id,
            is_exempt=is_exempt,
            exception_notes=exception_notes
        )
        db.session.add(mapping)

    audit = AuditLog(
        user_id=g.current_user.id,
        action_type=AuditActionType.RULE_MODIFIED,
        entity_name="RuleCategoryMapping",
        entity_id=f"{category_id}:{rule.id}",
        new_state_json=json.dumps({"category": cat.name, "rule": rule.rule_code, "is_exempt": is_exempt}),
        justification=f"Rule {rule.rule_code} applicability mapped for category '{cat.name}'."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({"message": "Rule mapped to category successfully.", "category_id": category_id, "rule_id": rule.id}), 201

@admin_bp.route("/categories/<int:category_id>/rules/<int:rule_id>", methods=["DELETE"])
@require_role(["ADMIN"])
def unmap_category_rule(category_id, rule_id):
    mapping = RuleCategoryMapping.query.filter_by(category_id=category_id, rule_id=rule_id).first()
    if not mapping:
        return jsonify({"error": "Mapping not found."}), 404

    db.session.delete(mapping)
    audit = AuditLog(
        user_id=g.current_user.id,
        action_type=AuditActionType.RULE_MODIFIED,
        entity_name="RuleCategoryMapping",
        entity_id=f"{category_id}:{rule_id}",
        new_state_json=json.dumps({"deleted": True}),
        justification=f"Rule mapping removed for Category #{category_id} and Rule #{rule_id}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({"message": "Rule unmapped from category."})


# ==========================================
# 4. AUDIT LOGS & FORENSICS
# ==========================================

@admin_bp.route("/audit-logs", methods=["GET"])
@require_role(["ADMIN", "SENIOR_OFFICER"])
def list_audit_logs():
    limit = int(request.args.get("limit", 150))
    case_id = request.args.get("case_id")
    action_type = request.args.get("action_type")
    user_id = request.args.get("user_id")
    search = request.args.get("search", "").strip().lower()

    query = AuditLog.query.order_by(AuditLog.timestamp.desc())
    if case_id:
        query = query.filter_by(case_id=int(case_id))
    if action_type and action_type != "ALL":
        query = query.filter_by(action_type=AuditActionType(action_type))
    if user_id:
        query = query.filter_by(user_id=int(user_id))

    logs = query.limit(limit).all()

    if search:
        logs = [
            l for l in logs
            if search in (l.user.full_name.lower() if l.user else "system")
            or search in (l.entity_name or "").lower()
            or search in (l.justification or "").lower()
            or (l.case_id and search in str(l.case_id))
        ]

    return jsonify({"audit_logs": [l.to_dict() for l in logs], "count": len(logs)})


# ==========================================
# 5. SYSTEM HEALTH & TELEMETRY
# ==========================================

@admin_bp.route("/system-health", methods=["GET"])
@require_role(["ADMIN"])
def system_health():
    # Database connectivity & latency check
    import time
    db_start = time.time()
    total_users = User.query.count()
    active_users = User.query.filter_by(is_active=True).count()
    db_latency_ms = round((time.time() - db_start) * 1000, 2)

    total_rules = RegulatoryRule.query.count()
    active_rules = RegulatoryRule.query.filter_by(is_active=True).count()
    total_categories = ProductCategory.query.count()
    total_products = Product.query.count()
    total_cases = InspectionCase.query.count()
    total_audits = AuditLog.query.count()

    # User breakdown by role
    inspectors_count = User.query.filter_by(role=UserRole.INSPECTOR).count()
    seniors_count = User.query.filter_by(role=UserRole.SENIOR_OFFICER).count()
    admins_count = User.query.filter_by(role=UserRole.ADMIN).count()

    # Storage telemetry
    upload_dir = os.path.join(os.getcwd(), "uploads")
    evidence_count = 0
    storage_size_bytes = 0
    if os.path.exists(upload_dir):
        for root, _, files in os.walk(upload_dir):
            for f in files:
                evidence_count += 1
                storage_size_bytes += os.path.getsize(os.path.join(root, f))
    
    total, used, free = shutil.disk_usage(os.getcwd())

    # OCR Model check
    ocr_status = "READY"
    try:
        from services.ocr_service import get_ocr_engine
        engine = get_ocr_engine()
        if engine is None:
            ocr_status = "OFFLINE"
    except Exception as e:
        ocr_status = "ERROR"

    return jsonify({
        "status": "HEALTHY",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": {
            "status": "CONNECTED",
            "latency_ms": db_latency_ms,
            "engine": str(db.engine.url.drivername) if hasattr(db, "engine") else "sqlite",
            "tables": {
                "users": total_users,
                "regulatory_rules": total_rules,
                "product_categories": total_categories,
                "products": total_products,
                "inspection_cases": total_cases,
                "audit_logs": total_audits
            }
        },
        "users_summary": {
            "total": total_users,
            "active": active_users,
            "inspectors": inspectors_count,
            "senior_officers": seniors_count,
            "admins": admins_count
        },
        "rules_summary": {
            "total": total_rules,
            "active": active_rules
        },
        "ocr_engine": {
            "name": "RapidOCR ONNX Runtime",
            "status": ocr_status,
            "version": "1.4.4"
        },
        "storage": {
            "upload_files_count": evidence_count,
            "evidence_size_mb": round(storage_size_bytes / (1024 * 1024), 2),
            "disk_free_gb": round(free / (1024 * 1024 * 1024), 2),
            "disk_total_gb": round(total / (1024 * 1024 * 1024), 2)
        },
        "runtime": {
            "python_version": "3.14",
            "framework": "Flask 3.1.3",
            "rbac_policy": "Section 15/16 Legal Metrology Act 2009 Standard"
        }
    })

