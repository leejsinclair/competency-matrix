#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

// Database connection setup
const { DatabaseConnection } = require('../dist/database/connection');

/**
 * Full Processing Script - Complete Competency Matrix Data Processing
 * 
 * This script performs:
 * 1. Database cleanup
 * 2. Confluence data processing
 * 3. Competency scoring
 * 4. Evidence traceability
 * 5. Matrix generation
 */

async function fullProcessing() {
  console.log('🚀 Starting Full Competency Matrix Processing...');
  console.log('=' .repeat(60));
  
  const startTime = Date.now();
  
  try {
    // Step 1: Database Setup and Cleanup
    console.log('\n📋 Step 1: Database Setup and Cleanup');
    console.log('-'.repeat(40));
    
    const db = DatabaseConnection.getInstance();
    await db.connect();
    console.log('✅ Connected to database');
    
    // Clear existing data
    console.log('🧹 Clearing existing competency data...');
    await db.query('DELETE FROM competency_labels WHERE connector_id = 2');
    await db.query('DELETE FROM events WHERE connector_id = 2');
    await db.query('DELETE FROM competency_scores');
    console.log('✅ Database cleared');
    
    // Step 2: Check if Confluence data exists
    console.log('\n📚 Step 2: Checking Confluence Data');
    console.log('-'.repeat(40));
    
    const pagesPath = './_content/confluence/processed/processed-pages.json';
    try {
      await fs.access(pagesPath);
      const pagesData = await fs.readFile(pagesPath, 'utf-8');
      const pages = JSON.parse(pagesData);
      console.log(`✅ Found ${pages.length} processed Confluence pages`);
    } catch (error) {
      console.log('❌ No processed Confluence data found. Please run Confluence connector first.');
      console.log('💡 Run: npm run connector:confluence');
      return;
    }
    
    // Step 3: Process Confluence Data with Detailed Sub-Competencies
    console.log('\n🔍 Step 3: Processing Confluence Data with Detailed Sub-Competencies');
    console.log('-'.repeat(40));
    
    try {
      console.log('Running: node scripts/process-confluence-detailed-subcompetencies.js');
      execSync('node scripts/process-confluence-detailed-subcompetencies.js', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Confluence processing completed');
    } catch (error) {
      console.log('❌ Confluence processing failed:', error.message);
      return;
    }
    
    // Step 4: Generate Competency Scores
    console.log('\n📊 Step 4: Generating Competency Scores');
    console.log('-'.repeat(40));
    
    try {
      console.log('Running: node scripts/generate-competency-scores.js');
      execSync('node scripts/generate-competency-scores.js', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Competency scores generated');
    } catch (error) {
      console.log('❌ Score generation failed:', error.message);
      return;
    }
    
    // Step 5: Initialize Evidence Traceability
    console.log('\n🔗 Step 5: Initializing Evidence Traceability');
    console.log('-'.repeat(40));
    
    try {
      console.log('Running: node scripts/init-evidence-schema-fixed.js');
      execSync('node scripts/init-evidence-schema-fixed.js', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Evidence traceability initialized');
    } catch (error) {
      console.log('⚠️ Evidence traceability initialization failed (non-critical):', error.message);
    }
    
    // Step 6: Verify Processing Results
    console.log('\n✅ Step 6: Verifying Processing Results');
    console.log('-'.repeat(40));
    
    try {
      // Check database tables
      const labelCount = await db.query('SELECT COUNT(*) as count FROM competency_labels WHERE connector_id = 2');
      const eventCount = await db.query('SELECT COUNT(*) as count FROM events WHERE connector_id = 2');
      const scoreCount = await db.query('SELECT COUNT(*) as count FROM competency_scores');
      
      console.log(`📈 Processing Results:`);
      console.log(`   - Competency Labels: ${labelCount.recordset[0].count}`);
      console.log(`   - Events: ${eventCount.recordset[0].count}`);
      console.log(`   - Competency Scores: ${scoreCount.recordset[0].count}`);
      
      // Check for specific developers
      const developers = await db.query(`
        SELECT DISTINCT actor 
        FROM competency_scores 
        WHERE actor IS NOT NULL 
        ORDER BY actor
      `);
      
      console.log(`   - Developers with scores: ${developers.recordset.length}`);
      developers.recordset.forEach(dev => {
        console.log(`     * ${dev.actor}`);
      });
      
    } catch (error) {
      console.log('❌ Verification failed:', error.message);
    }
    
    // Step 7: Test API Endpoints
    console.log('\n🌐 Step 7: Testing API Endpoints');
    console.log('-'.repeat(40));
    
    try {
      // Test team endpoint
      console.log('Testing team endpoint...');
      const teamResponse = await fetch('http://localhost:3001/api/matrix/team');
      if (teamResponse.ok) {
        const teamData = await teamResponse.json();
        console.log(`✅ Team endpoint: ${teamData.data?.developers?.length || 0} developers`);
      } else {
        console.log('❌ Team endpoint failed');
      }
      
      // Test individual developer endpoint
      if (developers && developers.recordset.length > 0) {
        const testDeveloper = developers.recordset[0].actor;
        console.log(`Testing developer endpoint for ${testDeveloper}...`);
        
        const devResponse = await fetch(`http://localhost:3001/api/matrix/developer/${encodeURIComponent(testDeveloper)}`);
        if (devResponse.ok) {
          const devData = await devResponse.json();
          const categories = Object.keys(devData.data?.categories || {});
          const achievedCategories = categories.filter(cat => {
            const rows = devData.data.categories[cat]?.rows || [];
            return rows.some(row => row.level > 0);
          });
          
          console.log(`✅ Developer endpoint: ${achievedCategories.length}/${categories.length} categories with achievements`);
          
          // Show sample achievements
          achievedCategories.slice(0, 3).forEach(cat => {
            const rows = devData.data.categories[cat].rows;
            rows.forEach(row => {
              if (row.level > 0) {
                console.log(`     ✅ ${cat} > ${row.id}: Level ${row.level} (${row.evidenceCount} evidence)`);
              }
            });
          });
        } else {
          console.log('❌ Developer endpoint failed');
        }
      }
      
    } catch (error) {
      console.log('❌ API testing failed:', error.message);
    }
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n' + '=' .repeat(60));
    console.log(`🎉 Full Processing Completed Successfully!`);
    console.log(`⏱️  Total Duration: ${duration} seconds`);
    console.log('=' .repeat(60));
    
    console.log('\n📋 Next Steps:');
    console.log('1. Check frontend: http://localhost:5173/matrix');
    console.log('2. Select a developer to see green highlighted cells');
    console.log('3. Ctrl+Click on green cells to view evidence');
    console.log('4. Verify evidence modal shows detailed contributing factors');
    
  } catch (error) {
    console.error('\n💥 Full Processing Failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    // Close database connection
    try {
      const db = DatabaseConnection.getInstance();
      if (db.isConnected()) {
        await db.disconnect();
        console.log('✅ Database connection closed');
      }
    } catch (error) {
      console.log('⚠️ Error closing database:', error.message);
    }
  }
}

// Run the full processing
if (require.main === module) {
  fullProcessing().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { fullProcessing };
