import { DatabaseConnection } from "../database/connection";
import { ProcessingConfig, Processor } from "../processing/processor";
import { Label, ProcessingResult } from "../processing/types";
import { BitbucketConnector } from "../retrieval/bitbucket-connector";
import { ConfluenceConnector } from "../retrieval/confluence-connector";
import { JiraConnectorEnhanced } from "../retrieval/jira-connector-enhanced";
import { LocalFsArtifactStore } from "../storage/local-fs-artifact-store";
import { ActivityEvent } from "../types/activity";
import { ArtifactStore } from "../types/artifact";
import { ConnectorConfigService } from "./connector-config-service";

export interface ProcessingOptions {
  connectorIds?: number[];
  since?: Date;
  limit?: number;
  enableRuleEngine?: boolean;
  enableMLProcessor?: boolean;
}

export interface ProcessingSummary {
  totalEvents: number;
  processedEvents: number;
  labelsGenerated: number;
  errors: number;
  processingTime: number;
  connectors: string[];
}

export class ProcessingService {
  private processor: Processor;
  private connectorService: ConnectorConfigService;
  private artifactStore: ArtifactStore;
  private db: DatabaseConnection;

  constructor(db: DatabaseConnection) {
    this.db = db;
    this.connectorService = new ConnectorConfigService();
    this.artifactStore = new LocalFsArtifactStore("./artifacts");

    const config: ProcessingConfig = {
      enableRuleEngine: true,
      enableMLProcessor: false, // Start with rule-based only
    };

    this.processor = new Processor(config, this.artifactStore);
  }

  async processConnectorData(options: ProcessingOptions = {}): Promise<{
    summary: ProcessingSummary;
    results: ProcessingResult[];
  }> {
    const startTime = Date.now();
    const allEvents: ActivityEvent[] = [];
    const allResults: ProcessingResult[] = [];
    const processedConnectors: string[] = [];

    // Get connectors to process
    const connectors = options.connectorIds
      ? await this.getConnectorsById(options.connectorIds)
      : await this.connectorService.getAllConnectorConfigs();

    console.log(`🔄 Processing data from ${connectors.length} connectors...`);

    for (const connector of connectors) {
      try {
        console.log(
          `📡 Retrieving data from ${connector.name} (${connector.connector_type})...`
        );

        const events = await this.retrieveEventsFromConnector(
          connector,
          options
        );
        allEvents.push(...events);
        processedConnectors.push(connector.name);

        console.log(
          `📊 Retrieved ${events.length} events from ${connector.name}`
        );

        // Process events from this connector
        if (events.length > 0) {
          const result = await this.processor.processEvents(events);
          allResults.push(result);

          // Store results in database
          await this.storeProcessingResults(connector.id, result);
        }
      } catch (error) {
        console.error(
          `❌ Failed to process connector ${connector.name}:`,
          error
        );
        // Add error result
        allResults.push({
          events: [],
          labels: [],
          features: [],
          errors: [
            {
              id: `connector-error-${connector.id}`,
              eventId: "connector-error",
              error: error instanceof Error ? error.message : String(error),
              severity: "high",
              createdAt: new Date(),
            },
          ],
        });
      }
    }

    const processingTime = Date.now() - startTime;
    const totalLabels = allResults.reduce(
      (sum, result) => sum + result.labels.length,
      0
    );
    const totalErrors = allResults.reduce(
      (sum, result) => sum + result.errors.length,
      0
    );

    const summary: ProcessingSummary = {
      totalEvents: allEvents.length,
      processedEvents: allEvents.length,
      labelsGenerated: totalLabels,
      errors: totalErrors,
      processingTime,
      connectors: processedConnectors,
    };

    console.log(
      `✅ Processing complete: ${summary.totalEvents} events, ${summary.labelsGenerated} labels, ${summary.errors} errors`
    );

    return { summary, results: allResults };
  }

  private async retrieveEventsFromConnector(
    connector: any,
    options: ProcessingOptions
  ): Promise<ActivityEvent[]> {
    const config = JSON.parse(connector.config);

    switch (connector.connector_type) {
      case "jira":
        const jiraConnector = new JiraConnectorEnhanced(config);
        return await jiraConnector.getActivityEvents();

      case "confluence":
        const confluenceConnector = new ConfluenceConnector(
          config,
          this.artifactStore
        );
        return await confluenceConnector.retrievePages({
          since: options.since,
          limit: options.limit || 100,
        });

      case "bitbucket":
        const bitbucketConnector = new BitbucketConnector(
          config,
          this.artifactStore
        );
        return await bitbucketConnector.retrievePullRequests({
          since: options.since,
          limit: options.limit || 100,
        });

      default:
        throw new Error(
          `Unsupported connector type: ${connector.connector_type}`
        );
    }
  }

  private async getConnectorsById(ids: number[]): Promise<any[]> {
    const connectors = [];
    for (const id of ids) {
      try {
        const connector = await this.connectorService.getConnectorConfig(id);
        if (connector) connectors.push(connector);
      } catch (error) {
        console.error(`Failed to get connector ${id}:`, error);
      }
    }
    return connectors;
  }

  private async storeProcessingResults(
    connectorId: number,
    result: ProcessingResult
  ): Promise<void> {
    try {
      // Store labels
      for (const label of result.labels) {
        await this.db.query(
          `
          INSERT INTO competency_labels (event_id, connector_id, competency_category, competency_row, level, confidence, source, evidence, created_at)
          VALUES (@param0, @param1, @param2, @param3, @param4, @param5, @param6, @param7, @param8)
        `,
          [
            label.eventId,
            connectorId,
            label.competencyCategory,
            label.competencyRow,
            label.level.level,
            label.confidence,
            label.source,
            label.evidence,
            label.createdAt,
          ]
        );
      }

      // Store errors
      for (const error of result.errors) {
        await this.db.query(
          `
          INSERT INTO processing_errors (event_id, connector_id, error, severity, created_at)
          VALUES (@param0, @param1, @param2, @param3, @param4)
        `,
          [
            error.eventId,
            connectorId,
            error.error,
            error.severity,
            error.createdAt,
          ]
        );
      }
    } catch (dbError) {
      console.error("Failed to store processing results:", dbError);
      throw dbError;
    }
  }

  async getCompetencyLabels(
    connectorId?: number,
    competencyCategory?: string
  ): Promise<Label[]> {
    let query = `
      SELECT * FROM competency_labels 
      WHERE 1=1
    `;
    const params: any = {};

    if (connectorId) {
      query += " AND connector_id = @connector_id";
      params.connector_id = connectorId;
    }

    if (competencyCategory) {
      query += " AND competency_category = @competency_category";
      params.competency_category = competencyCategory;
    }

    query += " ORDER BY created_at DESC";

    const results = await this.db.query(query, params);

    return results.map((row: any) => ({
      id: row.id,
      eventId: row.event_id,
      competencyCategory: row.competency_category,
      competencyRow: row.competency_row,
      level: { level: row.level, name: "", description: "", criteria: [] },
      confidence: row.confidence,
      source: row.source,
      evidence: row.evidence,
      createdAt: new Date(row.created_at),
    }));
  }

  async getProcessingSummary(): Promise<{
    totalConnectors: number;
    totalEvents: number;
    totalLabels: number;
    totalErrors: number;
    categories: string[];
  }> {
    const connectorCount = await this.db.query(
      "SELECT COUNT(*) as count FROM connector_configs WHERE is_active = 1"
    );
    const labelCount = await this.db.query(
      "SELECT COUNT(*) as count FROM competency_labels"
    );
    const errorCount = await this.db.query(
      "SELECT COUNT(*) as count FROM processing_errors"
    );
    const categories = await this.db.query(
      "SELECT DISTINCT competency_category FROM competency_labels"
    );

    return {
      totalConnectors: connectorCount[0].count,
      totalEvents: 0, // TODO: Track events separately
      totalLabels: labelCount[0].count,
      totalErrors: errorCount[0].count,
      categories: categories.map((row: any) => row.competency_category),
    };
  }
}
