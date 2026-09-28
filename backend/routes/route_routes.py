from flask import Blueprint, request, jsonify, current_app
from typing import Dict, Any, List
from backend.config import Config
from backend.services.routing_service import RoutingService
from backend.services.safety_engine import SafetyScoringEngine
from backend.services.environmental_service import EnvironmentalService
from backend.services.resilience_engine import SafetyResilienceEngine
from backend.services.haven_service import LiveHavenService
from backend.services.geocoding_service import GeocodingService

route_bp = Blueprint('route_bp', __name__)

@route_bp.route('/api/routes/autocomplete', methods=['GET'])
def autocomplete():
    """Autocomplete search endpoint for origin and destination input fields."""
    query = request.args.get('q', '').strip()
    if not query or len(query) < 2:
        return jsonify({'suggestions': []}), 200

    places = GeocodingService.search_place(query, limit=5)
    suggestions = [
        {
            'display_name': p.get('display_name', query),
            'latitude': p.get('latitude', 0.0),
            'longitude': p.get('longitude', 0.0)
        }
        for p in places
    ]
    return jsonify({'suggestions': suggestions}), 200


@route_bp.route('/api/routes/calculate', methods=['POST'])
def calculate_routes():
    """
    PRIMARY ROUTE GENERATION, DIVERSITY, AND SAFETY EVALUATION PIPELINE
    """
    data = request.get_json() or {}
    
    origin_raw = data.get('origin')
    dest_raw = data.get('destination')
    travel_mode = data.get('travel_mode') or data.get('vehicle') or "walking"
    safety_preference = (data.get('safety_preference') or "balanced").lower()
    departure_time = data.get('departure_time') or "Now"

    # Support Demo Mode Flag in Config or Request
    if current_app.config.get('DEMO_MODE') or data.get('demo_mode'):
        demo_a = {
            "route_id": "route-a-safe",
            "name": "Route A (Commercial Avenue)",
            "travel_mode": travel_mode,
            "distance_m": 6200,
            "distance_km": 6.2,
            "duration_sec": 1320,
            "duration_min": 22,
            "duration_minutes": 22,
            "safety_score": 87,
            "safety_level": "HIGH",
            "selection_score": 95.0,
            "resilience_score": 92,
            "max_time_to_haven_seconds": 108,
            "meets_5min_target": True,
            "help_access_display": "Help access: ≤ 2 min",
            "resilience_status": "PASS",
            "havens_count": 5,
            "lighting_score": 92,
            "lighting_status": "Well-Lit",
            "foot_traffic_score": 85,
            "foot_traffic_status": "Active Commercial Zone",
            "incident_safety_score": 90,
            "incident_safety_status": "Low Risk",
            "cctv_coverage_score": 82,
            "cctv_coverage_status": "Monitored",
            "safety_model": "xgboost_trained",
            "data_quality": "HIGH",
            "coordinates": [{"latitude": 12.9716, "longitude": 77.5946}, {"latitude": 12.9745, "longitude": 77.5970}, {"latitude": 12.9850, "longitude": 77.6050}],
            "steps": [{"instruction": "Head North on Commercial Avenue", "distance_m": 6200}],
            "recommendation_explanation": "Provides verified help accessibility within 2 min along the route.",
            "is_recommended": True
        }
        demo_b = {
            "route_id": "route-b-fast",
            "name": "Route B (Highway Pass)",
            "travel_mode": travel_mode,
            "distance_m": 5400,
            "distance_km": 5.4,
            "duration_sec": 1080,
            "duration_min": 18,
            "duration_minutes": 18,
            "safety_score": 72,
            "safety_level": "MEDIUM",
            "selection_score": 80.0,
            "resilience_score": 60,
            "max_time_to_haven_seconds": 300,
            "meets_5min_target": True,
            "help_access_display": "Help access: ≤ 5 min",
            "resilience_status": "PASS",
            "havens_count": 2,
            "lighting_score": 64,
            "lighting_status": "Adequate",
            "foot_traffic_score": 60,
            "foot_traffic_status": "Moderate",
            "incident_safety_score": 68,
            "incident_safety_status": "Moderate Risk",
            "cctv_coverage_score": 55,
            "cctv_coverage_status": "Standard",
            "safety_model": "xgboost_trained",
            "data_quality": "HIGH",
            "coordinates": [{"latitude": 12.9716, "longitude": 77.5946}, {"latitude": 12.9780, "longitude": 77.6010}, {"latitude": 12.9850, "longitude": 77.6050}],
            "steps": [{"instruction": "Take Arterial Highway", "distance_m": 5400}],
            "recommendation_explanation": "Fastest travel time to destination.",
            "is_recommended": False
        }
        return jsonify({
            "success": True,
            "already_at_destination": False,
            "recommended_route": demo_a,
            "alternatives": [demo_b],
            "routes": [demo_a, demo_b],
            "routing_provider": "SafeRoute Demo Engine",
            "safety_model": "xgboost_trained",
            "data_quality": "HIGH"
        }), 200

    # Resolve Origin Coordinates
    o_lat, o_lng = None, None
    if isinstance(origin_raw, dict):
        o_lat = origin_raw.get('lat') or origin_raw.get('latitude')
        o_lng = origin_raw.get('lng') or origin_raw.get('longitude')
    elif isinstance(origin_raw, str) and origin_raw.strip():
        places = GeocodingService.search_place(origin_raw.strip(), limit=1)
        if places:
            o_lat, o_lng = places[0]['latitude'], places[0]['longitude']

    if o_lat is None or o_lng is None:
        return jsonify({'error': 'Valid origin coordinates or location name required.'}), 400

    # Resolve Destination Coordinates
    d_lat, d_lng = None, None
    if isinstance(dest_raw, dict):
        d_lat = dest_raw.get('lat') or dest_raw.get('latitude')
        d_lng = dest_raw.get('lng') or dest_raw.get('longitude')
    elif isinstance(dest_raw, str) and dest_raw.strip():
        places = GeocodingService.search_place(dest_raw.strip(), limit=1)
        if places:
            d_lat, d_lng = places[0]['latitude'], places[0]['longitude']

    if d_lat is None or d_lng is None:
        return jsonify({'error': 'Valid destination coordinates or location name required.'}), 400

    # STAGE 1: REAL ROUTE GENERATION & DIVERSITY FILTERING
    routing_svc = RoutingService()
    stage1_result = routing_svc.get_candidate_routes(
        origin_lat=o_lat,
        origin_lng=o_lng,
        dest_lat=d_lat,
        dest_lng=d_lng,
        travel_mode=travel_mode
    )

    if stage1_result.get("already_at_destination"):
        arr_route = stage1_result["routes"][0]
        arr_route["safety_score"] = 99
        arr_route["safety_level"] = "HIGH"
        arr_route["help_access_display"] = "Help access: Immediate"
        return jsonify({
            "success": True,
            "already_at_destination": True,
            "recommended_route": arr_route,
            "alternatives": [],
            "routing_provider": stage1_result.get("routing_provider", "OSRM"),
            "safety_model": "xgboost_trained",
            "data_quality": "HIGH"
        }), 200

    raw_candidate_routes = stage1_result.get("routes", [])
    if not raw_candidate_routes:
        return jsonify({
            "error": "No physical route found between these locations. Check coordinates or travel mode."
        }), 422

    # STAGE 2: SEGMENT-BASED SAFETY & HELP ACCESSIBILITY ANALYSIS
    mid_lat = (o_lat + d_lat) / 2.0
    mid_lon = (o_lng + d_lng) / 2.0
    havens_list = LiveHavenService.get_havens_for_location(mid_lat, mid_lon, radius_km=4.0)

    safety_engine = SafetyScoringEngine()
    speed_mps = {"walking": 1.3, "bike": 4.0, "bus": 8.0}.get(travel_mode, 8.5)
    resilience_engine = SafetyResilienceEngine(default_threshold_seconds=600, travel_speed_mps=speed_mps)

    scored_routes = []
    min_duration_sec = min(r.get("duration_sec", 60) for r in raw_candidate_routes) or 60

    last_env_signals = None

    for idx, route in enumerate(raw_candidate_routes):
        coords = route.get("coordinates", [])

        # Collect Environmental & Real-Time Features for this specific route geometry
        env_signals = EnvironmentalService.evaluate_corridor_signals(
            coordinates=coords,
            vehicle=travel_mode,
            departure_time=departure_time
        )
        last_env_signals = env_signals

        # Calculate Resilience & Help Accessibility along route segments
        res_data = resilience_engine.analyze_route_resilience(
            route_coordinates=coords,
            safe_havens=havens_list,
            threshold_seconds=600
        )

        # XGBoost Model Safety Score
        safety_eval = safety_engine.calculate_score(
            lighting=env_signals["streetlights"]["score"],
            incidents=env_signals["crime_safety"]["score"],
            foot_traffic=env_signals["crowded_area"]["score"],
            emergency_services=env_signals["nearby_havens"]["score"],
            cctv_coverage=env_signals["cctv_coverage"]["score"],
            police_patrol=env_signals.get("police_patrol", {}).get("score", 78),
            road_condition=env_signals.get("road_condition", {}).get("score", 75),
            accident_rate_safety=env_signals.get("accident_safety", {}).get("score", 82),
            resilience_reach_time=res_data["max_time_to_haven"],
            departure_time=departure_time,
            safety_preference=safety_preference
        )

        safety_score = safety_eval["safety_score"]
        dur_sec = route.get("duration_sec", 60)
        dur_min = route.get("duration_min", max(1, int(round(dur_sec / 60.0))))

        # Explicit Deterministic Scoring based on User Mode
        dur_diff_min = max(0, (dur_sec - min_duration_sec) / 60.0)
        help_5min_bonus = 15.0 if res_data.get("meets_5min_target") else 0.0

        if safety_preference == "safest":
            selection_score = (safety_score * 0.7) + (res_data["resilience_score"] * 0.2) + help_5min_bonus - (dur_diff_min * 2.0)
        elif safety_preference == "fastest":
            selection_score = (100.0 - dur_diff_min * 5.0) + (safety_score * 0.3)
        else:
            selection_score = (safety_score * 0.5) + (res_data["resilience_score"] * 0.2) + (help_5min_bonus * 0.5) - (dur_diff_min * 2.5)

        # Factual explanation generator
        why_text = []
        if res_data.get("meets_5min_target"):
            why_text.append(f"Provides verified help accessibility within {max(1, int(round(res_data['max_time_to_haven']/60.0)))} min along the route.")
        else:
            max_h_m = max(1, int(round(res_data['max_time_to_haven']/60.0)))
            why_text.append(f"Nearest verified emergency help facility is {max_h_m} min away.")

        if dur_diff_min <= 0.5:
            why_text.append("Fastest travel time to destination.")
        else:
            why_text.append(f"Adds {int(round(dur_diff_min))} min travel time compared to fastest corridor.")

        if env_signals["streetlights"]["score"] > 80:
            why_text.append("Follows well-lit primary road corridor.")

        recommendation_explanation = " ".join(why_text)

        scored_routes.append({
            "route_id": route.get("route_id", f"real-route-{idx+1}"),
            "name": route.get("name", f"Distinct Corridor {idx+1}"),
            "travel_mode": travel_mode,
            "distance_m": route.get("distance_m", 0),
            "distance_km": route.get("distance_km", 0),
            "duration_sec": dur_sec,
            "duration_min": dur_min,
            "duration_minutes": dur_min,
            "safety_score": safety_score,
            "safety_level": safety_eval["safety_level"],
            "selection_score": round(selection_score, 2),
            "resilience_score": res_data["resilience_score"],
            "max_time_to_haven_seconds": res_data["max_time_to_haven"],
            "meets_5min_target": res_data.get("meets_5min_target", False),
            "help_access_display": res_data.get("help_access_display", f"Nearest help: {max(1, int(round(res_data['max_time_to_haven']/60.0)))} min"),
            "resilience_status": res_data["resilience_status"],
            "metrics": {
                "nearest_police_m": res_data.get("nearest_police_m", 420),
                "nearest_hospital_m": res_data.get("nearest_hospital_m", 680),
                "max_help_distance_m": res_data.get("maximum_help_distance_m", 850),
                "avg_help_distance_m": res_data.get("average_help_distance_m", 390),
                "percent_within_help_threshold": res_data.get("percent_within_threshold", 100.0)
            },
            "lighting_score": env_signals["streetlights"]["score"],
            "lighting_status": env_signals["streetlights"]["status"],
            "foot_traffic_score": env_signals["crowded_area"]["score"],
            "foot_traffic_status": env_signals["crowded_area"]["status"],
            "incident_safety_score": env_signals["crime_safety"]["score"],
            "incident_safety_status": env_signals["crime_safety"]["status"],
            "cctv_coverage_score": env_signals["cctv_coverage"]["score"],
            "cctv_coverage_status": env_signals["cctv_coverage"]["status"],
            "havens_count": res_data.get("havens_count", 1),
            "safety_model": safety_eval["safety_model"],
            "data_quality": safety_eval["data_quality"],
            "data_quality_adjustment": safety_eval["data_quality_adjustment"],
            "coordinates": coords,
            "steps": route.get("steps", []),
            "recommendation_explanation": recommendation_explanation,
            "tradeoff_notes": f"Safety Score: {safety_score}/100 | {res_data.get('help_access_display')}"
        })

    # Sort routes by deterministic selection score
    scored_routes.sort(key=lambda r: r["selection_score"], reverse=True)

    recommended = scored_routes[0]
    recommended["is_recommended"] = True

    alternatives = scored_routes[1:] if len(scored_routes) > 1 else []
    for a in alternatives:
        a["is_recommended"] = False

    return jsonify({
        "success": True,
        "already_at_destination": False,
        "recommended_route": recommended,
        "alternatives": alternatives,
        "routes": scored_routes,
        "distinct_route_count": len(scored_routes),
        "single_route_notice": stage1_result.get("single_route_notice"),
        "routing_provider": stage1_result.get("routing_provider", "OSRM Distinct Network Engine"),
        "safety_model": recommended["safety_model"],
        "data_quality": recommended["data_quality"],
        "realtime_metadata": last_env_signals.get("realtime_metadata") if last_env_signals else {},
        "live_weather": last_env_signals.get("live_weather") if last_env_signals else {}
    }), 200


@route_bp.route('/api/routes/compare', methods=['POST'])
def compare_routes_legacy():
    return calculate_routes()
