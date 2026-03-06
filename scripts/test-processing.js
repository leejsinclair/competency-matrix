const axios = require('axios');

async function testProcessing() {
  console.log('🧪 Testing Processing System...');
  
  try {
    // Test 1: Get processing status
    console.log('\n📊 1. Getting processing status...');
    const statusResponse = await axios.get('http://localhost:3001/api/competency/health');
    console.log('✅ Processing status:', JSON.stringify(statusResponse.data, null, 2));
    
    // Test 2: Test processing with mock data
    console.log('\n🔄 2. Testing processing endpoint...');
    const processResponse = await axios.post('http://localhost:3001/api/competency/process', {
      event: {
        id: 'test-event-1',
        source: 'jira',
        type: 'issue_created',
        actor: 'test-user',
        timestamp: new Date().toISOString(),
        content: 'This is a test issue about implementing a Java feature with Spring Boot and microservices architecture.',
        metadata: {
          project: 'TEST',
          issueType: 'Story',
          priority: 'High'
        }
      },
      useML: false
    });
    console.log('✅ Processing result:', JSON.stringify(processResponse.data, null, 2));
    
    // Test 3: Get connector configs to verify database connection
    console.log('\n📡 3. Getting connector configurations...');
    const connectorsResponse = await axios.get('http://localhost:3001/api/connector-configs');
    console.log(`✅ Found ${connectorsResponse.data.data.length} connectors`);
    connectorsResponse.data.data.forEach(connector => {
      console.log(`   - ${connector.name} (${connector.connector_type})`);
    });
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testProcessing();
