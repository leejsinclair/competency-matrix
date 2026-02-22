#!/bin/bash

# Integration Test Runner
# This script runs integration tests locally without triggering git hooks

set -e

echo "🧪 Running Integration Tests..."

# Set test environment variables
export NODE_ENV=test
export DB_SERVER=localhost
export DB_NAME=competency_matrix
export DB_USER=sa
export DB_PASSWORD=sa-Password@01
export DB_ENCRYPT=false

# Run integration tests with custom config
echo "📋 Running connector configuration integration tests..."
./scripts/with-nvm.sh jest --config jest.integration.config.js --verbose --no-cache

echo "✅ Integration tests completed successfully!"
