import os
from flask import Blueprint, request, jsonify, current_app
from backend.config import Config
from backend.services.openai_service import OpenAIService

settings_bp = Blueprint('settings', __name__)

def _twilio_configured():
    return bool(
        os.getenv("TWILIO_ACCOUNT_SID", "").strip() and
        os.getenv("TWILIO_AUTH_TOKEN", "").strip() and
        os.getenv("TWILIO_PHONE_NUMBER", "").strip()
    )

@settings_bp.route('/api/settings/keys', methods=['GET'])
def get_api_keys_status():
    google_key   = Config.GOOGLE_MAPS_API_KEY or os.getenv("GOOGLE_MAPS_API_KEY", "")
    openai_key   = Config.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY", "")
    twilio_sid   = Config.TWILIO_ACCOUNT_SID or os.getenv("TWILIO_ACCOUNT_SID", "")
    mapbox_token = Config.MAPBOX_ACCESS_TOKEN or os.getenv("MAPBOX_ACCESS_TOKEN", "")

    return jsonify({
        "success": True,
        "keys": {
            "google_configured":  bool(google_key and len(google_key) > 8),
            "openai_configured":  OpenAIService.is_configured(),
            "twilio_configured":  _twilio_configured(),
            "twilio_phone_number": Config.TWILIO_PHONE_NUMBER or os.getenv("TWILIO_PHONE_NUMBER", "")
        },
        "google": {
            "configured": bool(google_key and len(google_key) > 8),
            "preview":    f"{google_key[:6]}...{google_key[-4:]}" if len(google_key) > 10 else "Not configured",
            "usage":      "Google Maps Geocoding & Directions routing"
        },
        "openai": {
            "configured": OpenAIService.is_configured(),
            "preview":    f"{openai_key[:6]}...{openai_key[-4:]}" if len(openai_key) > 12 else "Not configured",
            "usage":      "Powers live GPT-4o conversational route intent parsing & explainable AI"
        },
        "twilio": {
            "configured": _twilio_configured(),
            "preview":    f"{twilio_sid[:6]}..." if len(twilio_sid) > 8 else "Not configured",
            "usage":      "Dispatches real emergency SMS alerts with live GPS links to contacts"
        },
        "mapbox": {
            "configured": bool(mapbox_token and len(mapbox_token) > 10),
            "preview":    f"{mapbox_token[:6]}..." if len(mapbox_token) > 10 else "Not configured",
            "usage":      "High-precision commercial vector map tiles & directions"
        }
    }), 200

@settings_bp.route('/api/settings/keys', methods=['POST'])
def update_api_keys():
    data = request.get_json() or {}

    if "google_maps_api_key" in data:
        Config.GOOGLE_MAPS_API_KEY = data["google_maps_api_key"].strip()
        os.environ["GOOGLE_MAPS_API_KEY"] = data["google_maps_api_key"].strip()

    if "openai_api_key" in data:
        Config.OPENAI_API_KEY = data["openai_api_key"].strip()
        os.environ["OPENAI_API_KEY"] = data["openai_api_key"].strip()

    if "twilio_account_sid" in data:
        Config.TWILIO_ACCOUNT_SID = data["twilio_account_sid"].strip()
        os.environ["TWILIO_ACCOUNT_SID"] = data["twilio_account_sid"].strip()

    if "twilio_auth_token" in data:
        Config.TWILIO_AUTH_TOKEN = data["twilio_auth_token"].strip()
        os.environ["TWILIO_AUTH_TOKEN"] = data["twilio_auth_token"].strip()

    if "twilio_phone_number" in data:
        Config.TWILIO_PHONE_NUMBER = data["twilio_phone_number"].strip()
        os.environ["TWILIO_PHONE_NUMBER"] = data["twilio_phone_number"].strip()

    if "mapbox_access_token" in data:
        Config.MAPBOX_ACCESS_TOKEN = data["mapbox_access_token"].strip()
        os.environ["MAPBOX_ACCESS_TOKEN"] = data["mapbox_access_token"].strip()

    return jsonify({
        "success":          True,
        "message":          "API keys updated successfully! Live integrations active.",
        "openai_configured": OpenAIService.is_configured(),
        "twilio_configured": _twilio_configured()
    }), 200
