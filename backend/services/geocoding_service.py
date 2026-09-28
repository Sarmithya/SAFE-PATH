import requests
import os
from typing import List, Dict, Any, Optional

class GeocodingService:
    """
    Real-time Geocoding and Place Search Service.
    Uses Nominatim (OpenStreetMap) as primary — free, no API key.
    Falls back to Google Geocoding if GOOGLE_MAPS_API_KEY is set.
    Never silently returns a hardcoded fallback without logging it.
    """

    NOMINATIM_SEARCH_URL  = "https://nominatim.openstreetmap.org/search"
    NOMINATIM_SUGGEST_URL = "https://nominatim.openstreetmap.org/search"
    GOOGLE_GEOCODE_URL    = "https://maps.googleapis.com/maps/api/geocode/json"

    # Identify our app to Nominatim (required by their usage policy)
    HEADERS = {
        "User-Agent": "SafeRoute-Safety-Navigation-Platform/2.0 (contact@saferoute.app)"
    }

    @staticmethod
    def search_place(query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Geocodes a free-text query (address, landmark, city) into lat/lon.
        Returns up to `limit` candidate results.
        """
        query = (query or "").strip()
        if len(query) < 2:
            return []

        # --- Try Google Geocoding first if key is available ---
        google_key = os.getenv("GOOGLE_MAPS_API_KEY", "").strip()
        if google_key:
            try:
                params = {"address": query, "key": google_key}
                resp = requests.get(
                    GeocodingService.GOOGLE_GEOCODE_URL,
                    params=params, timeout=5
                )
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("status") == "OK" and data.get("results"):
                        results = []
                        for item in data["results"][:limit]:
                            loc = item["geometry"]["location"]
                            results.append({
                                "name":         item.get("formatted_address", query).split(",")[0].strip(),
                                "display_name": item.get("formatted_address", ""),
                                "latitude":     float(loc["lat"]),
                                "longitude":    float(loc["lng"]),
                                "source":       "google"
                            })
                        if results:
                            return results
            except Exception as e:
                print(f"[GeocodingService] Google fallback: {e}")

        # --- Nominatim (primary for no-key setups) ---
        search_queries = [query]
        # Append city context or cleaned query if user entered a raw string
        if not any(city in query.lower() for city in ["bengaluru", "bangalore", "india"]):
            search_queries.append(f"{query}, Bengaluru")

        for q_attempt in search_queries:
            try:
                params = {
                    "q":              q_attempt,
                    "format":         "json",
                    "limit":          limit,
                    "addressdetails": 1,
                    "extratags":      0,
                }
                resp = requests.get(
                    GeocodingService.NOMINATIM_SEARCH_URL,
                    params=params,
                    headers=GeocodingService.HEADERS,
                    timeout=5
                )
                if resp.status_code == 200:
                    items = resp.json()
                    results = []
                    for item in items:
                        name = (
                            item.get("name")
                            or item.get("display_name", "").split(",")[0]
                        ).strip()
                        results.append({
                            "name":         name,
                            "display_name": item.get("display_name", ""),
                            "latitude":     float(item["lat"]),
                            "longitude":    float(item["lon"]),
                            "type":         item.get("type", "place"),
                            "source":       "nominatim"
                        })
                    if results:
                        return results
            except Exception as e:
                print(f"[GeocodingService] Nominatim error for '{q_attempt}': {e}")

        # --- Smart Landmark Auto-Correct Fallback ---
        # Handles common misspelled keywords like "librry", "hospitl", "collge", "station", etc.
        q_lower = query.lower()
        landmarks = [
            ({"library", "librry", "libary", "central library"}, {"name": "Central Library", "latitude": 12.9850, "longitude": 77.6050}),
            ({"hospital", "hospitl", "clinic", "city hospital"}, {"name": "City General Hospital", "latitude": 12.9780, "longitude": 77.6010}),
            ({"college", "collge", "university", "campus"}, {"name": "Civic University Campus", "latitude": 12.9716, "longitude": 77.5946}),
            ({"station", "metro", "transit", "bus stop"}, {"name": "Central Transit Station", "latitude": 12.9750, "longitude": 77.5970}),
            ({"park", "garden", "plaza"}, {"name": "City Central Park", "latitude": 12.9730, "longitude": 77.5960}),
        ]
        for keywords, place_data in landmarks:
            if any(kw in q_lower for kw in keywords):
                print(f"[GeocodingService] Auto-corrected '{query}' to landmark '{place_data['name']}'")
                return [{
                    "name": place_data["name"],
                    "display_name": f"{place_data['name']} (Auto-corrected)",
                    "latitude": place_data["latitude"],
                    "longitude": place_data["longitude"],
                    "type": "autocorrect",
                    "source": "smart_autocorrect"
                }]

        print(f"[GeocodingService] Could not geocode '{query}' — returning empty")
        return []

    @staticmethod
    def autocomplete(query: str, limit: int = 6) -> List[Dict[str, Any]]:
        """
        Returns quick suggestions for the search input field.
        Uses Nominatim's fast search (no address details = faster).
        """
        query = (query or "").strip()
        if len(query) < 3:
            return []

        try:
            params = {
                "q":      query,
                "format": "json",
                "limit":  limit,
            }
            resp = requests.get(
                GeocodingService.NOMINATIM_SUGGEST_URL,
                params=params,
                headers=GeocodingService.HEADERS,
                timeout=4
            )
            if resp.status_code == 200:
                return [
                    {
                        "display_name": item.get("display_name", ""),
                        "latitude":     float(item["lat"]),
                        "longitude":    float(item["lon"]),
                    }
                    for item in resp.json()
                ]
        except Exception as e:
            print(f"[GeocodingService] Autocomplete error: {e}")

        return []
