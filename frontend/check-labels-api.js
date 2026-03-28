// Check what competency labels exist through the API
const fetch = require('node-fetch');

async function checkCompetencyLabels() {
  try {
    console.log('🔍 Checking competency labels through API...');
    
    // Check if there's an endpoint to get raw labels
    const response = await fetch('http://localhost:3001/api/processing/scores');
    const result = await response.json();
    
    console.log('✅ API Response Status:', response.status);
    console.log('✅ API Success:', result.success);
    
    if (result.success && result.data) {
      console.log('\n📊 COMPETENCY SCORES DATA:');
      
      if (Array.isArray(result.data)) {
        console.log(`Total records: ${result.data.length}`);
        
        // Group by category and row
        const grouped = {};
        result.data.forEach(item => {
          const key = `${item.competency_category}|${item.competency_row}`;
          if (!grouped[key]) {
            grouped[key] = [];
          }
          grouped[key].push(item);
        });
        
        console.log('\n=== COMPETENCY BREAKDOWN ===');
        Object.keys(grouped).sort().forEach(key => {
          const items = grouped[key];
          const [category, row] = key.split('|');
          const actors = [...new Set(items.map(item => item.actor))];
          const avgConfidence = items.reduce((sum, item) => sum + item.confidence, 0) / items.length;
          
          console.log(`${category} | ${row} | ${items.length} scores | ${actors.length} actors | ${(avgConfidence * 100).toFixed(1)}% avg`);
          
          // Check for Fiona Wrigley
          const fionaItems = items.filter(item => item.actor === 'Fiona Wrigley');
          if (fionaItems.length > 0) {
            console.log(`  🎯 Fiona Wrigley: Level ${fionaItems[0].level} (${(fionaItems[0].confidence * 100).toFixed(1)}%)`);
          }
        });
        
        // Show Fiona Wrigley's detailed breakdown
        console.log('\n=== FIONA WRIGLEY DETAILED ===');
        const fionaData = result.data.filter(item => item.actor === 'Fiona Wrigley');
        fionaData.forEach(item => {
          console.log(`${item.competency_category} | ${item.competency_row} | Level ${item.level} | ${(item.confidence * 100).toFixed(1)}%`);
        });
        
        // Check what's missing
        console.log('\n=== MISSING COMPETENCIES ===');
        const expected = {
          'programming-languages': ['software-engineering', 'language-fundamentals', 'advanced-concepts'],
          'databases': ['database-management', 'query-optimization', 'data-modeling'],
          'containers-orchestration': ['devops-platform-engineering', 'containerization', 'kubernetes'],
          'testing': ['quality-assurance', 'test-automation', 'performance-testing'],
          'collaboration-process': ['git-version-control', 'code-review', 'documentation']
        };
        
        const fionaCategories = {};
        fionaData.forEach(item => {
          if (!fionaCategories[item.competency_category]) {
            fionaCategories[item.competency_category] = [];
          }
          fionaCategories[item.competency_category].push(item.competency_row);
        });
        
        Object.entries(expected).forEach(([category, rows]) => {
          const actual = fionaCategories[category] || [];
          console.log(`\n${category}:`);
          console.log(`  Expected: ${rows.join(', ')}`);
          console.log(`  Actual:   ${actual.join(', ')}`);
          
          const missing = rows.filter(row => !actual.includes(row));
          if (missing.length > 0) {
            console.log(`  ❌ Missing: ${missing.join(', ')}`);
          } else {
            console.log(`  ✅ Complete!`);
          }
        });
        
      } else {
        console.log('Data is not an array:', typeof result.data);
        console.log('Data:', result.data);
      }
      
    } else {
      console.log('❌ API Error:', result);
    }
    
  } catch (error) {
    console.error('❌ API Check Failed:', error.message);
  }
}

checkCompetencyLabels();
