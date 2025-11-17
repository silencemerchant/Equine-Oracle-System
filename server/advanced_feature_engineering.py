"""
Advanced Feature Engineering Pipeline for Meta-Ensemble Horse Race Predictor
Implements all custom features: track-specific form, form trends, class movements, etc.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Tuple, Dict, List
import warnings

warnings.filterwarnings('ignore')


class AdvancedFeatureEngineer:
    """
    Comprehensive feature engineering for horse race prediction
    """
    
    def __init__(self, df: pd.DataFrame):
        self.df = df.copy()
        self.feature_stats = {}
    
    def handle_missing_features(self) -> pd.DataFrame:
        """
        Handle missing values with intelligent imputation strategies
        """
        print("[Feature Engineering] Handling missing features...")
        
        # 1. Jockey changes
        self.df['JOCKEY_UNKNOWN'] = self.df['JOCKEY'].isna().astype(int)
        self.df['JOCKEY'].fillna('UNKNOWN', inplace=True)
        
        # 2. Track conditions - fill with mode per track
        self.df['TRACK_CONDITION'].fillna(
            self.df.groupby('TRACK_NAME')['TRACK_CONDITION'].transform(
                lambda x: x.mode()[0] if not x.mode().empty else 'GOOD'
            ),
            inplace=True
        )
        
        # 3. Previous race features - fill with median per horse
        rolling_features = ['days_since_last_race', 'PREV_RACE_WON', 'PREV_RACE_POSITION']
        for feat in rolling_features:
            if feat in self.df.columns:
                median_val = self.df.groupby('HORSE_NAME')[feat].transform('median')
                self.df[feat].fillna(median_val, inplace=True)
        
        # 4. Weight - fill with horse average
        self.df['WEIGHT'].fillna(
            self.df.groupby('HORSE_NAME')['WEIGHT'].transform('mean'),
            inplace=True
        )
        
        # 5. Age - fill with median
        self.df['AGE'].fillna(self.df['AGE'].median(), inplace=True)
        
        print(f"[Feature Engineering] Missing values handled. Shape: {self.df.shape}")
        return self.df
    
    def validate_temporal_integrity(self) -> pd.DataFrame:
        """
        Ensure no future data leakage in features
        All historical features must use data strictly before race date
        """
        print("[Feature Engineering] Validating temporal integrity...")
        
        # Convert dates to datetime
        self.df['DATE'] = pd.to_datetime(self.df['DATE'])
        
        # Check for any future data
        if 'PREV_RACE_DATE' in self.df.columns:
            self.df['PREV_RACE_DATE'] = pd.to_datetime(self.df['PREV_RACE_DATE'])
            
            # Verify previous race is actually in the past
            future_races = self.df[self.df['PREV_RACE_DATE'] >= self.df['DATE']]
            if len(future_races) > 0:
                print(f"[WARNING] Found {len(future_races)} races with future data leakage")
                self.df = self.df[self.df['PREV_RACE_DATE'] < self.df['DATE']]
        
        print("[Feature Engineering] Temporal integrity validated")
        return self.df
    
    def calculate_track_specific_form(self) -> pd.DataFrame:
        """
        Calculate days since last win at this specific track
        Horses have preferences for certain tracks
        """
        print("[Feature Engineering] Calculating track-specific form...")
        
        # Get wins at each track
        wins_at_track = self.df[self.df['FINISHED'] == 1].copy()
        wins_at_track = wins_at_track.groupby(['HORSE_NAME', 'TRACK_NAME'])['DATE'].max().reset_index()
        wins_at_track.columns = ['HORSE_NAME', 'TRACK_NAME', 'LAST_WIN_AT_TRACK']
        
        # Merge with main dataframe
        self.df = self.df.merge(
            wins_at_track,
            on=['HORSE_NAME', 'TRACK_NAME'],
            how='left'
        )
        
        # Calculate days since win at track
        self.df['days_since_track_win'] = (
            self.df['DATE'] - self.df['LAST_WIN_AT_TRACK']
        ).dt.days
        
        # Fill NaN (never won at track) with large value
        self.df['days_since_track_win'].fillna(999, inplace=True)
        
        # Normalize to 0-1 range
        max_days = self.df['days_since_track_win'].max()
        self.df['days_since_track_win_norm'] = 1 - (self.df['days_since_track_win'] / max_days)
        
        print(f"[Feature Engineering] Track-specific form calculated")
        return self.df
    
    def calculate_form_trend(self) -> pd.DataFrame:
        """
        Calculate weighted form trend from recent finishes
        Weights: 3x last race, 2x 2nd-last, 1x 3rd-last
        Lower finish position = better form
        """
        print("[Feature Engineering] Calculating form trends...")
        
        # Sort by horse and date
        self.df = self.df.sort_values(['HORSE_NAME', 'DATE'])
        
        # Get last 3 finishes for each horse
        self.df['finish_lag_1'] = self.df.groupby('HORSE_NAME')['FINISHED'].shift(1)
        self.df['finish_lag_2'] = self.df.groupby('HORSE_NAME')['FINISHED'].shift(2)
        self.df['finish_lag_3'] = self.df.groupby('HORSE_NAME')['FINISHED'].shift(3)
        
        # Calculate weighted form trend
        # Normalize finishes to 0-1 (1st place = 0, last place = 1)
        # Assuming max 15 horses per race
        max_horses = 15
        
        self.df['form_trend'] = (
            (3 * (self.df['finish_lag_1'] / max_horses)) +
            (2 * (self.df['finish_lag_2'] / max_horses)) +
            (1 * (self.df['finish_lag_3'] / max_horses))
        ) / 6.0
        
        # Fill NaN with neutral value
        self.df['form_trend'].fillna(0.5, inplace=True)
        
        print(f"[Feature Engineering] Form trends calculated")
        return self.df
    
    def calculate_class_movement(self) -> pd.DataFrame:
        """
        Detect class rise/fall: +1 (up), 0 (same), -1 (down)
        Horses moving up in class are at disadvantage
        """
        print("[Feature Engineering] Calculating class movements...")
        
        # Sort by horse and date
        self.df = self.df.sort_values(['HORSE_NAME', 'DATE'])
        
        # Get previous class
        self.df['prev_class'] = self.df.groupby('HORSE_NAME')['CLASS'].shift(1)
        
        # Calculate class movement
        # Assuming lower class number = higher class (Class 1 is highest)
        self.df['class_rise_fall'] = self.df['prev_class'] - self.df['CLASS']
        self.df['class_rise_fall'].fillna(0, inplace=True)
        
        # Normalize to -1, 0, 1
        self.df['class_rise_fall'] = self.df['class_rise_fall'].apply(
            lambda x: 1 if x > 0 else (-1 if x < 0 else 0)
        )
        
        print(f"[Feature Engineering] Class movements calculated")
        return self.df
    
    def calculate_weight_differential(self) -> pd.DataFrame:
        """
        Weight differential: current weight vs historical average
        Positive = carrying more weight than usual (disadvantage)
        """
        print("[Feature Engineering] Calculating weight differentials...")
        
        # Calculate average weight per horse
        self.df['avg_weight'] = self.df.groupby('HORSE_NAME')['WEIGHT'].transform('mean')
        
        # Calculate differential
        self.df['weight_differential'] = self.df['WEIGHT'] - self.df['avg_weight']
        
        # Normalize
        std_weight = self.df['weight_differential'].std()
        self.df['weight_differential_norm'] = self.df['weight_differential'] / std_weight
        
        print(f"[Feature Engineering] Weight differentials calculated")
        return self.df
    
    def calculate_barrier_advantage(self) -> pd.DataFrame:
        """
        Barrier effectiveness: win rate from each barrier at this track/distance
        """
        print("[Feature Engineering] Calculating barrier advantages...")
        
        # Calculate barrier statistics
        barrier_stats = self.df.groupby(['TRACK_NAME', 'DISTANCE', 'BARRIER']).agg({
            'FINISHED': ['count', lambda x: (x == 1).sum()]
        }).reset_index()
        
        barrier_stats.columns = ['TRACK_NAME', 'DISTANCE', 'BARRIER', 'total_races', 'wins']
        barrier_stats['barrier_win_rate'] = (
            barrier_stats['wins'] / barrier_stats['total_races']
        ).fillna(0.5)
        
        # Merge back to main dataframe
        self.df = self.df.merge(
            barrier_stats[['TRACK_NAME', 'DISTANCE', 'BARRIER', 'barrier_win_rate']],
            on=['TRACK_NAME', 'DISTANCE', 'BARRIER'],
            how='left'
        )
        
        # Fill missing with neutral value
        self.df['barrier_track_advantage'] = self.df['barrier_win_rate'].fillna(0.5)
        
        print(f"[Feature Engineering] Barrier advantages calculated")
        return self.df
    
    def calculate_jockey_trainer_stats(self) -> pd.DataFrame:
        """
        Calculate jockey and trainer win rates and recent form
        """
        print("[Feature Engineering] Calculating jockey/trainer statistics...")
        
        # Jockey win rate
        jockey_stats = self.df.groupby('JOCKEY').agg({
            'FINISHED': ['count', lambda x: (x == 1).sum()]
        }).reset_index()
        jockey_stats.columns = ['JOCKEY', 'jockey_races', 'jockey_wins']
        jockey_stats['jockey_win_rate'] = (
            jockey_stats['jockey_wins'] / jockey_stats['jockey_races']
        ).fillna(0.1)
        
        # Trainer win rate
        trainer_stats = self.df.groupby('TRAINER').agg({
            'FINISHED': ['count', lambda x: (x == 1).sum()]
        }).reset_index()
        trainer_stats.columns = ['TRAINER', 'trainer_races', 'trainer_wins']
        trainer_stats['trainer_win_rate'] = (
            trainer_stats['trainer_wins'] / trainer_stats['trainer_races']
        ).fillna(0.1)
        
        # Merge back
        self.df = self.df.merge(jockey_stats[['JOCKEY', 'jockey_win_rate']], on='JOCKEY', how='left')
        self.df = self.df.merge(trainer_stats[['TRAINER', 'trainer_win_rate']], on='TRAINER', how='left')
        
        # Fill missing
        self.df['jockey_win_rate'].fillna(0.1, inplace=True)
        self.df['trainer_win_rate'].fillna(0.1, inplace=True)
        
        print(f"[Feature Engineering] Jockey/trainer statistics calculated")
        return self.df
    
    def calculate_horse_age_factor(self) -> pd.DataFrame:
        """
        Age factor: horses peak at 4-6 years old in racing
        """
        print("[Feature Engineering] Calculating age factors...")
        
        # Optimal age range: 4-6 years
        self.df['age_factor'] = self.df['AGE'].apply(
            lambda x: 1.0 if 4 <= x <= 6 else (0.8 if 3 <= x <= 7 else 0.6)
        )
        
        print(f"[Feature Engineering] Age factors calculated")
        return self.df
    
    def calculate_races_since_break(self) -> pd.DataFrame:
        """
        Calculate days since last race (rest factor)
        Horses need adequate rest but not too much
        """
        print("[Feature Engineering] Calculating rest factors...")
        
        # Sort by horse and date
        self.df = self.df.sort_values(['HORSE_NAME', 'DATE'])
        
        # Calculate days since last race
        self.df['days_since_last_race'] = self.df.groupby('HORSE_NAME')['DATE'].diff().dt.days
        self.df['days_since_last_race'].fillna(30, inplace=True)
        
        # Optimal rest: 14-30 days
        self.df['rest_factor'] = self.df['days_since_last_race'].apply(
            lambda x: 1.0 if 14 <= x <= 30 else (0.8 if 7 <= x <= 42 else 0.5)
        )
        
        print(f"[Feature Engineering] Rest factors calculated")
        return self.df
    
    def engineer_all_features(self) -> pd.DataFrame:
        """
        Run complete feature engineering pipeline
        """
        print("\n" + "="*60)
        print("ADVANCED FEATURE ENGINEERING PIPELINE")
        print("="*60 + "\n")
        
        # Step 1: Handle missing values
        self.handle_missing_features()
        
        # Step 2: Validate temporal integrity
        self.validate_temporal_integrity()
        
        # Step 3: Calculate all custom features
        self.calculate_track_specific_form()
        self.calculate_form_trend()
        self.calculate_class_movement()
        self.calculate_weight_differential()
        self.calculate_barrier_advantage()
        self.calculate_jockey_trainer_stats()
        self.calculate_horse_age_factor()
        self.calculate_races_since_break()
        
        print("\n" + "="*60)
        print("FEATURE ENGINEERING COMPLETE")
        print("="*60)
        print(f"Total features: {len(self.df.columns)}")
        print(f"Total samples: {len(self.df)}")
        print(f"\nNew features created:")
        
        new_features = [
            'days_since_track_win', 'days_since_track_win_norm',
            'form_trend', 'class_rise_fall', 'weight_differential',
            'weight_differential_norm', 'barrier_track_advantage',
            'jockey_win_rate', 'trainer_win_rate', 'age_factor',
            'days_since_last_race', 'rest_factor', 'JOCKEY_UNKNOWN'
        ]
        
        for feat in new_features:
            if feat in self.df.columns:
                print(f"  ✓ {feat}")
        
        return self.df


def main():
    """
    Example usage of advanced feature engineering
    """
    # Load your race data
    # df = pd.read_csv('racebase_ranking_data.csv')
    
    # For demonstration
    print("Advanced Feature Engineering Pipeline")
    print("This module should be imported and used in your training pipeline")
    print("\nUsage:")
    print("  engineer = AdvancedFeatureEngineer(df)")
    print("  df_engineered = engineer.engineer_all_features()")


if __name__ == '__main__':
    main()
