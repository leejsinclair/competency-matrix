import { FastifyReply, FastifyRequest } from "fastify";
import {
  ConnectorConfigService,
  CreateConnectorConfigRequest,
  UpdateConnectorConfigRequest,
} from "../services/connector-config-service";

export interface ConnectorConfigRoutes {
  createConnectorConfig: (
    request: FastifyRequest,
    reply: FastifyReply
  ) => Promise<void>;
  getConnectorConfig: (
    request: FastifyRequest,
    reply: FastifyReply
  ) => Promise<void>;
  getConnectorConfigsByType: (
    request: FastifyRequest,
    reply: FastifyReply
  ) => Promise<void>;
  getAllConnectorConfigs: (
    request: FastifyRequest,
    reply: FastifyReply
  ) => Promise<void>;
  updateConnectorConfig: (
    request: FastifyRequest,
    reply: FastifyReply
  ) => Promise<void>;
  deleteConnectorConfig: (
    request: FastifyRequest,
    reply: FastifyReply
  ) => Promise<void>;
  toggleConnectorConfig: (
    request: FastifyRequest,
    reply: FastifyReply
  ) => Promise<void>;
  testConnectorConfig: (
    request: FastifyRequest,
    reply: FastifyReply
  ) => Promise<void>;
}

export class ConnectorConfigController {
  private service: ConnectorConfigService;

  constructor() {
    this.service = new ConnectorConfigService();
  }

  // POST /api/connector-configs
  createConnectorConfig = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const body = request.body as CreateConnectorConfigRequest;

      // Validate required fields
      if (!body.connectorType || !body.name || !body.config) {
        return reply.status(400).send({
          error: "Missing required fields: connectorType, name, config",
        });
      }

      const config = await this.service.createConnectorConfig(body);

      return reply.status(201).send({
        success: true,
        data: config,
        message: "Connector configuration created successfully",
      });
    } catch (error) {
      console.error(
        "Failed to create connector config:",
        (error as Error).message
      );

      return reply.status(400).send({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create connector configuration",
      });
    }
  };

  // GET /api/connector-configs/:id
  getConnectorConfig = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const configId = parseInt(id, 10);

      if (isNaN(configId)) {
        return reply.status(400).send({
          error: "Invalid connector configuration ID",
        });
      }

      const config = await this.service.getConnectorConfig(configId);

      if (!config) {
        return reply.status(404).send({
          error: "Connector configuration not found",
        });
      }

      return reply.send({
        success: true,
        data: config,
      });
    } catch (error) {
      console.error("Failed to get connector config:", error);

      return reply.status(500).send({
        success: false,
        error: "Failed to retrieve connector configuration",
      });
    }
  };

  // GET /api/connector-configs/type/:connectorType
  getConnectorConfigsByType = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const { connectorType } = request.params as { connectorType: string };

      if (!["jira", "confluence", "bitbucket"].includes(connectorType)) {
        return reply.status(400).send({
          error:
            "Invalid connector type. Must be one of: jira, confluence, bitbucket",
        });
      }

      const configs =
        await this.service.getConnectorConfigsByType(connectorType);

      return reply.send({
        success: true,
        data: configs,
        count: configs.length,
      });
    } catch (error) {
      console.error("Failed to get connector configs by type:", error);

      return reply.status(500).send({
        success: false,
        error: "Failed to retrieve connector configurations",
      });
    }
  };

  // GET /api/connector-configs
  getAllConnectorConfigs = async (
    _request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const configs = await this.service.getAllConnectorConfigs();

      return reply.send({
        success: true,
        data: configs,
        count: configs.length,
      });
    } catch (error) {
      console.error("Failed to get all connector configs:", error);

      return reply.status(500).send({
        success: false,
        error: "Failed to retrieve connector configurations",
      });
    }
  };

  // PUT /api/connector-configs/:id
  updateConnectorConfig = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as UpdateConnectorConfigRequest;
      const configId = parseInt(id, 10);

      if (isNaN(configId)) {
        return reply.status(400).send({
          error: "Invalid connector configuration ID",
        });
      }

      if (Object.keys(body).length === 0) {
        return reply.status(400).send({
          error: "No update fields provided",
        });
      }

      const config = await this.service.updateConnectorConfig(configId, body);

      return reply.send({
        success: true,
        data: config,
        message: "Connector configuration updated successfully",
      });
    } catch (error) {
      console.error(
        "Failed to update connector config:",
        (error as Error).message
      );

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.status(404).send({
          success: false,
          error: error.message,
        });
      }

      return reply.status(400).send({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update connector configuration",
      });
    }
  };

  // DELETE /api/connector-configs/:id
  deleteConnectorConfig = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const { id } = request.params as { id: string };
      const configId = parseInt(id, 10);

      if (isNaN(configId)) {
        return reply.status(400).send({
          error: "Invalid connector configuration ID",
        });
      }

      // Check if config exists before deleting
      const existingConfig = await this.service.getConnectorConfig(configId);
      if (!existingConfig) {
        return reply.status(404).send({
          error: "Connector configuration not found",
        });
      }

      await this.service.deleteConnectorConfig(configId);

      return reply.send({
        success: true,
        message: "Connector configuration deleted successfully",
      });
    } catch (error) {
      console.error(
        "Failed to delete connector config:",
        (error as Error).message
      );

      return reply.status(500).send({
        success: false,
        error: "Failed to delete connector configuration",
      });
    }
  };

  // PATCH /api/connector-configs/:id/toggle
  toggleConnectorConfig = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const { id } = request.params as { id: string };
      const { is_active } = request.body as { is_active: boolean };
      const configId = parseInt(id, 10);

      if (isNaN(configId)) {
        return reply.status(400).send({
          error: "Invalid connector configuration ID",
        });
      }

      if (typeof is_active !== "boolean") {
        return reply.status(400).send({
          error: "is_active must be a boolean value",
        });
      }

      const config = await this.service.toggleConnectorConfig(
        configId,
        is_active
      );

      return reply.send({
        success: true,
        data: config,
        message: `Connector configuration ${is_active ? "activated" : "deactivated"} successfully`,
      });
    } catch (error) {
      console.error(
        "Failed to toggle connector config:",
        (error as Error).message
      );

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.status(404).send({
          success: false,
          error: error.message,
        });
      }

      return reply.status(500).send({
        success: false,
        error: "Failed to toggle connector configuration",
      });
    }
  };

  // POST /api/connector-configs/:id/test
  testConnectorConfig = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const { id } = request.params as { id: string };
      const configId = parseInt(id, 10);

      if (isNaN(configId)) {
        return reply.status(400).send({
          error: "Invalid connector configuration ID",
        });
      }

      const result = await this.service.testConnectorConfig(configId);

      if (result.success) {
        return reply.send({
          success: true,
          message: "Connector configuration test successful",
        });
      } else {
        return reply.status(400).send({
          success: false,
          error: result.error || "Connector configuration test failed",
        });
      }
    } catch (error) {
      console.error(
        "Failed to test connector config:",
        (error as Error).message
      );

      return reply.status(500).send({
        success: false,
        error: "Failed to test connector configuration",
      });
    }
  };
}

export function registerConnectorConfigRoutes(
  server: any,
  controller: ConnectorConfigController
) {
  // Create connector configuration
  server.post(
    "/api/connector-configs",
    {
      schema: {
        body: {
          type: "object",
          required: ["connectorType", "name", "config"],
          properties: {
            connectorType: {
              type: "string",
              enum: ["jira", "confluence", "bitbucket"],
            },
            name: { type: "string", minLength: 1, maxLength: 100 },
            config: { type: "object" },
          },
        },
      },
    },
    controller.createConnectorConfig
  );

  // Get specific connector configuration
  server.get(
    "/api/connector-configs/:id",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            id: { type: "string", pattern: "^\\d+$" },
          },
          required: ["id"],
        },
      },
    },
    controller.getConnectorConfig
  );

  // Get connector configurations by type
  server.get(
    "/api/connector-configs/type/:connectorType",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            connectorType: {
              type: "string",
              enum: ["jira", "confluence", "bitbucket"],
            },
          },
          required: ["connectorType"],
        },
      },
    },
    controller.getConnectorConfigsByType
  );

  // Get all connector configurations
  server.get("/api/connector-configs", controller.getAllConnectorConfigs);

  // Update connector configuration
  server.put(
    "/api/connector-configs/:id",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            id: { type: "string", pattern: "^\\d+$" },
          },
          required: ["id"],
        },
        body: {
          type: "object",
          minProperties: 1,
          properties: {
            name: { type: "string", minLength: 1, maxLength: 100 },
            config: { type: "object" },
            is_active: { type: "boolean" },
          },
          additionalProperties: true, // Allow partial updates
        },
      },
    },
    controller.updateConnectorConfig
  );

  // Delete connector configuration
  server.delete(
    "/api/connector-configs/:id",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            id: { type: "string", pattern: "^\\d+$" },
          },
          required: ["id"],
        },
      },
    },
    controller.deleteConnectorConfig
  );

  // Toggle connector configuration active status
  server.patch(
    "/api/connector-configs/:id/toggle",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            id: { type: "string", pattern: "^\\d+$" },
          },
          required: ["id"],
        },
        body: {
          type: "object",
          required: ["is_active"],
          properties: {
            is_active: { type: "boolean" },
          },
          additionalProperties: false,
        },
      },
    },
    controller.toggleConnectorConfig
  );

  // Test connector configuration
  server.post(
    "/api/connector-configs/:id/test",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            id: { type: "string", pattern: "^\\d+$" },
          },
          required: ["id"],
        },
      },
    },
    controller.testConnectorConfig
  );
}

export default ConnectorConfigController;
