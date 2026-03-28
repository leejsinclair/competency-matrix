const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5173/simple-matrix');
    await page.waitForTimeout(3000);
    
    // Select "lsinclair" from dropdown
    const developerSelect = await page.$('select');
    if (developerSelect) {
      await developerSelect.selectOption({ label: 'lsinclair' });
      console.log('🎯 Selected lsinclair from dropdown');
      await page.waitForTimeout(3000);
    }
    
    // Check for CircleCI matrix elements
    const matrixTitle = await page.$('h2:has-text("CircleCI Engineering Competency Matrix")');
    const table = await page.$('table');
    const categoryHeaders = await page.$$('td[colSpan="5"]');
    const levelHeaders = await page.$$('th:has-text("L1 - Beginner")');
    const legend = await page.$('h4:has-text("Competency Levels")');
    
    console.log('=== CIRCLECI MATRIX ELEMENTS ===');
    console.log('Matrix title found:', !!matrixTitle);
    console.log('Table found:', !!table);
    console.log('Category headers found:', categoryHeaders.length);
    console.log('Level headers found:', levelHeaders.length);
    console.log('Legend found:', !!legend);
    
    // Check for specific categories
    const categories = await page.$$('td:has-text("Programming Languages")');
    console.log('Programming Languages category found:', categories.length > 0);
    
    // Check for colored cells (competency levels)
    const coloredCells = await page.$$('td[style*="background-color"]');
    console.log('Colored competency cells found:', coloredCells.length);
    
    // Take screenshot
    await page.screenshot({ path: 'circleci-matrix-test.png', fullPage: true });
    console.log('Screenshot saved to circleci-matrix-test.png');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
})();
