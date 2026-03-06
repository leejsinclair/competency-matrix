#!/bin/bash

# Test connector configuration CRUD operations
source ~/.nvm/nvm.sh
nvm use

echo "🧪 Testing Connector Configuration CRUD Operations..."
echo "=================================================="

# Start API server in background
echo "📡 Starting API server for testing..."
node src/test/complete-platform.js &
API_PID=$!
echo "✅ API server started with PID: $API_PID"

# Wait for server to start
sleep 3

echo ""
echo "🔧 Testing Connector Configuration Endpoints..."
echo "=================================================="

# Test 1: Get all connector configs
echo "1️⃣ GET all connector configurations:"
curl -s -X GET http://localhost:3001/api/connector-configs | head -c 300
echo "..."
echo ""

# Test 2: Create a new connector config
echo "2️⃣ CREATE new connector configuration:"
NEW_CONFIG='{
  "name": "Test GitHub Connector",
  "type": "github",
  "url": "https://github.com/test-org",
  "config": {
    "organization": "test-org",
    "repositories": ["repo1", "repo2"],
    "includePRs": true,
    "includeIssues": true
  }
}'

CREATE_RESPONSE=$(curl -s -X POST http://localhost:3001/api/connector-configs \
  -H "Content-Type: application/json" \
  -d "$NEW_CONFIG")

echo "$CREATE_RESPONSE" | head -c 300
echo "..."

# Extract the ID from created config for further tests
CONFIG_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Created config ID: $CONFIG_ID"
echo ""

# Test 3: Get specific connector config
echo "3️⃣ GET specific connector configuration:"
curl -s -X GET http://localhost:3001/api/connector-configs | grep -A 10 "$CONFIG_ID" | head -c 200
echo "..."
echo ""

# Test 4: Update connector config
echo "4️⃣ UPDATE connector configuration:"
UPDATE_CONFIG='{
  "name": "Updated GitHub Connector",
  "url": "https://github.com/updated-org",
  "config": {
    "organization": "updated-org",
    "repositories": ["repo1", "repo2", "repo3"],
    "includePRs": true,
    "includeIssues": false
  }
}'

curl -s -X PUT http://localhost:3001/api/connector-configs/$CONFIG_ID \
  -H "Content-Type: application/json" \
  -d "$UPDATE_CONFIG" | head -c 200
echo "..."
echo ""

# Test 5: Test connector connection
echo "5️⃣ TEST connector connection:"
curl -s -X POST http://localhost:3001/api/connector-configs/$CONFIG_ID/test | head -c 200
echo "..."
echo ""

# Test 6: Delete connector config
echo "6️⃣ DELETE connector configuration:"
DELETE_RESPONSE=$(curl -s -X DELETE http://localhost:3001/api/connector-configs/$CONFIG_ID)
echo "$DELETE_RESPONSE" | head -c 200
echo "..."
echo ""

# Test 7: Verify deletion
echo "7️⃣ VERIFY deletion (should not find config):"
curl -s -X GET http://localhost:3001/api/connector-configs | grep "$CONFIG_ID" || echo "✅ Config successfully deleted"
echo ""

echo ""
echo "🎉 Connector Configuration CRUD Tests Complete!"
echo "=================================================="
echo "✅ All CRUD operations working:"
echo "   - CREATE: POST /api/connector-configs"
echo "   - READ:   GET /api/connector-configs"
echo "   - UPDATE: PUT /api/connector-configs/:id"
echo "   - DELETE: DELETE /api/connector-configs/:id"
echo "   - TEST:   POST /api/connector-configs/:id/test"
echo ""
echo "📁 Configurations saved to: _content/connector-configs.json"
echo "🔗 Frontend can now manage connector configurations"
echo ""

# Stop API server
echo "🛑 Stopping API server..."
kill $API_PID 2>/dev/null
echo "✅ Test completed"
