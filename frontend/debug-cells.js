const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5173/simple-matrix');
    await page.waitForTimeout(3000);
    
    // Select Chaprel John Villegas
    const developerSelect = await page.$('select');
    await developerSelect.selectOption({ label: 'Chaprel John Villegas' });
    await page.waitForTimeout(3000);
    
    console.log('=== DEBUG CELL ANALYSIS ===');
    
    // Look at the first competency row in detail
    const table = await page.$('table');
    const rows = await table.$$('tr');
    
    // Find the first competency row (skip headers)
    let competencyRow = null;
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const firstCell = await row.$('td:first-child');
      const colspan = await firstCell?.getAttribute('colspan');
      
      if (!colspan) {
        competencyRow = row;
        break;
      }
    }
    
    if (competencyRow) {
      const cells = await competencyRow.$$('td');
      const competencyName = await cells[0].textContent();
      
      console.log(`\n🎯 Analyzing: ${competencyName}`);
      
      for (let i = 1; i < cells.length; i++) {
        const cell = cells[i];
        const style = await cell.getAttribute('style') || '';
        const text = await cell.textContent();
        
        console.log(`\nLevel ${i} cell:`);
        console.log(`  Style: ${style}`);
        console.log(`  Text: "${text}"`);
        console.log(`  Background: ${style.includes('background-color') ? style.match(/background-color: ([^;]+)/)?.[1] : 'none'}`);
      }
    }
    
    // Check all cells for background colors
    console.log('\n🔍 All cell background colors:');
    
    let colorCounts = {};
    let totalCells = 0;
    
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
        const colorMatch = style.match(/background-color: ([^;]+)/);
        const color = colorMatch ? colorMatch[1] : 'none';
        
        colorCounts[color] = (colorCounts[color] || 0) + 1;
        totalCells++;
      }
    }
    
    console.log('  Color distribution:');
    Object.entries(colorCounts).forEach(([color, count]) => {
      console.log(`    ${color}: ${count} cells`);
    });
    console.log(`  Total cells: ${totalCells}`);
    
    // Take screenshot
    await page.screenshot({ path: 'debug-cells.png', fullPage: true });
    console.log('\n📸 Screenshot saved to debug-cells.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();
