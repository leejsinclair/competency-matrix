export interface JiraConfig {
  url: string;
  username: string;
  apiToken: string;
  boards: string[];
}

export interface ConfluenceConfig {
  baseUrl: string; // Changed from 'url' to match existing connector
  username: string;
  apiToken: string;
  spaces: string[];
}

export interface BitbucketConfig {
  baseUrl: string; // Changed from 'url' to match existing connector
  username: string;
  apiToken: string; // Changed from appPassword to apiToken
  workspace?: string; // Added workspace for better organization
  repositories?: string[]; // Made optional since workspace might be primary
}

export interface ConnectorConfig {
  jira?: JiraConfig;
  confluence?: ConfluenceConfig;
  bitbucket?: BitbucketConfig;
}

export class ConnectorConfigManager {
  async loadConfigs(): Promise<ConnectorConfig> {
    try {
      // Load from environment variables first
      const envConfig = this.loadFromEnvironment();

      // TODO: Load from database and merge with environment config
      // const dbConfig = await this.loadFromDatabase();

      return envConfig;
    } catch (error) {
      console.error("Failed to load connector configurations:", error);
      throw error;
    }
  }

  private loadFromEnvironment(): ConnectorConfig {
    const config: ConnectorConfig = {};

    // Jira configuration
    if (
      process.env.JIRA_URL &&
      process.env.JIRA_USERNAME &&
      process.env.JIRA_API_TOKEN
    ) {
      config.jira = {
        url: process.env.JIRA_URL,
        username: process.env.JIRA_USERNAME,
        apiToken: process.env.JIRA_API_TOKEN,
        boards: process.env.JIRA_BOARDS?.split(",") || [],
      };
    }

    // Confluence configuration
    if (
      process.env.CONFLUENCE_URL &&
      process.env.CONFLUENCE_USERNAME &&
      process.env.CONFLUENCE_API_TOKEN
    ) {
      config.confluence = {
        baseUrl: process.env.CONFLUENCE_URL,
        username: process.env.CONFLUENCE_USERNAME,
        apiToken: process.env.CONFLUENCE_API_TOKEN,
        spaces: process.env.CONFLUENCE_SPACES?.split(",") || [],
      };
    }

    // Bitbucket configuration
    if (process.env.BITBUCKET_USERNAME && process.env.BITBUCKET_API_TOKEN) {
      config.bitbucket = {
        baseUrl: process.env.BITBUCKET_URL || "https://api.bitbucket.org/2.0",
        username: process.env.BITBUCKET_USERNAME,
        apiToken: process.env.BITBUCKET_API_TOKEN,
        workspace: process.env.BITBUCKET_WORKSPACE,
        repositories: process.env.BITBUCKET_REPOS?.split(",") || [],
      };
    }

    return config;
  }

  async saveConfig(connectorType: string, name: string): Promise<void> {
    // TODO: Implement database storage
    console.log(`Saving ${connectorType} config:`, name);
  }

  async getConfig(connectorType: string, name: string): Promise<any> {
    // TODO: Implement database retrieval
    console.log(`Getting ${connectorType} config:`, name);
    return null;
  }

  validateConfig(config: ConnectorConfig): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate Jira config
    if (config.jira) {
      if (!config.jira.url) errors.push("Jira URL is required");
      if (!config.jira.username) errors.push("Jira username is required");
      if (!config.jira.apiToken) errors.push("Jira API token is required");
      if (!config.jira.boards || config.jira.boards.length === 0) {
        errors.push("At least one Jira board is required");
      }
    }

    // Validate Confluence config
    if (config.confluence) {
      if (!config.confluence.baseUrl)
        errors.push("Confluence baseUrl is required");
      if (!config.confluence.username)
        errors.push("Confluence username is required");
      if (!config.confluence.apiToken)
        errors.push("Confluence API token is required");
      if (!config.confluence.spaces || config.confluence.spaces.length === 0) {
        errors.push("At least one Confluence space is required");
      }
    }

    // Validate Bitbucket config
    if (config.bitbucket) {
      if (!config.bitbucket.username)
        errors.push("Bitbucket username is required");
      if (!config.bitbucket.apiToken)
        errors.push("Bitbucket API token is required");
      if (!config.bitbucket.workspace) {
        errors.push("Bitbucket workspace is required");
      }
      if (
        !config.bitbucket.repositories ||
        config.bitbucket.repositories.length === 0
      ) {
        errors.push("At least one Bitbucket repository is required");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export default ConnectorConfigManager;
