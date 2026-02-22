import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import axios from "axios";
import { ConfluenceConnector } from "../../src/retrieval/confluence-connector";
import { ArtifactStore } from "../../src/types/artifact";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("ConfluenceConnector", () => {
  let connector: ConfluenceConnector;
  let mockAxiosInstance: any;
  let mockArtifactStore: jest.Mocked<ArtifactStore>;

  const config = {
    baseUrl: "https://example.atlassian.net/wiki",
    username: "user@example.com",
    apiToken: "token",
  };

  const page = {
    id: "2001",
    title: "Runbook",
    type: "page",
    status: "current",
    space: { key: "ENG", name: "Engineering" },
    version: {
      number: 2,
      when: "2024-01-02T00:00:00.000Z",
      by: { displayName: "Editor", emailAddress: "editor@example.com" },
    },
    author: { displayName: "Author", emailAddress: "author@example.com" },
    created: "2024-01-01T00:00:00.000Z",
    body: { storage: { value: "<p>Hello&nbsp;&amp; world</p>" } },
    labels: { results: [{ name: "incident", prefix: "global" }] },
    ancestors: [{ id: "1999", title: "Parent", type: "page" }],
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
    connector = new ConfluenceConnector(config, mockArtifactStore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("retrieves pages and emits page/comment/label events", async () => {
    mockAxiosInstance.get.mockImplementation((url: string) => {
      if (url === "/rest/api/content/search") {
        return Promise.resolve({ data: { results: [page] } });
      }

      if (url === "/rest/api/content/2001/child/comment") {
        return Promise.resolve({
          data: {
            results: [
              {
                id: "3001",
                body: { storage: { value: "<p>Looks good</p>" } },
                author: {
                  displayName: "Reviewer",
                  emailAddress: "reviewer@example.com",
                },
                created: "2024-01-01T12:00:00.000Z",
              },
            ],
          },
        });
      }

      return Promise.resolve({ data: {} });
    });

    const events = await connector.retrievePages({
      since: new Date("2024-01-01T00:00:00.000Z"),
      spaces: ["ENG"],
      limit: 10,
    });

    expect(mockArtifactStore.put).toHaveBeenCalledWith(
      "confluence/pages/2001",
      expect.any(String),
      expect.objectContaining({ source: "confluence" })
    );
    expect(mockAxiosInstance.get).toHaveBeenCalledWith(
      "/rest/api/content/search",
      expect.objectContaining({
        params: expect.objectContaining({
          cql: expect.stringContaining('space in ("ENG")'),
          limit: 10,
        }),
      })
    );
    expect(events.map((event) => event.type)).toEqual(
      expect.arrayContaining([
        "page_created",
        "page_updated",
        "comment_added",
        "label_added",
      ])
    );
    expect(events.find((event) => event.type === "page_created")?.content).toBe(
      "Hello & world"
    );
  });

  it("returns false when test connection fails", async () => {
    mockAxiosInstance.get.mockRejectedValue(new Error("down"));

    await expect(connector.testConnection()).resolves.toBe(false);
  });

  it("maps spaces response", async () => {
    mockAxiosInstance.get.mockResolvedValue({
      data: { results: [{ key: "ENG", name: "Engineering" }] },
    });

    await expect(connector.getSpaces()).resolves.toEqual([
      { key: "ENG", name: "Engineering" },
    ]);
  });
});
