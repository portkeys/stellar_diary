import os
import requests
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv
from python_server.data.models import ApodResponse

# Load environment variables
load_dotenv()

# Get NASA API key from environment or use DEMO_KEY
# Note: DEMO_KEY is limited to 30 requests per hour, 50 per day
# For production use, it's recommended to get a free API key from https://api.nasa.gov/
NASA_API_KEY = os.environ.get('NASA_API_KEY', 'DEMO_KEY')

def fetch_apod(date: Optional[str] = None) -> ApodResponse:
    """
    Fetches the Astronomy Picture of the Day from NASA's API
    
    Args:
        date: Optional date in YYYY-MM-DD format. If not specified, returns today's APOD
        
    Returns:
        ApodResponse with APOD data
        
    Raises:
        requests.exceptions.HTTPError: If the HTTP request to NASA API fails
        requests.exceptions.ConnectionError: If there's a network issue
        requests.exceptions.Timeout: If the request times out
        requests.exceptions.RequestException: For any other request-related errors
    """
    url = "https://api.nasa.gov/planetary/apod"
    params = {
        'api_key': NASA_API_KEY
    }
    
    if date:
        params['date'] = date
    
    try:
        response = requests.get(url, params=params, timeout=10)  # Added timeout
        response.raise_for_status()  # Raise an exception for HTTP errors
        return response.json()
    except requests.exceptions.RequestException as e:
        # Log the error details here if needed
        print(f"NASA API Error: {str(e)}")
        raise  # Re-raise the exception to be handled by the caller

def fetch_apod_range(start_date: str, end_date: str) -> List[ApodResponse]:
    """
    Fetches the Astronomy Pictures of the Day for a range of dates
    
    Args:
        start_date: Start date in YYYY-MM-DD format
        end_date: End date in YYYY-MM-DD format
        
    Returns:
        List of ApodResponse objects with APOD data
        
    Raises:
        requests.exceptions.HTTPError: If the HTTP request to NASA API fails
        requests.exceptions.ConnectionError: If there's a network issue
        requests.exceptions.Timeout: If the request times out
        requests.exceptions.RequestException: For any other request-related errors
    """
    url = "https://api.nasa.gov/planetary/apod"
    params = {
        'api_key': NASA_API_KEY,
        'start_date': start_date,
        'end_date': end_date
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)  # Added timeout
        response.raise_for_status()  # Raise an exception for HTTP errors
        return response.json()
    except requests.exceptions.RequestException as e:
        # Log the error details here if needed
        print(f"NASA API Error (range request): {str(e)}")
        raise  # Re-raise the exception to be handled by the caller