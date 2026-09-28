# SafeRoute API Documentation

## Base URL
`http://127.0.0.1:5000/api`

---

## 1. Authentication Endpoints

### Register
`POST /api/auth/register`
**Request Body:**
```json
{
  "full_name": "Alex Rivera",
  "email": "alex@saferoute.app",
  "phone": "+15550192834",
  "password": "SecurePassword123!",
  "emergency_contact_name": "Sarah Rivera",
  "emergency_contact_phone": "+15550199988"
}
```
**Response (201 Created):**
```json
{
  "message": "Registration successful",
  "token": "eyJhbGciOi...",
  "user": { "id": 1, "full_name": "Alex Rivera", "email": "alex@saferoute.app" }
}
```

### Login
`POST /api/auth/login`
**Request Body:**
```json
{
  "email": "demo@saferoute.app",
  "password": "demo1234"
}
```
**Response (200 OK):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOi...",
  "user": { "id": 1, "full_name": "Alex Rivera (Demo)", "email": "demo@saferoute.app" }
}
```

---

## 2. Route Comparison & Safety Intelligence

### Compare Routes
`POST /api/routes/compare`
**Request Body:**
```json
{
  "origin": "College Gate",
  "destination": "Central Library",
  "vehicle": "personal_vehicle",
  "departure_time": "10:00 AM",
  "safety_preference": "safest"
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "origin": "College Gate",
  "destination": "Central Library",
  "demo_mode": true,
  "routes": [
    {
      "route_id": "route-a-safe",
      "name": "Route A (Recommended - Boulevard Corridor)",
      "distance_km": 6.2,
      "duration_min": 22,
      "safety_score": 87,
      "resilience_score": 92,
      "max_time_to_haven_seconds": 108,
      "havens_count": 5,
      "resilience_status": "PASS",
      "tradeoff": "4 minutes slower than the fastest route.",
      "explanations": [
        "18% better street lighting coverage than alternate route",
        "2 additional emergency response facilities along the corridor",
        "5 verified safe havens within configured 2-minute resilience threshold",
        "Lower estimated incident-risk signal (commercial avenue)"
      ]
    }
  ]
}
```

---

## 3. Safe Havens

### Nearby Havens
`GET /api/havens/nearby?lat=12.9745&lon=77.5970&radius_km=3.0`
**Response (200 OK):**
```json
{
  "success": true,
  "count": 6,
  "havens": [
    {
      "id": "haven-1",
      "name": "City General Hospital",
      "type": "hospital",
      "latitude": 12.9745,
      "longitude": 77.5970,
      "operating_hours": "24/7",
      "verified": true
    }
  ]
}
```

---

## 4. Journey Tracking & Deviation Detection

### Start Journey
`POST /api/journeys`
```json
{
  "origin": "College Gate",
  "destination": "Central Library",
  "vehicle": "personal_vehicle",
  "distance_km": 6.2,
  "duration_min": 22,
  "safety_score": 87,
  "resilience_score": 92,
  "coordinates": [{ "latitude": 12.9716, "longitude": 77.5946 }]
}
```

### Update Location (Live Deviation Check)
`POST /api/journeys/<id>/location`
```json
{
  "latitude": 12.9750,
  "longitude": 77.5990,
  "force_deviation": false
}
```
**Response (200 OK):**
```json
{
  "journey_id": 1,
  "safety_status": "GREEN",
  "status_message": "On planned safe route",
  "is_deviated": false,
  "nearest_haven": {
    "haven": { "name": "City General Hospital" },
    "estimated_time_seconds": 90
  }
}
```

### Submit Safety Check (ARE YOU SAFE?)
`POST /api/journeys/<id>/safety-check`
```json
{
  "is_safe": false,
  "latitude": 12.9750,
  "longitude": 77.5990
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "is_safe": false,
  "journey_status": "EMERGENCY",
  "action_required": "EMERGENCY_ASSISTANCE",
  "nearest_haven": { "haven": { "name": "City General Hospital" } }
}
```

---

## 5. Natural Language Intent Parser

### AI Assistant Parse
`POST /api/assistant/parse`
```json
{
  "prompt": "I need to reach college by 10 AM and I want a safer route."
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "result": {
    "destination": "College",
    "arrival_time": "10 AM",
    "safety_preference": "safest",
    "vehicle": "walking",
    "summary": "Routing to College via Walking with 'Safest' optimization."
  }
}
```
