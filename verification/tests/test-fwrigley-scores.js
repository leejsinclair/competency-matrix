const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5173/simple-matrix');
    await page.waitForTimeout(3000);
    
    // Select "Fiona Wrigley" from dropdown
    const developerSelect = await page.$('select');
    if (developerSelect) {
      await developerSelect.selectOption({ label: 'Fiona Wrigley' });
      console.log('🎯 Selected Fiona Wrigley from dropdown');
      await page.waitForTimeout(3000);
    }
    
    // Look for specific competency sections
    const targetCompetencies = [
      'Programming Fundamentals',
      'Advanced Concepts', 
      'Query Optimization',
      'Data Modeling',
      'Test Automation',
      'Performance Testing'
    ];
    
    console.log('=== FIONA WRIGLEY - SPECIFIC COMPETENCY ANALYSIS ===');
    
    // Find all competency rows
    const competencyRows = await page.$$('td:has-text("Programming Fundamentals"), td:has-text("Advanced Concepts"), td:has-text("Query Optimization"), td:has-text("Data Modeling"), td:has-text("Test Automation"), td:has-text("Performance Testing")');
    
    console.log(`Found ${competencyRows.length} target competency rows`);
    
    // Extract detailed information for each competency
    for (let i = 0; i < competencyRows.length; i++) {
      const row = competencyRows[i];
      const competencyText = await row.textContent();
      
      console.log(`\n--- Competency ${i + 1}: ${competencyText} ---`);
      
      // Find the parent row to get all cells
      const parentRow = await row.$('xpath=..');
      if (parentRow) {
        const cells = await parentRow.$$('td');
        console.log(`Row has ${cells.length} cells`);
        
        // Extract level and confidence from each cell
        for (let j = 1; j < cells.length; j++) { // Skip first cell (competency name)
          const cell = cells[j];
          const cellText = await cell.textContent();
          const cellStyle = await cell.getAttribute('style');
          
          if (cellText && cellText !== '-') {
            console.log(`  Level ${j}: "${cellText.trim()}" - Style: ${cellStyle}`);
          }
        }
      }
    }
    
    // Look for detailed report sections
    console.log('\n=== DETAILED REPORT ANALYSIS ===');
    
    // Find all detailed competency sections
    const detailedSections = await page.$$('.p-3.bg-gray-50.rounded');
    
    for (const section of detailedSections) {
      const competencyName = await section.$('h5');
      if (competencyName) {
        const name = await competencyName.textContent();
        
        // Check if this is one of our target competencies
        const isTarget = targetCompetencies.some(target => 
          name?.toLowerCase().includes(target.toLowerCase())
        );
        
        if (isTarget) {
          console.log(`\n--- Detailed Section: ${name} ---`);
          
          // Extract all text content
          const fullText = await section.textContent();
          console.log('Full content:', fullText);
          
          // Look for specific patterns
          const levelMatch = fullText?.match(/Level (\d)/);
          const confidenceMatch = fullText?.match(/(\d+\.\d+)% confidence/);
          const evidenceMatch = fullText?.match(/(\d+) data points/);
          
          console.log(`Extracted Level: ${levelMatch?.[1] || 'Not found'}`);
          console.log(`Extracted Confidence: ${confidenceMatch?.[1] || 'Not found'}`);
          console.log(`Extracted Evidence: ${evidenceMatch?.[1] || 'Not found'}`);
        }
      }
    }
    
    // Take screenshot
    await page.screenshot({ path: 'fwrigley-competency-test.png', fullPage: true });
    console.log('\nScreenshot saved to fwrigley-competency-test.png');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
})();
