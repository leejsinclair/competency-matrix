#!/bin/bash

# Start both API server and frontend development servers
source ~/.nvm/nvm.sh
nvm use

echo "🚀 Starting Competency Matrix Platform..."
echo "=================================="

# Start API server in background
echo "📡 Starting API server on port 3001..."
node src/test/api-test-simple.js &
API_PID=$!
echo "✅ API server started with PID: $API_PID"

# Wait a moment for API server to start
sleep 2

# Start frontend development server
echo "🎨 Starting frontend development server on port 5173..."
cd frontend
npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend server started with PID: $FRONTEND_PID"

echo ""
echo "🎯 Competency Matrix Platform is RUNNING!"
echo "=================================="
echo "📡 API Server:     http://localhost:3001"
echo "🎨 Frontend App:    http://localhost:5173"
echo "📊 Health Check:    http://localhost:3001/api/health"
echo "👥 Contributors:    http://localhost:3001/api/competency/contributors"
echo ""
echo "💡 Test the API:"
echo "   curl http://localhost:3001/api/health"
echo "   curl http://localhost:3001/api/competency/contributors"
echo ""
echo "🌐 Open your browser to:"
echo "   Frontend: http://localhost:5173"
echo "   API Docs: http://localhost:3001 (root endpoint)"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Function to cleanup processes
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    
    if [ ! -z "$API_PID" ]; then
        echo "📡 Stopping API server (PID: $API_PID)..."
        kill $API_PID 2>/dev/null
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        echo "🎨 Stopping frontend server (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null
    fi
    
    echo "✅ All servers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for processes
wait
