#!/usr/bin/env python3
"""
NASA Images API Integration Module

This module provides functions to search for images from NASA's Image and Video Library API.
It includes functionality to search for images by query and return relevant metadata.
"""

import json
import sys
import requests
from typing import Dict, List, Optional
import time

def make_api_request(url: str, params: dict, max_retries: int = 3) -> Optional[Dict]:
    """
    Make API request with retry logic and error handling
    
    Args:
        url (str): API endpoint URL
        params (dict): Request parameters  
        max_retries (int): Maximum number of retry attempts
        
    Returns:
        dict: JSON response data or None if failed
    """
    for attempt in range(max_retries):
        try:
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Attempt {attempt + 1} failed: {e}", file=sys.stderr)
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # Exponential backoff
            else:
                print(f"All {max_retries} attempts failed", file=sys.stderr)
                return None

def search_nasa_images_data(query: str, size: int = 1) -> Optional[Dict]:
    """
    Search NASA Image and Video Library for images matching the query
    
    Args:
        query (str): Search query (e.g., "M57 nebula", "Andromeda galaxy")
        size (int): Number of results to return (default: 1)
        
    Returns:
        dict: API response with image data or None if failed
    """
    # NASA Image and Video Library API endpoint
    base_url = "https://images-api.nasa.gov/search"
    
    # Build parameters
    params = {
        "q": query,
        "media_type": "image",
        "page": 1,
        "page_size": size
    }
    
    return make_api_request(base_url, params)

def extract_best_image_url(api_response: Dict, query: str) -> Optional[str]:
    """
    Extract the best image URL from NASA API response
    
    Args:
        api_response (dict): NASA API response data
        query (str): Original search query for context
        
    Returns:
        str: Best image URL or None if not found
    """
    try:
        if not api_response or 'collection' not in api_response:
            return None
            
        items = api_response['collection'].get('items', [])
        if not items:
            return None
            
        # Get the first (most relevant) item
        first_item = items[0]
        
        # Extract the NASA ID to get the asset manifest
        nasa_id = first_item['data'][0]['nasa_id']
        
        # Build the asset manifest URL
        asset_url = f"https://images-api.nasa.gov/asset/{nasa_id}"
        
        # Fetch asset manifest to get image URLs
        asset_response = make_api_request(asset_url, {})
        if not asset_response:
            return None
            
        # Look for the best quality image
        items = asset_response.get('collection', {}).get('items', [])
        
        # Prefer high-resolution images
        best_url = None
        for item in items:
            href = item.get('href', '')
            if href.endswith(('.jpg', '.jpeg', '.png')):
                # Prefer larger images (often have 'large' or dimensions in filename)
                if 'large' in href.lower() or '1024' in href or '2048' in href:
                    best_url = href
                    break
                elif not best_url:  # Take first valid image as fallback
                    best_url = href
                    
        return best_url
        
    except Exception as e:
        print(f"Error extracting image URL: {e}", file=sys.stderr)
        return None

def search_wikipedia_image(object_name: str) -> Optional[Dict]:
    """
    Search Wikipedia for a page matching the object name and return the thumbnail image URL if available.
    Args:
        object_name (str): Name of the celestial object
    Returns:
        dict: { 'success': bool, 'image_url': str or None, 'source': 'wikipedia', 'title': str }
    """
    try:
        endpoint = "https://en.wikipedia.org/w/api.php"
        params = {
            "action": "query",
            "format": "json",
            "prop": "pageimages",
            "piprop": "thumbnail",
            "pithumbsize": 800,
            "titles": object_name,
            "redirects": 1
        }
        resp = requests.get(endpoint, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        pages = data.get("query", {}).get("pages", {})
        for page_id, page in pages.items():
            if "thumbnail" in page and "source" in page["thumbnail"]:
                return {
                    "success": True,
                    "image_url": page["thumbnail"]["source"],
                    "source": "wikipedia",
                    "title": page.get("title", object_name)
                }
        return {"success": False, "image_url": None, "source": "wikipedia", "title": object_name}
    except Exception as e:
        print(f"Wikipedia image search failed for {object_name}: {e}", file=sys.stderr)
        return {"success": False, "image_url": None, "source": "wikipedia", "title": object_name}


def search_celestial_object_image(object_name: str) -> Dict:
    """
    Search for a celestial object image and return structured data
    Args:
        object_name (str): Name of the celestial object (e.g., "M57", "Andromeda Galaxy")
    Returns:
        dict: Result with success status, image URL, and metadata
    """
    try:
        # Search for the object in NASA first
        search_result = search_nasa_images_data(object_name, size=3)  # Get a few options
        image_url = None
        metadata = {}
        if search_result:
            image_url = extract_best_image_url(search_result, object_name)
            items = search_result['collection'].get('items', [])
            if items:
                data = items[0]['data'][0]
                metadata = {
                    "title": data.get('title', ''),
                    "description": data.get('description', ''),
                    "date_created": data.get('date_created', ''),
                    "center": data.get('center', ''),
                    "nasa_id": data.get('nasa_id', '')
                }
        if image_url:
            return {
                "success": True,
                "object_name": object_name,
                "image_url": image_url,
                "metadata": metadata,
                "source": "nasa"
            }
        # If NASA fails, try Wikipedia
        wiki_result = search_wikipedia_image(object_name)
        if wiki_result["success"] and wiki_result["image_url"]:
            return {
                "success": True,
                "object_name": object_name,
                "image_url": wiki_result["image_url"],
                "metadata": {"source": "wikipedia", "title": wiki_result["title"]},
                "source": "wikipedia"
            }
        # If both fail, return failure
        return {
            "success": False,
            "error": "No suitable image found in NASA or Wikipedia database",
            "object_name": object_name,
            "image_url": None
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Unexpected error: {str(e)}",
            "object_name": object_name,
            "image_url": None
        }

def main():
    """Command-line interface for NASA image search"""
    if len(sys.argv) < 2:
        print(json.dumps({
            "error": True,
            "message": "Usage: python nasa_images.py <object_name>"
        }))
        sys.exit(1)
    
    object_name = sys.argv[1]
    result = search_celestial_object_image(object_name)
    
    # Output JSON result
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()