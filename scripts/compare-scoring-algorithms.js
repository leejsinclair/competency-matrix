const { DatabaseConnection } = require('../dist/database/connection');

async function compareScoringAlgorithms() {
  console.log('📊 Comparing Scoring Algorithms: Volume vs Variety Balance');
  console.log('=' .repeat(60));
  
  try {
    const db = DatabaseConnection.getInstance();
    await db.connect();
    
    // Get current scores (improved algorithm)
    console.log('\n🎯 IMPROVED SCORING (Variety + Volume Balance)');
    console.log('-' .repeat(50));
    
    const currentScores = await db.query(`
      SELECT 
        actor,
        competency_category,
        competency_row,
        level,
        confidence,
        evidence_count
      FROM competency_scores
      WHERE actor IN ('danieljsmith', 'lsinclair')
      ORDER BY actor, confidence DESC
    `);
    
    const scores = currentScores.recordset || [];
    
    // Analyze danieljsmith specifically
    console.log('\n📈 DANIELSMITH - Testing & Quality Analysis:');
    const danielTesting = scores.filter(s => 
      s.actor === 'danieljsmith' && 
      s.competency_row.includes('Testing')
    );
    
    if (danielTesting.length > 0) {
      const testing = danielTesting[0];
      console.log(`   Level: ${testing.level} (Confidence: ${(testing.confidence * 100).toFixed(1)}%)`);
      console.log(`   Evidence Count: ${testing.evidence_count}`);
      
      // Get raw evidence data for analysis
      const evidenceData = await db.query(`
        SELECT 
          cl.evidence,
          cl.confidence,
          e.event_id
        FROM competency_labels cl
        JOIN events e ON cl.event_id = e.event_id
        WHERE e.actor = 'danieljsmith'
        AND cl.competency_row LIKE '%Testing%'
        ORDER BY cl.confidence DESC
      `);
      
      console.log(`   Raw Evidence Items: ${evidenceData.recordset.length}`);
      
      // Analyze evidence variety
      const uniqueEvents = new Set(evidenceData.recordset.map(e => e.event_id));
      const uniqueEvidence = new Set(evidenceData.recordset.map(e => e.evidence.substring(0, 100)));
      
      console.log(`   Unique Events: ${uniqueEvents.size}`);
      console.log(`   Unique Evidence Snippets: ${uniqueEvidence.size}`);
      
      // Show evidence diversity
      const keywordVariety = {
        'bdd': 0, 'tdd': 0, 'end-to-end': 0, 'e2e': 0, 
        'unit test': 0, 'integration test': 0, 'test automation': 0,
        'cypress': 0, 'jest': 0, 'mocha': 0, 'playwright': 0
      };
      
      evidenceData.recordset.forEach(evidence => {
        const text = evidence.evidence.toLowerCase();
        Object.keys(keywordVariety).forEach(keyword => {
          if (text.includes(keyword)) {
            keywordVariety[keyword]++;
          }
        });
      });
      
      console.log('\n   Keyword Variety Analysis:');
      Object.entries(keywordVariety).forEach(([keyword, count]) => {
        if (count > 0) {
          console.log(`     - ${keyword}: ${count} mentions`);
        }
      });
      
      // Calculate variety score
      const variedKeywords = Object.values(keywordVariety).filter(count => count > 0).length;
      const totalMentions = Object.values(keywordVariety).reduce((sum, count) => sum + count, 0);
      
      console.log(`\n   📊 Variety Metrics:`);
      console.log(`     - Different Keywords Used: ${variedKeywords}/11`);
      console.log(`     - Total Keyword Mentions: ${totalMentions}`);
      console.log(`     - Variety Ratio: ${((variedKeywords / 11) * 100).toFixed(1)}%`);
      
      if (variedKeywords >= 3) {
        console.log(`     ✅ GOOD: Shows variety in testing approaches`);
      } else if (totalMentions >= 10) {
        console.log(`     ⚠️  HIGH VOLUME: Many mentions but limited variety`);
      } else {
        console.log(`     📝 LIMITED: Few testing mentions overall`);
      }
    }
    
    // Compare with lsinclair for reference
    console.log('\n📈 LSINCLAIR - Testing & Quality Analysis:');
    const lsinclairTesting = scores.filter(s => 
      s.actor === 'lsinclair' && 
      s.competency_row.includes('Testing')
    );
    
    if (lsinclairTesting.length > 0) {
      const testing = lsinclairTesting[0];
      console.log(`   Level: ${testing.level} (Confidence: ${(testing.confidence * 100).toFixed(1)}%)`);
      console.log(`   Evidence Count: ${testing.evidence_count}`);
      
      // Get raw evidence data for analysis
      const evidenceData = await db.query(`
        SELECT 
          cl.evidence,
          cl.confidence,
          e.event_id
        FROM competency_labels cl
        JOIN events e ON cl.event_id = e.event_id
        WHERE e.actor = 'lsinclair'
        AND cl.competency_row LIKE '%Testing%'
        ORDER BY cl.confidence DESC
      `);
      
      console.log(`   Raw Evidence Items: ${evidenceData.recordset.length}`);
      
      // Analyze evidence variety
      const uniqueEvents = new Set(evidenceData.recordset.map(e => e.event_id));
      const uniqueEvidence = new Set(evidenceData.recordset.map(e => e.evidence.substring(0, 100)));
      
      console.log(`   Unique Events: ${uniqueEvents.size}`);
      console.log(`   Unique Evidence Snippets: ${uniqueEvidence.size}`);
      
      // Show evidence diversity
      const keywordVariety = {
        'bdd': 0, 'tdd': 0, 'end-to-end': 0, 'e2e': 0, 
        'unit test': 0, 'integration test': 0, 'test automation': 0,
        'cypress': 0, 'jest': 0, 'mocha': 0, 'playwright': 0
      };
      
      evidenceData.recordset.forEach(evidence => {
        const text = evidence.evidence.toLowerCase();
        Object.keys(keywordVariety).forEach(keyword => {
          if (text.includes(keyword)) {
            keywordVariety[keyword]++;
          }
        });
      });
      
      console.log('\n   Keyword Variety Analysis:');
      Object.entries(keywordVariety).forEach(([keyword, count]) => {
        if (count > 0) {
          console.log(`     - ${keyword}: ${count} mentions`);
        }
      });
      
      // Calculate variety score
      const variedKeywords = Object.values(keywordVariety).filter(count => count > 0).length;
      const totalMentions = Object.values(keywordVariety).reduce((sum, count) => sum + count, 0);
      
      console.log(`\n   📊 Variety Metrics:`);
      console.log(`     - Different Keywords Used: ${variedKeywords}/11`);
      console.log(`     - Total Keyword Mentions: ${totalMentions}`);
      console.log(`     - Variety Ratio: ${((variedKeywords / 11) * 100).toFixed(1)}%`);
      
      if (variedKeywords >= 3) {
        console.log(`     ✅ GOOD: Shows variety in testing approaches`);
      } else if (totalMentions >= 10) {
        console.log(`     ⚠️  HIGH VOLUME: Many mentions but limited variety`);
      } else {
        console.log(`     📝 LIMITED: Few testing mentions overall`);
      }
    }
    
    console.log('\n🎯 SCORING ALGORITHM IMPROVEMENT SUMMARY:');
    console.log('-' .repeat(50));
    console.log('📊 OLD ALGORITHM (Volume-Heavy):');
    console.log('   - Frequency: 30% weight (linear scaling)');
    console.log('   - Confidence: 40% weight');
    console.log('   - Breadth: 10% weight');
    console.log('   - Consistency: 20% weight');
    console.log('   ❌ Problem: Repeated mentions heavily rewarded');
    
    console.log('\n📊 NEW ALGORITHM (Variety-Balanced):');
    console.log('   - Breadth (different events): 35% weight');
    console.log('   - Diversity (unique evidence): 25% weight');
    console.log('   - Confidence (average): 20% weight');
    console.log('   - Volume (frequency): 15% weight (log-scaled)');
    console.log('   - Consistency: 5% weight');
    console.log('   ✅ Benefit: Rewards varied evidence across contexts');
    
    console.log('\n🔍 KEY IMPROVEMENTS:');
    console.log('   1. Logarithmic volume scaling reduces repetition bias');
    console.log('   2. Evidence diversity rewards different approaches');
    console.log('   3. Breadth weight emphasizes multiple contexts');
    console.log('   4. Unique evidence snippets indicate genuine variety');
    
    await db.disconnect();
    
  } catch (error) {
    console.error('💥 Comparison failed:', error);
    throw error;
  }
}

// Run the comparison
if (require.main === module) {
  compareScoringAlgorithms().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { compareScoringAlgorithms };
