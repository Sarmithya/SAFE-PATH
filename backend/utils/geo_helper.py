import math
from typing import List, Dict, Tuple

EARTH_RADIUS_KM = 6371.0

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in kilometers between two lat/lon coordinates using Haversine formula."""
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return EARTH_RADIUS_KM * c

def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in meters between two lat/lon coordinates."""
    return haversine_distance_km(lat1, lon1, lat2, lon2) * 1000.0

def sample_polyline_points(coordinates: List[Dict[str, float]], sample_interval_meters: float = 100.0) -> List[Dict[str, float]]:
    """
    Sub-sample or interpolate points along a polyline at regular intervals (in meters).
    Guarantees continuous coverage for resilience checks.
    """
    if not coordinates:
        return []
    if len(coordinates) == 1:
        return coordinates

    sampled = [coordinates[0]]
    accumulated_dist = 0.0

    for i in range(len(coordinates) - 1):
        p1 = coordinates[i]
        p2 = coordinates[i + 1]
        
        seg_dist = haversine_distance_meters(p1['latitude'], p1['longitude'], p2['latitude'], p2['longitude'])
        if seg_dist == 0:
            continue

        # If segment is longer than sample interval, interpolate intermediate points
        num_steps = max(1, int(seg_dist / sample_interval_meters))
        for step in range(1, num_steps + 1):
            fraction = step / num_steps
            interp_lat = p1['latitude'] + (p2['latitude'] - p1['latitude']) * fraction
            interp_lon = p1['longitude'] + (p2['longitude'] - p1['longitude']) * fraction
            sampled.append({'latitude': round(interp_lat, 6), 'longitude': round(interp_lon, 6)})

    return sampled

def point_to_segment_distance_meters(p_lat: float, p_lon: float, 
                                     a_lat: float, a_lon: float, 
                                     b_lat: float, b_lon: float) -> float:
    """Calculate shortest perpendicular distance in meters from point P to line segment AB."""
    # Approximate using flat projection for local sub-kilometer calculations
    lat_mid = math.radians((a_lat + b_lat) / 2.0)
    kx = 111320.0 * math.cos(lat_mid)
    ky = 110540.0

    px, py = p_lon * kx, p_lat * ky
    ax, ay = a_lon * kx, a_lat * ky
    bx, by = b_lon * kx, b_lat * ky

    dx = bx - ax
    dy = by - ay

    if dx == 0 and dy == 0:
        return math.hypot(px - ax, py - ay)

    # Project P onto AB: t = ((P - A) . (B - A)) / |B - A|^2
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    proj_x = ax + t * dx
    proj_y = ay + t * dy

    return math.hypot(px - proj_x, py - proj_y)

def min_distance_to_route_meters(p_lat: float, p_lon: float, route_coords: List[Dict[str, float]]) -> float:
    """Calculate minimum distance in meters from user position to any segment on the route."""
    if not route_coords:
        return 0.0
    if len(route_coords) == 1:
        return haversine_distance_meters(p_lat, p_lon, route_coords[0]['latitude'], route_coords[0]['longitude'])

    min_dist = float('inf')
    for i in range(len(route_coords) - 1):
        a = route_coords[i]
        b = route_coords[i + 1]
        dist = point_to_segment_distance_meters(
            p_lat, p_lon,
            a['latitude'], a['longitude'],
            b['latitude'], b['longitude']
        )
        if dist < min_dist:
            min_dist = dist

    return min_dist
