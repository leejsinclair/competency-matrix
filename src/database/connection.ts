import sql from "mssql";

export interface DatabaseConfig {
  server: string;
  database: string;
  user: string;
  password: string;
  options: {
    encrypt: boolean;
    trustServerCertificate: boolean;
  };
}

export type DatabasePool = sql.ConnectionPool;

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private pool: DatabasePool | null = null;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(database?: string): Promise<sql.ConnectionPool> {
    // If we already have a connection pool, reuse it
    if (this.pool) {
      // console.log("🔄 Reusing existing database connection pool");
      return this.pool;
    }

    const config: DatabaseConfig = {
      server: process.env.DB_SERVER || "localhost",
      database: database || process.env.DB_NAME || "competency_matrix",
      user: process.env.DB_USER || "sa",
      password: process.env.DB_PASSWORD || "sa-Password@01",
      options: {
        encrypt: process.env.DB_ENCRYPT === "true",
        trustServerCertificate: true,
      },
    };

    try {
      this.pool = await sql.connect(config);
      console.log(` Connected to MSSQL database: ${config.database}`);
    } catch (error) {
      console.error(" Database connection failed:", error);
      console.error("❌ Database connection failed:", error);
      throw error;
    }
    return this.pool;
  }

  public async connectToMaster(): Promise<sql.ConnectionPool> {
    return this.connect("master");
  }

  public async disconnect(): Promise<void> {
    // Don't disconnect the pool - keep it alive for reuse
    // This prevents connection closing issues between requests
    // console.log("🔄 Keeping database connection pool alive for reuse");
    // Only disconnect on application shutdown, not after each request
  }

  public async query(query: string, params?: any[]): Promise<any> {
    const pool = await this.connect();
    const request = pool.request();

    if (params) {
      params.forEach((param, index) => {
        request.input(`param${index}`, param);
      });
    }

    try {
      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      console.error("Query execution failed:", error);
      throw error;
    }
  }
}

export default DatabaseConnection.getInstance();
