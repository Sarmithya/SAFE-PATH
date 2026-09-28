# 🤖 AI Integration Guide — SafeRoute Explainable AI

SafeRoute uses a deterministic safety scoring engine (`safety/services.py`) that generates route explanations.  
This guide shows how to **replace or augment** that static engine with any third-party LLM.

---

## Supported Providers

| Provider | Model | SDK |
|----------|-------|-----|
| **OpenAI** | GPT-4o, GPT-4, GPT-3.5-turbo | `openai` |
| **Anthropic** | Claude 3.5 Sonnet, Claude 3 Opus | `anthropic` |
| **Google** | Gemini 1.5 Pro / Flash | `google-generativeai` |
| **Cohere** | Command-R, Command-R+ | `cohere` |
| **Groq** | Llama 3 (fast inference) | `groq` |

---

## Step 1 — Install the SDK

```bash
# Pick ONE of these depending on your preferred provider
pip install openai              # OpenAI
pip install anthropic           # Anthropic / Claude
pip install google-generativeai # Google Gemini
pip install cohere              # Cohere
pip install groq                # Groq (Llama 3)
```

---

## Step 2 — Add API Key to `.env`

Open `SafeRoute/.env` and add your key:

```env
# Add exactly ONE of these
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
COHERE_API_KEY=...
GROQ_API_KEY=gsk_...

# Tell SafeRoute which provider to use
EXPLAINABLE_AI_PROVIDER=openai   # openai | anthropic | gemini | cohere | groq
```

---

## Step 3 — Update `safety/services.py`

Replace or extend the `SafetyEngine._generate_explanation()` method (currently returning a static string) with the snippet for your chosen provider.

### Option A — OpenAI (GPT-4o)

```python
import os
import openai

def _generate_explanation(self, route: dict) -> str:
    client = openai.OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    prompt = (
        f"You are a safety navigation AI. Explain in 2-3 sentences why route "
        f"'{route['name']}' with safety score {route['safety_score']}/100 is recommended. "
        f"Factors: lighting {route.get('lighting_score',90)}%, "
        f"crowd {route.get('foot_traffic_score',85)}%, "
        f"havens {route.get('havens_count',3)}, "
        f"resilience {route.get('resilience_status','PASS')}."
    )
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=120,
        temperature=0.4
    )
    return response.choices[0].message.content.strip()
```

---

### Option B — Anthropic Claude

```python
import os
import anthropic

def _generate_explanation(self, route: dict) -> str:
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    prompt = (
        f"Explain why route '{route['name']}' (score {route['safety_score']}/100) is the "
        f"safest choice. Lighting: {route.get('lighting_score',90)}%, "
        f"Havens: {route.get('havens_count',3)}, "
        f"Resilience: {route.get('resilience_status','PASS')}. Two sentences max."
    )
    message = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=120,
        messages=[{"role": "user", "content": prompt}]
    )
    return message.content[0].text.strip()
```

---

### Option C — Google Gemini

```python
import os
import google.generativeai as genai

def _generate_explanation(self, route: dict) -> str:
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    model = genai.GenerativeModel("gemini-1.5-flash")
    prompt = (
        f"In 2 sentences explain why route '{route['name']}' "
        f"(safety score {route['safety_score']}/100, havens: {route.get('havens_count',3)}, "
        f"resilience: {route.get('resilience_status','PASS')}) is recommended for safe navigation."
    )
    response = model.generate_content(prompt)
    return response.text.strip()
```

---

### Option D — Groq (Llama 3, fastest)

```python
import os
from groq import Groq

def _generate_explanation(self, route: dict) -> str:
    client = Groq(api_key=os.environ["GROQ_API_KEY"])
    prompt = (
        f"Route '{route['name']}' safety score: {route['safety_score']}/100. "
        f"Havens: {route.get('havens_count',3)}. Lighting: {route.get('lighting_score',90)}%. "
        f"Explain in 2 sentences why this is the safest path."
    )
    chat_completion = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="llama3-8b-8192",
    )
    return chat_completion.choices[0].message.content.strip()
```

---

## Step 4 — Auto-Select Provider in `SafetyEngine`

Add a factory at the top of `safety/services.py` to pick provider from env:

```python
import os

_AI_PROVIDER = os.getenv("EXPLAINABLE_AI_PROVIDER", "static")

class SafetyEngine:
    def _generate_explanation(self, route):
        if _AI_PROVIDER == "openai":
            return self._explain_openai(route)
        elif _AI_PROVIDER == "anthropic":
            return self._explain_anthropic(route)
        elif _AI_PROVIDER == "gemini":
            return self._explain_gemini(route)
        elif _AI_PROVIDER == "groq":
            return self._explain_groq(route)
        else:
            # Default static fallback — works without any API key
            return (
                f"{route['name']} is recommended because it maintains consistent street "
                f"lighting ({route.get('lighting_score', 90)}%), has {route.get('havens_count', 3)} "
                f"verified 24/7 sanctuaries, and passes the 120-second safety resilience threshold."
            )
```

---

## Step 5 — Test It

```bash
# From the SafeRoute directory
python manage.py test safety --verbosity 2
```

Also call the route comparison API and check the `recommendation_explanation` field in the response:

```bash
curl -X POST http://localhost:8000/api/routes/compare \
  -H "Content-Type: application/json" \
  -d '{"origin":"MG Road","destination":"Indiranagar","vehicle":"walking"}'
```

The `recommendation_explanation` field in each route object will now contain the LLM-generated text.

---

## Cost Estimates (for reference)

| Provider | Model | Cost per explanation (~120 tokens) |
|----------|-------|-----------------------------------|
| OpenAI | GPT-4o | ~\$0.0003 |
| Anthropic | Claude 3.5 Sonnet | ~\$0.0003 |
| Google | Gemini 1.5 Flash | ~\$0.000004 |
| Groq | Llama 3 8B | **Free** (generous free tier) |

> **Tip**: For a hackathon, **Groq** (Llama 3) is the best choice — it's free, extremely fast (sub-100ms), and requires no credit card.

---

*Generated by Antigravity — SafeRoute AI Integration Guide v1.0*
