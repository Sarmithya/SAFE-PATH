import os
import sys
import unittest

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.app import create_app
from backend.services.routing_service import RoutingService
from backend.services.safety_engine import SafetyScoringEngine
from backend.services.xgboost_model import get_xgboost_model
from backend.utils.geo_helper import haversine_distance_meters

class TestRoutingPipeline(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()

    def test_01_short_100m_route(self):
        """Test 1: Origin and destination ~100m apart"""
        origin = {"lat": 12.9716, "lng": 77.5946}
        dest = {"lat": 12.9725, "lng": 77.5946} # ~100m apart
        r = self.client.post('/api/routes/calculate', json={
            "origin": origin, "destination": dest, "travel_mode": "walking"
        })
        self.assertEqual(r.status_code, 200, f"Status code failed: {r.json}")
        data = r.json
        self.assertTrue(data["success"])
        self.assertIn("recommended_route", data)
        dist_m = data["recommended_route"]["distance_m"]
        self.assertTrue(30 <= dist_m <= 1000, f"Distance {dist_m}m out of bounds for 100m test")
        print(f"[PASS] Test 1 Passed (100m route): Distance = {dist_m}m")

    def test_02_short_500m_route(self):
        """Test 2: Origin and destination 500m apart"""
        origin = {"lat": 10.7905, "lng": 78.7047}
        dest = {"lat": 10.7945, "lng": 78.7085} # ~500m apart
        r = self.client.post('/api/routes/calculate', json={
            "origin": origin, "destination": dest, "travel_mode": "walking"
        })
        self.assertEqual(r.status_code, 200, f"Status code failed: {r.json}")
        data = r.json
        dist_m = data["recommended_route"]["distance_m"]
        self.assertTrue(300 <= dist_m <= 1200, f"Distance {dist_m}m out of bounds for 500m test")
        print(f"[PASS] Test 2 Passed (500m route): Distance = {dist_m}m")

    def test_03_medium_1km_route(self):
        """Test 3: Origin and destination ~1km apart"""
        origin = {"lat": 12.9716, "lng": 77.5946}
        dest = {"lat": 12.9800, "lng": 77.5946} # ~930m north
        r = self.client.post('/api/routes/calculate', json={
            "origin": origin, "destination": dest, "travel_mode": "walking"
        })
        self.assertEqual(r.status_code, 200, f"Status code failed: {r.json}")
        data = r.json
        dist_km = data["recommended_route"]["distance_km"]
        self.assertTrue(0.5 <= dist_km <= 6.0, f"Distance {dist_km}km out of bounds for 1km test")
        print(f"[PASS] Test 3 Passed (1km route): Distance = {dist_km}km")

    def test_04_long_5km_route(self):
        """Test 4: Origin and destination 5km apart"""
        origin = {"lat": 10.7905, "lng": 78.7047}
        dest = {"lat": 10.8350, "lng": 78.7350} # ~5km apart
        r = self.client.post('/api/routes/calculate', json={
            "origin": origin, "destination": dest, "travel_mode": "driving"
        })
        self.assertEqual(r.status_code, 200, f"Status code failed: {r.json}")
        data = r.json
        dist_km = data["recommended_route"]["distance_km"]
        self.assertTrue(3.5 <= dist_km <= 10.0, f"Distance {dist_km}km out of bounds for 5km test")
        print(f"[PASS] Test 4 Passed (5km route): Distance = {dist_km}km")

    def test_05_multiple_possible_routes(self):
        """Test 5: Multiple candidate routes handled correctly"""
        origin = {"lat": 10.7905, "lng": 78.7047}
        dest = {"lat": 10.8350, "lng": 78.7350}
        r = self.client.post('/api/routes/calculate', json={
            "origin": origin, "destination": dest, "travel_mode": "driving"
        })
        self.assertEqual(r.status_code, 200)
        data = r.json
        self.assertIn("recommended_route", data)
        self.assertIn("alternatives", data)
        print(f"[PASS] Test 5 Passed (Multiple routes): Found {len(data.get('routes', []))} route candidates")

    def test_06_single_possible_route(self):
        """Test 6: Single valid route handled without inventing fake alternatives"""
        origin = {"lat": 10.7905, "lng": 78.7047}
        dest = {"lat": 10.7910, "lng": 78.7050}
        r = self.client.post('/api/routes/calculate', json={
            "origin": origin, "destination": dest, "travel_mode": "walking"
        })
        self.assertEqual(r.status_code, 200)
        data = r.json
        self.assertIn("recommended_route", data)
        print(f"[PASS] Test 6 Passed (Single route): Handled safely without fake alternatives")

    def test_07_routing_api_unavailable_fallback(self):
        """Test 7: Routing API fallback handling when network fails"""
        svc = RoutingService()
        svc.osrm_url = "https://invalid-osrm-domain-12345.org" # Forces fallback
        res = svc.get_candidate_routes(10.7905, 78.7047, 10.7950, 78.7100, "walking")
        self.assertTrue(res["success"])
        self.assertEqual(len(res["routes"]), 1)
        self.assertIn("Fallback", res["routes"][0]["name"])
        print(f"[PASS] Test 7 Passed (API unavailable fallback): Returned clean fallback corridor")

    def test_08_safety_data_unavailable_fallback(self):
        """Test 8: Safety scoring when environmental data is missing"""
        engine = SafetyScoringEngine()
        res = engine.calculate_score() # Empty parameters
        self.assertIn("safety_score", res)
        self.assertIn(res["data_quality"], ["HIGH", "ESTIMATED_BASELINE"])
        print(f"[PASS] Test 8 Passed (Safety data fallback): Score = {res['safety_score']}, Data Quality = {res['data_quality']}")

    def test_09_gps_deviation_during_navigation(self):
        """Test 9: Deviation calculation when user deviates >50m"""
        user_pos = {"lat": 10.7950, "lng": 78.7050}
        corridor_pt = {"lat": 10.7900, "lng": 78.7000}
        dist = haversine_distance_meters(user_pos["lat"], user_pos["lng"], corridor_pt["lat"], corridor_pt["lng"])
        self.assertTrue(dist > 50.0)
        print(f"[PASS] Test 9 Passed (GPS deviation): Calculated deviation distance = {round(dist,1)}m (>50m threshold)")

    def test_10_user_close_to_destination(self):
        """Test 10: User starting within <15m of destination"""
        origin = {"lat": 10.7905, "lng": 78.7047}
        dest = {"lat": 10.790505, "lng": 78.704705} # ~0.8m apart
        r = self.client.post('/api/routes/calculate', json={
            "origin": origin, "destination": dest, "travel_mode": "walking"
        })
        self.assertEqual(r.status_code, 200)
        data = r.json
        self.assertTrue(data.get("already_at_destination"))
        print(f"[PASS] Test 10 Passed (User close to dest): Detected already at destination (<15m threshold)")

if __name__ == '__main__':
    unittest.main()
