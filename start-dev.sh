#!/bin/bash

# Kill any processes that might be using our ports
echo "Killing any processes using ports 3000 and 5173..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Start both servers using concurrently
echo "Starting TypeScript proxy server and Vite frontend server..."
npx concurrently -n "TS_PROXY,VITE" -c "blue.bold,green.bold" \
  "NODE_ENV=development tsx server/index.ts" \
  "cd client && npx vite --port 5173 --host 0.0.0.0"