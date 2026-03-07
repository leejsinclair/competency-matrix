const { DatabaseConnection } = require('../dist/database/connection');

async function generateCompetencyScores() {
  console.log('🎯 Generating Aggregated Competency Scores...');
  
  try {
    // Connect to database
    const db = DatabaseConnection.getInstance();
    await db.connect();
    console.log('✅ Connected to database');
    
    // Clear existing scores
    console.log('🧹 Clearing existing competency scores...');
    await db.query('DELETE FROM competency_scores');
    
    // Get all competency labels grouped by contributor and competency
    console.log('📊 Analyzing competency labels...');
    const contributorCompetencies = await db.query(`
      SELECT 
        e.actor,
        cl.competency_category,
        cl.competency_row,
        COUNT(cl.id) as label_count,
        AVG(CAST(cl.confidence AS FLOAT)) as avg_confidence,
        MAX(cl.confidence) as max_confidence,
        MIN(cl.confidence) as min_confidence,
        STRING_AGG(CAST(cl.level AS VARCHAR), ',') as levels,
        COUNT(DISTINCT cl.event_id) as evidence_count,
        e.connector_id
      FROM events e
      INNER JOIN competency_labels cl ON e.event_id = cl.event_id
      WHERE e.connector_id = 2
      GROUP BY e.actor, cl.competency_category, cl.competency_row, e.connector_id
    `);
    
    console.log(`📈 Found ${contributorCompetencies.length} contributor-competency combinations`);
    
    // Calculate competency scores for each combination
    let scoresInserted = 0;
    for (const combo of contributorCompetencies) {
      // Calculate score based on multiple factors
      const frequencyScore = Math.min(combo.label_count / 10, 1.0); // More evidence = higher score
      const confidenceScore = combo.avg_confidence; // Average confidence
      const consistencyScore = 1.0 - ((combo.max_confidence - combo.min_confidence) / combo.max_confidence); // Consistent confidence
      const breadthScore = Math.min(combo.evidence_count / 5, 1.0); // Evidence from multiple events
      
      // Weighted score calculation
      const weights = {
        frequency: 0.3,
        confidence: 0.4,
        consistency: 0.2,
        breadth: 0.1
      };
      
      const overallScore = (
        frequencyScore * weights.frequency +
        confidenceScore * weights.confidence +
        consistencyScore * weights.consistency +
        breadthScore * weights.breadth
      );
      
      // Determine competency level based on score and levels
      const levelsArray = combo.levels.split(',').map(Number);
      const avgLevel = levelsArray.reduce((a, b) => a + b, 0) / levelsArray.length;
      
      let competencyLevel = 1; // Beginner
      if (overallScore >= 0.8 && avgLevel >= 2.5) competencyLevel = 4; // Expert
      else if (overallScore >= 0.6 && avgLevel >= 2) competencyLevel = 3; // Advanced
      else if (overallScore >= 0.4 && avgLevel >= 1.5) competencyLevel = 2; // Intermediate
      
      // Insert competency score
      await db.query(`
        INSERT INTO competency_scores (
          connector_id,
          competency_category, 
          competency_row, 
          actor, 
          level, 
          confidence, 
          evidence_count, 
          last_updated
        ) VALUES (@param0, @param1, @param2, @param3, @param4, @param5, @param6, @param7)
      `, [
        combo.connector_id,
        combo.competency_category,
        combo.competency_row,
        combo.actor,
        competencyLevel,
        overallScore,
        combo.evidence_count,
        new Date()
      ]);
      
      scoresInserted++;
    }
    
    // Generate overall contributor summaries
    console.log('📈 Generating contributor summaries...');
    const contributorSummaries = await db.query(`
      SELECT 
        actor,
        COUNT(*) as total_competencies,
        AVG(confidence) as avg_score,
        MAX(confidence) as max_score,
        COUNT(DISTINCT competency_category) as category_diversity,
        connector_id
      FROM competency_scores
      WHERE connector_id = 2
      GROUP BY actor, connector_id
    `);
    
    console.log('\n🎉 Competency Scores Generated Successfully!');
    console.log(`📊 Scores Inserted: ${scoresInserted}`);
    console.log(`👥 Contributors Analyzed: ${contributorSummaries.length}`);
    
    // Display top contributors
    console.log('\n🏆 Top Contributors by Average Score:');
    contributorSummaries
      .sort((a, b) => b.avg_score - a.avg_score)
      .slice(0, 10)
      .forEach((contributor, index) => {
        console.log(`   ${index + 1}. ${contributor.actor}`);
        console.log(`      Avg Score: ${contributor.avg_score.toFixed(3)}`);
        console.log(`      Max Score: ${contributor.max_score.toFixed(3)}`);
        console.log(`      Competencies: ${contributor.total_competencies}`);
        console.log(`      Categories: ${contributor.category_diversity}`);
      });
    
    // Display competency distribution
    const categoryDistribution = await db.query(`
      SELECT 
        competency_category,
        AVG(confidence) as avg_score,
        COUNT(*) as contributor_count,
        COUNT(DISTINCT actor) as unique_contributors
      FROM competency_scores
      WHERE connector_id = 2
      GROUP BY competency_category
      ORDER BY avg_score DESC
    `);
    
    console.log('\n📊 Competency Category Distribution:');
    categoryDistribution.forEach((category) => {
      console.log(`   ${category.competency_category}`);
      console.log(`      Avg Score: ${category.avg_score.toFixed(3)}`);
      console.log(`      Contributors: ${category.unique_contributors}`);
      console.log(`      Total Assessments: ${category.contributor_count}`);
    });
    
    // Save summary to file
    const summary = {
      generatedAt: new Date().toISOString(),
      totalScores: scoresInserted,
      contributors: contributorSummaries,
      categoryDistribution: categoryDistribution
    };
    
    const fs = require('fs').promises;
    await fs.writeFile('./test-data/competency-scores-summary.json', JSON.stringify(summary, null, 2));
    console.log('\n💾 Summary saved to ./test-data/competency-scores-summary.json');
    
  } catch (error) {
    console.error('❌ Failed to generate competency scores:', error);
    process.exit(1);
  } finally {
    try {
      const db = DatabaseConnection.getInstance();
      await db.close();
      console.log('🔌 Database connection closed');
    } catch (error) {
      console.error('Error closing database:', error);
    }
  }
}

// Run the score generation
generateCompetencyScores();
