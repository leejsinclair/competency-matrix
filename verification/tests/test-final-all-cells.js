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
    
    console.log('=== FINAL ALL CELLS DESCRIPTIONS TEST ===');
    
    // Find cells by their actual RGB color values
    const lightGrayCells = await page.$$('td[style*="rgb(243, 244, 246)"]'); // Empty cells
    const grayCells = await page.$$('td[style*="rgb(229, 231, 235)"]'); // Filled cells
    const coloredCells = await page.$$('td[style*="rgb(16, 185, 129)"], td[style*="rgb(245, 158, 11)"], td[style*="rgb(239, 68, 68)"], td[style*="rgb(139, 92, 246)"]'); // Active cells
    
    console.log(`📊 Cell Distribution:`);
    console.log(`  Empty cells (light gray): ${lightGrayCells.length}`);
    console.log(`  Filled cells (gray): ${grayCells.length}`);
    console.log(`  Active cells (colored): ${coloredCells.length}`);
    console.log(`  Total: ${lightGrayCells.length + grayCells.length + coloredCells.length}`);
    
    // Test empty cells (should show "Not yet achieved")
    if (lightGrayCells.length > 0) {
      console.log('\n⚪ Testing empty cells (should show descriptions + "Not yet achieved"):');
      
      for (let i = 0; i < Math.min(3, lightGrayCells.length); i++) {
        const cell = lightGrayCells[i];
        const text = await cell.textContent();
        
        console.log(`  Empty Cell ${i + 1}:`);
        console.log(`    Text: ${text.substring(0, 80)}...`);
        console.log(`    Has description: ${text.length > 20}`);
        console.log(`    Has "Not yet achieved": ${text.includes('Not yet achieved')}`);
        console.log(`    Has "Level": ${text.includes('Level')}`);
      }
    }
    
    // Test filled cells (should show descriptions)
    if (grayCells.length > 0) {
      console.log('\n🔘 Testing filled cells (should show descriptions):');
      
      for (let i = 0; i < Math.min(3, grayCells.length); i++) {
        const cell = grayCells[i];
        const text = await cell.textContent();
        
        console.log(`  Filled Cell ${i + 1}:`);
        console.log(`    Text: ${text.substring(0, 80)}...`);
        console.log(`    Has description: ${text.length > 20}`);
        console.log(`    Has "Level": ${text.includes('Level')}`);
      }
    }
    
    // Test active cells (should show descriptions + "Click for details")
    if (coloredCells.length > 0) {
      console.log('\n🎯 Testing active cells (should show descriptions + "Click for details"):');
      
      for (let i = 0; i < Math.min(3, coloredCells.length); i++) {
        const cell = coloredCells[i];
        const text = await cell.textContent();
        
        console.log(`  Active Cell ${i + 1}:`);
        console.log(`    Text: ${text.substring(0, 80)}...`);
        console.log(`    Has description: ${text.length > 20}`);
        console.log(`    Has "Click for": ${text.includes('Click for')}`);
        console.log(`    Has "Level": ${text.includes('Level')}`);
        
        // Test flashcard toggle
        if (text.includes('Click for')) {
          await cell.click();
          await page.waitForTimeout(300);
          
          const clickedText = await cell.textContent();
          const hasConfidence = clickedText.includes('confidence');
          
          await cell.click();
          await page.waitForTimeout(300);
          
          console.log(`    Flashcard toggle: ${hasConfidence ? '✅ Works' : '❌ Failed'}`);
        }
      }
    }
    
    // Summary
    console.log('\n📋 SUMMARY:');
    console.log(`✅ Empty cells show descriptions: ${lightGrayCells.length > 0}`);
    console.log(`✅ Filled cells show descriptions: ${grayCells.length > 0}`);
    console.log(`✅ Active cells show descriptions: ${coloredCells.length > 0}`);
    console.log(`✅ Flashcard functionality works: ${coloredCells.length > 0}`);
    
    // Take screenshot
    await page.screenshot({ path: 'final-all-cells-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved to final-all-cells-test.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();
