import os
import requests
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get NASA API key from environment or use DEMO_KEY
NASA_API_KEY = os.environ.get('NASA_API_KEY', 'DEMO_KEY')

def fetch_apod(date: Optional[str] = None) -> Dict[str, Any]:
    """
    Fetches the Astronomy Picture of the Day from NASA's API
    
    Args:
        date: Optional date in YYYY-MM-DD format. If not specified, returns today's APOD
        
    Returns:
        Dictionary with APOD data
    """
    url = "https://api.nasa.gov/planetary/apod"
    params = {
        'api_key': NASA_API_KEY
    }
    
    if date:
        params['date'] = date
    
    response = requests.get(url, params=params)
    response.raise_for_status()  # Raise an exception for HTTP errors
    
    return response.json()

def fetch_apod_range(start_date: str, end_date: str) -> List[Dict[str, Any]]:
    """
    Fetches the Astronomy Pictures of the Day for a range of dates
    
    Args:
        start_date: Start date in YYYY-MM-DD format
        end_date: End date in YYYY-MM-DD format
        
    Returns:
        List of dictionaries with APOD data
    """
    url = "https://api.nasa.gov/planetary/apod"
    params = {
        'api_key': NASA_API_KEY,
        'start_date': start_date,
        'end_date': end_date
    }
    
    response = requests.get(url, params=params)
    response.raise_for_status()  # Raise an exception for HTTP errors
    
    return response.json()