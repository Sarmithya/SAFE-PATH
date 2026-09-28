"""
Real SMS & Voice Call service using Twilio.

Gracefully falls back to simulation if credentials are missing.
"""
import os
from datetime import datetime, timezone
from typing import Optional

def _get_twilio_client():
    """Returns an authenticated Twilio REST client, or None if creds are missing."""
    sid   = os.getenv("TWILIO_ACCOUNT_SID", "").strip()
    token = os.getenv("TWILIO_AUTH_TOKEN", "").strip()
    if not sid or not token:
        return None
    try:
        from twilio.rest import Client
        return Client(sid, token)
    except ImportError:
        print("[SMSService] twilio package not installed. Run: pip install twilio")
        return None
    except Exception as e:
        print(f"[SMSService] Twilio client error: {e}")
        return None


class SMSService:
    """Sends real SMS via Twilio or logs a simulation when credentials are absent."""

    @staticmethod
    def send_emergency_sms(
        to_phone: str,
        user_name: str,
        lat: float,
        lon: float,
        destination: str,
        tracking_url: Optional[str] = None,
        vehicle_id: Optional[str] = None
    ) -> dict:
        """
        Sends a real emergency SMS with live location.

        Parameters
        ----------
        to_phone      : Recipient phone in E.164 format, e.g. '+917395994823'
        user_name     : Name to include in the SMS
        lat / lon     : Current GPS position
        destination   : Where the user is travelling to
        tracking_url  : Optional live-tracking page link
        vehicle_id    : Optional vehicle identification number
        """
        from_number = os.getenv("TWILIO_PHONE_NUMBER", "").strip()
        timestamp   = datetime.now(timezone.utc).strftime("%d %b %Y %H:%M UTC")
        maps_link   = f"https://maps.google.com/?q={lat},{lon}"

        body_parts = [
            f"[SafeRoute EMERGENCY ALERT]",
            f"From: {user_name}",
            f"Travelling to: {destination}",
        ]
        
        if vehicle_id:
            body_parts.append(f"Vehicle Info: {vehicle_id}")
            
        body_parts.extend([
            f"GPS: {lat:.5f}, {lon:.5f}",
            f"Map: {maps_link}",
        ])
        if tracking_url:
            body_parts.append(f"Live tracking: {tracking_url}")
        body_parts.append(f"Time: {timestamp}")
        body_parts.append("Sent via SafeRoute Safety App.")

        message_body = "\n".join(body_parts)

        client = _get_twilio_client()
        if client and from_number:
            try:
                msg = client.messages.create(
                    body = message_body,
                    from_= from_number,
                    to   = to_phone
                )
                return {
                    "success":   True,
                    "simulated": False,
                    "sid":       msg.sid,
                    "status":    msg.status,
                    "to":        to_phone,
                    "message":   "✅ Real SMS dispatched successfully.",
                    "body":      message_body
                }
            except Exception as e:
                error_str = str(e)
                # Trial account restriction: number not verified
                if "21608" in error_str or "unverified" in error_str.lower():
                    return {
                        "success":   False,
                        "simulated": False,
                        "error":     "unverified_number",
                        "message": (
                            f"⚠️ The number {to_phone} is not verified in your Twilio trial account. "
                            "Go to console.twilio.com → Phone Numbers → Verified Caller IDs and add it."
                        ),
                        "body": message_body
                    }
                return {
                    "success":   False,
                    "simulated": False,
                    "error":     error_str,
                    "message":   f"Twilio error: {error_str}",
                    "body":      message_body
                }
        else:
            # No credentials — simulate
            print(f"[SMSService] SIMULATED SMS to {to_phone} (message body omitted to avoid encoding issues on Windows)")
            return {
                "success":   True,
                "simulated": True,
                "to":        to_phone,
                "message":   "SMS simulated (no Twilio credentials configured).",
                "body":      message_body
            }


class CallService:
    """
    Places a real automated voice call via Twilio Voice.
    The call plays a spoken emergency alert message.
    """

    # TwiML that Twilio reads aloud when the call is answered
    TWIML_TEMPLATE = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="woman" language="en-IN">
    This is an emergency safety alert from SafeRoute.
    {user_name} has triggered an emergency SOS.
    Their current location is latitude {lat} longitude {lon}.
    Please check on them immediately.
    This message will repeat once.
  </Say>
  <Pause length="1"/>
  <Say voice="woman" language="en-IN">
    This is an emergency safety alert from SafeRoute.
    {user_name} has triggered an emergency SOS.
    Their current location is latitude {lat} longitude {lon}.
    Please check on them immediately.
  </Say>
</Response>"""

    @staticmethod
    def make_emergency_call(
        to_phone: str,
        user_name: str,
        lat: float,
        lon: float
    ) -> dict:
        """
        Places a real automated emergency voice call.
        On trial accounts the `to` number must be verified.
        """
        from_number = os.getenv("TWILIO_PHONE_NUMBER", "").strip()
        client      = _get_twilio_client()

        twiml = CallService.TWIML_TEMPLATE.format(
            user_name=user_name,
            lat=round(lat, 4),
            lon=round(lon, 4)
        )

        if client and from_number:
            try:
                call = client.calls.create(
                    twiml = twiml,
                    to    = to_phone,
                    from_ = from_number
                )
                return {
                    "success":   True,
                    "simulated": False,
                    "sid":       call.sid,
                    "status":    call.status,
                    "to":        to_phone,
                    "message":   "✅ Emergency call initiated."
                }
            except Exception as e:
                error_str = str(e)
                if "21608" in error_str or "unverified" in error_str.lower():
                    return {
                        "success": False,
                        "error":   "unverified_number",
                        "message": (
                            f"⚠️ {to_phone} is not verified in your Twilio trial account. "
                            "Verify it at console.twilio.com → Phone Numbers → Verified Caller IDs."
                        )
                    }
                return {
                    "success": False,
                    "error":   error_str,
                    "message": f"Call failed: {error_str}"
                }
        else:
            print(f"[CallService] SIMULATED CALL to {to_phone} for {user_name}")
            return {
                "success":   True,
                "simulated": True,
                "to":        to_phone,
                "message":   "Call simulated (no Twilio credentials configured)."
            }
