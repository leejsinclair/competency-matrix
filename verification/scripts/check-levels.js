// Check competency levels in the database
const sql = require('mssql');

const config = {
  server: 'localhost',
  database: 'competency_matrix',
  options: {
    trustServerCertificate: true
  },
  authentication: {
    type: 'default',
    options: {
      userName: 'sa',
      password: 'sa-Password@01'
    }
  }
};

async function checkLevels() {
  try {
    await sql.connect(config);
    console.log('✅ Connected to database');
    
    // Check level distribution for a few developers
    const result = await sql.query(`
      SELECT actor, competency_category, competency_row, level, confidence
      FROM competency_scores
      WHERE actor IN ('Fiona Wrigley', 'azhelnin_creditsense', 'Chaprel John Villegas')
      ORDER BY actor, competency_category, competency_row
    `);
    
    console.log('\n📊 COMPETENCY LEVELS ANALYSIS:');
    
    const developers = {};
    result.recordset.forEach(row => {
      if (!developers[row.actor]) {
        developers[row.actor] = [];
      }
      developers[row.actor].push({
        category: row.competency_category,
        row: row.competency_row,
        level: row.level,
        confidence: row.confidence
      });
    });
    
    Object.entries(developers).forEach(([developer, scores]) => {
      console.log(`\n🎯 ${developer}:`);
      console.log(`  Total competencies: ${scores.length}`);
      
      const levelCounts = {};
      scores.forEach(score => {
        levelCounts[score.level] = (levelCounts[score.level] || 0) + 1;
      });
      
      console.log(`  Level distribution:`);
      Object.entries(levelCounts).sort((a, b) => a[0] - b[0]).forEach(([level, count]) => {
        console.log(`    Level ${level}: ${count} competencies`);
      });
      
      // Show a few examples
      console.log(`  Sample competencies:`);
      scores.slice(0, 3).forEach((score, index) => {
        console.log(`    ${index + 1}. ${score.row} - Level ${score.level} (${(score.confidence * 100).toFixed(1)}%)`);
      });
    });
    
    // Check if any competencies have level < 3
    const lowLevels = await sql.query(`
      SELECT COUNT(*) as count
      FROM competency_scores
      WHERE level < 3
    `);
    
    console.log(`\n📈 Low level competencies (Level 1-2): ${lowLevels.recordset[0].count}`);
    
    const highLevels = await sql.query(`
      SELECT COUNT(*) as count
      FROM competency_scores
      WHERE level >= 3
    `);
    
    console.log(`📈 High level competencies (Level 3-4): ${highLevels.recordset[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sql.close();
  }
}

checkLevels();
