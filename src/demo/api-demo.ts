import axios, { AxiosInstance } from "axios";

const API_BASE_URL = "http://localhost:3000";

export class ApiDemo {
  private client: AxiosInstance;

  constructor(baseUrl: string = API_BASE_URL) {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });
  }

  async runDemo(): Promise<void> {
    console.log(
      "🚀 Starting API Demo for Connector Configuration CRUD Operations\n"
    );

    try {
      // Test health endpoint
      await this.testHealth();

      // Test CRUD operations for each connector type
      await this.testJiraConfig();
      await this.testConfluenceConfig();
      await this.testBitbucketConfig();

      // Test listing operations
      await this.testListingOperations();

      console.log("\n✅ API Demo completed successfully!");
    } catch (error) {
      console.error("\n❌ API Demo failed:", error);
      throw error;
    }
  }

  private async testHealth(): Promise<void> {
    console.log("🏥 Testing health endpoint...");

    try {
      const response = await this.client.get("/health");
      console.log("✅ Health check passed:", response.data);
    } catch (error) {
      throw new Error("Health check failed");
    }
  }

  private async testJiraConfig(): Promise<void> {
    console.log("\n📋 Testing Jira Configuration CRUD...");

    // Create Jira config
    const jiraConfig = {
      connectorType: "jira" as const,
      name: `Demo Jira Config ${Date.now()}`,
      config: {
        url: "https://demo.atlassian.net",
        username: "demo@example.com",
        apiToken: "demo-token",
        boards: ["board1", "board2"],
      },
    };

    console.log("  Creating Jira config...");
    const createResponse = await this.client.post(
      "/api/connector-configs",
      jiraConfig
    );
    const jiraConfigId = createResponse.data.data.id;
    console.log(`  ✅ Created Jira config with ID: ${jiraConfigId}`);

    // Get Jira config
    console.log("  Retrieving Jira config...");
    await this.client.get(`/api/connector-configs/${jiraConfigId}`);
    console.log("  ✅ Retrieved Jira config");

    // Update Jira config
    console.log("  Updating Jira config...");
    await this.client.put(`/api/connector-configs/${jiraConfigId}`, {
      name: "Updated Jira Config",
      config: {
        ...jiraConfig.config,
        boards: ["board1", "board2", "board3"],
      },
    });
    console.log("  ✅ Updated Jira config");

    // Test Jira config (will likely fail with demo data, but that's expected)
    console.log("  Testing Jira config...");
    try {
      await this.client.post(`/api/connector-configs/${jiraConfigId}/test`);
      console.log("  ✅ Jira config test passed");
    } catch (error) {
      console.log("  ⚠️  Jira config test failed (expected with demo data)");
    }

    // Toggle Jira config
    console.log("  Toggling Jira config...");
    await this.client.patch(`/api/connector-configs/${jiraConfigId}/toggle`, {
      is_active: false,
    });
    console.log("  ✅ Deactivated Jira config");

    // Delete Jira config
    console.log("  Deleting Jira config...");
    await this.client.delete(`/api/connector-configs/${jiraConfigId}`);
    console.log("  ✅ Deleted Jira config");
  }

  private async testConfluenceConfig(): Promise<void> {
    console.log("\n📄 Testing Confluence Configuration CRUD...");

    const confluenceConfig = {
      connectorType: "confluence" as const,
      name: `Demo Confluence Config ${Date.now()}`,
      config: {
        baseUrl: "https://demo.atlassian.net/wiki",
        username: "demo@example.com",
        apiToken: "demo-token",
        spaces: ["space1", "space2"],
      },
    };

    console.log("  Creating Confluence config...");
    const createResponse = await this.client.post(
      "/api/connector-configs",
      confluenceConfig
    );
    const confluenceConfigId = createResponse.data.data.id;
    console.log(
      `  ✅ Created Confluence config with ID: ${confluenceConfigId}`
    );

    console.log("  Retrieving Confluence config...");
    await this.client.get(`/api/connector-configs/${confluenceConfigId}`);
    console.log("  ✅ Retrieved Confluence config");

    console.log("  Deleting Confluence config...");
    await this.client.delete(`/api/connector-configs/${confluenceConfigId}`);
    console.log("  ✅ Deleted Confluence config");
  }

  private async testBitbucketConfig(): Promise<void> {
    console.log("\n🔧 Testing Bitbucket Configuration CRUD...");

    const bitbucketConfig = {
      connectorType: "bitbucket" as const,
      name: `Demo Bitbucket Config ${Date.now()}`,
      config: {
        baseUrl: "https://api.bitbucket.org/2.0",
        username: "demo-user",
        appPassword: "demo-password",
        workspaces: ["workspace1"],
        repositories: ["repo1", "repo2"],
      },
    };

    console.log("  Creating Bitbucket config...");
    const createResponse = await this.client.post(
      "/api/connector-configs",
      bitbucketConfig
    );
    const bitbucketConfigId = createResponse.data.data.id;
    console.log(`  ✅ Created Bitbucket config with ID: ${bitbucketConfigId}`);

    console.log("  Retrieving Bitbucket config...");
    await this.client.get(`/api/connector-configs/${bitbucketConfigId}`);
    console.log("  ✅ Retrieved Bitbucket config");

    console.log("  Deleting Bitbucket config...");
    await this.client.delete(`/api/connector-configs/${bitbucketConfigId}`);
    console.log("  ✅ Deleted Bitbucket config");
  }

  private async testListingOperations(): Promise<void> {
    console.log("\n📊 Testing Listing Operations...");

    // Create some test configs first
    const jiraConfig = {
      connectorType: "jira" as const,
      name: `Test Jira Config ${Date.now()}`,
      config: {
        url: "https://test.atlassian.net",
        username: "test@example.com",
        apiToken: "test-token",
        boards: ["test-board"],
      },
    };

    const confluenceConfig = {
      connectorType: "confluence" as const,
      name: `Test Confluence Config ${Date.now()}`,
      config: {
        baseUrl: "https://test.atlassian.net/wiki",
        username: "test@example.com",
        apiToken: "test-token",
        spaces: ["test-space"],
      },
    };

    console.log("  Creating test configs...");
    const jiraResponse = await this.client.post(
      "/api/connector-configs",
      jiraConfig
    );
    const confluenceResponse = await this.client.post(
      "/api/connector-configs",
      confluenceConfig
    );

    console.log("  Getting all configs...");
    const allConfigsResponse = await this.client.get("/api/connector-configs");
    console.log(
      `  ✅ Retrieved ${allConfigsResponse.data.count} total configs`
    );

    console.log("  Getting Jira configs...");
    const jiraConfigsResponse = await this.client.get(
      "/api/connector-configs/type/jira"
    );
    console.log(
      `  ✅ Retrieved ${jiraConfigsResponse.data.count} Jira configs`
    );

    console.log("  Getting Confluence configs...");
    const confluenceConfigsResponse = await this.client.get(
      "/api/connector-configs/type/confluence"
    );
    console.log(
      `  ✅ Retrieved ${confluenceConfigsResponse.data.count} Confluence configs`
    );

    // Cleanup test configs
    console.log("  Cleaning up test configs...");
    await this.client.delete(
      `/api/connector-configs/${jiraResponse.data.data.id}`
    );
    await this.client.delete(
      `/api/connector-configs/${confluenceResponse.data.data.id}`
    );
    console.log("  ✅ Cleaned up test configs");
  }

  async testErrorHandling(): Promise<void> {
    console.log("\n🚨 Testing Error Handling...");

    // Test invalid ID
    try {
      await this.client.get("/api/connector-configs/99999");
      console.log("  ❌ Should have failed for invalid ID");
    } catch (error) {
      console.log("  ✅ Correctly handled invalid ID");
    }

    // Test invalid connector type
    try {
      await this.client.post("/api/connector-configs", {
        connectorType: "invalid",
        name: "Test",
        config: {},
      });
      console.log("  ❌ Should have failed for invalid connector type");
    } catch (error) {
      console.log("  ✅ Correctly handled invalid connector type");
    }

    // Test missing required fields
    try {
      await this.client.post("/api/connector-configs", {
        connectorType: "jira",
        name: "Test",
        // Missing config
      });
      console.log("  ❌ Should have failed for missing fields");
    } catch (error) {
      console.log("  ✅ Correctly handled missing fields");
    }
  }
}

// CLI interface
async function main() {
  const demo = new ApiDemo();

  const args = process.argv.slice(2);

  if (args.includes("--test-errors")) {
    await demo.testErrorHandling();
  } else {
    await demo.runDemo();
  }
}

// Run demo if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error("API Demo failed:", error);
    process.exit(1);
  });
}

export default ApiDemo;
