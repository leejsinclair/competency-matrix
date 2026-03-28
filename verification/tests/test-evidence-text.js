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
    
    // Extract evidence text from different categories
    const evidenceSections = await page.$$('p:has-text("Evidence:")');
    
    console.log('=== EVIDENCE TEXT ANALYSIS ===');
    console.log('Total evidence sections found:', evidenceSections.length);
    
    for (let i = 0; i < evidenceSections.length; i++) {
      const section = evidenceSections[i];
      const fullText = await section.textContent();
      
      console.log(`\n--- Evidence Section ${i + 1} ---`);
      console.log('Full text:', fullText);
      
      // Check for specific keywords
      const hasCodeCommits = fullText?.includes('code commits');
      const hasDatabase = fullText?.includes('database');
      const hasDocker = fullText?.includes('Dockerfile');
      const hasTesting = fullText?.includes('test');
      const hasCollaboration = fullText?.includes('collaboration');
      
      console.log('Contains code commits:', hasCodeCommits);
      console.log('Contains database:', hasDatabase);
      console.log('Contains Docker:', hasDocker);
      console.log('Contains testing:', hasTesting);
      console.log('Contains collaboration:', hasCollaboration);
      
      // Check for confidence descriptions
      const hasHighConfidence = fullText?.includes('high confidence');
      const hasModerateConfidence = fullText?.includes('moderate confidence');
      const hasDevelopingConfidence = fullText?.includes('developing confidence');
      
      console.log('Has high confidence:', hasHighConfidence);
      console.log('Has moderate confidence:', hasModerateConfidence);
      console.log('Has developing confidence:', hasDevelopingConfidence);
    }
    
    // Take screenshot
    await page.screenshot({ path: 'evidence-text-test.png', fullPage: true });
    console.log('\nScreenshot saved to evidence-text-test.png');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
})();
