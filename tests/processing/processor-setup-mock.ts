import { Processor } from "../../src/processing/processor";
import { ActivityEvent } from "../../src/types/activity";
import { ArtifactStore } from "../../src/types/artifact";

// Mock the MLProcessor to avoid TensorFlow initialization
jest.mock("../../src/processing/ml-processor", () => ({
  MLProcessor: jest.fn().mockImplementation(() => ({
    initializeModels: jest.fn().mockResolvedValue(undefined),
    processEvent: jest.fn().mockImplementation((event: any) => {
      // Simulate error for problematic events
      if (event.id === "event-error" || !event.content) {
        throw new Error("Invalid event data");
      }

      return Promise.resolve({
        labels: [
          {
            id: `rule-documentation-1-${event.id}`,
            eventId: event.id,
            competencyCategory: "documentation",
            competencyRow: "technical_writing",
            level: { level: 2, name: "Novice", description: "", criteria: [] },
            confidence: 0.7,
            source: "rule",
            evidence: "Created or updated documentation",
            createdAt: new Date(),
          },
        ],
        features: [
          {
            id: "ml-feature-test",
            eventId: event.id,
            algorithm: "tensorflow-neural-network",
            version: "1.0",
            features: {
              textLength: 100,
              wordCount: 20,
              sourceJira: 1,
              sourceGit: 0,
              sourceConfluence: 0,
              sourceBitbucket: 0,
              typeIssueCreated: 1,
              typeCommit: 0,
              typePullRequest: 0,
              typePageCreated: 0,
              typeComment: 0,
            },
            createdAt: new Date(),
          },
        ],
      });
    }),
    trainModel: jest.fn().mockResolvedValue(undefined),
    generateSyntheticTestData: jest
      .fn()
      .mockImplementation((categories: string[] | string, count: number) => {
        const cats = Array.isArray(categories) ? categories : [categories];
        return cats.flatMap((category) =>
          Array.from({ length: count }, (_, i) => ({
            id: `synthetic-${category}-${i}`,
            competencyCategory: category,
            competencyRow: "generated",
            level: { level: 2, name: "Novice", description: "", criteria: [] },
            content: `Test content for ${category}`,
            source: "ai_generated",
            expectedLabels: [category],
            metadata: {
              generatedAt: new Date(),
              model: "gpt-4",
            },
          }))
        );
      }),
  })),
}));

export interface ProcessorTestSetup {
  processor: Processor;
  mockArtifactStore: jest.Mocked<ArtifactStore>;
  mockEvents: ActivityEvent[];
}

export function createProcessorSetup(): ProcessorTestSetup {
  const mockArtifactStore: jest.Mocked<ArtifactStore> = {
    put: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
    list: jest.fn(),
    exists: jest.fn(),
    getMetadata: jest.fn(),
  };

  const processor = new Processor(
    {
      enableRuleEngine: true,
      enableMLProcessor: true,
    },
    mockArtifactStore
  );

  const mockEvents: ActivityEvent[] = [
    {
      id: "event-1",
      source: "jira",
      timestamp: "2023-01-01T10:00:00.000Z",
      actor: "dev1@example.com",
      type: "issue_created",
      metadata: {
        summary: "Fix authentication bug",
        description: "Users cannot login with valid credentials",
        priority: "High",
      },
      content:
        "Fix authentication bug\n\nUsers cannot login with valid credentials",
    },
    {
      id: "event-2",
      source: "git",
      timestamp: "2023-01-01T11:00:00.000Z",
      actor: "dev2@example.com",
      type: "commit",
      metadata: {
        repository: "frontend",
        branch: "main",
        filesChanged: ["src/auth.js"],
        additions: 15,
        deletions: 8,
      },
      content:
        "Fix authentication login issue\n\nResolved the credential validation bug",
    },
    {
      id: "event-3",
      source: "confluence",
      timestamp: "2023-01-01T12:00:00.000Z",
      actor: "dev1@example.com",
      type: "page_created",
      metadata: {
        title: "API Documentation",
        space: "DEV",
      },
      content: "API Documentation for authentication service",
    },
  ];

  return { processor, mockArtifactStore, mockEvents };
}
