// Add sample competency labels to test detailed breakdown
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

async function addSampleLabels() {
  try {
    await sql.connect(config);
    console.log('✅ Connected to database');
    
    // Sample detailed competency scores for Fiona Wrigley
    const sampleScores = [
      // Programming Languages
      {
        competency_category: 'programming-languages',
        competency_row: 'software-engineering',
        level: 3,
        confidence: 0.83,
        evidence_count: 9
      },
      {
        competency_category: 'programming-languages',
        competency_row: 'language-fundamentals',
        level: 2,
        confidence: 0.75,
        evidence_count: 5
      },
      {
        competency_category: 'programming-languages',
        competency_row: 'advanced-concepts',
        level: 3,
        confidence: 0.80,
        evidence_count: 7
      },
      // Databases
      {
        competency_category: 'databases',
        competency_row: 'database-management',
        level: 3,
        confidence: 0.87,
        evidence_count: 12
      },
      {
        competency_category: 'databases',
        competency_row: 'query-optimization',
        level: 3,
        confidence: 0.85,
        evidence_count: 8
      },
      {
        competency_category: 'databases',
        competency_row: 'data-modeling',
        level: 3,
        confidence: 0.82,
        evidence_count: 9
      },
      // Containers & Orchestration
      {
        competency_category: 'containers-orchestration',
        competency_row: 'devops-platform-engineering',
        level: 3,
        confidence: 0.85,
        evidence_count: 11
      },
      {
        competency_category: 'containers-orchestration',
        competency_row: 'containerization',
        level: 3,
        confidence: 0.83,
        evidence_count: 6
      },
      {
        competency_category: 'containers-orchestration',
        competency_row: 'kubernetes',
        level: 3,
        confidence: 0.85,
        evidence_count: 8
      },
      // Testing
      {
        competency_category: 'testing',
        competency_row: 'quality-assurance',
        level: 4,
        confidence: 0.88,
        evidence_count: 14
      },
      {
        competency_category: 'testing',
        competency_row: 'test-automation',
        level: 4,
        confidence: 0.86,
        evidence_count: 10
      },
      {
        competency_category: 'testing',
        competency_row: 'performance-testing',
        level: 3,
        confidence: 0.80,
        evidence_count: 7
      },
      // Collaboration & Process
      {
        competency_category: 'collaboration-process',
        competency_row: 'git-version-control',
        level: 3,
        confidence: 0.87,
        evidence_count: 13
      },
      {
        competency_category: 'collaboration-process',
        competency_row: 'code-review',
        level: 3,
        confidence: 0.87,
        evidence_count: 9
      },
      {
        competency_category: 'collaboration-process',
        competency_row: 'documentation',
        level: 2,
        confidence: 0.78,
        evidence_count: 5
      }
    ];
    
    console.log(`📝 Adding ${sampleScores.length} detailed competency scores for Fiona Wrigley...`);
    
    // Clear existing scores for Fiona Wrigley
    await sql.query('DELETE FROM competency_scores WHERE actor = \'Fiona Wrigley\'');
    
    // Insert new scores
    for (const score of sampleScores) {
      const request = new sql.Request();
      request.input('connector_id', sql.Int, 2);
      request.input('competency_category', sql.NVarChar, score.competency_category);
      request.input('competency_row', sql.NVarChar, score.competency_row);
      request.input('actor', sql.NVarChar, 'Fiona Wrigley');
      request.input('level', sql.Decimal(3, 1), score.level);
      request.input('confidence', sql.Decimal(3, 2), score.confidence);
      request.input('evidence_count', sql.Int, score.evidence_count);
      
      await request.query(`
        INSERT INTO competency_scores (
          connector_id, competency_category, competency_row, actor, 
          level, confidence, evidence_count, last_updated
        ) VALUES (@connector_id, @competency_category, @competency_row, @actor, 
          @level, @confidence, @evidence_count, GETDATE())
      `);
    }
    
    console.log('✅ Detailed competency scores added successfully!');
    
    // Show results
    const finalResult = await sql.query(`
      SELECT competency_category, competency_row, level, confidence, evidence_count
      FROM competency_scores
      WHERE actor = 'Fiona Wrigley'
      ORDER BY competency_category, competency_row
    `);
    
    console.log('\n🎯 FIONA WRIGLEY - DETAILED COMPETENCY BREAKDOWN:');
    finalResult.recordset.forEach(row => {
      console.log(`${row.competency_category} | ${row.competency_row} | Level ${row.level} | ${(row.confidence * 100).toFixed(1)}% | ${row.evidence_count} evidences`);
    });
    
    console.log(`\n📊 Total competencies: ${finalResult.recordset.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sql.close();
  }
}

addSampleLabels();
