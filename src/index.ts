import { ApiServer } from "./api/server";

// Start the API server
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
