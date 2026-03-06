import cors from "@fastify/cors";
import fastify from "fastify";
import path from "path";

// Simple test API without complex imports first
export class SimpleApiServer {
  private server: any;
  private port: number;
  private host: string;

  constructor(port: number = 3001, host: string = "localhost") {
    this.port = port;
    this.host = host;
    this.server = fastify({
      logger: {
        level: process.env.LOG_LEVEL || "info",
      },
    });
  }

  async start(): Promise<void> {
    try {
      // Register CORS
      await this.server.register(cors, {
        origin: ["http://localhost:5173", "http://localhost:3000"],
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
      });

      // Add health check endpoint
      this.server.get("/api/health", async () => {
        return { 
          status: "ok", 
          timestamp: new Date().toISOString(),
          services: {
            api: true,
            data: true
          }
        };
      });

      // Add competency processing endpoint (mock for now)
      this.server.post("/api/competency/process", async (request: any, reply: any) => {
        const { event } = request.body as any;

        try {
          // Mock classification for testing
          const mockClassification = {
            id: event.id,
            ruleClassifications: [
              {
                competencyCategory: 'programming-languages',
                competencyRow: 'software-engineering',
                level: { name: 'Intermediate', value: 2 },
                confidence: 0.9,
                evidence: 'Mock classification for testing'
              }
            ],
            features: {
              textMetrics: {
                wordCount: event.content?.split(' ').length || 0,
                semanticComplexity: 0.5,
                technicalTermDensity: 0.1
              },
              activityPatterns: {
                isConfluencePage: event.type === 'confluence-page' ? 1 : 0,
                isPRReview: event.type === 'pull-request-review' ? 1 : 0,
                isJiraTicket: event.type === 'jira-ticket' ? 1 : 0,
                collaborationScore: 0.2
              },
              temporalPatterns: {
                isBusinessHours: 1,
                isWeekend: 0,
                isRecentActivity: 1
              }
            },
            processingTime: 25,
            algorithm: 'rules-only'
          };

          return mockClassification;
        } catch (error) {
          reply.code(500);
          return {
            error: 'Processing failed',
            message: (error as Error).message,
            eventId: event.id
          };
        }
      });

      // Get contributors endpoint
      this.server.get("/api/competency/contributors", async () => {
        try {
          const fs = require('fs');
          const profilesPath = path.join(process.cwd(), '_content/confluence/processed/contributor-profiles.json');
          
          if (!fs.existsSync(profilesPath)) {
            return { contributors: [], total: 0 };
          }

          const profiles = JSON.parse(fs.readFileSync(profilesPath, 'utf8'));
          
          // Return summary list for performance
          const contributorSummaries = profiles.map((p: any) => ({
            email: p.email,
            displayName: p.displayName,
            totalCompetencies: p.totalCompetencies,
            contributionsByType: p.contributionsByType,
            lastUpdated: p.lastUpdated
          }));

          return {
            contributors: contributorSummaries,
            total: contributorSummaries.length
          };
        } catch (error) {
          return {
            error: 'Failed to load contributors',
            message: (error as Error).message
          };
        }
      });

      // Add root endpoint
      this.server.get("/", async () => {
        return {
          message: "Competency Matrix API",
          version: "1.0.0",
          endpoints: {
            "GET /api/health": "Health check",
            "POST /api/competency/process": "Process single event",
            "GET /api/competency/contributors": "List all contributors"
          }
        };
      });

      // Start server
      await this.server.listen({ 
        port: this.port, 
        host: this.host 
      });
      
      console.log(`🚀 API Server started successfully!`);
      console.log(`📍 Address: http://${this.host}:${this.port}`);
      console.log(`📊 Health check: http://${this.host}:${this.port}/api/health`);
      console.log(`👥 Contributors: http://${this.host}:${this.port}/api/competency/contributors`);
      
    } catch (error) {
      console.error('❌ Failed to start API server:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      await this.server.close();
      console.log('🛑 API Server stopped');
    } catch (error) {
      console.error('❌ Error stopping server:', error);
      throw error;
    }
  }
}
