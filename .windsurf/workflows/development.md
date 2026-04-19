---
description: Start development environment and setup
---

# Development Workflow

## Quick Start Setup

1. **Start all servers**
   ```bash
   npm run dev:all
   ```

2. **Verify services are running**
   ```bash
   curl http://localhost:5173  # Frontend
   curl http://localhost:3001/health  # Backend API
   ```

3. **Review current status**
   - Check SESSION_SETUP.md for current project status
   - Review storyplan.md for next features (look for 🚧 markers)

4. **Open development pages**
   - Matrix: http://localhost:5173/matrix
   - Analytics: http://localhost:5173/analytics
   - Configuration: http://localhost:5173/configuration

## Development Pattern

1. Use templates from `frontend/src/components/ComponentTemplate.tsx`
2. Create tests using `verification/tests/test-template.js`
3. Follow DEVELOPMENT_WORKFLOW.md for process
4. Update documentation as you build features

## Common Commands

- **Test feature**: `node verification/tests/test-your-feature.js`
- **Check data**: `node verification/scripts/check-all-developer-data.js`
- **Clean up**: `mv test-*.js verification/tests/ && rm *.png`
