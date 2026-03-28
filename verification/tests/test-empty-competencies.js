const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5173/simple-matrix');
    await page.waitForTimeout(3000);
    
    // Get list of developers first
    const developerSelect = await page.$('select');
    const options = await developerSelect.$$('option');
    const developers = [];
    
    for (const option of options) {
      const text = await option.textContent();
      if (text && text !== 'Select a developer...') {
        developers.push(text.trim());
      }
    }
    
    console.log('👥 Available developers:', developers.slice(0, 5));
    
    // Select a developer that might have fewer competencies
    const testDeveloper = developers.find(dev => dev !== 'Fiona Wrigley') || developers[0];
    console.log(`🎯 Testing with: ${testDeveloper}`);
    
    await developerSelect.selectOption({ label: testDeveloper });
    await page.waitForTimeout(3000);
    
    console.log('=== COMPLETE CIRCLECI MATRIX STRUCTURE ===');
    
    // Check matrix structure
    const table = await page.$('table');
    if (table) {
      const rows = await table.$$('tr');
      console.log(`Total table rows: ${rows.length}`);
      
      let categoryIndex = 0;
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const firstCell = await row.$('td:first-child');
        
        if (firstCell) {
          const cellText = await firstCell.textContent();
          
          // Check if this is a category header (has colspan)
          const colspan = await firstCell.getAttribute('colspan');
          
          if (colspan) {
            console.log(`\n📂 Category ${++categoryIndex}: ${cellText}`);
          } else {
            // This is a competency row
            const cells = await row.$$('td');
            const competencyName = await cells[0].textContent();
            
            console.log(`  🎯 Competency: ${competencyName}`);
            
            // Check each level cell
            let hasData = false;
            for (let level = 1; level < cells.length; level++) {
              const levelCell = cells[level];
              const cellText = await levelCell.textContent();
              const cellStyle = await levelCell.getAttribute('style');
              
              if (cellText && cellText.trim() !== '-' && cellText.includes('%')) {
                console.log(`    Level ${level}: ${cellText.trim()} (HAS DATA)`);
                hasData = true;
              } else if (cellText && cellText.trim() !== '-') {
                console.log(`    Level ${level}: ${cellText.trim()} (empty)`);
              }
            }
            
            if (!hasData) {
              console.log(`    ❌ No competency data available`);
            }
          }
        }
      }
    }
    
    // Check detailed report for empty competencies
    console.log('\n=== DETAILED REPORT ANALYSIS ===');
    const detailedSections = await page.$$('.p-3.bg-gray-50.rounded');
    console.log(`Detailed report sections: ${detailedSections.length}`);
    
    let emptyCompetencies = 0;
    let filledCompetencies = 0;
    
    for (const section of detailedSections) {
      const competencyName = await section.$('h5');
      if (competencyName) {
        const name = await competencyName.textContent();
        const sectionText = await section.textContent();
        
        if (sectionText.includes('No data available')) {
          console.log(`📋 Empty: ${name}`);
          emptyCompetencies++;
        } else {
          console.log(`📋 Filled: ${name}`);
          filledCompetencies++;
        }
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`  Filled competencies: ${filledCompetencies}`);
    console.log(`  Empty competencies: ${emptyCompetencies}`);
    console.log(`  Total competencies: ${filledCompetencies + emptyCompetencies}`);
    
    // Take screenshot
    await page.screenshot({ path: 'empty-competencies-test.png', fullPage: true });
    console.log('\nScreenshot saved to empty-competencies-test.png');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
})();
