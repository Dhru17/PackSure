import json
from datetime import datetime, timezone, date
from flask import Blueprint, request, jsonify, g
from models import db, RegulatoryRule, RuleCategoryMapping, ProductCategory, AuditLog, AuditActionType
from services.auth_service import require_auth, require_role

rules_bp = Blueprint("rules_bp", __name__, url_prefix="/api/rules")

@rules_bp.route("", methods=["GET"])
@require_auth
def list_rules():
    version = request.args.get("version")
    category_id = request.args.get("category_id")
    is_active = request.args.get("is_active")

    query = RegulatoryRule.query.order_by(RegulatoryRule.rule_code.asc(), RegulatoryRule.version.desc())
    if version:
        query = query.filter_by(version=version)
    if is_active is not None:
        query = query.filter_by(is_active=(is_active.lower() == "true"))

    rules = query.all()
    return jsonify({
        "rules": [r.to_dict() for r in rules],
        "count": len(rules)
    })

@rules_bp.route("/<int:rule_id>", methods=["GET"])
@require_auth
def get_rule(rule_id):
    rule = RegulatoryRule.query.get_or_404(rule_id)
    return jsonify(rule.to_dict())

@rules_bp.route("", methods=["POST"])
@require_role(["ADMIN"])
def create_rule():
    data = request.get_json() or {}
    rule_code = data.get("rule_code", "").strip().upper()
    version = data.get("version", "v2026.1").strip()
    title = data.get("title", "").strip()
    citation = data.get("statutory_citation", "").strip()

    if not rule_code or not title or not citation:
        return jsonify({"error": "Rule code, title, and statutory citation are required."}), 400

    eff_from_str = data.get("effective_from", date.today().isoformat())
    eff_from = datetime.strptime(eff_from_str, "%Y-%m-%d").date() if isinstance(eff_from_str, str) else date.today()

    rule = RegulatoryRule(
        rule_code=rule_code,
        version=version,
        title=title,
        description=data.get("description", ""),
        statutory_citation=citation,
        source_document=data.get("source_document", "Legal Metrology (Packaged Commodities) Rules, 2011"),
        validation_logic_type=data.get("validation_logic_type", "GENERIC_PRESENCE"),
        applicability_criteria_json=json.dumps(data.get("applicability_criteria", {})),
        effective_from=eff_from,
        is_active=bool(data.get("is_active", True))
    )
    db.session.add(rule)
    db.session.flush()

    audit = AuditLog(
        user_id=g.current_user.id,
        action_type=AuditActionType.RULE_MODIFIED,
        entity_name="RegulatoryRule",
        entity_id=str(rule.id),
        new_state_json=json.dumps({"rule_code": rule.rule_code, "version": rule.version}),
        justification=f"Admin created new rule version {rule.rule_code} ({rule.version})."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({"rule": rule.to_dict()}), 201

@rules_bp.route("/<int:rule_id>", methods=["PUT"])
@require_role(["ADMIN"])
def update_rule(rule_id):
    rule = db.session.get(RegulatoryRule, rule_id)
    if not rule:
        return jsonify({"error": "Rule not found."}), 404

    data = request.get_json() or {}
    prev_state = rule.to_dict()

    if "title" in data and data["title"].strip():
        rule.title = data["title"].strip()
    if "description" in data:
        rule.description = data["description"].strip()
    if "statutory_citation" in data and data["statutory_citation"].strip():
        rule.statutory_citation = data["statutory_citation"].strip()
    if "source_document" in data:
        rule.source_document = data["source_document"].strip()
    if "validation_logic_type" in data:
        rule.validation_logic_type = data["validation_logic_type"].strip()
    if "applicability_criteria" in data:
        rule.applicability_criteria_json = json.dumps(data["applicability_criteria"])
    if "effective_to" in data:
        eff_to = data["effective_to"]
        rule.effective_to = datetime.strptime(eff_to, "%Y-%m-%d").date() if eff_to else None
    if "is_active" in data:
        rule.is_active = bool(data["is_active"])

    audit = AuditLog(
        user_id=g.current_user.id,
        action_type=AuditActionType.RULE_MODIFIED,
        entity_name="RegulatoryRule",
        entity_id=str(rule.id),
        previous_state_json=json.dumps(prev_state),
        new_state_json=json.dumps(rule.to_dict()),
        justification=data.get("justification", f"Regulatory rule {rule.rule_code} updated by Admin {g.current_user.full_name}.")
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({"message": "Rule updated successfully.", "rule": rule.to_dict()})

@rules_bp.route("/<int:rule_id>/toggle-status", methods=["PATCH"])
@require_role(["ADMIN"])
def toggle_rule_status(rule_id):
    rule = db.session.get(RegulatoryRule, rule_id)
    if not rule:
        return jsonify({"error": "Rule not found."}), 404

    prev_status = rule.is_active
    rule.is_active = not rule.is_active

    audit = AuditLog(
        user_id=g.current_user.id,
        action_type=AuditActionType.RULE_MODIFIED,
        entity_name="RegulatoryRule",
        entity_id=str(rule.id),
        previous_state_json=json.dumps({"is_active": prev_status}),
        new_state_json=json.dumps({"is_active": rule.is_active}),
        justification=f"Rule {rule.rule_code} status toggled to {'ACTIVE' if rule.is_active else 'INACTIVE'}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({"message": f"Rule {'activated' if rule.is_active else 'deactivated'} successfully.", "rule": rule.to_dict()})

