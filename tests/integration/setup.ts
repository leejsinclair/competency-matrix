import dotenv from "dotenv";

// Load environment variables for integration tests
dotenv.config();

// Set test environment variables
process.env.NODE_ENV = "test";
process.env.DB_SERVER = process.env.DB_SERVER || "localhost";
process.env.DB_NAME = process.env.DB_NAME || "competency_matrix";
process.env.DB_USER = process.env.DB_USER || "sa";
process.env.DB_PASSWORD = process.env.DB_PASSWORD || "sa-Password@01";
process.env.DB_ENCRYPT = process.env.DB_ENCRYPT || "false";

// Increase timeout for database operations
// Note: jest.setTimeout is available globally in Jest environment
