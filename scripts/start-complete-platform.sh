#!/bin/bash

# Start complete Competency Matrix Platform with database
source ~/.nvm/nvm.sh
nvm use

echo "🚀 Starting Complete Competency Matrix Platform..."
echo "=========================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start the database first
echo "🗄️  Starting MSSQL database..."
npm run db:start

# Wait a moment for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Start complete API server in background
echo "📡 Starting TypeScript database-backed API server on port 3001..."
cd "$(dirname "$0")/.."
API_PORT=3001 npm run start > /tmp/api-server.log 2>&1 &
API_PID=$!
echo "✅ TypeScript API server started with PID: $API_PID"

# Wait a moment for API server to start
sleep 3

# Start frontend development server
echo "🎨 Starting frontend development server on port 5173..."
cd frontend
npm run dev > /tmp/frontend-server.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend server started with PID: $FRONTEND_PID"

# Go back to project root directory
cd /home/lee/projects/competency-matrix

echo ""
echo "🎯 Complete Competency Matrix Platform is RUNNING!"
echo "=========================================="
echo "�️  Database:       MSSQL on localhost:1433"
echo "� API Server:     http://localhost:3001"
echo "🎨 Frontend App:    http://localhost:5173"
echo "📊 Health Check:    http://localhost:3001/api/health"
echo "🔌 Connectors:     http://localhost:3001/api/connector-configs"
echo "👥 Contributors:    http://localhost:3001/api/competency/contributors"
echo "📈 Summary:        http://localhost:3001/api/competency/summary"
echo ""
echo "💡 Test the platform:"
echo "   curl http://localhost:3001/api/health"
echo "   curl http://localhost:3001/api/connector-configs"
echo "   curl http://localhost:3001/api/competency/contributors"
echo ""
echo "🌐 Open your browser to:"
echo "   Frontend: http://localhost:5173"
echo "   API Docs: http://localhost:3001"
echo ""
echo "🔧 Database commands:"
echo "   📊 Status: npm run db status"
echo "   📋 Logs: npm run db:logs"
echo "   🛑 Stop: npm run db:stop"
echo ""
echo "� Server logs:"
echo "   📡 API Server: tail -f /tmp/api-server.log"
echo "   🎨 Frontend: tail -f /tmp/frontend-server.log"
echo ""
echo "�� Platform Features:"
echo "   ✅ Real contributor data (33 profiles)"
echo "   ✅ Competency classification"
echo "   ✅ Connector management"
echo "   ✅ Analytics dashboard"
echo "   ✅ Configuration interface"
echo "   ✅ MSSQL database backend"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Function to cleanup processes
cleanup() {
    echo ""
    echo "🛑 Shutting down Competency Matrix Platform..."
    
    if [ ! -z "$API_PID" ]; then
        echo "📡 Stopping API server (PID: $API_PID)..."
        kill $API_PID 2>/dev/null
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        echo "🎨 Stopping frontend server (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null
    fi
    
    echo "✅ API and Frontend servers stopped"
    echo "💡 Database continues running. Stop it with: npm run db:stop"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for processes
wait
