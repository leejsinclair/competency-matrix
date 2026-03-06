#!/bin/bash

# Start MSSQL database and initialize it for the Competency Matrix Platform

set -e

echo "🗄️  Starting MSSQL database for Competency Matrix..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    echo "❌ docker-compose is not installed. Please install docker-compose first."
    exit 1
fi

# Start the database container
echo "🚀 Starting MSSQL container..."
cd "$(dirname "$0")/.."
docker-compose up -d mssql

# Wait for the database to be ready
echo "⏳ Waiting for MSSQL to be ready..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if docker exec competency-matrix-db /opt/mssql-tools18/bin/sqlcmd -No -S localhost,1433 -U sa -P sa-Password@01 -Q "SELECT 1" > /dev/null 2>&1; then
        echo "✅ MSSQL is ready!"
        break
    fi
    
    echo "⏳ Attempt $attempt/$max_attempts: Waiting for MSSQL..."
    sleep 2
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ MSSQL failed to start within expected time."
    echo "📋 Check container logs with: docker logs competency-matrix-db"
    exit 1
fi

# Initialize the database schema
echo "🔧 Initializing database schema..."
if docker exec competency-matrix-db /opt/mssql-tools18/bin/sqlcmd -No -S localhost,1433 -U sa -P sa-Password@01 -d competency_matrix -Q "SELECT COUNT(*) as table_count FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'" > /dev/null 2>&1; then
    echo "✅ Database schema already initialized"
else
    echo "🔧 Running database initialization..."
    docker exec competency-matrix-db /opt/mssql-tools18/bin/sqlcmd -No -S localhost,1433 -U sa -P sa-Password@01 -i /docker-entrypoint-initdb.d/init-db.sql
    echo "✅ Database schema initialized successfully"
fi

# Run the Node.js database initialization to test connectivity
echo "🧪 Testing database connectivity with Node.js..."
npm run db status

echo ""
echo "🎉 MSSQL database setup completed!"
echo ""
echo "📋 Database Information:"
echo "   📍 Host: localhost"
echo "   🌐 Port: 1433"
echo "   🗄️  Database: competency_matrix"
echo "   👤 User: sa"
echo "   🔐 Password: sa-Password@01"
echo ""
echo "🔧 Useful commands:"
echo "   📊 Check status: npm run db status"
echo "   🔄 Reset database: npm run db reset"
echo "   🛑 Stop database: docker stop competency-matrix-db"
echo "   📋 View logs: docker logs -f competency-matrix-db"
echo ""
echo "🚀 You can now start the application with: npm run dev"
