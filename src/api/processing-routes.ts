import { FastifyInstance } from "fastify";
import { DatabaseConnection } from "../database/connection";
import {
  ProcessingOptions,
  ProcessingService,
} from "../services/processing-service";

export interface ProcessingController {
  processConnectorData(options: ProcessingOptions): Promise<any>;
  getProcessingStatus(): Promise<any>;
  getCompetencyLabels(connectorId?: number, category?: string): Promise<any>;
  getProcessingSummary(): Promise<any>;
}

export class ProcessingControllerImpl implements ProcessingController {
  private processingService: ProcessingService;

  constructor(db: DatabaseConnection) {
    this.processingService = new ProcessingService(db);
  }

  async processConnectorData(options: ProcessingOptions) {
    try {
      const result = await this.processingService.processConnectorData(options);
      return {
        success: true,
        data: result,
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
      const summary = await this.processingService.getProcessingSummary();
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

  async getCompetencyLabels(connectorId?: number, category?: string) {
    try {
      const labels = await this.processingService.getCompetencyLabels(
        connectorId,
        category
      );
      return {
        success: true,
        data: labels,
        count: labels.length,
      };
    } catch (error) {
      console.error("Failed to get competency labels:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  async getProcessingSummary() {
    try {
      const summary = await this.processingService.getProcessingSummary();
      return {
        success: true,
        data: summary,
      };
    } catch (error) {
      console.error("Failed to get processing summary:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }
}

export function registerProcessingRoutes(
  fastify: FastifyInstance,
  controller: ProcessingController
) {
  // Process connector data
  fastify.post(
    "/api/processing/process",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            connectorIds: {
              type: "array",
              items: { type: "number" },
              description:
                "Specific connector IDs to process (optional, processes all if not provided)",
            },
            since: {
              type: "string",
              format: "date-time",
              description: "Process events since this date (optional)",
            },
            limit: {
              type: "number",
              minimum: 1,
              maximum: 1000,
              description:
                "Maximum number of events per connector (optional, default 100)",
            },
            enableRuleEngine: {
              type: "boolean",
              default: true,
              description: "Enable rule-based processing",
            },
            enableMLProcessor: {
              type: "boolean",
              default: false,
              description: "Enable ML-based processing",
            },
          },
        },
      },
    },
    async (request, _reply) => {
      return controller.processConnectorData(request.body || {});
    }
  );

  // Get processing status
  fastify.get(
    "/api/processing/status",
    controller.getProcessingStatus.bind(controller)
  );

  // Get competency labels
  fastify.get("/api/processing/labels", async (_request, _reply) => {
    const { connectorId, category } = _request.query as any;
    return controller.getCompetencyLabels(connectorId, category);
  });

  // Get processing summary
  fastify.get(
    "/api/processing/summary",
    controller.getProcessingSummary.bind(controller)
  );

  // Health check for processing service
  fastify.get("/api/processing/health", async () => {
    return {
      status: "healthy",
      services: {
        ruleEngine: true,
        mlProcessor: false,
        database: true,
        artifactStore: true,
      },
      timestamp: new Date().toISOString(),
    };
  });
}
