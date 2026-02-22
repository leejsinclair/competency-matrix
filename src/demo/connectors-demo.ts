import dotenv from "dotenv";
import { DatabaseSchema } from "../database/schema";
import { UnifiedConnector } from "../retrieval/unified-connector";
import { ArtifactStore } from "../types/artifact";

// Load environment variables
dotenv.config();

export class ConnectorsDemo {
  private unifiedConnector: UnifiedConnector;
  private artifactStore: ArtifactStore;

  constructor(artifactStore: ArtifactStore) {
    this.artifactStore = artifactStore;
    this.unifiedConnector = new UnifiedConnector(this.artifactStore);
  }

  async runDemo(): Promise<void> {
    console.log("🚀 Starting Connectors Demo\n");

    try {
      // Step 1: Initialize database schema
      await this.initializeDatabase();

      // Step 2: Initialize connectors
      await this.initializeConnectors();

      // Step 3: Test connections
      await this.testConnections();

      // Step 4: Show configuration status
      await this.showConfigurationStatus();

      // Step 5: Retrieve data from available sources
      await this.retrieveData();

      console.log("\n✅ Demo completed successfully!");
    } catch (error) {
      console.error("\n❌ Demo failed:", error);
      throw error;
    }
  }

  private async initializeDatabase(): Promise<void> {
    console.log("📊 Initializing database schema...");

    try {
      const schema = new DatabaseSchema();
      await schema.initializeSchema();
      console.log("✅ Database schema initialized\n");
    } catch (error) {
      console.log(
        "⚠️  Database initialization failed (continuing without database):",
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  private async initializeConnectors(): Promise<void> {
    console.log("🔌 Initializing connectors...");

    await this.unifiedConnector.initialize();

    const availableSources = await this.unifiedConnector.getAvailableSources();
    console.log(
      `✅ Connectors initialized. Available sources: ${availableSources.join(", ")}\n`
    );
  }

  private async testConnections(): Promise<void> {
    console.log("🔍 Testing connections...");

    const connectionTests = await this.unifiedConnector.testConnections();

    console.log("Connection Test Results:");
    console.log(
      `  Jira: ${connectionTests.jira ? "✅ Connected" : "❌ Failed"}`
    );
    console.log(
      `  Confluence: ${connectionTests.confluence ? "✅ Connected" : "❌ Failed"}`
    );
    console.log(
      `  Bitbucket: ${connectionTests.bitbucket ? "✅ Connected" : "❌ Failed"}\n`
    );
  }

  private async showConfigurationStatus(): Promise<void> {
    console.log("⚙️  Configuration Status:");

    const status = await this.unifiedConnector.getConfigurationStatus();

    console.log("Jira:");
    console.log(`  Configured: ${status.jira.configured ? "✅" : "❌"}`);
    console.log(`  Boards: ${status.jira.boards.join(", ") || "None"}`);
    console.log(`  Connected: ${status.jira.connected ? "✅" : "❌"}`);

    console.log("Confluence:");
    console.log(`  Configured: ${status.confluence.configured ? "✅" : "❌"}`);
    console.log(`  Spaces: ${status.confluence.spaces.join(", ") || "None"}`);
    console.log(`  Connected: ${status.confluence.connected ? "✅" : "❌"}`);

    console.log("Bitbucket:");
    console.log(`  Configured: ${status.bitbucket.configured ? "✅" : "❌"}`);
    console.log(
      `  Repositories: ${status.bitbucket.repositories.join(", ") || "None"}`
    );
    console.log(`  Connected: ${status.bitbucket.connected ? "✅" : "❌"}\n`);
  }

  private async retrieveData(): Promise<void> {
    console.log("📥 Retrieving data from available sources...");

    try {
      const results = await this.unifiedConnector.retrieveAllData({
        limit: 10, // Limit to 10 events per source for demo
      });

      let totalEvents = 0;

      for (const result of results) {
        console.log(`\n${result.source.toUpperCase()}:`);
        console.log(`  Events retrieved: ${result.count}`);
        console.log(`  Duration: ${result.duration}ms`);

        if (result.errors.length > 0) {
          console.log(`  Errors: ${result.errors.join(", ")}`);
        }

        if (result.events.length > 0) {
          console.log("  Sample events:");
          result.events.slice(0, 3).forEach((event, index) => {
            console.log(
              `    ${index + 1}. ${event.type} by ${event.actor} at ${new Date(event.timestamp).toLocaleDateString()}`
            );
            console.log(
              `       Content: ${(event.content || "").substring(0, 100)}...`
            );
          });
        }

        totalEvents += result.count;
      }

      console.log(`\n📊 Total events retrieved: ${totalEvents}`);
    } catch (error) {
      console.error("❌ Data retrieval failed:", error);
    }
  }

  async testSpecificSource(
    source: "jira" | "confluence" | "bitbucket"
  ): Promise<void> {
    console.log(`🎯 Testing ${source} connector specifically...`);

    try {
      const results = await this.unifiedConnector.retrieveAllData({
        sources: [source],
        limit: 5,
      });

      const result = results[0];
      console.log(`✅ Retrieved ${result.count} events from ${source}`);

      if (result.events.length > 0) {
        console.log("Sample event:");
        const sample = result.events[0];
        console.log(`  Type: ${sample.type}`);
        console.log(`  Actor: ${sample.actor}`);
        console.log(`  Timestamp: ${sample.timestamp}`);
        console.log(
          `  Content: ${(sample.content || "").substring(0, 200)}...`
        );
      }
    } catch (error) {
      console.error(`❌ Failed to test ${source}:`, error);
    }
  }
}

// CLI interface
async function main() {
  // Create a simple artifact store for demo
  const artifactStore: ArtifactStore = {
    put: async (key: string, _data: any, _metadata?: any) => {
      console.log(`[Artifact Store] Storing: ${key}`);
    },
    get: async (key: string) => {
      console.log(`[Artifact Store] Getting: ${key}`);
      return null;
    },
    exists: async (key: string) => {
      console.log(`[Artifact Store] Checking: ${key}`);
      return false;
    },
    delete: async (key: string) => {
      console.log(`[Artifact Store] Deleting: ${key}`);
    },
    list: async (options?: any) => {
      const prefix = typeof options === "string" ? options : options?.prefix;
      console.log(`[Artifact Store] Listing: ${prefix || "all"}`);
      return { items: [], continuationToken: undefined };
    },
    getMetadata: async (key: string) => {
      console.log(`[Artifact Store] Getting metadata: ${key}`);
      return null;
    },
  };

  const demo = new ConnectorsDemo(artifactStore);

  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Run full demo
    await demo.runDemo();
  } else {
    // Run specific test
    const source = args[0] as "jira" | "confluence" | "bitbucket";

    if (["jira", "confluence", "bitbucket"].includes(source)) {
      await demo.testSpecificSource(source);
    } else {
      console.error("Invalid source. Use: jira, confluence, or bitbucket");
      process.exit(1);
    }
  }
}

// Run demo if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error("Demo failed:", error);
    process.exit(1);
  });
}

export default ConnectorsDemo;
