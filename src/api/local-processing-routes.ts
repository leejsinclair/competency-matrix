import { FastifyInstance } from "fastify";
import {
  LocalDataProcessor,
  LocalProcessingOptions,
} from "../services/local-data-processor";

export interface LocalProcessingController {
  processLocalData(options: LocalProcessingOptions): Promise<any>;
  getLocalProcessingResults(): Promise<any>;
}

export class LocalProcessingControllerImpl implements LocalProcessingController {
  private processor: LocalDataProcessor;
  private lastResults: any = null;

  constructor() {
    this.processor = new LocalDataProcessor();
  }

  async processLocalData(options: LocalProcessingOptions) {
    try {
      console.log("🔄 Starting local data processing...", options);

      const results = await this.processor.processLocalData(options);
      this.lastResults = results;

      // Save results for persistence
      await this.processor.saveProcessingResults(results);

      return {
        success: true,
        data: results,
        message: "Local data processing completed successfully",
      };
    } catch (error) {
      console.error("Local processing failed:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  async getLocalProcessingResults() {
    try {
      if (this.lastResults) {
        return {
          success: true,
          data: this.lastResults,
        };
      }

      // Try to load from file
      const fs = require("fs").promises;
      try {
        const data = await fs.readFile(
          "./test-data/processed-results.json",
          "utf-8"
        );
        const results = JSON.parse(data);
        this.lastResults = results;
        return {
          success: true,
          data: results,
        };
      } catch (error) {
        return {
          success: false,
          error: "No processing results available. Run processing first.",
        };
      }
    } catch (error) {
      console.error("Failed to get local processing results:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }
}

export function registerLocalProcessingRoutes(
  fastify: FastifyInstance,
  controller: LocalProcessingController
) {
  // Process local data
  fastify.post("/api/local-processing/process", async (request, _reply) => {
    const options = (request.body as LocalProcessingOptions) || {
      dataSource: "confluence",
    };
    return controller.processLocalData(options);
  });

  // Get local processing results
  fastify.get("/api/local-processing/results", async (_request, _reply) => {
    return controller.getLocalProcessingResults();
  });

  // Health check for local processing
  fastify.get("/api/local-processing/health", async () => {
    return {
      status: "healthy",
      services: {
        localDataProcessor: true,
        ruleEngine: true,
        mlProcessor: false,
        artifactStore: true,
      },
      timestamp: new Date().toISOString(),
    };
  });
}
