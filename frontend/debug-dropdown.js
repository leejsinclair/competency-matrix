const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Capture console logs
  page.on('console', msg => {
    console.log('Browser Console:', msg.text());
  });
  
  try {
    await page.goto('http://localhost:5173/matrix');
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check if developer dropdown exists
    const dropdownExists = await page.$('label:has-text("Developer:")');
    console.log('Developer dropdown exists:', !!dropdownExists);
    
    // Check if select element exists
    const selectExists = await page.$('select');
    console.log('Select element exists:', !!selectExists);
    
    // Get all select elements
    const selects = await page.$$('select');
    console.log('Number of select elements:', selects.length);
    
    // Check availableDevelopers state
    const devOptions = await page.$$('select option');
    console.log('Number of developer options:', devOptions.length);
    
    // Take screenshot
    await page.screenshot({ path: 'debug-dropdown.png', fullPage: true });
    console.log('Screenshot saved to debug-dropdown.png');
    
    // Get the HTML content of the main area
    const mainContent = await page.$eval('main', el => el.innerHTML);
    console.log('Main content length:', mainContent.length);
    
  } catch (error) {
    console.error('Error during page analysis:', error);
  } finally {
    await browser.close();
  }
})();
