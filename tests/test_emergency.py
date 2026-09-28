import unittest
from backend.services.emergency_service import EmergencyService

class TestEmergency(unittest.TestCase):

    def setUp(self):
        self.mock_havens = [
            {
                "id": "h-1",
                "name": "City General Hospital",
                "type": "hospital",
                "latitude": 12.9745,
                "longitude": 77.5970
            },
            {
                "id": "h-2",
                "name": "Central Police Station",
                "type": "police_station",
                "latitude": 12.9780,
                "longitude": 77.6010
            }
        ]

    def test_nearest_haven_calculation(self):
        # Point right next to City General Hospital
        user_lat, user_lon = 12.9746, 77.5971
        result = EmergencyService.get_nearest_safe_haven(
            current_lat=user_lat,
            current_lon=user_lon,
            safe_havens=self.mock_havens
        )

        self.assertEqual(result["status"], "LOCATED")
        self.assertIsNotNone(result["haven"])
        self.assertEqual(result["haven"]["id"], "h-1")
        self.assertLess(result["distance_meters"], 50)
        self.assertLess(result["estimated_time_seconds"], 40)

    def test_simulated_location_share(self):
        contacts = [
            {"name": "Sarah Rivera", "phone": "+15550199988"},
            {"name": "Campus Security", "phone": "+15550191122"}
        ]
        result = EmergencyService.simulate_location_share(
            user_name="Alex",
            current_lat=12.9746,
            current_lon=77.5971,
            destination="Central Library",
            nearest_haven_name="City General Hospital",
            contacts=contacts
        )

        self.assertTrue(result["success"])
        self.assertTrue(result["simulated"])
        self.assertEqual(result["recipients_count"], 2)
        self.assertIn("City General Hospital", result["message_body"])

if __name__ == "__main__":
    unittest.main()
