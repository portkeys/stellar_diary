from python_server.app import app
from python_server.services.celestial_objects import seed_database

if __name__ == "__main__":
    # Seed database before starting the server
    seed_database()
    # Run the Flask application
    app.run(host='0.0.0.0', port=5000, debug=True)