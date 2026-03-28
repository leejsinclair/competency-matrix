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
    
    // Check for enhanced matrix features
    const detailedReport = await page.$('h3:has-text("Detailed Competency Report")');
    const assessmentSections = await page.$$('p:has-text("Assessment:")');
    const confidenceSections = await page.$$('p:has-text("Confidence Level:")');
    const evidenceSections = await page.$$('p:has-text("Evidence:")');
    
    // Check for filled cells (gray cells before the active level)
    const grayCells = await page.$$('td[style*="background-color: rgb(229, 231, 235)"]');
    const darkGrayCells = await page.$$('td[style*="background-color: rgb(243, 244, 246)"]');
    
    console.log('=== ENHANCED MATRIX FEATURES ===');
    console.log('Detailed Report section found:', !!detailedReport);
    console.log('Assessment sections found:', assessmentSections.length);
    console.log('Confidence sections found:', confidenceSections.length);
    console.log('Evidence sections found:', evidenceSections.length);
    console.log('Gray filled cells (before active level):', grayCells.length);
    console.log('Light gray cells (no competency):', darkGrayCells.length);
    
    // Check for specific competency details
    const levelBadges = await page.$$('[style*="background-color"]');
    const competencyDescriptions = await page.$$('p:has-text("Level Description:")');
    
    console.log('Level badges found:', levelBadges.length);
    console.log('Competency descriptions found:', competencyDescriptions.length);
    
    // Look for any text content in the report
    const reportContent = await page.$('.border.border-gray-200.rounded-lg');
    if (reportContent) {
      const text = await reportContent.textContent();
      console.log('Report content length:', text?.length || 0);
      console.log('Contains "lsinclair":', text?.includes('lsinclair') || false);
    }
    
    // Take screenshot
    await page.screenshot({ path: 'enhanced-matrix-test.png', fullPage: true });
    console.log('Screenshot saved to enhanced-matrix-test.png');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
})();
