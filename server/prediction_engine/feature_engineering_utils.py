import pandas as pd
import numpy as np
import re
from datetime import timedelta
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

# --- Utility Functions (Copied from data_analysis_and_feature_engineering_final.py) ---

def parse_date(date_str: str) -> Optional[pd.Timestamp]:
    """Converts the date string (e.g., '23 Sep 00') to a datetime object."""
    if not isinstance(date_str, str):
        return None
    try:
        day, month_abbr, year_short = date_str.split()
        year = int(year_short)
        if 0 <= year <= 99:
            full_year = 2000 + year if year <= 25 else 1900 + year
        else:
            full_year = year

        return pd.to_datetime(f"{day} {month_abbr} {full_year}", format='%d %b %Y', errors='coerce')
    except Exception:
        return None

def clean_position(pos_str: str) -> Optional[int]:
    """Converts position string (e.g., '1st') to a numerical rank."""
    if isinstance(pos_str, str):
        pos_str = pos_str.lower().strip()
        match = re.match(r'(\d+)(st|nd|rd|th)', pos_str)
        if match:
            return int(match.group(1))
        # Assign high numbers for non-finishers
        elif pos_str in ['fell', 'pulled up', 'disqualified', 'refused']:
            return 999
        elif pos_str == 'last':
            return 998
    return None

def extract_race_class(details: str, stakes: str) -> int:
    """Extracts a numerical race class score based on stakes and details."""
    details_stakes = (details or '') + ' ' + (stakes or '')
    if not isinstance(details_stakes, str):
        return 0
    
    details_stakes = details_stakes.lower()
    
    if 'group 1' in details_stakes or 'grp 1' in details_stakes or 'g1' in details_stakes:
        return 5
    if 'group 2' in details_stakes or 'grp 2' in details_stakes or 'g2' in details_stakes:
        return 4
    if 'group 3' in details_stakes or 'grp 3' in details_stakes or 'g3' in details_stakes:
        return 3
    if 'listed' in details_stakes:
        return 2
    
    if any(keyword in details_stakes for keyword in ['cup', 'classic', 'guineas', 'stakes', 'trophy']):
        return 1
        
    return 0

# --- Simplified Feature Engineering for API (Single Row Prediction) ---

def apply_feature_engineering(
    raw_data: Dict[str, Any], 
    feature_columns: List[str], 
    historical_data: Optional[pd.DataFrame] = None
) -> pd.DataFrame:
    """
    Applies the necessary feature engineering steps to a single raw data entry.
    
    NOTE: The original feature engineering relied on historical data for rolling/decay features.
    For the API, we must simplify or use pre-calculated features. Since the original
    model was trained on the full set of features, we must provide placeholders for 
    the complex time-series features. The model will rely heavily on the simpler,
    race-specific features.
    
    The `historical_data` parameter is included for future enhancement but is ignored here.
    """
    
    # 1. Create a DataFrame from the single input
    df = pd.DataFrame([raw_data])
    
    # --- 2. Basic Cleaning and Date Parsing ---
    df["date_parsed"] = df["date"].apply(parse_date)
    df["distance_numeric"] = df["distance"].astype(str).str.replace('m', '', regex=False).astype(float)
    
    # --- 3. Race Quality and Track Features ---
    details = df['details'].iloc[0] if 'details' in df.columns else ''
    stakes = df['stakes'].iloc[0] if 'stakes' in df.columns else ''
    df["race_class_score"] = extract_race_class(details, stakes)
    
    # --- 4. Time-Series Feature Placeholders ---
    # These features require historical data which is not available for a single API call.
    # We must fill them with a consistent value (e.g., 0 or the mean from the training set)
    # The actual mean/std from the training set should be loaded with the model, but for 
    # simplicity in this consolidation step, we use 0.
    
    # Features to be mocked/filled with 0:
    # 'days_since_last_race'
    # 'horse_name_decay_form_90'
    # 'horse_rank_rolling_mean_10'
    # 'horse_rank_rolling_std_10'
    # 'horse_top3_rate_rolling_mean_5'
    # 'horse_top3_rate_rolling_std_5'
    # 'prev_perf_index'
    # 'horse_perf_avg_rolling_mean_5'
    # 'horse_perf_avg_rolling_std_5'
    
    # For a real production system, the mean/std of these features from the training set 
    # would be saved with the scaler and used for imputation.
    
    # Mocking the complex features with 0.0
    mock_features = {
        'days_since_last_race': 0.0,
        'horse_name_decay_form_90': 0.0,
        'horse_rank_rolling_mean_10': 0.0,
        'horse_rank_rolling_std_10': 0.0,
        'horse_top3_rate_rolling_mean_5': 0.0,
        'horse_top3_rate_rolling_std_5': 0.0,
        'prev_perf_index': 0.0,
        'horse_perf_avg_rolling_mean_5': 0.0,
        'horse_perf_avg_rolling_std_5': 0.0,
        'track_dist_avg_pos': 0.0 # Also requires historical data
    }
    
    for col, val in mock_features.items():
        df[col] = val
        
    # --- 5. Categorical Features (One-Hot Encoding) ---
    
    # Get the unique track and race_type values from the input
    track = df['track'].iloc[0] if 'track' in df.columns else ''
    race_type = df['race_type'].iloc[0] if 'race_type' in df.columns else ''
    
    # Create a dummy DataFrame with all expected one-hot columns initialized to 0
    df_processed = pd.DataFrame(0, index=df.index, columns=feature_columns)
    
    # Map the simple features
    simple_features = ['distance_numeric', 'race_class_score'] + list(mock_features.keys())
    for col in simple_features:
        if col in df.columns and col in df_processed.columns:
            df_processed[col] = df[col]
            
    # Map the one-hot encoded features
    if f'track_{track}' in df_processed.columns:
        df_processed[f'track_{track}'] = 1
    if f'race_type_{race_type}' in df_processed.columns:
        df_processed[f'race_type_{race_type}'] = 1

    # Ensure the final DataFrame only contains the columns the model expects
    df_processed = df_processed[feature_columns]
    
    # Final check for any NaNs (shouldn't happen, but for robustness)
    df_processed = df_processed.fillna(0)
    
    return df_processed
