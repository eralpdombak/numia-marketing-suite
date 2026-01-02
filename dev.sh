#!/bin/bash
# B2B Marketing AI - Development Environment Startup Script
# Starts both local API server and React frontend

set -e # Exit on error

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 B2B Marketing AI Development Environment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if node_modules exists (dependencies installed)
if [ ! -d "node_modules" ]; then
    echo "⚠️  Dependencies not installed. Running npm install..."
    npm install
    echo ""
fi

# Check if frontend node_modules exists
if [ ! -d "frontend/node_modules" ]; then
    echo "⚠️  Frontend dependencies not installed. Running npm install..."
    cd frontend && npm install && cd ..
    echo ""
fi

# Check if content_index.json exists, create empty one if not
if [ ! -f "content_index.json" ]; then
    echo "📝 Creating empty content_index.json..."
    echo '{"tracked_files":{}}' > content_index.json
    echo ""
fi

# Start API server in background
echo "🔧 Starting Local Content API..."
node server.js &
API_PID=$!
echo "   ✓ API server started (PID: $API_PID)"
echo ""

# Wait for API to be ready
echo "⏳ Waiting for API to be ready..."
sleep 2

# Check if API is running
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "   ✓ API health check passed"
else
    echo "   ⚠️  API health check failed, but continuing..."
fi
echo ""

# Start frontend dev server in background
echo "🎨 Starting Frontend..."
cd frontend && npm run dev &
FRONTEND_PID=$!
cd ..
echo "   ✓ Frontend started (PID: $FRONTEND_PID)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Development Environment Ready!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Services:"
echo "   • Local API:  http://localhost:3001"
echo "   • Frontend:   http://localhost:8080"
echo ""
echo "💡 Tips:"
echo "   • Generate content with: python3 track_content.py"
echo "   • Content auto-refreshes every 5 seconds in Library"
echo "   • Press CTRL+C to stop all services"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Trap CTRL+C to kill both processes gracefully
cleanup() {
    echo ""
    echo ""
    echo "🛑 Shutting down services..."
    kill $API_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "   ✓ API server stopped"
    echo "   ✓ Frontend stopped"
    echo ""
    echo "👋 Goodbye!"
    echo ""
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for both processes
wait
