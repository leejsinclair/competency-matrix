import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import axios from "axios";
import { JiraConnectorEnhanced } from "../../src/retrieval/jira-connector-enhanced";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("JiraConnectorEnhanced", () => {
  let connector: JiraConnectorEnhanced;
  let mockAxiosInstance: any;

  const config = {
    url: "https://example.atlassian.net",
    username: "user@example.com",
    apiToken: "token",
    boards: ["123"],
  };

  const mockIssue = {
    id: "1001",
    key: "PROJ-1",
    fields: {
      summary: "Issue summary",
      description: "Issue description",
      status: { name: "In Progress" },
      priority: { name: "High" },
      assignee: { displayName: "Assignee", emailAddress: "assignee@example.com" },
      reporter: { displayName: "Reporter", emailAddress: "reporter@example.com" },
      created: "2024-01-01T00:00:00.000Z",
      updated: "2024-01-02T00:00:00.000Z",
      project: { key: "PROJ", name: "Project" },
      issuetype: { name: "Story" },
    },
  };

  beforeEach(() => {
    mockAxiosInstance = {
      get: jest.fn(),
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
    connector = new JiraConnectorEnhanced(config as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("tests connection successfully", async () => {
    mockAxiosInstance.get.mockResolvedValue({ status: 200 });

    await expect(connector.testConnection()).resolves.toBe(true);
    expect(mockAxiosInstance.get).toHaveBeenCalledWith("/rest/api/3/myself");
  });

  it("builds project JQL when fetching issues from projects", async () => {
    mockAxiosInstance.get.mockResolvedValue({ data: { issues: [mockIssue] } });

    const issues = await connector.getIssuesFromProjects(["PROJ", "OPS"], 25);

    expect(issues).toHaveLength(1);
    expect(mockAxiosInstance.get).toHaveBeenCalledWith(
      "/rest/api/3/search",
      expect.objectContaining({
        params: expect.objectContaining({
          jql: "project in (PROJ,OPS) ORDER BY created DESC",
          maxResults: 25,
        }),
      })
    );
  });

  it("converts issue to activity event using assignee actor", () => {
    const event = connector.convertIssueToActivityEvent(mockIssue as any);

    expect(event).toMatchObject({
      id: "jira-1001",
      source: "jira",
      actor: "assignee@example.com",
      type: "issue_created",
      metadata: expect.objectContaining({
        issueKey: "PROJ-1",
        issueType: "Story",
        project: "PROJ",
      }),
    });
  });

  it("retrieves activity events from configured boards", async () => {
    mockAxiosInstance.get.mockResolvedValue({ data: { issues: [mockIssue] } });

    const events = await connector.getActivityEvents();

    expect(events).toHaveLength(1);
    expect(mockAxiosInstance.get).toHaveBeenCalledWith(
      "/rest/agile/1.0/board/123/issue",
      expect.any(Object)
    );
  });

  it("returns empty array when issue comments request fails", async () => {
    mockAxiosInstance.get.mockRejectedValue(new Error("boom"));

    await expect(connector.getIssueComments("PROJ-1")).resolves.toEqual([]);
  });
});
