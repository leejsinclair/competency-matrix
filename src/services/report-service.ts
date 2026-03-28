import DatabaseConnection from "../database/connection";

export interface CompetencyScore {
  id: number;
  connector_id: number;
  competency_category: string;
  competency_row: string;
  actor: string;
  level: number;
  confidence: number;
  evidence_count: number;
  last_updated: string;
}

export interface SelfEvaluation {
  id: number;
  developer_id: string;
  competency_category: string;
  competency_row: string;
  self_level: number;
  self_confidence: number;
  evidence?: string;
  submitted_at: string;
  metadata?: any;
}

export interface DeveloperReport {
  developerId: string;
  developerName: string;
  generatedAt: string;
  reportType: string;
  competencyScores: CompetencyScore[];
  selfEvaluations: SelfEvaluation[];
  summary: {
    totalCompetencies: number;
    averageConfidence: number;
    levelDistribution: Record<number, number>;
    topCompetencyAreas: Array<{
      category: string;
      averageConfidence: number;
      count: number;
    }>;
  };
}

export interface TeamMatrix {
  developerId?: string; // For team reports, this will be 'team'
  generatedAt: string;
  totalDevelopers: number;
  totalCompetencies: number;
  reportType: string;
  developers: Array<{
    developerId: string;
    developerName: string;
    competencyScores: CompetencyScore[];
    summary: {
      totalCompetencies: number;
      averageConfidence: number;
      topAreas: string[];
    };
  }>;
  categoryBreakdown: Record<
    string,
    {
      totalDevelopers: number;
      averageConfidence: number;
      topPerformers: Array<{
        developerId: string;
        confidence: number;
      }>;
    }
  >;
}

export class ReportService {
  private db = DatabaseConnection;

  async getDeveloperCompetencies(
    developerId: string
  ): Promise<CompetencyScore[]> {
    try {
      const query = `
        SELECT * FROM competency_scores 
        WHERE actor = @param0
        ORDER BY confidence DESC
      `;
      const result = await this.db.query(query, [developerId]);
      return result;
    } catch (error) {
      console.error("Failed to get developer competencies:", error);
      throw error;
    }
  }

  async getDeveloperSelfEvaluations(
    developerId: string
  ): Promise<SelfEvaluation[]> {
    try {
      const query = `
        SELECT * FROM self_evaluations 
        WHERE developer_id = @param0
        ORDER BY submitted_at DESC
      `;
      const result = await this.db.query(query, [developerId]);
      return result;
    } catch (error) {
      console.error("Failed to get developer self evaluations:", error);
      throw error;
    }
  }

  async generateDeveloperReport(
    developerId: string,
    format: "json" | "html" = "json"
  ): Promise<DeveloperReport> {
    try {
      console.log(`📊 Generating developer report for ${developerId}`);

      const competencyScores = await this.getDeveloperCompetencies(developerId);
      const selfEvaluations =
        await this.getDeveloperSelfEvaluations(developerId);

      const summary = this.calculateDeveloperSummary(competencyScores);

      const report: DeveloperReport = {
        developerId,
        developerName: this.extractDeveloperName(developerId),
        generatedAt: new Date().toISOString(),
        reportType: "individual",
        competencyScores,
        selfEvaluations,
        summary,
      };

      // Save report to database
      await this.saveReport(report, format);

      return report;
    } catch (error) {
      console.error("Failed to generate developer report:", error);
      throw error;
    }
  }

  async generateTeamMatrix(): Promise<TeamMatrix> {
    try {
      console.log("📊 Generating team competency matrix");

      // Get all competency scores
      const query = `
        SELECT * FROM competency_scores 
        ORDER BY actor, confidence DESC
      `;
      const allScores = await this.db.query(query);

      // Group by developer
      const developerScores = this.groupScoresByDeveloper(allScores);

      // Calculate category breakdown
      const categoryBreakdown = this.calculateCategoryBreakdown(allScores);

      const matrix: TeamMatrix = {
        developerId: "team",
        generatedAt: new Date().toISOString(),
        totalDevelopers: Object.keys(developerScores).length,
        totalCompetencies: allScores.length,
        reportType: "team",
        developers: Object.entries(developerScores).map(
          ([developerId, scores]) => ({
            developerId,
            developerName: this.extractDeveloperName(developerId),
            competencyScores: scores,
            summary: {
              totalCompetencies: scores.length,
              averageConfidence:
                scores.reduce((sum, s) => sum + s.confidence, 0) /
                scores.length,
              topAreas: this.getTopCompetencyAreas(scores),
            },
          })
        ),
        categoryBreakdown,
      };

      // Save matrix to database
      await this.saveReport(matrix as any, "json");

      return matrix;
    } catch (error) {
      console.error("Failed to generate team matrix:", error);
      throw error;
    }
  }

  async saveSelfEvaluation(
    evaluation: Omit<SelfEvaluation, "id">
  ): Promise<void> {
    try {
      const query = `
        INSERT INTO self_evaluations (
          developer_id, competency_category, competency_row, 
          self_level, self_confidence, evidence, metadata
        ) VALUES (
          @param0, @param1, @param2,
          @param3, @param4, @param5, @param6
        )
      `;
      const params = [
        evaluation.developer_id,
        evaluation.competency_category,
        evaluation.competency_row,
        evaluation.self_level,
        evaluation.self_confidence,
        evaluation.evidence,
        evaluation.metadata,
      ];
      await this.db.query(query, params);
      console.log(`✅ Self evaluation saved for ${evaluation.developer_id}`);
    } catch (error) {
      console.error("Failed to save self evaluation:", error);
      throw error;
    }
  }

  private calculateDeveloperSummary(scores: CompetencyScore[]) {
    const totalCompetencies = scores.length;
    const averageConfidence =
      scores.length > 0
        ? scores.reduce((sum, s) => sum + s.confidence, 0) / scores.length
        : 0;

    const levelDistribution: Record<number, number> = {};
    scores.forEach((score) => {
      levelDistribution[score.level] =
        (levelDistribution[score.level] || 0) + 1;
    });

    const categoryGroups = scores.reduce(
      (acc, score) => {
        if (!acc[score.competency_category]) {
          acc[score.competency_category] = { total: 0, count: 0, scores: [] };
        }
        acc[score.competency_category].total += score.confidence;
        acc[score.competency_category].count++;
        acc[score.competency_category].scores.push(score);
        return acc;
      },
      {} as Record<string, any>
    );

    const topCompetencyAreas = Object.entries(categoryGroups)
      .map(([category, data]) => ({
        category,
        averageConfidence: data.total / data.count,
        count: data.count,
      }))
      .sort((a, b) => b.averageConfidence - a.averageConfidence)
      .slice(0, 5);

    return {
      totalCompetencies,
      averageConfidence,
      levelDistribution,
      topCompetencyAreas,
    };
  }

  private groupScoresByDeveloper(
    scores: CompetencyScore[]
  ): Record<string, CompetencyScore[]> {
    return scores.reduce(
      (acc, score) => {
        if (!acc[score.actor]) {
          acc[score.actor] = [];
        }
        acc[score.actor].push(score);
        return acc;
      },
      {} as Record<string, CompetencyScore[]>
    );
  }

  private calculateCategoryBreakdown(
    scores: CompetencyScore[]
  ): Record<string, any> {
    const categoryGroups = scores.reduce(
      (acc, score) => {
        if (!acc[score.competency_category]) {
          acc[score.competency_category] = {
            scores: [],
            developers: new Set(),
          };
        }
        acc[score.competency_category].scores.push(score);
        acc[score.competency_category].developers.add(score.actor);
        return acc;
      },
      {} as Record<string, any>
    );

    return Object.entries(categoryGroups).reduce(
      (acc, [category, data]) => {
        const avgConfidence =
          data.scores.reduce(
            (sum: number, s: CompetencyScore) => sum + s.confidence,
            0
          ) / data.scores.length;

        acc[category] = {
          totalDevelopers: data.developers.size,
          averageConfidence: avgConfidence,
          topPerformers: data.scores
            .sort(
              (a: CompetencyScore, b: CompetencyScore) =>
                b.confidence - a.confidence
            )
            .slice(0, 3)
            .map((s) => ({ developerId: s.actor, confidence: s.confidence })),
        };
        return acc;
      },
      {} as Record<string, any>
    );
  }

  private getTopCompetencyAreas(scores: CompetencyScore[]): string[] {
    const categoryGroups = scores.reduce(
      (acc, score) => {
        if (!acc[score.competency_category]) {
          acc[score.competency_category] = { total: 0, count: 0 };
        }
        acc[score.competency_category].total += score.confidence;
        acc[score.competency_category].count++;
        return acc;
      },
      {} as Record<string, any>
    );

    return Object.entries(categoryGroups)
      .map(([category, data]) => ({
        category,
        avgConfidence: data.total / data.count,
      }))
      .sort((a, b) => b.avgConfidence - a.avgConfidence)
      .slice(0, 3)
      .map((item) => item.category);
  }

  private extractDeveloperName(developerId: string): string {
    // Extract name from email or return as-is
    if (developerId.includes("@")) {
      return developerId.split("@")[0];
    }
    return developerId;
  }

  private async saveReport(report: any, format: string): Promise<void> {
    try {
      const query = `
        INSERT INTO reports (
          developer_id, report_type, title, content, format, metadata
        ) VALUES (
          @param0, @param1, @param2, @param3, @param4, @param5
        )
      `;

      const title = report.developerId
        ? `Developer Report - ${report.developerId}`
        : "Team Competency Matrix";

      const params = [
        report.developerId || "team",
        report.reportType,
        title,
        JSON.stringify(report),
        format,
        JSON.stringify({
          generatedAt: report.generatedAt,
          totalCompetencies:
            report.totalCompetencies ||
            Object.keys(report.developers || {}).length,
        }),
      ];

      await this.db.query(query, params);

      console.log(`✅ Report saved: ${title}`);
    } catch (error) {
      console.error("Failed to save report:", error);
      throw error;
    }
  }
}

export default ReportService;
