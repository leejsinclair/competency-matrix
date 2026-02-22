# Competency Matrix Testing Guide

This guide provides step-by-step instructions for testing the competency matrix system at each stage of development, starting with automated labeling.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run assessment system
npm run assessment:full
```

---

## 📋 Testing Stages

### Stage 1: Automated Labeling Tests

This stage tests the core functionality of the rule engine and ML processor for automatically generating competency labels from real developer activities according to the CircleCI competency matrix.

#### 1.1 Rule Engine Tests

**Purpose**: Test the rule-based labeling system that processes real developer content and maps it to CircleCI competency categories.

```bash
# Run rule engine tests
npm test -- tests/processing/rule-engine.test.ts

# Run processor rules tests
npm test -- tests/processing/processor-rules.test.ts
```

**What it actually tests**:

**Rule Creation & Management**:
- **Adding Rules**: Creates rules that map specific content patterns to CircleCI competency categories
- **Example Rule**: When content contains "implemented" and source is "git" → Label as "Writing code" competency
- **Priority Handling**: Ensures higher priority rules are evaluated first for accurate categorization

**Content Processing**:
- **JIRA Content Analysis**: Processes real JIRA issue descriptions like "Fixed authentication bug in production" and labels as "Debugging"
- **Git Commit Analysis**: Analyzes git commit messages like "Refactored payment processing system" and labels as "Software Architecture"  
- **Confluence Documentation**: Reviews documentation like "API design for notification service" and labels as "Effective communication"
- **Slack Conversations**: Processes Slack messages like "Conducted lunch-and-learn session" and labels as "Knowledge Sharing"

**CircleCI Matrix Mapping**:
- **21 Competency Categories**: Maps content to specific CircleCI matrix categories (Writing code, Testing, Debugging, Observability, etc.)
- **5-Level Competency Scale**: Assigns appropriate competency levels (1=Novice to 5=Expert) based on content complexity
- **Evidence Generation**: Creates evidence traces explaining why specific labels were assigned

**Expected Results**: All tests should pass, confirming the rule engine correctly processes real developer content and generates appropriate CircleCI competency labels with proper evidence.

#### 1.2 ML Processor Tests

**Purpose**: Test the machine learning component that learns from labeled examples to improve CircleCI competency classification accuracy.

```bash
# Run ML processor tests
npm test -- tests/processing/ml-processor.test.ts
```

**What it actually tests**:

**TensorFlow Model Integration**:
- **Model Initialization**: Tests TensorFlow model loading and configuration for competency classification
- **Feature Extraction**: Converts developer content into numerical features (text length, word count, source type, activity type)
- **Classification Pipeline**: Processes features through neural network to predict CircleCI competency categories

**Learning from Examples**:
- **Training Data**: Uses labeled examples like "Implemented authentication module" → "Writing code" competency
- **Pattern Recognition**: Learns patterns in real developer content to improve classification accuracy
- **Multi-category Classification**: Can assign content to multiple CircleCI competency categories simultaneously

**Synthetic Data Generation**:
- **Test Data Creation**: Generates realistic test content for each CircleCI competency category
- **Example Synthetic Data**: Creates test cases like "Optimised database queries for performance" → "Observability" competency
- **Coverage Enhancement**: Ensures all 21 CircleCI categories have sufficient test examples

**Expected Results**: Tests should pass, confirming the ML processor can classify developer activities into CircleCI competencies and generate appropriate synthetic test data.

#### 1.3 Core Processor Tests

**Purpose**: Test the integrated processor that combines rule engine and ML processor for comprehensive CircleCI competency labeling.

```bash
# Run all processor tests
npm test -- tests/processing/

# Or run specific processor tests:
npm test -- tests/processing/processor-events.test.ts
npm test -- tests/processing/processor-config.test.ts
npm test -- tests/processing/processor-stats.test.ts
npm test -- tests/processing/processor-synthetic.test.ts
npm test -- tests/processing/processor-training.test.ts
```

**What it actually tests**:

**Event Processing Pipeline**:
- **Real Developer Events**: Processes actual developer activities from JIRA, Git, Confluence, Slack, Bitbucket
- **Example Event**: JIRA issue "Fixed production crash - memory leak in React components" → "Debugging" + "Reliability" labels
- **Combined Classification**: Uses both rule engine and ML processor for comprehensive labeling

**CircleCI Competency Mapping**:
- **21 Categories Coverage**: Tests all CircleCI matrix categories from "Writing code" to "Product Thinking"
- **Competency Levels**: Validates 5-level scale assignment (L1=Novice to L5=Expert)
- **Evidence Tracking**: Ensures each label includes proper evidence from the source content

**Configuration & Performance**:
- **Rule Management**: Tests adding/removing CircleCI competency rules
- **Processing Statistics**: Monitors labeling accuracy and performance metrics
- **Model Training**: Tests ML model improvement with new labeled examples

**Expected Results**: All processor tests should pass, confirming the integrated system correctly processes real developer activities and generates accurate CircleCI competency labels.

---

### Stage 2: Data Retrieval Tests

This stage tests the connectors that retrieve data from various sources.

#### 2.1 JIRA Connector Tests

**Purpose**: Test JIRA integration for retrieving issues and activities

```bash
# Run JIRA connector tests
npm test -- tests/retrieval/jira-connector.test.ts

# Or use the shortcut:
npm run test jira
```

**What it tests**:
- Connection testing
- Project retrieval
- Issue retrieval with filtering
- Event creation from JIRA data
- Error handling

**Expected Results**: All JIRA tests should pass, confirming the connector can successfully retrieve and process JIRA data.

#### 2.2 Artifact Store Tests

**Purpose**: Test the storage system for processed artifacts

```bash
# Run artifact store tests
npm test -- tests/retrieval/local-fs-artifact-store.test.ts
```

**What it tests**:
- File storage and retrieval
- Metadata handling
- List operations
- Delete operations

**Expected Results**: All artifact store tests should pass, confirming reliable data persistence.

---

### Stage 3: Assessment System Tests

This stage tests the complete assessment framework that evaluates how accurately the system labels developer activities according to the CircleCI competency matrix.

#### 3.1 Assessment Runner Tests

**Purpose**: Test the assessment framework that measures labeling accuracy against expected CircleCI competency assignments.

```bash
# Run assessment system (this uses the simplified runner)
npm run assessment:full

# Run specific category assessments
npm run assessment:category Writing code
npm run assessment:category Testing

# Run specific level assessments
npm run assessment:level 3
```

**What it actually tests**:

**Real Developer Content Processing**:
- **52 Test Cases**: Processes realistic developer-written stories and documentation
- **Example JIRA Content**: "Evaluated and prioritised backlog items based on business value" → Expected: "Prioritisation, dependencies" competency
- **Example Git Content**: "Refactored legacy payment processing system into microservices" → Expected: "Software Architecture" competency
- **Example Confluence Content**: "API documentation for authentication service" → Expected: "Effective communication" competency

**CircleCI Matrix Accuracy Evaluation**:
- **Label Matching**: Compares generated labels against expected CircleCI competency categories
- **Category Coverage**: Tests all 21 CircleCI matrix categories (Writing code, Testing, Debugging, Observability, Understanding Code, Software Architecture, Security, Work breakdown, Prioritisation, dependencies, Dealing with ambiguity, Reliability, delivery accountability, Economic thinking, Delivering Feedback, Seeking and receiving feedback, Effective communication, Knowledge Sharing, Teamwork, Mentoring, Business acumen, Strategic work, Product Thinking)
- **Competency Level Validation**: Ensures 5-level scale (L1-L5) assignments match expected difficulty levels

**Evidence and Confidence Scoring**:
- **Evidence Quality**: Validates that each label includes proper evidence from source content
- **Confidence Metrics**: Tests confidence scoring system for label assignments
- **Processing Performance**: Measures time and resource usage for labeling operations

**Expected Results**: The assessment should run successfully and generate a detailed report showing:
- Overall accuracy percentage across all CircleCI categories
- Category-specific accuracy breakdown
- Confidence score averages
- Processing time metrics
- Label distribution analysis

#### 3.2 Test Content Validation

**Purpose**: Validate that test content covers all CircleCI competency categories with realistic developer examples.

```bash
# Check test content coverage
npm run assessment:full | grep "Category Breakdown" -A 50
```

**What it actually validates**:

**Comprehensive Category Coverage**:
- **21 CircleCI Categories**: Ensures all competency categories from the CircleCI matrix are tested
- **Multiple Examples per Category**: Each category has 2-3 test cases with different competency levels
- **Realistic Developer Scenarios**: Content reads like actual developer stories, not resume bullet points

**Example Test Content by Category**:
- **Writing Code**: "Just finished implementing the user authentication module. Used JWT tokens for session management and added proper validation for email formats and password strength."
- **Testing**: "Finally got around to adding unit tests for the user validation functions. Used Jest and made sure to cover all the edge cases for email formats and password requirements."
- **Debugging**: "Got paged at 2 AM because the frontend was crashing in production. Spent hours analyzing heap dumps and finally found the issue - circular references in our React components were causing memory leaks."
- **Observability**: "Implemented Prometheus metrics for API endpoints, tracking request rates, error rates, and response times with proper labels for service identification."
- **Software Architecture**: "Designed RESTful API for new notification service with proper separation of concerns, implementing repository pattern and service layer for maintainability."
- **Security**: "Conducted security audit of authentication system, identifying and fixing SQL injection vulnerabilities and implementing proper input validation."
- **Prioritisation**: "Evaluated and prioritised backlog items based on business value, technical effort, and dependencies, creating roadmap for next two sprints."
- **Teamwork**: "Collaborated with frontend and backend teams to resolve cross-team dependencies during product launch, ensuring smooth delivery coordination."
- **Mentoring**: "Spent time pair programming with junior developer on OAuth implementation, providing guidance on code structure and best practices."

**Source Diversity Validation**:
- **JIRA Issues**: Real bug reports, feature requests, and project management content
- **Git Commits**: Actual commit messages with technical implementation details
- **Confluence Pages**: Documentation, design documents, and knowledge sharing content
- **Slack Messages**: Team communication, discussions, and informal knowledge sharing
- **Bitbucket**: Code reviews, pull requests, and collaboration activities

**Expected Results**: Should see coverage for all 21 CircleCI categories with appropriate test distribution across different sources and competency levels.

---

### Stage 4: Integration Tests

This stage tests the complete end-to-end workflow.

#### 4.1 Full System Integration

**Purpose**: Test the complete pipeline from data retrieval to assessment

```bash
# Run full test suite
npm test

# Run full assessment
npm run assessment:full
```

**What it tests**:
- All components working together
- Data flow from sources to labels
- Assessment accuracy on real data
- Performance under load

**Expected Results**: All tests should pass with reasonable accuracy metrics.

---

## 🔧 Debugging Common Issues

### Test Failures

#### Rule Engine Issues
```bash
# Check rule count mismatch
npm test -- tests/processing/processor-rules.test.ts

# Common fix: Update expected rule count in test assertions
```

#### JIRA Connector Issues
```bash
# Check mock setup
npm test -- tests/retrieval/jira-connector.test.ts

# Common fix: Verify mock axios instance configuration
```

#### Assessment Issues
```bash
# Check assessment runner
npm run assessment:full

# Common fix: Verify test content format and expected labels
```

### Performance Issues

#### Slow Tests
```bash
# Run tests with coverage to identify bottlenecks
npm test -- --coverage

# Run specific slow test
npm test -- --testNamePattern="specific test name"
```

#### Memory Issues
```bash
# Run tests with limited memory
NODE_OPTIONS="--max-old-space-size=4096" npm test
```

---

## 📊 Understanding Test Results

### Test Output Interpretation

#### Processor Tests
- **PASS**: Rule engine/ML processor working correctly
- **FAIL**: Check rule definitions or mock configurations

#### Assessment Results
- **Accuracy > 50%**: Good rule coverage
- **Accuracy 20-50%**: Needs rule refinement
- **Accuracy < 20%**: Major rule issues

#### Label Distribution
- **High variety**: Good rule diversity
- **Low variety**: May need more specific rules
- **Missing categories**: Need additional rules

### Key Metrics

#### Label Accuracy
```bash
# Check overall accuracy
npm run assessment:full | grep "Average Category Accuracy"

# Check category-specific accuracy
npm run assessment:full | grep "Accuracy:"
```

#### Processing Performance
```bash
# Check processing time
npm run assessment:full | grep "Processing Time"

# Check confidence scores
npm run assessment:full | grep "Avg Confidence"
```

---

## 🎯 Best Practices

### Running Tests

1. **Start Small**: Begin with rule engine tests before moving to integration
2. **Run Frequently**: Test after each significant change
3. **Check Coverage**: Ensure all competency categories are tested
4. **Monitor Performance**: Watch for slow tests or memory issues

### Writing Tests

1. **Use Realistic Data**: Test with actual developer content
2. **Cover Edge Cases**: Test unusual scenarios and error conditions
3. **Mock External Dependencies**: Use mocks for external services
4. **Maintain Test Independence**: Tests should not depend on each other

### Debugging

1. **Check Logs**: Look for TensorFlow warnings or error messages
2. **Verify Data**: Ensure test data matches expected format
3. **Validate Rules**: Check rule conditions and actions
4. **Test Incrementally**: Run smaller test subsets to isolate issues

---

## 🚨 Troubleshooting

### Common Error Messages

#### "Jest is not defined"
**Solution**: Use standalone assessment runner instead of Jest-dependent tests
```bash
npm run assessment:full
```

#### "TensorFlow initialization failed"
**Solution**: Mock ML processor in tests
```bash
npm test -- tests/processing/processor-rules.test.ts
```

#### "Rule count mismatch"
**Solution**: Update test expectations to match actual rule count
```bash
# Check current rule count
grep -r "id: " src/processing/processor.ts | wc -l
```

#### "Assessment accuracy 0%"
**Solution**: Review and update rule definitions to match test content
```bash
# Check rule coverage
npm run assessment:full | grep "Label Distribution"
```

---

## 📈 Continuous Improvement

### Monitoring Test Health

1. **Daily**: Run full test suite
2. **Weekly**: Review assessment accuracy trends
3. **Monthly**: Update test content and rules
4. **Quarterly**: Review test coverage and add new categories

### Improving Accuracy

1. **Analyze Failures**: Review which labels are missing
2. **Add Rules**: Create specific rules for missing categories
3. **Refine Conditions**: Improve rule specificity
4. **Test Iteratively**: Run assessments after each change

---

## 🎉 Success Criteria

### Stage 1 Complete ✅
- All processor tests pass
- Rule engine generates labels correctly
- ML processor classifies events accurately

### Stage 2 Complete ✅
- All connector tests pass
- Data retrieval works from all sources
- Artifact storage functions correctly

### Stage 3 Complete ✅
- Assessment system runs successfully
- Accuracy metrics are reasonable (>20%)
- All categories have test coverage

### Stage 4 Complete ✅
- Full integration tests pass
- End-to-end workflow functions
- Performance is acceptable

---

## 📞 Getting Help

If you encounter issues:

1. **Check this guide** for common solutions
2. **Review test output** for specific error messages
3. **Check GitHub issues** for known problems
4. **Run individual tests** to isolate issues

Remember: The goal is continuous improvement in labeling accuracy, not perfect scores from the start!
