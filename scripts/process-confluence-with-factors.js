const fs = require('fs').promises;
const path = require('path');

// Database connection setup
const { DatabaseConnection } = require('../dist/database/connection');

async function processConfluenceWithDetailedFactors() {
  console.log('🚀 Processing Confluence Data with Detailed Contributing Factors...');
  
  try {
    // Connect to database
    const db = DatabaseConnection.getInstance();
    await db.connect();
    console.log('✅ Connected to database');
    
    // Load the processed Confluence pages
    const pagesPath = './_content/confluence/processed/processed-pages.json';
    console.log(`📚 Loading Confluence pages from ${pagesPath}...`);
    
    const pagesData = await fs.readFile(pagesPath, 'utf-8');
    const pages = JSON.parse(pagesData);
    
    console.log(`✅ Loaded ${pages.length} Confluence pages`);
    
    // Clear existing data
    console.log('🧹 Clearing existing competency labels...');
    await db.query('DELETE FROM competency_labels WHERE connector_id = 2');
    await db.query('DELETE FROM events WHERE connector_id = 2');
    
    // Create output directory for detailed factors
    const outputDir = './test-data/contributing-factors';
    await fs.mkdir(outputDir, { recursive: true });
    
    // Process pages and store in database
    const competencyRules = {
      'programming-languages': {
        keywords: ['java', 'javascript', 'python', 'typescript', 'react', 'spring', 'node', 'angular'],
        row: 'software-engineering',
        description: 'Programming languages and software development skills'
      },
      'containers-orchestration': {
        keywords: ['docker', 'kubernetes', 'container', 'k8s', 'pod', 'deployment'],
        row: 'devops-platform-engineering',
        description: 'Container orchestration and DevOps platform engineering'
      },
      'collaboration-process': {
        keywords: ['git', 'version control', 'pull request', 'merge', 'branch', 'commit'],
        row: 'git-version-control',
        description: 'Collaboration processes and version control workflows'
      },
      'databases': {
        keywords: ['sql', 'database', 'mysql', 'postgresql', 'mongodb', 'redis', 'query'],
        row: 'database-management',
        description: 'Database management and data handling'
      },
      'testing': {
        keywords: ['test', 'testing', 'unit test', 'integration test', 'jest', 'mocha', 'cypress'],
        row: 'quality-assurance',
        description: 'Testing methodologies and quality assurance'
      }
    };
    
    console.log('🔄 Processing pages and storing in database...');
    
    let eventsStored = 0;
    let labelsStored = 0;
    let errors = 0;
    
    // Track contributing factors for each developer
    const developerFactors = {};
    
    for (const page of pages) {
      try {
        if (!page.original || !page.original.body) continue;
        
        const content = page.original.body?.view?.value || page.original.body?.storage?.value || '';
        const contentLower = content.toLowerCase();
        const title = page.original.title || '';
        const author = page.original.history?.lastUpdated?.by?.publicName || page.original.history?.lastUpdated?.by?.accountId || 'unknown';
        const space = page.original.space?.key || 'UNKNOWN';
        const timestamp = page.original.createdAt || page.original.updatedAt || new Date().toISOString();
        
        // Initialize developer factors if not exists
        if (!developerFactors[author]) {
          developerFactors[author] = {
            developer: author,
            totalDocuments: 0,
            contributions: [],
            competencyScores: {},
            contributingFactors: {}
          };
        }
        
        developerFactors[author].totalDocuments++;
        
        // Store event in database
        const eventId = `confluence-${page.original.id}`;
        await db.query(`
          INSERT INTO events (event_id, connector_id, source, event_type, timestamp, actor, content, metadata, processed_at)
          VALUES (@param0, @param1, @param2, @param3, @param4, @param5, @param6, @param7, @param8)
        `, [
          eventId,
          2, // Confluence connector ID
          'confluence',
          'page_updated',
          timestamp,
          author,
          content,
          JSON.stringify({
            pageId: page.original.id,
            title: title,
            space: space,
            labels: page.original.metadata?.labels || [],
            version: page.original.version?.number || 1,
          }),
          new Date()
        ]);
        
        eventsStored++;
        
        // Track this contribution
        const contribution = {
          type: 'confluence_page',
          id: page.original.id,
          title: title,
          space: space,
          timestamp: timestamp,
          url: `https://circleci.atlassian.net/wiki/spaces/${space}/pages/${page.original.id}`,
          contentLength: content.length,
          triggeredLabels: []
        };
        
        // Apply competency rules and store labels
        for (const [category, rule] of Object.entries(competencyRules)) {
          const matches = rule.keywords.filter(keyword => 
            contentLower.includes(keyword) || title.toLowerCase().includes(keyword)
          );
          
          if (matches.length > 0) {
            const confidence = Math.min(0.9, 0.5 + (matches.length * 0.1));
            
            // Store label in database
            await db.query(`
              INSERT INTO competency_labels (event_id, connector_id, competency_category, competency_row, level, confidence, source, evidence, created_at)
              VALUES (@param0, @param1, @param2, @param3, @param4, @param5, @param6, @param7, @param8)
            `, [
              eventId,
              2,
              category,
              rule.row,
              Math.ceil(confidence * 4), // Convert to level 1-4
              confidence,
              'rule',
              `Matched keywords: ${matches.join(', ')} in document: ${title}`,
              new Date()
            ]);
            
            labelsStored++;
            
            // Track contributing factors
            if (!developerFactors[author].contributingFactors[category]) {
              developerFactors[author].contributingFactors[category] = {
                category: category,
                row: rule.row,
                description: rule.description,
                totalMatches: 0,
                contributions: [],
                averageConfidence: 0,
                finalScore: 0
              };
            }
            
            const factor = developerFactors[author].contributingFactors[category];
            factor.totalMatches += matches.length;
            factor.averageConfidence = (factor.averageConfidence * (factor.contributions.length) + confidence) / (factor.contributions.length + 1);
            
            const labelDetail = {
              competency: category,
              row: rule.row,
              confidence: confidence,
              level: Math.ceil(confidence * 4),
              matchedKeywords: matches,
              evidence: `Found keywords: ${matches.join(', ')} in "${title}"`,
              contributionType: 'document_author',
              weight: matches.length * 0.1
            };
            
            contribution.triggeredLabels.push(labelDetail);
            factor.contributions.push({
              ...contribution,
              labelDetail: labelDetail
            });
          }
        }
        
        developerFactors[author].contributions.push(contribution);
        
      } catch (error) {
        console.error(`❌ Error processing page ${page.original?.id}: ${error.message}`);
        errors++;
      }
    }
    
    // Calculate final scores and write detailed reports
    console.log('📊 Generating detailed contributing factor reports...');
    
    for (const [developer, factors] of Object.entries(developerFactors)) {
      // Calculate final scores for each category
      for (const [category, factor] of Object.entries(factors.contributingFactors)) {
        // Weight by number of contributions and average confidence
        const contributionWeight = Math.min(1.0, factor.contributions.length * 0.1);
        factor.finalScore = factor.averageConfidence * contributionWeight;
        factors.competencyScores[category] = factor.finalScore;
      }
      
      // Generate detailed report
      const report = generateDetailedReport(developer, factors);
      const filename = `${outputDir}/${developer.replace(/[^a-zA-Z0-9]/g, '_')}_contributing_factors.txt`;
      await fs.writeFile(filename, report, 'utf-8');
      
      console.log(`📝 Generated report for ${developer}: ${filename}`);
    }
    
    // Generate summary
    const summary = {
      totalDevelopers: Object.keys(developerFactors).length,
      totalEvents: eventsStored,
      totalLabels: labelsStored,
      totalErrors: errors,
      categories: Object.keys(competencyRules),
      generatedAt: new Date().toISOString(),
      developerSummaries: Object.fromEntries(
        Object.entries(developerFactors).map(([dev, factors]) => [
          dev,
          {
            totalDocuments: factors.totalDocuments,
            totalContributions: factors.contributions.length,
            competencyCategories: Object.keys(factors.contributingFactors),
            averageScore: Object.values(factors.competencyScores).reduce((a, b) => a + b, 0) / Object.values(factors.competencyScores).length || 0
          }
        ])
      )
    };
    
    await fs.writeFile(`${outputDir}/processing_summary.json`, JSON.stringify(summary, null, 2));
    
    console.log('\n🎉 Processing Complete!');
    console.log('📊 Summary:', JSON.stringify(summary, null, 2));
    
    console.log('\n🏆 Top Contributors by Document Count:');
    Object.entries(developerFactors)
      .sort(([,a], [,b]) => b.totalDocuments - a.totalDocuments)
      .slice(0, 10)
      .forEach(([developer, factors], index) => {
        console.log(`   ${index + 1}. ${developer}: ${factors.totalDocuments} documents`);
      });
    
    console.log(`\n📁 Detailed reports saved to: ${outputDir}/`);
    
  } catch (error) {
    console.error('❌ Processing failed:', error);
    throw error;
  }
}

function generateDetailedReport(developer, factors) {
  let report = `# Contributing Factors Report: ${developer}\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  
  report += `## Summary\n`;
  report += `- Total Documents: ${factors.totalDocuments}\n`;
  report += `- Total Contributions: ${factors.contributions.length}\n`;
  report += `- Competency Categories: ${Object.keys(factors.contributingFactors).length}\n\n`;
  
  report += `## Final Competency Scores\n\n`;
  
  // Sort categories by final score
  const sortedCategories = Object.entries(factors.contributingFactors)
    .sort(([,a], [,b]) => b.finalScore - a.finalScore);
  
  for (const [category, factor] of sortedCategories) {
    report += `### ${category} (${factor.row})\n`;
    report += `**Description**: ${factor.description}\n`;
    report += `**Final Score**: ${(factor.finalScore * 100).toFixed(1)}%\n`;
    report += `**Average Confidence**: ${(factor.averageConfidence * 100).toFixed(1)}%\n`;
    report += `**Total Matches**: ${factor.totalMatches}\n`;
    report += `**Contributions**: ${factor.contributions.length}\n\n`;
    
    // Show top contributing documents
    report += `#### Top Contributing Documents:\n`;
    factor.contributions
      .sort((a, b) => (b.labelDetail?.confidence || 0) - (a.labelDetail?.confidence || 0))
      .slice(0, 5)
      .forEach((contrib, index) => {
        report += `${index + 1}. **${contrib.title}**\n`;
        report += `   - Space: ${contrib.space}\n`;
        report += `   - Confidence: ${(contrib.labelDetail?.confidence * 100 || 0).toFixed(1)}%\n`;
        report += `   - Matched Keywords: ${contrib.labelDetail?.matchedKeywords?.join(', ') || 'N/A'}\n`;
        report += `   - Evidence: ${contrib.labelDetail?.evidence || 'N/A'}\n`;
        report += `   - URL: ${contrib.url}\n\n`;
      });
    
    report += `\n`;
  }
  
  report += `## All Contributions\n\n`;
  
  // Group contributions by type
  const contributionsByType = {};
  factors.contributions.forEach(contrib => {
    if (!contributionsByType[contrib.type]) {
      contributionsByType[contrib.type] = [];
    }
    contributionsByType[contrib.type].push(contrib);
  });
  
  for (const [type, contributions] of Object.entries(contributionsByType)) {
    report += `### ${type.replace('_', ' ').toUpperCase()} (${contributions.length})\n\n`;
    
    contributions.forEach(contrib => {
      report += `**${contrib.title}**\n`;
      report += `- Date: ${new Date(contrib.timestamp).toLocaleDateString()}\n`;
      report += `- Space: ${contrib.space}\n`;
      report += `- Content Length: ${contrib.contentLength} characters\n`;
      
      if (contrib.triggeredLabels.length > 0) {
        report += `- Triggered Labels:\n`;
        contrib.triggeredLabels.forEach(label => {
          report += `  - ${label.competency}: ${(label.confidence * 100).toFixed(1)}% (${label.matchedKeywords.join(', ')})\n`;
        });
      } else {
        report += `- No competency labels triggered\n`;
      }
      
      report += `- URL: ${contrib.url}\n\n`;
    });
  }
  
  return report;
}

// Run the processing
processConfluenceWithDetailedFactors().catch(console.error);
