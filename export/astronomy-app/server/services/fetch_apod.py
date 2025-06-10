#!/usr/bin/env python3
import requests
import json
import os
import sys
from datetime import datetime, timedelta
import re
from bs4 import BeautifulSoup

def get_apod(date=None, force_refresh=False, api_key=None):
    """
    Fetch the Astronomy Picture of the Day from NASA's APOD website directly
    
    Args:
        date (str, optional): A date string in YYYY-MM-DD format. Defaults to today.
        force_refresh (bool, optional): Force refresh from API. Defaults to False.
        api_key (str, optional): Not used when scraping the website directly.
    
    Returns:
        dict: APOD data in JSON format
    """
    # NASA APOD website URL
    base_url = "https://apod.nasa.gov/apod/"
    
    if date:
        # Convert YYYY-MM-DD to the format used by APOD: apYYMMDD.html
        try:
            year, month, day = date.split('-')
            # Format: apYYMMDD.html (YY = last 2 digits of year)
            page_date = f"ap{year[2:4]}{month}{day}.html"
            url = f"{base_url}{page_date}"
        except:
            # If date parsing fails, use current day
            url = f"{base_url}astropix.html"
    else:
        # Use today's APOD
        url = f"{base_url}astropix.html"
    
    # Add a cache-busting parameter if force refresh is requested
    if force_refresh:
        url += f"?nocache={datetime.now().timestamp()}"
    
    try:
        # Make the request with cache-control headers
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        if force_refresh:
            headers.update({
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            })
        
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        # Parse the HTML response
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract the image URL
        img_tag = soup.find('img')
        if img_tag and img_tag.has_attr('src'):
            img_src = img_tag['src']
            # Make sure it's an absolute URL
            if not img_src.startswith('http'):
                img_src = f"{base_url}{img_src}"
        else:
            # If no image found, check for an iframe (for videos)
            iframe = soup.find('iframe')
            if iframe and iframe.has_attr('src'):
                img_src = iframe['src']
                # Set media type to video if iframe found
                media_type = "video"
            else:
                # Last resort - couldn't find an image or video
                return {
                    "error": True,
                    "message": "Could not find image or video in APOD page"
                }
        
        # Extract the title
        title_elem = soup.find('title')
        title = title_elem.text if title_elem else "NASA Astronomy Picture of the Day"
        # Clean up the title (remove "APOD:" prefix if present)
        if title.startswith("APOD:"):
            title = title[5:].strip()
        
        # Extract the explanation (all paragraph text after the image)
        paragraphs = soup.find_all('p')
        explanation = ""
        capture_explanation = False
        
        for p in paragraphs:
            # Skip paragraphs that contain the image
            if p.find('img') or p.find('iframe'):
                capture_explanation = True
                continue
            
            if capture_explanation:
                # Add this paragraph to our explanation
                if explanation:
                    explanation += "\n\n"  # Add newlines between paragraphs
                explanation += p.get_text().strip()
        
        # Extract the copyright if available
        copyright_text = None
        copyright_pattern = re.compile(r'Copyright:?\s*(.+?)(?:\.|$)', re.IGNORECASE)
        credit_pattern = re.compile(r'Credit:?\s*(.+?)(?:\.|$)', re.IGNORECASE)
        
        for match in re.finditer(copyright_pattern, explanation):
            copyright_text = match.group(1).strip()
            break
        
        # If no copyright found, look for credit
        if not copyright_text:
            for match in re.finditer(credit_pattern, explanation):
                copyright_text = match.group(1).strip()
                break
        
        # Use current date as default if we can't parse from the URL
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Try to extract the date from the URL
        try:
            if "ap" in url and ".html" in url:
                date_part = url.split("ap")[1].split(".html")[0]
                if len(date_part) >= 6:  # Should be at least YYMMDD
                    yy = date_part[0:2]
                    mm = date_part[2:4]
                    dd = date_part[4:6]
                    
                    # Convert YY to YYYY
                    yyyy = f"20{yy}" if int(yy) < 50 else f"19{yy}"
                    date_str = f"{yyyy}-{mm}-{dd}"
                else:
                    date_str = today
            else:
                date_str = today
        except:
            date_str = today
        
        # Construct the result in the same format as the NASA API
        data = {
            "date": date_str,
            "title": title,
            "explanation": explanation,
            "url": img_src,
            "hdurl": img_src,  # Use same URL for both standard and HD
            "media_type": "image" if "iframe" not in locals() else "video",
            "service_version": "v1",
            "copyright": copyright_text
        }
        
        return data
    
    except requests.exceptions.RequestException as e:
        # Handle any request errors
        error = {
            "error": True,
            "message": f"Error fetching APOD data: {str(e)}",
            "status_code": getattr(e.response, 'status_code', 500) if hasattr(e, 'response') else 500
        }
        return error

def get_apod_range(start_date, end_date, api_key=None):
    """
    Fetch the Astronomy Picture of the Day for a range of dates by scraping multiple pages
    
    Args:
        start_date (str): Start date in YYYY-MM-DD format
        end_date (str): End date in YYYY-MM-DD format
        api_key (str, optional): Not used when scraping directly.
    
    Returns:
        list: List of APOD data for the specified date range
    """
    try:
        # Parse start and end dates
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")
        
        # Make sure end is not before start
        if end < start:
            return {
                "error": True,
                "message": "End date cannot be before start date"
            }
        
        # Calculate the total number of days in the range
        delta = end - start
        num_days = delta.days + 1  # Include both start and end dates
        
        # Limit the range to avoid excessive requests
        max_days = 30  # Reasonable limit
        if num_days > max_days:
            return {
                "error": True,
                "message": f"Date range too large. Maximum range is {max_days} days."
            }
        
        # Collect results for each date in the range
        results = []
        current = start
        
        while current <= end:
            # Format date as YYYY-MM-DD
            date_str = current.strftime("%Y-%m-%d")
            
            # Fetch APOD for this date
            apod_data = get_apod(date_str, False, None)
            
            # Add to results if no error
            if "error" not in apod_data or not apod_data["error"]:
                results.append(apod_data)
            
            # Move to next day
            current += timedelta(days=1)
        
        return results
    
    except Exception as e:
        # Handle any errors
        error = {
            "error": True,
            "message": f"Error fetching APOD range: {str(e)}"
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
        api_key = sys.argv[4] if len(sys.argv) > 4 else None
        
        # Fetch APOD data and print as JSON
        data = get_apod(date, force_refresh, api_key)
        print(json.dumps(data))
        
    elif command == "fetch_range":
        # Ensure both dates are provided
        if len(sys.argv) < 4:
            print(json.dumps({"error": True, "message": "Missing date range parameters"}))
            sys.exit(1)
        
        start_date = sys.argv[2]
        end_date = sys.argv[3]
        api_key = sys.argv[4] if len(sys.argv) > 4 else None
        
        # Fetch APOD range and print as JSON
        data = get_apod_range(start_date, end_date, api_key)
        print(json.dumps(data))
        
    else:
        print(json.dumps({"error": True, "message": f"Unknown command: {command}"}))
        sys.exit(1)