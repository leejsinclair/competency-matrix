import { exec } from "child_process";
import { Router } from "express";
import Joi from "joi";
import path from "path";
import { promisify } from "util";

const router = Router();
const execAsync = promisify(exec);

// Input validation schemas
const reprocessSchema = Joi.object({
  enableRuleEngine: Joi.boolean().default(true),
  regenerateScores: Joi.boolean().default(true),
});

const generateScoresSchema = Joi.object({}); // No parameters required

// POST /api/processing/full-reprocess - Trigger complete data reprocessing
router.post("/full-reprocess", async (_req, res) => {
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

    res.json({
      success: true,
      message: "Full data reprocessing completed successfully",
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Full reprocessing failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reprocess data",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/processing/reprocess - Trigger data reprocessing
router.post("/reprocess", async (req, res) => {
  try {
    console.log("🔄 Starting data reprocessing...");

    // Validate request body
    const { error, value } = reprocessSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: "Invalid request body",
        details: error.details,
      });
    }

    const { enableRuleEngine = true, regenerateScores = true } = value;

    // Run the data processing script
    const scriptPath = path.join(
      process.cwd(),
      "scripts/process-local-confluence.js"
    );

    try {
      const { stdout, stderr } = await execAsync(`node ${scriptPath}`);
      console.log("✅ Data processing completed:", stdout);

      if (stderr) {
        console.warn("⚠️ Processing warnings:", stderr);
      }

      // Parse results from stdout to get processed events count
      const processedEvents = parseProcessedEvents(stdout);

      return res.json({
        success: true,
        message: "Data reprocessing completed successfully",
        processedEvents,
        enableRuleEngine,
        regenerateScores,
      });
    } catch (scriptError) {
      console.error("❌ Script execution failed:", scriptError);

      // Try fallback to score generation only
      if (regenerateScores) {
        console.log("🔄 Falling back to score generation only...");
        try {
          const scoresScriptPath = path.join(
            process.cwd(),
            "scripts/generate-competency-scores.js"
          );
          const { stdout: scoresStdout } = await execAsync(
            `node ${scoresScriptPath}`
          );

          const scoresGenerated = parseScoresGenerated(scoresStdout);

          return res.json({
            success: true,
            message: "Score generation completed (data processing failed)",
            processedEvents: 0,
            scoresGenerated,
            warning: "Data processing failed, but scores were regenerated",
          });
        } catch (scoresError) {
          console.error("❌ Score generation also failed:", scoresError);
          throw scoresError;
        }
      } else {
        throw scriptError;
      }
    }
  } catch (error) {
    console.error("❌ Reprocessing failed:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to reprocess data",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/processing/generate-scores - Generate competency scores
router.post("/generate-scores", async (req, res) => {
  try {
    console.log("🔄 Generating competency scores...");

    // Validate request body
    const { error } = generateScoresSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: "Invalid request body",
        details: error.details,
      });
    }

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

    return res.json({
      success: true,
      message: "Competency scores generated successfully",
      scoresGenerated,
    });
  } catch (error) {
    console.error("❌ Score generation failed:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to generate competency scores",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/processing/status - Get processing status
router.get("/status", async (_req, res) => {
  try {
    // This could check database for last processing time, job status, etc.
    // For now, return a simple status
    return res.json({
      success: true,
      status: "ready",
      lastProcessed: new Date().toISOString(),
      availableOperations: ["reprocess", "generate-scores"],
    });
  } catch (error) {
    console.error("❌ Status check failed:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get processing status",
    });
  }
});

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

function parseProcessedEvents(stdout: string): number {
  const lines = stdout.split("\n");
  for (const line of lines) {
    if (line.includes("Processed") && line.includes("events")) {
      const match = line.match(/Processed\s+(\d+)\s+events/);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
  }
  return 0;
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

export default router;
