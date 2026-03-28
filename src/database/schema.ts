import DatabaseConnection from "./connection";

export class DatabaseSchema {
  private db = DatabaseConnection;

  async initializeSchema(): Promise<void> {
    try {
      // First, ensure the database exists
      await this.ensureDatabaseExists();

      // Then connect to the target database and create schema
      await this.createTables();

      console.log("Database schema initialized successfully");
    } catch (error) {
      console.error("Failed to initialize database schema:", error);
      throw error;
    }
  }

  private async ensureDatabaseExists(): Promise<void> {
    const dbName = process.env.DB_NAME || "competency_matrix";

    try {
      // Connect to master database first
      const masterPool = await this.db.connectToMaster();

      // Check if database exists
      const checkQuery = `
        SELECT name FROM sys.databases 
        WHERE name = '${dbName}'
      `;

      const result = await masterPool.request().query(checkQuery);

      if (result.recordset.length === 0) {
        // Create the database
        console.log(`Creating database: ${dbName}`);
        const createQuery = `CREATE DATABASE [${dbName}]`;
        await masterPool.request().query(createQuery);
        console.log(`Database created: ${dbName}`);
      } else {
        console.log(`Database already exists: ${dbName}`);
      }

      // Disconnect from master
      await this.db.disconnect();
    } catch (error) {
      console.error("Failed to ensure database exists:", error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    // Now connect to the target database
    await this.db.connect();

    // Create connector configurations table
    await this.createConnectorConfigTable();

    // Create activity events table
    await this.createActivityEventsTable();

    // Create processed artifacts table
    await this.createArtifactsTable();

    // Create competency scores table
    await this.createCompetencyScoresTable();

    // Create reports table
    await this.createReportsTable();

    // Create self_evaluations table
    await this.createSelfEvaluationsTable();

    // Create performance indexes
    await this.createIndexes();
  }

  private async createConnectorConfigTable(): Promise<void> {
    const query = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='connector_configs' AND xtype='U')
      CREATE TABLE connector_configs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        connector_type NVARCHAR(50) NOT NULL,
        name NVARCHAR(100) NOT NULL,
        config NVARCHAR(MAX) NOT NULL,
        is_active BIT DEFAULT 1,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        UNIQUE(connector_type, name)
      );
    `;
    await this.db.query(query);
  }

  private async createActivityEventsTable(): Promise<void> {
    const query = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='activity_events' AND xtype='U')
      CREATE TABLE activity_events (
        id NVARCHAR(100) PRIMARY KEY,
        source NVARCHAR(50) NOT NULL,
        timestamp DATETIME2 NOT NULL,
        actor NVARCHAR(255) NOT NULL,
        type NVARCHAR(100) NOT NULL,
        metadata NVARCHAR(MAX),
        content NVARCHAR(MAX),
        created_at DATETIME2 DEFAULT GETDATE()
      );
    `;
    await this.db.query(query);

    // Create indexes separately
    const indexQueries = [
      `CREATE INDEX idx_activity_events_source ON activity_events(source)`,
      `CREATE INDEX idx_activity_events_timestamp ON activity_events(timestamp)`,
      `CREATE INDEX idx_activity_events_actor ON activity_events(actor)`,
    ];

    for (const indexQuery of indexQueries) {
      try {
        await this.db.query(indexQuery);
      } catch (error) {
        // Ignore index creation errors if they already exist
        console.log("Index creation warning (may already exist):", error);
      }
    }
  }

  private async createArtifactsTable(): Promise<void> {
    const query = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='artifacts' AND xtype='U')
      CREATE TABLE artifacts (
        id NVARCHAR(100) PRIMARY KEY,
        type NVARCHAR(50) NOT NULL,
        content NVARCHAR(MAX) NOT NULL,
        metadata NVARCHAR(MAX),
        source NVARCHAR(50) NOT NULL,
        created_at DATETIME2 DEFAULT GETDATE()
      );
    `;
    await this.db.query(query);

    // Create indexes separately
    const indexQueries = [
      `CREATE INDEX idx_artifacts_type ON artifacts(type)`,
      `CREATE INDEX idx_artifacts_source ON artifacts(source)`,
    ];

    for (const indexQuery of indexQueries) {
      try {
        await this.db.query(indexQuery);
      } catch (error) {
        // Ignore index creation errors if they already exist
        console.log("Index creation warning (may already exist):", error);
      }
    }
  }

  private async createCompetencyScoresTable(): Promise<void> {
    const query = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='competency_scores' AND xtype='U')
      CREATE TABLE competency_scores (
        id INT IDENTITY(1,1) PRIMARY KEY,
        connector_id INT NOT NULL,
        competency_category NVARCHAR(100) NOT NULL,
        competency_row NVARCHAR(200) NOT NULL,
        actor NVARCHAR(255) NOT NULL,
        level INT NOT NULL,
        confidence DECIMAL(5,2) NOT NULL,
        evidence_count INT DEFAULT 0,
        last_updated DATETIME2 DEFAULT GETDATE()
      );
    `;
    await this.db.query(query);
  }

  private async createReportsTable(): Promise<void> {
    const query = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='reports' AND xtype='U')
      CREATE TABLE reports (
        id INT IDENTITY(1,1) PRIMARY KEY,
        developer_id NVARCHAR(255) NOT NULL,
        report_type NVARCHAR(50) NOT NULL,
        title NVARCHAR(200) NOT NULL,
        content NVARCHAR(MAX) NOT NULL,
        format NVARCHAR(20) DEFAULT 'json',
        generated_at DATETIME2 DEFAULT GETDATE(),
        metadata NVARCHAR(MAX)
      );
    `;
    await this.db.query(query);
  }

  private async createSelfEvaluationsTable(): Promise<void> {
    const query = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='self_evaluations' AND xtype='U')
      CREATE TABLE self_evaluations (
        id INT IDENTITY(1,1) PRIMARY KEY,
        developer_id NVARCHAR(255) NOT NULL,
        competency_category NVARCHAR(100) NOT NULL,
        competency_row NVARCHAR(200) NOT NULL,
        self_level INT NOT NULL,
        self_confidence DECIMAL(5,2) NOT NULL,
        evidence TEXT,
        submitted_at DATETIME2 DEFAULT GETDATE(),
        metadata NVARCHAR(MAX)
      );
    `;
    await this.db.query(query);
  }

  // Create indexes for performance
  private async createIndexes(): Promise<void> {
    const indexQueries = [
      `CREATE INDEX idx_competency_scores_actor ON competency_scores(actor)`,
      `CREATE INDEX idx_competency_scores_category ON competency_scores(competency_category)`,
      `CREATE INDEX idx_reports_developer ON reports(developer_id)`,
      `CREATE INDEX idx_self_evaluations_developer ON self_evaluations(developer_id)`,
      `CREATE INDEX idx_artifacts_type ON artifacts(type)`,
      `CREATE INDEX idx_artifacts_source ON artifacts(source)`,
    ];

    for (const indexQuery of indexQueries) {
      try {
        await this.db.query(indexQuery);
      } catch (error) {
        // Ignore index creation errors if they already exist
        console.log("Index creation warning (may already exist):", error);
      }
    }
  }
}

export default DatabaseSchema;
