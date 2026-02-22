import {
  BitbucketConfig,
  ConfluenceConfig,
  JiraConfig,
} from "../config/connector-config";
import DatabaseConnection from "../database/connection";

export interface ConnectorConfigRecord {
  id: number;
  connector_type: string;
  name: string;
  config: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateConnectorConfigRequest {
  connectorType: "jira" | "confluence" | "bitbucket";
  name: string;
  config: JiraConfig | ConfluenceConfig | BitbucketConfig;
}

export interface UpdateConnectorConfigRequest {
  name?: string;
  config?: JiraConfig | ConfluenceConfig | BitbucketConfig;
  is_active?: boolean;
}

export class ConnectorConfigService {
  private db = DatabaseConnection;

  async createConnectorConfig(
    request: CreateConnectorConfigRequest
  ): Promise<ConnectorConfigRecord> {
    const { connectorType, name, config } = request;

    // Validate config based on type
    this.validateConfig(connectorType, config);

    const query = `
      INSERT INTO connector_configs (connector_type, name, config, is_active)
      VALUES (@param0, @param1, @param2, 1)
      SELECT SCOPE_IDENTITY() as id, connector_type, name, config, is_active, created_at, updated_at
      FROM connector_configs WHERE id = SCOPE_IDENTITY()
    `;

    try {
      const db = DatabaseConnection;
      const result = await db.query(query, [
        connectorType,
        name,
        JSON.stringify(config),
      ]);

      if (result.length === 0) {
        throw new Error("Failed to create connector configuration");
      }

      return this.mapDbRecordToConfig(result[0]);
    } catch (error) {
      throw new Error(`Failed to create connector configuration: ${error}`);
    }
  }

  async getConnectorConfig(id: number): Promise<ConnectorConfigRecord | null> {
    const query = `
      SELECT id, connector_type, name, config, is_active, created_at, updated_at
      FROM connector_configs
      WHERE id = @param0
    `;

    try {
      const result = await this.db.query(query, [id]);
      return result.length > 0 ? this.mapDbRecordToConfig(result[0]) : null;
    } catch (error) {
      throw new Error(`Failed to get connector configuration: ${error}`);
    }
  }

  async getConnectorConfigsByType(
    connectorType: string
  ): Promise<ConnectorConfigRecord[]> {
    const query = `
      SELECT id, connector_type, name, config, is_active, created_at, updated_at
      FROM connector_configs
      WHERE connector_type = @param0
      ORDER BY created_at DESC
    `;

    try {
      const result = await this.db.query(query, [connectorType]);
      return result.map((record) => this.mapDbRecordToConfig(record));
    } catch (error) {
      throw new Error(`Failed to get connector configurations: ${error}`);
    }
  }

  async getAllConnectorConfigs(): Promise<ConnectorConfigRecord[]> {
    const query = `
      SELECT id, connector_type, name, config, is_active, created_at, updated_at
      FROM connector_configs
      ORDER BY connector_type, created_at DESC
    `;

    try {
      const result = await this.db.query(query);
      return result.map((record) => this.mapDbRecordToConfig(record));
    } catch (error) {
      throw new Error(`Failed to get all connector configurations: ${error}`);
    }
  }

  async updateConnectorConfig(
    id: number,
    request: UpdateConnectorConfigRequest
  ): Promise<ConnectorConfigRecord> {
    const existingConfig = await this.getConnectorConfig(id);
    if (!existingConfig) {
      throw new Error("Connector configuration not found");
    }

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 0;

    if (request.name !== undefined) {
      updates.push(`name = @param${paramIndex}`);
      params.push(request.name);
      paramIndex++;
    }

    if (request.config !== undefined) {
      // Validate config based on type
      this.validateConfig(existingConfig.connector_type as any, request.config);
      updates.push(`config = @param${paramIndex}`);
      params.push(JSON.stringify(request.config));
      paramIndex++;
    }

    if (request.is_active !== undefined) {
      updates.push(`is_active = @param${paramIndex}`);
      params.push(request.is_active);
      paramIndex++;
    }

    updates.push(`updated_at = GETDATE()`);

    if (updates.length === 0) {
      throw new Error("No updates provided");
    }

    const query = `
      UPDATE connector_configs
      SET ${updates.join(", ")}
      WHERE id = @param${paramIndex}
      SELECT id, connector_type, name, config, is_active, created_at, updated_at
      FROM connector_configs
      WHERE id = @param${paramIndex}
    `;

    params.push(id);

    try {
      const result = await this.db.query(query, params);

      if (result.length === 0) {
        throw new Error("Failed to update connector configuration");
      }

      return this.mapDbRecordToConfig(result[0]);
    } catch (error) {
      throw new Error(`Failed to update connector configuration: ${error}`);
    }
  }

  async deleteConnectorConfig(id: number): Promise<void> {
    const query = `
      DELETE FROM connector_configs
      WHERE id = @param0
    `;

    try {
      await this.db.query(query, [id]);
    } catch (error) {
      throw new Error(`Failed to delete connector configuration: ${error}`);
    }
  }

  async toggleConnectorConfig(
    id: number,
    isActive: boolean
  ): Promise<ConnectorConfigRecord> {
    return this.updateConnectorConfig(id, { is_active: isActive });
  }

  async testConnectorConfig(
    id: number
  ): Promise<{ success: boolean; error?: string }> {
    const config = await this.getConnectorConfig(id);
    if (!config) {
      return { success: false, error: "Connector configuration not found" };
    }

    try {
      const parsedConfig = JSON.parse(config.config);
      const mockArtifactStore = this.createMockArtifactStore();

      // Import connectors dynamically to test connection
      switch (config.connector_type) {
        case "jira":
          const { JiraConnectorEnhanced } =
            await import("../retrieval/jira-connector-enhanced");
          const jiraConnector = new JiraConnectorEnhanced(
            parsedConfig as JiraConfig
          );
          const jiraConnected = await jiraConnector.testConnection();
          return {
            success: jiraConnected,
            error: jiraConnected ? undefined : "Jira connection failed",
          };

        case "confluence":
          const { ConfluenceConnector } =
            await import("../retrieval/confluence-connector");
          const confluenceConnector = new ConfluenceConnector(
            parsedConfig as ConfluenceConfig,
            mockArtifactStore
          );
          const confluenceConnected =
            await confluenceConnector.testConnection();
          return {
            success: confluenceConnected,
            error: confluenceConnected
              ? undefined
              : "Confluence connection failed",
          };

        case "bitbucket":
          const { BitbucketConnector } =
            await import("../retrieval/bitbucket-connector");
          const bitbucketConnector = new BitbucketConnector(
            parsedConfig as BitbucketConfig,
            mockArtifactStore
          );
          const bitbucketConnected = await bitbucketConnector.testConnection();
          return {
            success: bitbucketConnected,
            error: bitbucketConnected
              ? undefined
              : "Bitbucket connection failed",
          };

        default:
          return { success: false, error: "Unknown connector type" };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private validateConfig(connectorType: string, config: any): void {
    switch (connectorType) {
      case "jira":
        this.validateJiraConfig(config as JiraConfig);
        break;
      case "confluence":
        this.validateConfluenceConfig(config as ConfluenceConfig);
        break;
      case "bitbucket":
        this.validateBitbucketConfig(config as BitbucketConfig);
        break;
      default:
        throw new Error(`Unknown connector type: ${connectorType}`);
    }
  }

  private validateJiraConfig(config: JiraConfig): void {
    const errors: string[] = [];

    if (!config.url) errors.push("Jira URL is required");
    if (!config.username) errors.push("Jira username is required");
    if (!config.apiToken) errors.push("Jira API token is required");
    if (!config.boards || config.boards.length === 0) {
      errors.push("At least one Jira board is required");
    }

    if (errors.length > 0) {
      throw new Error(
        `Jira configuration validation failed: ${errors.join(", ")}`
      );
    }
  }

  private validateConfluenceConfig(config: ConfluenceConfig): void {
    const errors: string[] = [];

    if (!config.baseUrl) errors.push("Confluence baseUrl is required");
    if (!config.username) errors.push("Confluence username is required");
    if (!config.apiToken) errors.push("Confluence API token is required");
    if (!config.spaces || config.spaces.length === 0) {
      errors.push("At least one Confluence space is required");
    }

    if (errors.length > 0) {
      throw new Error(
        `Confluence configuration validation failed: ${errors.join(", ")}`
      );
    }
  }

  private validateBitbucketConfig(config: BitbucketConfig): void {
    const errors: string[] = [];

    if (!config.username) errors.push("Bitbucket username is required");
    if (!config.appPassword) errors.push("Bitbucket app password is required");
    if (!config.workspaces || config.workspaces.length === 0) {
      errors.push("At least one Bitbucket workspace is required");
    }
    if (!config.repositories || config.repositories.length === 0) {
      errors.push("At least one Bitbucket repository is required");
    }

    if (errors.length > 0) {
      throw new Error(
        `Bitbucket configuration validation failed: ${errors.join(", ")}`
      );
    }
  }

  private mapDbRecordToConfig(record: any): ConnectorConfigRecord {
    return {
      id: record.id,
      connector_type: record.connector_type,
      name: record.name,
      config: record.config,
      is_active: record.is_active,
      created_at: new Date(record.created_at),
      updated_at: new Date(record.updated_at),
    };
  }

  private createMockArtifactStore() {
    return {
      put: async () => {},
      get: async () => null,
      exists: async () => false,
      delete: async () => {},
      list: async () => ({ items: [], continuationToken: undefined }),
      getMetadata: async () => null,
    };
  }
}

export default ConnectorConfigService;
