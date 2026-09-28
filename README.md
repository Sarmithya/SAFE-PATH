# SafeRoute 🛡️

**"Navigate Safer, Not Just Faster."**

SafeRoute is a modern, safety-first navigation platform. Unlike conventional map applications that optimize exclusively for speed or distance, SafeRoute calculates dynamic **Safety Resilience** by continuously evaluating proximity to verified safe havens (hospitals, police stations, 24/7 stores, transit hubs), road lighting, foot traffic, and incident signals along every segment of your journey.

---

## 🌟 Core Features

- **Safety Resilience Engine**: Continuous time-to-haven evaluation with configurable thresholds (default 120s).
- **Multi-Factor Safety Scoring**: Composite scoring based on lighting (30%), incidents (25%), foot traffic (25%), and emergency proximity (20%).
- **Explainable AI Recommendations**: Transparent, evidence-backed breakdowns detailing *why* a route was recommended along with honest tradeoff analysis.
- **Live Safety Tracking & Deviation Alerts**: Live route monitoring with automatic "ARE YOU SAFE?" checks if GPS diverges from the planned corridor.
- **One-Tap Emergency Assistance**: Instant routing to the closest verified safe haven, emergency dispatch calling, and trusted contact live sharing.
- **100% Deterministic Demo Mode**: Offline demonstration mode pre-loaded with realistic urban routes and havens.

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm / npx

### 1. Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
python app.py
```
Backend will start at `http://127.0.0.1:5000`.

### 2. Mobile / Web App Setup
```bash
cd mobile
npm install
npx expo start --web
```
Open the browser at `http://localhost:8081` to experience the full SafeRoute application.

---

## 🔒 Security & Privacy Notice
SafeRoute processes location data with privacy-by-design principles. Location signals are utilized strictly for real-time safety analysis during active trips. All scores and time-to-haven estimates are advisory models and do not represent personal safety guarantees.
