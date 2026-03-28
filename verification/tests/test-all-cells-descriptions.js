const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5173/simple-matrix');
    await page.waitForTimeout(3000);
    
    // Select Chaprel John Villegas (has mixed levels)
    const developerSelect = await page.$('select');
    await developerSelect.selectOption({ label: 'Chaprel John Villegas' });
    await page.waitForTimeout(3000);
    
    console.log('=== ALL CELLS DESCRIPTIONS TEST ===');
    
    // Analyze all cell types
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
    
    // Test each cell type
    console.log('\n🎯 Testing active cells (colored):');
    const activeCellList = await page.$$('td[style*="10b981"], td[style*="f59e0b"], td[style*="ef4444"], td[style*="8b5cf6"]');
    
    for (let i = 0; i < Math.min(2, activeCellList.length); i++) {
      const cell = activeCellList[i];
      const text = await cell.textContent();
      
      console.log(`  Cell ${i + 1}: ${text.substring(0, 60)}...`);
      console.log(`    Has description: ${text.length > 30}`);
      console.log(`    Has "Click for": ${text.includes('Click for')}`);
    }
    
    console.log('\n🔘 Testing filled cells (gray):');
    const filledCellList = await page.$$('td[style*="e5e7eb"]');
    
    for (let i = 0; i < Math.min(2, filledCellList.length); i++) {
      const cell = filledCellList[i];
      const text = await cell.textContent();
      
      console.log(`  Cell ${i + 1}: ${text.substring(0, 60)}...`);
      console.log(`    Has description: ${text.length > 30}`);
    }
    
    console.log('\n⚪ Testing empty cells (light gray):');
    const emptyCellList = await page.$$('td[style*="f3f4f6"]');
    
    for (let i = 0; i < Math.min(2, emptyCellList.length); i++) {
      const cell = emptyCellList[i];
      const text = await cell.textContent();
      
      console.log(`  Cell ${i + 1}: ${text.substring(0, 60)}...`);
      console.log(`    Has description: ${text.length > 30}`);
      console.log(`    Has "Not yet achieved": ${text.includes('Not yet achieved')}`);
    }
    
    // Test flashcard functionality on active cells
    console.log('\n🔄 Testing flashcard toggle:');
    if (activeCellList.length > 0) {
      const testCell = activeCellList[0];
      
      const beforeText = await testCell.textContent();
      console.log(`  Before click: ${beforeText.substring(0, 40)}...`);
      
      await testCell.click();
      await page.waitForTimeout(500);
      
      const afterText = await testCell.textContent();
      console.log(`  After click: ${afterText.substring(0, 40)}...`);
      console.log(`  Shows confidence: ${afterText.includes('confidence')}`);
      
      await testCell.click();
      await page.waitForTimeout(500);
      
      const backText = await testCell.textContent();
      console.log(`  After second click: ${backText.substring(0, 40)}...`);
      console.log(`  Toggle works: ${backText.includes('Click for')}`);
    }
    
    // Take screenshot
    await page.screenshot({ path: 'all-cells-descriptions-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved to all-cells-descriptions-test.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();
