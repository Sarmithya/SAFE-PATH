import unittest
from backend.services.resilience_engine import SafetyResilienceEngine

class TestResilienceEngine(unittest.TestCase):

    def setUp(self):
        self.engine = SafetyResilienceEngine(default_threshold_seconds=120, travel_speed_mps=2.0)
        self.sample_route = [
            {"latitude": 12.9716, "longitude": 77.5946},
            {"latitude": 12.9745, "longitude": 77.5970},
            {"latitude": 12.9780, "longitude": 77.6010},
            {"latitude": 12.9810, "longitude": 77.6035},
            {"latitude": 12.9850, "longitude": 77.6050}
        ]

    def test_no_havens(self):
        result = self.engine.analyze_route_resilience(
            route_coordinates=self.sample_route,
            safe_havens=[]
        )
        self.assertEqual(result["resilience_status"], "WARNING")
        self.assertFalse(result["meets_threshold"])
        self.assertEqual(result["havens_count"], 0)

    def test_single_distant_haven_threshold_failure(self):
        distant_haven = [{
            "id": "h-dist",
            "name": "Far Police Post",
            "latitude": 13.0500, # ~9km away
            "longitude": 77.6500
        }]
        result = self.engine.analyze_route_resilience(
            route_coordinates=self.sample_route,
            safe_havens=distant_haven,
            threshold_seconds=120
        )
        self.assertEqual(result["resilience_status"], "WARNING")
        self.assertFalse(result["meets_threshold"])
        self.assertGreater(result["max_time_to_haven"], 120)

    def test_multiple_close_havens_threshold_pass(self):
        close_havens = [
            {"id": "h1", "name": "Hospital A", "latitude": 12.9716, "longitude": 77.5946},
            {"id": "h2", "name": "Police B", "latitude": 12.9745, "longitude": 77.5970},
            {"id": "h2b", "name": "Midpoint Store", "latitude": 12.9760, "longitude": 77.5990},
            {"id": "h3", "name": "Store C", "latitude": 12.9780, "longitude": 77.6010},
            {"id": "h4", "name": "Clinic D", "latitude": 12.9810, "longitude": 77.6035},
            {"id": "h5", "name": "Hospital E", "latitude": 12.9850, "longitude": 77.6050}
        ]
        result = self.engine.analyze_route_resilience(
            route_coordinates=self.sample_route,
            safe_havens=close_havens,
            threshold_seconds=120
        )
        self.assertEqual(result["resilience_status"], "PASS")
        self.assertTrue(result["meets_threshold"])
        self.assertLessEqual(result["max_time_to_haven"], 120)
        self.assertGreaterEqual(result["resilience_score"], 85)

if __name__ == "__main__":
    unittest.main()
