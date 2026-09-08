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
