import unittest
import json
from backend.app import create_app
from backend.database.db import db

class TestAPIEndpoints(unittest.TestCase):

    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['DEMO_MODE'] = True
        self.client = self.app.test_client()

    def test_routes_compare_endpoint(self):
        payload = {
            "origin": "College Gate",
            "destination": "Central Library",
            "vehicle": "personal_vehicle",
            "departure_time": "10:00 AM",
            "safety_preference": "safest"
        }
        res = self.client.post(
            "/api/routes/compare",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["success"])
        self.assertGreaterEqual(len(data["routes"]), 2)
        
        # Verify Route A deterministic properties
        route_a = data["routes"][0]
        self.assertEqual(route_a["safety_score"], 87)
        self.assertEqual(route_a["resilience_score"], 92)
        self.assertEqual(route_a["max_time_to_haven_seconds"], 108)
        self.assertEqual(route_a["havens_count"], 5)
        self.assertEqual(route_a["resilience_status"], "PASS")

    def test_havens_nearby_endpoint(self):
        res = self.client.get("/api/havens/nearby?lat=12.9745&lon=77.5970&radius_km=3.0")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["success"])
        self.assertGreater(data["count"], 0)

    def test_journey_lifecycle_and_deviation(self):
        # 1. Initialize Journey
        j_payload = {
            "origin": "College",
            "destination": "Central Library",
            "vehicle": "walking",
            "distance_km": 6.2,
            "duration_min": 22,
            "safety_score": 87,
            "resilience_score": 92,
            "max_time_to_haven_seconds": 108,
            "coordinates": [
                {"latitude": 12.9716, "longitude": 77.5946},
                {"latitude": 12.9745, "longitude": 77.5970},
                {"latitude": 12.9850, "longitude": 77.6050}
            ]
        }
        res = self.client.post("/api/journeys", data=json.dumps(j_payload), content_type="application/json")
        self.assertEqual(res.status_code, 201)
        j_data = json.loads(res.data)
        journey_id = j_data["journey"]["id"]

        # 2. Normal On-Route Location Update
        loc_res = self.client.post(
            f"/api/journeys/{journey_id}/location",
            data=json.dumps({"latitude": 12.9716, "longitude": 77.5946}),
            content_type="application/json"
        )
        self.assertEqual(loc_res.status_code, 200)
        loc_data = json.loads(loc_res.data)
        self.assertEqual(loc_data["safety_status"], "GREEN")
        self.assertFalse(loc_data["is_deviated"])

        # 3. Force Route Deviation Update (Simulation)
        dev_res = self.client.post(
            f"/api/journeys/{journey_id}/location",
            data=json.dumps({"latitude": 12.9716, "longitude": 77.5946, "force_deviation": True}),
            content_type="application/json"
        )
        self.assertEqual(dev_res.status_code, 200)
        dev_data = json.loads(dev_res.data)
        self.assertEqual(dev_data["safety_status"], "RED")
        self.assertTrue(dev_data["is_deviated"])
        self.assertTrue(dev_data["prompt_safety_check"])

        # 4. Trigger Safety Check - User answers "NO, I'M NOT SAFE"
        check_res = self.client.post(
            f"/api/journeys/{journey_id}/safety-check",
            data=json.dumps({"is_safe": False, "latitude": 12.9745, "longitude": 77.5970}),
            content_type="application/json"
        )
        self.assertEqual(check_res.status_code, 200)
        check_data = json.loads(check_res.data)
        self.assertEqual(check_data["journey_status"], "EMERGENCY")
        self.assertIn("nearest_haven", check_data)

    def test_emergency_endpoints(self):
        # Nearest haven
        res = self.client.post(
            "/api/emergency/nearest-haven",
            data=json.dumps({"latitude": 12.9745, "longitude": 77.5970}),
            content_type="application/json"
        )
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["status"], "LOCATED")

        # Share location
        share_res = self.client.post(
            "/api/emergency/share-location",
            data=json.dumps({
                "latitude": 12.9745,
                "longitude": 77.5970,
                "destination": "Central Library"
            }),
            content_type="application/json"
        )
        self.assertEqual(share_res.status_code, 200)
        share_data = json.loads(share_res.data)
        self.assertTrue(share_data["success"])
        self.assertTrue(share_data["simulated"])

    def test_assistant_parser_endpoint(self):
        prompt_payload = {
            "prompt": "I need to reach college by 10 AM and I want a safer route."
        }
        res = self.client.post(
            "/api/assistant/parse",
            data=json.dumps(prompt_payload),
            content_type="application/json"
        )
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["success"])
        parsed = data["result"]
        self.assertEqual(parsed["arrival_time"], "10 AM")
        self.assertEqual(parsed["safety_preference"], "safest")

    def test_dataset_endpoints(self):
        res = self.client.get("/api/dataset/live?lat=12.9716&lon=77.5946")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["success"])
        self.assertIn("datasets", data)
        self.assertIn("streetlights", data["datasets"])
        self.assertIn("cctv_cameras", data["datasets"])
        self.assertIn("crowd_zones", data["datasets"])

    def test_feedback_endpoints(self):
        payload = {
            "user_name": "Alex Rivera",
            "route_name": "Route A (Well-Lit Corridor)",
            "rating": 5,
            "lighting_rating": "Well-Lit",
            "crowd_rating": "Crowded & Active",
            "safety_feeling": "Very Safe",
            "comments": "The 120s haven guarantee gave me so much peace of mind!"
        }
        res = self.client.post(
            "/api/feedback/submit",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(res.status_code, 201)
        data = json.loads(res.data)
        self.assertTrue(data["success"])

        # Test listing feedbacks
        list_res = self.client.get("/api/feedback/list")
        self.assertEqual(list_res.status_code, 200)
        list_data = json.loads(list_res.data)
        self.assertTrue(list_data["success"])
        self.assertGreater(list_data["count"], 0)

if __name__ == "__main__":
    unittest.main()
