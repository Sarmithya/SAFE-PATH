from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from backend.utils.geo_helper import haversine_distance_meters
from backend.models.models import SafeHaven, User, EmergencyContact

class EmergencyService:
    """
    Emergency Assistance Service.
    Determines the nearest safe haven in real-time and coordinates
    simulated alerts, dispatch requests, and location sharing.
    """

    TRAVEL_SPEED_MPS = 1.3 # Pedestrian running/emergency pace

    @staticmethod
    def get_nearest_safe_haven(
        current_lat: float,
        current_lon: float,
        safe_havens: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Finds the closest verified safe haven to the current GPS location
        and computes estimated travel time.
        """
        if safe_havens is None:
            from backend.services.haven_service import LiveHavenService
            safe_havens = LiveHavenService.get_havens_for_location(
                current_lat, current_lon, radius_km=5.0
            )
            if not safe_havens:
                db_havens = SafeHaven.query.all()
                safe_havens = [h.to_dict() for h in db_havens]

        if not safe_havens:
            return {
                "haven": None,
                "distance_meters": 0,
                "estimated_time_seconds": 0,
                "formatted_time": "No nearby haven located",
                "message": "No verified safe havens found in immediate vicinity."
            }

        closest_haven = None
        min_distance = float('inf')

        for haven in safe_havens:
            dist = haversine_distance_meters(
                current_lat, current_lon,
                haven['latitude'], haven['longitude']
            )
            if dist < min_distance:
                min_distance = dist
                closest_haven = haven

        time_seconds = int(round(min_distance / EmergencyService.TRAVEL_SPEED_MPS))
        time_minutes = round(time_seconds / 60.0, 1)

        formatted_time = f"{time_seconds} seconds" if time_seconds < 120 else f"{time_minutes} minutes"

        return {
            "haven": closest_haven,
            "distance_meters": int(round(min_distance)),
            "estimated_time_seconds": time_seconds,
            "formatted_time": formatted_time,
            "status": "LOCATED",
            "disclaimer": "Time is an estimated walking/transit model, not guaranteed."
        }

    @staticmethod
    def simulate_location_share(
        user_name: str,
        current_lat: float,
        current_lon: float,
        destination: str,
        nearest_haven_name: str,
        contacts: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Generates simulated emergency SMS/WhatsApp dispatch payloads.
        Requires explicit user confirmation before action.
        """
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        map_link = f"https://maps.google.com/?q={current_lat},{current_lon}"
        
        message_body = (
            f"🚨 SafeRoute Safety Alert from {user_name}:\n"
            f"I am sharing my live location during my trip to '{destination}'.\n"
            f"Current GPS: {current_lat:.5f}, {current_lon:.5f}\n"
            f"Map: {map_link}\n"
            f"Nearest Safe Haven: {nearest_haven_name}\n"
            f"Time: {timestamp}"
        )

        simulated_deliveries = []
        for contact in contacts:
            simulated_deliveries.append({
                "recipient_name": contact.get("name"),
                "phone": contact.get("phone"),
                "status": "SIMULATED_SENT",
                "channel": "SMS / App Notification"
            })

        return {
            "success": True,
            "simulated": True,
            "message_body": message_body,
            "timestamp": timestamp,
            "recipients_count": len(simulated_deliveries),
            "deliveries": simulated_deliveries
        }
