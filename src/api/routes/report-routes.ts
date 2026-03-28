import { FastifyInstance } from "fastify";
import ReportService from "../../services/report-service";

export async function reportRoutes(fastify: FastifyInstance) {
  const reportService = new ReportService();

  // Health check for report service
  fastify.get("/api/reports/health", async () => {
    return {
      status: "healthy",
      service: "report-generation",
      timestamp: new Date().toISOString(),
    };
  });

  // Get individual developer competency report
  fastify.get("/api/reports/developer/:id/report", async (request: any, reply: any) => {
    const { id } = request.params;
    const { format = 'json' } = request.query as { format?: string };

    try {
      console.log(`📊 Generating report for developer: ${id}`);
      
      const report = await reportService.generateDeveloperReport(id, format as 'json' | 'html');
      
      if (format === 'html') {
        reply.type('text/html');
        return generateHTMLReport(report);
      }
      
      return {
        success: true,
        data: report,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error("Failed to generate developer report:", error);
      reply.code(500);
      return {
        success: false,
        error: "Failed to generate developer report",
        message: (error as Error).message,
        developerId: id
      };
    }
  });

  // Get developer competency profiles (simplified version)
  fastify.get("/api/reports/developer/:id/competencies", async (request: any, reply: any) => {
    const { id } = request.params;

    try {
      console.log(`📊 Getting competencies for developer: ${id}`);
      
      const competencies = await reportService.getDeveloperCompetencies(id);
      const selfEvaluations = await reportService.getDeveloperSelfEvaluations(id);
      
      return {
        success: true,
        data: {
          developerId: id,
          competencies,
          selfEvaluations,
          summary: {
            totalCompetencies: competencies.length,
            averageConfidence: competencies.length > 0 
              ? competencies.reduce((sum, c) => sum + c.confidence, 0) / competencies.length 
              : 0,
            totalSelfEvaluations: selfEvaluations.length
          }
        }
      };
    } catch (error) {
      console.error("Failed to get developer competencies:", error);
      reply.code(500);
      return {
        success: false,
        error: "Failed to get developer competencies",
        message: (error as Error).message,
        developerId: id
      };
    }
  });

  // Store developer self-evaluation
  fastify.post("/api/reports/developer/:id/self-eval", async (request: any, reply: any) => {
    const { id } = request.params;
    const evaluation = request.body as any;

    try {
      console.log(`📊 Saving self-evaluation for developer: ${id}`);
      
      const selfEvaluation = {
        developer_id: id,
        competency_category: evaluation.competencyCategory,
        competency_row: evaluation.competencyRow,
        self_level: evaluation.selfLevel,
        self_confidence: evaluation.selfConfidence,
        evidence: evaluation.evidence,
        metadata: evaluation.metadata
      };
      
      await reportService.saveSelfEvaluation(selfEvaluation);
      
      return {
        success: true,
        message: "Self-evaluation saved successfully",
        developerId: id,
        competencyCategory: evaluation.competencyCategory,
        competencyRow: evaluation.competencyRow
      };
    } catch (error) {
      console.error("Failed to save self-evaluation:", error);
      reply.code(500);
      return {
        success: false,
        error: "Failed to save self-evaluation",
        message: (error as Error).message,
        developerId: id
      };
    }
  });

  // Get full team competency matrix
  fastify.get("/api/reports/matrix", async (request: any, reply: any) => {
    const { format = 'json', category, developer } = request.query as { 
      format?: string; 
      category?: string; 
      developer?: string;
    };

    try {
      console.log("📊 Generating team competency matrix");
      
      const matrix = await reportService.generateTeamMatrix();
      
      // Apply filters if provided
      let filteredMatrix = matrix;
      if (category) {
        filteredMatrix = {
          ...matrix,
          categoryBreakdown: {
            [category]: matrix.categoryBreakdown[category]
          }
        };
      }
      
      if (developer) {
        filteredMatrix = {
          ...matrix,
          developers: matrix.developers.filter(d => 
            d.developerId.toLowerCase().includes(developer.toLowerCase())
          )
        };
      }
      
      if (format === 'html') {
        reply.type('text/html');
        return generateHTMLMatrix(filteredMatrix);
      }
      
      return {
        success: true,
        data: filteredMatrix,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error("Failed to generate team matrix:", error);
      reply.code(500);
      return {
        success: false,
        error: "Failed to generate team matrix",
        message: (error as Error).message
      };
    }
  });

  // Get report history
  fastify.get("/api/reports/history", async (request: any, reply: any) => {
    const { developer, type, limit = 10 } = request.query as { 
      developer?: string; 
      type?: string; 
      limit?: number;
    };

    try {
      console.log("📊 Getting report history");
      
      // This would query the reports table - for now, return mock data
      const history = [
        {
          id: 1,
          developerId: developer || 'team',
          reportType: type || 'individual',
          title: 'Developer Competency Report',
          generatedAt: new Date().toISOString(),
          format: 'json'
        }
      ];
      
      return {
        success: true,
        data: history.slice(0, limit),
        total: history.length
      };
    } catch (error) {
      console.error("Failed to get report history:", error);
      reply.code(500);
      return {
        success: false,
        error: "Failed to get report history",
        message: (error as Error).message
      };
    }
  });

  // Export report in different formats
  fastify.get("/api/reports/:reportId/export", async (request: any, reply: any) => {
    const { reportId } = request.params;
    const { format = 'json' } = request.query as { format?: string };

    try {
      console.log(`📊 Exporting report ${reportId} in ${format} format`);
      
      // This would fetch the report from database and export it
      // For now, return a mock response
      const report = {
        id: reportId,
        exportedAt: new Date().toISOString(),
        format,
        content: "Mock report content for export"
      };
      
      if (format === 'json') {
        reply.type('application/json');
        return report;
      } else if (format === 'html') {
        reply.type('text/html');
        return generateHTMLReport(report);
      } else if (format === 'csv') {
        reply.type('text/csv');
        return generateCSVReport(report);
      }
      
      return report;
    } catch (error) {
      console.error("Failed to export report:", error);
      reply.code(500);
      return {
        success: false,
        error: "Failed to export report",
        message: (error as Error).message,
        reportId
      };
    }
  });
}

// Helper functions for generating different report formats
function generateHTMLReport(report: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Competency Report - ${report.developerName || 'Team'}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; }
        .competency { border: 1px solid #ddd; padding: 10px; margin: 5px 0; border-radius: 3px; }
        .confidence-high { background: #d4edda; }
        .confidence-medium { background: #fff3cd; }
        .confidence-low { background: #f8d7da; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Competency Report</h1>
        <p><strong>Developer:</strong> ${report.developerName || 'Team'}</p>
        <p><strong>Generated:</strong> ${new Date(report.generatedAt).toLocaleString()}</p>
        <p><strong>Total Competencies:</strong> ${report.summary?.totalCompetencies || 0}</p>
        <p><strong>Average Confidence:</strong> ${((report.summary?.averageConfidence || 0) * 100).toFixed(1)}%</p>
      </div>
      
      <div class="section">
        <h2>Competency Scores</h2>
        ${(report.competencyScores || []).map((score: any) => `
          <div class="competency ${getConfidenceClass(score.confidence)}">
            <h3>${score.competency_category} - ${score.competency_row}</h3>
            <p><strong>Level:</strong> ${score.level}</p>
            <p><strong>Confidence:</strong> ${(score.confidence * 100).toFixed(1)}%</p>
            <p><strong>Evidence Count:</strong> ${score.evidence_count}</p>
          </div>
        `).join('')}
      </div>
    </body>
    </html>
  `;
}

function generateHTMLMatrix(matrix: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Team Competency Matrix</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .developer { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .category { background: #e9ecef; padding: 10px; margin: 5px 0; border-radius: 3px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Team Competency Matrix</h1>
        <p><strong>Generated:</strong> ${new Date(matrix.generatedAt).toLocaleString()}</p>
        <p><strong>Total Developers:</strong> ${matrix.totalDevelopers}</p>
        <p><strong>Total Competencies:</strong> ${matrix.totalCompetencies}</p>
      </div>
      
      <div class="section">
        <h2>Developer Breakdown</h2>
        ${matrix.developers.map((dev: any) => `
          <div class="developer">
            <h3>${dev.developerName}</h3>
            <p><strong>Total Competencies:</strong> ${dev.summary.totalCompetencies}</p>
            <p><strong>Average Confidence:</strong> ${(dev.summary.averageConfidence * 100).toFixed(1)}%</p>
            <p><strong>Top Areas:</strong> ${dev.summary.topAreas.join(', ')}</p>
          </div>
        `).join('')}
      </div>
    </body>
    </html>
  `;
}

function generateCSVReport(report: any): string {
  const headers = 'Developer,Category,Row,Level,Confidence,Evidence Count\n';
  const rows = (report.competencyScores || []).map((score: any) => 
    `${score.actor},${score.competency_category},${score.competency_row},${score.level},${score.confidence},${score.evidence_count}`
  ).join('\n');
  
  return headers + rows;
}

function getConfidenceClass(confidence: number): string {
  if (confidence >= 0.8) return 'confidence-high';
  if (confidence >= 0.6) return 'confidence-medium';
  return 'confidence-low';
}
