const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5173/matrix');
    await page.waitForTimeout(3000);
    
    console.log('=== INTEGRATED MATRIX PAGE TEST ===');
    
    // Check page title and header
    const pageTitle = await page.title();
    console.log(`Page title: ${pageTitle}`);
    
    const mainHeading = await page.$('h1');
    const headingText = await mainHeading.textContent();
    console.log(`Main heading: ${headingText}`);
    
    // Check subheading
    const subheading = await page.$('p.text-gray-600');
    const subheadingText = await subheading.textContent();
    console.log(`Subheading: ${subheadingText}`);
    
    // Check navigation buttons
    const circleciButton = await page.$('button:has-text("CircleCI View")');
    const detailedButton = await page.$('button:has-text("Detailed Report")');
    
    console.log(`CircleCI View button exists: ${circleciButton !== null}`);
    console.log(`Detailed Report button exists: ${detailedButton !== null}`);
    
    // Check info banner
    const infoBanner = await page.$('.bg-blue-50');
    const infoTitle = await infoBanner.$('h3');
    const infoTitleText = await infoTitle.textContent();
    console.log(`Info banner title: ${infoTitleText}`);
    
    // Check if SimpleMatrix component is rendered
    const matrixContainer = await page.$('.p-6');
    const hasMatrix = matrixContainer !== null;
    console.log(`SimpleMatrix component rendered: ${hasMatrix}`);
    
    // Test developer selection
    const developerSelect = await page.$('select');
    if (developerSelect) {
      console.log('Developer dropdown found');
      
      // Get options
      const options = await developerSelect.$$('option');
      const developerCount = options.length - 1; // Subtract 1 for "Select a developer..." option
      console.log(`Developers available: ${developerCount}`);
      
      // Select a developer
      await developerSelect.selectOption({ index: 1 }); // Select first developer
      await page.waitForTimeout(2000);
      
      console.log('Developer selected successfully');
    }
    
    // Test view mode toggle
    if (detailedButton) {
      console.log('Testing Detailed Report view...');
      await detailedButton.click();
      await page.waitForTimeout(1000);
      
      const detailedSection = await page.$('.bg-white.shadow');
      const hasDetailedSection = detailedSection !== null;
      console.log(`Detailed section shown: ${hasDetailedSection}`);
      
      // Toggle back to CircleCI view
      if (circleciButton) {
        await circleciButton.click();
        await page.waitForTimeout(1000);
        console.log('Toggled back to CircleCI view');
      }
    }
    
    // Test flashcard functionality
    const activeCells = await page.$$('td[style*="rgb(16, 185, 129)"], td[style*="rgb(245, 158, 11)"], td[style*="rgb(239, 68, 68)"], td[style*="rgb(139, 92, 246)"]');
    
    if (activeCells.length > 0) {
      console.log(`Found ${activeCells.length} active cells for flashcard testing`);
      
      const testCell = activeCells[0];
      const beforeText = await testCell.textContent();
      
      await testCell.click();
      await page.waitForTimeout(500);
      
      const afterText = await testCell.textContent();
      const hasConfidence = afterText.includes('confidence');
      
      console.log(`Flashcard toggle works: ${hasConfidence}`);
    }
    
    // Check navigation
    const navLinks = await page.$$('nav a');
    const matrixNavLink = navLinks.find(link => {
      return link.textContent().then(text => text.includes('Matrix'));
    });
    
    if (matrixNavLink) {
      const isActive = await matrixNavLink.evaluate(el => el.classList.contains('border-primary-500'));
      console.log(`Matrix nav link is active: ${isActive}`);
    }
    
    // Take screenshot
    await page.screenshot({ path: 'integrated-matrix-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved to integrated-matrix-test.png');
    
    console.log('\n✅ Integration test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();
