# SafeRoute Setup & Hackathon Demonstration Guide

## 1. System Requirements
- Python 3.10+ (tested on Python 3.13)
- Modern Web Browser (Chrome, Edge, Firefox)

---

## 2. Instant Start (Recommended)
You can launch the full SafeRoute application and view the interactive mobile UI immediately in your browser:

### Option A: One-Click Launcher (PowerShell)
```powershell
cd C:\Users\noora_agyx4l5\.gemini\antigravity\scratch\SafeRoute
.\run_demo.ps1
```

### Option B: Direct Python Start
```powershell
cd C:\Users\noora_agyx4l5\.gemini\antigravity\scratch\SafeRoute
python backend/app.py
```
Open **`http://127.0.0.1:5000`** in Microsoft Edge or Chrome.

---

## 3. Terminal Demonstration Simulator
To run the automated 5-step scenario directly in your console:
```powershell
cd C:\Users\noora_agyx4l5\.gemini\antigravity\scratch\SafeRoute
python demo_cli.py
```

---

## 4. Primary Hackathon Demonstration Flow (judge-winning path)
1. **Home Screen**:
   - Origin: `College Gate`
   - Destination: `Central Library`
   - Set Optimization to **Safest (Max Havens)**.
   - Click **"Find Safe Routes 🛡️"**.
2. **Route Comparison (Primary Screen)**:
   - **Route A**: Safety Score **87/100**, Resilience: **PASS**, Max Help: **1.8 min**, Safe Havens: **5**, Tradeoff: *"4 minutes slower than fastest route"*.
   - **Route B**: Safety Score **72/100**, Resilience: **WARNING**, Max Help: **5.0 min**, Safe Havens: **2**.
   - Click **"Start Safe Journey 🚀"** on Route A.
3. **Live Journey Tracking**:
   - Status shows **OPTIMAL (GREEN)**.
   - Nearest sanctuary: **City General Hospital (90 seconds away)**.
   - Click **"GPS Step ›"** to advance user dot.
4. **Trigger Route Deviation**:
   - Click **"SIMULATE DEVIATION ⚠️"**.
   - Status flashes **ALERT: ROUTE DEVIATION (RED)**.
   - The **"ARE YOU SAFE?"** modal automatically pops up.
5. **Emergency Protocol**:
   - Click **"NO, I'M NOT SAFE 🚨"**.
   - Direct sanctuary routing opens to **City General Hospital (90s away, 110m)**.
   - Test **"CALL POLICE (100)"**, **"CALL AMBULANCE (108)"**, and **"SHARE LIVE LOCATION"**.
6. **AI Assistant**:
   - Click **"AI ✨"** in the bottom nav.
   - Enter *"Is it safe to walk from College Gate to Central Library at 10 PM? I want the safest route."*
   - The assistant extracts origin/destination/preference and **automatically calculates scored routes**.

## 5. Judge talking points (keep this tight)
- Conventional maps optimize time. Safe Path scores **lighting, incidents, crowd, CCTV, and time-to-haven**.
- Recommendation is **explainable** (Why This Path? + XGBoost feature weights).
- Live loop is real: journey record → GPS step → deviation API → safety check → sanctuary reroute.
- Emergency SMS is Twilio-ready; without keys it still completes the demo as a simulated dispatch.
