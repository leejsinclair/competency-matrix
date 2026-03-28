const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5173/matrix');
    await page.waitForTimeout(5000);
    
    // Wait for potential delayed errors
    await page.waitForTimeout(5000);
    
    // Get the entire HTML content
    const html = await page.content();
    console.log('=== PAGE HTML ===');
    console.log(html);
    
    // Get all form elements
    const labels = await page.$$('label');
    console.log('\n=== LABELS FOUND ===');
    for (let i = 0; i < labels.length; i++) {
      page.on('console', msg => {
        console.log('Browser Console:', msg.text());
        if (msg.text().includes('fetchMatrixData failed')) {
          console.log(' FOUND THE ERROR!');
          console.log('Error message:', msg.text());
        }
      });
      
      // Capture page errors
      page.on('pageerror', error => {
        console.log(' Page Error:', error.message);
      });
      
      // Capture unhandled rejections
      page.on('unhandledrejection', error => {
        console.log(' Unhandled Rejection:', error);
      });
      
      const text = await labels[i].textContent();
      console.log(`Label ${i}: "${text}"`);
    }
    
    // Get all select elements
    const selects = await page.$$('select');
    console.log('\n=== SELECT ELEMENTS ===');
    for (let i = 0; i < selects.length; i++) {
      const select = selects[i];
      const className = await select.getAttribute('class');
      const options = await select.$$('option');
      console.log(`Select ${i}: class="${className}", options=${options.length}`);
    }
    
    // Check specifically for individual view section
    const individualSection = await page.$('.p-6');
    if (individualSection) {
      const sectionHTML = await individualSection.innerHTML();
      console.log('\n=== INDIVIDUAL VIEW SECTION HTML ===');
      console.log(sectionHTML);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();
