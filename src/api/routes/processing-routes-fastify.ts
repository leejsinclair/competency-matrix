import { exec } from "child_process";
import { FastifyInstance } from "fastify";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function processingRoutes(fastify: FastifyInstance) {
  // POST /api/processing/full-reprocess - Trigger complete data reprocessing
  fastify.post("/full-reprocess", async () => {
    try {
      console.log("🚀 Starting FULL data reprocessing...");

      // Run the full processing script
      const scriptPath = path.join(process.cwd(), "scripts/full-processing.js");

      const { stdout, stderr } = await execAsync(`node ${scriptPath}`);
      console.log("✅ Full processing completed:", stdout);

      if (stderr) {
        console.warn("⚠️ Processing warnings:", stderr);
      }

      // Parse results from stdout
      const results = parseFullProcessingResults(stdout);

      return {
        success: true,
        message: "Full data reprocessing completed successfully",
        results,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ Full reprocessing failed:", error);
      throw {
        statusCode: 500,
        error: "Failed to reprocess data",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  // POST /api/processing/generate-scores - Generate competency scores
  fastify.post("/generate-scores", async () => {
    try {
      console.log("🔄 Generating competency scores...");

      // Run the score generation script
      const scriptPath = path.join(
        process.cwd(),
        "scripts/generate-competency-scores.js"
      );

      const { stdout, stderr } = await execAsync(`node ${scriptPath}`);
      console.log("✅ Score generation completed:", stdout);

      if (stderr) {
        console.warn("⚠️ Score generation warnings:", stderr);
      }

      const scoresGenerated = parseScoresGenerated(stdout);

      return {
        success: true,
        message: "Competency scores generated successfully",
        scoresGenerated,
      };
    } catch (error) {
      console.error("❌ Score generation failed:", error);
      throw {
        statusCode: 500,
        error: "Failed to generate competency scores",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  // GET /api/processing/status - Get processing status
  fastify.get("/status", async () => {
    try {
      // This could check database for last processing time, job status, etc.
      // For now, return a simple status
      return {
        success: true,
        status: "ready",
        lastProcessed: new Date().toISOString(),
        availableOperations: ["full-reprocess", "generate-scores"],
      };
    } catch (error) {
      console.error("❌ Status check failed:", error);
      throw {
        statusCode: 500,
        error: "Failed to get processing status",
      };
    }
  });
}

// Helper functions to parse script output
function parseFullProcessingResults(stdout: string): any {
  const lines = stdout.split("\n");
  const results: any = {
    duration: 0,
    developers: 0,
    scores: 0,
    categories: 0,
    achievements: 0,
  };

  for (const line of lines) {
    if (line.includes("Total Duration:")) {
      const match = line.match(/Total Duration:\s+([\d.]+)\s+seconds/);
      if (match) results.duration = parseFloat(match[1]);
    }
    if (line.includes("Developers with scores:")) {
      const match = line.match(/Developers with scores:\s+(\d+)/);
      if (match) results.developers = parseInt(match[1]);
    }
    if (line.includes("Scores Inserted:")) {
      const match = line.match(/Scores Inserted:\s+(\d+)/);
      if (match) results.scores = parseInt(match[1]);
    }
    if (line.includes("Categories:")) {
      const match = line.match(/Categories:\s+(\d+)/);
      if (match) results.categories = parseInt(match[1]);
    }
  }

  return results;
}

function parseScoresGenerated(stdout: string): number {
  const lines = stdout.split("\n");
  for (const line of lines) {
    if (line.includes("Generated") && line.includes("competency scores")) {
      const match = line.match(/Generated\s+(\d+)\s+competency\s+scores/);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
  }
  return 0;
}
