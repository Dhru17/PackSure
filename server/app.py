import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_migrate import Migrate

from config import Config
from models import db
import models

# Import Blueprints
from blueprints.auth_bp import auth_bp
from blueprints.products_bp import products_bp
from blueprints.inspections_bp import inspections_bp
from blueprints.reviews_bp import reviews_bp
from blueprints.rules_bp import rules_bp
from blueprints.reports_bp import reports_bp
from blueprints.analytics_bp import analytics_bp
from blueprints.admin_bp import admin_bp
from blueprints.company_bp import company_bp

migrate = Migrate()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    CORS(app, resources={r"/api/*": {"origins": "*"}})
    db.init_app(app)
    migrate.init_app(app, db)

    with app.app_context():
        # Ensure new columns exist in sqlite table without requiring full reset
        try:
            from sqlalchemy import text
            with db.engine.connect() as conn:
                existing_cols = [row[1] for row in conn.execute(text("PRAGMA table_info(package_evidences)")).fetchall()]
                if existing_cols:
                    if "predicted_surface" not in existing_cols:
                        conn.execute(text("ALTER TABLE package_evidences ADD COLUMN predicted_surface VARCHAR(50)"))
                    if "is_surface_mismatch" not in existing_cols:
                        conn.execute(text("ALTER TABLE package_evidences ADD COLUMN is_surface_mismatch BOOLEAN DEFAULT 0"))
                    if "surface_mismatch_warning" not in existing_cols:
                        conn.execute(text("ALTER TABLE package_evidences ADD COLUMN surface_mismatch_warning TEXT"))
                    if "features_detected_json" not in existing_cols:
                        conn.execute(text("ALTER TABLE package_evidences ADD COLUMN features_detected_json TEXT"))
                    conn.commit()
        except Exception as _e:
            pass

    # Register Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(products_bp)
    app.register_blueprint(inspections_bp)
    app.register_blueprint(reviews_bp)
    app.register_blueprint(rules_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(company_bp)

    @app.route("/api/media/uploads/<filename>")
    def serve_upload(filename):
        return send_from_directory(Config.UPLOAD_FOLDER, filename)

    @app.route("/api/media/reports/<filename>")
    def serve_report(filename):
        return send_from_directory(Config.REPORTS_FOLDER, filename)

    @app.route("/api/health")
    def health_check():
        return jsonify({
            "status": "healthy",
            "system": "Packsure Legal Metrology Compliance Engine",
            "version": "2.0.0",
            "database": "Connected",
            "roles_supported": ["INSPECTOR", "SENIOR_OFFICER", "ADMIN"]
        })

    # JSON Error Handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource not found or does not exist."}), 404

    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"error": getattr(e, "description", "Bad request.")}), 400

    @app.errorhandler(403)
    def forbidden(e):
        return jsonify({"error": "Access forbidden."}), 403

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "An internal server error occurred."}), 500

    return app

if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        db.create_all()
    print(f"Starting Packsure Server on http://{Config.HOST}:{Config.PORT} ...")
    app.run(host=Config.HOST, port=Config.PORT, debug=True)
