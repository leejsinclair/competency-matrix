import { FeatureExtractor } from "../processing/feature-extractor";
import { ActivityEvent } from "../types/activity";

describe("Feature Extractor Integration", () => {
  let featureExtractor: FeatureExtractor;

  beforeEach(() => {
    featureExtractor = new FeatureExtractor();
  });

  describe("Confluence Content Feature Extraction", () => {
    test("should extract features from Confluence-style events", () => {
      // Create a Confluence-style ActivityEvent
      const event: ActivityEvent = {
        id: "test-page-1",
        type: "confluence-page",
        content:
          "This document covers REST API design principles, database optimization strategies, and security implementation guidelines.",
        timestamp: "2024-01-15T10:00:00Z",
        source: "confluence",
        actor: "developer@example.com",
        metadata: {
          title: "API Design Guidelines",
          space: "DEV",
          labels: ["api", "architecture", "security"],
          version: 1,
        },
      };

      const featureVector = featureExtractor.extractFeatures(event);

      // Verify feature extraction
      expect(featureVector).toBeDefined();
      expect(featureVector.id).toBe("test-page-1");
      expect(featureVector.features).toBeDefined();
      expect(featureVector.vector).toBeDefined();
      expect(featureVector.vector.length).toBe(31);

      // Verify specific features for Confluence content
      expect(featureVector.features.is_confluence_page).toBe(1);
      expect(featureVector.features.is_confluence_source).toBe(1);
      expect(featureVector.features.word_count).toBeGreaterThan(10);
      expect(featureVector.features.technical_term_density).toBeGreaterThan(0);
      expect(featureVector.features.has_labels).toBe(1);
      expect(featureVector.features.label_count).toBe(3);
    });

    test("should handle batch processing of multiple Confluence events", () => {
      const events: ActivityEvent[] = [
        {
          id: "page-1",
          type: "confluence-page",
          content: "Simple documentation page.",
          timestamp: "2024-01-15T10:00:00Z",
          source: "confluence",
          actor: "user1@example.com",
          metadata: { title: "Simple Page", space: "DEV" },
        },
        {
          id: "page-2",
          type: "confluence-page",
          content:
            "Complex technical guide with code examples and API documentation.",
          timestamp: "2024-01-15T11:00:00Z",
          source: "confluence",
          actor: "user2@example.com",
          metadata: {
            title: "Technical Guide",
            space: "DEV",
            labels: ["technical"],
          },
        },
        {
          id: "page-3",
          type: "confluence-page",
          content:
            "Architecture discussion with diagrams and implementation details.",
          timestamp: "2024-01-15T12:00:00Z",
          source: "confluence",
          actor: "user3@example.com",
          metadata: {
            title: "Architecture",
            space: "DEV",
            labels: ["architecture", "design"],
          },
        },
      ];

      const featureVectors = featureExtractor.extractFeaturesBatch(events);

      expect(featureVectors).toHaveLength(3);

      // Verify all vectors have consistent length
      const vectorLengths = featureVectors.map((fv) => fv.vector.length);
      expect(vectorLengths.every((length) => length === 31)).toBe(true);

      // Verify semantic complexity differences (not necessarily strictly increasing)
      expect(featureVectors[0].features.semantic_complexity).toBeLessThan(0.2); // Simple
      expect(featureVectors[1].features.semantic_complexity).toBeGreaterThan(
        0.1
      ); // Technical
      expect(featureVectors[2].features.semantic_complexity).toBeGreaterThan(
        0.1
      ); // Architecture
    });

    test("should differentiate between different activity types", () => {
      const activities: ActivityEvent[] = [
        {
          id: "conf-1",
          type: "confluence-page",
          content: "Confluence page content",
          timestamp: "2024-01-15T10:00:00Z",
          source: "confluence",
          actor: "user@example.com",
          metadata: {},
        },
        {
          id: "pr-1",
          type: "pull-request-review",
          content: "Review comments and suggestions",
          timestamp: "2024-01-15T10:00:00Z",
          source: "git",
          actor: "reviewer@example.com",
          metadata: { comments: 5, suggestions: 2 },
        },
        {
          id: "jira-1",
          type: "jira-ticket",
          content: "Ticket description and requirements",
          timestamp: "2024-01-15T10:00:00Z",
          source: "jira",
          actor: "assignee@example.com",
          metadata: { issueKey: "PROJ-123", priority: "High" },
        },
      ];

      const featureVectors = featureExtractor.extractFeaturesBatch(activities);

      // Verify activity type detection
      expect(featureVectors[0].features.is_confluence_page).toBe(1);
      expect(featureVectors[0].features.is_pr_review).toBe(0);
      expect(featureVectors[0].features.is_jira_ticket).toBe(0);

      expect(featureVectors[1].features.is_confluence_page).toBe(0);
      expect(featureVectors[1].features.is_pr_review).toBe(1);
      expect(featureVectors[1].features.is_jira_ticket).toBe(0);

      expect(featureVectors[2].features.is_confluence_page).toBe(0);
      expect(featureVectors[2].features.is_pr_review).toBe(0);
      expect(featureVectors[2].features.is_jira_ticket).toBe(1);

      // Verify source detection
      expect(featureVectors[0].features.is_confluence_source).toBe(1);
      expect(featureVectors[1].features.is_github_source).toBe(1);
      expect(featureVectors[2].features.is_jira_source).toBe(1);
    });
  });

  describe("Feature Vector Quality", () => {
    test("should produce normalized feature values", () => {
      const event: ActivityEvent = {
        id: "quality-test",
        type: "confluence-page",
        content: "Test content for feature quality validation",
        timestamp: "2024-01-15T10:00:00Z",
        source: "confluence",
        actor: "test@example.com",
        metadata: {},
      };

      const featureVector = featureExtractor.extractFeatures(event);

      // Verify key features are within expected ranges
      expect(featureVector.features.semantic_complexity).toBeGreaterThanOrEqual(
        0
      );
      expect(featureVector.features.semantic_complexity).toBeLessThanOrEqual(1);

      expect(featureVector.features.collaboration_score).toBeGreaterThanOrEqual(
        0
      );
      expect(featureVector.features.collaboration_score).toBeLessThanOrEqual(1);

      expect(
        featureVector.features.technical_term_density
      ).toBeGreaterThanOrEqual(0);
      expect(featureVector.features.technical_term_density).toBeLessThanOrEqual(
        1
      );

      // Verify binary features are only 0 or 1
      const binaryFeatures = [
        "is_confluence_page",
        "is_pr_review",
        "is_commit",
        "is_jira_ticket",
        "is_recent_activity",
        "is_medium_term",
        "is_long_term",
        "is_weekend",
        "is_business_hours",
        "has_labels",
        "is_github_source",
        "is_confluence_source",
        "is_jira_source",
        "is_bitbucket_source",
      ];

      binaryFeatures.forEach((feature) => {
        const value = featureVector.features[feature];
        expect([0, 1]).toContain(value);
      });
    });

    test("should maintain feature vector consistency across runs", () => {
      const event: ActivityEvent = {
        id: "consistency-test",
        type: "confluence-page",
        content: "Content for consistency testing",
        timestamp: "2024-01-15T10:00:00Z",
        source: "confluence",
        actor: "test@example.com",
        metadata: {},
      };

      const vector1 = featureExtractor.extractFeatures(event);
      const vector2 = featureExtractor.extractFeatures(event);

      expect(vector1.vector).toEqual(vector2.vector);
      expect(vector1.features).toEqual(vector2.features);
    });
  });
});
