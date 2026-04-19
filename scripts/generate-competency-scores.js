const { DatabaseConnection } = require('../dist/database/connection');
const taxonomy = require('../taxonomy/tech-taxonomy.json');

function normalizeTerm(term) {
  return String(term || '').trim().toLowerCase();
}

function buildTaxonomyLookup(node, lookup = { difficulty: new Map(), canonical: new Map() }) {
  if (Array.isArray(node.terms)) {
    for (const term of node.terms) {
      const difficulty = term.difficulty || 'medium';
      const canonical = normalizeTerm(term.canonical);
      lookup.difficulty.set(canonical, difficulty);
      lookup.canonical.set(canonical, canonical);

      if (Array.isArray(term.variants)) {
        for (const variant of term.variants) {
          const normalizedVariant = normalizeTerm(variant);
          lookup.difficulty.set(normalizedVariant, difficulty);
          lookup.canonical.set(normalizedVariant, canonical);
        }
      }
    }
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      buildTaxonomyLookup(child, lookup);
    }
  }

  return lookup;
}

function extractMatchedKeywords(evidenceText) {
  const text = String(evidenceText || '');
  const matchedFormat = text.match(/Matched keywords:\s*(.+?)\s*in document:/i);
  const foundFormat = text.match(/Found keywords:\s*(.+?)\s*in\s*"/i) || text.match(/Found keywords:\s*(.+)$/i);
  const rawKeywords = (matchedFormat && matchedFormat[1]) || (foundFormat && foundFormat[1]);

  if (!rawKeywords) {
    return [];
  }

  return rawKeywords
    .split(',')
    .map((keyword) => normalizeTerm(keyword))
    .filter(Boolean);
}

function extractCanonicalKeywordsByEvidence(evidences, canonicalLookup) {
  return evidences.map((evidence) => {
    const canonicalTerms = extractMatchedKeywords(evidence)
      .map((keyword) => canonicalLookup.get(keyword) || keyword)
      .filter(Boolean);

    // Avoid counting multiple variants of the same concept within one evidence item.
    return Array.from(new Set(canonicalTerms));
  });
}

function calculateDifficultyMultiplier(evidences, difficultyLookup, canonicalLookup) {
  const weights = {
    easy: 0.5,
    medium: 0.8,
    hard: 1.0,
  };

  const keywords = extractCanonicalKeywordsByEvidence(
    evidences,
    canonicalLookup
  ).flat();

  if (keywords.length === 0) {
    return {
      multiplier: weights.medium,
      difficultyBreakdown: { easy: 0, medium: 0, hard: 0 },
    };
  }

  const difficultyBreakdown = { easy: 0, medium: 0, hard: 0 };
  let weightedSum = 0;

  for (const keyword of keywords) {
    const difficulty = difficultyLookup.get(keyword) || 'medium';
    difficultyBreakdown[difficulty] = (difficultyBreakdown[difficulty] || 0) + 1;
    weightedSum += weights[difficulty] || weights.medium;
  }

  return {
    multiplier: weightedSum / keywords.length,
    difficultyBreakdown,
  };
}

function calculateTermMomentum(evidences, canonicalLookup) {
  const canonicalByEvidence = extractCanonicalKeywordsByEvidence(evidences, canonicalLookup);
  const canonicalTerms = canonicalByEvidence.flat();

  if (canonicalTerms.length === 0) {
    return {
      multiplier: 0.75,
      totalMentions: 0,
      uniqueCanonicals: 0,
    };
  }

  const uniqueCanonicals = new Set(canonicalTerms).size;
  const totalMentions = canonicalTerms.length;

  const canonicalCounts = new Map();
  for (const canonical of canonicalTerms) {
    canonicalCounts.set(canonical, (canonicalCounts.get(canonical) || 0) + 1);
  }
  const maxCanonicalMentions = Math.max(...canonicalCounts.values());
  const dominanceRatio = maxCanonicalMentions / totalMentions;

  // Strongly dampen rows that only mention one canonical concept repeatedly.
  if (uniqueCanonicals <= 1) {
    return {
      multiplier: 0.6 + Math.min(0.15, Math.log2(1 + totalMentions) * 0.04), // ~0.60..0.75
      totalMentions,
      uniqueCanonicals,
    };
  }

  // Breadth matters most; volume helps, but over-concentration gets penalized.
  const volumeFactor = Math.min(1, Math.log2(1 + totalMentions) / 4); // slower gain than before
  const breadthFactor = Math.min(1, uniqueCanonicals / 6);
  const diversityFactor = 1 - Math.max(0, dominanceRatio - 0.5); // penalty when one term dominates
  const combinedMomentum =
    (volumeFactor * 0.2) +
    (breadthFactor * 0.6) +
    (diversityFactor * 0.2);

  return {
    multiplier: 0.65 + (combinedMomentum * 0.45), // Range: 0.65..1.1
    totalMentions,
    uniqueCanonicals,
  };
}

function calculateSpecificityMultiplier(evidences, canonicalLookup) {
  const genericCanonicals = new Set([
    'confluence',
    'bitbucket',
    'jira',
    'deployment',
    'service',
    'container',
    'docker',
    'html',
    'testing',
    '.net',
    'git',
    'api gateway',
  ]);

  const canonicalTerms = extractCanonicalKeywordsByEvidence(evidences, canonicalLookup).flat();
  if (canonicalTerms.length === 0) {
    return { multiplier: 1.0, genericRatio: 0, uniqueCanonicals: 0 };
  }

  const uniqueCanonicals = new Set(canonicalTerms).size;
  const genericMentions = canonicalTerms.filter((term) => genericCanonicals.has(term)).length;
  const genericRatio = genericMentions / canonicalTerms.length;

  // Strong penalty for rows explained almost entirely by generic vocabulary.
  if (genericRatio >= 0.9 && uniqueCanonicals <= 2) {
    return { multiplier: 0.5, genericRatio, uniqueCanonicals };
  }

  // Smooth penalty as generic ratio increases.
  const multiplier = Math.max(0.65, 1 - (genericRatio * 0.35));
  return { multiplier, genericRatio, uniqueCanonicals };
}

async function generateCompetencyScores() {
  console.log('🎯 Generating Aggregated Competency Scores...');

  try {
    // Connect to database
    const db = DatabaseConnection.getInstance();
    await db.connect();
    console.log('✅ Connected to database');

    // Clear existing scores
    console.log('🧹 Clearing existing competency scores...');
    await db.query('DELETE FROM competency_scores');

    const taxonomyLookup = buildTaxonomyLookup(taxonomy);
    const difficultyLookup = taxonomyLookup.difficulty;
    const canonicalLookup = taxonomyLookup.canonical;
    console.log(`🧠 Loaded taxonomy lookup for ${difficultyLookup.size} terms/variants`);

    // Get all competency labels grouped by contributor and competency
    console.log('📊 Analyzing competency labels...');
    const contributorCompetencies = await db.query(`
      SELECT 
        e.actor,
        cl.competency_category,
        cl.competency_row,
        COUNT(cl.id) as label_count,
        AVG(CAST(cl.confidence AS FLOAT)) as avg_confidence,
        MAX(cl.confidence) as max_confidence,
        MIN(cl.confidence) as min_confidence,
        STRING_AGG(CAST(cl.level AS VARCHAR), ',') as levels,
        STRING_AGG(CAST(cl.evidence AS VARCHAR(MAX)), '|||') as evidences,
        COUNT(DISTINCT cl.event_id) as evidence_count,
        e.connector_id
      FROM events e
      INNER JOIN competency_labels cl ON e.event_id = cl.event_id
      WHERE e.connector_id = 2
      GROUP BY e.actor, cl.competency_category, cl.competency_row, e.connector_id
    `);

    console.log(`📈 Found ${contributorCompetencies.length} contributor-competency combinations`);

    // Calculate competency scores for each combination
    let scoresInserted = 0;
    for (const combo of contributorCompetencies) {
      // Calculate score based on multiple factors
      const frequencyScore = Math.min(combo.label_count / 10, 1.0); // More evidence = higher score
      const confidenceScore = combo.avg_confidence; // Average confidence
      const consistencyScore = 1.0 - ((combo.max_confidence - combo.min_confidence) / combo.max_confidence); // Consistent confidence
      const breadthScore = Math.min(combo.evidence_count / 5, 1.0); // Evidence from multiple events

      const evidences = String(combo.evidences || '')
        .split('|||')
        .map((entry) => entry.trim())
        .filter(Boolean);
      const { multiplier: difficultyMultiplier } = calculateDifficultyMultiplier(
        evidences,
        difficultyLookup,
        canonicalLookup
      );
      const { multiplier: momentumMultiplier } = calculateTermMomentum(
        evidences,
        canonicalLookup
      );
      const { multiplier: specificityMultiplier } = calculateSpecificityMultiplier(
        evidences,
        canonicalLookup
      );

      // Weighted score calculation
      const weights = {
        frequency: 0.3,
        confidence: 0.4,
        consistency: 0.2,
        breadth: 0.1
      };

      const overallScore = (
        frequencyScore * weights.frequency +
        confidenceScore * weights.confidence +
        consistencyScore * weights.consistency +
        breadthScore * weights.breadth
      );

      const difficultyAdjustedScore = Math.min(
        1.0,
        Math.max(0, overallScore * difficultyMultiplier * momentumMultiplier * specificityMultiplier)
      );

      // Determine competency level based on score and levels
      const levelsArray = combo.levels.split(',').map(Number);
      const avgLevel = levelsArray.reduce((a, b) => a + b, 0) / levelsArray.length;

      let competencyLevel = 1; // Beginner
      if (difficultyAdjustedScore >= 0.8 && avgLevel >= 2.5) competencyLevel = 4; // Expert
      else if (difficultyAdjustedScore >= 0.6 && avgLevel >= 2) competencyLevel = 3; // Advanced
      else if (difficultyAdjustedScore >= 0.4 && avgLevel >= 1.5) competencyLevel = 2; // Intermediate

      // Insert competency score
      await db.query(`
        INSERT INTO competency_scores (
          connector_id,
          competency_category, 
          competency_row, 
          actor, 
          level, 
          confidence, 
          evidence_count, 
          last_updated
        ) VALUES (@param0, @param1, @param2, @param3, @param4, @param5, @param6, @param7)
      `, [
        combo.connector_id,
        combo.competency_category,
        combo.competency_row,
        combo.actor,
        competencyLevel,
        difficultyAdjustedScore,
        combo.evidence_count,
        new Date()
      ]);

      scoresInserted++;
    }

    // Generate overall contributor summaries
    console.log('📈 Generating contributor summaries...');
    const contributorSummaries = await db.query(`
      SELECT 
        actor,
        COUNT(*) as total_competencies,
        AVG(confidence) as avg_score,
        MAX(confidence) as max_score,
        COUNT(DISTINCT competency_category) as category_diversity,
        connector_id
      FROM competency_scores
      WHERE connector_id = 2
      GROUP BY actor, connector_id
    `);

    console.log('\n🎉 Competency Scores Generated Successfully!');
    console.log(`📊 Scores Inserted: ${scoresInserted}`);
    console.log(`👥 Contributors Analyzed: ${contributorSummaries.length}`);

    // Display top contributors
    console.log('\n🏆 Top Contributors by Average Score:');
    contributorSummaries
      .sort((a, b) => b.avg_score - a.avg_score)
      .slice(0, 10)
      .forEach((contributor, index) => {
        console.log(`   ${index + 1}. ${contributor.actor}`);
        console.log(`      Avg Score: ${contributor.avg_score.toFixed(3)}`);
        console.log(`      Max Score: ${contributor.max_score.toFixed(3)}`);
        console.log(`      Competencies: ${contributor.total_competencies}`);
        console.log(`      Categories: ${contributor.category_diversity}`);
      });

    // Display competency distribution
    const categoryDistribution = await db.query(`
      SELECT 
        competency_category,
        AVG(confidence) as avg_score,
        COUNT(*) as contributor_count,
        COUNT(DISTINCT actor) as unique_contributors
      FROM competency_scores
      WHERE connector_id = 2
      GROUP BY competency_category
      ORDER BY avg_score DESC
    `);

    console.log('\n📊 Competency Category Distribution:');
    categoryDistribution.forEach((category) => {
      console.log(`   ${category.competency_category}`);
      console.log(`      Avg Score: ${category.avg_score.toFixed(3)}`);
      console.log(`      Contributors: ${category.unique_contributors}`);
      console.log(`      Total Assessments: ${category.contributor_count}`);
    });

    // Save summary to file
    const summary = {
      generatedAt: new Date().toISOString(),
      totalScores: scoresInserted,
      contributors: contributorSummaries,
      categoryDistribution: categoryDistribution
    };

    const fs = require('fs').promises;
    await fs.writeFile('./test-data/competency-scores-summary.json', JSON.stringify(summary, null, 2));
    console.log('\n💾 Summary saved to ./test-data/competency-scores-summary.json');

  } catch (error) {
    console.error('❌ Failed to generate competency scores:', error);
    process.exit(1);
  } finally {
    try {
      const db = DatabaseConnection.getInstance();
      await db.close();
      console.log('🔌 Database connection closed');
    } catch (error) {
      console.error('Error closing database:', error);
    }
  }
}

// Run the score generation
generateCompetencyScores();
