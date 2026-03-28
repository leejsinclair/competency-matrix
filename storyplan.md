# **storyplan.md**

## **Competency Intelligence Platform — Story Plan**

Extend this application so retrieves engineering activity from Confluence as well as Jira, Bitbucket, and Git; processes and labels that data using rule‑based and ML‑based analysis; exposes results via an API; and provides a web interface for visualising competency progress and enabling developer self‑evaluation.

---

## **1. Goals** 

- Automatically classify engineering behaviour into CircleCI‑style competency levels.  
- Use rule‑based and ML‑based processing to label content and activity.  
- Use AI assistance to generate synthetic test content for rapid rule development and dataset bootstrapping.  
- Provide a stable API for retrieving competency reports.  
- Provide a web interface for visualisation and self‑evaluation.  
- Include strong automated tests, especially around processing and content labelling.  
- Allow developers to answer quick questions for each competency row to self‑assess.  
- Provide progressive technical quizzes that start with fundamentals and increase in depth to identify and remediate skill gaps.  
- Generate a report similar to the CircleCI Engineering Competency Matrix.  

---

## **2. Architecture Overview** 

The system is divided into four major components:

1. **Retrieval Layer** ✅ **COMPLETED**
2. **Processing & Analysis Layer** ✅ **95% COMPLETED**  
3. **API Layer** 🔄 **85% COMPLETED**
4. **Web Interface Layer** 🔄 **75% COMPLETED**

Each component is modular, testable, and independently deployable.

### **Data Storage Strategy** ✅
- Primary operational datastore: **Microsoft SQL Server (MSSQL)**.  
- Store relational and query-heavy data in MSSQL (developers, events index, extracted features, labels, scores, reports, self-evaluations).  
- Store large artifacts (raw payload snapshots, fixture exports, model binaries, report files) in a pluggable artifact store.  
- Start artifact storage on local filesystem for team simplicity, then migrate artifact backend to S3 without changing business logic.  

### **Storage Abstraction Requirement** ✅
Implement a storage interface for large artifacts:
- `ArtifactStore.put(key, stream|buffer, metadata)`  
- `ArtifactStore.get(key)`  
- `ArtifactStore.delete(key)`  
- `ArtifactStore.list(prefix)`  

Implementations:
- `LocalFsArtifactStore` ✅ (initial).  
- `S3ArtifactStore` (migration target).  

---

## **Current Implementation Status (March 2026)**

### **🎯 Overall Progress: 85% Complete**

**✅ Fully Completed Phases:**
- **Phase 0 - Data Foundations**: 100% (MSSQL, ArtifactStore, Database Schema)
- **Phase 1 - Retrieval**: 100% (All 4 connectors, Unified Schema, Tests)
- **Phase 2 - Processing**: 95% (Feature extraction, Rules, ML, Evidence)

**🔄 Partially Completed Phases:**
- **Phase 3 - API**: 85% (Core endpoints implemented, missing auth/caching)
- **Phase 4 - Web Interface**: 75% (Analytics complete, missing matrix view)

**📊 Key Metrics:**
- **Test Coverage**: 114 tests passing across 19 test suites
- **Data Processed**: 1,577 Confluence pages → 15,434 classifications
- **Contributors**: 33 developers with competency profiles
- **Assessments**: 131 competency scores generated
- **API Endpoints**: 15+ endpoints implemented
- **Frontend Pages**: 4 major pages with routing

**🚧 Critical Missing Components:**
1. **Competency Matrix View** - Core CircleCI-style visualization
2. **Self-Evaluation Module** - Developer assessment interface
3. **Authentication System** - JWT/OAuth security
4. **Individual Developer Reports** - Personal competency profiles

---

## **Recent Progress Summary (March 2026)**

### **🎯 Analytics Dashboard Implementation - COMPLETED (March 7, 2026)**
- **Full Analytics Page**: Complete analytics dashboard at `/analytics` route with comprehensive metrics ✅
- **Analytics Tab**: Integrated analytics functionality into Configuration page ✅
- **Real-time Data**: API integration for competency scores with live updates ✅
- **Visualizations**: Charts and progress bars for confidence/level distributions ✅
- **Performance Insights**: 
  - **131 total assessments** processed and displayed ✅
  - **33 contributors** analyzed with performance rankings ✅
  - **Top contributors** with confidence scores and skill breakdowns ✅
  - **Category performance** with top performers per category ✅
  - **Confidence distribution** across Expert/Advanced/Intermediate/Beginner levels ✅
  - **Level distribution** showing competency progression ✅

### **✅ Connector Management System - COMPLETED**
- **Database Integration**: All connector configurations now persist to MSSQL database instead of files
- **Full CRUD Operations**: Create, Read, Update, Delete for Jira, Confluence, and Bitbucket connectors
- **Connection Testing**: Working test functionality with proper authentication for all connectors
- **Frontend Integration**: Complete UI with tabbed interface, loading states, and error handling
- **Authentication Updates**: 
  - Confluence: Fixed to use Basic Auth with base64 encoding
  - Bitbucket: Updated to use API tokens instead of app passwords
  - Jira: Proper token-based authentication

### **🎯 Technical Achievements**
- **API Layer**: RESTful endpoints for connector management (`/api/connector-configs/*`)
- **Database Schema**: Proper `connector_configs` table with indexing and relationships
- **React Components**: Modular, reusable configuration tabs with consistent UX
- **Error Handling**: Graceful error handling with user-friendly alerts and console logging
- **Type Safety**: Full TypeScript integration across frontend and backend
- **Analytics Engine**: Real-time competency insights with responsive design

### **📊 Current State**
- **Jira**: ✅ Fully functional with database persistence
- **Confluence**: ✅ Fully functional with database persistence  
- **Bitbucket**: ✅ Fully functional with database persistence
- **Git**: ⏳ Connector exists but not yet integrated into UI
- **Analytics**: ✅ Full dashboard with real-time insights and visualizations

---

# **3. Part 1 — Retrieval Layer** ✅

### **Purpose** ✅
Fetch engineering activity from:
- Jira (stories, subtasks, comments, metadata) ✅
- Confluence (pages, edits, comments) ✅
- Bitbucket (PRs, reviews, pipelines) ✅
- Git repositories (commits, diffs, module ownership) ✅

### **Requirements** ✅
- Implement connectors for each data source. ✅
- Normalise all retrieved data into a unified event schema. ✅
- Support incremental retrieval (upon request based on lat retreval date). ✅
- Store event indexes in MSSQL and raw payload artifacts in ArtifactStore for reproducibility. ✅
- Handle rate limits gracefully. ✅

### **Unified Event Schema** ✅
```ts
interface ActivityEvent {
  id: string;
  source: "jira" | "confluence" | "bitbucket" | "git";
  timestamp: string;
  actor: string;
  type: string;
  metadata: Record<string, any>;
  content?: string; // text for NLP/keyword analysis
}
```

### **Acceptance Criteria** ✅
- Able to retrieve and normalise events from all four sources. ✅
- All connectors have mockable interfaces. ✅
- Retrieval layer has full unit test coverage. ✅  

---

# **4. Part 2 — Processing & Analysis Layer**

### **Purpose**
Transform raw events into:
- Feature vectors  
- Rule‑based labels  
- ML‑based predictions  
- Competency scores  
- Evidence bundles  
- Curated training datasets (seeded with AI‑generated synthetic content)  

### **Sub‑Components**

#### **4.1 Feature Extraction** ✅
Convert events into numeric features such as:
- `review_depth_score`  
- `design_docs_authored`  
- `module_ownership_score`  
- `cycle_time_avg`  
- `semantic_complexity`  
- `risk_language_detected`  
- `security_terms_detected`  
- `architecture_terms_detected`

**Implementation:** `src/processing/feature-extractor.ts`
- Extracts 31 deterministic features from ActivityEvent objects
- Text analysis features (word count, technical term density, semantic complexity)
- Activity pattern features (collaboration score, review depth)
- Temporal features (business hours, weekend detection, recency)
- Metadata features (label count, source identification)
- Generates consistent numeric vectors for ML processing
- Full unit test coverage with deterministic behavior

**Features Extracted:**
- Text metrics: length, word count, sentence complexity
- Technical indicators: code blocks, links, lists, technical terms
- Activity patterns: collaboration, review depth, source types
- Temporal patterns: business hours, recency, day/hour analysis
- Metadata richness: labels, field counts, source identification  

#### **4.2 Rule‑Based Labelling (Weak Supervision)** 
Rules should detect:
- domain‑specific terms (RabbitMQ, AWS Secrets Manager, OAuth, risk mitigation)  
- behavioural patterns (review depth, design docs, refactors)  
- architectural signals  
- security signals  
- business reasoning  

Rules generate labels such as:
- `system_design_L2`  
- `system_design_L3`  
- `security_L3`  
- `collaboration_L2`  
- `business_context_L3`  

**Implementation:** `src/processing/rule-engine.ts` + `src/services/rule-service.ts`
- Taxonomy-driven rule expansion with variants
- Regex-based pattern matching  
- Multi-condition evaluation (AND/OR logic)
- Action execution (labels, features)
- Confidence scoring
- 13 classification rules implemented

#### **4.2.1 AI‑Assisted Test Content Generation** 
Use AI assistance to generate realistic synthetic activity text (tickets, PR comments, design notes, review summaries) for rule engineering and test coverage.

Generation requirements:
- Generate per‑label test sets with both positive and negative examples.  
- Initial target volume: **100 examples per label** (60 positive, 40 hard negatives).  
- Include variation in writing style, domain terms, and ambiguity level.  
- Include boundary cases between adjacent levels (L1/L2, L2/L3, L3/L4).  
- Tag every generated sample with metadata: `label_target`, `difficulty`, `source_type`, `rationale`.  
- Store generated data as versioned fixtures (`jsonl`) for deterministic test runs.  

Quality controls:
- Human review required for a sampled subset before promoting data to training seed set.  
- Deduplication and leakage checks between synthetic training data and evaluation fixtures.  
- Reject low‑quality or contradictory samples during curation.

#### **4.3 ML Classification (TensorFlow.js)** 
- Train a multi‑class classifier (L1–L4).  
- Use curated rule‑generated labels plus reviewed synthetic examples as training seed data.  
- Predict competency levels from feature vectors.  
- Output confidence scores.

#### **4.4 Competency Aggregation** ✅
Combine:
- ML predictions  
- Rule‑based signals  
- Evidence links  

Produce a final competency score per category.

**Implementation:** `src/processors/confluence-content-processor.ts` ✅
- Successfully processes 1,577 pages with 15,434 classifications ✅
- Generates competency profiles for 33 contributors ✅
- Aggregates evidence from multiple sources ✅
- Provides confidence scoring and evidence tracking ✅

**Script Implementation:** `scripts/generate-competency-scores.js` ✅
- Generates competency scores from processed data ✅
- Inserts 131 competency scores into database ✅
- Supports confidence scoring and evidence linking ✅
- Can be triggered via API endpoint ✅

**API Integration:** ✅
- GET `/api/processing/scores` - retrieves competency scores ✅
- POST `/api/processing/regenerate-scores` - triggers score regeneration ✅
- GET `/api/processing/health` - checks ML processor status ✅
- Frontend integration with ProcessingTab and Analytics pages ✅

### **Acceptance Criteria**
- Feature extraction is deterministic and fully tested. ✅
- Rule‑based labelling is fully tested with golden‑file fixtures. ✅
- AI‑generated test corpus exists for each target label with required volume and metadata. 🚧
- Synthetic dataset curation workflow is documented and repeatable. 🚧
- ML model can be trained and run inference in Node.js. 🚧
- Classification outputs include evidence references. ✅

### **Testing Requirements**
- Unit tests for each feature extractor. ✅
- Rule‑based label tests (deterministic). ✅
- Fixture validation tests for synthetic corpus quality (schema, dedupe, label balance). 🚧
- ML model regression tests. 🚧
- End‑to‑end tests for sample content. ✅  

---

# **5. Part 2B — Quiz & Remediation Layer (After Core Processing/ML)**

### **Purpose**
Assess practical understanding in core technologies using progressive quizzes designed to expose gaps and guide improvement.

Sequencing requirement:
- This section starts only after Part 2 processing, analysis, and ML outcomes are stable and passing test gates.

### **Quiz Behaviour Requirements**
- Start with easy/fundamental questions and progress to deeper scenario-based questions.  
- Cover: usage patterns, configuration choices, trade-offs, common pitfalls, and anti-patterns.  
- Mix question types: multiple choice, short answer, troubleshooting scenarios, and architecture decision prompts.  
- Adapt difficulty by prior answers (correctness + confidence + explanation quality).  

### **Quiz Domains (Initial)**
- Amazon ElastiCache for Redis (`redis`)  
- Amazon MQ for RabbitMQ (`rabbitmq`)  
- Vault (`vault`)  
- Docker (`docker`)  
- Kubernetes (`kubernetes`)  
- Networking / HTTP / TLS (`networking_http_tls`)  
- Testing (`testing`)  
- Debugging (`debugging`)  
- Observability (`observability`)  

### **Question Bank Requirements**
- Include fundamentals (what/how to use), intermediate operations, and advanced troubleshooting.  
- Include explicit prompts on: queue types and use cases, when to use or avoid Redis, and common implementation pitfalls.  
- Tag each question with: `domain`, `competency_area`, `difficulty`, `concept_tags`, `pitfall_type`.  

### **Outputs**
- Per-domain proficiency signal (L1–L4 aligned).  
- Identified weak concepts with recommended follow-up quiz paths.  
- Evidence entries written back into competency matrix rationale.  

### **Acceptance Criteria**
- Adaptive quiz engine supports progressive depth and domain-tagged question banks.  
- Quiz outcomes produce actionable weakness signals mapped to competency matrix rows.  
- Quiz engine tests cover difficulty progression, scoring, domain mapping, and recommendation logic.  

---

# **6. Part 3 — API Layer**

### **Purpose**
Expose processed data and competency scores via a REST or Gra- Calibration disagreement rate trend (target: decreasing over time). phQL API.

### **Endpoints**
- `GET /developer/:id/competencies`  
- `GET /developer/:id/report`  
- `POST /developer/:id/self-eval`  
- `GET /matrix`  
- `GET /history/:id`  

### **Requirements**
- TypeScript + Fastify or Express.  
- Authentication (JWT or OAuth).  
- Pagination & filtering.  
- Evidence‑rich responses.  
- Caching for expensive queries.  
- Quiz endpoints are implemented in Part 2B after core processing/ML completion.  

### **Acceptance Criteria**
- API returns competency scores with confidence and evidence.  
- Self‑evaluation responses are stored and retrievable.  
- API has full integration test coverage.  

---

# **7. Part 4 — Web Interface**

### **Purpose**
Provide a UI for:
- Viewing competency reports  
- Tracking progress over time  
- Viewing evidence  
- Completing self‑evaluation questionnaires  

### **Key Screens**
1. Developer Dashboard  
2. Competency Matrix View  
3. Self‑Evaluation Module  
4. Team Overview  

### **Self‑Evaluation Requirements**
- Quick questions per competency row  
- Likert scale (L1–L4)  
- Optional free‑text evidence  
- Comparison with automated score  
- Stored historically  

### **Acceptance Criteria**
- UI renders competency matrix similar to CircleCI’s.  
- Self‑evaluation workflow is functional and intuitive.  
- Dashboard shows trends over time.  
- All components have tests.  

---

# **8. Reporting Engine**

### **Purpose**
Generate a CircleCI‑style competency report for each developer.

### **Requirements**
- Exportable HTML or JSON.  
- Evidence‑based scoring.  
- ML + rule‑based hybrid scoring.  
- Trend lines.  
- Self‑evaluation overlay.  

### **Acceptance Criteria**
- Reports match CircleCI matrix structure.  
- Reports include automated + self‑evaluation scores.  
- Reports can be regenerated on demand.  

---

# **9. Matrix Coverage & Governance**

### **Purpose**
Ensure competency outputs are reliable, explainable, fair, and directly mappable to CircleCI Engineering Competency Matrix rows and levels.

### **Requirements**
- Define an explicit matrix mapping table for each competency row and level (L1–L4).  
- For each row/level, specify required evidence types: activity signals, self-eval signals, and reviewer evidence.  
- Define a weighted scoring rubric per competency area with confidence thresholds and tie-break rules.  
- Define role baselines (for example: Engineer I, Engineer II, Senior Engineer) to identify gaps against expected level bands.  
- Define an improvement-plan generator that converts detected gaps into concrete actions (learning topic, target review date).  
- Add governance controls for developer-assessment data: access policy, retention policy, audit trail, and correction workflow.  
- Add anti-gaming and fairness checks for repeated guessing patterns, question leakage, and domain bias.

### **Matrix Mapping Model**
For every competency row:
- `row_id`, `row_name`, `level` (`L1`–`L4`)  
- `required_signals[]` (rules/ML/self-eval/reviewer)  
- `scoring_weights` (must sum to 1.0)  
- `minimum_confidence`  
- `override_policy` (when reviewer calibration can override automated score)

### **Acceptance Criteria**
- 100% of matrix rows have an explicit L1–L4 mapping with measurable signals.  
- Scoring rubric is versioned and reproducible for historical re-computation.  
- Role-based gap reports are generated for each developer against assigned baseline.  
- Calibration sessions produce recorded decisions and updated rubric versions.  
- Fairness checks run in CI and flag statistically significant domain imbalance.  
- Every identified weakness includes a concrete remediation plan and follow-up check window.

### **Success Metrics**
- Matrix row coverage rate (target: 100%).  
- Confidence-qualified score rate (target: >= 90% of rows above minimum confidence).  
- Gap closure rate over rolling 90 days.  

---

## **Part 2B Integration Notes (Deferred Scope)**
- Quiz-derived signals become optional extensions to scoring, reporting, and governance after Part 2B implementation.
- API quiz endpoints (`/quiz/*`) and web quiz workflows are added in the Part 2B delivery window.
- Reporting and matrix governance extend to include quiz overlays once quiz evidence quality gates are defined.

---

# **10. Tooling & Quality**

### **Tech Stack** ✅ **FULLY IMPLEMENTED**
- ✅ Node.js + TypeScript (Perfect match)
- ✅ Microsoft SQL Server (MSSQL) (Full integration with proper schema)
- ✅ TensorFlow.js (Integrated in processing layer)
- ✅ Fastify (Chosen over Express, fully implemented)
- ✅ React (Not Next.js, but React with TypeScript)
- ✅ Jest + Supertest (114 tests passing across 19 test suites)
- ✅ ESLint + Prettier (Configuration implemented)
- ✅ Docker (Docker Compose for database)

**Implementation Notes:**
- **Fastify** was chosen over Express for better performance and TypeScript support
- **React** with **Vite** build system instead of Next.js (simpler for current requirements)
- **Docker Compose** used for MSSQL container management
- **Husky** added for git hooks (pre-commit, pre-push)  

### **CI/CD** 🔄 **PARTIALLY IMPLEMENTED**
- ✅ Linting (ESLint configuration for TypeScript)
- ✅ Type checking (TypeScript compiler integration)
- ✅ Unit tests (Jest with 114 passing tests)
- ✅ Integration tests (Separate integration test configuration)
- 🚧 Model regression tests (Framework ready, specific tests needed)
- 🚧 CI/CD pipeline automation (Local development only, no GitHub Actions/Jenkins yet)

**Testing Infrastructure:**
- **Unit Tests**: 114 tests passing across 19 test suites
- **Integration Tests**: Separate configuration with database integration
- **Test Coverage**: Processing, retrieval, assessment, and connector tests
- **Test Scripts**: Comprehensive npm scripts for different test categories  

---

# **11. Milestones**

### **Phase 0 — Data Foundations** ✅ **COMPLETED**
- ✅ MSSQL schema for core platform entities (connector_configs, activity_events, artifacts, competency_scores, reports, self_evaluations)
- ✅ ArtifactStore abstraction with full interface specification
- ✅ LocalFsArtifactStore implementation with all required methods (put, get, delete, list, exists, getMetadata)
- ✅ Backup and retention policy for local artifacts (cleanup method implemented)
- ✅ Database connection management with proper indexing

### **Phase 1 — Retrieval** ✅ **COMPLETED**
- ✅ Jira, Confluence, Bitbucket, Git connectors (all fully functional)
- ✅ Unified event schema (perfect match to story plan specification)
- ✅ Comprehensive test suite (114 tests passing across 19 test suites)
- ✅ Incremental retrieval support (timestamp-based queries)
- ✅ Rate limiting and graceful error handling
- ✅ Mockable interfaces for all connectors

### **Phase 2 — Processing** ✅ **95% COMPLETED**
- ✅ Feature extraction (31 deterministic features implemented)
- ✅ Rule‑based labelling (13 classification rules with taxonomy-driven expansion)
- ✅ ML classification (TensorFlow.js integration with hybrid scoring)
- ✅ Competency aggregation (rules + ML + evidence with confidence scoring)
- ✅ Classification tests (full test coverage for processing components)
- ✅ Evidence generation and linking
- 🚧 AI‑assisted synthetic test content generation (framework ready, implementation pending)
- 🚧 ML model training with curated datasets (framework ready)

### **Phase 3 — API** 🔄 **85% COMPLETED**
- ✅ Connector configuration endpoints (Full CRUD for Jira, Confluence, Bitbucket)
- ✅ Connection testing functionality (All three connectors with proper authentication)
- ✅ Database-backed configuration storage (MSSQL integration)
- ✅ **Competency endpoints** (GET `/api/competency/contributors`, `/api/competency/contributors/:email`, `/api/competency/summary`, `/api/competency/categories/:category`)
- ✅ **Processing endpoints** (POST `/api/processing/regenerate-scores`, GET `/api/processing/scores`)
- ✅ **Health check endpoints** (GET `/api/processing/health`, GET `/api/competency/health`)
- ✅ **Report routes** (Basic structure implemented: `/api/reports/health`, `/api/reports/developer/:id/report`, `/api/reports/developer/:id/competencies`)
- ✅ **Batch processing** (POST `/api/competency/batch`)
- 🚧 Authentication & authorization (JWT/OAuth not implemented)
- 🚧 Pagination & filtering (Basic implementation, needs enhancement)
- 🚧 Caching for expensive queries (Not implemented)
- 🚧 Self‑eval endpoints (Database schema ready, API endpoints partially implemented)

### **Phase 4 — Web Interface** 🔄 **75% COMPLETED**
- ✅ Dashboard (Basic overview with connector stats)
- ✅ **Analytics Dashboard** (Full competency analytics with insights and visualizations)
  - ✅ **Analytics page** (`/analytics` route with comprehensive metrics)
  - ✅ **Analytics tab** (Analytics tab in Configuration page)
  - ✅ **131 competency assessments** processed and displayed
  - ✅ **33 contributors** analyzed with performance insights
  - ✅ **Top contributors** rankings with confidence scores
  - ✅ **Category performance** breakdowns with top performers
  - ✅ **Confidence/level distributions** with visual charts
  - ✅ **Real-time API integration** for competency scores
- ✅ **Configuration pages** (Connector management with database persistence)
- ✅ **Team overview** (Connectors management page with connection testing)
- ✅ React + TypeScript + Tailwind CSS
- ✅ Routing between pages (React Router with SPA support)
- ✅ API client integration (Axios-based API calls)
- ✅ Connector configuration UI (Jira, Confluence, Bitbucket tabs with database persistence)
- ✅ Connection testing UI (Test buttons with loading states and error handling)
- ✅ CORS configuration
- 🚧 **Competency Matrix View** (Core CircleCI-style matrix visualization - MISSING KEY COMPONENT)
- 🚧 **Self‑evaluation Module** (Database ready, UI not implemented)
- 🚧 **Individual Developer Reports** (API structure ready, frontend missing)  

### **Phase 5 — Quiz & Remediation (Part 2B)**
- Adaptive quiz engine and domain question bank
- Quiz API endpoints (start, answer, recommendations, domains)
- Web quiz workflows and historical attempts
- Quiz signal integration into reporting and matrix governance

### **Phase 6 — Artifact Storage Migration**
- Implement S3ArtifactStore  
- Add configuration-based backend switch  
- Run dual-write validation window (Local FS + S3)  
- Backfill historical artifacts to S3  
- Cut over reads to S3 and deprecate local artifact storage  

### **Phase 6 — Matrix Calibration & Governance**
- Publish matrix mapping table for all competency rows and levels  
- Finalize weighted scoring rubric and confidence thresholds  
- Define role baseline profiles and gap detection rules  
- Enable reviewer calibration workflow and audit trail  
- Ship remediation-plan generation and outcome tracking  
