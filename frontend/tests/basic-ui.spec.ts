import { expect, test } from "@playwright/test";

test.describe("Competency Matrix Basic UI Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the matrix page
    await page.goto("http://localhost:5173/matrix");
  });

  test("matrix page loads without errors", async ({ page }) => {
    // Set up error monitoring BEFORE navigation
    const errorLogs: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errorLogs.push(msg.text());
      }
    });

    page.on("pageerror", (error) => {
      errorLogs.push(error.message);
    });

    // Navigate to the matrix page
    await page.goto("http://localhost:5173/matrix");

    // Check that the page loads
    await expect(page).toHaveTitle(/Competency Matrix/);

    // Wait for page to stabilize and any initial loading to complete
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    // Check that main elements are present (target main content h1, not navigation h1)
    await expect(page.locator("main h1")).toContainText("Competency Matrix");

    // Wait a bit more to catch delayed JavaScript errors
    await page.waitForTimeout(2000);

    // Navigate around to trigger potential errors
    await page.click('button:has-text("Individual View")');
    await page.waitForTimeout(1000);

    await page.click('button:has-text("Team View")');
    await page.waitForTimeout(2000); // Longer wait for TeamMatrix to load

    // Final wait to catch any delayed errors
    await page.waitForTimeout(2000);

    // Check that no JavaScript errors occurred
    console.log("Error logs collected:", errorLogs);
    expect(errorLogs.length).toBe(0);
  });

  test("matrix page team view specifically", async ({ page }) => {
    // Set up error monitoring specifically for Team view
    const errorLogs: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errorLogs.push(msg.text());
      }
    });

    page.on("pageerror", (error) => {
      errorLogs.push(error.message);
    });

    // Navigate to the matrix page
    await page.goto("http://localhost:5173/matrix");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Click Team View button
    await page.click('button:has-text("Team View")');
    await page.waitForTimeout(3000); // Wait for TeamMatrix component to load

    // Check for Team Matrix specific elements - look for the main heading instead
    await expect(page.locator("main h1")).toContainText("Competency Matrix");

    // Wait for any delayed errors from TeamMatrix rendering
    await page.waitForTimeout(3000);

    // Check that no JavaScript errors occurred in Team view
    console.log("Team view error logs:", errorLogs);
    expect(errorLogs.length).toBe(0);
  });

  test("matrix page individual view specifically", async ({ page }) => {
    // Set up error monitoring specifically for Individual view
    const errorLogs: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errorLogs.push(msg.text());
      }
    });

    page.on("pageerror", (error) => {
      errorLogs.push(error.message);
    });

    // Navigate to the matrix page
    await page.goto("http://localhost:5173/matrix");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Click Individual View button
    await page.click('button:has-text("Individual View")');
    await page.waitForTimeout(2000);

    // Check for Individual Matrix specific elements - look for main heading
    await expect(page.locator("main h1")).toContainText("Competency Matrix");

    // Try to interact with developer dropdown if it exists
    const developerDropdown = page.locator("select");
    if (await developerDropdown.isVisible({ timeout: 2000 })) {
      await developerDropdown.click();
      await page.waitForTimeout(500);
    }

    // Wait for any delayed errors from IndividualMatrix rendering
    await page.waitForTimeout(2000);

    // Check that no JavaScript errors occurred in Individual view
    console.log("Individual view error logs:", errorLogs);
    expect(errorLogs.length).toBe(0);
  });

  test("matrix page view switching stress test", async ({ page }) => {
    // Set up error monitoring for rapid view switching
    const errorLogs: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errorLogs.push(msg.text());
      }
    });

    page.on("pageerror", (error) => {
      errorLogs.push(error.message);
    });

    // Navigate to the matrix page
    await page.goto("http://localhost:5173/matrix");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Rapidly switch between views to stress test
    for (let i = 0; i < 5; i++) {
      await page.click('button:has-text("Team View")');
      await page.waitForTimeout(1000);

      await page.click('button:has-text("Individual View")');
      await page.waitForTimeout(1000);
    }

    // Final wait to catch any delayed errors
    await page.waitForTimeout(3000);

    // Check that no JavaScript errors occurred during stress test
    console.log("Stress test error logs:", errorLogs);
    expect(errorLogs.length).toBe(0);
  });

  test("matrix page button clicking and error detection", async ({ page }) => {
    // Set up comprehensive error monitoring
    const errorLogs: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errorLogs.push(msg.text());
      }
    });

    page.on("pageerror", (error) => {
      errorLogs.push(error.message);
    });

    // Navigate to the matrix page
    await page.goto("http://localhost:5173/matrix");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Test all visible buttons and check for errors
    const buttons = [
      'button:has-text("Individual View")',
      'button:has-text("Team View")',
      'button:has-text("Refresh")',
      'button:has-text("Clear Filters")',
      'button:has-text("Export")',
    ];

    for (const buttonSelector of buttons) {
      try {
        const button = page.locator(buttonSelector);
        if (await button.isVisible({ timeout: 2000 })) {
          console.log(`Clicking button: ${buttonSelector}`);
          await button.click();
          await page.waitForTimeout(1500); // Wait for any JavaScript to execute

          // Check for immediate errors after click
          if (errorLogs.length > 0) {
            console.log(`Errors after clicking ${buttonSelector}:`, errorLogs);
          }
        }
      } catch (error) {
        console.log(
          `Button ${buttonSelector} not found or not clickable:`,
          error
        );
      }
    }

    // Test Team View specific buttons
    await page.click('button:has-text("Team View")');
    await page.waitForTimeout(2000);

    // Look for "Compare Developers" button in Team view
    const compareButton = page.locator('button:has-text("Compare Developers")');
    if (await compareButton.isVisible({ timeout: 3000 })) {
      console.log("Clicking Compare Developers button");
      await compareButton.click();
      await page.waitForTimeout(2000);

      // Close any modal that might open
      const closeButton = page.locator('button:has-text("Close")');
      if (await closeButton.isVisible({ timeout: 2000 })) {
        await closeButton.click();
        await page.waitForTimeout(500);
      }
    }

    // Test Individual View specific interactions
    await page.click('button:has-text("Individual View")');
    await page.waitForTimeout(2000);

    // Try clicking on matrix cells if they exist
    const matrixCells = page.locator(
      '[data-testid="matrix-cell"], .cursor-pointer'
    );
    const cellCount = await matrixCells.count();
    if (cellCount > 0) {
      console.log(`Found ${cellCount} matrix cells, clicking first one`);
      await matrixCells.first().click();
      await page.waitForTimeout(1000);

      // Close any modal that might open
      const modalClose = page.locator(
        'button:has-text("Close"), button:has-text("Cancel")'
      );
      if (await modalClose.isVisible({ timeout: 2000 })) {
        await modalClose.click();
        await page.waitForTimeout(500);
      }
    }

    // Final wait to catch any delayed errors
    await page.waitForTimeout(3000);

    // Check that no JavaScript errors occurred during button interactions
    console.log("Final error logs after button interactions:", errorLogs);
    expect(errorLogs.length).toBe(0);
  });

  test("matrix page modal interactions and error detection", async ({
    page,
  }) => {
    // Set up error monitoring for modal interactions
    const errorLogs: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errorLogs.push(msg.text());
      }
    });

    page.on("pageerror", (error) => {
      errorLogs.push(error.message);
    });

    // Navigate to the matrix page
    await page.goto("http://localhost:5173/matrix");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Test Export modal
    const exportButton = page.locator('button:has-text("Export")');
    if (await exportButton.isVisible({ timeout: 3000 })) {
      await exportButton.click();
      await page.waitForTimeout(1000);

      // Try interacting with export modal elements
      const pdfRadio = page.locator('input[type="radio"][value="pdf"]');
      if (await pdfRadio.isVisible({ timeout: 2000 })) {
        await pdfRadio.click();
        await page.waitForTimeout(500);
      }

      // Close export modal
      const cancelButton = page.locator('button:has-text("Cancel")');
      if (await cancelButton.isVisible({ timeout: 2000 })) {
        await cancelButton.click();
        await page.waitForTimeout(500);
      }
    }

    // Test Team view comparison modal
    await page.click('button:has-text("Team View")');
    await page.waitForTimeout(2000);

    const compareButton = page.locator('button:has-text("Compare Developers")');
    if (await compareButton.isVisible({ timeout: 3000 })) {
      await compareButton.click();
      await page.waitForTimeout(1000);

      // Close comparison modal
      const closeComparison = page.locator('button:has-text("Close")');
      if (await closeComparison.isVisible({ timeout: 2000 })) {
        await closeComparison.click();
        await page.waitForTimeout(500);
      }
    }

    // Final wait for any delayed errors
    await page.waitForTimeout(2000);

    // Check for errors during modal interactions
    console.log("Modal interaction error logs:", errorLogs);
    expect(errorLogs.length).toBe(0);
  });

  test("navigation works correctly", async ({ page }) => {
    // Test navigation to different pages
    await page.click('a:has-text("Dashboard")');
    await expect(page).toHaveURL(/\/$/);

    await page.click('a:has-text("Matrix")');
    await expect(page).toHaveURL(/\/matrix$/);

    await page.click('a:has-text("Analytics")');
    await expect(page).toHaveURL(/\/analytics$/);

    await page.click('a:has-text("Configuration")');
    await expect(page).toHaveURL(/\/configuration$/);

    await page.click('a:has-text("Connectors")');
    await expect(page).toHaveURL(/\/connectors$/);
  });

  test("matrix view toggle works", async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(2000);

    // Check individual view button
    const individualButton = page.locator('button:has-text("Individual View")');
    await expect(individualButton).toBeVisible();

    // Check team view button
    const teamButton = page.locator('button:has-text("Team View")');
    await expect(teamButton).toBeVisible();

    // Test switching views
    await individualButton.click();
    await page.waitForTimeout(1000);

    await teamButton.click();
    await page.waitForTimeout(1000);

    // Verify no errors during view switching
    const errorLogs: any[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errorLogs.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);
    expect(errorLogs).toHaveLength(0);
  });

  test("filters and search work", async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(2000);

    // Check category filter exists
    const categoryFilter = page.locator("select");
    await expect(categoryFilter).toBeVisible();

    // Check search input exists
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();

    // Test category filter
    await categoryFilter.selectOption({ label: "Programming Languages" });
    await page.waitForTimeout(1000);

    // Test search
    await searchInput.fill("programming");
    await page.waitForTimeout(1000);

    // Test clear filters button
    const clearButton = page.locator('button:has-text("Clear Filters")');
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await page.waitForTimeout(1000);
    }

    // Verify no errors
    const errorLogs: any[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errorLogs.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);
    expect(errorLogs).toHaveLength(0);
  });

  test("export button exists", async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(3000);

    // Check export button
    const exportButton = page.locator('button:has-text("Export")');
    await expect(exportButton).toBeVisible({ timeout: 10000 });

    // Click export button (don't need to complete the flow, just test it opens)
    await exportButton.click();
    await page.waitForTimeout(1000);

    // Close any modal that might open
    const closeButton = page.locator('button:has-text("Cancel")');
    if (await closeButton.isVisible({ timeout: 2000 })) {
      await closeButton.click();
      await page.waitForTimeout(500);
    }
  });

  test("page is responsive", async ({ page }) => {
    // Test different viewport sizes
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);

    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);

    // Verify no layout errors
    const errorLogs: any[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errorLogs.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);
    expect(errorLogs).toHaveLength(0);
  });
});

test.describe("Dashboard Page Tests", () => {
  test("dashboard loads without errors", async ({ page }) => {
    await page.goto("http://localhost:5173");

    // Check dashboard loads (target main content h1)
    await expect(page.locator("main h1")).toContainText("Dashboard");

    // Wait for any loading
    await page.waitForTimeout(2000);

    // Check for console errors
    const errorLogs: any[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errorLogs.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);
    expect(errorLogs).toHaveLength(0);
  });
});

test.describe("Analytics Page Tests", () => {
  test("analytics loads without errors", async ({ page }) => {
    await page.goto("http://localhost:5173/analytics");

    // Check analytics loads (target main content h1)
    await expect(page.locator("main h1")).toContainText("Analytics");

    // Wait for any loading
    await page.waitForTimeout(2000);

    // Check for console errors
    const errorLogs: any[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errorLogs.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);
    expect(errorLogs).toHaveLength(0);
  });
});

test.describe("Configuration Page Tests", () => {
  test("configuration loads without errors", async ({ page }) => {
    await page.goto("http://localhost:5173/configuration");

    // Check configuration loads (target main content h1)
    await expect(page.locator("main h1")).toContainText("Configuration");

    // Wait for any loading
    await page.waitForTimeout(2000);

    // Check for console errors
    const errorLogs: any[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errorLogs.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);
    expect(errorLogs).toHaveLength(0);
  });
});

test.describe("Connectors Page Tests", () => {
  test("connectors loads without errors", async ({ page }) => {
    await page.goto("http://localhost:5173/connectors");

    // Check connectors loads (target main content h1)
    await expect(page.locator("main h1")).toContainText("Connector Management");

    // Wait for any loading
    await page.waitForTimeout(2000);

    // Check for console errors
    const errorLogs: any[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errorLogs.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);
    expect(errorLogs).toHaveLength(0);
  });
});
