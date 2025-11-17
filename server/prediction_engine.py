"""
LightGBM Prediction Engine for Horse Race Ranking and Betting Confidence Scoring

This module loads the pre-trained LightGBM ranking model and provides functions for:
1. Making predictions on horse race data
2. Calculating confidence scores
3. Generating betting signals based on model confidence
"""

import os
import pickle
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple
import json

class PredictionEngine:
    def __init__(self, model_path: str = None, scaler_path: str = None, features_path: str = None):
        """
        Initialize the prediction engine by loading the pre-trained model and scaler.
        
        Args:
            model_path: Path to the LightGBM model pickle file
            scaler_path: Path to the scaler pickle file
            features_path: Path to the feature columns pickle file
        """
        self.model = None
        self.scaler = None
        self.feature_columns = None
        self.model_loaded = False
        
        # Default paths relative to server directory
        if model_path is None:
            model_path = os.path.join(os.path.dirname(__file__), 'lightgbm_model.pkl')
        if scaler_path is None:
            scaler_path = os.path.join(os.path.dirname(__file__), 'scaler.pkl')
        if features_path is None:
            features_path = os.path.join(os.path.dirname(__file__), 'feature_columns.pkl')
        
        try:
            with open(model_path, 'rb') as f:
                self.model = pickle.load(f)
            print(f"✓ LightGBM model loaded from {model_path}")
            
            with open(scaler_path, 'rb') as f:
                self.scaler = pickle.load(f)
            print(f"✓ Scaler loaded from {scaler_path}")
            
            with open(features_path, 'rb') as f:
                self.feature_columns = pickle.load(f)
            print(f"✓ Feature columns loaded from {features_path}")
            
            self.model_loaded = True
        except Exception as e:
            print(f"✗ Error loading model files: {e}")
            self.model_loaded = False
    
    def predict_ranking(self, horses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Predict the ranking of horses in a race.
        
        Args:
            horses: List of horse dictionaries with features
            
        Returns:
            Dictionary with predictions and confidence scores
        """
        if not self.model_loaded:
            return {
                "error": "Model not loaded",
                "predictions": []
            }
        
        try:
            # Convert to DataFrame
            df = pd.DataFrame(horses)
            
            # Select only the required feature columns
            X = df[self.feature_columns].copy()
            
            # Scale the features
            X_scaled = self.scaler.transform(X)
            
            # Get predictions (ranking scores)
            scores = self.model.predict(X_scaled)
            
            # Create result with rankings
            results = []
            for idx, (horse, score) in enumerate(zip(horses, scores)):
                results.append({
                    "horse_name": horse.get("horse_name", f"Horse {idx+1}"),
                    "ranking_score": float(score),
                    "rank": idx + 1,
                    "confidence": self._calculate_confidence(score, scores),
                })
            
            # Sort by ranking score (descending)
            results.sort(key=lambda x: x["ranking_score"], reverse=True)
            
            # Update ranks based on sorted order
            for idx, result in enumerate(results):
                result["rank"] = idx + 1
            
            return {
                "success": True,
                "predictions": results,
                "model_version": "lightgbm_ranker_v1",
                "feature_count": len(self.feature_columns),
            }
        except Exception as e:
            return {
                "error": str(e),
                "predictions": []
            }
    
    def _calculate_confidence(self, score: float, all_scores: np.ndarray) -> float:
        """
        Calculate confidence score for a prediction.
        
        Confidence is based on:
        1. Score magnitude (higher is better)
        2. Score separation from other horses (larger gap = higher confidence)
        
        Args:
            score: The prediction score for this horse
            all_scores: All scores in the race
            
        Returns:
            Confidence score between 0 and 1
        """
        # Normalize score to 0-1 range
        min_score = np.min(all_scores)
        max_score = np.max(all_scores)
        
        if max_score == min_score:
            normalized_score = 0.5
        else:
            normalized_score = (score - min_score) / (max_score - min_score)
        
        # Calculate separation from next closest score
        sorted_scores = np.sort(all_scores)[::-1]
        score_position = np.where(sorted_scores == score)[0]
        
        if len(score_position) > 0 and score_position[0] < len(sorted_scores) - 1:
            next_score = sorted_scores[score_position[0] + 1]
            separation = (score - next_score) / (max_score - min_score) if max_score != min_score else 0
        else:
            separation = 0
        
        # Confidence = 70% from normalized score + 30% from separation
        confidence = (0.7 * normalized_score) + (0.3 * min(separation * 2, 1.0))
        
        return float(np.clip(confidence, 0, 1))
    
    def get_betting_signals(self, predictions: Dict[str, Any], confidence_threshold: float = 0.65) -> Dict[str, Any]:
        """
        Generate betting signals based on model predictions and confidence scores.
        
        Args:
            predictions: Output from predict_ranking()
            confidence_threshold: Minimum confidence to recommend a bet (0-1)
            
        Returns:
            Dictionary with betting signals and recommendations
        """
        if "error" in predictions or not predictions.get("predictions"):
            return {
                "error": "No valid predictions",
                "signals": [],
                "recommendation": "HOLD"
            }
        
        signals = []
        top_predictions = predictions["predictions"][:3]  # Top 3 horses
        
        for pred in top_predictions:
            confidence = pred.get("confidence", 0)
            rank = pred.get("rank", 0)
            
            # Generate signal based on confidence and rank
            if rank == 1 and confidence >= confidence_threshold:
                signal = {
                    "horse_name": pred["horse_name"],
                    "rank": rank,
                    "confidence": confidence,
                    "signal": "STRONG_BUY",
                    "recommendation": "Place WIN bet",
                    "confidence_level": self._confidence_level(confidence),
                    "expected_roi": self._estimate_roi(confidence),
                }
            elif rank <= 2 and confidence >= (confidence_threshold - 0.1):
                signal = {
                    "horse_name": pred["horse_name"],
                    "rank": rank,
                    "confidence": confidence,
                    "signal": "BUY",
                    "recommendation": "Place PLACE or EXACTA bet",
                    "confidence_level": self._confidence_level(confidence),
                    "expected_roi": self._estimate_roi(confidence),
                }
            elif confidence >= (confidence_threshold - 0.15):
                signal = {
                    "horse_name": pred["horse_name"],
                    "rank": rank,
                    "confidence": confidence,
                    "signal": "HOLD",
                    "recommendation": "Consider for TRIFECTA or FIRST FOUR",
                    "confidence_level": self._confidence_level(confidence),
                    "expected_roi": self._estimate_roi(confidence),
                }
            else:
                signal = {
                    "horse_name": pred["horse_name"],
                    "rank": rank,
                    "confidence": confidence,
                    "signal": "WAIT",
                    "recommendation": "Insufficient confidence - wait for better odds",
                    "confidence_level": self._confidence_level(confidence),
                    "expected_roi": self._estimate_roi(confidence),
                }
            
            signals.append(signal)
        
        # Overall recommendation
        top_confidence = top_predictions[0].get("confidence", 0) if top_predictions else 0
        if top_confidence >= confidence_threshold:
            overall_recommendation = "STRONG_BET"
        elif top_confidence >= (confidence_threshold - 0.1):
            overall_recommendation = "BET"
        elif top_confidence >= (confidence_threshold - 0.2):
            overall_recommendation = "CAUTIOUS_BET"
        else:
            overall_recommendation = "HOLD"
        
        return {
            "success": True,
            "signals": signals,
            "overall_recommendation": overall_recommendation,
            "confidence_threshold": confidence_threshold,
            "top_horse": top_predictions[0]["horse_name"] if top_predictions else None,
            "top_confidence": float(top_confidence),
            "race_difficulty": self._assess_race_difficulty(top_predictions),
        }
    
    def _confidence_level(self, confidence: float) -> str:
        """Convert confidence score to human-readable level."""
        if confidence >= 0.85:
            return "VERY_HIGH"
        elif confidence >= 0.75:
            return "HIGH"
        elif confidence >= 0.65:
            return "MODERATE"
        elif confidence >= 0.55:
            return "LOW"
        else:
            return "VERY_LOW"
    
    def _estimate_roi(self, confidence: float) -> str:
        """Estimate expected return on investment based on confidence."""
        # This is a simplified estimation
        # In production, this would use actual historical odds data
        if confidence >= 0.85:
            return "15-25%"
        elif confidence >= 0.75:
            return "10-15%"
        elif confidence >= 0.65:
            return "5-10%"
        elif confidence >= 0.55:
            return "0-5%"
        else:
            return "Negative expected value"
    
    def _assess_race_difficulty(self, top_predictions: List[Dict]) -> str:
        """Assess the difficulty of the race based on prediction spread."""
        if not top_predictions or len(top_predictions) < 2:
            return "UNKNOWN"
        
        top_score = top_predictions[0]["ranking_score"]
        second_score = top_predictions[1]["ranking_score"]
        
        score_gap = top_score - second_score
        
        if score_gap > 0.3:
            return "EASY"  # Clear winner
        elif score_gap > 0.1:
            return "MODERATE"  # Competitive
        else:
            return "DIFFICULT"  # Very close race


# Global instance
_engine = None

def get_prediction_engine() -> PredictionEngine:
    """Get or create the global prediction engine instance."""
    global _engine
    if _engine is None:
        _engine = PredictionEngine()
    return _engine

def predict_ranking(horses: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Convenience function to predict ranking."""
    engine = get_prediction_engine()
    return engine.predict_ranking(horses)

def get_betting_signals(predictions: Dict[str, Any], confidence_threshold: float = 0.65) -> Dict[str, Any]:
    """Convenience function to get betting signals."""
    engine = get_prediction_engine()
    return engine.get_betting_signals(predictions, confidence_threshold)
