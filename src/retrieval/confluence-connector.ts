import axios, { AxiosError, AxiosInstance } from "axios";
import {
  ActivityEvent,
  CONFLUENCE_EVENT_TYPES,
  ConfluenceActivityEvent,
  ConfluenceEventMetadata,
} from "../types/activity";
import { ArtifactStore } from "../types/artifact";

export interface ConfluenceConfig {
  baseUrl: string;
  username: string;
  apiToken: string;
}

export interface ConfluenceRetrievalOptions {
  since?: Date;
  spaces?: string[];
  limit?: number;
}

interface ConfluencePage {
  id: string;
  title: string;
  type: string;
  status: string;
  space: {
    key: string;
    name: string;
  };
  version: {
    number: number;
    when: string;
    message?: string;
    by: {
      displayName: string;
      emailAddress: string;
    };
  };
  author: {
    displayName: string;
    emailAddress: string;
  };
  created: string;
  body?: {
    storage?: {
      value: string;
    };
    view?: {
      value: string;
    };
  };
  _links?: {
    webui: string;
  };
  labels?: {
    results: Array<{
      name: string;
      prefix: string;
    }>;
  };
  ancestors?: Array<{
    id: string;
    title: string;
    type: string;
  }>;
}

interface ConfluenceComment {
  id: string;
  title?: string;
  body: {
    storage?: {
      value: string;
    };
    view?: {
      value: string;
    };
  };
  extensions?: {
    resolution?: string;
  };
  status: string;
  created: string;
  updated: string;
  author: {
    displayName: string;
    emailAddress: string;
  };
  _links?: {
    webui: string;
  };
}

export class ConfluenceConnector {
  private client: AxiosInstance;
  private artifactStore: ArtifactStore;

  constructor(config: ConfluenceConfig, artifactStore: ArtifactStore) {
    // Create Basic Auth header with base64 encoding
    const authHeader =
      "Basic " +
      Buffer.from(`${config.username}:${config.apiToken}`).toString("base64");

    console.log(config);
    console.log(`Auth header: ${authHeader}`);

    this.client = axios.create({
      baseURL: config.baseUrl,
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    this.artifactStore = artifactStore;
  }

  async retrievePages(
    options: ConfluenceRetrievalOptions = {}
  ): Promise<ActivityEvent[]> {
    const events: ActivityEvent[] = [];
    const { since, spaces, limit = 100 } = options;

    // Build CQL (Confluence Query Language) query
    const cqlParts: string[] = [];

    if (since) {
      cqlParts.push(`lastModified >= "${since.toISOString()}"`);
    }

    if (spaces && spaces.length > 0) {
      cqlParts.push(`space in (${spaces.map((s) => `"${s}"`).join(", ")})`);
    }

    const cql = cqlParts.length > 0 ? cqlParts.join(" AND ") : "";

    // Retrieve pages using CQL
    const searchResponse = await this.client.get("/rest/api/content/search", {
      params: {
        cql,
        expand: "version,author,space,labels,ancestors,body.storage,body.view",
        limit,
      },
    });

    const pages: ConfluencePage[] = searchResponse.data.results || [];

    for (const page of pages) {
      // Store raw page data as artifact
      const artifactKey = `confluence/pages/${page.id}`;
      const jsonString = JSON.stringify(page, null, 2);
      await this.artifactStore.put(artifactKey, jsonString, {
        contentType: "application/json",
        source: "confluence",
        timestamp: new Date(page.version.when),
      });

      // Create page creation event
      events.push(
        this.createPageEvent(
          page,
          CONFLUENCE_EVENT_TYPES.PAGE_CREATED,
          page.created
        )
      );

      // Create page update event
      if (page.version.when !== page.created) {
        events.push(
          this.createPageEvent(
            page,
            CONFLUENCE_EVENT_TYPES.PAGE_UPDATED,
            page.version.when
          )
        );
      }

      // Get comments for this page
      const comments = await this.getPageComments(page.id);
      for (const comment of comments) {
        events.push(this.createCommentEvent(page, comment));
      }

      // Process labels
      if (page.labels?.results) {
        for (const label of page.labels.results) {
          events.push(this.createLabelEvent(page, label, page.version.when));
        }
      }
    }

    return events.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  private async getPageComments(pageId: string): Promise<ConfluenceComment[]> {
    try {
      const response = await this.client.get(
        `/rest/api/content/${pageId}/child/comment`,
        {
          params: {
            expand: "body.storage,body.view,author",
            limit: 200,
          },
        }
      );
      return response.data.results || [];
    } catch (error) {
      // If comments can't be retrieved, return empty array
      return [];
    }
  }

  private createPageEvent(
    page: ConfluencePage,
    eventType: string,
    timestamp: string
  ): ConfluenceActivityEvent {
    const content = page.body?.storage?.value || page.body?.view?.value || "";

    const metadata: ConfluenceEventMetadata = {
      pageId: page.id,
      spaceKey: page.space.key,
      title: page.title,
      version: page.version.number,
      contentType: "page",
      parentPageId: page.ancestors?.[page.ancestors.length - 1]?.id,
      labels: page.labels?.results?.map((l) => l.name) || [],
    };

    return {
      id: `confluence-page-${page.id}-${eventType}-${Date.now()}`,
      source: "confluence",
      timestamp,
      actor: page.author.emailAddress,
      type: eventType,
      metadata,
      content: this.stripHtml(content),
    };
  }

  private createCommentEvent(
    page: ConfluencePage,
    comment: ConfluenceComment
  ): ConfluenceActivityEvent {
    const content =
      comment.body?.storage?.value || comment.body?.view?.value || "";

    const metadata: ConfluenceEventMetadata = {
      pageId: page.id,
      spaceKey: page.space.key,
      title: page.title,
      version: 1, // Comments don't have versions
      commentId: comment.id,
      contentType: "comment",
    };

    return {
      id: `confluence-comment-${comment.id}`,
      source: "confluence",
      timestamp: comment.created,
      actor: comment.author.emailAddress,
      type: CONFLUENCE_EVENT_TYPES.COMMENT_ADDED,
      metadata,
      content: this.stripHtml(content),
    };
  }

  private createLabelEvent(
    page: ConfluencePage,
    label: any,
    timestamp: string
  ): ConfluenceActivityEvent {
    const metadata: ConfluenceEventMetadata = {
      pageId: page.id,
      spaceKey: page.space.key,
      title: page.title,
      version: page.version.number,
      contentType: "page",
      labels: [label.name],
    };

    return {
      id: `confluence-label-${page.id}-${label.name}`,
      source: "confluence",
      timestamp,
      actor: page.version.by.emailAddress,
      type: CONFLUENCE_EVENT_TYPES.LABEL_ADDED,
      metadata,
    };
  }

  private stripHtml(html: string): string {
    // Simple HTML stripping - in production, you might want to use a proper HTML parser
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  /**
   * Test the connection to Confluence
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log("🧪 Testing Confluence connection...");
      console.log("📡 Base URL:", this.client.defaults.baseURL);
      console.log(
        "🔑 Auth Header:",
        this.client.defaults.headers.Authorization
      );

      const response = await this.client.get("/rest/api/user/current");

      console.log("📊 Response status:", response.status);
      console.log("📊 Response data:", response.data);
      console.log("📊 Response headers:", response.headers);

      return response.status === 200;
    } catch (error) {
      console.error("❌ Confluence connection test failed:", error);
      const err = error as AxiosError;
      if (err.response) {
        console.error("📊 Error status:", err.status);
        console.error("📊 Error data:", err.response.data);
        console.error("📊 Error headers:", err.response.headers);
      }
      return false;
    }
  }

  /**
   * Get available spaces
   */
  async getSpaces(): Promise<Array<{ key: string; name: string }>> {
    try {
      const response = await this.client.get("/rest/api/space", {
        params: {
          limit: 200,
          type: "global",
        },
      });
      return response.data.results.map((space: any) => ({
        key: space.key,
        name: space.name,
      }));
    } catch (error) {
      throw new Error(`Failed to retrieve spaces: ${error}`);
    }
  }

  /**
   * Get recent updates from a specific space
   */
  async getSpaceUpdates(
    spaceKey: string,
    since?: Date
  ): Promise<ActivityEvent[]> {
    const options: ConfluenceRetrievalOptions = { spaces: [spaceKey] };
    if (since) {
      options.since = since;
    }
    return this.retrievePages(options);
  }

  /**
   * Search for pages containing specific content
   */
  async searchPages(
    query: string,
    spaces?: string[]
  ): Promise<ConfluencePage[]> {
    try {
      const cqlParts = [`~"${query}"`];

      if (spaces && spaces.length > 0) {
        cqlParts.push(`space in (${spaces.map((s) => `"${s}"`).join(", ")})`);
      }

      const response = await this.client.get("/rest/api/content/search", {
        params: {
          cql: cqlParts.join(" AND "),
          expand: "version,author,space,labels,ancestors,body.storage",
          limit: 100,
        },
      });

      return response.data.results || [];
    } catch (error) {
      throw new Error(`Failed to search pages: ${error}`);
    }
  }
}
