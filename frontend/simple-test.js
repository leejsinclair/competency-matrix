const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Enable React DevTools
  await page.goto('http://localhost:5173/matrix');
  
  // Wait for React to load
  await page.waitForTimeout(5000);
  
  // Check React component tree
  const reactComponents = await page.evaluate(() => {
    const root = document.getElementById('root');
    if (!root) return null;
    
    // Simple function to find the CompetencyMatrix component
    function findComponent(element, componentName) {
      if (!element || element._reactInternalInstance) return null;
      
      let current = element;
      while (current && current._reactInternalInstance) {
        const internal = current._reactInternalInstance;
        if (internal.memoizedProps && internal.memoizedProps.viewMode === 'individual') {
          return internal;
        }
        current = current.return || current.child;
      }
      return null;
    }
    
    return findComponent(root, 'CompetencyMatrix');
  });
  
  console.log('React component found:', !!reactComponents);
  
  if (reactComponents) {
    const componentState = await page.evaluate(() => {
      const root = document.getElementById('root');
      const component = findComponent(root, 'CompetencyMatrix');
      if (!component) return null;
      
      return {
        availableDevelopers: component.state.availableDevelopers,
        selectedDeveloper: component.state.selectedDeveloper,
        viewMode: component.state.viewMode,
        error: component.state.error,
        loading: component.state.loading
      };
    });
    
    console.log('Component state:', componentState);
  }
  
  await browser.close();
})();
