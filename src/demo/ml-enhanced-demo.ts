import { FeatureExtractor } from "../processing/feature-extractor";
import { MLClassifier } from "../processing/ml-classifier";
import { ActivityEvent } from "../types/activity";

/**
 * Enhanced ML Classification demonstration with diverse training data
 */
async function demonstrateMLClassificationEnhanced() {
  console.log("🚀 Starting Enhanced ML Classification Demonstration\n");

  // Initialize components
  const featureExtractor = new FeatureExtractor();
  const mlClassifier = new MLClassifier({
    epochs: 10,
    hiddenLayers: [16, 8],
    batchSize: 4,
  });

  // Create diverse sample events with different competency patterns
  const diverseEvents: ActivityEvent[] = [
    {
      id: "beginner-1",
      type: "confluence-page",
      content: "Basic setup guide with simple instructions.",
      timestamp: "2024-01-15T10:00:00Z",
      source: "confluence",
      actor: "junior@example.com",
      metadata: { title: "Getting Started", space: "DEV" },
    },
    {
      id: "intermediate-1",
      type: "confluence-page",
      content:
        "REST API design with database optimization and security considerations using Docker containers.",
      timestamp: "2024-01-15T11:00:00Z",
      source: "confluence",
      actor: "midlevel@example.com",
      metadata: { title: "API Design", space: "DEV", labels: ["api"] },
    },
    {
      id: "advanced-1",
      type: "confluence-page",
      content:
        "Microservices architecture with Kubernetes orchestration, CI/CD pipelines, Terraform infrastructure, and advanced security patterns.",
      timestamp: "2024-01-15T12:00:00Z",
      source: "confluence",
      actor: "senior@example.com",
      metadata: {
        title: "Advanced Architecture",
        space: "DEV",
        labels: ["architecture", "kubernetes"],
      },
    },
    {
      id: "expert-1",
      type: "pull-request-review",
      content:
        "Complex system architecture review with performance optimization, security hardening, and scalability recommendations for enterprise deployment.",
      timestamp: "2024-01-15T13:00:00Z",
      source: "git",
      actor: "expert@example.com",
      metadata: { comments: 15, suggestions: 8, approvals: 1 },
    },
    {
      id: "frontend-1",
      type: "confluence-page",
      content:
        "React component development with TypeScript, state management, and responsive design patterns.",
      timestamp: "2024-01-15T14:00:00Z",
      source: "confluence",
      actor: "frontend@example.com",
      metadata: {
        title: "React Components",
        space: "WEB",
        labels: ["react", "typescript"],
      },
    },
    {
      id: "devops-1",
      type: "jira-ticket",
      content:
        "CI/CD pipeline setup with Jenkins, Docker registry, and automated testing integration.",
      timestamp: "2024-01-15T15:00:00Z",
      source: "jira",
      actor: "devops@example.com",
      metadata: { issueKey: "DEVOPS-001", priority: "High" },
    },
  ];

  console.log(`📝 Created ${diverseEvents.length} diverse ActivityEvents\n`);

  // Step 1: Extract features
  console.log("🔍 Step 1: Extracting features from diverse events...");
  const featureVectors = featureExtractor.extractFeaturesBatch(diverseEvents);

  console.log(`✅ Extracted features for ${featureVectors.length} events`);
  console.log(
    `📊 Each feature vector has ${featureVectors[0].vector.length} features\n`
  );

  // Step 2: Create synthetic rule classifications for diverse labels
  console.log("⚡ Step 2: Creating diverse rule-based classifications...");
  const syntheticClassifications = [
    {
      id: "beginner-1",
      labels: [
        {
          competencyCategory: "programming-languages",
          competencyRow: "software-engineering",
          level: { name: "Beginner" },
          confidence: 0.8,
        },
      ],
    },
    {
      id: "intermediate-1",
      labels: [
        {
          competencyCategory: "programming-languages",
          competencyRow: "software-engineering",
          level: { name: "Intermediate" },
          confidence: 0.9,
        },
      ],
    },
    {
      id: "advanced-1",
      labels: [
        {
          competencyCategory: "programming-languages",
          competencyRow: "software-engineering",
          level: { name: "Advanced" },
          confidence: 0.9,
        },
      ],
    },
    {
      id: "expert-1",
      labels: [
        {
          competencyCategory: "programming-languages",
          competencyRow: "software-engineering",
          level: { name: "Expert" },
          confidence: 0.95,
        },
      ],
    },
    {
      id: "frontend-1",
      labels: [
        {
          competencyCategory: "web-development",
          competencyRow: "frontend",
          level: { name: "Intermediate" },
          confidence: 0.85,
        },
      ],
    },
    {
      id: "devops-1",
      labels: [
        {
          competencyCategory: "containers-orchestration",
          competencyRow: "devops-platform-engineering",
          level: { name: "Advanced" },
          confidence: 0.9,
        },
      ],
    },
  ];

  console.log(`✅ Created diverse classifications:`);
  syntheticClassifications.forEach((sc) => {
    console.log(
      `   Event ${sc.id}: ${sc.labels[0].competencyCategory}/${sc.labels[0].competencyRow}/${sc.labels[0].level.name}`
    );
  });
  console.log("");

  // Step 3: Create training data
  console.log("📚 Step 3: Creating training data...");
  const trainingData = mlClassifier.createTrainingDataFromRules(
    featureVectors,
    syntheticClassifications
  );

  console.log(`✅ Training data created:`);
  console.log(`   - Total samples: ${trainingData.metadata.totalSamples}`);
  console.log(
    `   - Categories: ${trainingData.metadata.categories.join(", ")}`
  );
  console.log(`   - Levels: ${trainingData.metadata.levels.join(", ")}`);
  console.log(`   - Feature count: ${trainingData.metadata.featureCount}\n`);

  // Step 4: Train ML model
  console.log("🧠 Step 4: Training ML model...");
  try {
    await mlClassifier.trainModel(trainingData);
    console.log("✅ Model training completed!\n");

    // Step 5: Test predictions
    console.log("🔮 Step 5: Testing ML predictions...");
    const testEvent: ActivityEvent = {
      id: "test-advanced",
      type: "confluence-page",
      content:
        "Advanced system design with microservices, Kubernetes deployment, and security best practices.",
      timestamp: "2024-01-15T16:00:00Z",
      source: "confluence",
      actor: "test@example.com",
      metadata: {
        title: "System Design",
        space: "DEV",
        labels: ["architecture"],
      },
    };

    const testFeatureVector = featureExtractor.extractFeatures(testEvent);
    const mlResult = await mlClassifier.classify(testFeatureVector);

    console.log("🤖 ML Classification Results:");
    console.log(`   Event ID: ${mlResult.id}`);
    console.log(`   Top 3 predictions:`);

    mlResult.predictions.slice(0, 3).forEach((pred, index) => {
      console.log(
        `     ${index + 1}. ${pred.competencyCategory}/${pred.competencyRow}/${pred.level} - ${(pred.confidence * 100).toFixed(1)}% confidence`
      );
    });
    console.log("");

    // Step 6: Demonstrate feature importance
    console.log("📊 Step 6: Feature Analysis for Test Event:");
    const features = testFeatureVector.features;
    console.log(`   Text Analysis:`);
    console.log(`     - Word count: ${features.word_count}`);
    console.log(
      `     - Semantic complexity: ${features.semantic_complexity.toFixed(3)}`
    );
    console.log(
      `     - Technical term density: ${features.technical_term_density.toFixed(3)}`
    );
    console.log(`   Activity Patterns:`);
    console.log(`     - Is Confluence page: ${features.is_confluence_page}`);
    console.log(
      `     - Collaboration score: ${features.collaboration_score.toFixed(3)}`
    );
    console.log(`   Temporal Patterns:`);
    console.log(`     - Business hours: ${features.is_business_hours}`);
    console.log(`     - Recent activity: ${features.is_recent_activity}`);
    console.log("");

    console.log("🎉 Enhanced ML Classification Demo Complete!");
    console.log("📈 Summary:");
    console.log(`   - Processed ${diverseEvents.length} diverse events`);
    console.log(
      `   - Extracted ${featureVectors[0].vector.length} features per event`
    );
    console.log(
      `   - Trained ML model with ${trainingData.metadata.totalSamples} samples`
    );
    console.log(`   - Achieved multi-class competency classification`);
    console.log(`   - Demonstrated feature analysis capabilities`);
  } catch (error) {
    console.error("❌ Error during enhanced ML demonstration:", error);
    console.log("\n🔄 Showing feature extraction analysis...");

    featureVectors.forEach((fv, i) => {
      console.log(`Event ${i + 1} (${diverseEvents[i].type}):`);
      console.log(
        `   Content preview: "${diverseEvents[i].content?.substring(0, 50)}..."`
      );
      console.log(`   Features: ${fv.vector.length} dimensions`);
      console.log(
        `   Key metrics: words=${fv.features.word_count}, complexity=${fv.features.semantic_complexity.toFixed(3)}, technical=${fv.features.technical_term_density.toFixed(3)}`
      );
      console.log(
        `   Activity detection: confluence=${fv.features.is_confluence_page}, pr_review=${fv.features.is_pr_review}, jira=${fv.features.is_jira_ticket}`
      );
      console.log("");
    });
  }
}

// Run the enhanced demonstration
if (require.main === module) {
  demonstrateMLClassificationEnhanced().catch(console.error);
}

export { demonstrateMLClassificationEnhanced };
