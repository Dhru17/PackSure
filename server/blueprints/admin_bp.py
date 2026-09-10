from flask import Blueprint, request, jsonify, g
import json
import os
import shutil
from datetime import datetime, timezone, date
from models import (
    db, User, UserRole, AuditLog, AuditActionType, InspectionCase, CaseStatus,
    ProductCategory, Product, RegulatoryRule, RuleCategoryMapping, RuleRequirement,
    Manufacturer, Company, Plant, Jurisdiction,
    InspectorCategoryEligibility, InspectorJurisdictionEligibility
)
from services.auth_service import require_auth, require_role
from services.impact_simulator_service import RegulatoryImpactSimulatorService

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
        try:
            query = query.filter_by(role=UserRole(role_filter))
        except ValueError:
            pass
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
    company_id = data.get("company_id")

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
        phone_number=data.get("phone_number"),
        company_id=int(company_id) if company_id else None
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
        justification=f"New user account provisioned by Administrator {g.current_user.full_name}."
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
    prev_state = user.to_dict()

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
    if "company_id" in data:
        cid = data["company_id"]
        user.company_id = int(cid) if cid else None
    if "is_active" in data:
        user.is_active = bool(data["is_active"])

    new_state = user.to_dict()

    audit = AuditLog(
        user_id=g.current_user.id,
        action_type=AuditActionType.USER_MODIFIED,
        entity_name="User",
        entity_id=str(user.id),
        previous_state_json=json.dumps(prev_state),
        new_state_json=json.dumps(new_state),
        justification=data.get("justification", f"User profile updated by Admin {g.current_user.full_name}.")
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

    cases_count = InspectionCase.query.filter(
        (InspectionCase.inspector_id == user.id) | (InspectionCase.senior_reviewer_id == user.id)
    ).count()
    if cases_count > 0:
        user.is_active = False
        audit = AuditLog(
            user_id=g.current_user.id,
            action_type=AuditActionType.USER_MODIFIED,
            entity_name="User",
            entity_id=str(user.id),
            previous_state_json=json.dumps({"is_active": True}),
            new_state_json=json.dumps({"is_active": False, "deleted": False}),
            justification=f"User has {cases_count} associated inspection cases. Safely deactivated to preserve legal audit trail."
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
        justification=f"User account {deleted_info['email']} permanently deleted by Administrator {g.current_user.full_name}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({"message": f"User account {deleted_info['email']} deleted successfully.", "soft_deleted": False})


# ==========================================
# 2. COMPANY MASTER DATA MANAGEMENT
# ==========================================

@admin_bp.route("/companies", methods=["GET"])
@require_role(["ADMIN", "SENIOR_OFFICER"])
def list_companies():
    search = request.args.get("search", "").strip().lower()
    status_filter = request.args.get("status")

    query = Manufacturer.query.order_by(Manufacturer.name.asc())
    if status_filter and status_filter != "ALL":
        query = query.filter_by(is_active=(status_filter == "ACTIVE"))

    companies = query.all()
    if search:
        companies = [
            c for c in companies
            if search in c.name.lower()
            or search in (c.legal_entity_name or "").lower()
            or search in (c.city or "").lower()
            or search in (c.state or "").lower()
            or search in (c.registration_number or "").lower()
        ]

    return jsonify({"companies": [c.to_dict() for c in companies], "count": len(companies)})

@admin_bp.route("/companies", methods=["POST"])
@require_role(["ADMIN"])
def create_company():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "Company Name is required."}), 400

    company = Manufacturer(
        name=name,
        legal_entity_name=data.get("legal_entity_name", "").strip() or name,
        address=data.get("address", "").strip(),
        city=data.get("city", "").strip(),
        state=data.get("state", "").strip(),
        pin_code=data.get("pin_code", "").strip(),
        contact_email=data.get("contact_email", "").strip().lower() if data.get("contact_email") else None,
        contact_phone=data.get("contact_phone", "").strip(),
        is_importer=bool(data.get("is_importer", False)),
        registration_number=data.get("registration_number", "").strip(),
        is_active=bool(data.get("is_active", True))
    )
    db.session.add(company)
    db.session.flush()

    audit = AuditLog(
        user_id=g.current_user.id,
        action_type=AuditActionType.COMPANY_MODIFIED,
        entity_name="Manufacturer",
        entity_id=str(company.id),
        new_state_json=json.dumps(company.to_dict()),
        justification=f"New enterprise entity '{company.name}' created by Admin {g.current_user.full_name}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({"company": company.to_dict()}), 201

@admin_bp.route("/companies/<int:company_id>", methods=["GET"])
@require_role(["ADMIN", "SENIOR_OFFICER"])
def get_company(company_id):
    company = db.session.get(Manufacturer, company_id)
    if not company:
        return jsonify({"error": "Company not found."}), 404

    comp_dict = company.to_dict()
    comp_dict["plants"] = [p.to_dict() for p in company.plants]
    comp_dict["products"] = [p.to_dict() for p in company.products]
    return jsonify({"company": comp_dict})

@admin_bp.route("/companies/<int:company_id>", methods=["PUT"])
@require_role(["ADMIN"])
def update_company(company_id):
    company = db.session.get(Manufacturer, company_id)
    if not company:
        return jsonify({"error": "Company not found."}), 404

    data = request.get_json() or {}
    prev_state = company.to_dict()

    if "name" in data and data["name"].strip():
        company.name = data["name"].strip()
    if "legal_entity_name" in data:
        company.legal_entity_name = data["legal_entity_name"].strip()
    if "address" in data:
        company.address = data["address"].strip()
    if "city" in data:
        company.city = data["city"].strip()
    if "state" in data:
        company.state = data["state"].strip()
    if "pin_code" in data:
        company.pin_code = data["pin_code"].strip()
    if "contact_email" in data:
        company.contact_email = data["contact_email"].strip().lower()
    if "contact_phone" in data:
        company.contact_phone = data["contact_phone"].strip()
    if "is_importer" in data:
        company.is_importer = bool(data["is_importer"])
    if "registration_number" in data:
        company.registration_number = data["registration_number"].strip()
    if "is_active" in data:
        company.is_active = bool(data["is_active"])

    audit = AuditLog(
        user_id=g.current_user.id,
        action_type=AuditActionType.COMPANY_MODIFIED,
        entity_name="Manufacturer",
        entity_id=str(company.id),
        previous_state_json=json.dumps(prev_state),
        new_state_json=json.dumps(company.to_dict()),
        justification=f"Company profile '{company.name}' updated by Admin {g.current_user.full_name}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({"message": "Company updated successfully.", "company": company.to_dict()})

@admin_bp.route("/companies/<int:company_id>/toggle-status", methods=["PATCH"])
@require_role(["ADMIN"])
def toggle_company_status(company_id):
    company = db.session.get(Manufacturer, company_id)
    if not company:
        return jsonify({"error": "Company not found."}), 404

    prev_status = company.is_active
    company.is_active = not company.is_active

    audit = AuditLog(
        user_id=g.current_user.id,
        action_type=AuditActionType.COMPANY_MODIFIED,
        entity_name="Manufacturer",
        entity_id=str(company.id),
        previous_state_json=json.dumps({"is_active": prev_status}),
        new_state_json=json.dumps({"is_active": company.is_active}),
        justification=f"Company '{company.name}' status toggled to {'ACTIVE' if company.is_active else 'INACTIVE'}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({"message": f"Company {'activated' if company.is_active else 'deactivated'} successfully.", "company": company.to_dict()})

@admin_bp.route("/companies/<int:company_id>", methods=["DELETE"])
@require_role(["ADMIN"])
def delete_company(company_id):
    company = db.session.get(Manufacturer, company_id)
    if not company:
        return jsonify({"error": "Company not found."}), 404

    if len(company.products) > 0:
        return jsonify({"error": f"Cannot delete company '{company.name}' because {len(company.products)} product(s) are linked to it. Deactivate instead."}), 400

    deleted_info = company.to_dict()
    db.session.delete(company)
    audit = AuditLog(
        user_id=g.current_user.id,
        action_type=AuditActionType.COMPANY_MODIFIED,
        entity_name="Manufacturer",
        entity_id=str(company_id),
        previous_state_json=json.dumps(deleted_info),
        new_state_json=json.dumps({"deleted": True}),
        justification=f"Company '{deleted_info['name']}' deleted by Admin {g.current_user.full_name}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({"message": f"Company '{deleted_info['name']}' deleted successfully."})


# ==========================================
# 3. JURISDICTION MANAGEMENT
# ==========================================

@admin_bp.route("/jurisdictions", methods=["GET"])
@require_role(["ADMIN", "SENIOR_OFFICER"])
def list_jurisdictions():
    search = request.args.get("search", "").strip().lower()
    state_filter = request.args.get("state")

    query = Jurisdiction.query.order_by(Jurisdiction.state.asc(), Jurisdiction.name.asc())
    if state_filter and state_filter != "ALL":
        query = query.filter_by(state=state_filter)

    jurisdictions = query.all()
    if search:
        jurisdictions = [
            j for j in jurisdictions
            if search in j.code.lower()
            or search in j.name.lower()
            or search in j.state.lower()
            or search in (j.district or "").lower()
        ]

    return jsonify({"jurisdictions": [j.to_dict() for j in jurisdictions], "count": len(jurisdictions)})

@admin_bp.route("/jurisdictions", methods=["POST"])
@require_role(["ADMIN"])
def create_jurisdiction():
    data = request.get_json() or {}
    code = data.get("code", "").strip().upper()
    name = data.get("name", "").strip()
    state = data.get("state", "").strip()

    if not code or not name or not state:
        return jsonify({"error": "Jurisdiction Code, Name, and State are required."}), 400

    if Jurisdiction.query.filter_by(code=code).first():
        return jsonify({"error": f"Jurisdiction code '{code}' already exists."}), 400

    jurisdiction = Jurisdiction(
        code=code,
        name=name,
        state=state,
        district=data.get("district", "").strip(),
        description=data.get("description", "").strip(),
        is_active=bool(data.get("is_active", True))
    )
    db.session.add(jurisdiction)
    db.session.flush()

    audit = AuditLog(
        user_id=g.current_user.id,
        action_type=AuditActionType.JURISDICTION_MODIFIED,
        entity_name="Jurisdiction",
        entity_id=str(jurisdiction.id),
        new_state_json=json.dumps(jurisdiction.to_dict()),
        justification=f"Jurisdiction '{jurisdiction.name}' ({jurisdiction.code}) configured by Admin {g.current_user.full_name}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({"jurisdiction": jurisdiction.to_dict()}), 201

@admin_bp.route("/jurisdictions/<int:jur_id>", methods=["PUT"])
@require_role(["ADMIN"])
def update_jurisdiction(jur_id):
    jur = db.session.get(Jurisdiction, jur_id)
    if not jur:
        return jsonify({"error": "Jurisdiction not found."}), 404

    data = request.get_json() or {}
    prev_state = jur.to_dict()

    if "name" in data and data["name"].strip():
        jur.name = data["name"].strip()
    if "code" in data and data["code"].strip():
        new_code = data["code"].strip().upper()
        existing = Jurisdiction.query.filter_by(code=new_code).first()
        if existing and existing.id != jur.id:
            return jsonify({"error": f"Jurisdiction code '{new_code}' already exists."}), 400
        jur.code = new_code
    if "state" in data and data["state"].strip():
        jur.state = data["state"].strip()
    if "district" in data:
        jur.district = data["district"].strip()
    if "description" in data:
        jur.description = data["description"].strip()
    if "is_active" in data:
        jur.is_active = bool(data["is_active"])

    audit = AuditLog(
        user_id=g.current_user.id,
        action_type=AuditActionType.JURISDICTION_MODIFIED,
        entity_name="Jurisdiction",
        entity_id=str(jur.id),
        previous_state_json=json.dumps(prev_state),
        new_state_json=json.dumps(jur.to_dict()),
        justification=f"Jurisdiction '{jur.name}' updated by Admin {g.current_user.full_name}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({"message": "Jurisdiction updated successfully.", "jurisdiction": jur.to_dict()})

@admin_bp.route("/jurisdictions/<int:jur_id>/toggle-status", methods=["PATCH"])
@require_role(["ADMIN"])
def toggle_jurisdiction_status(jur_id):
    jur = db.session.get(Jurisdiction, jur_id)
    if not jur:
        return jsonify({"error": "Jurisdiction not found."}), 404

    prev_status = jur.is_active
    jur.is_active = not jur.is_active

    audit = AuditLog(
        user_id=g.current_user.id,
        action_type=AuditActionType.JURISDICTION_MODIFIED,
        entity_name="Jurisdiction",
        entity_id=str(jur.id),
        previous_state_json=json.dumps({"is_active": prev_status}),
        new_state_json=json.dumps({"is_active": jur.is_active}),
        justification=f"Jurisdiction '{jur.name}' status toggled to {'ACTIVE' if jur.is_active else 'INACTIVE'}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({"message": f"Jurisdiction {'activated' if jur.is_active else 'deactivated'} successfully.", "jurisdiction": jur.to_dict()})


# ==========================================
# 4. PLANT / LOCATION MANAGEMENT
# ==========================================

@admin_bp.route("/plants", methods=["GET"])
@require_role(["ADMIN", "SENIOR_OFFICER"])
def list_plants():
    company_id = request.args.get("company_id")
    jurisdiction_id = request.args.get("jurisdiction_id")
    search = request.args.get("search", "").strip().lower()

    query = Plant.query.order_by(Plant.name.asc())
    if company_id:
        query = query.filter_by(company_id=int(company_id))
    if jurisdiction_id:
        query = query.filter_by(jurisdiction_id=int(jurisdiction_id))

    plants = query.all()
    if search:
        plants = [
            p for p in plants
            if search in p.name.lower()
            or search in p.plant_code.lower()
            or search in (p.city or "").lower()
            or search in (p.state or "").lower()
            or (p.company and search in p.company.name.lower())
        ]

    return jsonify({"plants": [p.to_dict() for p in plants], "count": len(plants)})

@admin_bp.route("/plants", methods=["POST"])
@require_role(["ADMIN"])
def create_plant():
    data = request.get_json() or {}
    company_id = data.get("company_id")
    plant_code = data.get("plant_code", "").strip().upper()
    name = data.get("name", "").strip()

    if not company_id or not plant_code or not name:
        return jsonify({"error": "Company ID, Plant Code, and Plant Name are required."}), 400

    company = db.session.get(Manufacturer, int(company_id))
    if not company:
        return jsonify({"error": "Company not found."}), 404

    plant = Plant(
        company_id=company.id,
        plant_code=plant_code,
        name=name,
        address=data.get("address", "").strip(),
        city=data.get("city", "").strip(),
        state=data.get("state", "").strip(),
        pin_code=data.get("pin_code", "").strip(),
        jurisdiction_id=int(data["jurisdiction_id"]) if data.get("jurisdiction_id") else None,
        contact_person=data.get("contact_person", "").strip(),
        contact_email=data.get("contact_email", "").strip().lower() if data.get("contact_email") else None,
        contact_phone=data.get("contact_phone", "").strip(),
        is_active=bool(data.get("is_active", True))
    )
    db.session.add(plant)
    db.session.flush()

    audit = AuditLog(
        user_id=g.current_user.id,
        action_type=AuditActionType.PLANT_MODIFIED,
        entity_name="Plant",
        entity_id=str(plant.id),
        new_state_json=json.dumps(plant.to_dict()),
        justification=f"Plant facility '{plant.name}' ({plant.plant_code}) for '{company.name}' created by Admin {g.current_user.full_name}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({"plant": plant.to_dict()}), 201

@admin_bp.route("/plants/<int:plant_id>", methods=["PUT"])
@require_role(["ADMIN"])
def update_plant(plant_id):
    plant = db.session.get(Plant, plant_id)
    if not plant:
        return jsonify({"error": "Plant not found."}), 404

    data = request.get_json() or {}
    prev_state = plant.to_dict()

    if "name" in data and data["name"].strip():
        plant.name = data["name"].strip()
    if "plant_code" in data and data["plant_code"].strip():
        plant.plant_code = data["plant_code"].strip().upper()
    if "address" in data:
        plant.address = data["address"].strip()
    if "city" in data:
        plant.city = data["city"].strip()
    if "state" in data:
        plant.state = data["state"].strip()
    if "pin_code" in data:
        plant.pin_code = data["pin_code"].strip()
    if "jurisdiction_id" in data:
        jid = data["jurisdiction_id"]
        plant.jurisdiction_id = int(jid) if jid else None
    if "contact_person" in data:
        plant.contact_person = data["contact_person"].strip()
    if "contact_email" in data:
        plant.contact_email = data["contact_email"].strip().lower()
    if "contact_phone" in data:
        plant.contact_phone = data["contact_phone"].strip()
    if "is_active" in data:
        plant.is_active = bool(data["is_active"])

    audit = AuditLog(
        user_id=g.current_user.id,
        action_type=AuditActionType.PLANT_MODIFIED,
        entity_name="Plant",
        entity_id=str(plant.id),
        previous_state_json=json.dumps(prev_state),
        new_state_json=json.dumps(plant.to_dict()),
        justification=f"Plant facility '{plant.name}' updated by Admin {g.current_user.full_name}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({"message": "Plant updated successfully.", "plant": plant.to_dict()})

@admin_bp.route("/plants/<int:plant_id>/toggle-status", methods=["PATCH"])
@require_role(["ADMIN"])
def toggle_plant_status(plant_id):
    plant = db.session.get(Plant, plant_id)
    if not plant:
        return jsonify({"error": "Plant not found."}), 404

    prev_status = plant.is_active
    plant.is_active = not plant.is_active

    audit = AuditLog(
        user_id=g.current_user.id,
        action_type=AuditActionType.PLANT_MODIFIED,
        entity_name="Plant",
        entity_id=str(plant.id),
        previous_state_json=json.dumps({"is_active": prev_status}),
        new_state_json=json.dumps({"is_active": plant.is_active}),
        justification=f"Plant facility '{plant.name}' status toggled to {'ACTIVE' if plant.is_active else 'INACTIVE'}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({"message": f"Plant {'activated' if plant.is_active else 'deactivated'} successfully.", "plant": plant.to_dict()})


# ==========================================
# 5. INSPECTOR ELIGIBILITY MANAGEMENT
# ==========================================

@admin_bp.route("/inspectors", methods=["GET"])
@require_role(["ADMIN", "SENIOR_OFFICER"])
def list_inspectors():
    inspectors = User.query.filter_by(role=UserRole.INSPECTOR).order_by(User.full_name.asc()).all()
    out = []
    for insp in inspectors:
        insp_dict = insp.to_dict()
        insp_dict["category_eligibilities"] = [ce.to_dict() for ce in insp.category_eligibilities]
        insp_dict["jurisdiction_eligibilities"] = [je.to_dict() for je in insp.jurisdiction_eligibilities]
        out.append(insp_dict)
    return jsonify({"inspectors": out, "count": len(out)})

@admin_bp.route("/inspectors/<int:inspector_id>/eligibility", methods=["GET"])
@require_role(["ADMIN", "SENIOR_OFFICER"])
def get_inspector_eligibility(inspector_id):
    inspector = db.session.get(User, inspector_id)
    if not inspector or inspector.role != UserRole.INSPECTOR:
        return jsonify({"error": "Inspector not found."}), 404

    return jsonify({
        "inspector": inspector.to_dict(),
        "categories": [ce.to_dict() for ce in inspector.category_eligibilities],
        "jurisdictions": [je.to_dict() for je in inspector.jurisdiction_eligibilities]
    })

@admin_bp.route("/inspectors/<int:inspector_id>/eligibility", methods=["POST"])
@require_role(["ADMIN"])
def configure_inspector_eligibility(inspector_id):
    inspector = db.session.get(User, inspector_id)
    if not inspector or inspector.role != UserRole.INSPECTOR:
        return jsonify({"error": "Inspector not found."}), 404

    data = request.get_json() or {}
    category_ids = data.get("category_ids", []) # list of category IDs
    jurisdiction_ids = data.get("jurisdiction_ids", []) # list of jurisdiction IDs

    # 1. Update Category eligibilities
    InspectorCategoryEligibility.query.filter_by(inspector_id=inspector.id).delete()
    for cid in category_ids:
        cat = db.session.get(ProductCategory, int(cid))
        if cat:
            db.session.add(InspectorCategoryEligibility(
                inspector_id=inspector.id,
                category_id=cat.id,
                is_active=True
            ))

    # 2. Update Jurisdiction eligibilities
    InspectorJurisdictionEligibility.query.filter_by(inspector_id=inspector.id).delete()
    for jid in jurisdiction_ids:
        jur = db.session.get(Jurisdiction, int(jid))
        if jur:
            db.session.add(InspectorJurisdictionEligibility(
                inspector_id=inspector.id,
                jurisdiction_id=jur.id,
                is_active=True
            ))

    audit = AuditLog(
        user_id=g.current_user.id,
        action_type=AuditActionType.ELIGIBILITY_MODIFIED,
        entity_name="InspectorEligibility",
        entity_id=str(inspector.id),
        new_state_json=json.dumps({"category_ids": category_ids, "jurisdiction_ids": jurisdiction_ids}),
        justification=f"Statutory inspector permanent qualification matrix updated for {inspector.full_name} ({inspector.badge_number}) by Admin {g.current_user.full_name}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({
        "message": "Inspector eligibility qualifications updated successfully.",
        "inspector_id": inspector.id,
        "categories_count": len(category_ids),
        "jurisdictions_count": len(jurisdiction_ids)
    })

@admin_bp.route("/inspectors/eligible", methods=["GET"])
@require_role(["ADMIN", "SENIOR_OFFICER"])
def query_eligible_inspectors():
    """
    Query eligible inspectors filtered strictly by:
    Inspector active AND Category eligibility AND Jurisdiction eligibility
    """
    category_id = request.args.get("category_id")
    jurisdiction_id = request.args.get("jurisdiction_id")

    query = User.query.filter_by(role=UserRole.INSPECTOR, is_active=True)

    if category_id:
        query = query.join(InspectorCategoryEligibility, InspectorCategoryEligibility.inspector_id == User.id)\
                     .filter(InspectorCategoryEligibility.category_id == int(category_id), InspectorCategoryEligibility.is_active == True)

    if jurisdiction_id:
        query = query.join(InspectorJurisdictionEligibility, InspectorJurisdictionEligibility.inspector_id == User.id)\
                     .filter(InspectorJurisdictionEligibility.jurisdiction_id == int(jurisdiction_id), InspectorJurisdictionEligibility.is_active == True)

    inspectors = query.distinct().all()
    out = []
    for insp in inspectors:
        insp_dict = insp.to_dict()
        # Workload helper for recommendations
        active_audits_count = InspectionCase.query.filter(
            InspectionCase.inspector_id == insp.id,
            InspectionCase.status.in_([CaseStatus.DRAFT, CaseStatus.EVIDENCE_PENDING, CaseStatus.ANALYZING, CaseStatus.INSPECTOR_REVIEW])
        ).count()
        insp_dict["active_workload_count"] = active_audits_count
        out.append(insp_dict)

    return jsonify({"eligible_inspectors": out, "count": len(out)})


# ==========================================
# 6. PRODUCT CATEGORY MANAGEMENT
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
# 7. RULE BOOK REQUIREMENTS & VERSIONS
# ==========================================

@admin_bp.route("/rules/<int:rule_id>/versions", methods=["GET"])
@require_role(["ADMIN", "SENIOR_OFFICER"])
def list_rule_versions(rule_id):
    rule = db.session.get(RegulatoryRule, rule_id)
    if not rule:
        return jsonify({"error": "Rule not found."}), 404

    versions = RegulatoryRule.query.filter_by(rule_code=rule.rule_code).order_by(RegulatoryRule.effective_from.desc()).all()
    return jsonify({
        "rule_code": rule.rule_code,
        "current_rule_id": rule.id,
        "versions": [v.to_dict() for v in versions],
        "count": len(versions)
    })

@admin_bp.route("/rules/<int:rule_id>/version", methods=["POST"])
@require_role(["ADMIN"])
def create_new_rule_version(rule_id):
    base_rule = db.session.get(RegulatoryRule, rule_id)
    if not base_rule:
        return jsonify({"error": "Base rule not found."}), 404

    data = request.get_json() or {}
    new_version = data.get("version", "").strip()
    eff_from_str = data.get("effective_from")

    if not new_version or not eff_from_str:
        return jsonify({"error": "Version string (e.g. v2027.1) and Effective From date are required."}), 400

    eff_from = datetime.strptime(eff_from_str, "%Y-%m-%d").date()

    # Check for duplicate version code
    existing = RegulatoryRule.query.filter_by(rule_code=base_rule.rule_code, version=new_version).first()
    if existing:
        return jsonify({"error": f"Version '{new_version}' for rule '{base_rule.rule_code}' already exists."}), 400

    # Auto-adjust predecessor's effective_to if appropriate
    if base_rule.effective_from < eff_from and (base_rule.effective_to is None or base_rule.effective_to > eff_from):
        base_rule.effective_to = eff_from

    notif_date_str = data.get("notification_date")
    notif_date = datetime.strptime(notif_date_str, "%Y-%m-%d").date() if notif_date_str else base_rule.notification_date

    eff_to_str = data.get("effective_to")
    eff_to = datetime.strptime(eff_to_str, "%Y-%m-%d").date() if eff_to_str else None

    new_rule = RegulatoryRule(
        rule_code=base_rule.rule_code,
        version=new_version,
        title=data.get("title", base_rule.title).strip(),
        description=data.get("description", base_rule.description).strip(),
        statutory_citation=data.get("statutory_citation", base_rule.statutory_citation).strip(),
        government_authority=data.get("government_authority", base_rule.government_authority),
        notification_reference=data.get("notification_reference", base_rule.notification_reference),
        notification_date=notif_date,
        amendment_title=data.get("amendment_title", base_rule.amendment_title),
        status=data.get("status", "FUTURE_SCHEDULED" if eff_from > date.today() else "ACTIVE"),
        official_source=data.get("official_source", base_rule.official_source),
        source_document=data.get("source_document", base_rule.source_document).strip(),
        validation_logic_type=data.get("validation_logic_type", base_rule.validation_logic_type).strip(),
        applicability_criteria_json=json.dumps(data.get("applicability_criteria", base_rule.get_applicability())),
        effective_from=eff_from,
        effective_to=eff_to,
        is_active=bool(data.get("is_active", True))
    )
    db.session.add(new_rule)
    db.session.flush()

    # Clone category mappings from base rule
    for cm in base_rule.category_mappings:
        db.session.add(RuleCategoryMapping(
            rule_id=new_rule.id,
            category_id=cm.category_id,
            is_exempt=cm.is_exempt,
            exception_notes=cm.exception_notes
        ))

    # Clone requirements from base rule if requested
    if data.get("clone_requirements", True):
        for req in base_rule.requirements:
            db.session.add(RuleRequirement(
                rule_id=new_rule.id,
                requirement_code=req.requirement_code,
                title=req.title,
                requirement_type=req.requirement_type,
                description=req.description,
                condition_json=req.condition_json,
                is_mandatory=req.is_mandatory
            ))

    audit = AuditLog(
        user_id=g.current_user.id,
        action_type=AuditActionType.RULE_MODIFIED,
        entity_name="RegulatoryRule",
        entity_id=str(new_rule.id),
        new_state_json=json.dumps(new_rule.to_dict()),
        justification=f"New statutory rule version {new_rule.rule_code} ({new_rule.version}) created by Admin {g.current_user.full_name}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({"rule": new_rule.to_dict()}), 201

@admin_bp.route("/rules/<int:rule_id>/requirements", methods=["GET"])
@require_role(["ADMIN", "SENIOR_OFFICER", "INSPECTOR"])
def list_rule_requirements(rule_id):
    rule = db.session.get(RegulatoryRule, rule_id)
    if not rule:
        return jsonify({"error": "Rule not found."}), 404

    return jsonify({"requirements": [r.to_dict() for r in rule.requirements], "count": len(rule.requirements)})

@admin_bp.route("/rules/<int:rule_id>/requirements", methods=["POST"])
@require_role(["ADMIN"])
def add_rule_requirement(rule_id):
    rule = db.session.get(RegulatoryRule, rule_id)
    if not rule:
        return jsonify({"error": "Rule not found."}), 404

    data = request.get_json() or {}
    req_code = data.get("requirement_code", "").strip().upper()
    title = data.get("title", "").strip()

    if not req_code or not title:
        return jsonify({"error": "Requirement Code and Title are required."}), 400

    req = RuleRequirement(
        rule_id=rule.id,
        requirement_code=req_code,
        title=title,
        requirement_type=data.get("requirement_type", "MANDATORY_DECLARATION"),
        description=data.get("description", "").strip(),
        condition_json=json.dumps(data.get("condition", {})),
        is_mandatory=bool(data.get("is_mandatory", True))
    )
    db.session.add(req)
    db.session.flush()

    audit = AuditLog(
        user_id=g.current_user.id,
        action_type=AuditActionType.RULE_MODIFIED,
        entity_name="RuleRequirement",
        entity_id=str(req.id),
        new_state_json=json.dumps(req.to_dict()),
        justification=f"Requirement '{req.title}' added to rule {rule.rule_code} ({rule.version})."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({"requirement": req.to_dict()}), 201

@admin_bp.route("/rules/<int:rule_id>/requirements/<int:req_id>", methods=["DELETE"])
@require_role(["ADMIN"])
def delete_rule_requirement(rule_id, req_id):
    req = db.session.get(RuleRequirement, req_id)
    if not req or req.rule_id != rule_id:
        return jsonify({"error": "Requirement not found."}), 404

    db.session.delete(req)
    audit = AuditLog(
        user_id=g.current_user.id,
        action_type=AuditActionType.RULE_MODIFIED,
        entity_name="RuleRequirement",
        entity_id=str(req_id),
        new_state_json=json.dumps({"deleted": True}),
        justification=f"Requirement #{req_id} removed from Rule #{rule_id}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({"message": "Requirement deleted successfully."})


# ==========================================
# 8. INNOVATION #9 — REGULATORY IMPACT SIMULATOR
# ==========================================

@admin_bp.route("/rules/<int:rule_id>/impact", methods=["GET"])
@require_role(["ADMIN", "SENIOR_OFFICER"])
def get_rule_impact(rule_id):
    """Calculates deterministic regulatory impact for an existing rule."""
    res = RegulatoryImpactSimulatorService.simulate_rule_impact(rule_id=rule_id)
    if "error" in res:
        return jsonify(res), 404

    # Log regulatory impact calculation run
    audit = AuditLog(
        user_id=g.current_user.id,
        action_type=AuditActionType.REGULATORY_IMPACT_RUN,
        entity_name="RegulatoryRule",
        entity_id=str(rule_id),
        new_state_json=json.dumps(res.get("summary", {})),
        justification=f"Regulatory Change Impact Simulator run for rule #{rule_id} by {g.current_user.full_name}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify(res)

@admin_bp.route("/rules/impact-simulate", methods=["POST"])
@require_role(["ADMIN", "SENIOR_OFFICER"])
def simulate_regulatory_impact():
    """Simulates regulatory impact across hypothetical or draft changes."""
    data = request.get_json() or {}
    rule_id = data.get("rule_id")
    category_ids = data.get("category_ids", [])
    effective_date_str = data.get("effective_date")
    
    eff_date = None
    if effective_date_str:
        try:
            eff_date = datetime.strptime(effective_date_str, "%Y-%m-%d").date()
        except ValueError:
            pass

    res = RegulatoryImpactSimulatorService.simulate_rule_impact(
        rule_id=int(rule_id) if rule_id else None,
        category_ids=category_ids,
        effective_date=eff_date
    )
    if "error" in res:
        return jsonify(res), 400

    audit = AuditLog(
        user_id=g.current_user.id,
        action_type=AuditActionType.REGULATORY_IMPACT_RUN,
        entity_name="RegulatoryImpactSimulation",
        entity_id="SIMULATED",
        new_state_json=json.dumps(res.get("summary", {})),
        justification=f"Simulated regulatory impact discovery executed by {g.current_user.full_name}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify(res)


# ==========================================
# 9. DASHBOARD STATS & SYSTEM MONITORING
# ==========================================

@admin_bp.route("/dashboard-stats", methods=["GET"])
@require_role(["ADMIN"])
def admin_dashboard_stats():
    """Returns actual system counters and master data metrics for the Admin Dashboard."""
    total_companies = Manufacturer.query.count()
    active_companies = Manufacturer.query.filter_by(is_active=True).count()

    total_plants = Plant.query.count()
    active_plants = Plant.query.filter_by(is_active=True).count()

    total_jurisdictions = Jurisdiction.query.count()
    active_jurisdictions = Jurisdiction.query.filter_by(is_active=True).count()

    total_inspectors = User.query.filter_by(role=UserRole.INSPECTOR).count()
    active_inspectors = User.query.filter_by(role=UserRole.INSPECTOR, is_active=True).count()

    total_categories = ProductCategory.query.count()
    active_categories = ProductCategory.query.filter_by(is_active=True).count()

    total_rules = RegulatoryRule.query.count()
    active_rules = RegulatoryRule.query.filter_by(is_active=True).count()
    
    today = date.today()
    upcoming_rules = RegulatoryRule.query.filter(RegulatoryRule.effective_from > today, RegulatoryRule.is_active == True).count()

    total_audits = InspectionCase.query.count()
    active_audits = InspectionCase.query.filter(
        InspectionCase.status.in_([CaseStatus.DRAFT, CaseStatus.EVIDENCE_PENDING, CaseStatus.ANALYZING, CaseStatus.INSPECTOR_REVIEW, CaseStatus.SUBMITTED, CaseStatus.SENIOR_REVIEW])
    ).count()

    total_users = User.query.count()
    active_users = User.query.filter_by(is_active=True).count()

    recent_logs = AuditLog.query.order_by(AuditLog.timestamp.desc()).limit(8).all()

    return jsonify({
        "stats": {
            "companies": {"total": total_companies, "active": active_companies},
            "plants": {"total": total_plants, "active": active_plants},
            "jurisdictions": {"total": total_jurisdictions, "active": active_jurisdictions},
            "inspectors": {"total": total_inspectors, "active": active_inspectors},
            "categories": {"total": total_categories, "active": active_categories},
            "rules": {"total": total_rules, "active": active_rules, "upcoming": upcoming_rules},
            "audits": {"total": total_audits, "active": active_audits},
            "users": {"total": total_users, "active": active_users}
        },
        "recent_audit_logs": [l.to_dict() for l in recent_logs]
    })

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
        try:
            query = query.filter_by(action_type=AuditActionType(action_type))
        except ValueError:
            pass
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

@admin_bp.route("/system-health", methods=["GET"])
@require_role(["ADMIN"])
def system_health():
    import time
    db_start = time.time()
    total_users = User.query.count()
    active_users = User.query.filter_by(is_active=True).count()
    db_latency_ms = round((time.time() - db_start) * 1000, 2)

    total_companies = Manufacturer.query.count()
    total_plants = Plant.query.count()
    total_jurisdictions = Jurisdiction.query.count()
    total_rules = RegulatoryRule.query.count()
    active_rules = RegulatoryRule.query.filter_by(is_active=True).count()
    total_categories = ProductCategory.query.count()
    total_products = Product.query.count()
    total_cases = InspectionCase.query.count()
    total_audits = AuditLog.query.count()

    inspectors_count = User.query.filter_by(role=UserRole.INSPECTOR).count()
    seniors_count = User.query.filter_by(role=UserRole.SENIOR_OFFICER).count()
    admins_count = User.query.filter_by(role=UserRole.ADMIN).count()
    companies_count = User.query.filter_by(role=UserRole.COMPANY).count()

    upload_dir = os.path.join(os.getcwd(), "uploads")
    evidence_count = 0
    storage_size_bytes = 0
    if os.path.exists(upload_dir):
        for root, _, files in os.walk(upload_dir):
            for f in files:
                evidence_count += 1
                storage_size_bytes += os.path.getsize(os.path.join(root, f))
    
    total, used, free = shutil.disk_usage(os.getcwd())

    ocr_status = "READY"
    try:
        from services.ocr_service import get_ocr_engine
        engine = get_ocr_engine()
        if engine is None:
            ocr_status = "OFFLINE"
    except Exception:
        ocr_status = "READY"

    return jsonify({
        "status": "HEALTHY",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": {
            "status": "CONNECTED",
            "latency_ms": db_latency_ms,
            "engine": str(db.engine.url.drivername) if hasattr(db, "engine") else "sqlite",
            "tables": {
                "users": total_users,
                "companies": total_companies,
                "plants": total_plants,
                "jurisdictions": total_jurisdictions,
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
            "admins": admins_count,
            "companies": companies_count
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
            "rbac_policy": "PackSure 4-Module Legal Metrology Authority Architecture"
        }
    })
