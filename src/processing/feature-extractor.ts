import { ActivityEvent } from "../types/activity";

export interface FeatureVector {
  id: string;
  features: Record<string, number>;
  vector: number[];
  algorithm: string;
  timestamp: string;
}

export interface FeatureExtractorConfig {
  // Text analysis features
  maxTextLength: number;
  semanticComplexityThreshold: number;

  // Activity patterns
  reviewDepthWeights: {
    comments: number;
    suggestions: number;
    approvals: number;
  };

  // Time-based features
  cycleTimeWindows: {
    short: number; // hours
    medium: number; // days
    long: number; // weeks
  };
}

export class FeatureExtractor {
  private config: FeatureExtractorConfig;

  constructor(config?: Partial<FeatureExtractorConfig>) {
    this.config = {
      maxTextLength: 10000,
      semanticComplexityThreshold: 0.7,
      reviewDepthWeights: {
        comments: 1.0,
        suggestions: 2.0,
        approvals: 0.5,
      },
      cycleTimeWindows: {
        short: 24, // 24 hours
        medium: 72, // 3 days
        long: 168, // 1 week
      },
      ...config,
    };
  }

  /**
   * Extract features from a single activity event
   */
  extractFeatures(event: ActivityEvent): FeatureVector {
    const features = this.calculateAllFeatures(event);
    const vector = this.createFeatureVector(features);

    return {
      id: event.id,
      features,
      vector,
      algorithm: "rule-based-v1",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Extract features from multiple events (batch processing)
   */
  extractFeaturesBatch(events: ActivityEvent[]): FeatureVector[] {
    return events.map((event) => this.extractFeatures(event));
  }

  /**
   * Calculate all feature types for an event
   */
  private calculateAllFeatures(event: ActivityEvent): Record<string, number> {
    const features: Record<string, number> = {};

    // Text-based features
    Object.assign(features, this.extractTextFeatures(event));

    // Activity pattern features
    Object.assign(features, this.extractActivityFeatures(event));

    // Temporal features
    Object.assign(features, this.extractTemporalFeatures(event));

    // Metadata features
    Object.assign(features, this.extractMetadataFeatures(event));

    return features;
  }

  /**
   * Extract text-based features from content
   */
  private extractTextFeatures(event: ActivityEvent): Record<string, number> {
    const content = event.content || "";
    const features: Record<string, number> = {};

    // Basic text metrics
    features.text_length = Math.min(content.length, this.config.maxTextLength);
    features.word_count = this.countWords(content);
    features.sentence_count = this.countSentences(content);
    features.avg_words_per_sentence =
      features.word_count / Math.max(features.sentence_count, 1);

    // Semantic complexity indicators
    features.technical_term_density =
      this.calculateTechnicalTermDensity(content);
    features.code_block_count = this.countCodeBlocks(content);
    features.link_count = this.countLinks(content);
    features.list_count = this.countLists(content);

    // Complexity score (0-1)
    features.semantic_complexity = this.calculateSemanticComplexity(features);

    return features;
  }

  /**
   * Extract activity pattern features
   */
  private extractActivityFeatures(
    event: ActivityEvent
  ): Record<string, number> {
    const features: Record<string, number> = {};

    // Activity type indicators
    features.is_confluence_page = event.type === "confluence-page" ? 1 : 0;
    features.is_pr_review = event.type === "pull-request-review" ? 1 : 0;
    features.is_commit = event.type === "commit" ? 1 : 0;
    features.is_jira_ticket = event.type === "jira-ticket" ? 1 : 0;

    // Review depth (if applicable)
    if (event.metadata?.comments) {
      features.review_comments = event.metadata.comments;
      features.review_depth = this.calculateReviewDepth(event.metadata);
    } else {
      features.review_comments = 0;
      features.review_depth = 0;
    }

    // Collaboration indicators
    features.collaboration_score = this.calculateCollaborationScore(event);

    return features;
  }

  /**
   * Extract temporal features
   */
  private extractTemporalFeatures(
    event: ActivityEvent
  ): Record<string, number> {
    const features: Record<string, number> = {};

    const eventDate = new Date(event.timestamp);
    const now = new Date();
    const hoursSinceEvent =
      (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60);

    // Time-based features
    features.hours_since_event = hoursSinceEvent;
    features.is_recent_activity =
      hoursSinceEvent <= this.config.cycleTimeWindows.short ? 1 : 0;
    features.is_medium_term =
      hoursSinceEvent <= this.config.cycleTimeWindows.medium ? 1 : 0;
    features.is_long_term =
      hoursSinceEvent <= this.config.cycleTimeWindows.long ? 1 : 0;

    // Day of week and hour patterns
    features.day_of_week = eventDate.getDay();
    features.hour_of_day = eventDate.getHours();
    features.is_weekend =
      eventDate.getDay() === 0 || eventDate.getDay() === 6 ? 1 : 0;
    features.is_business_hours =
      eventDate.getHours() >= 9 && eventDate.getHours() < 17 ? 1 : 0;

    return features;
  }

  /**
   * Extract metadata features
   */
  private extractMetadataFeatures(
    event: ActivityEvent
  ): Record<string, number> {
    const features: Record<string, number> = {};

    // Metadata richness
    features.metadata_field_count = Object.keys(event.metadata || {}).length;
    features.has_labels =
      event.metadata?.labels && event.metadata.labels.length > 0 ? 1 : 0;
    features.label_count = event.metadata?.labels?.length || 0;

    // Source-specific features
    features.is_github_source = event.source === "git" ? 1 : 0;
    features.is_confluence_source = event.source === "confluence" ? 1 : 0;
    features.is_jira_source = event.source === "jira" ? 1 : 0;
    features.is_bitbucket_source = event.source === "bitbucket" ? 1 : 0;

    return features;
  }

  /**
   * Convert feature object to numeric vector for ML
   */
  private createFeatureVector(features: Record<string, number>): number[] {
    // Ensure consistent ordering for ML models
    const featureOrder = [
      "text_length",
      "word_count",
      "sentence_count",
      "avg_words_per_sentence",
      "technical_term_density",
      "code_block_count",
      "link_count",
      "list_count",
      "semantic_complexity",
      "is_confluence_page",
      "is_pr_review",
      "is_commit",
      "is_jira_ticket",
      "review_comments",
      "review_depth",
      "collaboration_score",
      "hours_since_event",
      "is_recent_activity",
      "is_medium_term",
      "is_long_term",
      "day_of_week",
      "hour_of_day",
      "is_weekend",
      "is_business_hours",
      "metadata_field_count",
      "has_labels",
      "label_count",
      "is_github_source",
      "is_confluence_source",
      "is_jira_source",
      "is_bitbucket_source",
    ];

    return featureOrder.map((key) => features[key] || 0);
  }

  // Helper methods for feature calculations

  private countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }

  private countSentences(text: string): number {
    return text.split(/[.!?]+/).filter((sentence) => sentence.trim().length > 0)
      .length;
  }

  private calculateTechnicalTermDensity(text: string): number {
    const technicalTerms = [
      "api",
      "database",
      "algorithm",
      "architecture",
      "security",
      "performance",
      "scalability",
      "deployment",
      "testing",
      "debugging",
      "optimization",
      "refactor",
      "microservice",
      "container",
      "kubernetes",
      "docker",
      "ci/cd",
      "git",
      "branch",
      "merge",
      "pull request",
      "commit",
      "repository",
    ];

    const words = text.toLowerCase().split(/\s+/);
    const technicalWordCount = words.filter((word) =>
      technicalTerms.some((term) => word.includes(term))
    ).length;

    return words.length > 0 ? technicalWordCount / words.length : 0;
  }

  private countCodeBlocks(text: string): number {
    // Match both backtick code blocks and markdown code blocks
    const backtickBlocks = (text.match(/```[\s\S]*?```/g) || []).length;
    const inlineCode = (text.match(/`[^`]+`/g) || []).length;
    return backtickBlocks + inlineCode;
  }

  private countLinks(text: string): number {
    return (text.match(/https?:\/\/[^\s]+/g) || []).length;
  }

  private countLists(text: string): number {
    return (text.match(/^\s*[-*+]\s+/gm) || []).length;
  }

  private calculateSemanticComplexity(
    features: Record<string, number>
  ): number {
    // Weighted combination of complexity indicators
    const weights = {
      technical_term_density: 0.3,
      avg_words_per_sentence: 0.2,
      code_block_count: 0.2,
      link_count: 0.15,
      list_count: 0.15,
    };

    const normalizedFeatures = {
      technical_term_density: Math.min(features.technical_term_density || 0, 1),
      avg_words_per_sentence: Math.min(
        (features.avg_words_per_sentence || 0) / 20,
        1
      ),
      code_block_count: Math.min((features.code_block_count || 0) / 5, 1),
      link_count: Math.min((features.link_count || 0) / 10, 1),
      list_count: Math.min((features.list_count || 0) / 5, 1),
    };

    return Object.entries(weights).reduce((score, [feature, weight]) => {
      return (
        score +
        (normalizedFeatures[feature as keyof typeof normalizedFeatures] || 0) *
          weight
      );
    }, 0);
  }

  private calculateReviewDepth(metadata: any): number {
    const weights = this.config.reviewDepthWeights;

    let depth = 0;
    if (metadata.comments) depth += metadata.comments * weights.comments;
    if (metadata.suggestions)
      depth += metadata.suggestions * weights.suggestions;
    if (metadata.approvals) depth += metadata.approvals * weights.approvals;

    return depth;
  }

  private calculateCollaborationScore(event: ActivityEvent): number {
    let score = 0;

    // High collaboration indicators
    if (event.metadata?.collaborators) {
      score += Math.min(event.metadata.collaborators.length, 5) * 0.2;
    }

    if (event.metadata?.discussion_length) {
      score += (Math.min(event.metadata.discussion_length, 100) / 100) * 0.3;
    }

    if (event.metadata?.reviewers) {
      score += Math.min(event.metadata.reviewers.length, 3) * 0.2;
    }

    // Source-based collaboration
    if (event.type === "pull-request-review") score += 0.3;
    if (event.type === "confluence-page" && event.metadata?.comments > 0)
      score += 0.2;

    return Math.min(score, 1.0);
  }
}
