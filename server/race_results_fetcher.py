"""
Race Results Fetcher Service
Retrieves actual race outcomes from Racing Post and other sources
"""

import subprocess
import json
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RaceResultsFetcher:
    """
    Fetches actual race results using rpscrape
    """
    
    def __init__(self):
        self.logger = logger
    
    def fetch_results_for_date(self, date_str: str) -> List[Dict]:
        """
        Fetch race results for a specific date using rpscrape
        
        Args:
            date_str: Date in format 'YYYY-MM-DD'
        
        Returns:
            List of race results dictionaries
        """
        try:
            self.logger.info(f"[Results Fetcher] Fetching results for {date_str}...")
            
            # Use rpscrape to fetch results
            cmd = ['racecards.py', date_str]
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if result.returncode != 0:
                self.logger.error(f"[Results Fetcher] Error fetching results: {result.stderr}")
                return []
            
            # Parse JSON output
            races_data = json.loads(result.stdout)
            
            # Extract results from races that have been run
            results = []
            for race in races_data:
                if self._race_has_results(race):
                    result_dict = self._parse_race_result(race)
                    if result_dict:
                        results.append(result_dict)
            
            self.logger.info(f"[Results Fetcher] Found {len(results)} completed races")
            return results
            
        except subprocess.TimeoutExpired:
            self.logger.error("[Results Fetcher] Timeout fetching results")
            return []
        except json.JSONDecodeError as e:
            self.logger.error(f"[Results Fetcher] Error parsing JSON: {e}")
            return []
        except Exception as e:
            self.logger.error(f"[Results Fetcher] Unexpected error: {e}")
            return []
    
    def _race_has_results(self, race_data: Dict) -> bool:
        """
        Check if a race has been run and has results
        """
        # Check if race time has passed
        race_time = race_data.get('time')
        if not race_time:
            return False
        
        # Check if results are available
        runners = race_data.get('runners', [])
        if not runners:
            return False
        
        # Check if any runner has a finishing position
        for runner in runners:
            if runner.get('position') is not None:
                return True
        
        return False
    
    def _parse_race_result(self, race_data: Dict) -> Optional[Dict]:
        """
        Parse a single race result from rpscrape output
        
        Returns:
            Dictionary with race result details or None if parsing fails
        """
        try:
            # Extract race information
            race_id = race_data.get('raceId', '')
            race_name = race_data.get('name', '')
            track_name = race_data.get('course', '')
            race_date = race_data.get('date', '')
            race_time = race_data.get('time', '')
            
            # Get finishing order
            runners = sorted(
                race_data.get('runners', []),
                key=lambda x: x.get('position', 999)
            )
            
            # Extract top 4 finishers
            finishers = []
            for i, runner in enumerate(runners[:4]):
                horse_name = runner.get('name', f'Unknown_{i}')
                odds = runner.get('odds', {})
                
                finishers.append({
                    'position': i + 1,
                    'horse_name': horse_name,
                    'odds': odds.get('decimal', 0),
                })
            
            if len(finishers) < 4:
                self.logger.warning(f"[Results Fetcher] Race {race_id} has less than 4 finishers")
                return None
            
            return {
                'race_id': race_id,
                'race_name': race_name,
                'track_name': track_name,
                'race_date': f"{race_date} {race_time}",
                'winner': finishers[0]['horse_name'],
                'second': finishers[1]['horse_name'],
                'third': finishers[2]['horse_name'],
                'fourth': finishers[3]['horse_name'],
                'winning_odds': finishers[0]['odds'],
                'second_odds': finishers[1]['odds'],
                'third_odds': finishers[2]['odds'],
                'fourth_odds': finishers[3]['odds'],
                'track_condition': race_data.get('going', 'UNKNOWN'),
            }
            
        except Exception as e:
            self.logger.error(f"[Results Fetcher] Error parsing race result: {e}")
            return None
    
    def fetch_results_batch(self, start_date: str, end_date: str) -> List[Dict]:
        """
        Fetch results for a date range
        
        Args:
            start_date: Start date in format 'YYYY-MM-DD'
            end_date: End date in format 'YYYY-MM-DD'
        
        Returns:
            List of all race results in the date range
        """
        all_results = []
        
        current_date = datetime.strptime(start_date, '%Y-%m-%d')
        end = datetime.strptime(end_date, '%Y-%m-%d')
        
        while current_date <= end:
            date_str = current_date.strftime('%Y-%m-%d')
            results = self.fetch_results_for_date(date_str)
            all_results.extend(results)
            
            current_date += timedelta(days=1)
        
        return all_results
    
    def fetch_yesterday_results(self) -> List[Dict]:
        """
        Fetch results from yesterday
        """
        yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
        return self.fetch_results_for_date(yesterday)
    
    def fetch_today_results(self) -> List[Dict]:
        """
        Fetch completed results from today
        """
        today = datetime.now().strftime('%Y-%m-%d')
        return self.fetch_results_for_date(today)


class ResultsProcessor:
    """
    Process and validate race results
    """
    
    @staticmethod
    def validate_result(result: Dict) -> Tuple[bool, str]:
        """
        Validate a race result dictionary
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        required_fields = [
            'race_id', 'race_name', 'track_name', 'race_date',
            'winner', 'second', 'third', 'fourth'
        ]
        
        for field in required_fields:
            if field not in result or not result[field]:
                return False, f"Missing required field: {field}"
        
        # Validate horse names are not duplicates
        horses = [result['winner'], result['second'], result['third'], result['fourth']]
        if len(horses) != len(set(horses)):
            return False, "Duplicate horses in finishing order"
        
        return True, ""
    
    @staticmethod
    def normalize_horse_name(name: str) -> str:
        """
        Normalize horse names for matching with predictions
        """
        return name.strip().upper()
    
    @staticmethod
    def match_prediction_to_result(
        prediction: Dict,
        result: Dict
    ) -> Dict:
        """
        Match a prediction to a race result and calculate accuracy
        
        Returns:
            Dictionary with match results and accuracy metrics
        """
        pred_horses = [
            ResultsProcessor.normalize_horse_name(prediction.get('horse_1st', '')),
            ResultsProcessor.normalize_horse_name(prediction.get('horse_2nd', '')),
            ResultsProcessor.normalize_horse_name(prediction.get('horse_3rd', '')),
            ResultsProcessor.normalize_horse_name(prediction.get('horse_4th', '')),
        ]
        
        result_horses = [
            ResultsProcessor.normalize_horse_name(result['winner']),
            ResultsProcessor.normalize_horse_name(result['second']),
            ResultsProcessor.normalize_horse_name(result['third']),
            ResultsProcessor.normalize_horse_name(result['fourth']),
        ]
        
        # Calculate accuracy
        top1_correct = pred_horses[0] == result_horses[0]
        top2_correct = pred_horses[1] == result_horses[1]
        top3_correct = pred_horses[2] == result_horses[2]
        top4_correct = pred_horses[3] == result_horses[3]
        
        # Check if predicted horses are in top 4
        predicted_in_top4 = [horse in result_horses for horse in pred_horses]
        
        return {
            'top1_correct': top1_correct,
            'top2_correct': top2_correct,
            'top3_correct': top3_correct,
            'top4_correct': top4_correct,
            'predicted_in_top4': predicted_in_top4,
            'trifecta_hit': top1_correct and top2_correct and top3_correct,
            'exacta_hit': top1_correct and top2_correct,
            'win_hit': top1_correct,
        }


def main():
    """
    Example usage of race results fetcher
    """
    fetcher = RaceResultsFetcher()
    
    # Fetch today's results
    print("Fetching today's race results...")
    results = fetcher.fetch_today_results()
    
    print(f"Found {len(results)} completed races")
    for result in results[:3]:  # Print first 3
        print(f"\nRace: {result['race_name']} at {result['track_name']}")
        print(f"Winner: {result['winner']}")
        print(f"Second: {result['second']}")
        print(f"Third: {result['third']}")
        print(f"Fourth: {result['fourth']}")


if __name__ == '__main__':
    main()
