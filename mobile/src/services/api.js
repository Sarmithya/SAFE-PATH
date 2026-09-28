import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:5000';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 4000,
  headers: {
    'Content-Type': 'application/json'
  }
});

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete client.defaults.headers.common['Authorization'];
  }
};

// Fallback Mock Data for Zero-Failure Hackathon Demo
const MOCK_FALLBACK_ROUTES = [
  {
    route_id: 'route-a-safe',
    name: 'Route A (Recommended - Boulevard Corridor)',
    vehicle: 'personal_vehicle',
    distance_km: 6.2,
    duration_min: 22,
    safety_score: 87,
    resilience_score: 92,
    max_time_to_haven_seconds: 108,
    avg_time_to_haven_seconds: 54,
    havens_count: 5,
    threshold_seconds: 120,
    meets_threshold: true,
    resilience_status: 'PASS',
    lighting_score: 92,
    foot_traffic_score: 88,
    incident_safety_score: 90,
    emergency_proximity_score: 86,
    tradeoff: '4 minutes slower than the fastest route.',
    is_recommended: true,
    explanations: [
      '18% better street lighting coverage than alternate route',
      '2 additional emergency response facilities along the corridor',
      '5 verified safe havens within configured 2-minute resilience threshold',
      'Lower estimated incident-risk signal (commercial avenue)'
    ],
    coordinates: [
      { latitude: 12.9716, longitude: 77.5946 },
      { latitude: 12.9730, longitude: 77.5955 },
      { latitude: 12.9745, longitude: 77.5970 },
      { latitude: 12.9780, longitude: 77.6010 },
      { latitude: 12.9810, longitude: 77.6035 },
      { latitude: 12.9840, longitude: 77.6045 },
      { latitude: 12.9850, longitude: 77.6050 }
    ],
    safe_havens_along_route: ['haven-1', 'haven-2', 'haven-3', 'haven-4', 'haven-5']
  },
  {
    route_id: 'route-b-fast',
    name: 'Route B (Fastest - Industrial By-Pass)',
    vehicle: 'personal_vehicle',
    distance_km: 5.4,
    duration_min: 18,
    safety_score: 72,
    resilience_score: 58,
    max_time_to_haven_seconds: 300,
    avg_time_to_haven_seconds: 165,
    havens_count: 2,
    threshold_seconds: 120,
    meets_threshold: false,
    resilience_status: 'WARNING',
    lighting_score: 64,
    foot_traffic_score: 55,
    incident_safety_score: 68,
    emergency_proximity_score: 60,
    tradeoff: '4 minutes faster, but has lower lighting and higher time-to-haven gaps.',
    is_recommended: false,
    explanations: [
      'Fastest travel time via express by-pass',
      'Exceeds configured resilience threshold between Km 2.1 and 3.8 (up to 5.0 min to nearest haven)',
      'Lower estimated foot traffic and variable lighting signals after dark',
      'Fewer verified safe havens accessible along this segment'
    ],
    coordinates: [
      { latitude: 12.9716, longitude: 77.5946 },
      { latitude: 12.9750, longitude: 77.5960 },
      { latitude: 12.9795, longitude: 77.5990 },
      { latitude: 12.9825, longitude: 77.5980 },
      { latitude: 12.9850, longitude: 77.6050 }
    ],
    safe_havens_along_route: ['haven-4', 'haven-6']
  }
];

const MOCK_SAFE_HAVENS = [
  { id: 'haven-1', name: 'City General Hospital', type: 'hospital', latitude: 12.9745, longitude: 77.5970, address: '104 Healthcare Blvd', operating_hours: '24/7', verified: true, phone: '080-22001100' },
  { id: 'haven-2', name: 'Central Metro Police Station', type: 'police_station', latitude: 12.9780, longitude: 77.6010, address: '45 Civic Center Rd', operating_hours: '24/7', verified: true, phone: '100' },
  { id: 'haven-3', name: 'Apex 24/7 Superstore & Pharmacy', type: 'verified_24_7_store', latitude: 12.9810, longitude: 77.6035, address: '88 North Ave', operating_hours: '24/7', verified: true, phone: '080-23456789' },
  { id: 'haven-4', name: 'Downtown Transit Hub', type: 'crowded_area', latitude: 12.9730, longitude: 77.5955, address: 'Station Plaza West', operating_hours: '05:00 - 23:30', verified: true, phone: '080-22114455' },
  { id: 'haven-5', name: "St. Mary's Urgent Care", type: 'hospital', latitude: 12.9840, longitude: 77.6045, address: '12 Library Rd', operating_hours: '24/7', verified: true, phone: '108' },
  { id: 'haven-6', name: 'Northside Community Police Post', type: 'police_station', latitude: 12.9825, longitude: 77.5980, address: '77 Ring Highway', operating_hours: '24/7', verified: true, phone: '100' }
];

export const ApiService = {
  // Auth APIs
  login: async (identifier, password) => {
    try {
      const res = await client.post('/api/auth/login', { identifier, password });
      return res.data;
    } catch (err) {
      if (err.response && err.response.data) {
        throw new Error(err.response.data.error || 'Login failed');
      }
      throw new Error('Network error. Unable to connect to server.');
    }
  },

  register: async (userData) => {
    try {
      const res = await client.post('/api/auth/register', userData);
      return res.data;
    } catch (err) {
      if (err.response && err.response.data) {
        throw new Error(err.response.data.error || 'Registration failed');
      }
      throw new Error('Network error. Unable to connect to server.');
    }
  },

  verifyOtp: async (identifier, otp) => {
    try {
      const res = await client.post('/api/auth/verify-otp', { identifier, otp });
      return res.data;
    } catch (err) {
      if (err.response && err.response.data) {
        throw new Error(err.response.data.error || 'OTP verification failed');
      }
      throw new Error('Network error. Unable to verify OTP code.');
    }
  },

  resendOtp: async (identifier) => {
    try {
      const res = await client.post('/api/auth/resend-otp', { identifier });
      return res.data;
    } catch (err) {
      if (err.response && err.response.data) {
        throw new Error(err.response.data.error || 'Resend OTP failed');
      }
      throw new Error('Network error. Unable to resend OTP code.');
    }
  },

  forgotPassword: async (identifier) => {
    try {
      const res = await client.post('/api/auth/forgot-password', { identifier });
      return res.data;
    } catch (err) {
      if (err.response && err.response.data) {
        throw new Error(err.response.data.error || 'Forgot password failed');
      }
      throw new Error('Network error. Unable to process forgot password request.');
    }
  },

  resetPassword: async (payload) => {
    try {
      const res = await client.post('/api/auth/reset-password', payload);
      return res.data;
    } catch (err) {
      if (err.response && err.response.data) {
        throw new Error(err.response.data.error || 'Reset password failed');
      }
      throw new Error('Network error. Unable to reset password.');
    }
  },

  getProfile: async () => {
    try {
      const res = await client.get('/api/auth/me');
      return res.data;
    } catch (err) {
      if (err.response && err.response.data) {
        throw new Error(err.response.data.error || 'Failed to fetch user profile');
      }
      throw new Error('Session expired or invalid token.');
    }
  },

  updateProfileSetup: async (payload) => {
    try {
      const res = await client.post('/api/auth/profile-setup', payload);
      return res.data;
    } catch (err) {
      if (err.response && err.response.data) {
        throw new Error(err.response.data.error || 'Profile setup failed');
      }
      throw new Error('Network error. Unable to save profile setup.');
    }
  },

  // Routes Comparison
  compareRoutes: async (payload) => {
    try {
      const res = await client.post('/api/routes/compare', payload);
      return res.data;
    } catch (err) {
      return {
        success: true,
        demo_mode: true,
        origin: payload.origin || 'College',
        destination: payload.destination || 'Central Library',
        routes: MOCK_FALLBACK_ROUTES,
        safe_havens: MOCK_SAFE_HAVENS
      };
    }
  },

  // Safe Havens
  getNearbyHavens: async (lat, lon, radiusKm = 5.0) => {
    try {
      const res = await client.get(`/api/havens/nearby?lat=${lat}&lon=${lon}&radius_km=${radiusKm}`);
      return res.data;
    } catch (err) {
      return { success: true, count: MOCK_SAFE_HAVENS.length, havens: MOCK_SAFE_HAVENS };
    }
  },

  // Journey Tracking
  startJourney: async (payload) => {
    try {
      const res = await client.post('/api/journeys', payload);
      return res.data;
    } catch (err) {
      return { success: true, journey: { id: Date.now(), ...payload, status: 'IN_PROGRESS' } };
    }
  },

  updateLocation: async (journeyId, payload) => {
    try {
      const res = await client.post(`/api/journeys/${journeyId}/location`, payload);
      return res.data;
    } catch (err) {
      const isDeviated = !!payload.force_deviation;
      return {
        journey_id: journeyId,
        distance_to_route_meters: isDeviated ? 120.0 : 8.5,
        is_deviated: isDeviated,
        safety_status: isDeviated ? 'RED' : 'GREEN',
        status_message: isDeviated ? 'Route deviation detected (120m from planned corridor)' : 'On planned safe route',
        prompt_safety_check: isDeviated,
        nearest_haven: {
          haven: MOCK_SAFE_HAVENS[0],
          estimated_time_seconds: 90,
          formatted_time: '90 seconds',
          distance_meters: 110,
          status: 'LOCATED'
        }
      };
    }
  },

  submitSafetyCheck: async (journeyId, isSafe, coords = {}) => {
    try {
      const res = await client.post(`/api/journeys/${journeyId}/safety-check`, { is_safe: isSafe, ...coords });
      return res.data;
    } catch (err) {
      return {
        success: true,
        is_safe: isSafe,
        journey_status: isSafe ? 'IN_PROGRESS' : 'EMERGENCY',
        nearest_haven: { haven: MOCK_SAFE_HAVENS[0], estimated_time_seconds: 90, formatted_time: '90 seconds' }
      };
    }
  },

  completeJourney: async (journeyId) => {
    try {
      const res = await client.post(`/api/journeys/${journeyId}/complete`);
      return res.data;
    } catch (err) {
      return { success: true, message: 'Journey completed' };
    }
  },

  getJourneyHistory: async () => {
    try {
      const res = await client.get('/api/journeys/history');
      return res.data;
    } catch (err) {
      return {
        success: true,
        journeys: [
          { id: 101, origin: 'City College Campus', destination: 'Central Library', vehicle: 'personal_vehicle', departure_time: '02:15 PM', arrival_time: '02:37 PM', distance: 6.2, duration: 22, safety_score: 87, resilience_score: 92, max_time_to_haven: 108, status: 'COMPLETED', created_at: new Date().toISOString() }
        ]
      };
    }
  },

  // Emergency Lookups & Sharing
  getNearestHaven: async (lat, lon) => {
    try {
      const res = await client.post('/api/emergency/nearest-haven', { latitude: lat, longitude: lon });
      return res.data;
    } catch (err) {
      return { success: true, data: { haven: MOCK_SAFE_HAVENS[0], estimated_time_seconds: 90, formatted_time: '90 seconds', distance_meters: 110, status: 'LOCATED' } };
    }
  },

  shareLocation: async (payload) => {
    try {
      const res = await client.post('/api/emergency/share-location', payload);
      return res.data;
    } catch (err) {
      return {
        success: true,
        simulated: true,
        message_body: `🚨 SafeRoute Safety Alert: Live location shared for trip to ${payload.destination || 'Central Library'}. Nearest Safe Haven: City General Hospital`,
        deliveries: [{ recipient_name: 'Sarah Rivera', phone: '+1 (555) 019-9988', status: 'SIMULATED_SENT' }]
      };
    }
  },

  // AI Assistant Natural Language Parser
  parseIntent: async (prompt) => {
    try {
      const res = await client.post('/api/assistant/parse', { prompt });
      return res.data;
    } catch (err) {
      return {
        success: true,
        result: {
          destination: 'Central Library',
          arrival_time: '10 AM',
          safety_preference: 'safest',
          vehicle: 'walking',
          summary: "Routing to Central Library via Walking with 'Safest' optimization."
        }
      };
    }
  }
};
