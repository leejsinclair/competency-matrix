const fs = require('fs').promises;
const path = require('path');

// Database connection setup
const { DatabaseConnection } = require('../dist/database/connection');

async function processConfluenceToDatabase() {
  console.log('🚀 Processing Confluence Data to Database...');
  
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
    
    // Process pages and store in database
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
    
    console.log('🔄 Processing pages and storing in database...');
    
    let eventsStored = 0;
    let labelsStored = 0;
    let errors = 0;
    
    for (const page of pages) {
      try {
        if (!page.original || !page.original.body) continue;
        
        const content = page.original.body?.view?.value || page.original.body?.storage?.value || '';
        const contentLower = content.toLowerCase();
        const title = page.original.title || '';
        const author = page.original.history?.lastUpdated?.by?.publicName || page.original.history?.lastUpdated?.by?.accountId || 'unknown';
        const space = page.original.space?.key || 'UNKNOWN';
        const timestamp = page.original.createdAt || page.original.updatedAt || new Date().toISOString();
        
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
        
        // Apply competency rules and store labels
        for (const [category, rule] of Object.entries(competencyRules)) {
          const matches = rule.keywords.filter(keyword => 
            contentLower.includes(keyword) || title.toLowerCase().includes(keyword)
          );
          
          if (matches.length > 0) {
            const confidence = Math.min(0.5 + (matches.length * 0.2), 0.95);
            const level = Math.min(matches.length + 1, 3);
            
            await db.query(`
              INSERT INTO competency_labels (event_id, connector_id, competency_category, competency_row, level, confidence, source, evidence, created_at)
              VALUES (@param0, @param1, @param2, @param3, @param4, @param5, @param6, @param7, @param8)
            `, [
              eventId,
              2, // Confluence connector ID
              category,
              rule.row,
              level,
              confidence,
              'rule',
              `Found keywords: ${matches.join(', ')}`,
              new Date()
            ]);
            
            labelsStored++;
          }
        }
        
        // Progress indicator
        if ((eventsStored + labelsStored) % 100 === 0) {
          console.log(`📊 Processed ${eventsStored} events, ${labelsStored} labels...`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing page ${page.original?.id}:`, error.message);
        errors++;
      }
    }
    
    // Generate summary statistics
    console.log('📊 Generating summary statistics...');
    
    const summaryResult = await db.query(`
      SELECT 
        COUNT(DISTINCT e.event_id) as total_events,
        COUNT(DISTINCT e.actor) as total_contributors,
        COUNT(cl.id) as total_labels,
        COUNT(DISTINCT cl.competency_category) as total_categories
      FROM events e
      LEFT JOIN competency_labels cl ON e.event_id = cl.event_id
      WHERE e.connector_id = 2
    `);
    
    const topCompetenciesResult = await db.query(`
      SELECT 
        cl.competency_category,
        cl.competency_row,
        COUNT(*) as count
      FROM competency_labels cl
      WHERE cl.connector_id = 2
      GROUP BY cl.competency_category, cl.competency_row
      ORDER BY count DESC
    `);
    
    const topContributorsResult = await db.query(`
      SELECT TOP 10
        e.actor,
        COUNT(DISTINCT e.event_id) as events,
        COUNT(cl.id) as labels,
        AVG(CAST(cl.confidence AS FLOAT)) as avg_confidence,
        STUFF((
          SELECT DISTINCT ',' + cl2.competency_category
          FROM competency_labels cl2
          INNER JOIN events e2 ON cl2.event_id = e2.event_id
          WHERE e2.actor = e.actor AND cl2.connector_id = 2
          FOR XML PATH('')
        ), 1, 1, '') as competency_areas
      FROM events e
      LEFT JOIN competency_labels cl ON e.event_id = cl.event_id
      WHERE e.connector_id = 2
      GROUP BY e.actor
      ORDER BY labels DESC
    `);
    
    const summary = {
      dataSource: 'confluence',
      totalEvents: summaryResult[0]?.total_events || 0,
      processedEvents: summaryResult[0]?.total_events || 0,
      labelsGenerated: summaryResult[0]?.total_labels || 0,
      errors: errors,
      competencyCategories: summaryResult[0]?.total_categories || 0,
      topCompetencyAreas: topCompetenciesResult.map(row => ({
        area: `${row.competency_category}/${row.competency_row}`,
        category: row.competency_category,
        count: row.count
      })),
      contributors: topContributorsResult.map(row => ({
        actor: row.actor,
        events: row.events,
        labelsGenerated: row.labels,
        competencyAreas: row.competency_areas ? row.competency_areas.split(',') : [],
        averageConfidence: row.avg_confidence || 0,
        topCompetency: row.competency_areas ? row.competency_areas.split(',')[0] : 'None'
      })),
      generatedAt: new Date().toISOString()
    };
    
    // Display results
    console.log('\n🎉 Processing Complete!');
    console.log('📊 Summary:', JSON.stringify(summary, null, 2));
    
    console.log('\n🏆 Top Competency Areas:');
    summary.topCompetencyAreas.slice(0, 10).forEach((area, index) => {
      console.log(`   ${index + 1}. ${area.area} (${area.count} occurrences)`);
    });
    
    console.log('\n👥 Top Contributors:');
    summary.contributors.slice(0, 10).forEach((contributor, index) => {
      console.log(`   ${index + 1}. ${contributor.actor}`);
      console.log(`      Events: ${contributor.events}, Labels: ${contributor.labelsGenerated}`);
      console.log(`      Top Competency: ${contributor.topCompetency}`);
      console.log(`      Average Confidence: ${contributor.averageConfidence.toFixed(2)}`);
    });
    
    // Save summary to file for reference
    await fs.writeFile('./test-data/confluence-database-summary.json', JSON.stringify(summary, null, 2));
    console.log('\n💾 Summary saved to ./test-data/confluence-database-summary.json');
    
    console.log(`\n✅ Database Processing Complete!`);
    console.log(`   - Events stored: ${eventsStored}`);
    console.log(`   - Labels stored: ${labelsStored}`);
    console.log(`   - Errors: ${errors}`);
    
  } catch (error) {
    console.error('❌ Processing failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    try {
      const db = DatabaseConnection.getInstance();
      await db.close();
      console.log('🔌 Database connection closed');
    } catch (error) {
      console.error('Error closing database:', error);
    }
  }
}

// Run the processor
processConfluenceToDatabase();
