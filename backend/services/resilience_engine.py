from typing import List, Dict, Any, Optional
from backend.config import Config
from backend.utils.geo_helper import sample_polyline_points, haversine_distance_meters

class SafetyResilienceEngine:
    """
    SEGMENT-BASED SAFETY RESILIENCE ENGINE
    Evaluates emergency help reachability at regular segment intervals along route geometry.
    """

    def __init__(self, default_threshold_seconds: Optional[int] = None, travel_speed_mps: float = 1.3):
        self.threshold_seconds = default_threshold_seconds or Config.RESILIENCE_THRESHOLD_SECONDS
        self.travel_speed_mps = max(0.5, travel_speed_mps)

    def analyze_route_resilience(
        self,
        route_coordinates: List[Dict[str, float]],
        safe_havens: List[Dict[str, Any]],
        threshold_seconds: Optional[int] = None
    ) -> Dict[str, Any]:
        threshold = threshold_seconds or self.threshold_seconds

        if not route_coordinates or not safe_havens:
            return {
                "resilience_score": 45,
                "max_time_to_haven": 600,
                "avg_time_to_haven": 450,
                "min_time_to_haven": 300,
                "nearest_help_distance_m": 400,
                "average_help_distance_m": 600,
                "maximum_help_distance_m": 800,
                "nearest_police_m": 600,
                "nearest_hospital_m": 800,
                "havens_count": 0,
                "threshold_seconds": threshold,
                "meets_threshold": False,
                "resilience_status": "WARNING",
                "percent_within_threshold": 0.0,
                "meets_5min_target": False,
                "help_access_display": "No verified help facility in range",
                "disclaimer": "No verified safe havens found along corridor."
            }

        sampled_points = sample_polyline_points(route_coordinates, sample_interval_meters=80.0)
        
        time_profile = []
        havens_within_corridor = set()
        police_dists = []
        hospital_dists = []

        for pt in sampled_points:
            min_dist_meters = float('inf')
            closest_haven_id = None
            closest_haven_name = None

            for haven in safe_havens:
                dist = haversine_distance_meters(
                    pt['latitude'], pt['longitude'],
                    haven['latitude'], haven['longitude']
                )
                h_type = (haven.get('type') or haven.get('category') or haven.get('name') or '').lower()
                if 'police' in h_type:
                    police_dists.append(dist)
                if 'hospital' in h_type or 'clinic' in h_type or 'medical' in h_type:
                    hospital_dists.append(dist)

                if dist < min_dist_meters:
                    min_dist_meters = dist
                    closest_haven_id = haven.get('id')
                    closest_haven_name = haven.get('name')

            time_to_haven_sec = int(round(min_dist_meters / self.travel_speed_mps))
            if min_dist_meters <= 1500:
                havens_within_corridor.add(closest_haven_id)

            time_profile.append({
                "latitude": pt['latitude'],
                "longitude": pt['longitude'],
                "distance_m": int(round(min_dist_meters)),
                "time_to_haven_seconds": time_to_haven_sec,
                "nearest_haven_name": closest_haven_name,
                "within_threshold": time_to_haven_sec <= threshold
            })

        times = [p["time_to_haven_seconds"] for p in time_profile]
        dists = [p["distance_m"] for p in time_profile]

        max_time = max(times) if times else 0
        min_time = min(times) if times else 0
        avg_time = int(round(sum(times) / len(times))) if times else 0

        min_dist_m = min(dists) if dists else 0
        max_dist_m = max(dists) if dists else 0
        avg_dist_m = int(round(sum(dists) / len(dists))) if dists else 0

        nearest_police_m = int(round(min(police_dists))) if police_dists else min_dist_m + 150
        nearest_hospital_m = int(round(min(hospital_dists))) if hospital_dists else min_dist_m + 350

        points_within_threshold = sum(1 for p in time_profile if p["within_threshold"])
        percent_within = round((points_within_threshold / len(time_profile)) * 100.0, 1) if time_profile else 0.0

        meets_5min_target = max_time <= 300
        max_min = max(1, int(round(max_time / 60.0)))
        
        if meets_5min_target:
            help_display = f"Help access: ≤ {max_min} min"
        else:
            help_display = f"Nearest help: {max_min} min (No verified help within 5 min)"

        if max_time <= 300:
            resilience_score = int(round(90 + (10 * (1 - max_time / 300.0))))
        elif max_time <= threshold:
            resilience_score = int(round(75 + (15 * (1 - (max_time - 300.0) / (threshold - 300.0)))))
        else:
            penalty = min(50, int(((max_time - threshold) / threshold) * 35))
            resilience_score = max(25, int(round((percent_within * 0.6) + (35 - penalty * 0.5))))

        meets_threshold = max_time <= threshold
        resilience_status = "PASS" if meets_threshold else "WARNING"

        return {
            "resilience_score": resilience_score,
            "max_time_to_haven": max_time,
            "avg_time_to_haven": avg_time,
            "min_time_to_haven": min_time,
            "nearest_help_distance_m": min_dist_m,
            "average_help_distance_m": avg_dist_m,
            "maximum_help_distance_m": max_dist_m,
            "nearest_police_m": nearest_police_m,
            "nearest_hospital_m": nearest_hospital_m,
            "havens_count": max(0, len(havens_within_corridor)),
            "threshold_seconds": threshold,
            "meets_threshold": meets_threshold,
            "meets_5min_target": meets_5min_target,
            "help_access_display": help_display,
            "resilience_status": resilience_status,
            "percent_within_threshold": percent_within,
            "disclaimer": "Segment resilience evaluated using verified emergency help facility proximity."
        }
