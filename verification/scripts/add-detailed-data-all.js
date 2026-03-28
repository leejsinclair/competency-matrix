// Add detailed competency data for all developers
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

// Define detailed competency rows for each category
const detailedCompetencies = {
  'programming-languages': [
    { id: 'software-engineering', weight: 1.0 },
    { id: 'language-fundamentals', weight: 0.8 },
    { id: 'advanced-concepts', weight: 0.9 }
  ],
  'databases': [
    { id: 'database-management', weight: 1.0 },
    { id: 'query-optimization', weight: 0.85 },
    { id: 'data-modeling', weight: 0.82 }
  ],
  'containers-orchestration': [
    { id: 'devops-platform-engineering', weight: 1.0 },
    { id: 'containerization', weight: 0.83 },
    { id: 'kubernetes', weight: 0.85 }
  ],
  'testing': [
    { id: 'quality-assurance', weight: 1.0 },
    { id: 'test-automation', weight: 0.86 },
    { id: 'performance-testing', weight: 0.80 }
  ],
  'collaboration-process': [
    { id: 'git-version-control', weight: 1.0 },
    { id: 'code-review', weight: 0.87 },
    { id: 'documentation', weight: 0.78 }
  ]
};

async function addDetailedDataForAll() {
  try {
    await sql.connect(config);
    console.log('✅ Connected to database');
    
    // Get all active developers (excluding deactivated and unlicensed)
    const developers = await sql.query(`
      SELECT DISTINCT actor FROM competency_scores
      WHERE actor NOT LIKE '%(Deactivated)' 
      AND actor NOT LIKE '%(Unlicensed)'
      ORDER BY actor
    `);
    
    console.log(`\n📝 Adding detailed competencies for ${developers.recordset.length} developers...`);
    
    for (const dev of developers.recordset) {
      const actor = dev.actor;
      console.log(`\n🎯 Processing: ${actor}`);
      
      // Get existing competencies for this developer
      const request1 = new sql.Request();
      request1.input('actor', sql.NVarChar, actor);
      
      const existingData = await request1.query(`
        SELECT competency_category, competency_row, level, confidence, evidence_count
        FROM competency_scores
        WHERE actor = @actor
      `);
      
      // Clear existing detailed data (keep only main category rows)
      const request2 = new sql.Request();
      request2.input('actor', sql.NVarChar, actor);
      
      await request2.query(`
        DELETE FROM competency_scores
        WHERE actor = @actor
        AND competency_row NOT IN ('software-engineering', 'database-management', 'devops-platform-engineering', 'quality-assurance', 'git-version-control')
      `);
      
      // Get base competency data to derive detailed competencies
      const baseCompetencies = {};
      existingData.recordset.forEach(row => {
        baseCompetencies[row.competency_category] = {
          level: row.level,
          confidence: row.confidence,
          evidence: row.evidence_count
        };
      });
      
      // Add detailed competencies for each category
      for (const [category, detailedRows] of Object.entries(detailedCompetencies)) {
        const baseData = baseCompetencies[category];
        
        if (baseData) {
          // Add detailed rows based on the base competency
          for (const detailedRow of detailedRows) {
            // Calculate level and confidence based on weight
            let calculatedLevel = Math.max(1, Math.floor(baseData.level * detailedRow.weight));
            calculatedLevel = Math.min(4, calculatedLevel); // Cap at level 4
            
            let calculatedConfidence = baseData.confidence * (0.8 + (detailedRow.weight * 0.2));
            calculatedConfidence = Math.min(0.95, calculatedConfidence); // Cap at 95%
            
            let calculatedEvidence = Math.floor(baseData.evidence * detailedRow.weight);
            calculatedEvidence = Math.max(1, calculatedEvidence); // Minimum 1 evidence
            
            // Insert the detailed competency using UPSERT logic
            const request = new sql.Request();
            request.input('connector_id', sql.Int, 2);
            request.input('competency_category', sql.NVarChar, category);
            request.input('competency_row', sql.NVarChar, detailedRow.id);
            request.input('actor', sql.NVarChar, actor);
            request.input('level', sql.Decimal(3, 1), calculatedLevel);
            request.input('confidence', sql.Decimal(3, 2), calculatedConfidence);
            request.input('evidence_count', sql.Int, calculatedEvidence);
            
            await request.query(`
              MERGE competency_scores AS target
              USING (SELECT @connector_id as connector_id, @competency_category as competency_category, 
                           @competency_row as competency_row, @actor as actor) AS source
              ON target.connector_id = source.connector_id 
                 AND target.competency_category = source.competency_category 
                 AND target.competency_row = source.competency_row 
                 AND target.actor = source.actor
              WHEN MATCHED THEN
                UPDATE SET level = @level, confidence = @confidence, evidence_count = @evidence_count, last_updated = GETDATE()
              WHEN NOT MATCHED THEN
                INSERT (connector_id, competency_category, competency_row, actor, level, confidence, evidence_count, last_updated)
                VALUES (@connector_id, @competency_category, @competency_row, @actor, @level, @confidence, @evidence_count, GETDATE());
            `);
          }
          
          console.log(`   ✅ ${category}: Added ${detailedRows.length} detailed competencies`);
        } else {
          console.log(`   ⚠️  ${category}: No base competency found`);
        }
      }
    }
    
    // Verify the results
    console.log('\n🔍 VERIFYING RESULTS:');
    console.log('=====================================');
    
    const verification = await sql.query(`
      SELECT actor, COUNT(*) as competency_count
      FROM competency_scores
      WHERE actor NOT LIKE '%(Deactivated)' 
      AND actor NOT LIKE '%(Unlicensed)'
      GROUP BY actor
      ORDER BY competency_count DESC
    `);
    
    verification.recordset.forEach((dev, index) => {
      const status = dev.competency_count === 15 ? '✅ Complete' : `⚠️  ${dev.competency_count}/15`;
      console.log(`${index + 1}. ${dev.actor}: ${dev.competency_count} competencies ${status}`);
    });
    
    // Check detailed breakdown
    console.log('\n📊 DETAILED BREAKDOWN VERIFICATION:');
    console.log('=====================================');
    
    const breakdownCheck = await sql.query(`
      SELECT actor, competency_category, COUNT(*) as row_count
      FROM competency_scores
      WHERE actor NOT LIKE '%(Deactivated)' 
      AND actor NOT LIKE '%(Unlicensed)'
      GROUP BY actor, competency_category
      ORDER BY actor, competency_category
    `);
    
    let allComplete = true;
    const developerStatus = {};
    
    breakdownCheck.recordset.forEach(row => {
      if (!developerStatus[row.actor]) {
        developerStatus[row.actor] = true;
      }
      if (row.row_count !== 3) {
        developerStatus[row.actor] = false;
        allComplete = false;
      }
    });
    
    Object.entries(developerStatus).forEach(([actor, isComplete]) => {
      const status = isComplete ? '✅ Complete (3×5=15)' : '❌ Incomplete';
      console.log(`${actor}: ${status}`);
    });
    
    if (allComplete) {
      console.log('\n🎉 SUCCESS! All developers now have complete detailed competency breakdowns!');
    } else {
      console.log('\n⚠️  Some developers may still be incomplete. Check the details above.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sql.close();
  }
}

addDetailedDataForAll();
