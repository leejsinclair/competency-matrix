import { expect, test } from '@playwright/test';

test.describe('Matrix Page - Comprehensive Button Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Set up error monitoring for all tests
    const errorLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errorLogs.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      errorLogs.push(error.message);
    });
    
    // Store error logs in page context for access in tests
    await page.context().addInitScript(() => {
      window.errorLogs = [];
    });
  });

  test('all matrix page buttons - comprehensive testing', async ({ page }) => {
    // Navigate to matrix page
    await page.goto('http://localhost:5173/matrix');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Collect all errors during test
    const allErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        allErrors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      allErrors.push(error.message);
    });

    console.log('🔍 Starting comprehensive button testing...');

    // 1. View Toggle Buttons
    console.log('📱 Testing view toggle buttons...');
    
    const individualViewButton = page.locator('button:has-text("Individual View")');
    if (await individualViewButton.isVisible()) {
      await individualViewButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ Individual View button clicked');
    }
    
    const teamViewButton = page.locator('button:has-text("Team View")');
    if (await teamViewButton.isVisible()) {
      await teamViewButton.click();
      await page.waitForTimeout(2000); // Longer wait for TeamMatrix to load
      console.log('✅ Team View button clicked');
    }

    // 2. Action Buttons in Team View
    console.log('🔄 Testing Team View action buttons...');
    
    const refreshButton = page.locator('button:has-text("Refresh")');
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      await page.waitForTimeout(1500);
      console.log('✅ Refresh button clicked');
    }
    
    const compareDevelopersButton = page.locator('button:has-text("Compare Developers")');
    if (await compareDevelopersButton.isVisible()) {
      await compareDevelopersButton.click();
      await page.waitForTimeout(1500);
      console.log('✅ Compare Developers button clicked');
      
      // Close comparison modal if it opens
      const closeButton = page.locator('button:has-text("Close")');
      if (await closeButton.isVisible({ timeout: 2000 })) {
        await closeButton.click();
        await page.waitForTimeout(500);
        console.log('✅ Comparison modal closed');
      }
    }

    // 3. Filter Controls
    console.log('🔍 Testing filter controls...');
    
    const categoryFilter = page.locator('select').first();
    if (await categoryFilter.isVisible()) {
      await categoryFilter.click();
      await page.waitForTimeout(500);
      
      // Try to select a different option
      const options = page.locator('select option');
      const optionCount = await options.count();
      if (optionCount > 1) {
        await categoryFilter.selectOption({ index: 1 });
        await page.waitForTimeout(500);
        console.log('✅ Category filter changed');
      }
    }
    
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
      await searchInput.clear();
      await page.waitForTimeout(500);
      console.log('✅ Search input tested');
    }
    
    const clearFiltersButton = page.locator('button:has-text("Clear Filters")');
    if (await clearFiltersButton.isVisible()) {
      await clearFiltersButton.click();
      await page.waitForTimeout(500);
      console.log('✅ Clear Filters button clicked');
    }

    // 4. Export Functionality
    console.log('📤 Testing export functionality...');
    
    const exportButton = page.locator('button:has-text("Export")');
    if (await exportButton.isVisible()) {
      await exportButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ Export button clicked');
      
      // Test export modal interactions
      const pdfRadio = page.locator('input[type="radio"][value="pdf"]');
      if (await pdfRadio.isVisible()) {
        await pdfRadio.click();
        await page.waitForTimeout(500);
        console.log('✅ PDF export option selected');
      }
      
      const excelRadio = page.locator('input[type="radio"][value="excel"]');
      if (await excelRadio.isVisible()) {
        await excelRadio.click();
        await page.waitForTimeout(500);
        console.log('✅ Excel export option selected');
      }
      
      // Close export modal
      const cancelExportButton = page.locator('button:has-text("Cancel")');
      if (await cancelExportButton.isVisible()) {
        await cancelExportButton.click();
        await page.waitForTimeout(500);
        console.log('✅ Export modal closed');
      }
    }

    // 5. Matrix Cell Interactions
    console.log('🎯 Testing matrix cell interactions...');
    
    // Switch back to Individual View for cell testing
    await page.click('button:has-text("Individual View")');
    await page.waitForTimeout(1500);
    
    // Look for clickable matrix cells
    const clickableCells = page.locator('.cursor-pointer, [data-testid="matrix-cell"], div[class*="cursor"]');
    const cellCount = await clickableCells.count();
    
    if (cellCount > 0) {
      console.log(`Found ${cellCount} clickable cells, testing first few...`);
      
      // Test clicking first few cells
      const cellsToTest = Math.min(3, cellCount);
      for (let i = 0; i < cellsToTest; i++) {
        await clickableCells.nth(i).click();
        await page.waitForTimeout(1000);
        
        // Close any modal that opens
        const modalClose = page.locator('button:has-text("Close"), button:has-text("Cancel"), .bg-black');
        if (await modalClose.isVisible({ timeout: 2000 })) {
          await modalClose.click();
          await page.waitForTimeout(500);
        }
        
        console.log(`✅ Matrix cell ${i + 1} clicked and modal closed`);
      }
    }

    // 6. Developer Dropdown (Individual View)
    console.log('👥 Testing developer dropdown...');
    
    const developerDropdown = page.locator('select').nth(1); // Second select might be developer dropdown
    if (await developerDropdown.isVisible()) {
      await developerDropdown.click();
      await page.waitForTimeout(500);
      
      const developerOptions = page.locator('select option');
      const devOptionCount = await developerOptions.count();
      
      if (devOptionCount > 1) {
        await developerDropdown.selectOption({ index: 1 });
        await page.waitForTimeout(1000);
        console.log('✅ Developer changed');
        
        // Switch back to first option
        await developerDropdown.selectOption({ index: 0 });
        await page.waitForTimeout(500);
      }
    }

    // 7. Evidence Modal Interactions
    console.log('📋 Testing evidence modal features...');
    
    // Try to trigger evidence modal by clicking a cell
    const evidenceTriggerCells = page.locator('[data-evidence="true"], .cursor-pointer');
    if (await evidenceTriggerCells.first().isVisible()) {
      await evidenceTriggerCells.first().click();
      await page.waitForTimeout(1000);
      
      // Look for evidence modal buttons
      const viewTrendsButton = page.locator('button:has-text("View Trends")');
      if (await viewTrendsButton.isVisible()) {
        await viewTrendsButton.click();
        await page.waitForTimeout(1000);
        console.log('✅ View Trends button clicked');
        
        // Close trends modal
        const closeTrends = page.locator('button:has-text("Close")');
        if (await closeTrends.isVisible()) {
          await closeTrends.click();
          await page.waitForTimeout(500);
        }
      }
      
      // Close evidence modal
      const closeEvidence = page.locator('button:has-text("Close")');
      if (await closeEvidence.isVisible()) {
        await closeEvidence.click();
        await page.waitForTimeout(500);
        console.log('✅ Evidence modal closed');
      }
    }

    // 8. Final wait for delayed errors
    console.log('⏳ Waiting for delayed errors...');
    await page.waitForTimeout(3000);

    // Check final error state
    console.log('🔍 Final error check...');
    console.log('Total errors collected:', allErrors.length);
    
    if (allErrors.length > 0) {
      console.log('Errors found:', allErrors);
    }

    // Assert no JavaScript errors
    expect(allErrors.length).toBe(0);
    console.log('🎉 All button tests completed successfully!');
  });

  test('matrix page - stress test rapid interactions', async ({ page }) => {
    await page.goto('http://localhost:5173/matrix');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const errorLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errorLogs.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      errorLogs.push(error.message);
    });

    console.log('🚀 Starting stress test...');

    // Rapid view switching
    for (let i = 0; i < 10; i++) {
      await page.click('button:has-text("Individual View")');
      await page.waitForTimeout(200);
      
      await page.click('button:has-text("Team View")');
      await page.waitForTimeout(200);
      
      if (i % 3 === 0) {
        await page.click('button:has-text("Refresh")');
        await page.waitForTimeout(200);
      }
    }

    // Rapid filter changes
    const categoryFilter = page.locator('select').first();
    if (await categoryFilter.isVisible()) {
      for (let i = 0; i < 5; i++) {
        const options = page.locator('select option');
        const optionCount = await options.count();
        
        if (optionCount > 0) {
          await categoryFilter.selectOption({ index: i % optionCount });
          await page.waitForTimeout(100);
        }
      }
    }

    // Final wait
    await page.waitForTimeout(2000);

    console.log('Stress test errors:', errorLogs);
    expect(errorLogs.length).toBe(0);
    console.log('🎉 Stress test completed successfully!');
  });

  test('matrix page - accessibility and keyboard navigation', async ({ page }) => {
    await page.goto('http://localhost:5173/matrix');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const errorLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errorLogs.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      errorLogs.push(error.message);
    });

    console.log('⌨️ Testing keyboard navigation...');

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    
    // Try to activate focused elements with Enter/Space
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      
      // Try Enter key
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      
      // Close any modal that might open
      const modal = page.locator('.fixed.inset-0, [role="dialog"]');
      if (await modal.isVisible({ timeout: 500 })) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
    }

    console.log('Keyboard navigation errors:', errorLogs);
    expect(errorLogs.length).toBe(0);
    console.log('🎉 Keyboard navigation test completed!');
  });
});
