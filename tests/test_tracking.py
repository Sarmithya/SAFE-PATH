import unittest

from backend.app import create_app


class TestTracking(unittest.TestCase):
    def setUp(self):
        self.client = create_app().test_client()

    def test_tracking_page_and_location_lifecycle(self):
        page = self.client.get('/track/demo-token')
        self.assertEqual(page.status_code, 200)
        self.assertIn(b'locationUrl', page.data)
        self.assertIn(b'/api/journey/${encodeURIComponent(token)}/location', page.data)

        update = self.client.post(
            '/api/journey/demo-token/location',
            json={'lat': 0, 'lon': 0},
        )
        self.assertEqual(update.status_code, 200)

        location = self.client.get('/api/journey/demo-token/location')
        self.assertEqual(location.status_code, 200)
        self.assertEqual(location.get_json()['lat'], 0.0)
        self.assertEqual(location.get_json()['lon'], 0.0)

    def test_tracking_rejects_invalid_coordinates(self):
        response = self.client.post(
            '/api/journey/demo-token/location',
            json={'lat': 91, 'lon': 0},
        )
        self.assertEqual(response.status_code, 400)


if __name__ == '__main__':
    unittest.main()
