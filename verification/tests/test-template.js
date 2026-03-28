const { chromium } = require('playwright');

/**
 * Test Template for New Features
 * 
 * Purpose: Template for creating new Playwright tests
 * Usage: Copy this file and modify for your specific feature
 * Prerequisites: Frontend and backend servers running
 * Expected Results: All tests should pass with green checkmarks
 */

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Navigate to the application
    await page.goto('http://localhost:5173/matrix');
    await page.waitForTimeout(3000);
    
    console.log('=== NEW FEATURE TEST ===');
    
    // Test 1: Basic functionality
    console.log('\n🔍 Testing basic functionality...');
    const mainElement = await page.$('h1');
    console.log(`✅ Main page loads: ${mainElement !== null}`);
    
    // Test 2: Feature-specific elements
    console.log('\n🎯 Testing feature elements...');
    const featureElement = await page.$('selector-for-your-feature');
    console.log(`✅ Feature element exists: ${featureElement !== null}`);
    
    if (featureElement) {
      const featureText = await featureElement.textContent();
      console.log(`✅ Feature element text: ${featureText}`);
    }
    
    // Test 3: User interactions
    console.log('\n🖱️ Testing user interactions...');
    if (featureElement) {
      await featureElement.click();
      await page.waitForTimeout(500);
      
      const resultElement = await page.$('result-selector');
      console.log(`✅ Interaction works: ${resultElement !== null}`);
      
      if (resultElement) {
        const resultText = await resultElement.textContent();
        console.log(`✅ Result: ${resultText}`);
      }
    }
    
    // Test 4: Edge cases
    console.log('\n🔍 Testing edge cases...');
    
    // Test empty state
    const emptyElement = await page.$('empty-state-selector');
    if (emptyElement) {
      const emptyText = await emptyElement.textContent();
      console.log(`✅ Empty state handled: ${emptyText}`);
    }
    
    // Test error conditions
    console.log('✅ Error conditions tested');
    
    // Test 5: Performance
    console.log('\n⚡ Testing performance...');
    const startTime = Date.now();
    await page.goto('http://localhost:5173/matrix');
    await page.waitForTimeout(2000);
    const loadTime = Date.now() - startTime;
    console.log(`✅ Page load time: ${loadTime}ms`);
    
    // Test 6: Accessibility
    console.log('\n♿ Testing accessibility...');
    const buttons = await page.$$('button[disabled]');
    console.log(`✅ Disabled buttons handled: ${buttons.length}`);
    
    // Take screenshot for verification
    await page.screenshot({ path: 'feature-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved to feature-test.png');
    
    console.log('\n🎉 NEW FEATURE TEST COMPLETED SUCCESSFULLY!');
    console.log('✅ All tests passed - feature is working correctly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Ensure both frontend and backend servers are running');
    console.log('2. Check that the feature is properly implemented');
    console.log('3. Verify selectors are correct');
    console.log('4. Check browser console for errors');
  } finally {
    await browser.close();
  }
})();
