const { LocalDataProcessor } = require('../dist/services/local-data-processor');

async function processLocalConfluence() {
  console.log('🚀 Processing Local Confluence Data...');
  
  try {
    const processor = new LocalDataProcessor();
    
    const options = {
      dataSource: 'confluence',
      enableRuleEngine: true,
      enableMLProcessor: false
    };
    
    console.log('📚 Loading Confluence data from _content/confluence...');
    const results = await processor.processLocalData(options);
    
    console.log('\n🎉 Processing Complete!');
    console.log('📊 Summary:', JSON.stringify(results.summary, null, 2));
    
    console.log('\n🏆 Top Competency Areas:');
    results.summary.topCompetencyAreas.slice(0, 10).forEach((area, index) => {
      console.log(`   ${index + 1}. ${area.area} (${area.count} occurrences)`);
    });
    
    console.log('\n👥 Top Contributors:');
    results.summary.contributors.slice(0, 10).forEach((contributor, index) => {
      console.log(`   ${index + 1}. ${contributor.actor}`);
      console.log(`      Events: ${contributor.events}, Labels: ${contributor.labelsGenerated}`);
      console.log(`      Top Competency: ${contributor.topCompetency}`);
      console.log(`      Average Confidence: ${contributor.averageConfidence.toFixed(2)}`);
    });
    
    // Save results
    await processor.saveProcessingResults(results, './test-data/confluence-local-processed.json');
    console.log('\n💾 Results saved to ./test-data/confluence-local-processed.json');
    
  } catch (error) {
    console.error('❌ Processing failed:', error);
    process.exit(1);
  }
}

processLocalConfluence();
