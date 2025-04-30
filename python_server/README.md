# StellarView Python Backend

This directory contains the Python backend for the StellarView astronomy application. The backend provides APIs for retrieving astronomical data, managing observation lists, and accessing educational content about telescope usage.

## Features

- NASA Astronomy Picture of the Day (APOD) integration
- Celestial object catalog with filtering by type, month, and hemisphere
- Monthly sky guides with seasonal observation recommendations
- Personal observation list management
- Telescope usage tips for beginners

## API Endpoints

### NASA APOD
- `GET /api/apod` - Get the Astronomy Picture of the Day
  - Optional query parameter: `date` (YYYY-MM-DD format)

### Celestial Objects
- `GET /api/celestial-objects` - Get all celestial objects
  - Optional query parameters: `type`, `month`, `hemisphere`
- `GET /api/celestial-objects/:id` - Get a specific celestial object by ID
- `POST /api/celestial-objects` - Create a new custom celestial object
- `GET /api/celestial-object-types` - Get list of valid celestial object types

### Monthly Guides
- `GET /api/monthly-guide` - Get the monthly viewing guide
  - Optional query parameters: `month`, `year`, `hemisphere`

### Observations
- `GET /api/observations` - Get the user's observation list
- `POST /api/observations` - Add a celestial object to the observation list
- `PATCH /api/observations/:id` - Update an observation (mark as observed, add notes)
- `DELETE /api/observations/:id` - Remove an object from the observation list

### Telescope Tips
- `GET /api/telescope-tips` - Get telescope usage tips
  - Optional query parameter: `category`

### API Info
- `GET /api/info` - Get information about the API configuration

## Setup

1. Install required packages:
   ```
   pip install flask flask-cors python-dotenv requests
   ```

2. Environment variables:
   - Create a `.env` file based on `.env.example`
   - For higher API limits, get your free NASA API key at https://api.nasa.gov/

3. Run the server:
   ```
   python run.py
   ```

## Architecture

- **`app.py`**: Flask application with API endpoints
- **`data/models.py`**: Data models for celestial objects, observations, etc.
- **`data/storage.py`**: In-memory storage implementation
- **`services/nasa_api.py`**: NASA API integration
- **`services/celestial_objects.py`**: Functions for celestial object data processing

## Development

- The server runs on port 5000 by default (configurable via the PORT environment variable)
- In production, use a WSGI server instead of the built-in Flask development server