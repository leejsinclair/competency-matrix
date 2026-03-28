#!/bin/bash

# Start both frontend and backend in development mode
# This script uses concurrently to run both processes

echo "🚀 Starting competency matrix development environment..."
echo "📦 Backend: http://localhost:3001"
echo "🎨 Frontend: http://localhost:5173"
echo ""

# Check if concurrently is installed
if ! command -v concurrently &> /dev/null; then
    echo "📦 Installing concurrently for concurrent process management..."
    npm install -g concurrently
fi

# Start both backend and frontend
echo "🔄 Starting backend and frontend concurrently..."
concurrently \
    "npm run dev" \
    "cd frontend && npm run dev" \
    --names "backend,frontend" \
    --prefix-colors "blue,cyan"
