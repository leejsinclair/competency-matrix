# Engineering Competency Intelligence Platform

## 🎯 Overview

A sophisticated engineering competency assessment platform that automatically analyzes developer activities from multiple sources (Confluence, Jira, Git, Bitbucket) to classify engineering behavior against the CircleCI Engineering Competency Matrix using detailed taxonomy-based analysis with evidence traceability.

## 🏗️ Project Status: **Production Ready**

This is a complete competency intelligence system with automated activity analysis, detailed taxonomy processing, evidence traceability, and interactive matrix visualization.

## 🚀 What This Project Does

### Core Functionality
- **Multi-source Data Retrieval**: Automatically fetches engineering activities from Confluence, Jira, Git, and Bitbucket
- **Detailed Taxonomy Processing**: Uses comprehensive tech taxonomy with 23+ sub-competencies across 8 categories
- **Evidence Generation**: Provides detailed evidence with keyword matching and confidence scoring
- **Interactive Matrix UI**: Green-highlighted achieved competencies with evidence modals
- **Full Reprocessing**: One-click complete data reprocessing pipeline
- **Comprehensive Reporting**: Generates detailed competency reports with contributing factors

### Technology Stack
- **Backend**: Node.js + TypeScript + Fastify
- **Database**: Microsoft SQL Server (MSSQL)
- **Frontend**: React + TypeScript + Tailwind CSS
- **Processing**: Custom taxonomy-based rule engine
- **API**: Fastify with comprehensive endpoints
- **Testing**: Jest with comprehensive test coverage

## 📊 Current Implementation Status

### ✅ **Completed Components**

#### **1. Data Retrieval Layer**
- [x] Confluence connector for pages and content
- [x] Local filesystem artifact store
- [x] Unified event schema
- [x] Comprehensive test coverage

#### **2. Processing Engine**
- [x] Detailed taxonomy-based processing with 23 sub-competencies
- [x] Evidence generation with keyword matching and confidence scoring
- [x] Competency aggregation with detailed contributing factors
- [x] Full processing pipeline automation
- [x] Evidence traceability and audit trails

#### **3. Interactive Frontend**
- [x] React-based competency matrix visualization
- [x] Green-highlighted achieved competencies
- [x] Evidence modal with Ctrl+Click functionality
- [x] Developer selection and filtering
- [x] Real-time data refresh

#### **4. API Infrastructure**
- [x] Fastify-based REST API
- [x] Matrix endpoints for developers and teams
- [x] Processing endpoints for full reprocessing
- [x] Evidence traceability endpoints
- [x] Comprehensive error handling

#### **5. Core Infrastructure**
- [x] TypeScript configuration and build system
- [x] Comprehensive testing framework
- [x] Development environment with hot reload
- [x] Docker containerization support
- [x] NVM integration for Node.js version management
- [x] Assessment runner for competency evaluation

#### **4. Assessment & Reporting**
- [x] Competency assessment runner
- [x] Matrix-based evaluation system
- [x] Category and level-based assessments
- [x] Australian English localization (prioritised, optimised, etc.)

### 🚧 **In Progress**

#### **API Layer**
- [x] Complete REST API with Fastify
- [x] Matrix endpoints for developers and teams
- [x] Processing endpoints for full reprocessing
- [x] Evidence traceability endpoints
- [ ] Authentication and authorization (planned)

#### **Web Interface**
- [x] Interactive React-based matrix visualization
- [x] Green-highlighted achieved competencies
- [x] Evidence modal with Ctrl+Click functionality
- [x] Developer selection and filtering
- [ ] Self-evaluation interface (planned)

## 🔄 Processing System Architecture

### **Core Processing Files**

#### **📁 Scripts Directory (`/scripts/`)**
| File | Purpose | Description |
|------|---------|-------------|
| `full-processing.js` | **Main Processing Pipeline** | Complete end-to-end processing pipeline (database cleanup → detailed processing → score generation → API verification) |
| `process-confluence-detailed-subcompetencies.js` | **Detailed Taxonomy Processing** | Processes Confluence data using comprehensive tech taxonomy with 23+ sub-competencies |
| `generate-competency-scores.js` | **Score Aggregation** | Generates competency scores from processed labels with confidence calculations |
| `process-confluence-with-factors.js` | **Legacy Simplified Processing** | Basic competency processing (5 categories) - **DEPRECATED** |
| `init-evidence-schema-fixed.js` | **Evidence Schema Setup** | Initializes evidence traceability database schema |

#### **📁 Taxonomy (`/taxonomy/`)**
| File | Purpose | Description |
|------|---------|-------------|
| `tech-taxonomy.json` | **Competency Taxonomy** | Complete taxonomy with 8 categories, 23+ sub-competencies, and keyword mappings |

#### **📁 API Routes (`/src/api/routes/`)**
| File | Purpose | Description |
|------|---------|-------------|
| `processing-routes-fastify.ts` | **Processing API Endpoints** | Fastify-compatible endpoints for triggering processing operations |
| `matrix-routes.ts` | **Matrix Data API** | Endpoints for retrieving competency matrix data for developers/teams |
| `connector-config-routes.ts` | **Connector Configuration** | Management of data source connectors |

#### **📁 Frontend Components (`/frontend/src/components/`)**
| File | Purpose | Description |
|------|---------|-------------|
| `SimpleMatrix.tsx` | **Matrix Visualization** | Interactive competency matrix with green highlighting and evidence modals |
| `EvidenceModal.tsx` | **Evidence Display** | Modal for showing detailed evidence and contributing factors |

### **Processing Pipeline Flow**

```
1. Database Cleanup
   ↓
2. Detailed Confluence Processing (process-confluence-detailed-subcompetencies.js)
   - Uses tech-taxonomy.json for 23+ sub-competencies
   - Generates competency_labels with evidence
   ↓
3. Score Generation (generate-competency-scores.js)
   - Aggregates labels into competency_scores
   - Calculates confidence levels and evidence counts
   ↓
4. API Verification
   - Tests matrix endpoints
   - Validates data integrity
```

### **Key Processing Features**

#### **🎯 Detailed Taxonomy Processing**
- **8 Categories**: Software Engineering, Web Development, Infrastructure & Cloud, DevOps & Platform Engineering, Containers & Orchestration, AWS Services, Atlassian, Collaboration & Process
- **23+ Sub-Competencies**: Programming Languages, Testing & Quality, Architecture & Design, Frontend, Backend, CI/CD, Docker, Kubernetes, etc.
- **Keyword Matching**: 500+ technical terms with variants and synonyms
- **Evidence Tracking**: Full traceability from source documents to competency assessments

#### **🔄 One-Click Reprocessing**
- **Frontend Button**: "Reanalyze Data" triggers complete pipeline
- **API Endpoint**: `POST /api/processing/full-reprocess`
- **Processing Time**: 2-3 minutes for full dataset
- **Results**: 481 competency scores across 33 developers

#### **📊 Evidence & Scoring**
- **Confidence Levels**: 0.0-1.0 based on keyword frequency and context
- **Evidence Counts**: Number of matching documents/activities
- **Competency Levels**: L1-L4 based on confidence thresholds
- **Contributing Factors**: Detailed breakdown of evidence sources

## 🚀 Quick Start

### **Development Setup**
```bash
# Start all services
npm run dev:all

# Frontend: http://localhost:5173/matrix
# Backend: http://localhost:3001/health
```

### **Processing Operations**
```bash
# Full reprocessing (via API)
curl -X POST http://localhost:3001/api/processing/full-reprocess

# Manual processing
node scripts/full-processing.js

# Individual steps
node scripts/process-confluence-detailed-subcompetencies.js
node scripts/generate-competency-scores.js
```

### **Key Features**
- **Interactive Matrix**: Green-highlighted achieved competencies
- **Evidence Modals**: Ctrl+Click on green cells for detailed evidence
- **Real-time Updates**: "Reanalyze Data" button for complete refresh
- **Developer Filtering**: Automatic exclusion of deactivated/unlicensed accounts
- **Comprehensive Taxonomy**: 23+ sub-competencies with detailed evidence

## 📚 Documentation

### **Core Documentation**
- **[README.md](README.md)** - Project overview and quick start
- **[PROCESSING_DOCUMENTATION.md](PROCESSING_DOCUMENTATION.md)** - Complete processing system documentation
- **[DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md)** - Development workflow and testing guide

### **API Documentation**
- **[API Routes](src/api/routes/)** - REST API endpoint documentation
- **[Processing API](src/api/routes/processing-routes-fastify.ts)** - Processing endpoints
- **[Matrix API](src/api/routes/matrix-routes.ts)** - Matrix data endpoints

### **Component Documentation**
- **[Frontend Components](frontend/src/components/)** - React component documentation
- **[Processing Scripts](scripts/)** - Data processing pipeline documentation
- **[Taxonomy System](taxonomy/)** - Competency taxonomy documentation

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
