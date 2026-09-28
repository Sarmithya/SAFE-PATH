import os
import sys

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from flask import Flask, jsonify, render_template
from flask_cors import CORS
from backend.config import Config
from backend.database.db import db
from backend.database.seed import seed_database
from backend.routes.health_routes import health_bp
from backend.routes.auth_routes import auth_bp
from backend.routes.route_routes import route_bp
from backend.routes.haven_routes import haven_bp
from backend.routes.journey_routes import journey_bp
from backend.routes.emergency_routes import emergency_bp
from backend.routes.assistant_routes import assistant_bp
from backend.routes.geocoding_routes import geocoding_bp
from backend.routes.settings_routes import settings_bp
from backend.routes.dataset_routes import dataset_bp
from backend.routes.feedback_routes import feedback_bp
from backend.routes.track_routes import track_bp

def create_app(config_class=Config):
    app = Flask(__name__, template_folder='templates', static_folder='static')
    app.config.from_object(config_class)

    # Enable CORS for mobile & web clients
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Initialize Database
    db.init_app(app)

    # Register Blueprints
    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(route_bp)
    app.register_blueprint(haven_bp)
    app.register_blueprint(journey_bp)
    app.register_blueprint(emergency_bp)
    app.register_blueprint(assistant_bp)
    app.register_blueprint(geocoding_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(dataset_bp)
    app.register_blueprint(feedback_bp)
    app.register_blueprint(track_bp)

    # Root Web Route: Real-Time Mobile & Web Application
    @app.route('/')
    def index():
        return render_template('index.html')

    # Global Error Handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Resource not found', 'status': 404}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({'error': 'Internal server error', 'status': 500}), 500

    with app.app_context():
        db.create_all()
        seed_database()

    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.getenv('PORT', 5000))
    print(f"==================================================")
    print(f" SafeRoute Real-Time Platform: http://127.0.0.1:{port}")
    print(f" Tagline: 'Navigate Safer, Not Just Faster.'")
    print(f" Live Services: OSRM Routing + Nominatim + OpenAI + Twilio")
    print(f"==================================================")
    app.run(host='0.0.0.0', port=port, debug=True)
