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
    
    console.log('=== DIRECT EMPTY CELLS TEST ===');
    
    // Find all cells with "Not yet achieved" text
    const notYetAchievedCells = await page.$$('td:has-text("Not yet achieved")');
    console.log(`Found ${notYetAchievedCells.length} cells with "Not yet achieved"`);
    
    // Test a few of them
    for (let i = 0; i < Math.min(3, notYetAchievedCells.length); i++) {
      const cell = notYetAchievedCells[i];
      const style = await cell.getAttribute('style');
      const text = await cell.textContent();
      
      console.log(`\nEmpty Cell ${i + 1}:`);
      console.log(`  Style: ${style}`);
      console.log(`  Text: "${text}"`);
      console.log(`  Background: ${style?.includes('f3f4f6') ? 'Light gray (correct)' : 'Other color'}`);
    }
    
    // Find all cells by background color
    const lightGrayCells = await page.$$('td[style*="f3f4f6"]');
    const grayCells = await page.$$('td[style*="e5e7eb"]');
    const coloredCells = await page.$$('td[style*="10b981"], td[style*="f59e0b"], td[style*="ef4444"], td[style*="8b5cf6"]');
    
    console.log(`\n📊 Color-based cell count:`);
    console.log(`  Light gray cells (empty): ${lightGrayCells.length}`);
    console.log(`  Gray cells (filled): ${grayCells.length}`);
    console.log(`  Colored cells (active): ${coloredCells.length}`);
    console.log(`  Total: ${lightGrayCells.length + grayCells.length + coloredCells.length}`);
    
    // Check if light gray cells have descriptions
    if (lightGrayCells.length > 0) {
      console.log('\n⚪ Testing light gray cell descriptions:');
      
      for (let i = 0; i < Math.min(3, lightGrayCells.length); i++) {
        const cell = lightGrayCells[i];
        const text = await cell.textContent();
        
        console.log(`  Light Gray Cell ${i + 1}:`);
        console.log(`    Text: ${text.substring(0, 80)}...`);
        console.log(`    Has description: ${text.length > 20}`);
        console.log(`    Has "Not yet achieved": ${text.includes('Not yet achieved')}`);
      }
    }
    
    // Take screenshot
    await page.screenshot({ path: 'empty-cells-direct-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved to empty-cells-direct-test.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();
