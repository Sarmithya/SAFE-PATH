import datetime
from typing import Dict, Any, List, Optional
from backend.config import Config
from backend.services.xgboost_model import get_xgboost_model

class SafetyScoringEngine:
    """
    Modular XGBoost Safety Scoring Engine.
    Evaluates multi-factor safety signals normalized to 0-100 scale using XGBoost Regressor ML.
    """

    def __init__(self, weights: Optional[Dict[str, float]] = None):
        self.weights = weights or Config.SAFETY_WEIGHTS.copy()

    def get_time_multiplier(self, departure_time_str: Optional[str] = None) -> float:
        """Calculate time-dependent risk factor."""
        if not departure_time_str:
            hour = datetime.datetime.now().hour
        else:
            try:
                time_str = departure_time_str.strip()
                if "AM" in time_str.upper() or "PM" in time_str.upper():
                    dt = datetime.datetime.strptime(time_str, "%I:%M %p")
                else:
                    dt = datetime.datetime.strptime(time_str.split()[0], "%H:%M")
                hour = dt.hour
            except Exception:
                hour = datetime.datetime.now().hour

        if 6 <= hour < 19:
            return 1.0
        elif 19 <= hour < 22:
            return 0.95
        elif 22 <= hour < 24 or 0 <= hour < 4:
            return 0.85
        else:
            return 0.90

    def calculate_score(
        self,
        lighting: Optional[float] = None,
        incidents: Optional[float] = None,
        foot_traffic: Optional[float] = None,
        emergency_services: Optional[float] = None,
        cctv_coverage: Optional[float] = None,
        police_patrol: Optional[float] = None,
        road_condition: Optional[float] = None,
        accident_rate_safety: Optional[float] = None,
        resilience_reach_time: Optional[float] = None,
        departure_time: Optional[str] = None,
        safety_preference: str = "balanced"
    ) -> Dict[str, Any]:
        """
        Calculates composite ML safety score using XGBoost Regressor across multi-factor signals.
        """
        is_missing_data = (lighting is None and incidents is None and foot_traffic is None and emergency_services is None)

        norm_lighting = lighting if lighting is not None else 65.0
        norm_incidents = incidents if incidents is not None else 80.0
        norm_foot = foot_traffic if foot_traffic is not None else 70.0
        norm_emergency = emergency_services if emergency_services is not None else 75.0
        norm_cctv = cctv_coverage if cctv_coverage is not None else ((norm_lighting + norm_incidents) / 2.0)
        norm_police = police_patrol if police_patrol is not None else 75.0
        norm_road = road_condition if road_condition is not None else 75.0
        norm_accident = accident_rate_safety if accident_rate_safety is not None else 80.0
        norm_resilience_time = resilience_reach_time if resilience_reach_time is not None else 90.0

        time_multiplier = self.get_time_multiplier(departure_time)

        # Run through XGBoost Model
        xgb_model = get_xgboost_model()
        ml_result = xgb_model.predict_safety({
            'streetlights': norm_lighting,
            'crime_safety': norm_incidents,
            'crowded_area': norm_foot,
            'cctv_coverage': norm_cctv,
            'police_patrol': norm_police,
            'road_condition': norm_road,
            'accident_rate_safety': norm_accident,
            'resilience_reach_time': norm_resilience_time,
            'time_multiplier': time_multiplier
        })

        score = ml_result["safety_score"]

        # Boost score slightly if preference is "safest"
        if safety_preference.lower() == "safest":
            score = int(round(min(99, score * 1.08)))

        confidence_level = "LOW" if is_missing_data else "HIGH"
        confidence_notes = [
            "Lighting data estimated from regional baselines.",
            "Crime incident index estimated from safety models.",
            "Emergency service proximity estimated from static map."
        ] if is_missing_data else []

        return {
            "safety_score": score,
            "safety_level": ml_result.get("safety_level", "HIGH"),
            "safety_model": ml_result.get("safety_model", "xgboost_trained"),
            "data_quality": ml_result.get("data_quality", "HIGH"),
            "data_quality_adjustment": ml_result.get("data_quality_adjustment", 0.0),
            "lighting_score": int(round(norm_lighting)),
            "foot_traffic_score": int(round(norm_foot)),
            "incident_safety_score": int(round(norm_incidents)),
            "emergency_proximity_score": int(round(norm_emergency)),
            "cctv_coverage_score": int(round(norm_cctv)),
            "police_patrol_score": int(round(norm_police)),
            "road_condition_score": int(round(norm_road)),
            "accident_rate_score": int(round(norm_accident)),
            "time_multiplier": round(time_multiplier, 2),
            "xgboost_feature_importances": ml_result.get("feature_importances", {}),
            "confidence_level": confidence_level,
            "confidence_notes": confidence_notes,
            "disclaimer": "Real-time safety score predicted via trained XGBoost Regressor ML model evaluating streetlights, crime safety, cctv coverage, crowd density, police patrols, and resilience reach time."
        }
