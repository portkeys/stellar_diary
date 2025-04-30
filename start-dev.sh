#!/bin/bash

# Create dev scripts since we can't modify package.json directly
echo "Starting both the TypeScript proxy server and Vite frontend server..."

# Use concurrently to run both servers
npx concurrently \
  "NODE_ENV=development tsx server/index.ts" \
  "cd client && npx vite --port 3001 --host"