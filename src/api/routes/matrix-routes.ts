import { FastifyInstance } from "fastify";
import taxonomy from "../../../taxonomy/tech-taxonomy.json";
import { DatabaseConnection } from "../../database/connection";

export async function matrixRoutes(fastify: FastifyInstance) {
  const db = DatabaseConnection.getInstance();

  // Input validation schemas

  const normalizeName = (value: string): string =>
    (value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  const getTermsForSubcategory = (subcategoryPath: string) => {
    if (!subcategoryPath) {
      return [] as Array<{ canonical: string; variants: string[] }>;
    }

    const pathParts = subcategoryPath.split(" > ").map((part) => part.trim());

    let currentNode: any = taxonomy;
    for (const pathPart of pathParts) {
      const childNode = (currentNode.children || []).find(
        (child: any) => normalizeName(child.name) === normalizeName(pathPart)
      );

      if (!childNode) {
        return [] as Array<{ canonical: string; variants: string[] }>;
      }

      currentNode = childNode;
    }

    return (currentNode.terms || []).map((term: any) => ({
      canonical: term.canonical,
      variants: term.variants || [],
    }));
  };

  fastify.get(
    "/api/matrix/taxonomy/terms",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            subcategory: { type: "string", minLength: 1, maxLength: 200 },
          },
          required: ["subcategory"],
        },
      },
    },
    async (request: any, reply: any) => {
      try {
        const { subcategory } = request.query;
        const terms = getTermsForSubcategory(subcategory);

        return {
          success: true,
          data: {
            subcategory,
            terms,
            totalTerms: terms.length,
          },
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: "Failed to resolve taxonomy terms",
          message: (error as Error).message,
        };
      }
    }
  );

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
    {
      schema: {
        params: {
          type: "object",
          properties: {
            actor: {
              type: "string",
              pattern: "^[a-zA-Z0-9._\\s-]+$",
              minLength: 1,
              maxLength: 100,
            },
          },
          required: ["actor"],
        },
      },
    },
    async (request: any, reply: any) => {
      const { actor } = request.params;
      await db.connect();

      try {
        // Get competency scores
        const scoresResult = await db.query(
          `
        SELECT 
          competency_category,
          competency_row,
          level,
          confidence,
          evidence_count,
          last_updated
        FROM competency_scores
        WHERE actor = @param0
        ORDER BY competency_category, competency_row
      `,
          [actor]
        );

        const scores = Array.isArray(scoresResult)
          ? scoresResult
          : scoresResult.recordset || [];

        // Get detailed evidence for each competency
        const evidenceResult = await db.query(
          `
        SELECT 
          cl.competency_category,
          cl.competency_row,
          cl.evidence,
          cl.confidence as label_confidence,
          e.event_id,
          e.metadata,
          e.timestamp
        FROM competency_labels cl
        JOIN events e ON cl.event_id = e.event_id
        WHERE e.actor = @param0
        ORDER BY cl.competency_category, cl.competency_row, cl.confidence DESC
        `,
          [actor]
        );

        const evidence = Array.isArray(evidenceResult)
          ? evidenceResult
          : evidenceResult.recordset || [];

        // Group by category using detailed sub-competency structure matching frontend
        const categories = {};
        scores.forEach((score) => {
          const categoryKey = score.competency_row.split(" > ")[0]; // Extract main category from full path

          // Map simplified database names to proper frontend category names
          let properCategoryName = categoryKey;
          if (categoryKey === "software-engineering") {
            properCategoryName = "Software Engineering";
          } else if (categoryKey === "devops-platform-engineering") {
            properCategoryName = "DevOps & Platform Engineering";
          } else if (categoryKey === "database-management") {
            properCategoryName = "Infrastructure & Cloud";
          } else if (categoryKey === "git-version-control") {
            properCategoryName = "Collaboration & Process";
          } else if (categoryKey === "quality-assurance") {
            properCategoryName = "Collaboration & Process";
          } else if (categoryKey === "containers-orchestration") {
            properCategoryName = "Containers & Orchestration";
          } else if (categoryKey === "web-development") {
            properCategoryName = "Web Development";
          } else if (categoryKey === "atlassian") {
            properCategoryName = "Atlassian";
          }

          if (!categories[properCategoryName]) {
            categories[properCategoryName] = {
              displayName: properCategoryName,
              rows: [], // Use rows structure like frontend
            };
          }

          // Find or create the row entry
          let existingRow = categories[properCategoryName]?.rows?.find(
            (r) => r.id === score.competency_row
          );
          if (!existingRow) {
            if (!categories[properCategoryName]) {
              categories[properCategoryName] = {
                displayName: properCategoryName,
                rows: [], // Use rows structure like frontend
              };
            }
            existingRow = {
              id: score.competency_row,
              displayName:
                score.competency_row.split(" > ")[1] || score.competency_row, // Extract sub-competency name
              level: score.level,
              confidence: score.confidence,
              evidenceCount: score.evidence_count,
              lastUpdated: score.last_updated,
              evidence: evidence
                .filter((e) => e.competency_row === score.competency_row)
                .map((e) => ({
                  eventId: e.event_id,
                  evidence: e.evidence,
                  confidence: e.label_confidence,
                  metadata: JSON.parse(e.metadata || "{}"),
                  timestamp: e.timestamp,
                })),
            };
            categories[properCategoryName].rows.push(existingRow);
          } else {
            // Update existing row with new evidence
            existingRow.level = Math.max(existingRow.level, score.level);
            existingRow.confidence = Math.max(
              existingRow.confidence,
              score.confidence
            );
            existingRow.evidenceCount =
              (existingRow.evidenceCount || 0) + score.evidence_count;
            existingRow.lastUpdated = score.last_updated;
            if (existingRow.evidence) {
              existingRow.evidence = existingRow.evidence.concat(
                evidence
                  .filter((e) => e.competency_row === score.competency_row)
                  .map((e) => ({
                    eventId: e.event_id,
                    evidence: e.evidence,
                    confidence: e.label_confidence,
                    metadata: JSON.parse(e.metadata || "{}"),
                    timestamp: e.timestamp,
                  }))
              );
            }
          }
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
