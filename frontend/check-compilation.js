const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Capture all console messages including errors
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
      if (msg.text().includes('error') || msg.text().includes('Error')) {
        console.log('🚨 FOUND ERROR IN CONSOLE:', msg.text());
      }
    });
    
    await page.goto('http://localhost:5173/simple-matrix');
    await page.waitForTimeout(3000);
    
    // Look for any error overlays or error messages
    const errorOverlays = await page.$$('vite-error-overlay');
    console.log('Error overlays found:', errorOverlays.length);
    
    // Print all console messages
    console.log('=== ALL CONSOLE MESSAGES ===');
    consoleMessages.forEach((msg, index) => {
      console.log(`${index}: ${msg}`);
    });
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
})();
