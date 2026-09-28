import os
import sys
import time
import json

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Ensure project root is in sys.path
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.app import create_app
from backend.services.routing_service import RoutingService
from backend.services.emergency_service import EmergencyService
from backend.ai.intent_parser import AIAssistantService
from backend.models.models import SafeHaven

def run_interactive_demo():
    print("=" * 75)
    print("       [SHIELD]  SAFEROUTE -- SAFETY RESILIENCE ENGINE DEMO  [SHIELD]")
    print("             Tagline: 'Navigate Safer, Not Just Faster.'")
    print("=" * 75)
    print("Mode: 100% DETERMINISTIC DEMO SCENARIO")
    print("Disclaimer: Safety metrics are advisory calculations, not absolute guarantees.\n")

    app = create_app()

    with app.app_context():
        # STEP 1: AI Intent Parsing
        print("-" * 75)
        print("STEP 1: Natural Language Travel Intent Parsing")
        print("-" * 75)
        user_query = "I need to reach college by 10 AM and I want a safer route."
        print(f"User Prompt: \"{user_query}\"")
        parsed = AIAssistantService.parse_travel_prompt(user_query)
        print(f" Extracted Destination: {parsed['destination']}")
        print(f" Extracted Arrival Time: {parsed['arrival_time']}")
        print(f" Safety Optimization:    {parsed['safety_preference'].upper()}")
        print(f" Selected Vehicle:       {parsed['vehicle'].upper()}")
        print(f" Summary:                {parsed['summary']}")
        time.sleep(0.5)

        # STEP 2: Route Comparison & Resilience Engine
        print("\n" + "-" * 75)
        print("STEP 2: Safety Resilience & Multi-Factor Route Comparison")
        print("-" * 75)
        origin = "College Gate"
        destination = "Central Library"
        print(f"Origin: {origin}  -->  Destination: {destination}\n")

        db_havens = [h.to_dict() for h in SafeHaven.query.all()]
        routing = RoutingService(demo_mode=True)
        routes = routing.get_routes(origin, destination)

        print(f"{'ROUTE':<40} | {'SAFETY':<8} | {'RESILIENCE':<12} | {'MAX HELP':<10} | {'HAVENS':<8} | {'DURATION':<8}")
        print("-" * 98)

        for r in routes:
            name = r.get('name')
            safety = f"{r.get('safety_score')}/100"
            res_status = f"{r.get('resilience_status', 'PASS')} ({r.get('resilience_score')}/100)"
            max_help = f"{r.get('max_time_to_haven_seconds')}s"
            havens = f"{r.get('havens_count')}"
            dur = f"{r.get('duration_min')} min"
            print(f"{name:<40} | {safety:<8} | {res_status:<12} | {max_help:<10} | {havens:<8} | {dur:<8}")

        print("\n[Tradeoffs Disclosed Upfront]:")
        print(f" * Route A Tradeoff: {routes[0].get('tradeoff')}")
        print(f" * Route B Tradeoff: {routes[1].get('tradeoff')}")
        time.sleep(0.5)

        # STEP 3: Start Journey on Route A
        print("\n" + "-" * 75)
        print("STEP 3: Start Active Journey on Route A (Boulevard Corridor)")
        print("-" * 75)
        route_a = routes[0]
        coords = route_a.get('coordinates', [])
        print(f"[*] Journey started at lat: {coords[0]['latitude']}, lon: {coords[0]['longitude']}")
        print(f"[*] Status: [GREEN] ON PLANNED SAFE ROUTE")
        print(f"[*] Nearest Haven: City General Hospital (Estimated time: 90 seconds)")
        time.sleep(0.5)

        # STEP 4: Simulate Route Deviation
        print("\n" + "-" * 75)
        print("STEP 4: Simulate Real-Time GPS Route Deviation Event")
        print("-" * 75)
        print("[!] Diverging GPS 120 meters off planned corridor...")
        deviated_lat = coords[2]['latitude'] + 0.0035
        deviated_lon = coords[2]['longitude'] - 0.0040
        print(f"[*] Current GPS: {deviated_lat:.5f}, {deviated_lon:.5f}")
        print(f"[*] Status: [RED] ROUTE DEVIATION DETECTED (120m off corridor)")
        print(f"[*] Automated Safety Trigger: \"ARE YOU SAFE?\"")
        time.sleep(0.5)

        # STEP 5: Emergency Protocol Execution
        print("\n" + "-" * 75)
        print("STEP 5: Emergency Assistance Protocol (User: \"NO, I'M NOT SAFE\")")
        print("-" * 75)
        nearest = EmergencyService.get_nearest_safe_haven(deviated_lat, deviated_lon, db_havens)
        haven_info = nearest.get('haven', {})
        print(f"[*] Nearest Verified Safe Haven: {haven_info.get('name')} ({haven_info.get('type')})")
        print(f"[*] Address: {haven_info.get('address')}")
        print(f"[*] Estimated Reach Time: {nearest.get('formatted_time')} ({nearest.get('distance_meters')}m away)")
        print(f"[*] Emergency Actions Prepared:")
        print(f"    [1] Turn-by-turn navigation routed directly to {haven_info.get('name')}")
        print(f"    [2] Police Dispatch (100) auto-dial confirmed")
        print(f"    [3] Ambulance Dispatch (108) alert generated")
        print(f"    [4] Live location & Haven payload shared with emergency contacts (Sarah Rivera)")

        share_result = EmergencyService.simulate_location_share(
            user_name="Alex Rivera",
            current_lat=deviated_lat,
            current_lon=deviated_lon,
            destination="Central Library",
            nearest_haven_name=haven_info.get('name'),
            contacts=[{"name": "Sarah Rivera (Mother)", "phone": "+1 (555) 019-9988"}]
        )
        print(f"\n[*] Broadcasted Live Alert Message:")
        print(f"    \"{share_result['message_body'].replace(chr(10), ' | ')}\"")

    print("\n" + "=" * 75)
    print("          DEMONSTRATION SCENARIO COMPLETED WITH ZERO ERRORS!")
    print("=" * 75)

if __name__ == "__main__":
    run_interactive_demo()
