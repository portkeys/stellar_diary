# StellarView Python Server

This is the Python implementation of the StellarView astronomy application server. The server is built with Flask and provides various API endpoints for accessing astronomy-related data.

## Features

- NASA Astronomy Picture of the Day (APOD) integration
- Celestial object database with filtering options
- Monthly sky guides for northern and southern hemispheres
- User observations management
- Telescope tips for beginners

## API Endpoints

- `GET /api/apod` - Get the Astronomy Picture of the Day
- `GET /api/celestial-objects` - Get all celestial objects (supports filtering)
- `GET /api/celestial-objects/:id` - Get a specific celestial object
- `POST /api/celestial-objects` - Create a custom celestial object
- `GET /api/celestial-object-types` - Get available celestial object types
- `GET /api/monthly-guide` - Get the monthly sky guide
- `GET /api/observations` - Get user's observation list
- `POST /api/observations` - Add a celestial object to observation list
- `PATCH /api/observations/:id` - Update an observation (mark as observed, add notes)
- `DELETE /api/observations/:id` - Remove an observation
- `GET /api/telescope-tips` - Get telescope tips (supports filtering by category)
- `GET /api/info` - Get API information and status

## Setup

### Prerequisites

- Python 3.10+
- Flask
- Requests
- python-dotenv
- flask-cors

### Environment Variables

Create a `.env` file in the project root with the following:

```
# NASA API key (get yours at https://api.nasa.gov/)
NASA_API_KEY=your_nasa_api_key_here

# Server port (default: 5001)
PORT=5001
```

### Running the Server

```bash
python run.py
```

This will start the server on the port specified in the `.env` file (default: 5001).

## Error Handling

The server implements comprehensive error handling for:

- NASA API rate limiting
- Invalid date formats
- Network connectivity issues
- Request timeouts
- Authorization errors
- Resource not found errors

## Data Storage

The server uses an in-memory storage implementation for demonstration purposes. This means data will be lost when the server is restarted.

## Future Improvements

- Persistent database storage
- User authentication
- Enhanced error handling and logging
- More detailed astronomy data
- Integration with additional astronomy APIs