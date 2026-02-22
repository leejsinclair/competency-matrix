import { Processor } from '../../src/processing/processor';
import { ActivityEvent } from '../../src/types/activity';
import { ArtifactStore } from '../../src/types/artifact';

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
      content: "Fix authentication bug\n\nUsers cannot login with valid credentials",
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
      content: "Fix authentication login issue\n\nResolved the credential validation bug",
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
