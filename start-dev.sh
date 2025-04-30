#!/bin/bash

# Start both servers using concurrently
npx concurrently -n "TS_PROXY,VITE" -c "blue.bold,green.bold" \
  "NODE_ENV=development tsx server/index.ts" \
  "cd client && npx vite --port 5173"