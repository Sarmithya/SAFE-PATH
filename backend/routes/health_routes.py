from flask import Blueprint, jsonify, current_app

health_bp = Blueprint('health', __name__)

@health_bp.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'SafeRoute Backend API',
        'version': '1.0.0',
        'tagline': 'Navigate Safer, Not Just Faster.',
        'demo_mode': current_app.config.get('DEMO_MODE', True),
        'resilience_threshold_seconds': current_app.config.get('RESILIENCE_THRESHOLD_SECONDS', 120),
        'deviation_threshold_meters': current_app.config.get('DEVIATION_THRESHOLD_METERS', 50.0),
        'disclaimer': 'SafeRoute scores and time estimates are advisory models and do not represent personal safety guarantees.'
    }), 200
