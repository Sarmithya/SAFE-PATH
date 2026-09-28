import unittest
from backend.services.safety_engine import SafetyScoringEngine

class TestSafetyEngine(unittest.TestCase):

    def setUp(self):
        self.engine = SafetyScoringEngine()

    def test_valid_score_calculation(self):
        result = self.engine.calculate_score(
            lighting=90,
            incidents=85,
            foot_traffic=80,
            emergency_services=75,
            departure_time="14:00",
            safety_preference="balanced"
        )
        self.assertIn("safety_score", result)
        self.assertGreaterEqual(result["safety_score"], 1)
        self.assertLessEqual(result["safety_score"], 99)
        self.assertEqual(result["confidence_level"], "HIGH")

    def test_missing_data_graceful_handling(self):
        # All inputs None
        result = self.engine.calculate_score()
        self.assertIn("safety_score", result)
        self.assertIn("confidence_notes", result)
        self.assertEqual(result["confidence_level"], "LOW")
        self.assertGreaterEqual(len(result["confidence_notes"]), 3)

    def test_time_dependent_scoring(self):
        day_result = self.engine.calculate_score(
            lighting=80, incidents=80, foot_traffic=80, emergency_services=80,
            departure_time="12:00 PM"
        )
        night_result = self.engine.calculate_score(
            lighting=80, incidents=80, foot_traffic=80, emergency_services=80,
            departure_time="11:30 PM"
        )
        # Night score should reflect the late-night multiplier
        self.assertLess(night_result["safety_score"], day_result["safety_score"])
        self.assertEqual(day_result["time_multiplier"], 1.0)
        self.assertEqual(night_result["time_multiplier"], 0.85)

if __name__ == "__main__":
    unittest.main()
