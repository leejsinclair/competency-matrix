import cors from "@fastify/cors";
import fastify from "fastify";
import path from "path";
import { DatabaseConnection } from "../database/connection";
import {
  ConnectorConfigController,
  registerConnectorConfigRoutes,
} from "./connector-config-routes";
import {
  registerSimpleProcessingRoutes,
  SimpleProcessingController,
} from "./processing-routes-simple";
import { competencyRoutes } from "./routes/competency-routes";
import { matrixRoutes } from "./routes/matrix-routes";
import processingRoutes from "./routes/processing-routes";
import { reportRoutes } from "./routes/report-routes";

export class ApiServer {
  private server: any;
  private port: number;
  private host: string;

  constructor(port: number = 3001, host: string = "localhost") {
    this.port = port;
    this.host = host;
    this.server = fastify({
      logger: {
        level: process.env.LOG_LEVEL || "info",
      },
    });
  }

  async start(): Promise<void> {
    try {
      // Register CORS
      await this.server.register(cors, {
        origin: ["http://localhost:5173", "http://localhost:3000"],
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
      });

      // Register connector configuration routes
      const connectorController = new ConnectorConfigController();
      registerConnectorConfigRoutes(this.server, connectorController);

      // Register competency routes
      await competencyRoutes(this.server);

      // Register report routes
      await reportRoutes(this.server);

      // Register matrix routes
      await matrixRoutes(this.server);

      // Register processing routes
      const db = DatabaseConnection.getInstance();
      await db.connect();
      const processingController = new SimpleProcessingController(db);
      await registerSimpleProcessingRoutes(this.server, processingController);

      // Register new processing routes
      await this.server.register(processingRoutes, {
        prefix: "/api/processing",
      });

      // TODO: Register local processing routes once imports are fixed
      // const localProcessingController = new LocalProcessingControllerImpl();
      // registerLocalProcessingRoutes(this.server, localProcessingController);

      // Add health check endpoint
      this.server.get("/health", async () => {
        return { status: "ok", timestamp: new Date().toISOString() };
      });

      // Add root endpoint
      this.server.get("/", async () => {
        return {
          message: "Competency Matrix Connector Configuration API",
          version: "1.0.0",
          endpoints: {
            "GET /health": "Health check",
            "GET /api/connector-configs": "Get all connector configurations",
            "POST /api/connector-configs": "Create connector configuration",
            "GET /api/connector-configs/:id":
              "Get specific connector configuration",
            "PUT /api/connector-configs/:id": "Update connector configuration",
            "DELETE /api/connector-configs/:id":
              "Delete connector configuration",
            "PATCH /api/connector-configs/:id/toggle":
              "Toggle connector configuration",
            "POST /api/connector-configs/:id/test":
              "Test connector configuration",
            "GET /api/connector-configs/type/:connectorType":
              "Get configurations by type",
            "GET /api/reports/health": "Report service health check",
            "GET /api/reports/developer/:id/report":
              "Generate developer competency report",
            "GET /api/reports/developer/:id/competencies":
              "Get developer competency profiles",
            "POST /api/reports/developer/:id/self-eval":
              "Store developer self-evaluation",
            "GET /api/reports/matrix": "Get full team competency matrix",
            "GET /api/reports/history": "Get report generation history",
            "GET /api/reports/:reportId/export":
              "Export report in different formats",
          },
        };
      });

      // Serve static files from frontend
      this.server.register(require("@fastify/static"), {
        root: path.join(__dirname, "../../frontend/dist"),
        prefix: "/",
      });

      // Serve index.html for all non-API routes (SPA support)
      this.server.setNotFoundHandler(async (request, reply) => {
        if (request.url.startsWith("/api") || request.url === "/health") {
          reply.code(404).send({ error: "Not Found" });
        } else {
          const indexPath = path.join(
            __dirname,
            "../../frontend/dist/index.html"
          );
          return reply.sendFile(indexPath);
        }
      });

      // Start server
      await this.server.listen({ port: this.port, host: this.host });
      console.log(`🚀 API Server running on http://${this.host}:${this.port}`);
    } catch (error) {
      console.error("Failed to start API server:", error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      await this.server.close();
      console.log("API Server stopped");
    } catch (error) {
      console.error("Failed to stop API server:", error);
      throw error;
    }
  }

  getServer() {
    return this.server;
  }
}

// Start server if this file is executed directly
if (require.main === module) {
  const server = new ApiServer(
    parseInt(process.env.API_PORT || "3001", 10),
    process.env.API_HOST || "localhost"
  );

  server.start().catch((error) => {
    console.error("Server startup failed:", error);
    process.exit(1);
  });

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\nShutting down server...");
    await server.stop();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("\nShutting down server...");
    await server.stop();
    process.exit(0);
  });
}

export default ApiServer;
