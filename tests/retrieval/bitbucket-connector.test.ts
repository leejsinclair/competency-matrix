import axios from "axios";
import { BitbucketConnector } from "../../src/retrieval/bitbucket-connector";
import { ArtifactStore } from "../../src/types/artifact";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("BitbucketConnector", () => {
  let connector: BitbucketConnector;
  let mockAxiosInstance: any;
  let mockArtifactStore: jest.Mocked<ArtifactStore>;

  const config = {
    baseUrl: "https://api.bitbucket.org/2.0",
    username: "user",
    apiToken: "pass",
  };

  const pullRequest = {
    id: 22,
    title: "Improve deployment pipeline",
    description: "Adds extra checks",
    state: "MERGED",
    author: { display_name: "Dev", nickname: "dev1", account_id: "a1" },
    source: {
      branch: { name: "feature/x" },
      commit: { hash: "abc123" },
      repository: { full_name: "workspace/repo" },
    },
    destination: {
      branch: { name: "main" },
      commit: { hash: "def456" },
      repository: { full_name: "workspace/repo" },
    },
    participants: [
      {
        user: {
          display_name: "Reviewer",
          nickname: "reviewer",
          account_id: "u2",
        },
        role: "REVIEWER",
        approved: true,
      },
    ],
    reviewers: [
      { display_name: "Reviewer", nickname: "reviewer", account_id: "u2" },
    ],
    created_on: "2024-01-01T00:00:00.000Z",
    updated_on: "2024-01-02T00:00:00.000Z",
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

    mockAxiosInstance = { get: jest.fn() };
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
    connector = new BitbucketConnector(config, mockArtifactStore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("retrieves pull request, comment, approval and pipeline events", async () => {
    mockAxiosInstance.get.mockImplementation((url: string) => {
      if (url === "/repositories/workspace/repo/pullrequests") {
        return Promise.resolve({ data: { values: [pullRequest] } });
      }

      if (url === "/repositories/workspace/repo/pullrequests/22/comments") {
        return Promise.resolve({
          data: {
            values: [
              {
                id: 9,
                content: { raw: "Nice work", html: "", markup: "markdown" },
                user: {
                  display_name: "Reviewer",
                  nickname: "reviewer",
                  account_id: "u2",
                },
                created_on: "2024-01-01T10:00:00.000Z",
                updated_on: "2024-01-01T10:00:00.000Z",
                deleted: false,
              },
            ],
          },
        });
      }

      if (url === "/repositories/workspace/repo/pipelines") {
        return Promise.resolve({
          data: {
            values: [
              {
                uuid: "{pipe-1}",
                state: { name: "COMPLETED", result: { name: "SUCCESSFUL" } },
                target: {
                  ref_type: "branch",
                  ref_name: "main",
                  commit: { hash: "abc123" },
                },
                created_on: "2024-01-01T11:00:00.000Z",
              },
            ],
          },
        });
      }

      return Promise.resolve({ data: {} });
    });

    const events = await connector.retrievePullRequests({
      repositories: ["workspace/repo"],
    });

    expect(events).toHaveLength(6);
    expect(events.map((event) => event.type)).toEqual(
      expect.arrayContaining([
        "pull_request_created",
        "pull_request_updated",
        "pull_request_merged",
        "comment_added",
        "approval_granted",
        "pipeline_completed",
      ])
    );
    expect(mockArtifactStore.put).toHaveBeenCalledWith(
      "bitbucket/pullrequests/workspace/repo/22",
      expect.any(String),
      expect.objectContaining({ source: "bitbucket" })
    );
  });

  it("tests bitbucket connection", async () => {
    mockAxiosInstance.get.mockResolvedValue({ status: 200 });

    await expect(connector.testConnection()).resolves.toBe(true);
    expect(mockAxiosInstance.get).toHaveBeenCalledWith("/user");
  });

  it("maps repository commits to activity events", async () => {
    mockAxiosInstance.get.mockResolvedValue({
      data: {
        values: [
          {
            hash: "abc123",
            date: "2024-01-01T09:00:00.000Z",
            message: "Initial change",
            author: {
              user: { nickname: "dev1" },
            },
          },
        ],
      },
    });

    const events = await connector.getRepositoryCommits(
      "workspace/repo",
      new Date("2024-01-01T00:00:00.000Z")
    );

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: "commit_pushed",
      actor: "dev1",
      source: "bitbucket",
    });
    expect(mockAxiosInstance.get).toHaveBeenCalledWith(
      "/repositories/workspace/repo/commits",
      expect.objectContaining({
        params: expect.objectContaining({
          q: "date >= 2024-01-01T00:00:00.000Z",
        }),
      })
    );
  });
});
