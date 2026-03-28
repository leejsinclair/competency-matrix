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
    
    // Get all detailed report sections
    console.log('=== FIONA WRIGLEY - DETAILED COMPETENCY SCORES ===');
    
    const detailedSections = await page.$$('.p-3.bg-gray-50.rounded');
    
    const targetCompetencies = {
      'Software Engineering': ['Programming Fundamentals'],
      'Programming Languages': ['Programming Fundamentals'],
      'Databases': ['Query Optimization', 'Data Modeling'],
      'Testing': ['Test Automation', 'Performance Testing'],
      'Advanced Concepts': ['Advanced Concepts']
    };
    
    for (const section of detailedSections) {
      const competencyName = await section.$('h5');
      if (competencyName) {
        const name = await competencyName.textContent();
        console.log(`\n--- ${name} ---`);
        
        // Extract all content
        const fullText = await section.textContent();
        console.log('Full text:', fullText);
        
        // Extract specific metrics
        const levelMatch = fullText?.match(/Level (\d+) - (\w+)/);
        const confidenceMatch = fullText?.match(/(\d+\.\d+)% confidence/);
        const evidenceMatch = fullText?.match(/(\d+) data points/);
        const assessmentMatch = fullText?.match(/Assessment: (.+?)\s*Confidence/);
        const evidenceDescMatch = fullText?.match(/Evidence: (.+?)\s*Last updated/);
        
        console.log(`Level: ${levelMatch?.[1] || 'N/A'} (${levelMatch?.[2] || 'N/A'})`);
        console.log(`Confidence: ${confidenceMatch?.[1] || 'N/A'}%`);
        console.log(`Evidence Count: ${evidenceMatch?.[1] || 'N/A'}`);
        
        if (assessmentMatch?.[1]) {
          console.log(`Assessment: ${assessmentMatch[1].trim()}`);
        }
        
        if (evidenceDescMatch?.[1]) {
          console.log(`Evidence Description: ${evidenceDescMatch[1].trim()}`);
        }
        
        // Check if this matches our target competencies
        for (const [category, competencies] of Object.entries(targetCompetencies)) {
          for (const competency of competencies) {
            if (name?.toLowerCase().includes(competency.toLowerCase())) {
              console.log(`🎯 MATCHES TARGET: ${competency} in ${category}`);
            }
          }
        }
      }
    }
    
    // Also check the matrix grid directly for visual confirmation
    console.log('\n=== MATRIX GRID VISUAL CHECK ===');
    
    // Find rows with our target competencies
    const matrixRows = await page.$$('tr');
    
    for (const row of matrixRows) {
      const firstCell = await row.$('td:first-child');
      if (firstCell) {
        const cellText = await firstCell.textContent();
        
        // Check if this row contains our target competencies
        const targetCompetenciesList = ['Programming Fundamentals', 'Advanced Concepts', 'Query Optimization', 'Data Modeling', 'Test Automation', 'Performance Testing'];
        
        if (targetCompetenciesList.some(target => cellText?.includes(target))) {
          console.log(`\nMatrix Row: ${cellText}`);
          
          // Get all cells in this row
          const cells = await row.$$('td');
          for (let i = 1; i < cells.length; i++) {
            const cell = cells[i];
            const cellText = await cell.textContent();
            const cellStyle = await cell.getAttribute('style');
            
            if (cellText && cellText.trim() !== '-') {
              console.log(`  L${i}: ${cellText.trim()} (Style: ${cellStyle})`);
            }
          }
        }
      }
    }
    
    // Take screenshot
    await page.screenshot({ path: 'fwrigley-detailed-test.png', fullPage: true });
    console.log('\nScreenshot saved to fwrigley-detailed-test.png');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
})();
