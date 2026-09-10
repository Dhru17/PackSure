import jwt
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import request, jsonify, g
from config import Config
from models import db, User

def generate_token(user: User) -> str:
    payload = {
        "sub": str(user.id),
        "email": str(user.email),
        "role": user.role.value if hasattr(user.role, "value") else str(user.role),
        "name": str(user.full_name),
        "exp": datetime.now(timezone.utc) + timedelta(hours=Config.JWT_ACCESS_TOKEN_EXPIRES_HOURS)
    }
    return jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm="HS256")

def decode_token(token: str):
    try:
        return jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=["HS256"])
    except Exception as e:
        return None

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Authentication required. Missing or malformed Bearer token."}), 401
        
        token = auth_header.split(" ", 1)[1].strip()
        payload = decode_token(token)
        if not payload or "sub" not in payload:
            return jsonify({"error": "Invalid or expired token."}), 401
        
        user_id = int(payload["sub"])
        user = db.session.get(User, user_id)
        if not user or not user.is_active:
            return jsonify({"error": "User account inactive or not found."}), 401
        
        g.current_user = user
        return f(*args, **kwargs)
    return decorated

def require_role(allowed_roles):
    def decorator(f):
        @wraps(f)
        @require_auth
        def decorated(*args, **kwargs):
            user_role = g.current_user.role.value if hasattr(g.current_user.role, "value") else str(g.current_user.role)
            if user_role not in allowed_roles:
                return jsonify({"error": f"Access forbidden. Requires one of roles: {allowed_roles}"}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator

def check_case_access(case, user, for_mutation: bool = False):
    """
    Strict Inspector & Supervisor RBAC access check on an InspectionCase.
    Returns: (error_response, status_code) or (None, None) if permitted.
    """
    if not case:
        return jsonify({"error": "Inspection case not found."}), 404

    user_role = user.role.value if hasattr(user.role, "value") else str(user.role)

    # Admins and Senior Officers have supervisory oversight
    if user_role in ["ADMIN", "SENIOR_OFFICER"]:
        if for_mutation and hasattr(case, "status") and case.status and getattr(case.status, "value", str(case.status)) == "FINALIZED":
            return jsonify({"error": "Cannot mutate a finalized inspection case."}), 400
        return None, None

    # Inspectors can ONLY access their own assigned cases
    if user_role == "INSPECTOR":
        if case.inspector_id and case.inspector_id != user.id:
            return jsonify({"error": f"Access forbidden. Case #{case.case_number} is not assigned to your inspector profile."}), 403

        if for_mutation:
            status_val = getattr(case.status, "value", str(case.status))
            if status_val in ["FINALIZED"]:
                return jsonify({"error": f"Case #{case.case_number} has been finalized by Senior Officer and is strictly read-only."}), 400
            if status_val in ["SUBMITTED", "SENIOR_REVIEW"]:
                return jsonify({"error": f"Case #{case.case_number} has been submitted for supervisory review and cannot be modified until returned."}), 400

        return None, None

    # Company role check (if company portal checks ownership)
    if user_role == "COMPANY":
        if hasattr(user, "company_id") and user.company_id and case.product and case.product.manufacturer_id != user.company_id:
            return jsonify({"error": "Access forbidden. Product does not belong to your registered enterprise."}), 403
        return None, None

    return jsonify({"error": "Access forbidden. Unrecognized role permissions."}), 403

