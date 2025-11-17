"""
Horse Race Prediction API Backend - Enhanced with Oracle Engine
This Flask application provides endpoints for predicting horse race winners
and sequences of four consecutive race winners using machine learning models
trained on historical New Zealand TAB data and global Betfair data.
"""

from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
import pickle
import joblib
from datetime import datetime
from functools import wraps
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

# Global variables to store models and scalers
models = {}
scaler = None
feature_columns = None

def load_models():
    """Load trained models and preprocessing objects."""
    global models, scaler, feature_columns
    
    try:
        # Load all trained models
        models['gradient_boosting'] = joblib.load('gradient_boosting_model.pkl')
        models['random_forest'] = joblib.load('random_forest_model.pkl')
        models['logistic_regression'] = joblib.load('logistic_regression_model.pkl')
        models['xgboost'] = joblib.load('xgboost_model.pkl')
        models['lightgbm'] = joblib.load('lightgbm_model.pkl')
        
        # Load the scaler
        scaler = joblib.load('scaler.pkl')
        
        # Load feature columns
        with open('feature_columns.pkl', 'rb') as f:
            feature_columns = pickle.load(f)
        
        print("Models loaded successfully!")
        return True
    except Exception as e:
        print(f"Error loading models: {e}")
        return False

def require_api_key(f):
    """Decorator to require API key authentication."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        if not api_key or not validate_api_key(api_key):
            return jsonify({'error': 'Invalid or missing API key'}), 401
        return f(*args, **kwargs)
    return decorated_function

def validate_api_key(api_key):
    """Validate API key (placeholder - implement with database in production)."""
    # In production, this would check against a database of valid API keys
    valid_keys = [os.environ.get('DEMO_API_KEY', 'demo-key-12345')]
    return api_key in valid_keys

def prepare_features(data):
    """
    Prepare input data for prediction.
    
    Args:
        data: Dictionary containing race and horse information
        
    Returns:
        DataFrame with engineered features aligned with training data
    """
    # Create a DataFrame from the input data
    df = pd.DataFrame([data])
    
    # Parse date if provided
    if 'date' in df.columns:
        df['date_parsed'] = pd.to_datetime(df['date'], errors='coerce')
        df['year'] = df['date_parsed'].dt.year
        df['month'] = df['date_parsed'].dt.month
        df['day'] = df['date_parsed'].dt.day
        df['day_of_week'] = df['date_parsed'].dt.dayofweek
        df['week_of_year'] = df['date_parsed'].dt.isocalendar().week.astype(int)
    
    # Ensure all feature columns exist
    for col in feature_columns:
        if col not in df.columns:
            df[col] = 0
    
    # Select only the features used in training
    X = df[feature_columns]
    
    return X

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

@app.route('/predict', methods=['POST'])
@require_api_key
def predict():
    """
    Predict horse race winner.
    
    Expected JSON input:
    {
        "horse_name": "Horse Name",
        "track": "Track Name",
        "race_type": "Race Type",
        "distance": 1400,
        "date": "2024-10-23",
        "days_since_last_race": 14,
        "PREV_RACE_WON": 1,
        "WIN_STREAK": 2,
        "IMPLIED_PROBABILITY": 0.25,
        "NORMALIZED_VOLUME": 0.15,
        "MARKET_ACTIVITY_WINDOW_HOURS": 4.5
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No input data provided'}), 400
        
        # Prepare features
        X = prepare_features(data)
        
        # Make predictions with all models
        predictions = {}
        
        # Gradient Boosting (best model)
        gb_pred = models['gradient_boosting'].predict(X)[0]
        gb_proba = models['gradient_boosting'].predict_proba(X)[0]
        predictions['gradient_boosting'] = {
            'prediction': int(gb_pred),
            'probability': float(gb_proba[1]),
            'confidence': float(max(gb_proba))
        }
        
        # Random Forest
        rf_pred = models['random_forest'].predict(X)[0]
        rf_proba = models['random_forest'].predict_proba(X)[0]
        predictions['random_forest'] = {
            'prediction': int(rf_pred),
            'probability': float(rf_proba[1]),
            'confidence': float(max(rf_proba))
        }
        
        # Logistic Regression (requires scaled data)
        X_scaled = scaler.transform(X)
        lr_pred = models['logistic_regression'].predict(X_scaled)[0]
        lr_proba = models['logistic_regression'].predict_proba(X_scaled)[0]
        predictions['logistic_regression'] = {
            'prediction': int(lr_pred),
            'probability': float(lr_proba[1]),
            'confidence': float(max(lr_proba))
        }
        
        # XGBoost
        xgb_proba = models['xgboost'].predict_proba(X)[0]
        predictions['xgboost'] = {
            'prediction': int(models['xgboost'].predict(X)[0]),
            'probability': float(xgb_proba[1]),
            'confidence': float(max(xgb_proba))
        }
        
        # LightGBM
        lgb_proba = models['lightgbm'].predict_proba(X)[0]
        predictions['lightgbm'] = {
            'prediction': int(models['lightgbm'].predict(X)[0]),
            'probability': float(lgb_proba[1]),
            'confidence': float(max(lgb_proba))
        }
        
        # Ensemble prediction (average of probabilities from all models)
        ensemble_proba = (gb_proba[1] + rf_proba[1] + lr_proba[1] + xgb_proba[1] + lgb_proba[1]) / 5
        ensemble_pred = 1 if ensemble_proba >= 0.5 else 0
        
        response = {
            'input': data,
            'predictions': predictions,
            'ensemble': {
                'prediction': ensemble_pred,
                'probability': float(ensemble_proba),
                'confidence': float(max(ensemble_proba, 1 - ensemble_proba))
            },
            'timestamp': datetime.now().isoformat(),
            'model_version': '2.0-oracle-engine'
        }
        
        return jsonify(response), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/batch_predict', methods=['POST'])
@require_api_key
def batch_predict():
    """
    Batch predict for multiple races.
    
    Expected JSON input:
    {
        "races": [
            { "horse_name": "Horse 1", "track": "Track 1", ... },
            { "horse_name": "Horse 2", "track": "Track 2", ... }
        ]
    }
    """
    try:
        data = request.get_json()
        races = data.get('races', [])
        
        if not races:
            return jsonify({'error': 'No races provided'}), 400
        
        results = []
        for race in races:
            try:
                X = prepare_features(race)
                
                # Use ensemble prediction (average of all models)
                gb_proba = models['gradient_boosting'].predict_proba(X)[0][1]
                rf_proba = models['random_forest'].predict_proba(X)[0][1]
                X_scaled = scaler.transform(X)
                lr_proba = models['logistic_regression'].predict_proba(X_scaled)[0][1]
                xgb_proba = models['xgboost'].predict_proba(X)[0][1]
                lgb_proba = models['lightgbm'].predict_proba(X)[0][1]
                
                ensemble_proba = (gb_proba + rf_proba + lr_proba + xgb_proba + lgb_proba) / 5
                ensemble_pred = 1 if ensemble_proba >= 0.5 else 0
                
                results.append({
                    'horse_name': race.get('horse_name', 'Unknown'),
                    'prediction': ensemble_pred,
                    'probability': float(ensemble_proba),
                    'status': 'success'
                })
            except Exception as e:
                results.append({
                    'horse_name': race.get('horse_name', 'Unknown'),
                    'status': 'error',
                    'error': str(e)
                })
        
        return jsonify({
            'results': results,
            'timestamp': datetime.now().isoformat()
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/predict_streak', methods=['POST'])
@require_api_key
def predict_streak():
    """
    Predict the probability of winning four consecutive races.
    
    Expected JSON input:
    {
        "races": [
            { "horse_name": "Horse 1", "track": "Track 1", ... },
            { "horse_name": "Horse 2", "track": "Track 2", ... },
            { "horse_name": "Horse 3", "track": "Track 3", ... },
            { "horse_name": "Horse 4", "track": "Track 4", ... }
        ]
    }
    
    Returns the probability of the same horse winning all four consecutive races.
    """
    try:
        data = request.get_json()
        races = data.get('races', [])
        
        if len(races) != 4:
            return jsonify({'error': 'Exactly 4 races must be provided for streak prediction'}), 400
        
        # Calculate win probabilities for each race
        win_probabilities = []
        predictions_detail = []
        
        for i, race in enumerate(races):
            try:
                X = prepare_features(race)
                
                # Use the best model (LightGBM with highest ROC-AUC)
                proba = models['lightgbm'].predict_proba(X)[0][1]
                win_probabilities.append(proba)
                
                predictions_detail.append({
                    'race_number': i + 1,
                    'horse_name': race.get('horse_name', 'Unknown'),
                    'win_probability': float(proba),
                    'status': 'success'
                })
            except Exception as e:
                return jsonify({
                    'error': f'Error processing race {i + 1}: {str(e)}'
                }), 400
        
        # Calculate streak probability (product of individual probabilities)
        streak_probability = np.prod(win_probabilities)
        
        # Calculate the odds of the streak (1 in X)
        streak_odds = 1 / streak_probability if streak_probability > 0 else float('inf')
        
        response = {
            'streak_probability': float(streak_probability),
            'streak_odds': float(streak_odds) if streak_probability > 0 else None,
            'individual_probabilities': [float(p) for p in win_probabilities],
            'predictions_detail': predictions_detail,
            'interpretation': f"The probability of the same horse winning all 4 consecutive races is {streak_probability:.6f} (approximately 1 in {streak_odds:.0f})" if streak_probability > 0 else "Streak probability is zero",
            'timestamp': datetime.now().isoformat(),
            'model_version': '2.0-oracle-engine'
        }
        
        return jsonify(response), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/model_info', methods=['GET'])
def model_info():
    """Get information about available models."""
    return jsonify({
        'models': list(models.keys()),
        'feature_count': len(feature_columns),
        'features': feature_columns,
        'new_sequential_features': ['PREV_RACE_WON', 'WIN_STREAK'],
        'new_market_features': ['IMPLIED_PROBABILITY', 'NORMALIZED_VOLUME', 'MARKET_ACTIVITY_WINDOW_HOURS'],
        'timestamp': datetime.now().isoformat()
    }), 200

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Load models on startup
    if load_models():
        print("Starting Horse Race Prediction API (Oracle Engine v2.0)...")
        app.run(debug=False, host='0.0.0.0', port=5000)
    else:
        print("Failed to load models. Please ensure model files are available.")

