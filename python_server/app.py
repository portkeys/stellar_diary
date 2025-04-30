from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from dotenv import load_dotenv
import requests
import json
from datetime import datetime
from python_server.data.models import (
    CelestialObject, Observation, MonthlyGuide, TelescopeTip, User,
    celestial_object_types
)
from python_server.services.nasa_api import fetch_apod, fetch_apod_range, NASA_API_KEY
from python_server.services.celestial_objects import seed_database, get_current_month, get_current_year, filter_celestial_objects

# Load environment variables
load_dotenv()

app = Flask(__name__)
# Enable CORS for all routes and origins
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Initialize storage
from python_server.data.storage import storage

# We'll seed the database in run.py instead of using before_first_request
# as it's deprecated in newer Flask versions

# NASA APOD API endpoint
@app.route('/api/apod', methods=['GET'])
def get_apod():
    try:
        date = request.args.get('date')
        apod_data = fetch_apod(date)
        return jsonify(apod_data)
    except requests.exceptions.HTTPError as e:
        # Handle specific HTTP errors
        status_code = e.response.status_code if hasattr(e, 'response') and e.response else 500
        
        if status_code == 400:
            return jsonify({
                'message': 'Invalid request parameters. Please check your date format (YYYY-MM-DD).'
            }), 400
        elif status_code == 404:
            return jsonify({
                'message': 'No APOD data found for the specified date. Please try a different date.'
            }), 404
        elif status_code == 429:
            return jsonify({
                'message': 'NASA API rate limit exceeded. Please try again later or use a personal API key.'
            }), 429
        else:
            return jsonify({
                'message': f'NASA API error: {str(e)}'
            }), status_code
    except requests.exceptions.ConnectionError:
        return jsonify({
            'message': 'Unable to connect to NASA API. Please check your internet connection and try again.'
        }), 503
    except requests.exceptions.Timeout:
        return jsonify({
            'message': 'NASA API request timed out. Please try again later.'
        }), 504
    except Exception as e:
        return jsonify({
            'message': f'Failed to fetch APOD: {str(e)}'
        }), 500

# Get all celestial objects
@app.route('/api/celestial-objects', methods=['GET'])
def get_celestial_objects():
    try:
        object_type = request.args.get('type')
        month = request.args.get('month')
        hemisphere = request.args.get('hemisphere')
        
        # If any filters are provided, use the filter function
        if object_type or month or hemisphere:
            objects = filter_celestial_objects(object_type, month, hemisphere)
            return jsonify(objects)
        
        # Otherwise return all objects
        objects = storage.get_all_celestial_objects()
        return jsonify([obj.to_dict() for obj in objects])
    except Exception as e:
        return jsonify({
            'message': f'Failed to get celestial objects: {str(e)}'
        }), 500

# Get celestial object by ID
@app.route('/api/celestial-objects/<int:id>', methods=['GET'])
def get_celestial_object(id):
    try:
        obj = storage.get_celestial_object(id)
        
        if not obj:
            return jsonify({'message': 'Celestial object not found'}), 404
        
        return jsonify(obj.to_dict())
    except Exception as e:
        return jsonify({
            'message': f'Failed to get celestial object: {str(e)}'
        }), 500

# Create a new celestial object (for custom observations)
@app.route('/api/celestial-objects', methods=['POST'])
def create_celestial_object():
    try:
        data = request.json
        
        # Set default values for required fields if they're not provided
        if 'visibilityRating' not in data:
            data['visibilityRating'] = 'Custom'
        if 'information' not in data:
            data['information'] = 'Custom celestial object'
        if 'imageUrl' not in data:
            data['imageUrl'] = 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=800&h=500'
        if 'constellation' not in data:
            data['constellation'] = 'Not specified'
        if 'magnitude' not in data:
            data['magnitude'] = 'Not specified'
        if 'recommendedEyepiece' not in data:
            data['recommendedEyepiece'] = 'Not specified'
        
        new_object = storage.create_celestial_object(data)
        return jsonify(new_object.to_dict()), 201
    except Exception as e:
        return jsonify({
            'message': f'Failed to create celestial object: {str(e)}'
        }), 500

# Get celestial object types (for filtering)
@app.route('/api/celestial-object-types', methods=['GET'])
def get_celestial_object_types():
    try:
        return jsonify(celestial_object_types)
    except Exception as e:
        return jsonify({
            'message': f'Failed to get celestial object types: {str(e)}'
        }), 500

# Get monthly guide
@app.route('/api/monthly-guide', methods=['GET'])
def get_monthly_guide():
    try:
        month = request.args.get('month') or get_current_month()
        year = int(request.args.get('year') or get_current_year())
        hemisphere = request.args.get('hemisphere') or 'Northern'
        
        # Find a matching guide
        guides = storage.get_all_monthly_guides()
        guide = next((g for g in guides if 
                    g.month == month and 
                    g.year == year and 
                    (g.hemisphere == hemisphere or g.hemisphere == 'both')), None)
        
        if not guide:
            return jsonify({'message': 'Monthly guide not found'}), 404
        
        return jsonify(guide.to_dict())
    except Exception as e:
        return jsonify({
            'message': f'Failed to get monthly guide: {str(e)}'
        }), 500

# Get user's observation list
@app.route('/api/observations', methods=['GET'])
def get_observations():
    try:
        # For demo purposes, we'll use a fixed user ID of 1
        user_id = 1
        observations = storage.get_user_observations(user_id)
        
        # Enhance with celestial object details
        enhanced_observations = []
        for obs in observations:
            celestial_object = storage.get_celestial_object(obs.object_id)
            obs_dict = obs.to_dict()
            obs_dict['celestialObject'] = celestial_object.to_dict() if celestial_object else None
            enhanced_observations.append(obs_dict)
        
        return jsonify(enhanced_observations)
    except Exception as e:
        return jsonify({
            'message': f'Failed to get observations: {str(e)}'
        }), 500

# Add to observation list
@app.route('/api/observations', methods=['POST'])
def create_observation():
    try:
        data = request.json
        
        # Check if celestial object exists
        celestial_object = storage.get_celestial_object(data['objectId'])
        if not celestial_object:
            return jsonify({'message': 'Celestial object not found'}), 404
        
        # For demo purposes, we'll use a fixed user ID of 1
        user_id = 1
        data['userId'] = user_id
        
        # Create new observation
        new_observation = storage.create_observation(data)
        
        return jsonify(new_observation.to_dict()), 201
    except Exception as e:
        return jsonify({
            'message': f'Failed to create observation: {str(e)}'
        }), 500

# Update observation (mark as observed, add notes)
@app.route('/api/observations/<int:id>', methods=['PATCH'])
def update_observation(id):
    try:
        observation = storage.get_observation(id)
        
        if not observation:
            return jsonify({'message': 'Observation not found'}), 404
        
        # For demo purposes, we'll use a fixed user ID of 1
        user_id = 1
        if observation.user_id != user_id:
            return jsonify({'message': 'Not authorized to update this observation'}), 403
        
        updated_observation = storage.update_observation(id, request.json)
        if updated_observation:
            return jsonify(updated_observation.to_dict())
        return jsonify({'message': 'Failed to update observation'}), 500
    except Exception as e:
        return jsonify({
            'message': f'Failed to update observation: {str(e)}'
        }), 500

# Delete observation
@app.route('/api/observations/<int:id>', methods=['DELETE'])
def delete_observation(id):
    try:
        observation = storage.get_observation(id)
        
        if not observation:
            return jsonify({'message': 'Observation not found'}), 404
        
        # For demo purposes, we'll use a fixed user ID of 1
        user_id = 1
        if observation.user_id != user_id:
            return jsonify({'message': 'Not authorized to delete this observation'}), 403
        
        storage.delete_observation(id)
        return '', 204
    except Exception as e:
        return jsonify({
            'message': f'Failed to delete observation: {str(e)}'
        }), 500

# Get telescope tips
@app.route('/api/telescope-tips', methods=['GET'])
def get_telescope_tips():
    try:
        category = request.args.get('category')
        
        if category:
            tips = storage.get_telescope_tips_by_category(category)
            return jsonify([tip.to_dict() for tip in tips])
        
        tips = storage.get_all_telescope_tips()
        return jsonify([tip.to_dict() for tip in tips])
    except Exception as e:
        return jsonify({
            'message': f'Failed to get telescope tips: {str(e)}'
        }), 500

# Get API info (for informational purposes)
@app.route('/api/info', methods=['GET'])
def get_api_info():
    """Returns information about the API configuration"""
    try:
        using_demo_key = NASA_API_KEY == 'DEMO_KEY'
        
        return jsonify({
            'version': '1.0.0',
            'nasa_api': {
                'using_demo_key': using_demo_key,
                'limitations': {
                    'hourly_limit': 30 if using_demo_key else 1000,
                    'daily_limit': 50 if using_demo_key else 10000
                },
                'api_key_info': 'Get your free NASA API key at https://api.nasa.gov/' if using_demo_key else 'Using custom NASA API key'
            }
        })
    except Exception as e:
        return jsonify({
            'message': f'Failed to get API information: {str(e)}'
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5001)))