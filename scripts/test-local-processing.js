const axios = require('axios');

async function testLocalProcessing() {
  console.log('🧪 Testing Local Data Processing...');
  
  try {
    // Test 1: Check local processing health
    console.log('\n📊 1. Checking local processing health...');
    const healthResponse = await axios.get('http://localhost:3001/api/local-processing/health');
    console.log('✅ Local processing health:', JSON.stringify(healthResponse.data, null, 2));
    
    // Test 2: Process local Confluence data
    console.log('\n🔄 2. Processing local Confluence data...');
    const processResponse = await axios.post('http://localhost:3001/api/local-processing/process', {
      dataSource: 'confluence',
      enableRuleEngine: true,
      enableMLProcessor: false
    });
    
    console.log('✅ Processing completed!');
    console.log('Summary:', JSON.stringify(processResponse.data.data.summary, null, 2));
    
    // Test 3: Get detailed results
    console.log('\n📈 3. Getting detailed results...');
    const resultsResponse = await axios.get('http://localhost:3001/api/local-processing/results');
    const results = resultsResponse.data.data;
    
    console.log(`📊 Processing Results:`);
    console.log(`   - Total Events: ${results.summary.totalEvents}`);
    console.log(`   - Labels Generated: ${results.summary.labelsGenerated}`);
    console.log(`   - Competency Categories: ${results.summary.competencyCategories.length}`);
    console.log(`   - Contributors: ${results.summary.contributors.length}`);
    
    // Show top competency areas
    console.log('\n🏆 Top Competency Areas:');
    results.summary.topCompetencyAreas.slice(0, 5).forEach((area, index) => {
      console.log(`   ${index + 1}. ${area.area} (${area.count} occurrences)`);
    });
    
    // Show top contributors
    console.log('\n👥 Top Contributors:');
    results.summary.contributors.slice(0, 5).forEach((contributor, index) => {
      console.log(`   ${index + 1}. ${contributor.actor}`);
      console.log(`      Events: ${contributor.events}, Labels: ${contributor.labelsGenerated}`);
      console.log(`      Top Competency: ${contributor.topCompetency}`);
    });
    
    console.log('\n🎉 Local data processing test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 404) {
      console.log('💡 Hint: Make sure the local processing routes are registered in the API server');
    }
    process.exit(1);
  }
}

testLocalProcessing();
