const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5173/simple-matrix');
    await page.waitForTimeout(3000);
    
    // Select Fiona Wrigley (has higher levels, should show empty cells)
    const developerSelect = await page.$('select');
    await developerSelect.selectOption({ label: 'Fiona Wrigley' });
    await page.waitForTimeout(3000);
    
    console.log('=== FIONA ALL CELLS DESCRIPTIONS TEST ===');
    
    // Analyze the first competency row in detail
    const table = await page.$('table');
    const rows = await table.$$('tr');
    
    // Find the first competency row
    let competencyRow = null;
    let competencyName = '';
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const firstCell = await row.$('td:first-child');
      const colspan = await firstCell?.getAttribute('colspan');
      
      if (!colspan) {
        competencyRow = row;
        competencyName = await firstCell.textContent();
        break;
      }
    }
    
    if (competencyRow) {
      console.log(`\n🎯 Analyzing: ${competencyName}`);
      
      const cells = await competencyRow.$$('td');
      
      for (let i = 1; i < cells.length; i++) {
        const cell = cells[i];
        const style = await cell.getAttribute('style') || '';
        const text = await cell.textContent();
        
        console.log(`\nLevel ${i} cell:`);
        console.log(`  Style: ${style}`);
        console.log(`  Text: "${text}"`);
        console.log(`  Has description: ${text.length > 20}`);
        console.log(`  Has "Not yet achieved": ${text.includes('Not yet achieved')}`);
      }
    }
    
    // Count all cell types
    let activeCells = 0;
    let filledCells = 0;
    let emptyCells = 0;
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const cells = await row.$$('td');
      
      // Skip category header rows
      const firstCell = await cells[0];
      const colspan = await firstCell?.getAttribute('colspan');
      if (colspan) continue;
      
      for (let j = 1; j < cells.length; j++) {
        const cell = cells[j];
        const style = await cell.getAttribute('style') || '';
        
        if (style.includes('f3f4f6')) {
          emptyCells++;
        } else if (style.includes('e5e7eb')) {
          filledCells++;
        } else {
          activeCells++;
        }
      }
    }
    
    console.log(`\n📊 Cell Distribution:`);
    console.log(`  Active cells (colored): ${activeCells}`);
    console.log(`  Filled cells (gray): ${filledCells}`);
    console.log(`  Empty cells (light gray): ${emptyCells}`);
    console.log(`  Total: ${activeCells + filledCells + emptyCells}`);
    
    // Test empty cells specifically
    if (emptyCells > 0) {
      console.log('\n⚪ Testing empty cells (should show "Not yet achieved"):');
      const emptyCellList = await page.$$('td[style*="f3f4f6"]');
      
      for (let i = 0; i < Math.min(3, emptyCellList.length); i++) {
        const cell = emptyCellList[i];
        const text = await cell.textContent();
        
        console.log(`  Empty Cell ${i + 1}: ${text}`);
        console.log(`    Has description: ${text.length > 30}`);
        console.log(`    Has "Not yet achieved": ${text.includes('Not yet achieved')}`);
      }
    }
    
    // Take screenshot
    await page.screenshot({ path: 'fiona-all-cells-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved to fiona-all-cells-test.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();
