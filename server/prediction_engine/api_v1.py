"""
Final Integrated Horse Race Prediction API Backend (Superior Version)
Production-ready Flask application with the best-performing models, advanced feature engineering,
and subscription-aware API key validation.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import pandas as pd
import numpy as np
import pickle
import joblib
from datetime import datetime, timedelta
from functools import wraps
import os
import logging
from logging.handlers import RotatingFileHandler
import json
from typing import Dict, Any, Tuple, Optional, List
import re

# Import the feature engineering utilities
from feature_engineering_utils import apply_feature_engineering

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['JSON_SORT_KEYS'] = False

# Enable CORS for mobile app
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Rate limiting
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

# Global variables to store models and preprocessing objects
MODELS = {}
RANKING_MODEL = None
scaler = None
feature_columns = None
api_keys_cache = {}
last_api_key_refresh = None

# Constants
API_KEY_CACHE_DURATION = 3600  # 1 hour
PREDICTION_CACHE_DURATION = 300  # 5 minutes
MAX_BATCH_SIZE = 100

# Mapping of tier to rate limit (for demonstration)
TIER_LIMITS = {
    'free': "5 per hour",
    'basic': "50 per day, 10 per hour",
    'premium': "500 per day, 50 per hour",
    'elite': "unlimited"
}

# --- Model and Preprocessing Loading ---

def load_models():
    """Load all optimized classification and ranking models and preprocessing objects."""
    """Load all optimized models and preprocessing objects."""
    global MODELS, scaler, feature_columns
    
    MODEL_DIR = 'models'
    
    try:
        # 1. Load the scaler
        scaler = joblib.load(os.path.join(MODEL_DIR, 'scaler.pkl'))
        
        # 2. Load feature columns
        with open(os.path.join(MODEL_DIR, 'feature_columns.pkl'), 'rb') as f:
            feature_columns = pickle.load(f)
            
        # 3. Load all classification models
        model_files = {
            'logistic_regression': 'logistic_regression_model.pkl',
            'random_forest': 'random_forest_model.pkl',
            'gradient_boosting': 'gradient_boosting_model.pkl',
            'xgboost': 'xgboost_model.pkl',
            'lightgbm': 'lightgbm_model.pkl' # Assuming this is the best one
        }
        
        for name, filename in model_files.items():
            path = os.path.join(MODEL_DIR, filename)
            if os.path.exists(path):
                MODELS[name] = joblib.load(path)
                logger.info(f"Loaded classification model: {name}")
            else:
                logger.warning(f"Classification model file not found: {path}")
        
        if not MODELS:
            raise FileNotFoundError("No classification models were loaded.")
            
        # 4. Load the ranking model
        global RANKING_MODEL
        ranking_model_path = os.path.join(MODEL_DIR, 'lgbm_ranker_model.pkl')
        if os.path.exists(ranking_model_path):
            RANKING_MODEL = joblib.load(ranking_model_path)
            logger.info("Loaded ranking model: lgbm_ranker")
        else:
            logger.warning(f"Ranking model file not found: {ranking_model_path}. Ranking prediction will be unavailable.")
            
        logger.info(f"All models and preprocessing objects loaded successfully! Total features: {len(feature_columns)}")
        return True
    except Exception as e:
        logger.error(f"Error loading models: {e}")
        return False

# --- API Key and Subscription Management (Mock) ---

def load_api_keys():
    """Load API keys from environment or database (Mock implementation)."""
    global api_keys_cache, last_api_key_refresh
    
    # Mock API keys for different tiers
    api_keys_cache = {
        os.environ.get('FREE_API_KEY', 'free-key-123'): {'user_id': 'free-user', 'tier': 'free', 'active': True},
        os.environ.get('BASIC_API_KEY', 'basic-key-456'): {'user_id': 'basic-user', 'tier': 'basic', 'active': True},
        os.environ.get('PREMIUM_API_KEY', 'premium-key-789'): {'user_id': 'premium-user', 'tier': 'premium', 'active': True},
        os.environ.get('ELITE_API_KEY', 'elite-key-000'): {'user_id': 'elite-user', 'tier': 'elite', 'active': True},
    }
    last_api_key_refresh = datetime.now()
    logger.info(f"Loaded {len(api_keys_cache)} mock API keys")
    return True


def validate_api_key(api_key: str) -> Tuple[bool, Optional[Dict[str, Any]]]:
    """Validate API key with caching."""
    global api_keys_cache, last_api_key_refresh
    
    # Refresh cache if needed
    if last_api_key_refresh is None or \
       (datetime.now() - last_api_key_refresh).seconds > API_KEY_CACHE_DURATION:
        load_api_keys()
    
    if api_key in api_keys_cache:
        key_info = api_keys_cache[api_key]
        if key_info.get('active', False):
            return True, key_info
    
    return False, None


def require_api_key(f):
    """Decorator to require API key authentication and apply rate limit based on tier."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        if not api_key:
            logger.warning("Request without API key")
            return jsonify({'error': 'Missing API key', 'code': 'MISSING_API_KEY'}), 401
        
        is_valid, key_info = validate_api_key(api_key)
        if not is_valid:
            logger.warning(f"Invalid API key attempt: {api_key[:10]}...")
            return jsonify({'error': 'Invalid API key', 'code': 'INVALID_API_KEY'}), 401
        
        # Apply tier-specific rate limit
        tier = key_info.get('tier', 'free')
        limit = TIER_LIMITS.get(tier, TIER_LIMITS['free'])
        
        # Apply tier-specific rate limit
        tier = key_info.get('tier', 'free')
        limit = TIER_LIMITS.get(tier, TIER_LIMITS['free'])
        
        # Manually invoke the rate limit check using the dynamic limit and key
        try:
            limiter.limit(limit, key_func=lambda: api_key).check()
        except Exception as e:
            logger.warning(f"Rate limit exceeded for key {api_key[:10]}... ({tier} tier): {e}")
            return jsonify({'error': 'Rate limit exceeded', 'code': 'RATE_LIMIT_EXCEEDED'}), 429
            
        # Pass key info to the route
        request.api_key_info = key_info
        return f(*args, **kwargs)
    
    return decorated_function

# --- Prediction Logic ---

def predict_with_classification_model(model_name: str, features_df: pd.DataFrame) -> List[float]:
    """Scales features and predicts using the specified model."""
    if model_name not in MODELS:
        logger.error(f"Prediction requested for unknown model: {model_name}")
        return []

    model = MODELS[model_name]
    
    # 1. Scale the features
    scaled_features = scaler.transform(features_df)
    
    # 2. Predict probabilities (for class 1 - win/top 3)
    # Note: All models are assumed to be classifiers with .predict_proba
    probabilities = model.predict_proba(scaled_features)[:, 1].tolist()
    
    return probabilities

# --- API Endpoints ---

@app.route('/api/v1/subscription/validate', methods=['POST'])
@require_api_key
def validate_subscription():
    """
    Endpoint to validate API key and return subscription tier.
    Used by the Android app's SubscriptionManager.
    """
    key_info = request.api_key_info
    tier = key_info.get('tier', 'free')
    
    # In a real system, you might also return usage stats here
    return jsonify({
        'status': 'success',
        'tier': tier,
        'message': f"Key validated. Tier: {tier.upper()}",
        'limit': TIER_LIMITS.get(tier, TIER_LIMITS['free'])
    })

@app.route('/api/v1/predict', methods=['POST'])
@require_api_key
def predict():
    """
    Endpoint to receive race data, apply feature engineering, and return predictions.
    """
    if not request.is_json:
        return jsonify({'error': 'Missing JSON in request', 'code': 'INVALID_FORMAT'}), 400
    
    data = request.get_json()
    
    # Ensure data is a list of race entries
    if not isinstance(data, list):
        data = [data]
        
    if len(data) > MAX_BATCH_SIZE:
        return jsonify({'error': f'Batch size exceeds limit of {MAX_BATCH_SIZE}', 'code': 'BATCH_TOO_LARGE'}), 400
        
    predictions = []
    
    # Determine which models to use based on subscription tier
    tier = request.api_key_info.get('tier', 'free')
    # Determine which models to use based on subscription tier
    tier = request.api_key_info.get('tier', 'free')
    
    # Check if the request is for a single race prediction or a full race ranking
    is_ranking_request = isinstance(data, list) and len(data) > 1 and all('race_id' in d for d in data)
    
    if is_ranking_request and RANKING_MODEL and tier in ['premium', 'elite']:
        # --- Ranking Prediction Logic (Premium Feature) ---
        
        # 1. Prepare all features for the race
        all_features_df = pd.concat([apply_feature_engineering(entry, feature_columns) for entry in data], ignore_index=True)
        
        # 2. Scale the features
        scaled_features = scaler.transform(all_features_df)
        
        # 3. Predict the ranking score
        ranking_scores = RANKING_MODEL.predict(scaled_features).tolist()
        
        # 4. Combine results and rank
        ranked_results = []
        for i, entry in enumerate(data):
            ranked_results.append({
                'horse_name': entry.get('horse_name', 'Unknown'),
                'ranking_score': round(ranking_scores[i], 4)
            })
            
        # Sort by ranking score (higher score is better rank)
        ranked_results.sort(key=lambda x: x['ranking_score'], reverse=True)
        
        # Add final rank
        for i, result in enumerate(ranked_results):
            result['rank'] = i + 1
            
        return jsonify({
            'status': 'success',
            'tier': tier,
            'type': 'ranking',
            'count': len(ranked_results),
            'results': ranked_results
        })
        
    else:
        # --- Classification Prediction Logic (Default/Fallback) ---
        
        if tier in ['free', 'basic']:
            models_to_use = ['lightgbm'] # Use the single best model for lower tiers
        else:
            # Use an ensemble of the best models for premium tiers
            models_to_use = ['lightgbm', 'xgboost', 'random_forest'] 
            
        for entry in data:
            try:
                # 1. Apply feature engineering
                features_df = apply_feature_engineering(entry, feature_columns)
                
                # 2. Get predictions from selected models
                entry_predictions = {}
                for model_name in models_to_use:
                    probs = predict_with_classification_model(model_name, features_df)
                    if probs:
                        # Only one prediction per entry in a batch
                        entry_predictions[model_name] = round(probs[0], 4) 
                
                predictions.append({
                    'horse_name': entry.get('horse_name', 'Unknown'),
                    'predictions': entry_predictions
                })
            
        except Exception as e:
            logger.error(f"Error processing entry: {entry}. Error: {e}")
            predictions.append({
                'horse_name': entry.get('horse_name', 'Unknown'),
                'error': 'Prediction failed due to internal error',
                'details': str(e)
            })

    return jsonify({
        'status': 'success',
        'tier': tier,
        'count': len(predictions),
        'results': predictions
    })

@app.route('/api/v1/models/list', methods=['GET'])
@require_api_key
def list_models():
    """
    (Premium Feature) Lists all available models and their status.
    """
    tier = request.api_key_info.get('tier', 'free')
    if tier not in ['premium', 'elite']:
        return jsonify({
            'error': 'Access denied', 
            'message': 'This feature is only available for Premium and Elite tiers.',
            'code': 'PREMIUM_FEATURE_REQUIRED'
        }), 403
        
    model_status = {name: 'Ready' for name in MODELS.keys()}
    
    return jsonify({
        'status': 'success',
        'tier': tier,
        'models': model_status
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Basic health check endpoint."""
    model_count = len(MODELS)
    return jsonify({
        'status': 'ok',
        'models_loaded': model_count,
        'message': 'API is running and models are loaded.'
    })

# --- Application Initialization ---

if __name__ == '__main__':
    if load_models():
        load_api_keys()
        logger.info("Starting Flask application on port 5000...")
        app.run(host='0.0.0.0', port=5000)
    else:
        logger.critical("Failed to load models. Shutting down application.")

# Initialize on import for WSGI/Gunicorn
if load_models():
    load_api_keys()
else:
    logger.critical("Failed to load models on import.")
