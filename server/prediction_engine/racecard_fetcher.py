#!/usr/bin/env python3
"""
Racecard Fetcher - Wrapper around rpscrape to fetch live horse racing data.
This script provides a simple interface to get today's or tomorrow's racecards.
"""

import sys
import json
import subprocess
from datetime import datetime, timedelta
from typing import List, Dict, Any

def fetch_racecards(date_str: str = "today") -> Dict[str, Any]:
    """
    Fetch racecards for a given date using rpscrape.
    
    Args:
        date_str: "today" or "tomorrow" or "YYYY/MM/DD"
        
    Returns:
        Dictionary containing races and horses for the specified date
    """
    try:
        # Convert date string to rpscrape format
        if date_str == "today":
            date_obj = datetime.now()
        elif date_str == "tomorrow":
            date_obj = datetime.now() + timedelta(days=1)
        else:
            date_obj = datetime.strptime(date_str, "%Y/%m/%d")
        
        # Format date for rpscrape: YYYY/MM/DD
        formatted_date = date_obj.strftime("%Y/%m/%d")
        
        # Call rpscrape via subprocess
        # Note: This assumes rpscrape is installed and available in PATH
        # rpscrape racecards today -> fetches today's racecards
        result = subprocess.run(
            ["python3", "-m", "rpscrape.scripts.racecards", date_str],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode != 0:
            return {
                "success": False,
                "error": f"rpscrape error: {result.stderr}",
                "date": formatted_date
            }
        
        # Parse the JSON output from rpscrape
        racecards = json.loads(result.stdout)
        
        return {
            "success": True,
            "date": formatted_date,
            "races": racecards,
            "timestamp": datetime.now().isoformat()
        }
        
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "error": "rpscrape request timed out",
            "date": date_str
        }
    except json.JSONDecodeError as e:
        return {
            "success": False,
            "error": f"Failed to parse rpscrape output: {str(e)}",
            "date": date_str
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "date": date_str
        }

def get_races_for_track(racecards: Dict[str, Any], track_name: str) -> List[Dict[str, Any]]:
    """
    Filter racecards to get races for a specific track.
    
    Args:
        racecards: Dictionary returned from fetch_racecards
        track_name: Name of the track (e.g., "Ascot", "York")
        
    Returns:
        List of races for the specified track
    """
    if not racecards.get("success"):
        return []
    
    races = racecards.get("races", [])
    return [race for race in races if race.get("course") == track_name]

def get_horses_for_race(race: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Extract horses from a race.
    
    Args:
        race: Race dictionary from rpscrape
        
    Returns:
        List of horses in the race
    """
    return race.get("runners", [])

def format_racecard_for_prediction(race: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Format race data for model prediction.
    
    Args:
        race: Race dictionary from rpscrape
        
    Returns:
        List of formatted horse records ready for prediction
    """
    horses = get_horses_for_race(race)
    formatted_horses = []
    
    for horse in horses:
        formatted_horse = {
            "horse_name": horse.get("name", "Unknown"),
            "track": race.get("course", "Unknown"),
            "race_type": race.get("type", "Unknown"),
            "distance": race.get("distance", 0),
            "date": race.get("date", ""),
            "race_number": race.get("race_number", 0),
            "race_time": race.get("time", ""),
            # Additional fields from horse data
            "age": horse.get("age", 0),
            "weight": horse.get("weight", 0),
            "jockey": horse.get("jockey", "Unknown"),
            "trainer": horse.get("trainer", "Unknown"),
            "odds": horse.get("odds", 0.0),
            "form": horse.get("form", ""),
        }
        formatted_horses.append(formatted_horse)
    
    return formatted_horses

if __name__ == "__main__":
    # Example usage
    if len(sys.argv) > 1:
        date_arg = sys.argv[1]
    else:
        date_arg = "today"
    
    result = fetch_racecards(date_arg)
    print(json.dumps(result, indent=2))
