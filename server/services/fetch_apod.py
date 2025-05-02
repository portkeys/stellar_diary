#!/usr/bin/env python3
import requests
import json
import os
import sys
from datetime import datetime

def get_apod(date=None, force_refresh=False):
    """
    Fetch the Astronomy Picture of the Day from NASA's API
    
    Args:
        date (str, optional): A date string in YYYY-MM-DD format. Defaults to today.
        force_refresh (bool, optional): Force refresh from API. Defaults to False.
    
    Returns:
        dict: APOD data in JSON format
    """
    api_key = os.environ.get('NASA_API_KEY')
    
    # Build request URL
    url = f"https://api.nasa.gov/planetary/apod?api_key={api_key}"
    
    # Add date parameter if specified
    if date:
        url += f"&date={date}"
        
    # Add a cache-busting parameter if force refresh is requested
    if force_refresh:
        url += f"&nocache={datetime.now().timestamp()}"
    
    try:
        # Make the request with cache-control headers
        headers = {}
        if force_refresh:
            headers = {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        
        response = requests.get(url, headers=headers)
        response.raise_for_status()  # Raise an exception for 4XX/5XX responses
        
        # Parse and return the JSON response
        data = response.json()
        return data
    
    except requests.exceptions.RequestException as e:
        # Handle any request errors
        error = {
            "error": True,
            "message": f"Error fetching APOD data: {str(e)}",
            "status_code": getattr(e.response, 'status_code', 500) if hasattr(e, 'response') else 500
        }
        return error

def get_apod_range(start_date, end_date):
    """
    Fetch the Astronomy Picture of the Day for a range of dates
    
    Args:
        start_date (str): Start date in YYYY-MM-DD format
        end_date (str): End date in YYYY-MM-DD format
    
    Returns:
        list: List of APOD data for the specified date range
    """
    api_key = os.environ.get('NASA_API_KEY', 'DEMO_KEY')
    
    # Build request URL with date range
    url = f"https://api.nasa.gov/planetary/apod?api_key={api_key}&start_date={start_date}&end_date={end_date}"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        
        # Parse and return the JSON response
        data = response.json()
        return data
    
    except requests.exceptions.RequestException as e:
        # Handle any request errors
        error = {
            "error": True,
            "message": f"Error fetching APOD range: {str(e)}",
            "status_code": getattr(e.response, 'status_code', 500) if hasattr(e, 'response') else 500
        }
        return error

if __name__ == "__main__":
    # Check command line arguments
    if len(sys.argv) < 2:
        print(json.dumps({"error": True, "message": "Missing command argument"}))
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "fetch":
        # Get optional parameters
        date = sys.argv[2] if len(sys.argv) > 2 else None
        force_refresh = sys.argv[3].lower() == "true" if len(sys.argv) > 3 else False
        
        # Fetch APOD data and print as JSON
        data = get_apod(date, force_refresh)
        print(json.dumps(data))
        
    elif command == "fetch_range":
        # Ensure both dates are provided
        if len(sys.argv) < 4:
            print(json.dumps({"error": True, "message": "Missing date range parameters"}))
            sys.exit(1)
        
        start_date = sys.argv[2]
        end_date = sys.argv[3]
        
        # Fetch APOD range and print as JSON
        data = get_apod_range(start_date, end_date)
        print(json.dumps(data))
        
    else:
        print(json.dumps({"error": True, "message": f"Unknown command: {command}"}))
        sys.exit(1)