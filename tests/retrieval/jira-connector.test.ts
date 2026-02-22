import { JiraConnector } from "../../src/retrieval/jira-connector";
import { ArtifactStore } from "../../src/types/artifact";

// Mock dependencies
jest.mock("axios");
import axios from "axios";
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("JiraConnector", () => {
  let connector: JiraConnector;
  let mockArtifactStore: jest.Mocked<ArtifactStore>;
  let mockAxiosInstance: any;

  const mockConfig = {
    baseUrl: "https://test.atlassian.net",
    username: "test@example.com",
    apiToken: "test-token",
  };

  const mockJiraIssue = {
    id: "10001",
    key: "TEST-123",
    fields: {
      summary: "Test Issue",
      description: "Test description",
      issuetype: { name: "Story" },
      status: { name: "In Progress" },
      priority: { name: "High" },
      assignee: {
        emailAddress: "assignee@example.com",
        displayName: "Assignee",
      },
      reporter: {
        emailAddress: "reporter@example.com",
        displayName: "Reporter",
      },
      project: { key: "TEST", name: "Test Project" },
      created: "2023-01-01T10:00:00.000Z",
      updated: "2023-01-02T10:00:00.000Z",
      comment: {
        comments: [
          {
            id: "10002",
            author: {
              emailAddress: "commenter@example.com",
              displayName: "Commenter",
            },
            body: "Test comment",
            created: "2023-01-01T11:00:00.000Z",
            updated: "2023-01-01T11:00:00.000Z",
          },
        ],
      },
      changelog: {
        histories: [
          {
            id: "10003",
            author: {
              emailAddress: "changer@example.com",
              displayName: "Changer",
            },
            created: "2023-01-01T12:00:00.000Z",
            items: [
              {
                field: "status",
                from: "To Do",
                fromString: "To Do",
                to: "In Progress",
                toString: "In Progress",
              },
            ],
          },
        ],
      },
      worklog: {
        worklogs: [
          {
            id: "10004",
            author: {
              emailAddress: "worker@example.com",
              displayName: "Worker",
            },
            timeSpentSeconds: 3600,
            comment: "Work done",
            created: "2023-01-01T13:00:00.000Z",
            updated: "2023-01-01T13:00:00.000Z",
          },
        ],
      },
    },
  };

  beforeEach(() => {
    mockArtifactStore = {
      put: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
      list: jest.fn(),
      exists: jest.fn(),
      getMetadata: jest.fn(),
    };

    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

    connector = new JiraConnector(mockConfig, mockArtifactStore);
  });

  describe("testConnection", () => {
    it("should return true when connection is successful", async () => {
      mockAxiosInstance.get.mockResolvedValue({ status: 200 });

      const result = await connector.testConnection();

      expect(result).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/rest/api/3/myself");
    });

    it("should return false when connection fails", async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error("API error"));

      const result = await connector.testConnection();

      expect(result).toBe(false);
    });
  });

  describe("getProjects", () => {
    it("should return list of projects", async () => {
      const mockProjects = [
        { key: "TEST", name: "Test Project" },
        { key: "DEMO", name: "Demo Project" },
      ];
      mockAxiosInstance.get.mockResolvedValue({
        data: mockProjects,
      });

      const result = await connector.getProjects();

      expect(result).toEqual(mockProjects);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/rest/api/3/project");
    });

    it("should throw error when request fails", async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error("API error"));

      await expect(connector.getProjects()).rejects.toThrow(
        "Failed to retrieve projects"
      );
    });
  });

  describe("retrieveIssues", () => {
    it("should retrieve and process issues correctly", async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: { issues: [mockJiraIssue] },
      });

      const result = await connector.retrieveIssues();

      expect(result).toHaveLength(6); // issue_created, issue_updated, issue_assigned, comment_added, status_changed, worklog_added
      expect(mockArtifactStore.put).toHaveBeenCalledWith(
        "jira/issues/TEST-123",
        expect.any(String),
        expect.any(Object)
      );
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/rest/api/3/search",
        expect.objectContaining({
          params: expect.objectContaining({
            expand: "changelog,worklog",
            fields:
              "summary,description,issuetype,status,priority,assignee,reporter,project,created,updated,resolutiondate,comment,changelog,worklog",
            jql: "",
            maxResults: 100,
          }),
        })
      );

      const issueCreatedEvent = result.find((e) => e.type === "issue_created");
      expect(issueCreatedEvent).toBeDefined();
      expect(issueCreatedEvent?.id).toContain("TEST-123");
      expect(issueCreatedEvent?.source).toBe("jira");

      const commentEvent = result.find((e) => e.type === "comment_added");
      expect(commentEvent).toBeDefined();
      expect(commentEvent?.actor).toBe("commenter@example.com");
      expect(commentEvent?.content).toBe("Test comment");
    });

    it("should filter by date range", async () => {
      const since = new Date("2023-01-01T00:00:00.000Z");
      mockAxiosInstance.get.mockResolvedValue({
        data: { issues: [mockJiraIssue] },
      });

      await connector.retrieveIssues({ since });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/rest/api/3/search",
        expect.objectContaining({
          params: expect.objectContaining({
            jql: expect.stringContaining(
              'updated >= "2023-01-01T00:00:00.000Z"'
            ),
          }),
        })
      );
    });

    it("should filter by projects", async () => {
      const projects = ["TEST", "PROJ"];
      mockAxiosInstance.get.mockResolvedValue({
        data: { issues: [mockJiraIssue] },
      });

      await connector.retrieveIssues({ projects });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/rest/api/3/search",
        expect.objectContaining({
          params: expect.objectContaining({
            expand: "changelog,worklog",
            fields:
              "summary,description,issuetype,status,priority,assignee,reporter,project,created,updated,resolutiondate,comment,changelog,worklog",
            jql: 'project in ("TEST", "PROJ")',
            maxResults: 100,
          }),
        })
      );
    });

    it("should handle missing optional fields gracefully", async () => {
      const issueWithoutAssignee = {
        ...mockJiraIssue,
        fields: {
          ...mockJiraIssue.fields,
          assignee: undefined,
          description: undefined,
        },
      };

      mockAxiosInstance.get.mockResolvedValue({
        data: { issues: [issueWithoutAssignee] },
      });

      const result = await connector.retrieveIssues();

      expect(result).toHaveLength(5); // No issue_assigned event
      expect(mockArtifactStore.put).toHaveBeenCalled();
    });

    it("should create comment event with correct metadata", () => {
      const createEvent = (connector as any).createCommentEvent.bind(connector);
      const comment = mockJiraIssue.fields.comment!.comments[0];
      const event = createEvent(mockJiraIssue, comment);

      expect(event).toMatchObject({
        id: "jira-TEST-123-comment-10002",
        source: "jira",
        timestamp: comment.created,
        actor: "commenter@example.com",
        type: "comment_added",
        metadata: expect.objectContaining({
          issueKey: "TEST-123",
          commentId: "10002",
        }),
        content: "Test comment",
      });
    });
  });
});
