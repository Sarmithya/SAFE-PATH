from typing import List, Dict, Any

class ExplanationGenerator:
    """
    Explainable AI engine for route recommendations.
    Generates human-readable, evidence-based comparative highlights
    and transparent tradeoff statements.
    """

    @staticmethod
    def generate_explanations(
        primary_route: Dict[str, Any],
        alternate_routes: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Produces structured explanation cards and tradeoff notices
        comparing the primary recommended route with alternates.
        """
        highlights = []
        tradeoffs = []

        if not alternate_routes:
            return {
                "why_this_route": [
                    f"Verified {primary_route.get('havens_count', 0)} safe havens accessible within corridor",
                    f"Composite safety index of {primary_route.get('safety_score', 80)}/100"
                ],
                "tradeoff": "Direct path evaluated with available safety attributes.",
                "advisory_notes": "Optimal balance based on current signals."
            }

        # Compare with the fastest alternate route
        fastest_alt = min(alternate_routes, key=lambda r: r.get("duration_min", 999))
        
        time_diff = primary_route.get("duration_min", 0) - fastest_alt.get("duration_min", 0)
        safety_diff = primary_route.get("safety_score", 0) - fastest_alt.get("safety_score", 0)
        lighting_diff = primary_route.get("lighting_score", 80) - fastest_alt.get("lighting_score", 60)
        havens_diff = primary_route.get("havens_count", 0) - fastest_alt.get("havens_count", 0)

        # 1. Lighting Coverage
        if lighting_diff > 0:
            highlights.append(f"{lighting_diff}% better street lighting and visibility signals")
        elif primary_route.get("lighting_score", 0) >= 80:
            highlights.append("High street illumination across all segments")

        # 2. Safe Havens & Proximity
        if havens_diff > 0:
            highlights.append(f"{havens_diff} additional verified safe havens along route corridor")
        else:
            highlights.append(f"{primary_route.get('havens_count', 0)} verified safe havens accessible")

        # 3. Resilience Threshold
        max_time = primary_route.get("max_time_to_haven", 0)
        threshold = primary_route.get("threshold_seconds", 120)
        if primary_route.get("meets_threshold", False):
            highlights.append(f"Passes configured {threshold//60}-min resilience threshold (max {max_time}s to help)")
        else:
            highlights.append(f"Maximum time-to-haven estimated at {max_time}s")

        # 4. Incident Signal
        if primary_route.get("incident_safety_score", 80) > fastest_alt.get("incident_safety_score", 60):
            highlights.append("Lower estimated incident-risk signal (commercial avenue corridor)")
        
        # 5. Tradeoff Analysis (Never hide tradeoffs)
        if time_diff > 0:
            tradeoffs.append(f"{time_diff} minutes slower than the fastest alternate route.")
        elif time_diff == 0:
            tradeoffs.append("Equal travel time with improved safety margin.")
        else:
            tradeoffs.append(f"{abs(time_diff)} minutes faster with optimal safety resilience.")

        return {
            "why_this_route": highlights,
            "tradeoff": " ".join(tradeoffs),
            "evidence_metrics": {
                "lighting_differential_pct": lighting_diff,
                "havens_differential": havens_diff,
                "safety_score_differential": safety_diff,
                "travel_time_differential_min": time_diff
            }
        }
