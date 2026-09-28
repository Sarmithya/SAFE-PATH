import unittest
from backend.services.explanation_generator import ExplanationGenerator
from backend.services.routing_service import RoutingService

class TestRouteComparison(unittest.TestCase):

    def setUp(self):
        self.routing = RoutingService(demo_mode=True)

    def test_fetch_multiple_routes(self):
        routes = self.routing.get_routes(
            origin_name="College",
            dest_name="Central Library"
        )
        self.assertGreaterEqual(len(routes), 2)
        route_a = routes[0]
        route_b = routes[1]

        self.assertEqual(route_a["route_id"], "route-a-safe")
        self.assertEqual(route_b["route_id"], "route-b-fast")
        self.assertTrue(route_a.get("is_recommended", False))

    def test_explanation_generation_with_tradeoffs(self):
        route_a = {
            "name": "Route A",
            "duration_min": 22,
            "safety_score": 87,
            "lighting_score": 92,
            "havens_count": 5,
            "max_time_to_haven": 108,
            "threshold_seconds": 120,
            "meets_threshold": True,
            "incident_safety_score": 90
        }
        route_b = {
            "name": "Route B",
            "duration_min": 18,
            "safety_score": 72,
            "lighting_score": 64,
            "havens_count": 2,
            "max_time_to_haven": 300,
            "threshold_seconds": 120,
            "meets_threshold": False,
            "incident_safety_score": 68
        }

        explanations = ExplanationGenerator.generate_explanations(
            primary_route=route_a,
            alternate_routes=[route_b]
        )

        self.assertIn("why_this_route", explanations)
        self.assertIn("tradeoff", explanations)
        self.assertGreaterEqual(len(explanations["why_this_route"]), 2)
        self.assertIn("4 minutes slower", explanations["tradeoff"])

if __name__ == "__main__":
    unittest.main()
