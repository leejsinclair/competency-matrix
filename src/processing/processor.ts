import { ActivityEvent } from "../types/activity";
import {
  ProcessingResult,
  Label,
  FeatureVector,
  ProcessingError,
  Rule,
  SyntheticTestData,
} from "./types";
import { RuleEngine } from "./rule-engine";
import { MLProcessor } from "./ml-processor";
import { ArtifactStore } from "../types/artifact";

export interface ProcessingConfig {
  enableRuleEngine: boolean;
  enableMLProcessor: boolean;
  ruleEngineConfig?: {
    rulesPath?: string;
    autoUpdate?: boolean;
  };
  mlConfig?: {
    modelPath?: string;
    retrainInterval?: number;
    syntheticDataGeneration?: boolean;
  };
}

export class Processor {
  private ruleEngine: RuleEngine;
  private mlProcessor: MLProcessor;
  private artifactStore: ArtifactStore;
  private config: ProcessingConfig;

  constructor(config: ProcessingConfig, artifactStore: ArtifactStore) {
    this.config = config;
    this.artifactStore = artifactStore;

    this.ruleEngine = new RuleEngine();
    this.mlProcessor = new MLProcessor();

    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Initialize rule engine with default rules
    if (this.config.enableRuleEngine) {
      await this.loadDefaultRules();
    }

    // Initialize ML processor
    if (this.config.enableMLProcessor) {
      await this.mlProcessor.initializeModels();
    }
  }

  async processEvents(events: ActivityEvent[]): Promise<ProcessingResult> {
    const results: ProcessingResult = {
      events: [],
      labels: [],
      features: [],
      errors: [],
    };

    for (const event of events) {
      try {
        const eventResult = await this.processEvent(event);

        results.events.push(event);
        results.labels.push(...eventResult.labels);
        results.features.push(...eventResult.features);

        // Store processing results as artifacts
        await this.storeProcessingResults(event.id, eventResult);
      } catch (error) {
        const processingError: ProcessingError = {
          id: `error-${event.id}`,
          eventId: event.id,
          error: error instanceof Error ? error.message : String(error),
          severity: "medium",
          createdAt: new Date(),
        };

        results.errors.push(processingError);
      }
    }

    // Aggregate and deduplicate labels
    results.labels = this.deduplicateLabels(results.labels);

    // Sort results by timestamp
    results.labels.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    results.features.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    results.errors.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return results;
  }

  private async processEvent(
    event: ActivityEvent
  ): Promise<{ labels: Label[]; features: FeatureVector[] }> {
    const labels: Label[] = [];
    const features: FeatureVector[] = [];

    // Process with rule engine
    if (this.config.enableRuleEngine) {
      const ruleResult = this.ruleEngine.processEvent(event);
      labels.push(...ruleResult.labels);
      features.push(...ruleResult.features);
    }

    // Process with ML processor
    if (this.config.enableMLProcessor) {
      const mlResult = await this.mlProcessor.processEvent(event);
      labels.push(...mlResult.labels);
      features.push(...mlResult.features);
    }

    return { labels, features };
  }

  private async storeProcessingResults(
    eventId: string,
    result: { labels: Label[]; features: FeatureVector[] }
  ): Promise<void> {
    const timestamp = new Date();

    // Store labels
    if (result.labels.length > 0) {
      const labelsKey = `processing/labels/${eventId}`;
      await this.artifactStore.put(
        labelsKey,
        JSON.stringify(result.labels, null, 2),
        {
          contentType: "application/json",
          source: "processing",
          timestamp,
        }
      );
    }

    // Store features
    if (result.features.length > 0) {
      const featuresKey = `processing/features/${eventId}`;
      await this.artifactStore.put(
        featuresKey,
        JSON.stringify(result.features, null, 2),
        {
          contentType: "application/json",
          source: "processing",
          timestamp,
        }
      );
    }
  }

  private deduplicateLabels(labels: Label[]): Label[] {
    const seen = new Set<string>();
    const deduplicated: Label[] = [];

    for (const label of labels) {
      const key = `${label.eventId}-${label.competencyCategory}-${label.competencyRow}`;

      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(label);
      } else {
        // If duplicate, keep the one with higher confidence
        const existingIndex = deduplicated.findIndex(
          (l) =>
            l.eventId === label.eventId &&
            l.competencyCategory === label.competencyCategory &&
            l.competencyRow === label.competencyRow
        );

        if (
          existingIndex !== -1 &&
          deduplicated[existingIndex].confidence < label.confidence
        ) {
          deduplicated[existingIndex] = label;
        }
      }
    }

    return deduplicated;
  }

  private async loadDefaultRules(): Promise<void> {
    const defaultRules: Rule[] = [
      // Writing Code
      {
        id: "writing-code-1",
        name: "Code Implementation",
        description: "Identify code writing and implementation activities",
        category: "Writing code",
        conditions: [
          {
            field: "content",
            operator: "contains" as const,
            value: "implemented",
            caseSensitive: false,
          },
          {
            field: "source",
            operator: "equals" as const,
            value: "git",
          },
        ],
        action: {
          type: "label",
          params: {
            competencyCategory: "code-quality",
            competencyRow: "implementation",
            level: { level: 2, name: "Novice", description: "", criteria: [] },
            confidence: 0.8,
            evidence: "Implemented code functionality",
          },
        },
        enabled: true,
        priority: 10,
      },
      {
        id: "writing-code-2",
        name: "Code Refactoring",
        description: "Identify refactoring activities",
        category: "Writing code",
        conditions: [
          {
            field: "content",
            operator: "contains" as const,
            value: "refactor",
            caseSensitive: false,
          },
          {
            field: "source",
            operator: "equals" as const,
            value: "git",
          },
        ],
        action: {
          type: "label",
          params: {
            competencyCategory: "code-quality",
            competencyRow: "refactoring",
            level: {
              level: 4,
              name: "Advanced",
              description: "",
              criteria: [],
            },
            confidence: 0.9,
            evidence: "Refactored existing code",
          },
        },
        enabled: true,
        priority: 9,
      },

      // Testing
      {
        id: "testing-1",
        name: "Unit Testing",
        description: "Identify unit testing activities",
        category: "Testing",
        conditions: [
          {
            field: "content",
            operator: "contains" as const,
            value: "unit test",
            caseSensitive: false,
          },
        ],
        action: {
          type: "label",
          params: {
            competencyCategory: "testing",
            competencyRow: "unit_testing",
            level: { level: 2, name: "Novice", description: "", criteria: [] },
            confidence: 0.8,
            evidence: "Implemented unit tests",
          },
        },
        enabled: true,
        priority: 8,
      },
      {
        id: "testing-2",
        name: "Integration Testing",
        description: "Identify integration testing activities",
        category: "Testing",
        conditions: [
          {
            field: "content",
            operator: "contains" as const,
            value: "integration test",
            caseSensitive: false,
          },
        ],
        action: {
          type: "label",
          params: {
            competencyCategory: "testing",
            competencyRow: "integration_testing",
            level: {
              level: 4,
              name: "Advanced",
              description: "",
              criteria: [],
            },
            confidence: 0.9,
            evidence: "Implemented integration tests",
          },
        },
        enabled: true,
        priority: 8,
      },

      // Debugging
      {
        id: "debugging-1",
        name: "Production Debugging",
        description: "Identify debugging and troubleshooting activities",
        category: "Debugging",
        conditions: [
          {
            field: "content",
            operator: "contains" as const,
            value: "production",
            caseSensitive: false,
          },
          {
            field: "content",
            operator: "contains" as const,
            value: "crash",
            caseSensitive: false,
          },
        ],
        action: {
          type: "label",
          params: {
            competencyCategory: "debugging",
            competencyRow: "troubleshooting",
            level: {
              level: 3,
              name: "Intermediate",
              description: "",
              criteria: [],
            },
            confidence: 0.8,
            evidence: "Debugged production issues",
          },
        },
        enabled: true,
        priority: 9,
      },

      // Observability
      {
        id: "observability-1",
        name: "Monitoring Implementation",
        description: "Identify monitoring and observability activities",
        category: "Observability",
        conditions: [
          {
            field: "content",
            operator: "contains" as const,
            value: "monitoring",
            caseSensitive: false,
          },
        ],
        action: {
          type: "label",
          params: {
            competencyCategory: "observability",
            competencyRow: "monitoring",
            level: {
              level: 3,
              name: "Intermediate",
              description: "",
              criteria: [],
            },
            confidence: 0.8,
            evidence: "Implemented monitoring",
          },
        },
        enabled: true,
        priority: 7,
      },

      // Software Architecture
      {
        id: "architecture-1",
        name: "System Design",
        description: "Identify architecture and system design activities",
        category: "Software Architecture",
        conditions: [
          {
            field: "content",
            operator: "contains" as const,
            value: "architecture",
            caseSensitive: false,
          },
        ],
        action: {
          type: "label",
          params: {
            competencyCategory: "architecture",
            competencyRow: "system_design",
            level: {
              level: 3,
              name: "Intermediate",
              description: "",
              criteria: [],
            },
            confidence: 0.8,
            evidence: "Worked on system architecture",
          },
        },
        enabled: true,
        priority: 8,
      },

      // Security
      {
        id: "security-1",
        name: "Security Implementation",
        description: "Identify security-related activities",
        category: "Security",
        conditions: [
          {
            field: "content",
            operator: "contains" as const,
            value: "security",
            caseSensitive: false,
          },
        ],
        action: {
          type: "label",
          params: {
            competencyCategory: "security",
            competencyRow: "application_security",
            level: {
              level: 3,
              name: "Intermediate",
              description: "",
              criteria: [],
            },
            confidence: 0.8,
            evidence: "Implemented security measures",
          },
        },
        enabled: true,
        priority: 8,
      },

      // Teamwork
      {
        id: "teamwork-1",
        name: "Collaboration",
        description: "Identify teamwork and collaboration activities",
        category: "Teamwork",
        conditions: [
          {
            field: "content",
            operator: "contains" as const,
            value: "collaboration",
            caseSensitive: false,
          },
        ],
        action: {
          type: "label",
          params: {
            competencyCategory: "collaboration",
            competencyRow: "teamwork",
            level: {
              level: 3,
              name: "Intermediate",
              description: "",
              criteria: [],
            },
            confidence: 0.7,
            evidence: "Collaborated with team",
          },
        },
        enabled: true,
        priority: 6,
      },

      // Mentoring
      {
        id: "mentoring-1",
        name: "Mentoring Activities",
        description: "Identify mentoring and knowledge sharing activities",
        category: "Mentoring",
        conditions: [
          {
            field: "content",
            operator: "contains" as const,
            value: "mentor",
            caseSensitive: false,
          },
        ],
        action: {
          type: "label",
          params: {
            competencyCategory: "mentoring",
            competencyRow: "technical_mentoring",
            level: {
              level: 3,
              name: "Intermediate",
              description: "",
              criteria: [],
            },
            confidence: 0.8,
            evidence: "Provided mentoring",
          },
        },
        enabled: true,
        priority: 7,
      },

      // Communication
      {
        id: "communication-1",
        name: "Documentation",
        description: "Identify documentation and communication activities",
        category: "Effective communication",
        conditions: [
          {
            field: "source",
            operator: "equals" as const,
            value: "confluence",
          },
        ],
        action: {
          type: "label",
          params: {
            competencyCategory: "documentation",
            competencyRow: "technical_documentation",
            level: {
              level: 3,
              name: "Intermediate",
              description: "",
              criteria: [],
            },
            confidence: 0.7,
            evidence: "Created documentation",
          },
        },
        enabled: true,
        priority: 6,
      },

      // Process Thinking
      {
        id: "process-1",
        name: "Process Improvement",
        description: "Identify process improvement activities",
        category: "Process thinking",
        conditions: [
          {
            field: "content",
            operator: "contains" as const,
            value: "process",
            caseSensitive: false,
          },
        ],
        action: {
          type: "label",
          params: {
            competencyCategory: "process-thinking",
            competencyRow: "process_improvement",
            level: {
              level: 3,
              name: "Intermediate",
              description: "",
              criteria: [],
            },
            confidence: 0.7,
            evidence: "Improved processes",
          },
        },
        enabled: true,
        priority: 6,
      },
    ];

    for (const rule of defaultRules) {
      this.ruleEngine.addRule(rule);
    }
  }

  async generateSyntheticTestData(
    categories: string[],
    countPerCategory: number = 10
  ): Promise<SyntheticTestData[]> {
    const allTestData: SyntheticTestData[] = [];

    for (const category of categories) {
      const testData = await this.mlProcessor.generateSyntheticTestData(
        category,
        countPerCategory
      );
      allTestData.push(...testData);
    }

    return allTestData;
  }

  async trainMLModels(trainingData: any[]): Promise<void> {
    try {
      await this.mlProcessor.trainModel(trainingData);
    } catch (error) {
      console.error("Failed to train ML models:", error);
      // Gracefully handle training errors
    }
  }

  async getProcessingStats(timeRange?: {
    start: Date;
    end: Date;
  }): Promise<any> {
    // This would typically query a database for processing statistics
    // For now, return a mock implementation
    return {
      totalEventsProcessed: 0,
      totalLabelsGenerated: 0,
      totalFeaturesExtracted: 0,
      processingErrors: 0,
      averageProcessingTime: 0,
      competencyDistribution: {},
      timeRange,
    };
  }

  // Rule management methods
  addRule(rule: Rule): void {
    this.ruleEngine.addRule(rule);
  }

  removeRule(ruleId: string): void {
    this.ruleEngine.removeRule(ruleId);
  }

  updateRule(ruleId: string, updates: Partial<Rule>): void {
    this.ruleEngine.updateRule(ruleId, updates);
  }

  getRules(): Rule[] {
    return this.ruleEngine.getRules();
  }

  enableRule(ruleId: string): void {
    this.ruleEngine.enableRule(ruleId);
  }

  disableRule(ruleId: string): void {
    this.ruleEngine.disableRule(ruleId);
  }

  // Configuration methods
  updateConfig(newConfig: Partial<ProcessingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): ProcessingConfig {
    return { ...this.config };
  }
}
