import { FastifyInstance } from "fastify";
import { DatabaseConnection } from "../../database/connection";

export async function matrixRoutes(fastify: FastifyInstance) {
  const db = DatabaseConnection.getInstance();

  // Get full competency matrix for all developers
  fastify.get("/api/matrix/team", async () => {
    await db.connect();

    try {
      const result = await db.query(`
        SELECT 
          actor,
          competency_category,
          competency_row,
          level,
          confidence,
          evidence_count,
          last_updated
        FROM competency_scores
        ORDER BY actor, competency_category, competency_row
      `);

      const matrixData = Array.isArray(result)
        ? result
        : result.recordset || [];

      // Group by developer
      const developers = {};
      matrixData.forEach((score) => {
        if (!developers[score.actor]) {
          developers[score.actor] = {
            actor: score.actor,
            categories: {},
            totalScores: 0,
            averageConfidence: 0,
          };
        }

        if (!developers[score.actor].categories[score.competency_category]) {
          developers[score.actor].categories[score.competency_category] = [];
        }

        developers[score.actor].categories[score.competency_category].push({
          row: score.competency_row,
          level: score.level,
          confidence: score.confidence,
          evidenceCount: score.evidence_count,
          lastUpdated: score.last_updated,
        });

        developers[score.actor].totalScores++;
      });

      // Calculate average confidence per developer
      Object.values(developers).forEach((dev: any) => {
        let totalConfidence = 0;
        let count = 0;

        Object.values(dev.categories).forEach((category: any) => {
          (category as any[]).forEach((score: any) => {
            totalConfidence += score.confidence;
            count++;
          });
        });

        dev.averageConfidence = count > 0 ? totalConfidence / count : 0;
      });

      return {
        success: true,
        data: {
          developers: Object.values(developers),
          totalDevelopers: Object.keys(developers).length,
          totalScores: matrixData.length,
          categories: [
            "containers-orchestration",
            "testing",
            "databases",
            "collaboration-process",
            "programming-languages",
          ],
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("Failed to get team matrix:", error);
      return {
        success: false,
        error: "Failed to get team matrix",
        message: (error as Error).message,
      };
    } finally {
      await db.disconnect();
    }
  });

  // Get competency matrix for specific developer
  fastify.get(
    "/api/matrix/developer/:actor",
    async (request: any, reply: any) => {
      const { actor } = request.params;
      await db.connect();

      try {
        const result = await db.query(`
        SELECT 
          competency_category,
          competency_row,
          level,
          confidence,
          evidence_count,
          last_updated
        FROM competency_scores
        WHERE actor = '${actor}'
        ORDER BY competency_category, competency_row
      `);

        const scores = Array.isArray(result) ? result : result.recordset || [];

        // Group by category
        const categories = {};
        scores.forEach((score) => {
          if (!categories[score.competency_category]) {
            categories[score.competency_category] = [];
          }

          categories[score.competency_category].push({
            row: score.competency_row,
            level: score.level,
            confidence: score.confidence,
            evidenceCount: score.evidence_count,
            lastUpdated: score.last_updated,
          });
        });

        // Calculate summary
        const totalScores = scores.length;
        const averageConfidence =
          totalScores > 0
            ? scores.reduce((sum, score) => sum + score.confidence, 0) /
              totalScores
            : 0;

        const levelDistribution = {};
        scores.forEach((score) => {
          levelDistribution[score.level] =
            (levelDistribution[score.level] || 0) + 1;
        });

        return {
          success: true,
          data: {
            actor,
            categories,
            summary: {
              totalScores,
              averageConfidence,
              levelDistribution,
            },
            generatedAt: new Date().toISOString(),
          },
        };
      } catch (error) {
        console.error("Failed to get developer matrix:", error);
        reply.code(500);
        return {
          success: false,
          error: "Failed to get developer matrix",
          message: (error as Error).message,
          actor,
        };
      } finally {
        await db.disconnect();
      }
    }
  );

  // Get matrix overview (summary statistics)
  fastify.get("/api/matrix/overview", async () => {
    await db.connect();

    try {
      const summaryResult = await db.query(`
        SELECT 
          COUNT(*) as total_scores,
          COUNT(DISTINCT actor) as total_developers,
          COUNT(DISTINCT competency_category) as total_categories,
          AVG(confidence) as avg_confidence,
          AVG(level) as avg_level
        FROM competency_scores
      `);

      const categoryBreakdown = await db.query(`
        SELECT 
          competency_category,
          COUNT(*) as score_count,
          AVG(confidence) as avg_confidence,
          AVG(level) as avg_level,
          COUNT(DISTINCT actor) as developer_count
        FROM competency_scores
        GROUP BY competency_category
        ORDER BY score_count DESC
      `);

      const levelDistribution = await db.query(`
        SELECT 
          level,
          COUNT(*) as count,
          COUNT(DISTINCT actor) as developer_count
        FROM competency_scores
        GROUP BY level
        ORDER BY level
      `);

      const summary = Array.isArray(summaryResult)
        ? summaryResult[0]
        : summaryResult.recordset?.[0];
      const categories = Array.isArray(categoryBreakdown)
        ? categoryBreakdown
        : categoryBreakdown.recordset || [];
      const levels = Array.isArray(levelDistribution)
        ? levelDistribution
        : levelDistribution.recordset || [];

      return {
        success: true,
        data: {
          summary: {
            totalScores: summary?.total_scores || 0,
            totalDevelopers: summary?.total_developers || 0,
            totalCategories: summary?.total_categories || 0,
            averageConfidence: summary?.avg_confidence || 0,
            averageLevel: summary?.avg_level || 0,
          },
          categoryBreakdown: categories,
          levelDistribution: levels,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("Failed to get matrix overview:", error);
      return {
        success: false,
        error: "Failed to get matrix overview",
        message: (error as Error).message,
      };
    }
    // Don't disconnect - keep connection pool alive for reuse
  });

  // Health check for matrix service
  fastify.get("/api/matrix/health", async () => {
    return {
      status: "healthy",
      service: "matrix-visualization",
      timestamp: new Date().toISOString(),
    };
  });
}
