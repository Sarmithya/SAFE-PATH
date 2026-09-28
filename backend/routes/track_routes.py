from flask import Blueprint, render_template, request, jsonify

track_bp = Blueprint('track', __name__)

# Simple in-memory store for live locations
_LIVE_LOCATIONS = {}

@track_bp.route('/track/<token>')
def track_user(token):
    return render_template('track.html', token=token)

@track_bp.route('/api/journey/<token>/location', methods=['GET', 'POST'])
def handle_location(token):
    if request.method == 'POST':
        data = request.get_json() or {}
        lat = data.get('lat')
        lon = data.get('lon')
        try:
            latitude = float(lat)
            longitude = float(lon)
        except (TypeError, ValueError):
            return jsonify({'success': False, 'error': 'Missing or invalid lat/lon'}), 400

        if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
            return jsonify({'success': False, 'error': 'Invalid coordinate range'}), 400

        _LIVE_LOCATIONS[token] = {'lat': latitude, 'lon': longitude}
        return jsonify({'success': True}), 200
    else:
        loc = _LIVE_LOCATIONS.get(token)
        if loc:
            return jsonify({'success': True, 'lat': loc['lat'], 'lon': loc['lon']}), 200
        return jsonify({'success': False, 'error': 'Not found'}), 404
