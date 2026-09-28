from flask import Blueprint, request, jsonify
from backend.services.geocoding_service import GeocodingService

geocoding_bp = Blueprint('geocoding', __name__)

@geocoding_bp.route('/api/geocode', methods=['GET'])
def search_places():
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify({'success': True, 'results': []}), 200

    results = GeocodingService.search_place(query)
    return jsonify({
        'success': True,
        'query': query,
        'results': results
    }), 200
