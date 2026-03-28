# Session Setup Guide

## 🚀 Quick Start for Future Development Sessions

This guide helps you quickly get up and running with the CircleCI Engineering Competency Matrix development environment.

## 📋 Prerequisites Check

### 1. Environment Verification
```bash
# Check Node.js version (should be v20.19.3)
node --version

# Check npm version
npm --version

# Check if MSSQL is running
docker ps | grep mssql
```

### 2. Project Status Overview
```bash
# Check current project status
cat storyplan.md | grep -A 5 "Current Status"

# Review recent progress
grep -A 10 "🎉 MAJOR RECENT ACHIEVEMENTS" storyplan.md

# Check git status
git status
git log --oneline -5
```

## 🔄 Development Environment Setup

### 1. Start Development Servers
```bash
# Start both frontend and backend
npm run dev:all

# Alternative: Start separately
# Terminal 1: npm run dev (frontend)
# Terminal 2: npm run dev:backend (backend)
```

### 2. Verify Servers Are Running
```bash
# Check frontend (should return HTML)
curl http://localhost:5173

# Check backend (should return API status)
curl http://localhost:3001/health

# Check matrix API
curl http://localhost:3001/api/matrix/team
```

### 3. Open Application
- **Frontend**: http://localhost:5173
- **Matrix Page**: http://localhost:5173/matrix
- **Analytics**: http://localhost:5173/analytics
- **Configuration**: http://localhost:5173/configuration

## 📁 Key Files and Directories

### 📋 Planning & Documentation
```
storyplan.md                    # Main project roadmap
DEVELOPMENT_WORKFLOW.md         # Development process guide
GUI_DATA_MANAGEMENT.md         # Feature documentation
SESSION_SETUP.md              # This setup guide
```

### 🧪 Testing & Verification
```
verification/
├── tests/                     # Playwright test scripts
├── scripts/                   # Database utilities
└── README.md                  # Verification documentation
```

### 🎯 Frontend Components
```
frontend/src/
├── components/
│   ├── SimpleMatrix.tsx      # Main matrix component
│   ├── ComponentTemplate.tsx  # Template for new components
│   └── [other components]
├── pages/
│   ├── Matrix.tsx            # Main matrix page
│   ├── PageTemplate.tsx      # Template for new pages
│   └── [other pages]
└── App.tsx                   # Main app component
```

### 🔧 Backend API
```
src/
├── api/routes/
│   ├── processing-routes.ts  # Data management endpoints
│   ├── matrix-routes.ts      # Matrix data endpoints
│   ├── routeTemplate.ts      # Template for new routes
│   └── [other routes]
├── database/
│   └── [schema files]
└── index.ts                  # Main server file
```

## 🎯 Development Workflow

### 1. Feature Development Process
```bash
# 1. Identify next feature
grep "🚧" storyplan.md

# 2. Create component template
cp frontend/src/components/ComponentTemplate.tsx frontend/src/components/NewFeature.tsx

# 3. Create test template
cp verification/tests/test-template.js verification/tests/test-new-feature.js

# 4. Implement feature
# Edit NewFeature.tsx with your implementation

# 5. Write tests
# Edit test-new-feature.js with Playwright tests

# 6. Test and iterate
node verification/tests/test-new-feature.js

# 7. Integrate and document
# Update storyplan.md and related documentation
```

### 2. Testing Process
```bash
# Run specific test
node verification/tests/test-new-feature.js

# Run all tests
for test in verification/tests/test-*.js; do
  echo "Running $test..."
  node "$test"
  echo "---"
done

# Test GUI data management
node verification/tests/test-gui-data-management.js

# Test matrix functionality
node verification/tests/test-circleci-matrix.js
```

### 3. Data Management
```bash
# Check data integrity
node verification/scripts/check-all-developer-data.js

# Add detailed data if needed
node verification/scripts/add-detailed-data-all.js

# Check competency levels
node verification/scripts/check-levels.js
```

## 🔧 Common Development Tasks

### Adding New Component
```bash
# 1. Create component
cp frontend/src/components/ComponentTemplate.tsx frontend/src/components/YourComponent.tsx

# 2. Implement component
# Edit YourComponent.tsx

# 3. Add to page
# Edit appropriate page file

# 4. Create test
cp verification/tests/test-template.js verification/tests/test-your-component.js

# 5. Test integration
node verification/tests/test-your-component.js
```

### Adding New API Endpoint
```bash
# 1. Create route
cp src/api/routes/routeTemplate.ts src/api/routes/your-route.ts

# 2. Implement endpoints
# Edit your-route.ts

# 3. Register in server
# Edit src/api/server.ts

# 4. Test API
curl http://localhost:3001/api/your-route

# 5. Create frontend integration
# Add API calls to components
```

### Database Operations
```bash
# Check database connection
node verification/scripts/check-all-developer-data.js

# Add sample data
node verification/scripts/add-sample-labels.js

# Verify data integrity
node verification/scripts/check-labels.js
```

## 🐛 Troubleshooting

### Common Issues

#### Server Won't Start
```bash
# Check for port conflicts
lsof -ti:3001
lsof -ti:5173

# Kill processes if needed
kill -9 <process-id>

# Restart servers
npm run dev:all
```

#### Database Connection Issues
```bash
# Check MSSQL container
docker ps | grep mssql

# Restart if needed
docker-compose restart mssql

# Verify connection
node verification/scripts/check-all-developer-data.js
```

#### Test Failures
```bash
# Check if servers are running
curl http://localhost:5173
curl http://localhost:3001/health

# Check test script
node verification/tests/test-template.js

# Debug with console logs
# Add console.log statements to test script
```

#### Frontend Build Issues
```bash
# Clear cache
rm -rf frontend/node_modules frontend/dist frontend/.vite

# Reinstall dependencies
cd frontend && npm install

# Restart development server
npm run dev
```

## 📊 Current Features Status

### ✅ Completed Features
- **CircleCI Engineering Competency Matrix**: Full implementation at `/matrix`
- **Interactive Flashcard UI**: Click cells to toggle descriptions/confidence
- **GUI Data Management**: Refresh/Reanalyze buttons with real-time feedback
- **Detailed Competency Breakdowns**: 15 detailed competencies per developer
- **Analytics Dashboard**: Comprehensive competency insights at `/analytics`
- **Connector Management**: Jira, Confluence, Bitbucket integration

### 🚧 Next Development Areas
- **Evidence Traceability**: Score validation and evidence chain visibility
- **Self-Evaluation Module**: Developer assessment interface
- **Individual Developer Reports**: Personal competency profiles
- **Authentication System**: JWT/OAuth security (optional)

## 🎯 Quick Development Commands

### Feature Development
```bash
# Start new feature
cp frontend/src/components/ComponentTemplate.tsx frontend/src/components/NewFeature.tsx
cp verification/tests/test-template.js verification/tests/test-new-feature.js

# Test feature
node verification/tests/test-new-feature.js

# Clean up after development
mv test-*.js verification/tests/
rm *.png
```

### Data Operations
```bash
# Check data status
node verification/scripts/check-all-developer-data.js

# Refresh matrix data
# Use GUI: http://localhost:5173/matrix -> Click "Refresh Data"

# Reanalyze data
# Use GUI: http://localhost:5173/matrix -> Click "Reanalyze Data"
```

### Documentation Updates
```bash
# Update story plan
# Edit storyplan.md with progress

# Update feature documentation
# Edit relevant documentation files

# Commit changes
git add .
git commit -m "Feature: Add new feature with comprehensive testing"
```

## 📞 Getting Help

### Internal Resources
- **DEVELOPMENT_WORKFLOW.md**: Complete development process guide
- **GUI_DATA_MANAGEMENT.md**: Feature-specific documentation
- **storyplan.md**: Project roadmap and requirements
- **verification/README.md**: Testing documentation

### Debug Commands
```bash
# Check system status
npm run dev:all

# Verify functionality
node verification/tests/test-circleci-matrix.js
node verification/tests/test-gui-data-management.js

# Check data integrity
node verification/scripts/check-all-developer-data.js
```

---

**Ready to start development! 🚀 Follow this guide for quick setup and efficient workflow.**
