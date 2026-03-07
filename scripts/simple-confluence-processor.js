const fs = require('fs').promises;
const path = require('path');

async function processConfluenceData() {
  console.log('🚀 Processing Local Confluence Data...');
  
  try {
    // Load the processed Confluence pages
    const pagesPath = './_content/confluence/processed/processed-pages.json';
    console.log(`📚 Loading Confluence pages from ${pagesPath}...`);
    
    const pagesData = await fs.readFile(pagesPath, 'utf-8');
    const pages = JSON.parse(pagesData);
    
    console.log(`✅ Loaded ${pages.length} Confluence pages`);
    
    // Process pages to extract competency information
    const events = [];
    const competencyLabels = [];
    const contributorStats = {};
    
    // Simple rule-based classification
    const competencyRules = {
      'programming-languages': {
        keywords: ['java', 'javascript', 'python', 'typescript', 'react', 'spring', 'node', 'angular'],
        row: 'software-engineering'
      },
      'containers-orchestration': {
        keywords: ['docker', 'kubernetes', 'container', 'k8s', 'pod', 'deployment'],
        row: 'devops-platform-engineering'
      },
      'collaboration-process': {
        keywords: ['git', 'version control', 'pull request', 'merge', 'branch', 'commit'],
        row: 'git-version-control'
      },
      'databases': {
        keywords: ['sql', 'database', 'mysql', 'postgresql', 'mongodb', 'redis', 'query'],
        row: 'database-management'
      },
      'testing': {
        keywords: ['test', 'testing', 'unit test', 'integration test', 'jest', 'mocha', 'cypress'],
        row: 'quality-assurance'
      }
    };
    
    console.log('🔄 Processing pages and applying competency rules...');
    
    for (const page of pages) {
      if (!page.original || !page.original.body) continue;
      
      const content = page.original.body?.view?.value || page.original.body?.storage?.value || '';
      const contentLower = content.toLowerCase();
      const title = page.original.title || '';
      const author = page.original.history?.lastUpdated?.by?.publicName || page.original.history?.lastUpdated?.by?.accountId || 'unknown';
      const space = page.original.space?.key || 'UNKNOWN';
      
      // Create event
      const event = {
        id: `confluence-${page.original.id}`,
        source: 'confluence',
        timestamp: page.original.createdAt || page.original.updatedAt || new Date().toISOString(),
        actor: author,
        type: 'page_updated',
        metadata: {
          pageId: page.original.id,
          title: title,
          space: space,
          labels: page.original.metadata?.labels || [],
          version: page.original.version?.number || 1,
        },
        content: content,
      };
      
      events.push(event);
      
      // Apply competency rules
      for (const [category, rule] of Object.entries(competencyRules)) {
        const matches = rule.keywords.filter(keyword => 
          content.includes(keyword) || title.toLowerCase().includes(keyword)
        );
        
        if (matches.length > 0) {
          const label = {
            eventId: event.id,
            competencyCategory: category,
            competencyRow: rule.row,
            level: Math.min(matches.length + 1, 3), // Level based on number of matches
            confidence: Math.min(0.5 + (matches.length * 0.2), 0.95), // Confidence based on matches
            source: 'rule',
            evidence: `Found keywords: ${matches.join(', ')}`,
            createdAt: new Date().toISOString(),
            connectorId: 0, // Local processing
          };
          
          competencyLabels.push(label);
          
          // Update contributor stats
          if (!contributorStats[author]) {
            contributorStats[author] = {
              actor: author,
              events: 0,
              labels: [],
              competencyAreas: new Set(),
              space: space
            };
          }
          
          contributorStats[author].events++;
          contributorStats[author].labels.push(label);
          contributorStats[author].competencyAreas.add(category);
        }
      }
    }
    
    // Calculate final statistics
    const contributors = Object.values(contributorStats).map(stat => ({
      actor: stat.actor,
      events: stat.events,
      labelsGenerated: stat.labels.length,
      competencyAreas: Array.from(stat.competencyAreas),
      averageConfidence: stat.labels.length > 0 
        ? stat.labels.reduce((sum, l) => sum + l.confidence, 0) / stat.labels.length 
        : 0,
      topCompetency: getTopCompetency(stat.labels),
      space: stat.space
    })).sort((a, b) => b.labelsGenerated - a.labelsGenerated);
    
    const categoryCounts = {};
    competencyLabels.forEach(label => {
      categoryCounts[label.competencyCategory] = (categoryCounts[label.competencyCategory] || 0) + 1;
    });
    
    const topCompetencyAreas = Object.entries(categoryCounts)
      .map(([category, count]) => ({
        area: `${category}/${competencyRules[category]?.row || 'unknown'}`,
        category,
        count
      }))
      .sort((a, b) => b.count - a.count);
    
    const summary = {
      dataSource: 'confluence',
      totalEvents: events.length,
      processedEvents: events.length,
      labelsGenerated: competencyLabels.length,
      errors: 0,
      processingTime: Date.now(),
      competencyCategories: Object.keys(categoryCounts),
      topCompetencyAreas: topCompetencyAreas.slice(0, 10),
      contributors: contributors.slice(0, 20),
      generatedAt: new Date().toISOString()
    };
    
    const results = {
      summary,
      events: events.slice(0, 100), // Limit for display
      labels: competencyLabels.slice(0, 200), // Limit for display
    };
    
    // Display results
    console.log('\n🎉 Processing Complete!');
    console.log('📊 Summary:', JSON.stringify(summary, null, 2));
    
    console.log('\n🏆 Top Competency Areas:');
    topCompetencyAreas.slice(0, 10).forEach((area, index) => {
      console.log(`   ${index + 1}. ${area.area} (${area.count} occurrences)`);
    });
    
    console.log('\n👥 Top Contributors:');
    contributors.slice(0, 10).forEach((contributor, index) => {
      console.log(`   ${index + 1}. ${contributor.actor} (${contributor.space})`);
      console.log(`      Events: ${contributor.events}, Labels: ${contributor.labelsGenerated}`);
      console.log(`      Top Competency: ${contributor.topCompetency}`);
      console.log(`      Average Confidence: ${contributor.averageConfidence.toFixed(2)}`);
    });
    
    // Save results
    await fs.writeFile('./test-data/confluence-local-processed.json', JSON.stringify(results, null, 2));
    console.log('\n💾 Results saved to ./test-data/confluence-local-processed.json');
    
    // Create a summary file for easy access
    await fs.writeFile('./test-data/confluence-summary.json', JSON.stringify(summary, null, 2));
    console.log('💾 Summary saved to ./test-data/confluence-summary.json');
    
    return results;
    
  } catch (error) {
    console.error('❌ Processing failed:', error);
    process.exit(1);
  }
}

function getTopCompetency(labels) {
  const categoryCounts = {};
  labels.forEach(label => {
    categoryCounts[label.competencyCategory] = (categoryCounts[label.competencyCategory] || 0) + 1;
  });
  
  const top = Object.entries(categoryCounts).sort(([,a], [,b]) => b - a)[0];
  return top ? `${top[0]}` : 'None';
}

// Run the processor
processConfluenceData();
