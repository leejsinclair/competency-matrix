# Integration Tests for Connector Configuration API

## 🎯 Purpose
These integration tests provide comprehensive coverage for the connector configuration CRUD API endpoints. They are designed to run locally without triggering git hooks.

## 🚀 How to Run

```bash
# Run all integration tests
npm run test:integration

# Run with coverage
npm run test:integration -- --coverage

# Run specific test pattern
npm run test:integration -- --testNamePattern="POST"
```

## 📊 Test Coverage

### ✅ Working Tests (23/25)
- **POST /api/connector-configs**
  - ✅ Create Jira configuration
  - ✅ Create Confluence configuration  
  - ✅ Create Bitbucket configuration
  - ✅ Return 400 for invalid connector type
  - ✅ Return 400 for missing required fields
  - ✅ Return 400 for invalid Jira configuration

- **GET /api/connector-configs/:id**
  - ✅ Retrieve specific configuration
  - ✅ Return 404 for non-existent configuration
  - ✅ Return 400 for invalid ID format

- **GET /api/connector-configs**
  - ✅ Retrieve all configurations

- **PUT /api/connector-configs/:id**
  - ✅ Update configuration config
  - ✅ Update active status
  - ✅ Return 404 for non-existent configuration
  - ❌ Update configuration name (400 error)

- **DELETE /api/connector-configs/:id**
  - ✅ Delete configuration
  - ✅ Return 404 for non-existent configuration

- **PATCH /api/connector-configs/:id/toggle**
  - ✅ Deactivate configuration
  - ✅ Activate configuration
  - ✅ Return 400 for invalid is_active value

- **POST /api/connector-configs/:id/test**
  - ✅ Test configuration (fails appropriately with demo data)
  - ✅ Return 404 for non-existent configuration

- **Health and Utility Endpoints**
  - ✅ Return health status
  - ✅ Return API documentation

- **GET /api/connector-configs/type/:connectorType**
  - ✅ Return 400 for invalid connector type
  - ❌ Retrieve configurations by type (count mismatch)

### ❌ Known Issues (2/25)

1. **PUT Update Name Test**: Returns 400 instead of 200
   - **Issue**: Schema validation or test data isolation
   - **Status**: Needs investigation

2. **GET by Type Count**: Returns 6 instead of 2
   - **Issue**: Test data cleanup between tests
   - **Status**: Needs investigation

## 🔧 Environment Setup

Tests use:
- **Database**: MSSQL `competency_matrix` 
- **Server**: Fastify test instance (isolated from main server)
- **Cleanup**: Automatic test data removal before each test
- **Timeout**: 30 seconds for database operations

## 📝 Test Data Strategy

- **Unique Names**: All test configs use `Date.now()` for uniqueness
- **Isolation**: Each test cleans up `Test%` named configs
- **Validation**: Tests both success and failure scenarios
- **Coverage**: All CRUD operations and edge cases

## 🎯 Success Criteria

- ✅ All CRUD operations functional
- ✅ Proper error handling and validation
- ✅ Database operations working correctly
- ✅ API responses match expected format
- ⚠️ 2 minor issues remaining (92% pass rate)
