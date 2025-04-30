#!/bin/bash

# Create dev scripts since we can't modify package.json directly
echo "Starting both the TypeScript proxy server and Vite frontend server..."

# Start the TypeScript proxy server (which launches Python backend)
NODE_ENV=development tsx server/index.ts &
TS_SERVER_PID=$!

# Wait for Python server to start
sleep 3

# Start the Vite dev server
cd client && npx vite --port 5173 --host &
VITE_SERVER_PID=$!

# Handle Ctrl+C to terminate both servers gracefully
trap "kill $TS_SERVER_PID $VITE_SERVER_PID; exit" INT TERM EXIT

# Wait for both processes
wait