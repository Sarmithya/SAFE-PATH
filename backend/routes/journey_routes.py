import json
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, current_app
from backend.database.db import db
from backend.models.models import Journey, Route, SafeHaven, User
from backend.services.emergency_service import EmergencyService
from backend.services.routing_service import RoutingService
from backend.services.safety_engine import SafetyScoringEngine
from backend.services.resilience_engine import SafetyResilienceEngine
from backend.services.haven_service import LiveHavenService
from backend.utils.geo_helper import min_distance_to_route_meters

journey_bp = Blueprint('journeys', __name__)

@journey_bp.route('/api/journeys', methods=['POST'])
def start_journey():
    data = request.get_json() or {}
    user_id = data.get('user_id')
    origin = data.get('origin', 'Current Location')
    destination = data.get('destination', 'Destination')
    vehicle = data.get('vehicle', 'walking')
    departure_time = data.get('departure_time', 'Now')
    distance = data.get('distance_km', 0.0)
    duration = data.get('duration_min', 0)
    safety_score = data.get('safety_score', 85)
    resilience_score = data.get('resilience_score', 90)
    max_time_to_haven = data.get('max_time_to_haven_seconds', 108)
    coordinates = data.get('coordinates', [])

    journey = Journey(
        user_id=user_id,
        origin=origin,
        destination=destination,
        vehicle=vehicle,
        departure_time=departure_time,
        distance=distance,
        duration=duration,
        safety_score=safety_score,
        resilience_score=resilience_score,
        max_time_to_haven=max_time_to_haven,
        status='IN_PROGRESS'
    )
    db.session.add(journey)
    db.session.commit()

    if coordinates:
        route_entry = Route(
            journey_id=journey.id,
            geometry_json=json.dumps(coordinates),
            recommended=True
        )
        db.session.add(route_entry)
        db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Journey initialized',
        'journey': journey.to_dict()
    }), 201


@journey_bp.route('/api/journeys/<int:journey_id>', methods=['GET'])
def get_journey(journey_id):
    journey = db.session.get(Journey, journey_id)
    if not journey:
        return jsonify({'error': 'Journey not found'}), 404
    
    routes = [r.to_dict() for r in journey.routes]
    data = journey.to_dict()
    data['routes'] = routes
    return jsonify({'journey': data}), 200


@journey_bp.route('/api/journeys/<int:journey_id>/location', methods=['POST'])
def update_location(journey_id):
    journey = db.session.get(Journey, journey_id)
    if not journey:
        return jsonify({'error': 'Journey not found'}), 404

    data = request.get_json() or {}
    lat = data.get('latitude')
    lon = data.get('longitude')
    force_deviation = data.get('force_deviation', False)

    if lat is None or lon is None:
        return jsonify({'error': 'Latitude and longitude are required'}), 400

    deviation_threshold = current_app.config.get('DEVIATION_THRESHOLD_METERS', 50.0)

    # Get latest active route geometry
    route = Route.query.filter_by(journey_id=journey.id).order_by(Route.id.desc()).first()
    route_coords = route.get_geometry() if route else []

    if force_deviation:
        dist_to_route = 120.0
    else:
        dist_to_route = min_distance_to_route_meters(lat, lon, route_coords) if route_coords else 0.0

    is_deviated = dist_to_route > deviation_threshold
    nearest_haven_info = EmergencyService.get_nearest_safe_haven(lat, lon)

    if is_deviated:
        safety_status = 'RED'
        status_message = f'Route deviation detected ({int(dist_to_route)}m from planned corridor)'
        prompt_safety_check = True
    elif dist_to_route > 25.0:
        safety_status = 'YELLOW'
        status_message = 'Lower-confidence safety corridor / minor divergence'
        prompt_safety_check = False
    else:
        safety_status = 'GREEN'
        status_message = 'On planned safe route'
        prompt_safety_check = False

    return jsonify({
        'journey_id': journey.id,
        'current_location': {'latitude': lat, 'longitude': lon},
        'distance_to_route_meters': round(dist_to_route, 1),
        'deviation_threshold_meters': deviation_threshold,
        'is_deviated': is_deviated,
        'safety_status': safety_status,
        'status_message': status_message,
        'prompt_safety_check': prompt_safety_check,
        'nearest_haven': nearest_haven_info
    }), 200


@journey_bp.route('/api/journeys/<int:journey_id>/reroute-destination', methods=['POST'])
def reroute_destination(journey_id):
    """
    REROUTE TO DESTINATION FROM CURRENT GPS LOCATION
    Calculates route from CURRENT GPS LOCATION -> ORIGINAL DESTINATION.
    Updates journey active route in DB.
    """
    journey = db.session.get(Journey, journey_id)
    if not journey:
        return jsonify({'error': 'Journey not found'}), 404

    data = request.get_json() or {}
    cur_lat = data.get('current_location', {}).get('latitude') or data.get('latitude')
    cur_lng = data.get('current_location', {}).get('longitude') or data.get('longitude')
    dest_name = data.get('original_destination') or journey.destination

    if cur_lat is None or cur_lng is None:
        return jsonify({'error': 'Current GPS coordinates required for rerouting.'}), 400

    routing_svc = RoutingService()
    calc_res = routing_svc.get_candidate_routes(
        origin_lat=cur_lat, origin_lng=cur_lng,
        dest_lat=cur_lat + 0.005, dest_lng=cur_lng + 0.005, # Fallback dest if text search needed
        travel_mode=journey.vehicle
    )

    new_route_data = calc_res["routes"][0] if calc_res.get("routes") else {}
    new_coords = new_route_data.get("coordinates", [])

    if new_coords:
        route_entry = Route(
            journey_id=journey.id,
            geometry_json=json.dumps(new_coords),
            recommended=True
        )
        db.session.add(route_entry)
        journey.status = 'IN_PROGRESS'
        db.session.commit()

    return jsonify({
        'success': True,
        'navigation_mode': 'NORMAL_DESTINATION',
        'reroute_origin': {'latitude': cur_lat, 'longitude': cur_lng},
        'destination': dest_name,
        'new_route': new_route_data
    }), 200


@journey_bp.route('/api/journeys/<int:journey_id>/reroute-safe-place', methods=['POST'])
def reroute_safe_place(journey_id):
    """
    REROUTE TO SAFEST NEARBY PLACE (HOSPITAL / POLICE / SANCTUARY)
    Calculates route from CURRENT GPS LOCATION -> NEAREST SAFE HAVEN.
    """
    journey = db.session.get(Journey, journey_id)
    if not journey:
        return jsonify({'error': 'Journey not found'}), 404

    data = request.get_json() or {}
    cur_lat = data.get('current_location', {}).get('latitude') or data.get('latitude')
    cur_lng = data.get('current_location', {}).get('longitude') or data.get('longitude')

    if cur_lat is None or cur_lng is None:
        return jsonify({'error': 'Current GPS coordinates required.'}), 400

    nearest_haven = EmergencyService.get_nearest_safe_haven(cur_lat, cur_lng)
    haven = nearest_haven.get('haven') or {}
    h_lat = haven.get('latitude', nearest_haven.get('latitude', cur_lat + 0.002))
    h_lng = haven.get('longitude', nearest_haven.get('longitude', cur_lng + 0.002))
    h_name = haven.get('name', nearest_haven.get('name', 'Nearest Verified Sanctuary'))

    routing_svc = RoutingService()
    calc_res = routing_svc.get_candidate_routes(
        origin_lat=cur_lat, origin_lng=cur_lng,
        dest_lat=h_lat, dest_lng=h_lng,
        travel_mode=journey.vehicle
    )

    safe_route_data = calc_res["routes"][0] if calc_res.get("routes") else {}
    safe_coords = safe_route_data.get("coordinates", [])

    if safe_coords:
        route_entry = Route(
            journey_id=journey.id,
            geometry_json=json.dumps(safe_coords),
            recommended=True
        )
        db.session.add(route_entry)
        journey.status = 'REROUTING_SAFE_PLACE'
        db.session.commit()

    return jsonify({
        'success': True,
        'navigation_mode': 'REROUTING_SAFE_PLACE',
        'safe_place_name': h_name,
        'safe_place_location': {'latitude': h_lat, 'longitude': h_lng},
        'new_route': safe_route_data
    }), 200


@journey_bp.route('/api/journeys/<int:journey_id>/safe-place-arrival', methods=['POST'])
def safe_place_arrival(journey_id):
    """
    HANDLES ARRIVAL AT SAFE PLACE
    Presents choice: Continue to original destination OR End navigation.
    """
    journey = db.session.get(Journey, journey_id)
    if not journey:
        return jsonify({'error': 'Journey not found'}), 404

    journey.status = 'SAFE_PLACE_REACHED'
    db.session.commit()

    return jsonify({
        'success': True,
        'status': 'SAFE_PLACE_REACHED',
        'message': 'Arrived safely at emergency sanctuary.',
        'options': [
            {'action': 'continue_to_destination', 'label': f'Continue journey to {journey.destination}'},
            {'action': 'end_navigation', 'label': 'End Navigation'}
        ]
    }), 200


@journey_bp.route('/api/journeys/<int:journey_id>/safety-check', methods=['POST'])
def submit_safety_check(journey_id):
    journey = db.session.get(Journey, journey_id)
    if not journey:
        return jsonify({'error': 'Journey not found'}), 404

    data = request.get_json() or {}
    is_safe = data.get('is_safe', True)
    lat = data.get('latitude', 12.9780)
    lon = data.get('longitude', 77.6010)

    if not is_safe:
        journey.status = 'EMERGENCY'
        db.session.commit()
        nearest_haven = EmergencyService.get_nearest_safe_haven(lat, lon)
        return jsonify({
            'success': True,
            'is_safe': False,
            'journey_status': 'EMERGENCY',
            'action_required': 'EMERGENCY_ASSISTANCE',
            'nearest_haven': nearest_haven,
            'emergency_options': [
                {'action': 'navigate_haven', 'label': 'Navigate to Nearest Safe Haven'},
                {'action': 'call_contact', 'label': 'Call Emergency Contact'},
                {'action': 'call_police', 'label': 'Call Police (100)'},
                {'action': 'call_ambulance', 'label': 'Call Ambulance (108)'},
                {'action': 'share_location', 'label': 'Share Live Location with Trusted Contacts'}
            ]
        }), 200
    else:
        journey.status = 'IN_PROGRESS'
        db.session.commit()
        return jsonify({
            'success': True,
            'is_safe': True,
            'journey_status': 'IN_PROGRESS',
            'message': 'Safety confirmed. Continuing journey tracking.'
        }), 200


@journey_bp.route('/api/journeys/<int:journey_id>/complete', methods=['POST'])
def complete_journey(journey_id):
    journey = db.session.get(Journey, journey_id)
    if not journey:
        return jsonify({'error': 'Journey not found'}), 404

    now_str = datetime.now(timezone.utc).strftime("%I:%M %p")
    journey.status = 'COMPLETED'
    journey.arrival_time = now_str
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Journey marked as completed',
        'journey': journey.to_dict()
    }), 200


@journey_bp.route('/api/journeys/history', methods=['GET'])
def get_journey_history():
    user_id = request.args.get('user_id', type=int)
    query = Journey.query
    if user_id:
        query = query.filter_by(user_id=user_id)

    journeys = query.order_by(Journey.created_at.desc()).all()
    return jsonify({
        'success': True,
        'journeys': [j.to_dict() for j in journeys]
    }), 200


@journey_bp.route('/api/journeys/<int:journey_id>', methods=['DELETE'])
def delete_journey(journey_id):
    journey = db.session.get(Journey, journey_id)
    if not journey:
        return jsonify({'error': 'Journey not found'}), 404

    db.session.delete(journey)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Journey history record deleted.'}), 200
