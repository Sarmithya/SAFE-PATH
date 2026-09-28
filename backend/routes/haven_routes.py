from flask import Blueprint, request, jsonify
from backend.models.models import SafeHaven
from backend.utils.geo_helper import haversine_distance_km
from backend.services.haven_service import LiveHavenService

haven_bp = Blueprint('havens', __name__)

@haven_bp.route('/api/havens/nearby', methods=['GET'])
def get_nearby_havens():
    lat = request.args.get('lat', type=float)
    lon = request.args.get('lon', type=float)
    radius_km = request.args.get('radius_km', default=5.0, type=float)
    haven_type = request.args.get('type')

    if lat is not None and lon is not None:
        results = LiveHavenService.get_havens_for_location(lat, lon, radius_km=radius_km)
        if haven_type:
            results = [h for h in results if h.get('type') == haven_type]
        return jsonify({
            'success': True,
            'count': len(results),
            'havens': results
        }), 200

    query = SafeHaven.query
    if haven_type:
        query = query.filter_by(type=haven_type)
    results = [h.to_dict() for h in query.all()]
    return jsonify({
        'success': True,
        'count': len(results),
        'havens': results
    }), 200
