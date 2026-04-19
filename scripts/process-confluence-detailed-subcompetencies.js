const fs = require('fs').promises;
const path = require('path');

// Database connection setup
const { DatabaseConnection } = require('../dist/database/connection');

/**
 * Word boundary matching function to avoid false positives
 * Matches whole words only, not substrings within other words
 * @param {string} text - The text to search in
 * @param {string} word - The word to search for
 * @returns {boolean} - True if word is found as a whole word
 */
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasWordBoundaryMatch(text, word) {
  const escapedWord = escapeRegExp(word);
  // Use explicit alpha-numeric boundaries so terms like C# and .NET match reliably
  const pattern = new RegExp(`(?:^|[^A-Za-z0-9])${escapedWord}(?=$|[^A-Za-z0-9])`, 'i');
  return pattern.test(text);
}

/**
 * Alternative word boundary matching for complex cases
 * Handles hyphens, underscores, and other word separators
 */
function hasAdvancedWordBoundaryMatch(text, word) {
  return hasWordBoundaryMatch(text, word);
}

async function processConfluenceWithDetailedSubCompetencies() {
  console.log('🚀 Processing Confluence Data with Detailed Sub-Competencies...');

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
    const outputDir = './test-data/detailed-contributing-factors';
    await fs.mkdir(outputDir, { recursive: true });

    // Load the detailed taxonomy
    const taxonomyPath = './taxonomy/tech-taxonomy.json';
    const taxonomyData = await fs.readFile(taxonomyPath, 'utf-8');
    const taxonomy = JSON.parse(taxonomyData);

    // Build detailed competency rules from taxonomy
    const detailedCompetencyRules = buildDetailedCompetencyRules(taxonomy);

    console.log(`📊 Loaded ${Object.keys(detailedCompetencyRules).length} detailed competency areas`);

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

        // Apply detailed competency rules and store labels
        for (const [competencyPath, rule] of Object.entries(detailedCompetencyRules)) {
          const matches = rule.keywords.filter(keyword =>
            hasAdvancedWordBoundaryMatch(contentLower, keyword.toLowerCase()) ||
            hasAdvancedWordBoundaryMatch(title.toLowerCase(), keyword.toLowerCase())
          );

          const canonicalMatches = Array.from(new Set(
            matches.map((keyword) => rule.keywordToCanonical[keyword.toLowerCase()] || keyword)
          ));

          if (canonicalMatches.length > 0) {
            const confidence = Math.min(0.9, 0.5 + (canonicalMatches.length * 0.1));

            // Store label in database with detailed competency path
            await db.query(`
              INSERT INTO competency_labels (event_id, connector_id, competency_category, competency_row, level, confidence, source, evidence, created_at)
              VALUES (@param0, @param1, @param2, @param3, @param4, @param5, @param6, @param7, @param8)
            `, [
              eventId,
              2,
              rule.category, // High-level category
              competencyPath, // Detailed sub-competency path
              Math.ceil(confidence * 4), // Convert to level 1-4
              confidence,
              'rule',
              `Matched keywords: ${canonicalMatches.join(', ')} in document: ${title}`,
              new Date()
            ]);

            labelsStored++;

            // Track contributing factors at detailed level
            if (!developerFactors[author].contributingFactors[competencyPath]) {
              developerFactors[author].contributingFactors[competencyPath] = {
                category: rule.category,
                subCompetency: rule.subCompetency,
                detailedPath: competencyPath,
                description: rule.description,
                totalMatches: 0,
                contributions: [],
                averageConfidence: 0,
                finalScore: 0
              };
            }

            const factor = developerFactors[author].contributingFactors[competencyPath];
            factor.totalMatches += canonicalMatches.length;
            factor.averageConfidence = (factor.averageConfidence * (factor.contributions.length) + confidence) / (factor.contributions.length + 1);

            const labelDetail = {
              competency: competencyPath,
              category: rule.category,
              subCompetency: rule.subCompetency,
              confidence: confidence,
              level: Math.ceil(confidence * 4),
              matchedKeywords: canonicalMatches,
              evidence: `Found keywords: ${canonicalMatches.join(', ')} in "${title}"`,
              contributionType: 'document_author',
              weight: canonicalMatches.length * 0.1
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
    console.log('📊 Generating detailed sub-competency reports...');

    for (const [developer, factors] of Object.entries(developerFactors)) {
      // Calculate final scores for each detailed competency
      for (const [competencyPath, factor] of Object.entries(factors.contributingFactors)) {
        // Weight by number of contributions and average confidence
        const contributionWeight = Math.min(1.0, factor.contributions.length * 0.1);
        factor.finalScore = factor.averageConfidence * contributionWeight;
        factors.competencyScores[competencyPath] = factor.finalScore;
      }

      // Generate detailed report
      const report = generateDetailedSubCompetencyReport(developer, factors);
      const filename = `${outputDir}/${developer.replace(/[^a-zA-Z0-9]/g, '_')}_detailed_factors.txt`;
      await fs.writeFile(filename, report, 'utf-8');

      console.log(`📝 Generated detailed report for ${developer}: ${filename}`);
    }

    // Generate summary
    const summary = {
      totalDevelopers: Object.keys(developerFactors).length,
      totalEvents: eventsStored,
      totalLabels: labelsStored,
      totalErrors: errors,
      detailedCompetencies: Object.keys(detailedCompetencyRules).length,
      categories: [...new Set(Object.values(detailedCompetencyRules).map(r => r.category))],
      generatedAt: new Date().toISOString(),
      developerSummaries: Object.fromEntries(
        Object.entries(developerFactors).map(([dev, factors]) => [
          dev,
          {
            totalDocuments: factors.totalDocuments,
            totalContributions: factors.contributions.length,
            detailedCompetencies: Object.keys(factors.contributingFactors),
            categories: [...new Set(Object.values(factors.contributingFactors).map(f => f.category))],
            averageScore: Object.values(factors.competencyScores).reduce((a, b) => a + b, 0) / Object.values(factors.competencyScores).length || 0
          }
        ])
      )
    };

    await fs.writeFile(`${outputDir}/detailed_processing_summary.json`, JSON.stringify(summary, null, 2));

    console.log('\n🎉 Detailed Processing Complete!');
    console.log('📊 Summary:', JSON.stringify(summary, null, 2));

    console.log('\n🏆 Top Contributors by Document Count:');
    Object.entries(developerFactors)
      .sort(([, a], [, b]) => b.totalDocuments - a.totalDocuments)
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

function buildDetailedCompetencyRules(taxonomy) {
  const rules = {};

  function extractTerms(node, path = []) {
    if (node.terms && Array.isArray(node.terms)) {
      // This is a competency node with terms
      const competencyPath = path.join(' > ');
      const keywordToCanonical = {};

      for (const term of node.terms) {
        const canonical = term.canonical;
        const variants = Array.isArray(term.variants) ? term.variants : [];
        const allTerms = [canonical, ...variants].filter(Boolean);

        for (const keyword of allTerms) {
          keywordToCanonical[String(keyword).toLowerCase()] = canonical;
        }
      }

      const allVariants = Object.keys(keywordToCanonical);

      if (allVariants.length > 0) {
        rules[competencyPath] = {
          category: path[0] || 'unknown',
          subCompetency: path[path.length - 1] || 'unknown',
          keywords: allVariants,
          keywordToCanonical,
          description: `${competencyPath} - ${allVariants.length} related terms`
        };
      }
    }

    // Recursively process children
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        extractTerms(child, [...path, child.name]);
      }
    }
  }

  // Start from root and extract all terms
  if (taxonomy.children) {
    for (const child of taxonomy.children) {
      extractTerms(child, [child.name]);
    }
  }

  console.log(`📋 Built ${Object.keys(rules).length} detailed competency rules`);
  return rules;
}

function generateDetailedSubCompetencyReport(developer, factors) {
  let report = `# Detailed Sub-Competency Report: ${developer}\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;

  report += `## Summary\n`;
  report += `- Total Documents: ${factors.totalDocuments}\n`;
  report += `- Total Contributions: ${factors.contributions.length}\n`;
  report += `- Detailed Competencies: ${Object.keys(factors.contributingFactors).length}\n\n`;

  // Group by high-level category
  const categories = {};
  for (const [path, factor] of Object.entries(factors.contributingFactors)) {
    if (!categories[factor.category]) {
      categories[factor.category] = [];
    }
    categories[factor.category].push({ path, factor });
  }

  report += `## Final Competency Scores by Category\n\n`;

  for (const [category, competencies] of Object.entries(categories)) {
    report += `### ${category}\n\n`;

    // Sort by final score
    competencies.sort((a, b) => b.factor.finalScore - a.factor.finalScore);

    for (const { path, factor } of competencies) {
      report += `#### ${factor.subCompetency}\n`;
      report += `**Full Path**: ${path}\n`;
      report += `**Description**: ${factor.description}\n`;
      report += `**Final Score**: ${(factor.finalScore * 100).toFixed(1)}%\n`;
      report += `**Average Confidence**: ${(factor.averageConfidence * 100).toFixed(1)}%\n`;
      report += `**Total Matches**: ${factor.totalMatches}\n`;
      report += `**Contributions**: ${factor.contributions.length}\n\n`;

      // Show top contributing documents
      report += `**Top Contributing Documents**:\n`;
      factor.contributions
        .sort((a, b) => (b.labelDetail?.confidence || 0) - (a.labelDetail?.confidence || 0))
        .slice(0, 3)
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
  }

  report += `## All Contributions by Detailed Competency\n\n`;

  // Group contributions by detailed competency
  const contributionsByCompetency = {};
  factors.contributions.forEach(contrib => {
    contrib.triggeredLabels.forEach(label => {
      if (!contributionsByCompetency[label.competency]) {
        contributionsByCompetency[label.competency] = [];
      }
      contributionsByCompetency[label.competency].push(contrib);
    });
  });

  for (const [competency, contributions] of Object.entries(contributionsByCompetency)) {
    report += `### ${competency}\n\n`;

    contributions.forEach(contrib => {
      report += `**${contrib.title}**\n`;
      report += `- Date: ${new Date(contrib.timestamp).toLocaleDateString()}\n`;
      report += `- Space: ${contrib.space}\n`;
      report += `- Content Length: ${contrib.contentLength} characters\n`;

      const relevantLabels = contrib.triggeredLabels.filter(l => l.competency === competency);
      if (relevantLabels.length > 0) {
        report += `- Triggered Labels:\n`;
        relevantLabels.forEach(label => {
          report += `  - ${label.subCompetency}: ${(label.confidence * 100).toFixed(1)}% (${label.matchedKeywords.join(', ')})\n`;
        });
      }

      report += `- URL: ${contrib.url}\n\n`;
    });
  }

  return report;
}

// Run the processing
processConfluenceWithDetailedSubCompetencies().catch(console.error);
