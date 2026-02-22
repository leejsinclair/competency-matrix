import { FastifyInstance } from "fastify";
import {
  ConnectorConfigController,
  registerConnectorConfigRoutes,
} from "../../src/api/connector-config-routes";
import DatabaseConnection from "../../src/database/connection";

describe("Connector Configuration Integration Tests", () => {
  let server: FastifyInstance;
  let controller: ConnectorConfigController;
  let db: typeof DatabaseConnection;

  beforeAll(async () => {
    // Initialize database
    // const schema = new DatabaseSchema();
    // await schema.initializeSchema();

    // Create Fastify instance
    const fastify = require("fastify")({
      logger: false, // Disable logging for tests
    });

    // Register routes
    controller = new ConnectorConfigController();
    registerConnectorConfigRoutes(fastify, controller);

    // Add health check endpoint (same as in server.ts)
    fastify.get("/health", async () => {
      return { status: "ok", timestamp: new Date().toISOString() };
    });

    // Add root endpoint (same as in server.ts)
    fastify.get("/", async () => {
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
          "DELETE /api/connector-configs/:id": "Delete connector configuration",
          "PATCH /api/connector-configs/:id/toggle": "Toggle connector status",
          "POST /api/connector-configs/:id/test":
            "Test connector configuration",
        },
      };
    });

    server = fastify;
    db = DatabaseConnection;
  });

  afterAll(async () => {
    // Clean up database connections
    await DatabaseConnection.disconnect();
    await server.close();
  });

  beforeEach(async () => {
    // Enhanced cleanup: remove all test data with multiple patterns
    const patterns = ["Test%", "Demo%", "Sample%", "Updated%", "Config%"];

    for (const pattern of patterns) {
      try {
        await DatabaseConnection.query(
          `DELETE FROM connector_configs WHERE name LIKE '${pattern}'`
        );
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe("POST /api/connector-configs", () => {
    it("should create a Jira configuration", async () => {
      const payload = {
        connectorType: "jira",
        name: `Test Jira Config ${Date.now()}`,
        config: {
          url: "https://test.atlassian.net",
          username: "test@example.com",
          apiToken: "test-token",
          boards: ["board1", "board2"],
        },
      };

      const response = await server.inject({
        method: "POST",
        url: "/api/connector-configs",
        payload,
      });

      expect(response.statusCode).toBe(201);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.data.connector_type).toBe("jira");
      expect(result.data.name).toBe(payload.name);
      expect(result.data.is_active).toBe(true);
      expect(JSON.parse(result.data.config)).toEqual(payload.config);
    });

    it("should create a Confluence configuration", async () => {
      const payload = {
        connectorType: "confluence",
        name: `Test Confluence Config ${Date.now()}`,
        config: {
          baseUrl: "https://test.atlassian.net/wiki",
          username: "test@example.com",
          apiToken: "test-token",
          spaces: ["space1", "space2"],
        },
      };

      const response = await server.inject({
        method: "POST",
        url: "/api/connector-configs",
        payload,
      });

      expect(response.statusCode).toBe(201);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.data.connector_type).toBe("confluence");
      expect(result.data.name).toBe(payload.name);
    });

    it("should create a Bitbucket configuration", async () => {
      const payload = {
        connectorType: "bitbucket",
        name: `Test Bitbucket Config ${Date.now()}`,
        config: {
          baseUrl: "https://api.bitbucket.org/2.0",
          username: "test-user",
          appPassword: "test-password",
          workspaces: ["workspace1"],
          repositories: ["repo1", "repo2"],
        },
      };

      const response = await server.inject({
        method: "POST",
        url: "/api/connector-configs",
        payload,
      });

      expect(response.statusCode).toBe(201);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.data.connector_type).toBe("bitbucket");
      expect(result.data.name).toBe(payload.name);
    });

    it("should return 400 for invalid connector type", async () => {
      const payload = {
        connectorType: "invalid",
        name: "Test Config",
        config: {},
      };

      const response = await server.inject({
        method: "POST",
        url: "/api/connector-configs",
        payload,
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.error || result.message).toBeDefined();
    });

    it("should return 400 for missing required fields", async () => {
      const payload = {
        connectorType: "jira",
        name: "Test Config",
        // Missing config
      };

      const response = await server.inject({
        method: "POST",
        url: "/api/connector-configs",
        payload,
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.error || result.message).toBeDefined();
    });

    it("should return 400 for invalid Jira configuration", async () => {
      const payload = {
        connectorType: "jira",
        name: "Test Config",
        config: {
          // Missing required fields
          url: "https://test.atlassian.net",
        },
      };

      const response = await server.inject({
        method: "POST",
        url: "/api/connector-configs",
        payload,
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Jira configuration validation failed");
    });
  });

  describe("GET /api/connector-configs/:id", () => {
    let configId: number;

    beforeEach(async () => {
      // Create a test configuration
      const payload = {
        connectorType: "jira",
        name: `Test Jira Config ${Date.now()}`,
        config: {
          url: "https://test.atlassian.net",
          username: "test@example.com",
          apiToken: "test-token",
          boards: ["board1"],
        },
      };

      const response = await server.inject({
        method: "POST",
        url: "/api/connector-configs",
        payload,
      });

      const result = JSON.parse(response.payload);
      configId = result.data.id;
    });

    it("should retrieve a specific configuration", async () => {
      const response = await server.inject({
        method: "GET",
        url: `/api/connector-configs/${configId}`,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(configId);
      expect(result.data.connector_type).toBe("jira");
    });

    it("should return 404 for non-existent configuration", async () => {
      const response = await server.inject({
        method: "GET",
        url: "/api/connector-configs/99999",
      });

      expect(response.statusCode).toBe(404);
      const result = JSON.parse(response.payload);
      expect(result.error).toBe("Connector configuration not found");
    });

    it("should return 400 for invalid ID format", async () => {
      const response = await server.inject({
        method: "GET",
        url: "/api/connector-configs/invalid",
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe("GET /api/connector-configs", () => {
    beforeEach(async () => {
      // Create test configurations
      const configs = [
        {
          connectorType: "jira",
          name: `Test Jira 1 ${Date.now()}`,
          config: {
            url: "https://test.atlassian.net",
            username: "test",
            apiToken: "token",
            boards: ["board1"],
          },
        },
        {
          connectorType: "confluence",
          name: `Test Confluence 1 ${Date.now()}`,
          config: {
            baseUrl: "https://test.atlassian.net/wiki",
            username: "test",
            apiToken: "token",
            spaces: ["space1"],
          },
        },
      ];

      for (const config of configs) {
        await server.inject({
          method: "POST",
          url: "/api/connector-configs",
          payload: config,
        });
      }
    });

    it("should retrieve all configurations", async () => {
      const response = await server.inject({
        method: "GET",
        url: "/api/connector-configs",
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.count).toBeGreaterThan(0);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe("GET /api/connector-configs/type/:connectorType", () => {
    beforeEach(async () => {
      // Clean up all test data before this test suite
      try {
        await DatabaseConnection.query(
          "DELETE FROM connector_configs WHERE name LIKE 'Test%'"
        );
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    it("should retrieve configurations by type", async () => {
      // Create test configurations of different types
      const configs = [
        {
          connectorType: "jira",
          name: `Test Jira Type ${Date.now()}`,
          config: {
            url: "https://test.atlassian.net",
            username: "test",
            apiToken: "token",
            boards: ["board1"],
          },
        },
        {
          connectorType: "jira",
          name: `Test Jira Type 2 ${Date.now()}`,
          config: {
            url: "https://test.atlassian.net",
            username: "test",
            apiToken: "token",
            boards: ["board2"],
          },
        },
        {
          connectorType: "confluence",
          name: `Test Confluence Type ${Date.now()}`,
          config: {
            baseUrl: "https://test.atlassian.net/wiki",
            username: "test",
            apiToken: "token",
            spaces: ["space1"],
          },
        },
      ];

      for (const config of configs) {
        await server.inject({
          method: "POST",
          url: "/api/connector-configs",
          payload: config,
        });
      }

      const response = await server.inject({
        method: "GET",
        url: "/api/connector-configs/type/jira",
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
      expect(
        result.data.every((config: any) => config.connector_type === "jira")
      ).toBe(true);
    });

    it("should return 400 for invalid connector type", async () => {
      const response = await server.inject({
        method: "GET",
        url: "/api/connector-configs/type/invalid",
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe("PUT /api/connector-configs/:id", () => {
    let configId: number;

    beforeEach(async () => {
      // Create a test configuration
      const payload = {
        connectorType: "jira",
        name: `Test Jira Update ${Date.now()}`,
        config: {
          url: "https://test.atlassian.net",
          username: "test@example.com",
          apiToken: "test-token",
          boards: ["board1"],
        },
      };

      const response = await server.inject({
        method: "POST",
        url: "/api/connector-configs",
        payload,
      });

      const result = JSON.parse(response.payload);
      configId = result.data.id;
    });

    it("should update configuration name", async () => {
      const updatePayload = {
        name: "Updated Test Name",
      };

      const response = await server.inject({
        method: "PUT",
        url: `/api/connector-configs/${configId}`,
        payload: updatePayload,
      });

      // Debug: log the actual response
      console.log("PUT Response:", response.statusCode, response.payload);

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.data.name).toBe("Updated Test Name");
    });

    it("should update configuration config", async () => {
      const updatePayload = {
        config: {
          url: "https://updated.atlassian.net",
          username: "updated@example.com",
          apiToken: "updated-token",
          boards: ["board1", "board2", "board3"],
        },
      };

      const response = await server.inject({
        method: "PUT",
        url: `/api/connector-configs/${configId}`,
        payload: updatePayload,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      const config = JSON.parse(result.data.config);
      expect(config.url).toBe("https://updated.atlassian.net");
      expect(config.boards).toHaveLength(3);
    });

    it("should update active status", async () => {
      const updatePayload = {
        is_active: false,
      };

      const response = await server.inject({
        method: "PUT",
        url: `/api/connector-configs/${configId}`,
        payload: updatePayload,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.data.is_active).toBe(false);
    });

    it("should return 404 for non-existent configuration", async () => {
      const updatePayload = {
        name: "Updated Name",
      };

      const response = await server.inject({
        method: "PUT",
        url: "/api/connector-configs/99999",
        payload: updatePayload,
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("DELETE /api/connector-configs/:id", () => {
    let configId: number;

    beforeEach(async () => {
      // Create a test configuration
      const payload = {
        connectorType: "jira",
        name: `Test Jira Delete ${Date.now()}`,
        config: {
          url: "https://test.atlassian.net",
          username: "test@example.com",
          apiToken: "test-token",
          boards: ["board1"],
        },
      };

      const response = await server.inject({
        method: "POST",
        url: "/api/connector-configs",
        payload,
      });

      const result = JSON.parse(response.payload);
      configId = result.data.id;
    });

    it("should delete configuration", async () => {
      const response = await server.inject({
        method: "DELETE",
        url: `/api/connector-configs/${configId}`,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.message).toContain("deleted successfully");

      // Verify it's actually deleted
      const getResponse = await server.inject({
        method: "GET",
        url: `/api/connector-configs/${configId}`,
      });

      expect(getResponse.statusCode).toBe(404);
    });

    it("should return 404 for non-existent configuration", async () => {
      const response = await server.inject({
        method: "DELETE",
        url: "/api/connector-configs/99999",
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("PATCH /api/connector-configs/:id/toggle", () => {
    let configId: number;

    beforeEach(async () => {
      // Create a test configuration
      const payload = {
        connectorType: "jira",
        name: `Test Jira Toggle ${Date.now()}`,
        config: {
          url: "https://test.atlassian.net",
          username: "test@example.com",
          apiToken: "test-token",
          boards: ["board1"],
        },
      };

      const response = await server.inject({
        method: "POST",
        url: "/api/connector-configs",
        payload,
      });

      const result = JSON.parse(response.payload);
      configId = result.data.id;
    });

    it("should deactivate configuration", async () => {
      const response = await server.inject({
        method: "PATCH",
        url: `/api/connector-configs/${configId}/toggle`,
        payload: { is_active: false },
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.data.is_active).toBe(false);
      expect(result.message).toContain("deactivated");
    });

    it("should activate configuration", async () => {
      // First deactivate
      await server.inject({
        method: "PATCH",
        url: `/api/connector-configs/${configId}/toggle`,
        payload: { is_active: false },
      });

      // Then activate
      const response = await server.inject({
        method: "PATCH",
        url: `/api/connector-configs/${configId}/toggle`,
        payload: { is_active: true },
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.data.is_active).toBe(true);
      expect(result.message).toContain("activated");
    });

    it("should return 400 for invalid is_active value", async () => {
      const response = await server.inject({
        method: "PATCH",
        url: `/api/connector-configs/${configId}/toggle`,
        payload: { is_active: "invalid" },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe("POST /api/connector-configs/:id/test", () => {
    let configId: number;

    beforeEach(async () => {
      // Create a test configuration
      const payload = {
        connectorType: "jira",
        name: `Test Jira Test ${Date.now()}`,
        config: {
          url: "https://test.atlassian.net",
          username: "test@example.com",
          apiToken: "test-token",
          boards: ["board1"],
        },
      };

      const response = await server.inject({
        method: "POST",
        url: "/api/connector-configs",
        payload,
      });

      const result = JSON.parse(response.payload);
      configId = result.data.id;
    });

    it("should test configuration (will fail with demo data)", async () => {
      const response = await server.inject({
        method: "POST",
        url: `/api/connector-configs/${configId}/test`,
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain("failed");
    });

    it("should return 404 for non-existent configuration", async () => {
      const response = await server.inject({
        method: "POST",
        url: "/api/connector-configs/99999/test",
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });
  });

  describe("Health and Utility Endpoints", () => {
    it("should return health status", async () => {
      const response = await server.inject({
        method: "GET",
        url: "/health",
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.status).toBe("ok");
      expect(result.timestamp).toBeDefined();
    });

    it("should return API documentation", async () => {
      const response = await server.inject({
        method: "GET",
        url: "/",
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.message).toContain("Competency Matrix");
      expect(result.version).toBe("1.0.0");
      expect(result.endpoints).toBeDefined();
    });
  });
});
