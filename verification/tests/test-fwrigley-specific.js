const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5173/simple-matrix');
    await page.waitForTimeout(3000);
    
    // Select "Fiona Wrigley" from dropdown
    const developerSelect = await page.$('select');
    if (developerSelect) {
      await developerSelect.selectOption({ label: 'Fiona Wrigley' });
      console.log('🎯 Selected Fiona Wrigley from dropdown');
      await page.waitForTimeout(3000);
    }
    
    console.log('=== FIONA WRIGLEY - SPECIFIC COMPETENCY BREAKDOWN ===');
    
    // Map the actual competency names to the requested ones
    const competencyMapping = {
      'Software Engineering': 'Programming Fundamentals (mapped from Software Engineering)',
      'Advanced Concepts': 'Advanced Concepts',
      'Database Management': 'Query Optimization & Data Modeling (combined in Database Management)',
      'Quality Assurance': 'Test Automation & Performance Testing (combined in Quality Assurance)'
    };
    
    // Get detailed report sections
    const detailedSections = await page.$$('.p-3.bg-gray-50.rounded');
    
    const results = {};
    
    for (const section of detailedSections) {
      const competencyName = await section.$('h5');
      if (competencyName) {
        const name = await competencyName.textContent();
        const fullText = await section.textContent();
        
        // Extract metrics
        const levelMatch = fullText?.match(/Level (\d+) - (\w+)/);
        const confidenceMatch = fullText?.match(/(\d+\.\d+)% confidence/);
        const evidenceMatch = fullText?.match(/(\d+) data points/);
        
        if (levelMatch && confidenceMatch) {
          results[name] = {
            level: parseInt(levelMatch[1]),
            levelName: levelMatch[2],
            confidence: parseFloat(confidenceMatch[1]),
            evidenceCount: parseInt(evidenceMatch?.[1] || '0')
          };
        }
      }
    }
    
    // Display results for the specific competencies requested
    console.log('\n📋 REQUESTED COMPETENCY SCORES:');
    
    console.log('\n1. Programming Fundamentals:');
    if (results['Software Engineering']) {
      const se = results['Software Engineering'];
      console.log(`   Level: ${se.level} (${se.levelName})`);
      console.log(`   Confidence: ${se.confidence}%`);
      console.log(`   Evidence: ${se.evidenceCount} data points`);
      console.log(`   📝 Note: Mapped from "Software Engineering" competency`);
    } else {
      console.log('   ❌ No data found');
    }
    
    console.log('\n2. Advanced Concepts:');
    if (results['Advanced Concepts']) {
      const ac = results['Advanced Concepts'];
      console.log(`   Level: ${ac.level} (${ac.levelName})`);
      console.log(`   Confidence: ${ac.confidence}%`);
      console.log(`   Evidence: ${ac.evidenceCount} data points`);
    } else {
      console.log('   ❌ No data found');
    }
    
    console.log('\n3. Query Optimization:');
    if (results['Database Management']) {
      const dm = results['Database Management'];
      console.log(`   Level: ${dm.level} (${dm.levelName})`);
      console.log(`   Confidence: ${dm.confidence}%`);
      console.log(`   Evidence: ${dm.evidenceCount} data points`);
      console.log(`   📝 Note: Combined with "Data Modeling" in "Database Management" competency`);
    } else {
      console.log('   ❌ No data found');
    }
    
    console.log('\n4. Data Modeling:');
    if (results['Database Management']) {
      const dm = results['Database Management'];
      console.log(`   Level: ${dm.level} (${dm.levelName})`);
      console.log(`   Confidence: ${dm.confidence}%`);
      console.log(`   Evidence: ${dm.evidenceCount} data points`);
      console.log(`   📝 Note: Combined with "Query Optimization" in "Database Management" competency`);
    } else {
      console.log('   ❌ No data found');
    }
    
    console.log('\n5. Test Automation:');
    if (results['Quality Assurance']) {
      const qa = results['Quality Assurance'];
      console.log(`   Level: ${qa.level} (${qa.levelName})`);
      console.log(`   Confidence: ${qa.confidence}%`);
      console.log(`   Evidence: ${qa.evidenceCount} data points`);
      console.log(`   📝 Note: Combined with "Performance Testing" in "Quality Assurance" competency`);
    } else {
      console.log('   ❌ No data found');
    }
    
    console.log('\n6. Performance Testing:');
    if (results['Quality Assurance']) {
      const qa = results['Quality Assurance'];
      console.log(`   Level: ${qa.level} (${qa.levelName})`);
      console.log(`   Confidence: ${qa.confidence}%`);
      console.log(`   Evidence: ${qa.evidenceCount} data points`);
      console.log(`   📝 Note: Combined with "Test Automation" in "Quality Assurance" competency`);
    } else {
      console.log('   ❌ No data found');
    }
    
    // Summary table
    console.log('\n📊 SUMMARY TABLE:');
    console.log('Competency                | Level | Confidence | Evidence');
    console.log('--------------------------|-------|------------|----------');
    
    const summaryData = [
      ['Programming Fundamentals', results['Software Engineering']],
      ['Advanced Concepts', results['Advanced Concepts']],
      ['Query Optimization', results['Database Management']],
      ['Data Modeling', results['Database Management']],
      ['Test Automation', results['Quality Assurance']],
      ['Performance Testing', results['Quality Assurance']]
    ];
    
    summaryData.forEach(([competency, data]) => {
      if (data) {
        console.log(`${competency.padEnd(25)} | ${data.level}     | ${data.confidence}%        | ${data.evidenceCount}`);
      } else {
        console.log(`${competency.padEnd(25)} | N/A   | N/A        | N/A`);
      }
    });
    
    // Take screenshot
    await page.screenshot({ path: 'fwrigley-specific-test.png', fullPage: true });
    console.log('\nScreenshot saved to fwrigley-specific-test.png');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
})();
