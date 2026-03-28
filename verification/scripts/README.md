# Verification Scripts

This directory contains utility scripts for database management and data verification.

## Scripts

### Data Management Scripts
- **add-detailed-data-all.js** - Add detailed competency data for all developers
- **add-sample-labels.js** - Add sample competency labels for testing

### Data Verification Scripts
- **check-all-developer-data.js** - Check competency data for all developers
- **check-levels.js** - Verify competency level distribution
- **check-labels.js** - Check competency labels in database

## Usage

### Prerequisites
- Node.js installed
- MSSQL database connection configured
- Appropriate database permissions

### Running Scripts
```bash
# From the project root directory
node verification/scripts/check-all-developer-data.js
node verification/scripts/add-detailed-data-all.js
node verification/scripts/check-levels.js
```

## Script Descriptions

### add-detailed-data-all.js
Adds detailed competency breakdowns for all developers based on existing base competencies.
- Generates 3 detailed rows per category (15 total per developer)
- Calculates levels and confidence scores based on weights
- Uses UPSERT logic to avoid duplicates
- Provides progress feedback during execution

### add-sample-labels.js
Adds sample detailed competency labels for Fiona Wrigley (used for initial testing).
- Direct database insertion for testing purposes
- Bypasses processing scripts for quick setup
- Used for development and verification

### check-all-developer-data.js
Analyzes competency data across all developers.
- Shows competency counts per developer
- Identifies missing detailed breakdowns
- Provides detailed analysis of data completeness
- Helps identify data quality issues

### check-levels.js
Checks competency level distribution across the system.
- Shows level distribution statistics
- Identifies patterns in competency levels
- Provides insights into data balance

### check-labels.js
Verifies competency labels in the database.
- Checks label counts and distribution
- Validates label data integrity
- Helps identify labeling issues

## Database Configuration

Scripts expect the following database configuration:
- Server: localhost
- Database: competency_matrix
- User: sa
- Password: sa-Password@01

## Error Handling

Scripts include comprehensive error handling:
- Database connection errors
- SQL execution errors
- Data validation errors
- Progress feedback and logging

## Maintenance

### Updating Scripts
- Modify database configuration if needed
- Update logic for schema changes
- Add additional validation checks
- Improve error messages and logging

### Adding New Scripts
- Follow existing naming conventions
- Include comprehensive error handling
- Add progress feedback
- Update this README

## Notes

- These scripts were created for development and verification
- They can be used for data migration and testing
- Scripts may need updates as the schema evolves
- Always backup data before running modification scripts
