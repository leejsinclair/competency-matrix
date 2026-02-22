import { UnifiedConnector } from "../../src/retrieval/unified-connector";
import { ArtifactStore } from "../../src/types/artifact";

const mockLoadConfigs = jest.fn();
const mockValidateConfig = jest.fn();

jest.mock("../../src/config/connector-config", () => ({
  ConnectorConfigManager: jest.fn().mockImplementation(() => ({
    loadConfigs: mockLoadConfigs,
    validateConfig: mockValidateConfig,
  })),
}));

const mockJiraInstance = {
  testConnection: jest.fn(),
  getActivityEvents: jest.fn(),
};
const mockConfluenceInstance = {
  testConnection: jest.fn(),
  retrievePages: jest.fn(),
};
const mockBitbucketInstance = {
  testConnection: jest.fn(),
  retrievePullRequests: jest.fn(),
};

jest.mock("../../src/retrieval/jira-connector-enhanced", () => ({
  JiraConnectorEnhanced: jest.fn().mockImplementation(() => mockJiraInstance),
}));

jest.mock("../../src/retrieval/confluence-connector", () => ({
  ConfluenceConnector: jest
    .fn()
    .mockImplementation(() => mockConfluenceInstance),
}));

jest.mock("../../src/retrieval/bitbucket-connector", () => ({
  BitbucketConnector: jest
    .fn()
    .mockImplementation(() => mockBitbucketInstance),
}));

describe("UnifiedConnector", () => {
  let connector: UnifiedConnector;
  let artifactStore: jest.Mocked<ArtifactStore>;

  beforeEach(() => {
    artifactStore = {
      put: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
      list: jest.fn(),
      exists: jest.fn(),
      getMetadata: jest.fn(),
    };

    mockLoadConfigs.mockResolvedValue({
      jira: {
        url: "https://jira.example.com",
        username: "user@example.com",
        apiToken: "token",
        boards: ["1"],
      },
      confluence: {
        baseUrl: "https://wiki.example.com",
        username: "user@example.com",
        apiToken: "token",
        spaces: ["ENG"],
      },
      bitbucket: {
        baseUrl: "https://api.bitbucket.org/2.0",
        username: "bb-user",
        appPassword: "pass",
        workspaces: ["workspace"],
        repositories: ["workspace/repo"],
      },
    });
    mockValidateConfig.mockReturnValue({ isValid: true, errors: [] });

    mockJiraInstance.testConnection.mockResolvedValue(true);
    mockConfluenceInstance.testConnection.mockResolvedValue(true);
    mockBitbucketInstance.testConnection.mockResolvedValue(true);

    mockJiraInstance.getActivityEvents.mockResolvedValue([
      {
        id: "jira-1",
        source: "jira",
        actor: "user@example.com",
        type: "issue_created",
        timestamp: "2024-01-01T00:00:00.000Z",
        metadata: {},
      },
    ]);

    mockConfluenceInstance.retrievePages.mockResolvedValue([
      {
        id: "conf-1",
        source: "confluence",
        actor: "writer@example.com",
        type: "page_created",
        timestamp: "2024-01-05T00:00:00.000Z",
        metadata: {},
      },
      {
        id: "conf-2",
        source: "confluence",
        actor: "writer@example.com",
        type: "page_updated",
        timestamp: "2023-12-20T00:00:00.000Z",
        metadata: {},
      },
    ]);

    mockBitbucketInstance.retrievePullRequests.mockResolvedValue([]);

    connector = new UnifiedConnector(artifactStore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("initializes connectors from valid config", async () => {
    await connector.initialize();

    const sources = await connector.getAvailableSources();
    expect(sources).toEqual(["jira", "confluence", "bitbucket"]);
  });

  it("fails initialize when config validation fails", async () => {
    mockValidateConfig.mockReturnValue({
      isValid: false,
      errors: ["At least one Jira board is required"],
    });

    await expect(connector.initialize()).rejects.toThrow(
      "Configuration validation failed"
    );
  });

  it("tests all configured connections", async () => {
    await connector.initialize();

    const status = await connector.testConnections();

    expect(status).toEqual({
      jira: true,
      confluence: true,
      bitbucket: true,
    });
  });

  it("retrieves and filters source data", async () => {
    await connector.initialize();

    const results = await connector.retrieveAllData({
      sources: ["confluence"],
      since: new Date("2024-01-01T00:00:00.000Z"),
      limit: 1,
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      source: "confluence",
      count: 1,
      errors: [],
    });
    expect(results[0].events[0].id).toBe("conf-1");
  });
});
