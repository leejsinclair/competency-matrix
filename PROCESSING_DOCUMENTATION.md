# Processing System Documentation

## 🎯 Overview

The Engineering Competency Intelligence Platform uses a sophisticated processing system to analyze developer activities from Confluence and map them to a detailed competency taxonomy. This document provides comprehensive information about all processing components, their relationships, and usage.

## 📁 Core Processing Files

### **Main Processing Pipeline**

#### `scripts/full-processing.js`
**Purpose**: Complete end-to-end processing pipeline  
**Description**: Orchestrates the entire processing workflow from database cleanup through API verification  
**Key Features**:
- Database cleanup and preparation
- Detailed Confluence processing with taxonomy
- Competency score generation and aggregation
- API endpoint verification
- Comprehensive logging and error handling  
**Usage**: `node scripts/full-processing.js` or via API `POST /api/processing/full-reprocess`  
**Processing Time**: 2-3 minutes for full dataset  
**Output**: 481 competency scores across 33 developers

### **Detailed Taxonomy Processing**

#### `scripts/process-confluence-detailed-subcompetencies.js`
**Purpose**: Process Confluence data using comprehensive tech taxonomy  
**Description**: Analyzes Confluence pages against 23+ sub-competencies across 8 categories  
**Key Features**:
- Uses `taxonomy/tech-taxonomy.json` for competency definitions
- Keyword matching with 500+ technical terms
- Evidence generation with confidence scoring
- Contributing factors analysis
- Detailed reporting to `test-data/detailed-contributing-factors/`  
**Input**: `_content/confluence/processed/processed-pages.json`  
**Output**: `competency_labels` table with detailed evidence  
**Categories**: 8 major categories with 23+ sub-competencies

#### `scripts/generate-competency-scores.js`
**Purpose**: Aggregate processed labels into competency scores  
**Description**: Calculates final competency scores from processed labels with confidence metrics  
**Key Features**:
- Aggregates evidence across multiple documents
- Calculates confidence levels (0.0-1.0)
- Determines competency levels (L1-L4)
- Evidence count tracking
- Performance metrics generation  
**Input**: `competency_labels` table  
**Output**: `competency_scores` table with final assessments  
**Results**: 481 scores across 33 developers

### **Legacy Processing (Deprecated)**

#### `scripts/process-confluence-with-factors.js`
**Purpose**: Basic competency processing (5 categories)  
**Status**: **DEPRECATED** - Use `process-confluence-detailed-subcompetencies.js` instead  
**Reason**: Limited to 5 basic categories vs 23+ detailed sub-competencies

## 📊 Taxonomy System

### `taxonomy/tech-taxonomy.json`
**Purpose**: Complete competency taxonomy definition  
**Structure**:
```json
{
  "categories": [
    {
      "name": "Software Engineering",
      "subcategories": [
        {
          "name": "Programming Languages",
          "terms": [
            {"canonical": "JavaScript", "variants": ["javascript", "js", "nodejs"]},
            {"canonical": "TypeScript", "variants": ["typescript", "ts"]}
          ]
        }
      ]
    }
  ]
}
```

**Categories (8 Total)**:
1. **Software Engineering** - Programming Languages, Testing & Quality, Architecture & Design
2. **Web Development** - Frontend, Backend  
3. **Infrastructure & Cloud** - Compute, Storage & Databases, Networking, Messaging & Eventing
4. **DevOps & Platform Engineering** - CI/CD, Observability
5. **Containers & Orchestration** - Docker, Kubernetes
6. **AWS Services** - Compute, Storage & Databases, Security & Secrets, etc.
7. **Atlassian** - Bitbucket, Confluence, Jira
8. **Collaboration & Process** - Git & Version Control, Agile & Delivery

**Sub-Competencies**: 23+ detailed competencies with 500+ keyword variants

## 🔗 API Integration

### Processing Endpoints

#### `src/api/routes/processing-routes-fastify.ts`
**Purpose**: Fastify-compatible processing API endpoints  
**Endpoints**:
- `POST /api/processing/full-reprocess` - Complete processing pipeline
- `POST /api/processing/generate-scores` - Score generation only
- `GET /api/processing/status` - Processing status check

**Features**:
- Real-time progress feedback
- Error handling and recovery
- Processing statistics
- Result parsing and reporting

### Matrix Data Endpoints

#### `src/api/routes/matrix-routes.ts`
**Purpose**: Competency matrix data retrieval  
**Endpoints**:
- `GET /api/matrix/team` - All developers overview
- `GET /api/matrix/developer/{actor}` - Individual developer matrix

**Features**:
- Detailed competency breakdown
- Evidence integration
- Confidence scoring
- Category mapping

## 🎨 Frontend Integration

### Matrix Visualization

#### `frontend/src/components/SimpleMatrix.tsx`
**Purpose**: Interactive competency matrix display  
**Features**:
- Green highlighting for achieved competencies (L3-L4)
- Developer selection with filtering
- Ctrl+Click evidence modal integration
- Real-time data refresh
- Loading states and error handling

**Data Flow**:
1. Fetches developer list from `/api/matrix/team`
2. Loads matrix data for selected developer from `/api/matrix/developer/{actor}`
3. Transforms API data to matrix format
4. Renders green cells for achieved competencies
5. Shows evidence modal on Ctrl+Click

#### `frontend/src/components/EvidenceModal.tsx`
**Purpose**: Detailed evidence display modal  
**Features**:
- Evidence list with confidence scores
- Contributing factors breakdown
- Source document links
- Keyword matching details

## 🔄 Processing Pipeline Flow

```
┌─────────────────────────────────────┐
│           Confluence Data            │
│  (_content/confluence/processed/)    │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│    Detailed Taxonomy Processing      │
│ (process-confluence-detailed-       │
│      subcompetencies.js)            │
│                                     │
│ • Keyword matching (500+ terms)     │
│ • Confidence scoring                 │
│ • Evidence generation               │
│ • Contributing factors              │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│        Database Storage              │
│    (competency_labels table)       │
│                                     │
│ • Raw evidence items                │
│ • Confidence scores                 │
│ • Source document references        │
│ • Keyword matches                   │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│      Score Generation               │
│ (generate-competency-scores.js)     │
│                                     │
│ • Evidence aggregation              │
│ • Confidence calculation            │
│ • Level determination (L1-L4)       │
│ • Performance metrics               │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│        Database Storage              │
│   (competency_scores table)         │
│                                     │
│ • Final competency scores          │
│ • Aggregated evidence counts        │
│ • Confidence levels                 │
│ • Category mappings                 │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│         API Endpoints                │
│   (matrix-routes.ts)                │
│                                     │
│ • Developer matrix data            │
│ • Team overview                     │
│ • Evidence integration              │
│ • Real-time updates                 │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│      Frontend Display               │
│   (SimpleMatrix.tsx)                │
│                                     │
│ • Interactive matrix                │
│ • Green highlighting                │
│ • Evidence modals                   │
│ • Real-time refresh                 │
└─────────────────────────────────────┘
```

## 📈 Performance Metrics

### Processing Results (Latest Run)
- **Duration**: 185.84 seconds
- **Developers**: 33 processed
- **Competency Scores**: 481 generated
- **Categories**: 8 major categories
- **Sub-Competencies**: 23+ detailed competencies
- **Evidence Items**: 5-613 per competency

### Example Developer Profile (lsinclair)
- **Total Achieved**: 23/23 competencies
- **Top Categories**: Software Engineering, Web Development, Atlassian
- **Evidence Count**: 4,000+ total evidence items
- **Confidence**: 0.7-0.9 average across competencies

## 🛠️ Usage Instructions

### Manual Processing
```bash
# Complete processing pipeline
node scripts/full-processing.js

# Individual steps
node scripts/process-confluence-detailed-subcompetencies.js
node scripts/generate-competency-scores.js
```

### API Processing
```bash
# Full reprocessing
curl -X POST http://localhost:3001/api/processing/full-reprocess \
  -H "Content-Type: application/json" -d "{}"

# Score generation only
curl -X POST http://localhost:3001/api/processing/generate-scores \
  -H "Content-Type: application/json" -d "{}"

# Processing status
curl http://localhost:3001/api/processing/status
```

### Frontend Integration
```javascript
// Trigger reprocessing from frontend
const response = await fetch('/api/processing/full-reprocess', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
});
const result = await response.json();
```

## 🔧 Configuration

### Taxonomy Updates
To add new competencies or update keywords:
1. Edit `taxonomy/tech-taxonomy.json`
2. Run full processing pipeline
3. Verify results in frontend matrix

### Processing Parameters
Key configuration options in processing scripts:
- **Confidence Thresholds**: Minimum confidence for competency levels
- **Evidence Requirements**: Minimum evidence counts for level determination  
- **Keyword Matching**: Case sensitivity and variant handling
- **Category Mapping**: Database to frontend category name mapping

## 🐛 Troubleshooting

### Common Issues
1. **Missing Competencies**: Ensure detailed processing script is used (not legacy)
2. **Low Evidence Counts**: Check Confluence data quality and keyword coverage
3. **Processing Failures**: Verify database connectivity and file permissions
4. **API Errors**: Check Fastify route registration and endpoint availability

### Debug Commands
```bash
# Check database connectivity
node -e "const db = require('./dist/database/connection'); db.DatabaseConnection.getInstance().connect().then(() => console.log('✅ DB OK')).catch(console.error)"

# Verify taxonomy loading
node -e "const fs = require('fs'); const tax = JSON.parse(fs.readFileSync('./taxonomy/tech-taxonomy.json', 'utf-8')); console.log('Categories:', tax.categories.length)"

# Test API endpoints
curl http://localhost:3001/health
curl http://localhost:3001/api/matrix/team
```

## 📚 Additional Documentation

- [Main README](../README.md) - Project overview and setup
- [API Documentation](../src/api/README.md) - API endpoint details
- [Frontend Documentation](../frontend/README.md) - UI component details
- [Database Schema](../database/README.md) - Database structure and relationships
