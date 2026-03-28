import { DatabaseConnection } from "../src/database/connection";

async function checkCompetencyData() {
  const db = DatabaseConnection.getInstance();
  await db.connect();

  try {
    const result = await db.query(`
      SELECT COUNT(*) as total_scores, 
             COUNT(DISTINCT actor) as unique_actors,
             COUNT(DISTINCT competency_category) as categories,
             AVG(confidence) as avg_confidence
      FROM competency_scores
    `);

    console.log("📊 Competency Scores Summary:");
    console.log("Query Result:", result);

    // The result appears to be an array directly, not with .recordset
    const summary = Array.isArray(result) ? result[0] : result.recordset?.[0];
    console.log("Summary:", summary);

    if (!summary) {
      console.log("❌ No competency scores found in database");
      return;
    }

    console.log("Total Scores:", summary?.total_scores || 0);
    console.log("Unique Actors:", summary?.unique_actors || 0);
    console.log("Categories:", summary?.categories || 0);
    console.log(
      "Average Confidence:",
      summary?.avg_confidence?.toFixed(2) || "N/A"
    );

    const sampleScores = await db.query(`
      SELECT TOP 10 actor, competency_category, competency_row, level, confidence, evidence_count
      FROM competency_scores
      ORDER BY last_updated DESC
    `);

    console.log("\n🔍 Sample Scores:");
    const sampleData = Array.isArray(sampleScores)
      ? sampleScores
      : sampleScores.recordset || [];
    console.table(sampleData);

    const categoryBreakdown = await db.query(`
      SELECT competency_category, 
             COUNT(*) as score_count,
             AVG(confidence) as avg_confidence,
             AVG(level) as avg_level
      FROM competency_scores
      GROUP BY competency_category
      ORDER BY score_count DESC
    `);

    console.log("\n📈 Category Breakdown:");
    const categoryData = Array.isArray(categoryBreakdown)
      ? categoryBreakdown
      : categoryBreakdown.recordset || [];
    console.table(categoryData);
  } catch (error) {
    console.error("❌ Error checking competency data:", error);
  } finally {
    await db.disconnect();
  }
}

checkCompetencyData().catch(console.error);
