import * as tf from "@tensorflow/tfjs-node";
import { ActivityEvent } from "../types/activity";
import { Label, FeatureVector, SyntheticTestData } from "./types";

export class MLProcessor {
  private models: Map<string, tf.LayersModel> = new Map();
  private vectorizers: Map<string, any> = new Map();

  constructor() {
    this.initializeModels();
  }

  public async initializeModels(): Promise<void> {
    // Initialize competency classification model
    await this.loadOrCreateCompetencyModel();

    // Initialize text vectorizer
    await this.initializeVectorizer();
  }

  private async loadOrCreateCompetencyModel(): Promise<void> {
    const modelPath = "./models/competency-classifier";

    try {
      // Try to load existing model
      const model = await tf.loadLayersModel(`file://${modelPath}`);
      this.models.set("competency", model);
    } catch (error) {
      // Create new model if none exists
      const model = this.createCompetencyModel();
      this.models.set("competency", model);

      // Save the model
      await model.save(`file://${modelPath}`);
    }
  }

  private createCompetencyModel(): tf.LayersModel {
    // Text classification model for competency categorization
    const inputSize = 1000; // Max sequence length
    const embeddingSize = 128;
    const numCategories = 20; // Number of competency categories

    const model = tf.sequential({
      layers: [
        tf.layers.embedding({
          inputDim: 10000, // Vocabulary size
          outputDim: embeddingSize,
          inputLength: inputSize,
        }),
        tf.layers.lstm({ units: 64, returnSequences: true }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.lstm({ units: 32 }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: numCategories, activation: "softmax" }),
      ],
    });

    model.compile({
      optimizer: "adam",
      loss: "categoricalCrossentropy",
      metrics: ["accuracy"],
    });

    return model;
  }

  private async initializeVectorizer(): Promise<void> {
    // Simple TF-IDF vectorizer for text processing
    this.vectorizers.set("text", {
      vocabulary: new Map<string, number>(),
      maxFeatures: 10000,
      maxSequenceLength: 1000,
    });
  }

  async processEvent(
    event: ActivityEvent
  ): Promise<{ labels: Label[]; features: FeatureVector[] }> {
    const labels: Label[] = [];
    const features: FeatureVector[] = [];

    // Extract text content
    const textContent = this.extractTextContent(event);

    if (textContent && textContent.trim().length > 0) {
      // Generate features
      const featureVector = await this.generateFeatures(event, textContent);
      features.push(featureVector);

      // Generate ML-based labels
      const mlLabels = await this.generateLabels(
        event,
        textContent,
        featureVector
      );
      labels.push(...mlLabels);
    }

    return { labels, features };
  }

  private extractTextContent(event: ActivityEvent): string {
    const textParts: string[] = [];

    // Add event content
    if (event.content) {
      textParts.push(event.content);
    }

    // Add source-specific text
    switch (event.source) {
      case "jira":
        textParts.push(this.extractJiraText(event));
        break;
      case "confluence":
        textParts.push(this.extractConfluenceText(event));
        break;
      case "bitbucket":
        textParts.push(this.extractBitbucketText(event));
        break;
      case "git":
        textParts.push(this.extractGitText(event));
        break;
    }

    return textParts.join(" ");
  }

  private extractJiraText(event: ActivityEvent): string {
    const metadata = event.metadata as any;
    const parts: string[] = [];

    if (metadata.summary) parts.push(metadata.summary);
    if (metadata.description) parts.push(metadata.description);
    if (metadata.comments) {
      metadata.comments.forEach((comment: any) => {
        if (comment.body) parts.push(comment.body);
      });
    }

    return parts.join(" ");
  }

  private extractConfluenceText(event: ActivityEvent): string {
    const metadata = event.metadata as any;
    const parts: string[] = [];

    if (metadata.title) parts.push(metadata.title);
    if (metadata.content) parts.push(metadata.content);
    if (metadata.comments) {
      metadata.comments.forEach((comment: any) => {
        if (comment.body) parts.push(comment.body);
      });
    }

    return parts.join(" ");
  }

  private extractBitbucketText(event: ActivityEvent): string {
    const metadata = event.metadata as any;
    const parts: string[] = [];

    if (metadata.title) parts.push(metadata.title);
    if (metadata.description) parts.push(metadata.description);
    if (metadata.comments) {
      metadata.comments.forEach((comment: any) => {
        if (comment.body) parts.push(comment.body);
      });
    }

    return parts.join(" ");
  }

  private extractGitText(event: ActivityEvent): string {
    const metadata = event.metadata as any;
    const parts: string[] = [];

    if (metadata.message) parts.push(metadata.message);
    if (metadata.filesChanged) {
      parts.push(metadata.filesChanged.join(" "));
    }

    return parts.join(" ");
  }

  private async generateFeatures(
    event: ActivityEvent,
    textContent: string
  ): Promise<FeatureVector> {
    const features: Record<string, number> = {};

    // Text-based features
    features.textLength = textContent.length;
    features.wordCount = textContent.split(/\s+/).length;
    features.sentenceCount = textContent.split(/[.!?]+/).length;
    features.avgWordLength =
      features.wordCount > 0 ? textContent.length / features.wordCount : 0;

    // Source-based features
    features.sourceJira = event.source === "jira" ? 1 : 0;
    features.sourceConfluence = event.source === "confluence" ? 1 : 0;
    features.sourceBitbucket = event.source === "bitbucket" ? 1 : 0;
    features.sourceGit = event.source === "git" ? 1 : 0;

    // Event type features
    features.typeIssue = event.type.includes("issue") ? 1 : 0;
    features.typeComment = event.type.includes("comment") ? 1 : 0;
    features.typeCommit = event.type.includes("commit") ? 1 : 0;
    features.typePR = event.type.includes("pull") ? 1 : 0;

    // Time-based features
    const eventDate = new Date(event.timestamp);
    features.hourOfDay = eventDate.getHours();
    features.dayOfWeek = eventDate.getDay();
    features.isWeekend =
      eventDate.getDay() === 0 || eventDate.getDay() === 6 ? 1 : 0;

    // Metadata features
    if (event.metadata) {
      features.hasAssignee = event.metadata.assignee ? 1 : 0;
      features.hasPriority = event.metadata.priority ? 1 : 0;
      features.hasLabels =
        event.metadata.labels && event.metadata.labels.length > 0 ? 1 : 0;
    }

    // Create vector representation
    const vector = Object.values(features);

    return {
      id: `ml-feature-${event.id}`,
      eventId: event.id,
      features,
      vector,
      algorithm: "tensorflow-neural-network",
      version: "1.0",
      createdAt: new Date(),
    };
  }

  private async generateLabels(
    event: ActivityEvent,
    textContent: string,
    features: FeatureVector
  ): Promise<Label[]> {
    const labels: Label[] = [];

    // Competency classification
    const competencyLabel = await this.classifyCompetency(
      textContent,
      features
    );
    if (competencyLabel) {
      labels.push(competencyLabel);
    }

    // Experience level estimation
    const experienceLabel = await this.estimateExperienceLevel(event, features);
    if (experienceLabel) {
      labels.push(experienceLabel);
    }

    // Technical complexity assessment
    const complexityLabel = await this.assessTechnicalComplexity(
      event,
      features
    );
    if (complexityLabel) {
      labels.push(complexityLabel);
    }

    return labels;
  }

  private async classifyCompetency(
    textContent: string,
    features: FeatureVector
  ): Promise<Label | null> {
    const model = this.models.get("competency");
    if (!model) return null;

    try {
      // Vectorize text
      const textVector = this.vectorizeText(textContent);
      const input = tf.tensor2d([textVector]);

      // Make prediction
      const prediction = model.predict(input) as tf.Tensor;
      const probabilitiesData =
        (await prediction.data()) as unknown as number[];

      // Find highest probability category
      const maxProbIndex = probabilitiesData.indexOf(
        Math.max(...probabilitiesData)
      );
      const confidence = probabilitiesData[maxProbIndex];

      // Map index to competency category
      const categories = [
        "code-quality",
        "testing",
        "documentation",
        "collaboration",
        "architecture",
        "performance",
        "security",
        "deployment",
        "monitoring",
        "debugging",
        "refactoring",
        "code-review",
        "mentoring",
        "planning",
        "communication",
        "tools",
        "learning",
        "leadership",
        "innovation",
      ];

      const competencyCategory = categories[maxProbIndex];

      return {
        id: `ml-competency-${features.eventId}`,
        eventId: features.eventId,
        competencyCategory,
        competencyRow: "general",
        level: {
          level: Math.ceil(confidence * 5),
          name: this.getLevelName(Math.ceil(confidence * 5)),
          description: "",
          criteria: [],
        },
        confidence,
        source: "ml",
        evidence: `ML model classified as ${competencyCategory} with ${confidence.toFixed(2)} confidence`,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error("Competency classification failed:", error);
      return null;
    }
  }

  private async estimateExperienceLevel(
    event: ActivityEvent,
    features: FeatureVector
  ): Promise<Label | null> {
    // Rule-based experience level estimation
    const { features: feat } = features;
    let score = 0;

    // Code complexity indicators
    if (feat.wordCount > 100) score += 1;
    if (feat.avgWordLength > 6) score += 1;
    if (feat.hasAssignee) score += 1;
    if (feat.hasPriority) score += 1;

    // Technical indicators
    if (
      event.type.includes("pull_request") ||
      event.type.includes("code_review")
    )
      score += 2;
    if (event.type.includes("commit") && feat.textLength > 200) score += 1;

    const level = Math.min(5, Math.max(1, Math.ceil(score / 2)));
    const confidence = Math.min(0.9, score / 10);

    return {
      id: `ml-experience-${features.eventId}`,
      eventId: features.eventId,
      competencyCategory: "experience",
      competencyRow: "technical_proficiency",
      level: {
        level,
        name: this.getLevelName(level),
        description: "",
        criteria: [],
      },
      confidence,
      source: "ml",
      evidence: `Experience level estimated at ${level} based on event characteristics`,
      createdAt: new Date(),
    };
  }

  private async assessTechnicalComplexity(
    event: ActivityEvent,
    features: FeatureVector
  ): Promise<Label | null> {
    const { features: feat } = features;
    let complexity = 0;

    // Text complexity
    if (feat.textLength > 500) complexity += 2;
    if (feat.avgWordLength > 8) complexity += 1;
    if (feat.sentenceCount > 10) complexity += 1;

    // Technical indicators
    if (event.source === "git" && event.type.includes("commit"))
      complexity += 1;
    if (event.source === "jira" && event.type.includes("issue"))
      complexity += 1;
    if (feat.hasLabels && feat.hasLabels > 3) complexity += 2;

    const level = Math.min(5, Math.max(1, Math.ceil(complexity / 2)));
    const confidence = Math.min(0.8, complexity / 8);

    return {
      id: `ml-complexity-${features.eventId}`,
      eventId: features.eventId,
      competencyCategory: "technical_complexity",
      competencyRow: "problem_solving",
      level: {
        level,
        name: this.getLevelName(level),
        description: "",
        criteria: [],
      },
      confidence,
      source: "ml",
      evidence: `Technical complexity assessed at ${level} based on content analysis`,
      createdAt: new Date(),
    };
  }

  private vectorizeText(textContent: string): number[] {
    // Simple TF-IDF-like vectorization
    const vectorizer = this.vectorizers.get("text");
    if (!vectorizer) return new Array(1000).fill(0);

    const words = textContent.toLowerCase().split(/\s+/);
    const vector = new Array(vectorizer.maxSequenceLength).fill(0);

    for (
      let i = 0;
      i < Math.min(words.length, vectorizer.maxSequenceLength);
      i++
    ) {
      const word = words[i];
      const wordIndex = vectorizer.vocabulary.get(word) || 0;
      vector[i] = wordIndex;
    }

    return vector;
  }

  private getLevelName(level: number): string {
    const levelNames = [
      "Beginner",
      "Novice",
      "Intermediate",
      "Advanced",
      "Expert",
    ];
    return levelNames[level - 1] || "Unknown";
  }

  async generateSyntheticTestData(
    category: string,
    count: number = 10
  ): Promise<SyntheticTestData[]> {
    const testData: SyntheticTestData[] = [];

    for (let i = 0; i < count; i++) {
      const level = Math.floor(Math.random() * 5) + 1;
      const content = await this.generateSyntheticContent(category, level);

      testData.push({
        id: `synthetic-${category}-${i}`,
        competencyCategory: category,
        competencyRow: "generated",
        level: {
          level,
          name: this.getLevelName(level),
          description: "",
          criteria: [],
        },
        content,
        source: "ai_generated",
        expectedLabels: [category],
        metadata: {
          generatedAt: new Date(),
          model: "gpt-4",
          seed: Math.random(),
        },
      });
    }

    return testData;
  }

  private async generateSyntheticContent(
    category: string,
    level: number
  ): Promise<string> {
    const templates = {
      "code-quality": [
        "Refactored the authentication module to improve code readability and maintainability.",
        "Implemented comprehensive unit tests for the payment processing service.",
        "Fixed critical bug in the data validation layer that was causing production issues.",
        "Optimized database queries resulting in 40% performance improvement.",
        "Added proper error handling and logging throughout the application.",
      ],
      testing: [
        "Created automated integration tests for the user registration flow.",
        "Implemented end-to-end tests using Cypress for the checkout process.",
        "Set up continuous integration pipeline with comprehensive test coverage.",
        "Wrote performance tests to validate system scalability.",
        "Fixed flaky tests by improving test data management.",
      ],
      documentation: [
        "Updated API documentation with new endpoints and examples.",
        "Created comprehensive onboarding guide for new developers.",
        "Documented the microservices architecture and deployment process.",
        "Added code comments to complex algorithms for better understanding.",
        "Created troubleshooting guide for common production issues.",
      ],
      collaboration: [
        "Mentored junior developer through complex feature implementation.",
        "Led code review session focusing on security best practices.",
        "Collaborated with QA team to resolve critical production bugs.",
        "Presented technical design to stakeholders for approval.",
        "Participated in pair programming session to improve code quality.",
      ],
    };

    const categoryTemplates =
      templates[category as keyof typeof templates] ||
      templates["code-quality"];
    const template =
      categoryTemplates[Math.floor(Math.random() * categoryTemplates.length)];

    // Adjust template based on level
    if (level <= 2) {
      return `Basic task: ${template}`;
    } else if (level <= 4) {
      return `Intermediate work: ${template} Additionally, I considered edge cases and implemented proper error handling.`;
    } else {
      return `Advanced implementation: ${template} This involved architectural decisions, performance optimization, and mentoring team members. I also conducted thorough testing and documented the approach for future reference.`;
    }
  }

  async trainModel(trainingData: SyntheticTestData[]): Promise<void> {
    const model = this.models.get("competency");
    if (!model) return;

    // Prepare training data
    const { texts, labels } = this.prepareTrainingData(trainingData);

    // Train the model
    await model.fit(texts, labels, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
    });

    // Save the updated model
    await model.save("file://./models/competency-classifier-updated");
  }

  private prepareTrainingData(data: SyntheticTestData[]): {
    texts: tf.Tensor;
    labels: tf.Tensor;
  } {
    const texts = data.map((item) => this.vectorizeText(item.content));
    const labels = this.encodeLabels(
      data.map((item) => item.competencyCategory)
    );

    return {
      texts: tf.tensor2d(texts),
      labels: tf.tensor2d(labels),
    };
  }

  private encodeLabels(categories: string[]): number[][] {
    const uniqueCategories = [...new Set(categories)];
    const encoded = categories.map((cat) => {
      const vector = new Array(uniqueCategories.length).fill(0);
      const index = uniqueCategories.indexOf(cat);
      if (index !== -1) vector[index] = 1;
      return vector;
    });

    return encoded;
  }
}
