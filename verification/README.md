# Verification Tests

This directory contains verification and test scripts for the CircleCI Engineering Competency Matrix.

## Test Files

### Matrix Functionality Tests
- **test-circleci-matrix.js** - Basic CircleCI matrix functionality
- **test-integrated-matrix.js** - Matrix integration with main application
- **test-final-integration.js** - Complete integration testing
- **test-matrix-data.js** - Matrix data loading and rendering

### Flashcard & Description Tests
- **test-flashcards.js** - Flashcard toggle functionality
- **test-all-descriptions.js** - All cell descriptions display
- **test-all-cells-descriptions.js** - Complete cell coverage testing
- **test-level2-descriptions.js** - Level 2 competency descriptions

### Developer & Data Tests
- **test-fwrigley-visual.js** - Fiona Wrigley visual matrix verification
- **test-fwrigley-specific.js** - Fiona Wrigley specific competency tests
- **test-fwrigley-detailed.js** - Fiona Wrigley detailed breakdown tests
- **test-fwrigley-scores.js** - Fiona Wrigley score validation
- **test-filtered-developers.js** - Developer filtering functionality
- **test-partial-data.js** - Partial data handling tests

### Empty Cell & Edge Case Tests
- **test-empty-competencies.js** - Empty competency display
- **test-empty-cells-direct.js** - Direct empty cell testing
- **test-fiona-all-cells.js** - Complete cell coverage for Fiona

### GUI & Integration Tests
- **test-gui-data-management.js** - GUI data management functionality
- **test-enhanced-matrix.js** - Enhanced matrix features
- **test-api-direct.js** - Direct API testing

### Evidence & Content Tests
- **test-evidence-text.js** - Evidence text processing
- **test-final-all-cells.js** - Final all cells verification

## Running Tests

### Prerequisites
- Node.js installed
- Frontend development server running (`npm run dev`)
- Backend API server running (`npm run dev:all`)

### Running Individual Tests
```bash
# From the project root directory
node verification/tests/test-circleci-matrix.js
node verification/tests/test-flashcards.js
node verification/tests/test-gui-data-management.js
```

### Running All Tests
```bash
# Run all verification tests
for test in verification/tests/test-*.js; do
  echo "Running $test..."
  node "$test"
  echo "---"
done
```

## Test Categories

### 1. Core Matrix Functionality
- Basic matrix rendering
- Developer selection
- Data loading
- API integration

### 2. Interactive Features
- Flashcard toggle functionality
- Cell click interactions
- Description display
- Confidence details

### 3. Data Integrity
- Complete cell coverage
- Empty cell handling
- Developer filtering
- Score validation

### 4. GUI Integration
- Data management buttons
- Status messages
- Error handling
- Refresh functionality

### 5. Edge Cases
- Partial data scenarios
- Empty competencies
- API failures
- Network issues

## Test Standards

### Expected Behavior
- All tests should pass without errors
- Screenshots should be captured for visual verification
- Status messages should be clear and informative
- Error handling should be graceful

### Test Structure
- Each test file focuses on a specific feature area
- Tests use Playwright for browser automation
- Results include console output and visual verification
- Tests are independent and can run in any order

### Cleanup
- Tests automatically clean up temporary files
- Screenshots are not saved (removed for cleanliness)
- Browser instances are properly closed

## Troubleshooting

### Common Issues
1. **Server not running**: Ensure both frontend and backend are running
2. **Port conflicts**: Check that ports 5173 and 3001 are available
3. **Database connection**: Verify MSSQL is accessible
4. **Missing data**: Ensure sample data is loaded in database

### Debug Mode
Add additional logging to test files for debugging:
```javascript
console.log('Debug: Current state:', state);
await page.screenshot({ path: 'debug-screenshot.png' });
```

## Maintenance

### Adding New Tests
1. Create test file following naming convention: `test-feature-name.js`
2. Use existing test files as templates
3. Focus on specific functionality or edge case
4. Include proper error handling and cleanup
5. Update this README with test description

### Updating Tests
- Modify tests when features change
- Ensure test data is up to date
- Verify test expectations match current behavior
- Update documentation as needed

### Removing Tests
- Remove obsolete test files
- Update this README
- Check for any dependencies in other tests

## Notes

- These tests were created during development for verification purposes
- They serve as documentation of expected behavior
- Tests can be used as regression testing for future changes
- Some tests may need updates as the application evolves
