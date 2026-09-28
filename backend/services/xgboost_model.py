import os
import numpy as np
import pandas as pd

try:
    import xgboost as xgb
    XGBOOST_PACKAGE_INSTALLED = True
except ImportError:
    XGBOOST_PACKAGE_INSTALLED = False


class XGBoostSafetyModel:
    """
    STAGE 2 — SAFETY SCORING LAYER
    Evaluates candidate routes using XGBoost Regressor ML model.
    Does NOT generate routes. Responsible exclusively for:
    "Which of these realistic routes is safer?"
    """

    FEATURE_NAMES = [
        'streetlights',
        'crime_safety',
        'crowded_area',
        'cctv_coverage',
        'police_patrol',
        'road_condition',
        'accident_rate_safety',
        'resilience_reach_time',
        'time_multiplier'
    ]

    def __init__(self):
        self.model = None
        self.is_trained = False
        self._initialize_and_train()

    def _initialize_and_train(self):
        """Train XGBRegressor on environmental safety training dataset."""
        if not XGBOOST_PACKAGE_INSTALLED:
            print("[XGBoostModel] Warning: xgboost package not installed. Operating in FALLBACK_SCORING mode.")
            self.is_trained = False
            return

        try:
            # Generate feature training vectors (1200 samples) based on safety corridor domain parameters
            np.random.seed(42)
            n_samples = 1200

            streetlights = np.random.uniform(20, 100, n_samples)
            crime_safety = np.random.uniform(30, 100, n_samples)
            crowded_area = np.random.uniform(20, 100, n_samples)
            cctv_coverage = np.random.uniform(20, 100, n_samples)
            police_patrol = np.random.uniform(20, 100, n_samples)
            road_condition = np.random.uniform(30, 100, n_samples)
            accident_rate_safety = np.random.uniform(30, 100, n_samples)
            resilience_time = np.random.uniform(30, 300, n_samples)
            time_mult = np.random.choice([0.85, 0.90, 0.95, 1.0], n_samples)

            resilience_score = np.maximum(0, 100 - (resilience_time / 3.0))
            
            target = (
                0.20 * streetlights +
                0.20 * crime_safety +
                0.15 * crowded_area +
                0.15 * cctv_coverage +
                0.12 * police_patrol +
                0.08 * road_condition +
                0.10 * resilience_score
            ) * time_mult

            target = np.clip(target, 5, 99)

            X = pd.DataFrame({
                'streetlights': streetlights,
                'crime_safety': crime_safety,
                'crowded_area': crowded_area,
                'cctv_coverage': cctv_coverage,
                'police_patrol': police_patrol,
                'road_condition': road_condition,
                'accident_rate_safety': accident_rate_safety,
                'resilience_reach_time': resilience_time,
                'time_multiplier': time_mult
            })
            y = target

            self.model = xgb.XGBRegressor(
                n_estimators=100,
                max_depth=5,
                learning_rate=0.08,
                random_state=42
            )
            self.model.fit(X, y)
            self.is_trained = True
            print("[XGBoostModel] Model initialized: XGBoost Regressor (100 Trees). Status: MODEL_AVAILABLE.")
        except Exception as e:
            print(f"[XGBoostModel] Training initialization error: {e}. Operating in FALLBACK_SCORING mode.")
            self.is_trained = False

    def predict_safety(self, features_dict: dict) -> dict:
        """
        Input dictionary with route environmental signals.
        Returns SafetyScore = ModelPrediction + DataQualityAdjustment
        """
        streetlights = float(features_dict.get('streetlights', 65.0))
        crime_safety = float(features_dict.get('crime_safety', 80.0))
        crowded_area = float(features_dict.get('crowded_area', 70.0))
        cctv_coverage = float(features_dict.get('cctv_coverage', 70.0))
        police_patrol = float(features_dict.get('police_patrol', 75.0))
        road_condition = float(features_dict.get('road_condition', 75.0))
        accident_rate_safety = float(features_dict.get('accident_rate_safety', 80.0))
        resilience_reach_time = float(features_dict.get('resilience_reach_time', 90.0))
        time_multiplier = float(features_dict.get('time_multiplier', 1.0))

        # Evaluate Data Quality & Adjustment
        data_quality_flags = []
        data_quality_adjustment = 0.0

        if 'streetlights' not in features_dict:
            data_quality_flags.append("Estimated baseline streetlights used")
            data_quality_adjustment -= 2.0
        if 'crime_safety' not in features_dict:
            data_quality_flags.append("Historical regional average crime rate applied")
            data_quality_adjustment -= 3.0

        data_quality_status = "HIGH" if len(data_quality_flags) == 0 else "ESTIMATED_BASELINE"

        if self.is_trained and self.model is not None:
            df_in = pd.DataFrame([{
                'streetlights': streetlights,
                'crime_safety': crime_safety,
                'crowded_area': crowded_area,
                'cctv_coverage': cctv_coverage,
                'police_patrol': police_patrol,
                'road_condition': road_condition,
                'accident_rate_safety': accident_rate_safety,
                'resilience_reach_time': resilience_reach_time,
                'time_multiplier': time_multiplier
            }])
            raw_prediction = float(self.model.predict(df_in)[0])
            safety_model_status = "xgboost_trained"
            
            importances = self.model.feature_importances_
            total_imp = sum(importances) or 1.0
            feat_imp = {
                name: round(float(imp / total_imp) * 100, 1)
                for name, imp in zip(self.FEATURE_NAMES, importances)
            }
        else:
            # Explicit FALLBACK_SCORING mode when XGBoost is unavailable
            resilience_score = max(0, 100 - (resilience_reach_time / 3.0))
            raw_prediction = (
                0.20 * streetlights +
                0.20 * crime_safety +
                0.15 * crowded_area +
                0.15 * cctv_coverage +
                0.12 * police_patrol +
                0.08 * road_condition +
                0.10 * resilience_score
            ) * time_multiplier
            safety_model_status = "fallback_scoring"
            feat_imp = {
                'streetlights': 20.0,
                'crime_safety': 20.0,
                'crowded_area': 15.0,
                'cctv_coverage': 15.0,
                'police_patrol': 12.0,
                'resilience_reach_time': 10.0,
                'road_condition': 8.0
            }

        # Formula: SafetyScore = ModelPrediction + DataQualityAdjustment
        final_score = int(round(raw_prediction + data_quality_adjustment))
        final_score = max(1, min(99, final_score))

        # Categorize Safety Level
        if final_score >= 80:
            safety_level = "HIGH"
        elif final_score >= 60:
            safety_level = "MEDIUM"
        else:
            safety_level = "LOW"

        return {
            "safety_score": final_score,
            "raw_model_prediction": round(raw_prediction, 1),
            "data_quality_adjustment": data_quality_adjustment,
            "safety_level": safety_level,
            "safety_model": safety_model_status,
            "data_quality": data_quality_status,
            "data_quality_notes": data_quality_flags,
            "feature_importances": feat_imp,
            "input_features": {
                "streetlights": int(round(streetlights)),
                "crime_safety": int(round(crime_safety)),
                "crowded_area": int(round(crowded_area)),
                "cctv_coverage": int(round(cctv_coverage)),
                "police_patrol": int(round(police_patrol)),
                "road_condition": int(round(road_condition)),
                "accident_rate_safety": int(round(accident_rate_safety)),
                "resilience_reach_time_sec": int(round(resilience_reach_time)),
                "time_multiplier": round(time_multiplier, 2)
            }
        }

_xgb_singleton = None

def get_xgboost_model() -> XGBoostSafetyModel:
    global _xgb_singleton
    if _xgb_singleton is None:
        _xgb_singleton = XGBoostSafetyModel()
    return _xgb_singleton
