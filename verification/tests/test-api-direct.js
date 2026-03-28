// Test the API directly to see the data structure
const fetch = require('node-fetch');

async function testMatrixAPI() {
  try {
    console.log('🔍 Testing Matrix API for Fiona Wrigley...');
    
    const response = await fetch('http://localhost:3001/api/matrix/developer/Fiona%20Wrigley');
    const result = await response.json();
    
    console.log('✅ API Response Status:', response.status);
    console.log('✅ API Success:', result.success);
    
    if (result.success && result.data) {
      console.log('\n📋 DATA STRUCTURE:');
      console.log('Top-level keys:', Object.keys(result.data));
      
      if (result.data.categories) {
        console.log('\n🗂️ CATEGORIES:');
        Object.keys(result.data.categories).forEach(categoryKey => {
          const categoryData = result.data.categories[categoryKey];
          console.log(`\n${categoryKey}:`);
          console.log(`  Type: ${Array.isArray(categoryData) ? 'Array' : typeof categoryData}`);
          console.log(`  Length: ${Array.isArray(categoryData) ? categoryData.length : 'N/A'}`);
          
          if (Array.isArray(categoryData) && categoryData.length > 0) {
            console.log(`  Items:`);
            categoryData.forEach((item, index) => {
              console.log(`    [${index}] row="${item.row}", level=${item.level}, confidence=${item.confidence}`);
            });
          }
        });
      }
      
      console.log('\n📊 SUMMARY:');
      console.log('Total Scores:', result.data.totalScores);
      console.log('Average Confidence:', result.data.averageConfidence);
      console.log('Average Level:', result.data.averageLevel);
      
    } else {
      console.log('❌ API Error:', result);
    }
    
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
  }
}

testMatrixAPI();
