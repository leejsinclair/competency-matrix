# Engineering Competency Intelligence Platform

## 🎯 Overview

A sophisticated engineering competency assessment platform that automatically analyzes developer activities from multiple sources (Jira, Confluence, Git, Bitbucket) to classify engineering behavior against the CircleCI Engineering Competency Matrix using rule-based and ML-based analysis.

## 🏗️ Project Status: **Work In Progress**

This is an active development project implementing a comprehensive competency intelligence system with automated activity analysis, machine learning classification, and self-assessment capabilities.

## 🚀 What This Project Does

### Core Functionality
- **Multi-source Data Retrieval**: Automatically fetches engineering activities from Jira, Confluence, Git, and Bitbucket
- **Intelligent Processing**: Uses rule-based engines and ML models to classify activities into competency levels
- **Competency Matrix Mapping**: Maps activities to CircleCI's 21 competency categories across 5 levels (L1-L4)
- **Evidence Generation**: Provides detailed evidence for competency assessments
- **Self-Assessment Tools**: Allows developers to evaluate their own competencies
- **Comprehensive Reporting**: Generates CircleCI-style competency reports

### Technology Stack
- **Backend**: Node.js + TypeScript
- **Database**: Microsoft SQL Server (MSSQL)
- **ML Framework**: TensorFlow.js
- **API**: Express/Fastify
- **Testing**: Jest with comprehensive test coverage
- **Artifact Storage**: Local filesystem (with S3 migration planned)

## 📊 Current Implementation Status

### ✅ **Completed Components**

#### **1. Data Retrieval Layer**
- [x] Jira connector for issues and events
- [x] Local filesystem artifact store
- [x] Unified event schema
- [x] Comprehensive test coverage

#### **2. Processing Engine**
- [x] Rule-based labeling system with 21 competency categories
- [x] ML processor with TensorFlow.js integration
- [x] Feature extraction from engineering activities
- [x] Synthetic test data generation for ML training
- [x] Competency aggregation (rules + ML + evidence)
- [x] Full test suite for all processing components

#### **3. Core Infrastructure**
- [x] TypeScript configuration and build system
- [x] Comprehensive testing framework (66 tests passing)
- [x] VS Code development environment with tasks
- [x] NVM integration for Node.js version management
- [x] Assessment runner for competency evaluation

#### **4. Assessment & Reporting**
- [x] Competency assessment runner
- [x] Matrix-based evaluation system
- [x] Category and level-based assessments
- [x] Australian English localization (prioritised, optimised, etc.)

### 🚧 **In Progress**

#### **API Layer**
- [x] Basic API structure planned
- [ ] REST endpoints for competency data
- [ ] Authentication and authorization
- [ ] Pagination and filtering

#### **Web Interface**
- [x] UI requirements and screen designs planned
- [ ] Dashboard implementation
- [ ] Competency matrix visualization
- [ ] Self-evaluation interface

### 📋 **Planned Components**

#### **Quiz & Remediation System** (Deferred to Phase 2B)
- [ ] Adaptive quiz engine with progressive difficulty
- [ ] Domain-specific question banks (Redis, RabbitMQ, Kubernetes, etc.)
- [ ] Self-evaluation module
- [ ] Gap identification and remediation recommendations
- [ ] Quiz API endpoints
- [ ] Web quiz workflows

#### **Advanced Features**
- [ ] S3 artifact storage migration
- [ ] Real-time competency tracking
- [ ] Team overview dashboards
- [ ] Calibration and governance tools
- [ ] Advanced analytics and insights

## 🧪 Testing

The project has a comprehensive test suite with **66 tests passing** across 10 test suites:

```
Test Suites: 10 passed, 10 total
Tests:       66 passed, 66 total
```

### Test Coverage Areas
- **Processing Tests**: Rule engine, ML processor, event processing, synthetic data
- **Retrieval Tests**: Jira connector, artifact storage
- **Integration Tests**: End-to-end workflows
- **Assessment Tests**: Competency evaluation and reporting

### Running Tests
```bash
# All tests
npm test

# Specific test categories
npm run test:processor
npm run test:retrieval

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## 🛠️ Development Setup

### Prerequisites
- Node.js v20.19.3 (managed via NVM)
- Microsoft SQL Server
- Git

### Quick Start
```bash
# Clone and setup
git clone <repository-url>
cd competency-matrix

# Install dependencies
npm install

# Set up Node.js version
nvm use

# Run tests
npm test

# Start development
npm run dev
```

### VS Code Integration
The project includes pre-configured VS Code tasks for:
- Running all tests and individual test suites
- Running assessments
- Building the project
- All tasks automatically handle NVM setup

## 📁 Project Structure

```
competency-matrix/
├── src/
│   ├── processing/          # Core processing engine
│   │   ├── processor.ts    # Main processor class
│   │   ├── rule-engine.ts  # Rule-based labeling
│   │   ├── ml-processor.ts # ML classification
│   │   └── types.ts       # Processing types
│   ├── retrieval/          # Data connectors
│   │   ├── jira-connector.ts
│   │   └── artifact-store.ts
│   ├── types/             # Type definitions
│   └── assessment/        # Assessment logic
├── tests/                 # Comprehensive test suite
│   ├── processing/         # Processing tests
│   ├── retrieval/         # Connector tests
│   └── assessment/       # Assessment tests
├── scripts/              # Utility scripts
├── .vscode/             # VS Code configuration
└── docs/                # Documentation
```

## 📋 TODO List

### High Priority
- [ ] **API Implementation**: Complete REST endpoints for competency data
- [ ] **Authentication**: Add JWT/OAuth security
- [ ] **Web Dashboard**: Implement basic competency visualization
- [ ] **Database Integration**: Connect to MSSQL for persistent storage

### Medium Priority
- [ ] **S3 Migration**: Move artifact storage from local to S3
- [ ] **Real-time Updates**: Add WebSocket support for live updates
- [ ] **Team Features**: Implement team overview and comparison tools
- [ ] **Enhanced Reporting**: Add more detailed analytics and insights

### Future Enhancements
- [ ] **Quiz System**: Implement adaptive technical quizzes (Phase 2B)
- [ ] **Mobile Support**: Responsive design and mobile app
- [ ] **Integration**: Add more data sources (GitHub, Slack, etc.)
- [ ] **Advanced ML**: Improve model accuracy with more training data
- [ ] **Calibration Tools**: Manager calibration and review workflows

## 🎯 Next Steps

1. **Complete API Layer** - Implement REST endpoints for all competency operations
2. **Build Web Interface** - Create dashboard and visualization components  
3. **Database Integration** - Set up MSSQL for persistent data storage
4. **User Testing** - Gather feedback from engineering teams
5. **Production Deployment** - Set up CI/CD and production infrastructure

## 📚 Documentation

- **[Testing Guide](./TESTING_GUIDE.md)** - Comprehensive testing instructions
- **[Story Plan](./storyplan.md)** - Detailed project requirements and specifications
- **API Documentation** - (Coming soon with API implementation)

## 🤝 Contributing

This is a WIP project. Contributions are welcome, especially in:
- API development
- Frontend implementation
- Test coverage improvements
- Documentation enhancements

## 📄 License

[Add your license information here]

---

**Note**: This project is actively under development. Features and APIs may change as we evolve the architecture based on testing and user feedback.
