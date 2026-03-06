import { FastifyInstance } from "fastify";
import { ActivityEvent } from "../../types/activity";

export async function competencyRoutes(fastify: FastifyInstance) {
  // Health check for competency service
  fastify.get("/api/competency/health", async () => {
    return {
      status: "healthy",
      services: {
        featureExtractor: true,
        ruleEngine: true,
        mlClassifier: false,
        ruleCount: 13,
      },
      timestamp: new Date().toISOString(),
    };
  });

  // Process single event (simplified version)
  fastify.post("/api/competency/process", async (request: any, reply: any) => {
    const { event, useML = false } = request.body as any;

    try {
      // Mock processing for now
      return {
        id: event.id,
        ruleClassifications: [
          {
            competencyCategory: "programming-languages",
            competencyRow: "software-engineering",
            level: { name: "Intermediate", value: 2 },
            confidence: 0.9,
            evidence: "Mock classification for testing",
          },
        ],
        mlClassifications: useML
          ? [
              {
                competencyCategory: "programming-languages",
                competencyRow: "software-engineering",
                level: "L2",
                confidence: 0.85,
                probability: 0.85,
              },
            ]
          : undefined,
        features: {
          textMetrics: {
            wordCount: event.content?.split(" ").length || 0,
            semanticComplexity: 0.5,
            technicalTermDensity: 0.1,
          },
          activityPatterns: {
            isConfluencePage: event.type === "confluence-page" ? 1 : 0,
            isPRReview: event.type === "pull-request-review" ? 1 : 0,
            isJiraTicket: event.type === "jira-ticket" ? 1 : 0,
            collaborationScore: 0.2,
          },
          temporalPatterns: {
            isBusinessHours: 1,
            isWeekend: 0,
            isRecentActivity: 1,
          },
        },
        processingTime: 50,
        algorithm: useML ? "hybrid-rules-ml" : "rules-only",
      };
    } catch (error) {
      reply.code(500);
      return {
        error: "Processing failed",
        message: (error as Error).message,
        eventId: event.id,
      };
    }
  });

  // Get contributor profiles
  fastify.get("/api/competency/contributors", async () => {
    try {
      const fs = require("fs");
      const path = require("path");
      const profilesPath = path.join(
        process.cwd(),
        "_content/confluence/processed/contributor-profiles.json"
      );

      if (!fs.existsSync(profilesPath)) {
        return { contributors: [], total: 0 };
      }

      const profiles = JSON.parse(fs.readFileSync(profilesPath, "utf8"));

      // Return summary list for performance
      const contributorSummaries = profiles.map((p: any) => ({
        email: p.email,
        displayName: p.displayName,
        totalCompetencies: p.totalCompetencies,
        contributionsByType: p.contributionsByType,
        lastUpdated: p.lastUpdated,
      }));

      return {
        contributors: contributorSummaries,
        total: contributorSummaries.length,
      };
    } catch (error) {
      return {
        error: "Failed to load contributors",
        message: (error as Error).message,
      };
    }
  });

  // Get contributor by email
  fastify.get(
    "/api/competency/contributors/:email",
    async (request: any, reply: any) => {
      const { email } = request.params as any;

      try {
        const fs = require("fs");
        const path = require("path");
        const profilesPath = path.join(
          process.cwd(),
          "_content/confluence/processed/contributor-profiles.json"
        );

        if (!fs.existsSync(profilesPath)) {
          reply.code(404);
          return { error: "Contributor profiles not found" };
        }

        const profiles = JSON.parse(fs.readFileSync(profilesPath, "utf8"));
        const contributor = profiles.find((p: any) => p.email === email);

        if (!contributor) {
          reply.code(404);
          return { error: "Contributor not found" };
        }

        return contributor;
      } catch (error) {
        reply.code(500);
        return {
          error: "Failed to load contributor profile",
          message: (error as Error).message,
        };
      }
    }
  );

  // Get processing summary
  fastify.get("/api/competency/summary", async () => {
    try {
      const fs = require("fs");
      const path = require("path");
      const summaryPath = path.join(
        process.cwd(),
        "_content/confluence/processed/processing-summary.json"
      );

      if (!fs.existsSync(summaryPath)) {
        return {
          totalContributors: 0,
          totalClassifications: 0,
          topCompetencyAreas: [],
          contributorsByContributionType: {},
        };
      }

      const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
      return summary;
    } catch (error) {
      return {
        error: "Failed to load processing summary",
        message: (error as Error).message,
      };
    }
  });

  // Batch processing
  fastify.post("/api/competency/batch", async (request: any, reply: any) => {
    const { events } = request.body as any;

    if (events.length > 100) {
      reply.code(400);
      return { error: "Maximum 100 events per batch" };
    }

    try {
      // Mock batch processing
      const results = events.map((event: ActivityEvent) => ({
        id: event.id,
        ruleClassifications: [
          {
            competencyCategory: "programming-languages",
            competencyRow: "software-engineering",
            level: { name: "Intermediate", value: 2 },
            confidence: 0.9,
            evidence: "Mock classification for testing",
          },
        ],
        processingTime: 25,
        algorithm: "rules-only",
      }));

      return {
        results,
        summary: {
          total: events.length,
          successful: results.length,
          failed: 0,
          totalProcessingTime: 25 * events.length,
          averageProcessingTime: 25,
        },
      };
    } catch (error) {
      reply.code(500);
      return {
        error: "Batch processing failed",
        message: (error as Error).message,
      };
    }
  });

  // Get competency by category
  fastify.get(
    "/api/competency/categories/:category",
    async (request: any, reply: any) => {
      const { category } = request.params as any;

      try {
        const fs = require("fs");
        const path = require("path");
        const profilesPath = path.join(
          process.cwd(),
          "_content/confluence/processed/contributor-profiles.json"
        );

        if (!fs.existsSync(profilesPath)) {
          return { contributors: [], category, total: 0 };
        }

        const profiles = JSON.parse(fs.readFileSync(profilesPath, "utf8"));

        // Filter contributors by category
        const categoryContributors = profiles
          .filter((p: any) =>
            p.competencyAreas.some((area: any) => area.category === category)
          )
          .map((p: any) => {
            const categoryAreas = p.competencyAreas.filter(
              (area: any) => area.category === category
            );
            return {
              email: p.email,
              displayName: p.displayName,
              competencyAreas: categoryAreas,
              averageConfidence:
                categoryAreas.reduce(
                  (sum: number, area: any) => sum + area.confidence,
                  0
                ) / categoryAreas.length,
            };
          })
          .sort((a: any, b: any) => b.averageConfidence - a.averageConfidence);

        return {
          category,
          contributors: categoryContributors,
          total: categoryContributors.length,
          averageConfidence:
            categoryContributors.reduce(
              (sum: number, c: any) => sum + c.averageConfidence,
              0
            ) / categoryContributors.length || 0,
        };
      } catch (error) {
        reply.code(500);
        return {
          error: "Failed to load category data",
          message: (error as Error).message,
        };
      }
    }
  );
}
