const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Capture console logs to see the API response
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
      if (msg.text().includes('📡 Matrix API response:')) {
        console.log('🔍 FOUND API RESPONSE:', msg.text());
      }
    });
    
    await page.goto('http://localhost:5173/simple-matrix');
    await page.waitForTimeout(3000);
    
    // Select "Fiona Wrigley" from dropdown
    const developerSelect = await page.$('select');
    if (developerSelect) {
      await developerSelect.selectOption({ label: 'Fiona Wrigley' });
      console.log('🎯 Selected Fiona Wrigley from dropdown');
      await page.waitForTimeout(3000);
    }
    
    // Extract the API response from console logs
    const apiResponseLogs = consoleMessages.filter(msg => 
      msg.includes('📡 Matrix API response:')
    );
    
    console.log('=== API DATA STRUCTURE ANALYSIS ===');
    console.log('Number of API response logs found:', apiResponseLogs.length);
    
    if (apiResponseLogs.length > 0) {
      // Try to parse the JSON from the console log
      const lastLog = apiResponseLogs[apiResponseLogs.length - 1];
      const jsonMatch = lastLog.match(/\{.*\}/);
      
      if (jsonMatch) {
        try {
          const apiData = JSON.parse(jsonMatch[0]);
          console.log('✅ Successfully parsed API data');
          
          // Analyze the structure
          console.log('\n📋 API DATA STRUCTURE:');
          console.log('Success:', apiData.success);
          console.log('Data keys:', Object.keys(apiData.data || {}));
          
          if (apiData.data?.categories) {
            console.log('\n🗂️ CATEGORIES FOUND:');
            Object.keys(apiData.data.categories).forEach(categoryKey => {
              const categoryData = apiData.data.categories[categoryKey];
              console.log(`  ${categoryKey}: ${Array.isArray(categoryData) ? categoryData.length : 'not array'} items`);
              
              if (Array.isArray(categoryData) && categoryData.length > 0) {
                console.log(`    Sample item:`, JSON.stringify(categoryData[0], null, 2));
              }
            });
          }
          
          // Check what competency rows actually exist
          console.log('\n🎯 EXPECTED VS ACTUAL ROWS:');
          const expectedRows = {
            'programming-languages': ['software-engineering', 'language-fundamentals', 'advanced-concepts'],
            'databases': ['database-management', 'query-optimization', 'data-modeling'],
            'containers-orchestration': ['devops-platform-engineering', 'containerization', 'kubernetes'],
            'testing': ['quality-assurance', 'test-automation', 'performance-testing'],
            'collaboration-process': ['git-version-control', 'code-review', 'documentation']
          };
          
          Object.entries(expectedRows).forEach(([category, rows]) => {
            const actualData = apiData.data?.categories?.[category] || [];
            const actualRows = actualData.map(item => item.row);
            
            console.log(`\n  ${category}:`);
            console.log(`    Expected: ${rows.join(', ')}`);
            console.log(`    Actual:   ${actualRows.join(', ')}`);
            
            const missing = rows.filter(row => !actualRows.includes(row));
            const extra = actualRows.filter(row => !rows.includes(row));
            
            if (missing.length > 0) {
              console.log(`    ❌ Missing: ${missing.join(', ')}`);
            }
            if (extra.length > 0) {
              console.log(`    ➕ Extra: ${extra.join(', ')}`);
            }
          });
          
        } catch (parseError) {
          console.log('❌ Failed to parse API response:', parseError.message);
        }
      }
    }
    
    // Take screenshot
    await page.screenshot({ path: 'debug-api-data.png', fullPage: true });
    console.log('\nScreenshot saved to debug-api-data.png');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
})();
