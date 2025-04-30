#!/bin/bash

# Run the Python server in the background
python run.py &
PYTHON_PID=$!

# Wait a moment for the Python server to start
sleep 2

# Run the Vite development server from the client directory where our vite.config.ts is located
cd client && NODE_ENV=development npx vite

# When Vite exits, also kill the Python server
kill $PYTHON_PID