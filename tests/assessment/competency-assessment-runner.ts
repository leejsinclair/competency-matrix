import { Processor } from "../../src/processing/processor";
import { ArtifactStore } from "../../src/types/artifact";
import { ActivityEvent, ActivitySource } from "../../src/types/activity";
import {
  competencyTestContent,
  CompetencyTestContent,
  getTestContentByCategory,
  getTestContentByLevel,
} from "./competency-test-content";

export interface AssessmentResult {
  testId: string;
  category: string;
  expectedLabels: string[];
  actualLabels: string[];
  labelMatch: boolean;
  missingLabels: string[];
  unexpectedLabels: string[];
  confidence: number;
  processingTime: number;
  competencyLevel: number;
  difficulty: string;
}

export interface CategoryAssessmentSummary {
  category: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  accuracy: number;
  averageConfidence: number;
  averageProcessingTime: number;
  levelDistribution: Record<number, number>;
}

export interface OverallAssessmentSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  overallAccuracy: number;
  categorySummaries: CategoryAssessmentSummary[];
  processingTime: number;
  labelDistribution: Record<string, number>;
}

export class CompetencyAssessmentRunner {
  private processor: Processor;
  private artifactStore: ArtifactStore;

  constructor() {
    // Mock artifact store for assessment
    this.artifactStore = {
      put: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
      list: jest.fn(),
      exists: jest.fn(),
      getMetadata: jest.fn(),
    };

    this.processor = new Processor(
      {
        enableRuleEngine: true,
        enableMLProcessor: true,
      },
      this.artifactStore
    );
  }

  async runSingleTest(
    testContent: CompetencyTestContent
  ): Promise<AssessmentResult> {
    const startTime = Date.now();

    // Convert test content to ActivityEvent
    const event: ActivityEvent = this.convertToActivityEvent(testContent);

    try {
      const result = await this.processor.processEvents([event]);
      const processingTime = Date.now() - startTime;

      const actualLabels = result.labels.map(
        (label) => label.competencyCategory
      );
      const expectedLabels = testContent.expectedLabels;

      const labelMatch = this.evaluateLabelMatch(expectedLabels, actualLabels);
      const missingLabels = expectedLabels.filter(
        (label) => !actualLabels.includes(label)
      );
      const unexpectedLabels = actualLabels.filter(
        (label) => !expectedLabels.includes(label)
      );

      const confidence =
        result.labels.length > 0
          ? result.labels.reduce(
              (sum, label) => sum + (label.confidence || 0),
              0
            ) / result.labels.length
          : 0;

      return {
        testId: testContent.id,
        category: testContent.category,
        expectedLabels,
        actualLabels,
        labelMatch,
        missingLabels,
        unexpectedLabels,
        confidence,
        processingTime,
        competencyLevel: testContent.competencyLevel,
        difficulty: testContent.difficulty,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;

      return {
        testId: testContent.id,
        category: testContent.category,
        expectedLabels: testContent.expectedLabels,
        actualLabels: [],
        labelMatch: false,
        missingLabels: testContent.expectedLabels,
        unexpectedLabels: [],
        confidence: 0,
        processingTime,
        competencyLevel: testContent.competencyLevel,
        difficulty: testContent.difficulty,
      };
    }
  }

  async runCategoryAssessment(
    category: string
  ): Promise<CategoryAssessmentSummary> {
    const categoryTests = getTestContentByCategory(category);
    const results: AssessmentResult[] = [];

    console.log(
      `Running assessment for category: ${category} (${categoryTests.length} tests)`
    );

    for (const test of categoryTests) {
      const result = await this.runSingleTest(test);
      results.push(result);

      // Progress indicator
      process.stdout.write(".");
    }
    console.log(); // New line after progress

    const passedTests = results.filter((r) => r.labelMatch).length;
    const accuracy = passedTests / results.length;
    const averageConfidence =
      results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    const averageProcessingTime =
      results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;

    const levelDistribution: Record<number, number> = {};
    results.forEach((result) => {
      levelDistribution[result.competencyLevel] =
        (levelDistribution[result.competencyLevel] || 0) + 1;
    });

    return {
      category,
      totalTests: results.length,
      passedTests,
      failedTests: results.length - passedTests,
      accuracy,
      averageConfidence,
      averageProcessingTime,
      levelDistribution,
    };
  }

  async runFullAssessment(): Promise<OverallAssessmentSummary> {
    console.log("Starting full competency assessment...");
    const startTime = Date.now();

    const categorySummaries: CategoryAssessmentSummary[] = [];
    const allResults: AssessmentResult[] = [];
    const labelDistribution: Record<string, number> = {};

    // Run assessment for each category
    for (const category of this.getUniqueCategories()) {
      const summary = await this.runCategoryAssessment(category);
      categorySummaries.push(summary);

      // Collect all results for overall analysis
      const categoryTests = getTestContentByCategory(category);
      for (const test of categoryTests) {
        const result = await this.runSingleTest(test);
        allResults.push(result);

        // Track label distribution
        result.actualLabels.forEach((label) => {
          labelDistribution[label] = (labelDistribution[label] || 0) + 1;
        });
      }
    }

    const totalTests = allResults.length;
    const passedTests = allResults.filter((r) => r.labelMatch).length;
    const overallAccuracy = passedTests / totalTests;
    const processingTime = Date.now() - startTime;

    return {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      overallAccuracy,
      categorySummaries,
      processingTime,
      labelDistribution,
    };
  }

  async runLevelAssessment(level: number): Promise<AssessmentResult[]> {
    const levelTests = getTestContentByLevel(level);
    const results: AssessmentResult[] = [];

    console.log(
      `Running assessment for competency level ${level} (${levelTests.length} tests)`
    );

    for (const test of levelTests) {
      const result = await this.runSingleTest(test);
      results.push(result);
      process.stdout.write(".");
    }
    console.log();

    return results;
  }

  generateDetailedReport(summary: OverallAssessmentSummary): string {
    let report = "# Competency Assessment Report\n\n";

    // Overall Summary
    report += "## Overall Summary\n";
    report += `- **Total Tests**: ${summary.totalTests}\n`;
    report += `- **Passed Tests**: ${summary.passedTests} (${(summary.overallAccuracy * 100).toFixed(1)}%)\n`;
    report += `- **Failed Tests**: ${summary.failedTests}\n`;
    report += `- **Processing Time**: ${(summary.processingTime / 1000).toFixed(2)}s\n\n`;

    // Category Breakdown
    report += "## Category Breakdown\n\n";
    const sortedCategories = summary.categorySummaries.sort(
      (a, b) => b.accuracy - a.accuracy
    );

    for (const category of sortedCategories) {
      report += `### ${category.category}\n`;
      report += `- **Accuracy**: ${(category.accuracy * 100).toFixed(1)}% (${category.passedTests}/${category.totalTests})\n`;
      report += `- **Avg Confidence**: ${(category.averageConfidence * 100).toFixed(1)}%\n`;
      report += `- **Avg Processing Time**: ${category.averageProcessingTime.toFixed(0)}ms\n`;
      report += `- **Level Distribution**: ${Object.entries(
        category.levelDistribution
      )
        .map(([level, count]) => `L${level}: ${count}`)
        .join(", ")}\n\n`;
    }

    // Label Distribution
    report += "## Label Distribution\n\n";
    const sortedLabels = Object.entries(summary.labelDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10); // Top 10 labels

    for (const [label, count] of sortedLabels) {
      report += `- **${label}**: ${count} times\n`;
    }
    report += "\n";

    // Performance Analysis
    report += "## Performance Analysis\n\n";
    const avgAccuracy =
      summary.categorySummaries.reduce((sum, cat) => sum + cat.accuracy, 0) /
      summary.categorySummaries.length;
    const highPerformingCategories = summary.categorySummaries.filter(
      (cat) => cat.accuracy >= avgAccuracy
    );
    const lowPerformingCategories = summary.categorySummaries.filter(
      (cat) => cat.accuracy < avgAccuracy
    );

    report += `**Average Category Accuracy**: ${(avgAccuracy * 100).toFixed(1)}%\n\n`;

    if (highPerformingCategories.length > 0) {
      report += "### High Performing Categories\n";
      for (const cat of highPerformingCategories) {
        report += `- ${cat.category}: ${(cat.accuracy * 100).toFixed(1)}%\n`;
      }
      report += "\n";
    }

    if (lowPerformingCategories.length > 0) {
      report += "### Categories Needing Improvement\n";
      for (const cat of lowPerformingCategories) {
        report += `- ${cat.category}: ${(cat.accuracy * 100).toFixed(1)}%\n`;
      }
      report += "\n";
    }

    return report;
  }

  private convertToActivityEvent(
    testContent: CompetencyTestContent
  ): ActivityEvent {
    return {
      id: testContent.id,
      source:
        testContent.source === "slack"
          ? "git"
          : (testContent.source as ActivitySource), // Map slack to git for compatibility
      timestamp: new Date().toISOString(),
      actor: "test-user@example.com",
      type: this.inferEventType(testContent),
      metadata: testContent.metadata,
      content: testContent.content,
    };
  }

  private inferEventType(testContent: CompetencyTestContent): string {
    switch (testContent.source) {
      case "git":
        return "commit";
      case "jira":
        return testContent.metadata.issueType === "bug"
          ? "bug_report"
          : "issue_created";
      case "confluence":
        return "page_created";
      case "bitbucket":
        return "pull_request";
      case "slack":
        return "comment"; // Map slack to a generic activity type
      default:
        return "activity";
    }
  }

  private evaluateLabelMatch(expected: string[], actual: string[]): boolean {
    if (expected.length === 0) return true;

    // Consider it a match if at least one expected label is present
    // and the majority of labels are relevant
    const relevantLabels = actual.filter((label) =>
      expected.some(
        (expectedLabel) =>
          label.toLowerCase().includes(expectedLabel.toLowerCase()) ||
          expectedLabel.toLowerCase().includes(label.toLowerCase())
      )
    );

    return (
      relevantLabels.length > 0 && relevantLabels.length / actual.length >= 0.5
    );
  }

  private getUniqueCategories(): string[] {
    const categories = competencyTestContent.map((test) => test.category);
    return [...new Set(categories)];
  }
}

// CLI interface for running assessments
export async function runAssessmentCommand(
  type: "full" | "category" | "level",
  target?: string
) {
  const runner = new CompetencyAssessmentRunner();

  switch (type) {
    case "full":
      const fullSummary = await runner.runFullAssessment();
      const report = runner.generateDetailedReport(fullSummary);
      console.log(report);
      break;

    case "category":
      if (!target) {
        console.error("Category name is required for category assessment");
        process.exit(1);
      }
      const categorySummary = await runner.runCategoryAssessment(target);
      console.log(`\nCategory: ${categorySummary.category}`);
      console.log(`Accuracy: ${(categorySummary.accuracy * 100).toFixed(1)}%`);
      console.log(
        `Passed: ${categorySummary.passedTests}/${categorySummary.totalTests}`
      );
      break;

    case "level":
      if (!target) {
        console.error("Level number is required for level assessment");
        process.exit(1);
      }
      const level = parseInt(target);
      if (isNaN(level) || level < 1 || level > 5) {
        console.error("Level must be a number between 1 and 5");
        process.exit(1);
      }
      const levelResults = await runner.runLevelAssessment(level);
      const passed = levelResults.filter((r) => r.labelMatch).length;
      console.log(`\nLevel ${level} Assessment`);
      console.log(
        `Accuracy: ${((passed / levelResults.length) * 100).toFixed(1)}%`
      );
      console.log(`Passed: ${passed}/${levelResults.length}`);
      break;

    default:
      console.error("Invalid assessment type. Use: full, category, or level");
      process.exit(1);
  }
}
