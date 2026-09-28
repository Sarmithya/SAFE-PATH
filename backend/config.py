import os
from dotenv import load_dotenv

# Load .env if present
load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "saferoute-secret-key-2026")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "saferoute-jwt-secret-2026")
    JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", 
        f"sqlite:///{os.path.join(BASE_DIR, 'saferoute.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Engine Settings
    DEMO_MODE = os.getenv("DEMO_MODE", "false").lower() in ("true", "1", "yes")
    RESILIENCE_THRESHOLD_SECONDS = int(os.getenv("RESILIENCE_THRESHOLD_SECONDS", "120"))
    DEVIATION_THRESHOLD_METERS = float(os.getenv("DEVIATION_THRESHOLD_METERS", "50.0"))
    ARRIVAL_THRESHOLD_METERS_MIN = float(os.getenv("ARRIVAL_THRESHOLD_METERS_MIN", "15.0"))
    
    # Configurable Route Trade-off Parameters
    ROUTE_SELECTION_SAFETY_WEIGHT = float(os.getenv("ROUTE_SELECTION_SAFETY_WEIGHT", "0.75"))
    ROUTE_SELECTION_TIME_WEIGHT = float(os.getenv("ROUTE_SELECTION_TIME_WEIGHT", "0.25"))
    MAX_TIME_PENALTY_RATIO = float(os.getenv("MAX_TIME_PENALTY_RATIO", "1.60")) # Max 60% longer duration allowed for safety gains
    
    # Safety Scoring Weights
    SAFETY_WEIGHTS = {
        "lighting": 0.22,
        "incidents": 0.22,
        "foot_traffic": 0.20,
        "emergency_services": 0.20,
        "cctv": 0.16
    }
    
    # External APIs (Keep secrets in environment variables)
    OSRM_BASE_URL = os.getenv("OSRM_BASE_URL", "https://router.project-osrm.org/route/v1")
    GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    MAPBOX_ACCESS_TOKEN = os.getenv("MAPBOX_ACCESS_TOKEN", "")
    TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "")
