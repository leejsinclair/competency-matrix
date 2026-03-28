const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Capture console logs
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
      if (msg.text().includes('Matrix data loaded')) {
        console.log('🎉 FOUND MATRIX DATA:', msg.text());
      }
    });
    
    await page.goto('http://localhost:5173/simple-matrix');
    await page.waitForTimeout(3000);
    
    // Select "lsinclair" from dropdown
    const developerSelect = await page.$('select');
    if (developerSelect) {
      await developerSelect.selectOption({ label: 'lsinclair' });
      console.log('🎯 Selected lsinclair from dropdown');
      
      // Wait for matrix data to load
      await page.waitForTimeout(3000);
      
      // Check if matrix data is displayed
      const matrixData = await page.$('.border.border-gray-200');
      console.log('Matrix data section found:', !!matrixData);
      
      if (matrixData) {
        const categories = await matrixData.$$('h4');
        console.log('Number of categories found:', categories.length);
        
        for (let i = 0; i < Math.min(3, categories.length); i++) {
          const categoryText = await categories[i].textContent();
          console.log(`Category ${i}: ${categoryText}`);
        }
      }
    }
    
    // Print all console messages
    console.log('=== ALL CONSOLE MESSAGES ===');
    consoleMessages.forEach((msg, index) => {
      console.log(`${index}: ${msg}`);
    });
    
    // Take screenshot
    await page.screenshot({ path: 'matrix-data-test.png', fullPage: true });
    console.log('Screenshot saved to matrix-data-test.png');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
})();
