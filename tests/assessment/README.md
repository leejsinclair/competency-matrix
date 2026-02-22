# Competency Assessment System

This directory contains a comprehensive test suite for assessing the automated labeling system's ability to correctly identify and categorize engineering competencies according to the CircleCI competency matrix.

## 🎯 Purpose

The assessment system evaluates how well the processing layer can:
- **Identify competency categories** from real-world engineering activities
- **Assign appropriate competency levels** (1-5 scale)
- **Generate accurate labels** for different types of work
- **Handle various content sources** (Git, Jira, Confluence, Bitbucket, Slack)

## 📊 Competency Categories Covered

### Technical Skills
- **Writing code** - Implementation, refactoring, feature development
- **Testing** - Unit testing, integration testing, test automation
- **Debugging** - Troubleshooting, root cause analysis, incident response
- **Observability** - Monitoring, distributed tracing, alerting
- **Understanding Code** - Code comprehension, legacy system analysis
- **Software Architecture** - System design, enterprise architecture
- **Security** - Application security, security architecture

### Process & Planning
- **Work breakdown** - Task estimation, project planning
- **Prioritisation, dependencies** - Feature prioritization, dependency management
- **Dealing with ambiguity** - Requirements clarification, adaptive planning
- **Reliability, delivery accountability** - Delivery commitments, production ownership
- **Economic thinking** - Cost optimization, ROI analysis
- **Process thinking** - Process improvement, system thinking

### Collaboration & Communication
- **Delivering Feedback** - Code reviews, performance feedback
- **Seeking and receiving feedback** - Code review requests, 360-degree feedback
- **Effective communication** - Technical documentation, stakeholder communication
- **Knowledge Sharing** - Team learning, documentation
- **Teamwork** - Collaboration, team support
- **Relationship building** - Networking, stakeholder trust
- **Handling disagreement** - Technical debates, conflict resolution

### Leadership & Strategy
- **Decision making** - Technical decisions, strategic decisions
- **Driving alignment** - Team alignment, cross-functional alignment
- **Facilitation** - Workshops, retrospectives
- **Mentoring** - Technical mentoring, career mentoring
- **Business acumen** - Market understanding, financial literacy
- **Strategic work** - Technical strategy, innovation
- **Product Thinking** - User empathy, product strategy

## 🚀 Usage

### Quick Start

```bash
# Run full assessment of all categories
npm run assessment:full

# Run assessment for specific category
npm run assessment:category "Writing code"

# Run assessment for specific competency level
npm run assessment:level 3
```

### Programmatic Usage

```typescript
import { CompetencyAssessmentRunner } from './competency-assessment-runner';

const runner = new CompetencyAssessmentRunner();

// Run full assessment
const summary = await runner.runFullAssessment();
const report = runner.generateDetailedReport(summary);
console.log(report);

// Run category-specific assessment
const categorySummary = await runner.runCategoryAssessment('Testing');

// Run level-specific assessment
const levelResults = await runner.runLevelAssessment(3);
```

## 📈 Assessment Metrics

The assessment system provides:

### Accuracy Metrics
- **Overall Accuracy** - Percentage of tests with correct label matches
- **Category Accuracy** - Accuracy per competency category
- **Level Distribution** - Performance across competency levels (1-5)
- **Confidence Scores** - Average confidence of generated labels

### Performance Metrics
- **Processing Time** - Time to process each test case
- **Label Distribution** - Most frequently generated labels
- **Error Analysis** - Missing vs unexpected labels

### Quality Metrics
- **Label Match** - Whether expected labels were correctly identified
- **Missing Labels** - Expected labels that weren't generated
- **Unexpected Labels** - Generated labels that weren't expected

## 📋 Test Content Structure

Each test case includes:

```typescript
{
  id: string,                    // Unique identifier
  category: string,              // Primary competency category
  subcategory?: string,          // Specific subcategory
  competencyLevel: number,       // 1-5 difficulty/complexity level
  content: string,               // Realistic activity description
  source: 'jira' | 'git' | 'confluence' | 'bitbucket' | 'slack',
  metadata: Record<string, any>, // Context-specific metadata
  expectedLabels: string[],      // Expected competency labels
  difficulty: 'easy' | 'medium' | 'hard',
  context: string                // Additional context
}
```

## 🎯 Test Scenarios

### Easy Difficulty (Level 1-2)
- Basic feature implementation
- Simple unit testing
- Code comprehension for small changes
- Basic task breakdown

### Medium Difficulty (Level 3-4)
- Complex debugging and troubleshooting
- Integration testing strategies
- Architecture design for new services
- Cross-team collaboration
- Process improvement initiatives

### Hard Difficulty (Level 4-5)
- Enterprise architecture decisions
- Complex incident investigation
- Strategic planning and roadmapping
- Business case development
- Leadership and mentoring activities

## 📊 Interpreting Results

### High Performance (>80% Accuracy)
- Labeling system is working well for this category
- Rules and ML models are properly trained
- Consider expanding to similar categories

### Medium Performance (60-80% Accuracy)
- Some gaps in label recognition
- Review rule definitions and training data
- Consider adding more specific patterns

### Low Performance (<60% Accuracy)
- Significant issues with label recognition
- Major rule or model retraining needed
- Review test content for clarity and expectations

## 🔧 Customization

### Adding New Test Content

```typescript
import { competencyTestContent } from './competency-test-content';

competencyTestContent.push({
  id: 'new-test-1',
  category: 'New Category',
  competencyLevel: 3,
  content: 'Description of the activity...',
  source: 'jira',
  metadata: { /* context */ },
  expectedLabels: ['expected-label'],
  difficulty: 'medium',
  context: 'Additional context'
});
```

### Modifying Assessment Criteria

Update the `evaluateLabelMatch` method in `competency-assessment-runner.ts` to adjust matching logic:

```typescript
private evaluateLabelMatch(expected: string[], actual: string[]): boolean {
  // Custom matching logic
  const relevantLabels = actual.filter(label => 
    expected.some(expectedLabel => 
      label.toLowerCase().includes(expectedLabel.toLowerCase())
    )
  );
  
  return relevantLabels.length >= expected.length * 0.5; // 50% match threshold
}
```

## 📝 Best Practices

1. **Regular Assessment** - Run assessments after major rule or model updates
2. **Balanced Test Set** - Ensure good distribution across categories and levels
3. **Realistic Content** - Use actual work scenarios rather than artificial examples
4. **Clear Expectations** - Expected labels should be unambiguous and well-defined
5. **Continuous Improvement** - Use results to refine rules and improve training data

## 🐛 Troubleshooting

### Common Issues

1. **Low Accuracy Across All Categories**
   - Check rule engine configuration
   - Verify ML model training data
   - Review test content expectations

2. **Specific Category Underperforming**
   - Review rule definitions for that category
   - Check if test content is representative
   - Consider adding more specific patterns

3. **High Processing Times**
   - Optimize rule conditions
   - Check for infinite loops in rule processing
   - Review ML model complexity

4. **Inconsistent Results**
   - Ensure deterministic rule ordering
   - Check for random elements in ML processing
   - Verify test data consistency

## 📚 Additional Resources

- [CircleCI Engineering Competency Matrix](../storyplan.md)
- [Processing Layer Documentation](../../src/processing/README.md)
- [Rule Engine Configuration](../../src/processing/rule-engine.ts)
- [ML Model Training](../../src/processing/ml-processor.ts)
