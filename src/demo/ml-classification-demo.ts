import { FeatureExtractor } from "../processing/feature-extractor";
import { MLClassifier } from "../processing/ml-classifier";
import { RuleEngine } from "../processing/rule-engine";
import { ActivityEvent } from "../types/activity";

/**
 * Demonstration of the complete ML Classification pipeline
 * Shows: Feature Extraction → Rule-Based Classification → ML Training → ML Prediction
 */
async function demonstrateMLClassification() {
  console.log("🚀 Starting ML Classification Demonstration\n");

  // Initialize components
  const featureExtractor = new FeatureExtractor();
  const ruleEngine = new RuleEngine();
  const mlClassifier = new MLClassifier({
    epochs: 20, // Reduced for demo
    hiddenLayers: [32, 16], // Smaller for demo
    batchSize: 16,
  });

  // Create sample ActivityEvents from our Confluence data patterns
  const sampleEvents: ActivityEvent[] = [
    {
      id: "demo-1",
      type: "confluence-page",
      content:
        "This document covers REST API design principles, database optimization strategies, and security implementation guidelines using Docker containers and Kubernetes deployment.",
      timestamp: "2024-01-15T10:00:00Z",
      source: "confluence",
      actor: "developer@example.com",
      metadata: {
        title: "API Design Guidelines",
        space: "DEV",
        labels: ["api", "architecture", "security"],
        version: 1,
      },
    },
    {
      id: "demo-2",
      type: "confluence-page",
      content:
        "Simple documentation page with basic information about the project.",
      timestamp: "2024-01-15T11:00:00Z",
      source: "confluence",
      actor: "user@example.com",
      metadata: {
        title: "Simple Page",
        space: "DEV",
      },
    },
    {
      id: "demo-3",
      type: "pull-request-review",
      content:
        "Review comments: Consider refactoring this section for better performance. The current implementation has security vulnerabilities that need to be addressed.",
      timestamp: "2024-01-15T12:00:00Z",
      source: "git",
      actor: "reviewer@example.com",
      metadata: {
        comments: 5,
        suggestions: 2,
        approvals: 0,
      },
    },
    {
      id: "demo-4",
      type: "confluence-page",
      content:
        "Architecture discussion with microservices design patterns, CI/CD pipeline setup, and infrastructure as code using Terraform and AWS services.",
      timestamp: "2024-01-15T13:00:00Z",
      source: "confluence",
      actor: "architect@example.com",
      metadata: {
        title: "Architecture Overview",
        space: "DEV",
        labels: ["architecture", "microservices", "aws"],
      },
    },
    {
      id: "demo-5",
      type: "jira-ticket",
      content:
        "Bug report: Critical security issue found in authentication module. Need to implement OAuth 2.0 and improve password hashing algorithms.",
      timestamp: "2024-01-15T14:00:00Z",
      source: "jira",
      actor: "security@example.com",
      metadata: {
        issueKey: "SEC-123",
        priority: "High",
      },
    },
  ];

  console.log(`📝 Created ${sampleEvents.length} sample ActivityEvents\n`);

  // Step 1: Extract features from all events
  console.log("🔍 Step 1: Extracting features from ActivityEvents...");
  const featureVectors = featureExtractor.extractFeaturesBatch(sampleEvents);

  console.log(`✅ Extracted features for ${featureVectors.length} events`);
  console.log(
    `📊 Each feature vector has ${featureVectors[0].vector.length} features`
  );
  console.log(`📋 Sample features for first event:`);
  console.log(`   - Word count: ${featureVectors[0].features.word_count}`);
  console.log(
    `   - Semantic complexity: ${featureVectors[0].features.semantic_complexity.toFixed(3)}`
  );
  console.log(
    `   - Technical term density: ${featureVectors[0].features.technical_term_density.toFixed(3)}`
  );
  console.log(
    `   - Is Confluence page: ${featureVectors[0].features.is_confluence_page}`
  );
  console.log(
    `   - Collaboration score: ${featureVectors[0].features.collaboration_score.toFixed(3)}\n`
  );

  // Step 2: Get rule-based classifications for training data
  console.log("⚡ Step 2: Getting rule-based classifications...");
  const ruleClassifications = sampleEvents.map((event) => ({
    id: event.id,
    labels: ruleEngine.processEvent(event).labels,
  }));

  console.log(`✅ Generated rule-based classifications:`);
  ruleClassifications.forEach((rc) => {
    console.log(`   Event ${rc.id}: ${rc.labels.length} classifications`);
    rc.labels.forEach((label, i) => {
      console.log(
        `     ${i + 1}. ${label.competencyCategory}/${label.competencyRow}/${label.level.name} (confidence: ${label.confidence})`
      );
    });
  });
  console.log("");

  // Step 3: Create training data from rule classifications
  console.log("📚 Step 3: Creating training data from rule classifications...");
  const trainingData = mlClassifier.createTrainingDataFromRules(
    featureVectors,
    ruleClassifications
  );

  console.log(`✅ Training data created:`);
  console.log(`   - Total samples: ${trainingData.metadata.totalSamples}`);
  console.log(
    `   - Categories: ${trainingData.metadata.categories.join(", ")}`
  );
  console.log(`   - Levels: ${trainingData.metadata.levels.join(", ")}`);
  console.log(`   - Feature count: ${trainingData.metadata.featureCount}\n`);

  // Step 4: Train the ML model
  console.log("🧠 Step 4: Training ML model...");
  try {
    await mlClassifier.trainModel(trainingData);
    console.log("✅ Model training completed!\n");

    // Show model summary
    console.log("📋 Model Summary:");
    console.log(mlClassifier.getModelSummary());
    console.log("");

    // Step 5: Test ML predictions
    console.log("🔮 Step 5: Testing ML predictions...");
    const testEvent: ActivityEvent = {
      id: "test-prediction",
      type: "confluence-page",
      content:
        "Advanced microservices architecture with Docker containers, Kubernetes orchestration, and CI/CD pipeline implementation using security best practices.",
      timestamp: "2024-01-15T15:00:00Z",
      source: "confluence",
      actor: "test@example.com",
      metadata: {
        title: "Advanced Architecture Guide",
        space: "DEV",
        labels: ["architecture", "microservices", "security"],
      },
    };

    // Extract features for test event
    const testFeatureVector = featureExtractor.extractFeatures(testEvent);
    console.log(`📊 Test event features extracted:`);
    console.log(`   - Word count: ${testFeatureVector.features.word_count}`);
    console.log(
      `   - Semantic complexity: ${testFeatureVector.features.semantic_complexity.toFixed(3)}`
    );
    console.log(
      `   - Technical term density: ${testFeatureVector.features.technical_term_density.toFixed(3)}\n`
    );

    // Get ML prediction
    const mlResult = await mlClassifier.classify(testFeatureVector);
    console.log("🤖 ML Classification Results:");
    console.log(`   Event ID: ${mlResult.id}`);
    console.log(`   Algorithm: ${mlResult.algorithm}`);
    console.log(`   Top 5 predictions:`);

    mlResult.predictions.forEach((pred, index) => {
      console.log(
        `     ${index + 1}. ${pred.competencyCategory}/${pred.competencyRow}/${pred.level} - ${(pred.confidence * 100).toFixed(1)}% confidence`
      );
    });
    console.log("");

    // Step 6: Compare with rule-based classification
    console.log("⚡ Rule-Based Classification for same event:");
    const ruleResult = ruleEngine.processEvent(testEvent);
    console.log(
      `   Found ${ruleResult.labels.length} rule-based classifications:`
    );

    ruleResult.labels.forEach((label, index) => {
      console.log(
        `     ${index + 1}. ${label.competencyCategory}/${label.competencyRow}/${label.level.name} - ${(label.confidence * 100).toFixed(1)}% confidence`
      );
      console.log(`        Evidence: ${label.evidence}`);
    });
    console.log("");

    // Step 7: Demonstrate batch processing
    console.log("📦 Step 7: Demonstrating batch processing...");
    const batchResults = await mlClassifier.classifyBatch(
      featureVectors.slice(0, 3)
    );

    console.log(`✅ Batch processed ${batchResults.length} events:`);
    batchResults.forEach((result) => {
      console.log(
        `   Event ${result.id}: Top prediction - ${result.predictions[0].competencyCategory}/${result.predictions[0].competencyRow}/${result.predictions[0].level} (${(result.predictions[0].confidence * 100).toFixed(1)}%)`
      );
    });
    console.log("");

    // Step 8: Save the trained model
    console.log("💾 Step 8: Saving trained model...");
    await mlClassifier.saveModel("./demo-model");
    console.log("✅ Model saved to ./demo-model\n");

    console.log("🎉 ML Classification Demonstration Complete!");
    console.log("📈 Summary:");
    console.log(`   - Processed ${sampleEvents.length} sample events`);
    console.log(
      `   - Extracted ${featureVectors[0].vector.length} features per event`
    );
    console.log(
      `   - Trained ML model with ${trainingData.metadata.totalSamples} samples`
    );
    console.log(`   - Achieved multi-class competency classification`);
    console.log(`   - Demonstrated batch processing capabilities`);
    console.log(`   - Saved trained model for future use`);
  } catch (error) {
    console.error("❌ Error during ML demonstration:", error);

    // Fallback demonstration without training
    console.log("\n🔄 Fallback: Demonstrating feature extraction only...");
    featureVectors.forEach((fv, index) => {
      console.log(`Event ${index + 1} (${sampleEvents[index].type}):`);
      console.log(`   Features: ${fv.vector.length} dimensions`);
      console.log(
        `   Top features: word_count=${fv.features.word_count}, semantic_complexity=${fv.features.semantic_complexity.toFixed(3)}`
      );
      console.log(
        `   Activity type detection: confluence=${fv.features.is_confluence_page}, pr_review=${fv.features.is_pr_review}`
      );
    });
  }
}

// Run the demonstration
if (require.main === module) {
  demonstrateMLClassification().catch(console.error);
}

export { demonstrateMLClassification };
