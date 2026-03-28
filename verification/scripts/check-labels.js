// Check what competency labels exist in the database
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
      password: 'Your_password123'
    }
  }
};

async function checkCompetencyLabels() {
  try {
    await sql.connect(config);
    console.log('✅ Connected to database');
    
    // Check what competency labels exist
    const labelsResult = await sql.query(`
      SELECT DISTINCT 
        competency_category,
        competency_row,
        COUNT(*) as label_count,
        COUNT(DISTINCT actor) as actor_count,
        AVG(CAST(confidence AS FLOAT)) as avg_confidence
      FROM competency_labels
      GROUP BY competency_category, competency_row
      ORDER BY competency_category, competency_row
    `);
    
    console.log('\n=== COMPETENCY LABELS BREAKDOWN ===');
    labelsResult.recordset.forEach(row => {
      console.log(`${row.competency_category} | ${row.competency_row} | ${row.label_count} labels | ${row.actor_count} actors | ${(row.avg_confidence * 100).toFixed(1)}% avg confidence`);
    });
    
    // Check Fiona Wrigley specifically
    const fionaResult = await sql.query(`
      SELECT competency_category, competency_row, level, confidence, event_id
      FROM competency_labels
      WHERE actor = 'Fiona Wrigley'
      ORDER BY competency_category, competency_row
    `);
    
    console.log('\n=== FIONA WRIGLEY - DETAILED LABELS ===');
    fionaResult.recordset.forEach(row => {
      console.log(`${row.competency_category} | ${row.competency_row} | Level ${row.level} | ${(row.confidence * 100).toFixed(1)}% | Event ${row.event_id}`);
    });
    
    // Check what categories and rows should exist
    console.log('\n=== EXPECTED VS ACTUAL ===');
    const expected = {
      'programming-languages': ['software-engineering', 'language-fundamentals', 'advanced-concepts'],
      'databases': ['database-management', 'query-optimization', 'data-modeling'],
      'containers-orchestration': ['devops-platform-engineering', 'containerization', 'kubernetes'],
      'testing': ['quality-assurance', 'test-automation', 'performance-testing'],
      'collaboration-process': ['git-version-control', 'code-review', 'documentation']
    };
    
    Object.entries(expected).forEach(([category, rows]) => {
      const actual = fionaResult.recordset
        .filter(row => row.competency_category === category)
        .map(row => row.competency_row);
      
      console.log(`\n${category}:`);
      console.log(`  Expected: ${rows.join(', ')}`);
      console.log(`  Actual:   ${actual.join(', ')}`);
      
      const missing = rows.filter(row => !actual.includes(row));
      if (missing.length > 0) {
        console.log(`  ❌ Missing: ${missing.join(', ')}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sql.close();
  }
}

checkCompetencyLabels();
