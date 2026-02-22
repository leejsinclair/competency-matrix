import dotenv from "dotenv";
import DatabaseConnection from "../src/database/connection";
import { DatabaseSchema } from "../src/database/schema";

// Load environment variables
dotenv.config();

export class DatabaseInitializer {
  async initialize(): Promise<void> {
    console.log("🗄️  Initializing database...");

    try {
      // Initialize schema (this will create the database if it doesn't exist)
      console.log("� Creating database and schema...");
      const schema = new DatabaseSchema();
      await schema.initializeSchema();
      console.log("✅ Database and schema created successfully");

      // Test database connection to the target database
      console.log("� Testing database connection...");
      const db = DatabaseConnection;
      await db.connect();
      console.log("✅ Database connection successful");

      // Test basic operations
      console.log("🧪 Testing database operations...");
      await this.testBasicOperations();
      console.log("✅ Database operations test passed");

      console.log("\n🎉 Database initialization completed successfully!");
    } catch (error) {
      console.error("\n❌ Database initialization failed:", error);
      throw error;
    } finally {
      // Close connection
      await DatabaseConnection.disconnect();
    }
  }

  private async testBasicOperations(): Promise<void> {
    const db = DatabaseConnection;

    // Test inserting a connector config
    await db.query(`
      INSERT INTO connector_configs (connector_type, name, config, is_active)
      VALUES ('test', 'demo-config', '{"test": true}', 1)
    `);

    // Test retrieving the config
    const result = await db.query(
      "SELECT * FROM connector_configs WHERE connector_type = 'test'"
    );

    if (result.length === 0) {
      throw new Error("Failed to retrieve inserted test data");
    }

    // Clean up test data
    await db.query(
      "DELETE FROM connector_configs WHERE connector_type = 'test'"
    );
  }

  async reset(): Promise<void> {
    console.log("🔄 Resetting database...");

    try {
      const db = DatabaseConnection;
      await db.connect();

      // Drop all tables
      console.log("🗑️  Dropping existing tables...");
      await db.query("DROP TABLE IF EXISTS artifacts");
      await db.query("DROP TABLE IF EXISTS activity_events");
      await db.query("DROP TABLE IF EXISTS connector_configs");

      // Recreate schema
      console.log("📋 Recreating database schema...");
      const schema = new DatabaseSchema();
      await schema.initializeSchema();

      console.log("✅ Database reset completed successfully!");
    } catch (error) {
      console.error("❌ Database reset failed:", error);
      throw error;
    } finally {
      await DatabaseConnection.disconnect();
    }
  }

  async status(): Promise<void> {
    console.log("📊 Database Status Check");
    console.log("=====================");

    try {
      const db = DatabaseConnection;
      await db.connect();

      // Check if tables exist
      const tables = await db.query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE = 'BASE TABLE' 
        AND TABLE_CATALOG = DB_NAME()
      `);

      console.log("Tables:");
      if (tables.length === 0) {
        console.log("  ❌ No tables found");
      } else {
        tables.forEach((table: any) => {
          console.log(`  ✅ ${table.TABLE_NAME}`);
        });
      }

      // Check connector configs
      try {
        const configs = await db.query(
          "SELECT COUNT(*) as count FROM connector_configs"
        );
        console.log(`\nConnector Configs: ${configs[0].count}`);
      } catch (error) {
        console.log("\nConnector Configs: Table does not exist");
      }

      // Check activity events
      try {
        const events = await db.query(
          "SELECT COUNT(*) as count FROM activity_events"
        );
        console.log(`Activity Events: ${events[0].count}`);
      } catch (error) {
        console.log("Activity Events: Table does not exist");
      }

      // Check artifacts
      try {
        const artifacts = await db.query(
          "SELECT COUNT(*) as count FROM artifacts"
        );
        console.log(`Artifacts: ${artifacts[0].count}`);
      } catch (error) {
        console.log("Artifacts: Table does not exist");
      }
    } catch (error) {
      console.error("❌ Database status check failed:", error);
      throw error;
    } finally {
      await DatabaseConnection.disconnect();
    }
  }
}

// CLI interface
async function main() {
  const initializer = new DatabaseInitializer();
  const command = process.argv[2];

  switch (command) {
    case "init":
      await initializer.initialize();
      break;

    case "reset":
      await initializer.reset();
      break;

    case "status":
      await initializer.status();
      break;

    default:
      console.log("Usage:");
      console.log("  npm run db init    - Initialize database");
      console.log("  npm run db reset   - Reset database (drop and recreate)");
      console.log("  npm run db status  - Check database status");
      process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error("Database operation failed:", error);
    process.exit(1);
  });
}

export default DatabaseInitializer;
