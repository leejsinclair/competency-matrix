import fastify from "fastify";
import {
  ConnectorConfigController,
  registerConnectorConfigRoutes,
} from "./connector-config-routes";

export class ApiServer {
  private server: any;
  private port: number;
  private host: string;

  constructor(port: number = 3000, host: string = "localhost") {
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
      // Register connector configuration routes
      const connectorController = new ConnectorConfigController();
      registerConnectorConfigRoutes(this.server, connectorController);

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
          },
        };
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
    parseInt(process.env.API_PORT || "3000", 10),
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
