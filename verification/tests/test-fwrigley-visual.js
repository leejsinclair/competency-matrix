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
    
    console.log('=== FIONA WRIGLEY - VISUAL MATRIX LAYOUT ===');
    
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
          const cellStyle = await firstCell.getAttribute('style');
          
          // Check if this is a category header (has colspan)
          const colspan = await firstCell.getAttribute('colspan');
          
          if (colspan) {
            console.log(`\n📂 Category ${++categoryIndex}: ${cellText}`);
          } else {
            // This is a competency row
            const cells = await row.$$('td');
            const competencyName = await cells[0].textContent();
            
            console.log(`\n🎯 Competency: ${competencyName}`);
            
            // Check each level cell
            for (let level = 1; level < cells.length; level++) {
              const levelCell = cells[level];
              const cellText = await levelCell.textContent();
              const cellStyle = await levelCell.getAttribute('style');
              
              if (cellText && cellText.trim() !== '-') {
                console.log(`  Level ${level}: ${cellText.trim()} (Colored: ${cellStyle?.includes('background-color')})`);
              }
            }
          }
        }
      }
    }
    
    // Check detailed report
    console.log('\n=== DETAILED REPORT SECTIONS ===');
    const detailedSections = await page.$$('.p-3.bg-gray-50.rounded');
    console.log(`Detailed report sections: ${detailedSections.length}`);
    
    for (const section of detailedSections) {
      const competencyName = await section.$('h5');
      if (competencyName) {
        const name = await competencyName.textContent();
        console.log(`📋 Report: ${name}`);
      }
    }
    
    // Take screenshot
    await page.screenshot({ path: 'fwrigley-visual-test.png', fullPage: true });
    console.log('\nScreenshot saved to fwrigley-visual-test.png');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
})();
