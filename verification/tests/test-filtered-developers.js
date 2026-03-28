const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5173/simple-matrix');
    await page.waitForTimeout(3000);
    
    console.log('=== FILTERED DEVELOPERS TEST ===');
    
    // Get the dropdown options
    const developerSelect = await page.$('select');
    const options = await developerSelect.$$('option');
    const developers = [];
    
    for (const option of options) {
      const text = await option.textContent();
      const value = await option.getAttribute('value');
      if (text && text !== 'Select a developer...') {
        developers.push({
          name: text.trim(),
          value: value || ''
        });
      }
    }
    
    console.log(`\n📊 Total developers in dropdown: ${developers.length}`);
    console.log('\n👥 Active Developers:');
    developers.forEach((dev, index) => {
      console.log(`  ${index + 1}. ${dev.name}`);
    });
    
    // Check for any deactivated/unlicensed developers that might have slipped through
    const problematicDevelopers = developers.filter(dev => {
      const lowerName = dev.name.toLowerCase();
      return lowerName.includes('deactivated') || lowerName.includes('unlicensed');
    });
    
    if (problematicDevelopers.length > 0) {
      console.log('\n❌ Found problematic developers that should have been filtered:');
      problematicDevelopers.forEach(dev => {
        console.log(`  - ${dev.name}`);
      });
    } else {
      console.log('\n✅ Successfully filtered out all deactivated/unlicensed developers');
    }
    
    // Test selecting a few developers to make sure the matrix works
    console.log('\n🧪 Testing matrix functionality...');
    
    for (let i = 0; i < Math.min(3, developers.length); i++) {
      const testDev = developers[i];
      console.log(`\n🎯 Testing: ${testDev.name}`);
      
      await developerSelect.selectOption({ label: testDev.name });
      await page.waitForTimeout(2000);
      
      // Check if matrix loads
      const table = await page.$('table');
      const hasTable = table !== null;
      
      // Check detailed report sections
      const detailedSections = await page.$$('.p-3.bg-gray-50.rounded');
      const hasReports = detailedSections.length > 0;
      
      console.log(`  ✅ Matrix loaded: ${hasTable}`);
      console.log(`  ✅ Reports available: ${detailedSections.length} sections`);
      
      if (hasTable && hasReports) {
        console.log(`  🎉 ${testDev.name} - Matrix working correctly`);
      } else {
        console.log(`  ⚠️  ${testDev.name} - Matrix may have issues`);
      }
    }
    
    // Take screenshot
    await page.screenshot({ path: 'filtered-developers-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved to filtered-developers-test.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();
