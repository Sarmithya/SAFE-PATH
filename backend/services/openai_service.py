import os
import json
import requests
from typing import Dict, Any, Optional
from backend.config import Config

class OpenAIService:
    """
    OpenAI LLM Integration Service.
    When an API key is provided, uses GPT models for advanced conversational route parsing,
    situational risk evaluation, and customized safety recommendations.
    Falls back gracefully to deterministic rule-based parsing if key is absent.
    """

    @staticmethod
    def is_configured() -> bool:
        key = Config.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY", "")
        return bool(key and len(key.strip()) > 10 and not key.startswith("your_"))

    @staticmethod
    def parse_with_llm(prompt: str) -> Optional[Dict[str, Any]]:
        api_key = Config.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY", "")
        if not OpenAIService.is_configured():
            return None

        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        system_instruction = (
            "You are SafeRoute AI Assistant. Analyze user travel queries and extract structured JSON with:\n"
            "- destination (string)\n"
            "- origin (string, default 'Current Location')\n"
            "- arrival_time (string, e.g. '10:00 AM' or 'Now')\n"
            "- departure_time (string, default 'Now')\n"
            "- safety_preference (one of 'safest', 'balanced', 'fastest')\n"
            "- vehicle (one of 'walking', 'personal_vehicle', 'bus', 'cab', 'auto')\n"
            "- summary (brief sentence explaining the safety route choice)\n"
            "Return STRICT JSON only without markdown code blocks."
        )

        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2,
            "max_tokens": 200
        }

        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=6)
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"].strip()
                # Strip markdown fences if present
                if content.startswith("```"):
                    content = content.split("```")[1]
                    if content.startswith("json"):
                        content = content[4:].strip()
                parsed = json.loads(content)
                parsed["source"] = "OpenAI GPT-4o-mini (Live API Key)"
                return parsed
        except Exception as e:
            print(f"[OpenAIService] OpenAI live query error: {e}")

        return None
