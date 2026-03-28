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
    
    console.log('=== FLASHCARD FUNCTIONALITY TEST ===');
    
    // Find the first active competency cell
    const activeCells = await page.$$('td[style*="background-color"]');
    console.log(`Found ${activeCells.length} styled cells`);
    
    // Look for cells with competency descriptions
    const descriptionCells = await page.$$('td:has-text("Click for details")');
    console.log(`Found ${descriptionCells.length} cells with descriptions`);
    
    if (descriptionCells.length > 0) {
      const firstCell = descriptionCells[0];
      
      // Get initial content
      const initialContent = await firstCell.textContent();
      console.log('\n📝 Initial cell content:');
      console.log(initialContent.substring(0, 100) + '...');
      
      // Click the cell to show confidence details
      console.log('\n🖱️ Clicking cell to show confidence details...');
      await firstCell.click();
      await page.waitForTimeout(500);
      
      // Get content after click
      const clickedContent = await firstCell.textContent();
      console.log('\n📊 Content after click:');
      console.log(clickedContent);
      
      // Verify it shows confidence information
      if (clickedContent.includes('confidence') && clickedContent.includes('evidences')) {
        console.log('✅ Successfully showing confidence details!');
      } else {
        console.log('❌ Confidence details not showing properly');
      }
      
      // Click again to toggle back
      console.log('\n🖱️ Clicking again to toggle back to description...');
      await firstCell.click();
      await page.waitForTimeout(500);
      
      const toggledContent = await firstCell.textContent();
      console.log('\n📝 Content after second click:');
      console.log(toggledContent.substring(0, 100) + '...');
      
      if (toggledContent.includes('Click for details')) {
        console.log('✅ Successfully toggled back to description!');
      } else {
        console.log('❌ Toggle back not working properly');
      }
    } else {
      console.log('❌ No description cells found');
    }
    
    // Test multiple cells
    console.log('\n🧪 Testing multiple flashcard cells...');
    
    const testCells = descriptionCells.slice(0, 3);
    for (let i = 0; i < testCells.length; i++) {
      const cell = testCells[i];
      
      // Click to show details
      await cell.click();
      await page.waitForTimeout(300);
      
      const content = await cell.textContent();
      const hasConfidence = content.includes('confidence');
      const hasDescription = content.includes('Click for details');
      
      console.log(`Cell ${i + 1}: ${hasConfidence ? '✅ Shows confidence' : '❌ No confidence'} | ${hasDescription ? '❌ Still description' : '✅ Toggled correctly'}`);
      
      // Toggle back
      await cell.click();
      await page.waitForTimeout(300);
    }
    
    // Take screenshot
    await page.screenshot({ path: 'flashcard-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved to flashcard-test.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();
