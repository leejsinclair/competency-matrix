const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5173/simple-matrix');
    await page.waitForTimeout(3000);
    
    // Select Chaprel John Villegas (has Level 2 competencies)
    const developerSelect = await page.$('select');
    await developerSelect.selectOption({ label: 'Chaprel John Villegas' });
    await page.waitForTimeout(3000);
    
    console.log('=== LEVEL 2 DESCRIPTIONS TEST ===');
    
    // Analyze cell types
    const table = await page.$('table');
    const rows = await table.$$('tr');
    
    let activeCells = 0;
    let filledCells = 0;
    let emptyCells = 0;
    
    for (let i = 1; i < rows.length; i++) { // Skip header row
      const row = rows[i];
      const cells = await row.$$('td');
      
      // Skip category header rows
      const firstCell = await cells[0].getAttribute('colspan');
      if (firstCell) continue;
      
      for (let j = 1; j < cells.length; j++) { // Skip competency name column
        const cell = cells[j];
        const style = await cell.getAttribute('style') || '';
        const text = await cell.textContent();
        
        if (style.includes('f3f4f6')) {
          emptyCells++;
        } else if (style.includes('e5e7eb')) {
          filledCells++;
        } else {
          activeCells++;
        }
      }
    }
    
    console.log(`  Active cells (colored): ${activeCells}`);
    console.log(`  Filled cells (gray): ${filledCells}`);
    console.log(`  Empty cells (light gray): ${emptyCells}`);
    console.log(`  Total: ${activeCells + filledCells + emptyCells}`);
    
    // Test filled cells with descriptions
    if (filledCells > 0) {
      console.log('\n🔘 Testing filled cells with descriptions:');
      
      const filledCellList = await page.$$('td[style*="e5e7eb"]');
      
      for (let i = 0; i < Math.min(3, filledCellList.length); i++) {
        const cell = filledCellList[i];
        const text = await cell.textContent();
        
        console.log(`\nFilled Cell ${i + 1}:`);
        console.log(`  Content: ${text}`);
        console.log(`  Has description: ${text.length > 20}`);
        console.log(`  Has competency text: ${text.includes('Designs') || text.includes('Understanding') || text.includes('Building')}`);
      }
    } else {
      console.log('\n❌ No filled cells found');
    }
    
    // Test active cells
    console.log('\n🎯 Testing active cells:');
    
    const activeCellList = await page.$$('td[style*="10b981"], td[style*="f59e0b"], td[style*="ef4444"], td[style*="8b5cf6"]');
    
    for (let i = 0; i < Math.min(3, activeCellList.length); i++) {
      const cell = activeCellList[i];
      const text = await cell.textContent();
      
      console.log(`\nActive Cell ${i + 1}:`);
      console.log(`  Content: ${text.substring(0, 80)}...`);
      console.log(`  Has description: ${text.length > 20}`);
      console.log(`  Has "Click for": ${text.includes('Click for')}`);
    }
    
    // Take screenshot
    await page.screenshot({ path: 'level2-descriptions-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved to level2-descriptions-test.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();
