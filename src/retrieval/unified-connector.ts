import {
  ConnectorConfig,
  ConnectorConfigManager,
} from "../config/connector-config";
import { ActivityEvent } from "../types/activity";
import { ArtifactStore } from "../types/artifact";
import { BitbucketConnector } from "./bitbucket-connector";
import { ConfluenceConnector } from "./confluence-connector";
import { JiraConnectorEnhanced } from "./jira-connector-enhanced";

export interface RetrievalOptions {
  since?: Date;
  sources?: ("jira" | "confluence" | "bitbucket")[];
  limit?: number;
}

export interface RetrievalResult {
  events: ActivityEvent[];
  source: string;
  count: number;
  errors: string[];
  duration: number;
}

export class UnifiedConnector {
  private jiraConnector?: JiraConnectorEnhanced;
  private confluenceConnector?: ConfluenceConnector;
  private bitbucketConnector?: BitbucketConnector;
  private artifactStore: ArtifactStore;
  private config!: ConnectorConfig; // definite assignment assertion

  constructor(artifactStore: ArtifactStore) {
    this.artifactStore = artifactStore;
  }

  async initialize(): Promise<void> {
    try {
      // Load configurations
      const configManager = new ConnectorConfigManager();
      this.config = await configManager.loadConfigs();

      // Validate configurations
      const validation = configManager.validateConfig(this.config);
      if (!validation.isValid) {
        throw new Error(
          `Configuration validation failed: ${validation.errors.join(", ")}`
        );
      }

      // Initialize connectors
      if (this.config.jira) {
        this.jiraConnector = new JiraConnectorEnhanced(this.config.jira);
        console.log("Jira connector initialized");
      }

      if (this.config.confluence) {
        this.confluenceConnector = new ConfluenceConnector(
          this.config.confluence,
          this.artifactStore
        );
        console.log("Confluence connector initialized");
      }

      if (this.config.bitbucket) {
        this.bitbucketConnector = new BitbucketConnector(
          this.config.bitbucket,
          this.artifactStore
        );
        console.log("Bitbucket connector initialized");
      }

      console.log("Unified connector initialization completed");
    } catch (error) {
      console.error("Failed to initialize unified connector:", error);
      throw error;
    }
  }

  async testConnections(): Promise<{
    jira: boolean;
    confluence: boolean;
    bitbucket: boolean;
  }> {
    const results = {
      jira: false,
      confluence: false,
      bitbucket: false,
    };

    const promises: Promise<void>[] = [];

    if (this.jiraConnector) {
      promises.push(
        this.jiraConnector
          .testConnection()
          .then((result) => {
            results.jira = result;
          })
          .catch(() => {
            results.jira = false;
          })
      );
    }

    if (this.confluenceConnector) {
      promises.push(
        this.confluenceConnector
          .testConnection()
          .then((result) => {
            results.confluence = result;
          })
          .catch(() => {
            results.confluence = false;
          })
      );
    }

    if (this.bitbucketConnector) {
      promises.push(
        this.bitbucketConnector
          .testConnection()
          .then((result) => {
            results.bitbucket = result;
          })
          .catch(() => {
            results.bitbucket = false;
          })
      );
    }

    await Promise.all(promises);
    return results;
  }

  async retrieveAllData(
    options: RetrievalOptions = {}
  ): Promise<RetrievalResult[]> {
    const results: RetrievalResult[] = [];
    const { sources = ["jira", "confluence", "bitbucket"] } = options;

    console.log(`Starting data retrieval from sources: ${sources.join(", ")}`);

    // Retrieve from each source in parallel
    const promises = sources.map((source) =>
      this.retrieveFromSource(source, options)
    );
    const sourceResults = await Promise.allSettled(promises);

    for (let i = 0; i < sourceResults.length; i++) {
      const result = sourceResults[i];
      const source = sources[i];

      if (result.status === "fulfilled") {
        results.push(result.value);
        console.log(`✅ ${source}: Retrieved ${result.value.count} events`);
      } else {
        const errorResult: RetrievalResult = {
          events: [],
          source,
          count: 0,
          errors: [result.reason as string],
          duration: 0,
        };
        results.push(errorResult);
        console.error(
          `❌ ${source}: Failed to retrieve data - ${result.reason}`
        );
      }
    }

    const totalEvents = results.reduce((sum, r) => sum + r.count, 0);
    console.log(`Data retrieval completed. Total events: ${totalEvents}`);

    return results;
  }

  private async retrieveFromSource(
    source: string,
    options: RetrievalOptions
  ): Promise<RetrievalResult> {
    const startTime = Date.now();

    try {
      let events: ActivityEvent[] = [];

      switch (source) {
        case "jira":
          if (!this.jiraConnector) {
            throw new Error("Jira connector not initialized");
          }
          events = await this.jiraConnector.getActivityEvents();
          break;

        case "confluence":
          if (!this.confluenceConnector) {
            throw new Error("Confluence connector not initialized");
          }
          events = await this.confluenceConnector.retrievePages({
            since: options.since,
            spaces: this.config.confluence?.spaces,
            limit: options.limit,
          });
          break;

        case "bitbucket":
          if (!this.bitbucketConnector) {
            throw new Error("Bitbucket connector not initialized");
          }
          events = await this.bitbucketConnector.retrievePullRequests({
            since: options.since,
            repositories: this.config.bitbucket?.repositories,
            limit: options.limit,
          });
          break;

        default:
          throw new Error(`Unknown source: ${source}`);
      }

      // Apply date filter if provided
      if (options.since) {
        events = events.filter(
          (event) => new Date(event.timestamp) >= options.since!
        );
      }

      // Apply limit if provided
      if (options.limit && options.limit > 0) {
        events = events.slice(0, options.limit);
      }

      return {
        events,
        source,
        count: events.length,
        errors: [],
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        events: [],
        source,
        count: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        duration: Date.now() - startTime,
      };
    }
  }

  async getConfigurationStatus(): Promise<any> {
    return {
      jira: {
        configured: !!this.config.jira,
        boards: this.config.jira?.boards || [],
        connected: this.jiraConnector
          ? await this.jiraConnector.testConnection()
          : false,
      },
      confluence: {
        configured: !!this.config.confluence,
        spaces: this.config.confluence?.spaces || [],
        connected: this.confluenceConnector
          ? await this.confluenceConnector.testConnection()
          : false,
      },
      bitbucket: {
        configured: !!this.config.bitbucket,
        repositories: this.config.bitbucket?.repositories || [],
        connected: this.bitbucketConnector
          ? await this.bitbucketConnector.testConnection()
          : false,
      },
    };
  }

  async getAvailableSources(): Promise<string[]> {
    const sources: string[] = [];

    if (this.config.jira) sources.push("jira");
    if (this.config.confluence) sources.push("confluence");
    if (this.config.bitbucket) sources.push("bitbucket");

    return sources;
  }

  async getConfluencePages(spaceKey?: string): Promise<ActivityEvent[]> {
    if (!this.confluenceConnector) {
      throw new Error("Confluence connector not initialized");
    }

    const options: any = {};
    if (spaceKey) {
      options.spaces = [spaceKey];
    }

    return this.confluenceConnector.retrievePages(options);
  }

  async getBitbucketPullRequests(repo?: string): Promise<ActivityEvent[]> {
    if (!this.bitbucketConnector) {
      throw new Error("Bitbucket connector not initialized");
    }

    const options: any = {};
    if (repo) {
      options.repositories = [repo];
    }

    return this.bitbucketConnector.retrievePullRequests(options);
  }
}

export default UnifiedConnector;
