import sys
import os

# Add the current directory to the path so Python can find the python_server module
sys.path.append(os.path.abspath("."))

from python_server.app import app
from python_server.services.celestial_objects import seed_database

if __name__ == "__main__":
    # Seed database before starting the server
    seed_database()
    # Run the Flask application
    # Using port 5000 as configured in our TypeScript proxy and Vite config
    app.run(host='0.0.0.0', port=5000, debug=True)