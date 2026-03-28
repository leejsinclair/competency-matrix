import { DatabaseConnection } from '../database/connection';
import { 
  DeveloperMatrix, 
  TeamMatrix, 
  MatrixOverview, 
  MatrixCategory, 
  MatrixRow,
  COMPETENCY_CATEGORIES,
  COMPETENCY_LEVELS 
} from '../types/matrix';

export class MatrixService {
  private db = DatabaseConnection.getInstance();

  async getDeveloperMatrix(actor: string): Promise<DeveloperMatrix> {
    await this.db.connect();
    
    try {
      const result = await this.db.query(`
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
      
      // Build matrix structure
      const categories: MatrixCategory[] = [];
      let totalScores = 0;
      let totalConfidence = 0;
      const levelDistribution: Record<number, number> = {};

      // Process each category
      Object.entries(COMPETENCY_CATEGORIES).forEach(([categoryKey, categoryDef]) => {
        const categoryScores = scores.filter(s => s.competency_category === categoryKey);
        
        const rows: MatrixRow[] = categoryDef.rows.map(rowDef => {
          const score = categoryScores.find(s => s.competency_row === rowDef.id);
          
          if (score) {
            totalScores++;
            totalConfidence += score.confidence;
            levelDistribution[score.level] = (levelDistribution[score.level] || 0) + 1;
            
            return {
              row: rowDef.id,
              displayName: rowDef.displayName,
              levels: {
                [score.level]: {
                  category: categoryKey,
                  row: rowDef.id,
                  level: score.level,
                  confidence: score.confidence,
                  evidenceCount: score.evidence_count,
                  lastUpdated: score.last_updated
                }
              }
            };
          } else {
            return {
              row: rowDef.id,
              displayName: rowDef.displayName,
              levels: {}
            };
          }
        });

        const categorySummary = {
          totalScores: categoryScores.length,
          averageConfidence: categoryScores.length > 0 
            ? categoryScores.reduce((sum, s) => sum + s.confidence, 0) / categoryScores.length 
            : 0,
          averageLevel: categoryScores.length > 0 
            ? categoryScores.reduce((sum, s) => sum + s.level, 0) / categoryScores.length 
            : 0
        };

        categories.push({
          category: categoryKey,
          displayName: categoryDef.displayName,
          rows,
          summary: categorySummary
        });
      });

      const averageConfidence = totalScores > 0 ? totalConfidence / totalScores : 0;
      const averageLevel = totalScores > 0 
        ? Object.entries(levelDistribution).reduce((sum, [level, count]) => sum + (parseInt(level) * count), 0) / totalScores 
        : 0;

      return {
        actor,
        categories,
        summary: {
          totalScores,
          averageConfidence,
          averageLevel,
          levelDistribution
        },
        generatedAt: new Date().toISOString()
      };
    } finally {
      await this.db.disconnect();
    }
  }

  async getTeamMatrix(): Promise<TeamMatrix> {
    await this.db.connect();
    
    try {
      const result = await this.db.query(`
        SELECT DISTINCT actor
        FROM competency_scores
        ORDER BY actor
      `);

      const actors = Array.isArray(result) ? result : result.recordset || [];
      const developerMatrices: DeveloperMatrix[] = [];

      // Get matrix for each developer
      for (const actorRecord of actors) {
        const developerMatrix = await this.getDeveloperMatrix(actorRecord.actor);
        developerMatrices.push(developerMatrix);
      }

      const totalScores = developerMatrices.reduce((sum, dev) => sum + dev.summary.totalScores, 0);

      return {
        developers: developerMatrices,
        totalDevelopers: developerMatrices.length,
        totalScores,
        categories: Object.keys(COMPETENCY_CATEGORIES),
        generatedAt: new Date().toISOString()
      };
    } finally {
      await this.db.disconnect();
    }
  }

  async getMatrixOverview(): Promise<MatrixOverview> {
    await this.db.connect();
    
    try {
      const summaryResult = await this.db.query(`
        SELECT 
          COUNT(*) as total_scores,
          COUNT(DISTINCT actor) as total_developers,
          COUNT(DISTINCT competency_category) as total_categories,
          AVG(confidence) as avg_confidence,
          AVG(level) as avg_level
        FROM competency_scores
      `);

      const categoryBreakdown = await this.db.query(`
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

      const levelDistribution = await this.db.query(`
        SELECT 
          level,
          COUNT(*) as count,
          COUNT(DISTINCT actor) as developer_count
        FROM competency_scores
        GROUP BY level
        ORDER BY level
      `);

      const summary = Array.isArray(summaryResult) ? summaryResult[0] : summaryResult.recordset?.[0];
      const categories = Array.isArray(categoryBreakdown) ? categoryBreakdown : categoryBreakdown.recordset || [];
      const levels = Array.isArray(levelDistribution) ? levelDistribution : levelDistribution.recordset || [];

      return {
        summary: {
          totalScores: summary?.total_scores || 0,
          totalDevelopers: summary?.total_developers || 0,
          totalCategories: summary?.total_categories || 0,
          averageConfidence: summary?.avg_confidence || 0,
          averageLevel: summary?.avg_level || 0
        },
        categoryBreakdown: categories,
        levelDistribution: levels,
        generatedAt: new Date().toISOString()
      };
    } finally {
      await this.db.disconnect();
    }
  }
}
