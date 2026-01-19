#!/bin/bash

echo "🚀 Starting B2B Marketing AI (Local Mode)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if API server is already running
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  API server already running on port 3001"
else
    echo "Starting local API server..."
    node server.js &
    API_PID=$!
    echo "✓ API server started (PID: $API_PID)"
fi

# Wait for API to be ready
sleep 2

# Start frontend
echo ""
echo "Starting frontend..."
cd frontend && npm run dev

# Cleanup on exit
trap "kill $API_PID 2>/dev/null" EXIT
