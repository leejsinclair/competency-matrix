const fs = require('fs').promises;
const path = require('path');

// Database connection setup
const { DatabaseConnection } = require('../dist/database/connection');

async function generateCorrectedDetailedReports() {
  console.log('🔧 Generating Corrected Detailed Sub-Competency Reports...');
  
  try {
    // Connect to database
    const db = DatabaseConnection.getInstance();
    await db.connect();
    console.log('✅ Connected to database');
    
    // Create output directory for corrected reports
    const outputDir = './test-data/corrected-detailed-factors';
    await fs.mkdir(outputDir, { recursive: true });
    
    // Get all competency labels from database
    const labelsResult = await db.query(`
      SELECT 
        e.actor,
        cl.competency_category,
        cl.competency_row,
        cl.confidence,
        cl.evidence,
        cl.created_at,
        e.metadata
      FROM competency_labels cl
      JOIN events e ON cl.event_id = e.event_id
      WHERE cl.connector_id = 2
      ORDER BY actor, competency_category, competency_row, confidence DESC
    `);
    
    // Handle MSSQL result format
    const labels = labelsResult.recordset || labelsResult;
    
    console.log(`📊 Found ${labels.length} competency labels`);
    
    // Handle case where no labels found
    if (!labels || labels.length === 0) {
      console.log('⚠️ No competency labels found in database');
      return;
    }
    
    // Group by developer
    const developerData = {};
    
    for (const label of labels) {
      if (!developerData[label.actor]) {
        developerData[label.actor] = {
          developer: label.actor,
          categories: {},
          totalLabels: 0,
          contributions: {}
        };
      }
      
      const dev = developerData[label.actor];
      dev.totalLabels++;
      
      // Parse metadata to get document info
      let metadata = {};
      try {
        metadata = JSON.parse(label.metadata || '{}');
      } catch (e) {
        metadata = {};
      }
      
      const docKey = `${metadata.pageId || 'unknown'}-${label.competency_row}`;
      
      if (!dev.contributions[docKey]) {
        dev.contributions[docKey] = {
          title: metadata.title || 'Unknown Document',
          space: metadata.space || 'UNKNOWN',
          pageId: metadata.pageId,
          url: `https://circleci.atlassian.net/wiki/spaces/${metadata.space || 'UNKNOWN'}/pages/${metadata.pageId || 'unknown'}`,
          timestamp: label.created_at,
          labels: []
        };
      }
      
      dev.contributions[docKey].labels.push({
        category: label.competency_category,
        subCompetency: label.competency_row,
        confidence: label.confidence,
        level: Math.ceil(label.confidence * 4),
        evidence: label.evidence,
        created_at: label.created_at
      });
      
      // Group by category and sub-competency
      if (!dev.categories[label.competency_category]) {
        dev.categories[label.competency_category] = {};
      }
      
      if (!dev.categories[label.competency_category][label.competency_row]) {
        dev.categories[label.competency_category][label.competency_row] = {
          subCompetency: label.competency_row,
          labels: [],
          averageConfidence: 0,
          finalScore: 0,
          evidenceCount: 0
        };
      }
      
      dev.categories[label.competency_category][label.competency_row].labels.push({
        confidence: label.confidence,
        level: Math.ceil(label.confidence * 4),
        evidence: label.evidence,
        created_at: label.created_at,
        documentTitle: metadata.title,
        documentSpace: metadata.space
      });
    }
    
    // Calculate scores and generate reports
    console.log('📈 Calculating scores and generating reports...');
    
    const summary = {
      totalDevelopers: 0,
      totalLabels: labels.length,
      categories: {},
      generatedAt: new Date().toISOString(),
      developerSummaries: {}
    };
    
    for (const [developer, data] of Object.entries(developerData)) {
      // Calculate scores for each sub-competency
      for (const [category, subCompetencies] of Object.entries(data.categories)) {
        for (const [subCompetency, subData] of Object.entries(subCompetencies)) {
          // Calculate average confidence
          const totalConfidence = subData.labels.reduce((sum, label) => sum + label.confidence, 0);
          subData.averageConfidence = totalConfidence / subData.labels.length;
          subData.evidenceCount = subData.labels.length;
          
          // Calculate final score (weighted by evidence count)
          const evidenceWeight = Math.min(1.0, subData.labels.length * 0.1);
          subData.finalScore = subData.averageConfidence * evidenceWeight;
        }
      }
      
      // Generate corrected report
      const report = generateCorrectedReport(developer, data);
      const filename = `${outputDir}/${developer.replace(/[^a-zA-Z0-9]/g, '_')}_corrected_factors.txt`;
      await fs.writeFile(filename, report, 'utf-8');
      
      console.log(`📝 Generated corrected report for ${developer}: ${filename}`);
      
      // Update summary
      summary.totalDevelopers++;
      summary.developerSummaries[developer] = {
        totalLabels: data.totalLabels,
        categories: Object.keys(data.categories),
        subCompetencies: Object.values(data.categories).reduce((total, cat) => total + Object.keys(cat).length, 0),
        averageScore: Object.values(data.categories)
          .flatMap(cat => Object.values(cat))
          .reduce((sum, sub) => sum + sub.finalScore, 0) / 
          Object.values(data.categories).flatMap(cat => Object.values(cat)).length || 0
      };
      
      // Track categories
      for (const category of Object.keys(data.categories)) {
        if (!summary.categories[category]) {
          summary.categories[category] = 0;
        }
        summary.categories[category]++;
      }
    }
    
    // Save summary
    await fs.writeFile(`${outputDir}/corrected_summary.json`, JSON.stringify(summary, null, 2));
    
    console.log('\n🎉 Corrected Report Generation Complete!');
    console.log('📊 Summary:', JSON.stringify(summary, null, 2));
    
    console.log('\n🏆 Top Developers by Average Score:');
    Object.entries(summary.developerSummaries)
      .sort(([,a], [,b]) => b.averageScore - a.averageScore)
      .slice(0, 10)
      .forEach(([developer, data], index) => {
        console.log(`   ${index + 1}. ${developer}: ${(data.averageScore * 100).toFixed(1)}% (${data.subCompetencies} sub-competencies)`);
      });
    
    console.log(`\n📁 Corrected reports saved to: ${outputDir}/`);
    
  } catch (error) {
    console.error('❌ Report generation failed:', error);
    throw error;
  }
}

function generateCorrectedReport(developer, data) {
  let report = `# Corrected Detailed Sub-Competency Report: ${developer}\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  
  report += `## Summary\n`;
  report += `- Total Labels: ${data.totalLabels}\n`;
  report += `- Categories: ${Object.keys(data.categories).length}\n`;
  report += `- Sub-Competencies: ${Object.values(data.categories).reduce((total, cat) => total + Object.keys(cat).length, 0)}\n\n`;
  
  report += `## Final Competency Scores by Category\n\n`;
  
  // Sort categories by average score
  const sortedCategories = Object.entries(data.categories)
    .map(([category, subCompetencies]) => {
      const avgScore = Object.values(subCompetencies)
        .reduce((sum, sub) => sum + sub.finalScore, 0) / Object.values(subCompetencies).length;
      return [category, subCompetencies, avgScore];
    })
    .sort(([, , a], [, , b]) => b - a);
  
  for (const [category, subCompetencies, categoryAvgScore] of sortedCategories) {
    report += `### ${category}\n`;
    report += `**Category Average Score**: ${(categoryAvgScore * 100).toFixed(1)}%\n\n`;
    
    // Sort sub-competencies by final score
    const sortedSubCompetencies = Object.entries(subCompetencies)
      .sort(([,a], [,b]) => b.finalScore - a.finalScore);
    
    for (const [subCompetencyPath, subData] of sortedSubCompetencies) {
      report += `#### ${subData.subCompetency}\n`;
      report += `**Full Path**: ${subData.subCompetency}\n`;
      report += `**Final Score**: ${(subData.finalScore * 100).toFixed(1)}%\n`;
      report += `**Average Confidence**: ${(subData.averageConfidence * 100).toFixed(1)}%\n`;
      report += `**Evidence Count**: ${subData.evidenceCount}\n`;
      report += `**Level**: ${Math.ceil(subData.averageConfidence * 4)}\n\n`;
      
      // Show top evidence items
      report += `**Top Evidence Items**:\n`;
      subData.labels
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 3)
        .forEach((label, index) => {
          report += `${index + 1}. **${label.documentTitle}**\n`;
          report += `   - Space: ${label.documentSpace}\n`;
          report += `   - Confidence: ${(label.confidence * 100).toFixed(1)}%\n`;
          report += `   - Evidence: ${label.evidence}\n`;
          report += `   - Date: ${new Date(label.created_at).toLocaleDateString()}\n\n`;
        });
      
      report += `\n`;
    }
  }
  
  report += `## All Contributions by Document\n\n`;
  
  // Group contributions by document
  const contributionsByDoc = Object.values(data.contributions)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  for (const contribution of contributionsByDoc.slice(0, 50)) { // Limit to top 50 documents
    report += `### ${contribution.title}\n`;
    report += `- Space: ${contribution.space}\n`;
    report += `- Date: ${new Date(contribution.timestamp).toLocaleDateString()}\n`;
    report += `- URL: ${contribution.url}\n`;
    report += `- Labels Triggered: ${contribution.labels.length}\n\n`;
    
    contribution.labels.forEach(label => {
      report += `**${label.category} > ${label.subCompetency}**\n`;
      report += `- Confidence: ${(label.confidence * 100).toFixed(1)}%\n`;
      report += `- Level: ${label.level}\n`;
      report += `- Evidence: ${label.evidence}\n\n`;
    });
    
    report += `---\n\n`;
  }
  
  return report;
}

// Run the corrected report generation
generateCorrectedDetailedReports().catch(console.error);
