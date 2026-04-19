const { DatabaseConnection } = require('../dist/database/connection');

async function generateCompetencyScoresImproved() {
  console.log('🎯 Generating Improved Competency Scores with Volume & Variety Balance...');
  
  try {
    // Connect to database
    const db = DatabaseConnection.getInstance();
    await db.connect();
    console.log('✅ Connected to database');
    
    // Clear existing scores
    console.log('🧹 Clearing existing competency scores...');
    await db.query('DELETE FROM competency_scores');
    
    // Get competency analysis with basic variety metrics
    console.log('📊 Analyzing competency labels with variety metrics...');
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
        COUNT(DISTINCT LEFT(cl.evidence, 100)) as unique_evidence_snippets,
        e.connector_id
      FROM events e
      INNER JOIN competency_labels cl ON e.event_id = cl.event_id
      WHERE e.connector_id = 2
      GROUP BY e.actor, cl.competency_category, cl.competency_row, e.connector_id
    `);
    
    console.log(`📈 Found ${contributorCompetencies.length} contributor-competency combinations`);
    
    // Calculate improved competency scores
    let scoresInserted = 0;
    for (const combo of contributorCompetencies) {
      // 1. Volume Score (frequency) - logarithmic scaling to reduce volume bias
      const volumeScore = Math.min(Math.log(combo.label_count + 1) / Math.log(50), 1.0);
      
      // 2. Breadth Score - different events/documents (more important)
      const breadthScore = Math.min(combo.evidence_count / 10, 1.0);
      
      // 3. Evidence Diversity Score - unique evidence snippets indicate variety
      const diversityScore = Math.min(combo.unique_evidence_snippets / 15, 1.0);
      
      // 4. Confidence Score - average confidence across all evidence
      const confidenceScore = combo.avg_confidence;
      
      // 5. Consistency Score - consistent confidence levels
      const consistencyScore = combo.max_confidence > 0 ? 
        1.0 - ((combo.max_confidence - combo.min_confidence) / combo.max_confidence) : 1.0;
      
      // Balanced scoring with emphasis on variety over pure volume
      const weights = {
        breadth: 0.35,      // Most important - different documents/events
        diversity: 0.25,    // Evidence diversity and uniqueness
        confidence: 0.20,   // Average confidence
        volume: 0.15,      // Limited volume weight with log scaling
        consistency: 0.05  // Minor factor
      };
      
      const overallScore = (
        breadthScore * weights.breadth +
        diversityScore * weights.diversity +
        confidenceScore * weights.confidence +
        volumeScore * weights.volume +
        consistencyScore * weights.consistency
      );
      
      // Determine competency level based on balanced score
      let competencyLevel = 1; // Beginner
      if (overallScore >= 0.80) competencyLevel = 4; // Expert
      else if (overallScore >= 0.65) competencyLevel = 3; // Advanced  
      else if (overallScore >= 0.50) competencyLevel = 2; // Intermediate
      
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
      
      // Log detailed scoring for analysis (only for top performers)
      if (overallScore > 0.7) {
        console.log(`📊 ${combo.actor} - ${combo.competency_category} > ${combo.competency_row}`);
        console.log(`   Level: ${competencyLevel} (Score: ${overallScore.toFixed(3)})`);
        console.log(`   Volume: ${combo.label_count} (${volumeScore.toFixed(3)})`);
        console.log(`   Breadth: ${combo.evidence_count} events (${breadthScore.toFixed(3)})`);
        console.log(`   Diversity: ${combo.unique_evidence_snippets} unique (${diversityScore.toFixed(3)})`);
        console.log(`   Confidence: ${confidenceScore.toFixed(3)}`);
        console.log('');
      }
    }
    
    console.log('🎉 Improved Competency Scores Generated Successfully!');
    console.log(`📊 Scores Inserted: ${scoresInserted}`);
    
    // Generate summary statistics
    const summaryResult = await db.query(`
      SELECT 
        actor,
        COUNT(*) as total_competencies,
        AVG(level) as avg_level,
        MAX(level) as max_level,
        AVG(confidence) as avg_confidence
      FROM competency_scores
      GROUP BY actor
      ORDER BY avg_confidence DESC
    `);
    
    console.log('\n🏆 Top Contributors by Balanced Score:');
    const results = summaryResult.recordset || [];
    results.slice(0, 10).forEach((contributor, index) => {
      console.log(`   ${index + 1}. ${contributor.actor}`);
      console.log(`      Avg Level: ${contributor.avg_level.toFixed(2)}`);
      console.log(`      Max Level: ${contributor.max_level}`);
      console.log(`      Avg Confidence: ${(contributor.avg_confidence * 100).toFixed(1)}%`);
      console.log(`      Competencies: ${contributor.total_competencies}`);
    });
    
    // Show comparison of volume vs variety impact
    console.log('\n📈 Scoring Analysis:');
    console.log('   - Breadth (different events): 35% weight');
    console.log('   - Diversity (unique evidence): 25% weight'); 
    console.log('   - Confidence (average): 20% weight');
    console.log('   - Volume (frequency): 15% weight (log-scaled)');
    console.log('   - Consistency: 5% weight');
    console.log('\n   This rewards developers who demonstrate competencies across');
    console.log('   multiple contexts and with varied evidence, not just repeated mentions.');
    
    await db.disconnect();
    
  } catch (error) {
    console.error('💥 Failed to generate improved competency scores:', error);
    throw error;
  }
}

// Run the improved scoring
if (require.main === module) {
  generateCompetencyScoresImproved().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { generateCompetencyScoresImproved };
