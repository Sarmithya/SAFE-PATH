import os
import math
import requests
from typing import List, Dict, Any, Optional
from backend.config import Config
from backend.utils.geo_helper import haversine_distance_meters

class RoutingService:
    """
    STAGE 1 - REAL ROUTE GENERATION & DIVERSITY FILTER ENGINE
    Connects to real OSRM / Google Maps APIs to discover genuine road network corridors.
    Enforces strict spatial diversity validation so only genuinely distinct road paths
    are presented to the user.
    """

    MANEUVER_MAP = {
        "turn": {"left": "Turn left", "right": "Turn right", "sharp left": "Sharp left", "sharp right": "Sharp right", "slight left": "Bear left", "slight right": "Bear right", "uturn": "Make a U-turn"},
        "new name": {"": "Continue onto"},
        "depart": {"": "Head"},
        "arrive": {"": "Arrive at destination"},
        "merge": {"left": "Merge left", "right": "Merge right", "": "Merge onto"},
        "ramp": {"left": "Take ramp left", "right": "Take ramp right", "": "Take ramp"},
        "fork": {"left": "Keep left at fork", "right": "Keep right at fork", "": "Keep on route"},
        "roundabout": {"": "Enter roundabout"},
        "continue": {"": "Continue onto"}
    }

    def __init__(self, demo_mode: bool = False):
        self.osrm_url = Config.OSRM_BASE_URL
        self.google_key = getattr(Config, "GOOGLE_MAPS_API_KEY", "")
        self.demo_mode = demo_mode

    @staticmethod
    def _build_instruction(step: dict) -> str:
        maneuver = step.get("maneuver", {})
        m_type = (maneuver.get("type") or "").lower()
        m_mod = (maneuver.get("modifier") or "").lower()
        road_name = step.get("name") or step.get("ref") or ""

        type_map = RoutingService.MANEUVER_MAP.get(m_type, {})
        action = type_map.get(m_mod) or type_map.get("") or "Proceed along corridor"

        if road_name:
            return f"{action} onto {road_name}"
        return action

    @staticmethod
    def calculate_corridor_overlap(coords1: List[Dict[str, float]], coords2: List[Dict[str, float]], buffer_meters: float = 45.0) -> float:
        """
        Calculates spatial overlap ratio (0.0 to 1.0) between route1 and route2 geometry.
        Returns fraction of coords1 that lie within buffer_meters of any point in coords2.
        """
        if not coords1 or not coords2:
            return 0.0

        # Subsample coords for fast spatial overlap checking
        sample_step1 = max(1, len(coords1) // 30)
        sample_step2 = max(1, len(coords2) // 30)
        
        pts1 = coords1[::sample_step1]
        pts2 = coords2[::sample_step2]

        matched_count = 0
        for p1 in pts1:
            is_near = False
            for p2 in pts2:
                d_m = haversine_distance_meters(p1["latitude"], p1["longitude"], p2["latitude"], p2["longitude"])
                if d_m <= buffer_meters:
                    is_near = True
                    break
            if is_near:
                matched_count += 1

        return matched_count / float(len(pts1)) if pts1 else 0.0

    def get_candidate_routes(
        self,
        origin_lat: float,
        origin_lng: float,
        dest_lat: float,
        dest_lng: float,
        travel_mode: str = "walking"
    ) -> Dict[str, Any]:
        """
        Discovers candidate routes from real road network using OSRM / Google Maps,
        and applies a strict route-diversity filter layer.
        """
        dist_m = haversine_distance_meters(origin_lat, origin_lng, dest_lat, dest_lng)
        
        if dist_m < Config.ARRIVAL_THRESHOLD_METERS_MIN:
            return {
                "success": True,
                "already_at_destination": True,
                "routing_provider": "OSRM / Real-Time Geodesic",
                "routes": [{
                    "route_id": "direct-arrival",
                    "name": "Already At Destination Corridor",
                    "distance_m": round(dist_m, 1),
                    "duration_sec": 0,
                    "coordinates": [
                        {"latitude": origin_lat, "longitude": origin_lng},
                        {"latitude": dest_lat, "longitude": dest_lng}
                    ],
                    "steps": ["You are already at your destination."]
                }]
            }

        # 1. Google Maps API if Key Provided
        if self.google_key:
            g_res = self._query_google_directions(origin_lat, origin_lng, dest_lat, dest_lng, travel_mode)
            if g_res and g_res.get("routes"):
                return g_res

        # 2. Query OSRM Engine
        mode_str = (travel_mode or "").lower()
        if mode_str in ("walking", "foot"):
            profile = "foot"
        elif mode_str in ("bike", "cycling"):
            profile = "bike"
        else:
            profile = "driving"

        raw_candidates = []

        # A. Direct Primary OSRM Query requesting alternatives
        url_primary = (
            f"{self.osrm_url}/{profile}/{origin_lng},{origin_lat};{dest_lng},{dest_lat}"
            f"?overview=full&geometries=geojson&alternatives=3&steps=true"
        )

        try:
            resp = requests.get(url_primary, timeout=4)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("code") == "Ok" and data.get("routes"):
                    for idx, r_data in enumerate(data["routes"]):
                        label = "Main Road Corridor" if idx == 0 else f"Alternative Road Path {idx+1}"
                        parsed = self._parse_route_object(r_data, travel_mode, label, idx+1)
                        if parsed:
                            raw_candidates.append(parsed)
        except Exception as e:
            print(f"[RoutingService] Primary OSRM query note: {e}")

        # B. Exploration of parallel road corridors via lateral waypoints
        if len(raw_candidates) < 3:
            d_lat = dest_lat - origin_lat
            d_lng = dest_lng - origin_lng
            dist_deg = math.sqrt(d_lat**2 + d_lng**2) or 0.001
            
            # Scaled lateral offsets (~350m to ~800m)
            offset_mag = max(0.002, min(0.008, dist_deg * 0.35))
            perp_lat = -d_lng / dist_deg
            perp_lng = d_lat / dist_deg

            waypoint_offsets = [
                (0.35, perp_lat * offset_mag, perp_lng * offset_mag, "Parallel Bypass Corridor"),
                (0.65, -perp_lat * offset_mag, -perp_lng * offset_mag, "Secondary Transit Pass"),
                (0.50, perp_lat * (offset_mag * 1.4), perp_lng * (offset_mag * 1.4), "Outer Ring Corridor"),
                (0.50, -perp_lat * (offset_mag * 1.4), -perp_lng * (offset_mag * 1.4), "Inner District Pass")
            ]

            for fraction, off_lat, off_lng, label_name in waypoint_offsets:
                if len(raw_candidates) >= 5:
                    break

                via_lat = origin_lat + d_lat * fraction + off_lat
                via_lng = origin_lng + d_lng * fraction + off_lng

                url_via = (
                    f"{self.osrm_url}/{profile}/{origin_lng},{origin_lat};{via_lng},{via_lat};{dest_lng},{dest_lat}"
                    f"?overview=full&geometries=geojson&steps=true"
                )
                try:
                    r_via = requests.get(url_via, timeout=3)
                    if r_via.status_code == 200:
                        d_via = r_via.json()
                        if d_via.get("code") == "Ok" and d_via.get("routes"):
                            parsed = self._parse_route_object(d_via["routes"][0], travel_mode, label_name, len(raw_candidates)+1)
                            if parsed:
                                raw_candidates.append(parsed)
                except Exception:
                    pass

        # C. ROUTE DIVERSITY VALIDATION LAYER
        # Filter candidate routes so that no two routes share > 65% of their spatial corridor.
        distinct_routes = []
        OVERLAP_THRESHOLD = 0.65  # Max 65% shared corridor allowed

        for cand in raw_candidates:
            cand_coords = cand.get("coordinates", [])
            if not cand_coords:
                continue

            is_duplicate = False
            for existing in distinct_routes:
                ex_coords = existing.get("coordinates", [])
                overlap = self.calculate_corridor_overlap(cand_coords, ex_coords, buffer_meters=45.0)
                if overlap > OVERLAP_THRESHOLD:
                    is_duplicate = True
                    break

            if not is_duplicate:
                cand["route_id"] = f"real-route-{len(distinct_routes)+1}"
                distinct_routes.append(cand)
                if len(distinct_routes) >= 3:
                    break

        if distinct_routes:
            # Assign semantic corridor names to distinct routes
            names = ["Safety Priority Corridor", "Fastest Arterial Highway", "Alternative District Pass"]
            for idx, r in enumerate(distinct_routes):
                r["name"] = names[idx] if idx < len(names) else f"Distinct Corridor {idx+1}"

            return {
                "success": True,
                "already_at_destination": False,
                "routing_provider": "OSRM Distinct Network Engine",
                "routes": distinct_routes,
                "distinct_route_count": len(distinct_routes),
                "single_route_notice": None if len(distinct_routes) > 1 else "Only one sufficiently distinct route was found on the road network."
            }

        # Offline Fallback Geometry if network query fails
        fallback_coord = [
            {"latitude": origin_lat, "longitude": origin_lng},
            {"latitude": (origin_lat + dest_lat) / 2.0 + 0.001, "longitude": (origin_lng + dest_lng) / 2.0},
            {"latitude": dest_lat, "longitude": dest_lng}
        ]
        return {
            "success": True,
            "already_at_destination": False,
            "routing_provider": "OSRM (Offline Fallback)",
            "routes": [{
                "route_id": "fallback-corridor-1",
                "name": "Direct Road Corridor (Offline Fallback)",
                "travel_mode": travel_mode,
                "distance_m": round(dist_m, 1),
                "distance_km": round(dist_m / 1000.0, 2),
                "duration_sec": max(30, int(dist_m / 1.3)),
                "duration_min": max(1, int(dist_m / 1.3 / 60.0)),
                "coordinates": fallback_coord,
                "steps": [{"instruction": f"Proceed directly to destination ({round(dist_m, 1)}m)", "distance_m": int(round(dist_m)), "duration_sec": int(dist_m/1.3)}]
            }],
            "distinct_route_count": 1,
            "single_route_notice": "Only one sufficiently distinct route was found on the road network."
        }

    def _query_google_directions(self, o_lat: float, o_lng: float, d_lat: float, d_lng: float, mode: str) -> Optional[Dict[str, Any]]:
        """Optional query to official Google Maps Directions API."""
        try:
            g_mode = "walking" if mode == "walking" else ("bicycling" if mode in ("bike", "cycling") else "driving")
            url = f"https://maps.googleapis.com/maps/api/directions/json?origin={o_lat},{o_lng}&destination={d_lat},{d_lng}&alternatives=true&mode={g_mode}&key={self.google_key}"
            r = requests.get(url, timeout=4)
            if r.status_code == 200:
                data = r.json()
                if data.get("status") == "OK" and data.get("routes"):
                    g_routes = []
                    labels = ["Safest Google Corridor", "Fastest Google Route", "Alternative Avenue"]
                    for idx, gr in enumerate(data["routes"]):
                        leg = gr["legs"][0]
                        dist_m = leg["distance"]["value"]
                        dur_s = leg["duration"]["value"]
                        
                        coords = []
                        overview_poly = gr.get("overview_polyline", {}).get("points", "")
                        if overview_poly:
                            coords = self._decode_polyline(overview_poly)

                        steps = [
                            {
                                "instruction": st.get("html_instructions", "").replace("<b>", "").replace("</b>", ""),
                                "distance_m": st.get("distance", {}).get("value", 0),
                                "duration_sec": st.get("duration", {}).get("value", 0)
                            }
                            for st in leg.get("steps", [])
                        ]

                        g_routes.append({
                            "route_id": f"google-route-{idx+1}",
                            "name": labels[idx] if idx < len(labels) else f"Google Route {idx+1}",
                            "travel_mode": mode,
                            "distance_m": float(dist_m),
                            "distance_km": round(dist_m / 1000.0, 2),
                            "duration_sec": dur_s,
                            "duration_min": max(1, int(round(dur_s / 60.0))),
                            "coordinates": coords,
                            "steps": steps
                        })

                    return {
                        "success": True,
                        "already_at_destination": False,
                        "routing_provider": "Google Maps Directions API",
                        "routes": g_routes
                    }
        except Exception as e:
            print(f"[RoutingService] Google Directions API note: {e}")
        return None

    @staticmethod
    def _decode_polyline(polyline_str: str) -> List[Dict[str, float]]:
        """Decodes Google encoded polyline string into lat/lng coordinate dicts."""
        index, lat, lng = 0, 0, 0
        coordinates = []
        length = len(polyline_str)

        while index < length:
            b, shift, result = 0, 0, 0
            while True:
                b = ord(polyline_str[index]) - 63
                index += 1
                result |= (b & 0x1f) << shift
                shift += 5
                if b < 0x20:
                    break
            dlat = ~(result >> 1) if (result & 1) else (result >> 1)
            lat += dlat

            shift, result = 0, 0
            while True:
                b = ord(polyline_str[index]) - 63
                index += 1
                result |= (b & 0x1f) << shift
                shift += 5
                if b < 0x20:
                    break
            dlng = ~(result >> 1) if (result & 1) else (result >> 1)
            lng += dlng

            coordinates.append({"latitude": lat / 100000.0, "longitude": lng / 100000.0})

        return coordinates

    def _parse_route_object(self, r_data: dict, travel_mode: str, default_name: str, idx: int) -> Optional[Dict[str, Any]]:
        d_m = float(r_data.get("distance", 0))
        dur_s = int(round(r_data.get("duration", 0)))
        
        coords = [
            {"latitude": c[1], "longitude": c[0]}
            for c in r_data.get("geometry", {}).get("coordinates", [])
        ]

        if not coords:
            return None

        steps = []
        for leg in r_data.get("legs", []):
            for step in leg.get("steps", []):
                instruction = self._build_instruction(step)
                dist_step = int(round(step.get("distance", 0)))
                steps.append({
                    "instruction": instruction,
                    "distance_m": dist_step,
                    "duration_sec": int(round(step.get("duration", 0)))
                })

        if not steps:
            steps = [{
                "instruction": f"Proceed along corridor towards destination ({round(d_m, 1)}m)",
                "distance_m": int(round(d_m)),
                "duration_sec": dur_s
            }]

        return {
            "route_id": f"candidate-{idx}",
            "name": default_name,
            "travel_mode": travel_mode,
            "distance_m": d_m,
            "distance_km": round(d_m / 1000.0, 2),
            "duration_sec": dur_s,
            "duration_min": max(1, int(round(dur_s / 60.0))),
            "coordinates": coords,
            "steps": steps
        }


    def get_routes(self, origin_name=None, dest_name=None, origin_coords=None, dest_coords=None, vehicle='walking'):
        o_lat = origin_coords.get('latitude', 10.7905) if isinstance(origin_coords, dict) else 10.7905
        o_lng = origin_coords.get('longitude', 78.7047) if isinstance(origin_coords, dict) else 78.7047
        d_lat = dest_coords.get('latitude', 10.7950) if isinstance(dest_coords, dict) else 10.7950
        d_lng = dest_coords.get('longitude', 78.7100) if isinstance(dest_coords, dict) else 78.7100
        res = self.get_candidate_routes(o_lat, o_lng, d_lat, d_lng, vehicle)
        routes = res.get('routes', [])
        if routes:
            routes[0]['route_id'] = 'route-a-safe'
            routes[0]['is_recommended'] = True
            if len(routes) > 1:
                routes[1]['route_id'] = 'route-b-fast'
                routes[1]['is_recommended'] = False
        return routes
