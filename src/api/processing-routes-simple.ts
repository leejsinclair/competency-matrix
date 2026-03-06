import { FastifyInstance } from "fastify";
import { DatabaseConnection } from "../database/connection";

export interface ProcessingController {
  processConnectorData(request: any): Promise<any>;
  getProcessingStatus(): Promise<any>;
}

export class SimpleProcessingController implements ProcessingController {
  private db: DatabaseConnection;

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  async processConnectorData(request: any) {
    try {
      const { connectorIds, since, limit = 100 } = request.body || {};

      console.log("🔄 Starting processing...", { connectorIds, since, limit });

      // Get active connectors
      let connectors;
      if (connectorIds && connectorIds.length > 0) {
        connectors = await this.getConnectorsById(connectorIds);
      } else {
        connectors = await this.getAllConnectors();
      }

      console.log(`📡 Processing ${connectors.length} connectors`);

      const results: any[] = [];
      for (const connector of connectors) {
        try {
          console.log(
            `🔍 Processing ${connector.name} (${connector.connector_type})`
          );

          // Simulate processing for now
          const mockResult = {
            connectorId: connector.id,
            connectorName: connector.name,
            connectorType: connector.connector_type,
            eventsProcessed: Math.floor(Math.random() * 50) + 10,
            labelsGenerated: Math.floor(Math.random() * 20) + 5,
            errors: 0,
            processingTime: Math.floor(Math.random() * 1000) + 500,
          };

          results.push(mockResult);

          // Store mock results in database
          await this.storeMockResults(connector.id, mockResult);
        } catch (error) {
          console.error(`❌ Failed to process ${connector.name}:`, error);
          results.push({
            connectorId: connector.id,
            connectorName: connector.name,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      const summary = {
        totalConnectors: connectors.length,
        successful: results.filter((r) => !r.error).length,
        failed: results.filter((r) => r.error).length,
        totalEvents: results.reduce(
          (sum, r) => sum + (r.eventsProcessed || 0),
          0
        ),
        totalLabels: results.reduce(
          (sum, r) => sum + (r.labelsGenerated || 0),
          0
        ),
        results,
      };

      return {
        success: true,
        data: summary,
        message: "Processing completed successfully",
      };
    } catch (error) {
      console.error("Processing failed:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  async getProcessingStatus() {
    try {
      const summary = await this.getProcessingSummary();
      return {
        success: true,
        data: summary,
      };
    } catch (error) {
      console.error("Failed to get processing status:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  private async getAllConnectors(): Promise<any[]> {
    try {
      const result = await this.db.query(
        "SELECT id, connector_type, name, is_active FROM connector_configs WHERE is_active = 1"
      );
      return result;
    } catch (error) {
      console.error("Failed to get connectors:", error);
      return [];
    }
  }

  private async getConnectorsById(ids: number[]): Promise<any[]> {
    try {
      const connectors: any[] = [];
      for (const id of ids) {
        const result = await this.db.query(
          "SELECT id, connector_type, name, is_active FROM connector_configs WHERE id = @param0",
          [id]
        );
        if (result.length > 0) {
          connectors.push(result[0]);
        }
      }
      return connectors;
    } catch (error) {
      console.error("Failed to get connectors by ID:", error);
      return [];
    }
  }

  private async storeMockResults(
    connectorId: number,
    _result: any
  ): Promise<void> {
    try {
      // Store some mock competency labels
      const mockLabels = [
        {
          eventId: `event-${connectorId}-${Date.now()}`,
          competencyCategory: "technical-skills",
          competencyRow: "software-engineering",
          level: 2,
          confidence: 0.85,
          source: "rule",
          evidence: "Mock evidence from processing",
        },
        {
          eventId: `event-${connectorId}-${Date.now()}-2`,
          competencyCategory: "collaboration",
          competencyRow: "teamwork",
          level: 3,
          confidence: 0.9,
          source: "rule",
          evidence: "Mock collaboration evidence",
        },
      ];

      for (const label of mockLabels) {
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
            label.level,
            label.confidence,
            label.source,
            label.evidence,
            new Date(),
          ]
        );
      }
    } catch (error) {
      console.error("Failed to store mock results:", error);
      // Don't throw - we don't want to fail the whole processing for storage issues
    }
  }

  private async getProcessingSummary(): Promise<any> {
    try {
      const _result = await this.db.query(
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
        totalConnectors: _result[0]?.count || 0,
        totalLabels: labelCount[0]?.count || 0,
        totalErrors: errorCount[0]?.count || 0,
        categories: categories.map((row: any) => row.competency_category),
      };
    } catch (error) {
      console.error("Failed to get processing summary:", error);
      return {
        totalConnectors: 0,
        totalLabels: 0,
        totalErrors: 0,
        categories: [],
      };
    }
  }
}

export function registerSimpleProcessingRoutes(
  fastify: FastifyInstance,
  controller: ProcessingController
) {
  // Process connector data
  fastify.post("/api/processing/process", async (request, _reply) => {
    return controller.processConnectorData(request);
  });

  // Get processing status
  fastify.get("/api/processing/status", async (_request, _reply) => {
    return controller.getProcessingStatus();
  });

  // Get competency labels
  fastify.get("/api/processing/labels", async (request, _reply) => {
    try {
      const { connectorId, category } = request.query as any;
      let query = "SELECT * FROM competency_labels WHERE 1=1";
      const params: any[] = [];
      let paramIndex = 0;

      if (connectorId) {
        query += ` AND connector_id = @param${paramIndex}`;
        params.push(connectorId);
        paramIndex++;
      }

      if (category) {
        query += ` AND competency_category = @param${paramIndex}`;
        params.push(category);
        paramIndex++;
      }

      query += " ORDER BY created_at DESC";

      const results = await (controller as any).db.query(query, params);

      return {
        success: true,
        data: results,
        count: results.length,
      };
    } catch (error) {
      console.error("Failed to get competency labels:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  });

  // Health check for processing service
  fastify.get("/api/processing/health", async () => {
    return {
      status: "healthy",
      services: {
        ruleEngine: true,
        mlProcessor: false, // Disabled for now
        database: true,
        artifactStore: true,
      },
      timestamp: new Date().toISOString(),
    };
  });
}
