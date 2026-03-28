const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5173/simple-matrix');
    await page.waitForTimeout(3000);
    
    // Select Fiona Wrigley
    const developerSelect = await page.$('select');
    await developerSelect.selectOption({ label: 'Fiona Wrigley' });
    await page.waitForTimeout(3000);
    
    console.log('=== ALL DESCRIPTIONS TEST ===');
    
    // Find all cells with descriptions (both active and filled)
    const descriptionCells = await page.$$('td:has-text("Designs")');
    const allFilledCells = await page.$$('td[style*="background-color"]:not([style*="f3f4f6"])');
    
    console.log(`Found ${allFilledCells.length} filled cells with background colors`);
    console.log(`Found ${descriptionCells.length} cells with descriptions`);
    
    // Check different types of cells
    console.log('\n🔍 Analyzing cell types:');
    
    let activeCells = 0;
    let filledCells = 0;
    let emptyCells = 0;
    
    const table = await page.$('table');
    const rows = await table.$$('tr');
    
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
    
    // Test a few cells to see their content
    console.log('\n📝 Testing cell content:');
    
    // Find an active cell
    const activeCell = await page.$('td[style*="10b981"], td[style*="f59e0b"], td[style*="ef4444"], td[style*="8b5cf6"]');
    if (activeCell) {
      const activeText = await activeCell.textContent();
      console.log(`\n🎯 Active cell content:`);
      console.log(activeText.substring(0, 100) + '...');
      
      // Click to toggle
      await activeCell.click();
      await page.waitForTimeout(500);
      
      const clickedText = await activeCell.textContent();
      console.log(`\n📊 After click:`);
      console.log(clickedText);
      
      // Click back
      await activeCell.click();
      await page.waitForTimeout(500);
    }
    
    // Find a filled cell (gray)
    const filledCell = await page.$('td[style*="e5e7eb"]');
    if (filledCell) {
      const filledText = await filledCell.textContent();
      console.log(`\n🔘 Filled cell content:`);
      console.log(filledText.substring(0, 100) + '...');
    }
    
    // Test multiple active cells
    console.log('\n🧪 Testing multiple active cells...');
    const activeCellsList = await page.$$('td[style*="10b981"], td[style*="f59e0b"], td[style*="ef4444"], td[style*="8b5cf6"]');
    
    for (let i = 0; i < Math.min(3, activeCellsList.length); i++) {
      const cell = activeCellsList[i];
      const text = await cell.textContent();
      
      console.log(`\nCell ${i + 1}:`);
      console.log(`  Has description: ${text.length > 20}`);
      console.log(`  Has competency text: ${text.includes('Designs') || text.includes('Understanding') || text.includes('Building')}`);
      
      // Test click toggle
      await cell.click();
      await page.waitForTimeout(300);
      
      const clickedText = await cell.textContent();
      const hasConfidence = clickedText.includes('confidence');
      
      await cell.click();
      await page.waitForTimeout(300);
      
      console.log(`  Toggle works: ${hasConfidence}`);
    }
    
    // Take screenshot
    await page.screenshot({ path: 'all-descriptions-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved to all-descriptions-test.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();
