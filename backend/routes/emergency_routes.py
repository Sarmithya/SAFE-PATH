"""
Emergency API routes:
  POST /api/emergency/nearest-haven
  POST /api/emergency/send-sms       ← real Twilio SMS
  POST /api/emergency/call           ← real Twilio voice call
  POST /api/emergency/share-location ← legacy simulation (kept for compatibility)
"""
import os
from flask import Blueprint, request, jsonify
from backend.services.emergency_service import EmergencyService
from backend.services.sms_service import SMSService, CallService
from backend.models.models import User
from backend.database.db import db

emergency_bp = Blueprint('emergency', __name__)


# ── helpers ──────────────────────────────────────────────────────────────────

def _resolve_contact(data: dict):
    """
    Returns (phone, name) for the emergency contact.
    Priority:
      1. phone passed directly in request body
      2. EMERGENCY_CONTACT_PHONE env variable
      3. first contact stored on the User record
    """
    phone = (data.get("emergency_contact") or "").strip()
    name  = (data.get("contact_name") or "Emergency Contact").strip()

    if not phone:
        phone = os.getenv("EMERGENCY_CONTACT_PHONE", "").strip()

    if not phone:
        user_id = data.get("user_id")
        if user_id:
            user = db.session.get(User, user_id)
            if user and user.emergency_contacts:
                c     = user.emergency_contacts[0]
                phone = getattr(c, 'phone', None) or getattr(c, 'phone_number', '')
                name  = getattr(c, 'name', None) or getattr(c, 'contact_name', 'Emergency Contact')

    return phone, name


# ── find nearest safe haven ────────────────────────────────────────────────

@emergency_bp.route('/api/emergency/nearest-haven', methods=['POST'])
def find_nearest_haven():
    data = request.get_json() or {}
    lat  = data.get('latitude')
    lon  = data.get('longitude')

    if lat is None or lon is None:
        return jsonify({'error': 'latitude and longitude are required'}), 400

    result = EmergencyService.get_nearest_safe_haven(lat, lon)
    return jsonify({'success': True, 'data': result}), 200


# ── REAL SMS ───────────────────────────────────────────────────────────────

@emergency_bp.route('/api/emergency/send-sms', methods=['POST'])
def send_emergency_sms():
    """
    Sends a real Twilio SMS to the emergency contact with the user's
    current GPS coordinates and an optional live tracking link.
    """
    data     = request.get_json() or {}
    lat      = float(data.get('latitude',  12.9716))
    lon      = float(data.get('longitude', 77.5946))
    dest     = data.get('destination', 'their destination')
    user_name = data.get('user_name', 'SafeRoute User')
    tracking_url = data.get('tracking_url')  # optional live-tracking link
    vehicle_id = data.get('vehicle_id') # newly added vehicle tracking id

    phone, contact_name = _resolve_contact(data)

    if not phone:
        return jsonify({
            'success': True,
            'simulated': True,
            'message': (
                'Emergency SMS simulated. Add an emergency contact or set '
                'EMERGENCY_CONTACT_PHONE in .env to send a live Twilio message.'
            ),
            'latitude': lat,
            'longitude': lon
        }), 200

    result = SMSService.send_emergency_sms(
        to_phone     = phone,
        user_name    = user_name,
        lat          = lat,
        lon          = lon,
        destination  = dest,
        tracking_url = tracking_url,
        vehicle_id   = vehicle_id
    )
    status_code = 200 if result.get('success') else 502
    return jsonify(result), status_code


# ── REAL VOICE CALL ────────────────────────────────────────────────────────

@emergency_bp.route('/api/emergency/call', methods=['POST'])
def make_emergency_call():
    """
    Places a real automated voice call to the emergency contact
    that reads out the SOS alert message.
    """
    data      = request.get_json() or {}
    lat       = float(data.get('latitude',  12.9716))
    lon       = float(data.get('longitude', 77.5946))
    user_name = data.get('user_name', 'SafeRoute User')

    phone, contact_name = _resolve_contact(data)

    if not phone:
        return jsonify({
            'success': False,
            'error':   'no_contact',
            'message': 'No emergency contact phone number configured.'
        }), 400

    result = CallService.make_emergency_call(
        to_phone  = phone,
        user_name = user_name,
        lat       = lat,
        lon       = lon
    )
    status_code = 200 if result.get('success') else 502
    return jsonify(result), status_code


# ── legacy share-location (kept for backwards compatibility) ───────────────

@emergency_bp.route('/api/emergency/share-location', methods=['POST'])
def share_location():
    data              = request.get_json() or {}
    user_id           = data.get('user_id')
    lat               = data.get('latitude',  12.9780)
    lon               = data.get('longitude', 77.6010)
    destination       = data.get('destination', 'Central Library')
    nearest_haven_name = data.get('nearest_haven_name', 'City General Hospital')

    user      = db.session.get(User, user_id) if user_id else None
    user_name = user.full_name if user else "SafeRoute User"

    contacts = []
    if user and user.emergency_contacts:
        contacts = [c.to_dict() for c in user.emergency_contacts]
    else:
        # Use env-configured number as fallback
        env_phone = os.getenv("EMERGENCY_CONTACT_PHONE", "")
        contacts = [{
            "name":  "Emergency Contact",
            "phone": env_phone or "+91XXXXXXXXXX"
        }]

    result = EmergencyService.simulate_location_share(
        user_name          = user_name,
        current_lat        = lat,
        current_lon        = lon,
        destination        = destination,
        nearest_haven_name = nearest_haven_name,
        contacts           = contacts
    )
    return jsonify(result), 200
