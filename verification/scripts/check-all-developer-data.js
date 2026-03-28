// Check competency data for all developers
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

async function checkAllDeveloperData() {
  try {
    await sql.connect(config);
    console.log('✅ Connected to database');
    
    // Check all developers and their competency counts
    const developerCounts = await sql.query(`
      SELECT actor, COUNT(*) as competency_count
      FROM competency_scores
      GROUP BY actor
      ORDER BY competency_count DESC
    `);
    
    console.log('\n📊 DEVELOPER COMPETENCY COUNTS:');
    console.log('=====================================');
    
    developerCounts.recordset.forEach((dev, index) => {
      console.log(`${index + 1}. ${dev.actor}`);
      console.log(`   Competencies: ${dev.competency_count}`);
    });
    
    // Check if other developers have detailed breakdown (multiple rows per category)
    console.log('\n🔍 DETAILED BREAKDOWN ANALYSIS:');
    console.log('=====================================');
    
    const detailedBreakdown = await sql.query(`
      SELECT actor, competency_category, COUNT(*) as row_count
      FROM competency_scores
      GROUP BY actor, competency_category
      ORDER BY actor, competency_category
    `);
    
    const developerBreakdown = {};
    detailedBreakdown.recordset.forEach(row => {
      if (!developerBreakdown[row.actor]) {
        developerBreakdown[row.actor] = {};
      }
      developerBreakdown[row.actor][row.competency_category] = row.row_count;
    });
    
    Object.entries(developerBreakdown).forEach(([actor, categories]) => {
      console.log(`\n🎯 ${actor}:`);
      Object.entries(categories).forEach(([category, count]) => {
        const status = count === 3 ? '✅ Complete' : count === 1 ? '⚠️  Single row' : '❌ Incomplete';
        console.log(`   ${category}: ${count} rows ${status}`);
      });
      
      const totalRows = Object.values(categories).reduce((sum, count) => sum + count, 0);
      const expectedRows = Object.keys(categories).length * 3;
      const completeness = expectedRows > 0 ? (totalRows / expectedRows) * 100 : 0;
      
      console.log(`   Overall: ${totalRows}/${expectedRows} rows (${completeness.toFixed(1)}% complete)`);
    });
    
    // Check what's missing for other developers
    console.log('\n❌ MISSING DETAILED BREAKDOWN FOR:');
    console.log('=====================================');
    
    const incompleteDevelopers = Object.entries(developerBreakdown).filter(([actor, categories]) => {
      return Object.values(categories).some(count => count < 3);
    });
    
    incompleteDevelopers.forEach(([actor, categories]) => {
      console.log(`\n${actor}:`);
      Object.entries(categories).forEach(([category, count]) => {
        if (count < 3) {
          console.log(`   ${category}: Only ${count}/3 rows (missing ${3 - count} detailed rows)`);
        }
      });
    });
    
    // Check if labels exist for other developers
    console.log('\n🏷️  COMPETENCY LABELS ANALYSIS:');
    console.log('=====================================');
    
    const labelCounts = await sql.query(`
      SELECT actor, COUNT(*) as label_count
      FROM competency_labels
      GROUP BY actor
      ORDER BY label_count DESC
    `);
    
    console.log('Label counts per developer:');
    labelCounts.recordset.forEach((dev, index) => {
      console.log(`${index + 1}. ${dev.actor}: ${dev.label_count} labels`);
    });
    
    // Sample a few non-Fiona developers to see their actual data
    console.log('\n🔎 SAMPLE DATA FOR NON-FIONA DEVELOPERS:');
    console.log('=====================================');
    
    const sampleDevelopers = developerCounts.recordset
      .filter(dev => dev.actor !== 'Fiona Wrigley')
      .slice(0, 3);
    
    for (const dev of sampleDevelopers) {
      console.log(`\n🎯 ${dev.actor} - Detailed Data:`);
      
      const request = new sql.Request();
      request.input('actor', sql.NVarChar, dev.actor);
      
      const devData = await request.query(`
        SELECT competency_category, competency_row, level, confidence, evidence_count
        FROM competency_scores
        WHERE actor = @actor
        ORDER BY competency_category, competency_row
      `);
      
      devData.recordset.forEach(row => {
        console.log(`   ${row.competency_category} | ${row.competency_row} | Level ${row.level} | ${(row.confidence * 100).toFixed(1)}% | ${row.evidence_count} evidences`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sql.close();
  }
}

checkAllDeveloperData();
