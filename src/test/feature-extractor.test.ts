import {
  FeatureExtractor,
  FeatureVector,
} from "../processing/feature-extractor";
import { ActivityEvent } from "../types/activity";

describe("FeatureExtractor", () => {
  let extractor: FeatureExtractor;

  beforeEach(() => {
    extractor = new FeatureExtractor();
  });

  describe("Basic Feature Extraction", () => {
    test("should extract features from simple Confluence page", () => {
      const event: ActivityEvent = {
        id: "test-1",
        type: "confluence-page",
        content:
          "This is a simple page about API design and database architecture.",
        timestamp: "2024-01-15T10:00:00Z",
        source: "confluence",
        actor: "test@example.com",
        metadata: {
          title: "API Design Guide",
          space: "DEV",
          labels: ["architecture", "api"],
        },
      };

      const result: FeatureVector = extractor.extractFeatures(event);

      expect(result).toBeDefined();
      expect(result.id).toBe("test-1");
      expect(result.algorithm).toBe("rule-based-v1");
      expect(result.features).toBeDefined();
      expect(result.vector).toBeDefined();
      expect(result.vector.length).toBeGreaterThan(0);
    });

    test("should handle empty content gracefully", () => {
      const event: ActivityEvent = {
        id: "test-2",
        type: "confluence-page",
        content: "",
        timestamp: "2024-01-15T10:00:00Z",
        source: "confluence",
        actor: "test@example.com",
        metadata: {},
      };

      const result: FeatureVector = extractor.extractFeatures(event);

      expect(result.features.text_length).toBe(0);
      expect(result.features.word_count).toBe(0);
      expect(result.features.sentence_count).toBe(0);
    });

    test("should extract text features correctly", () => {
      const content = `
        This is a complex technical document about microservices architecture.
        It includes code examples like \`function example() { return true; }\`.
        Here's a link: https://example.com/docs.
        
        Key points:
        - Use containers for deployment
        - Implement proper error handling
        - Consider scalability requirements
      `;

      const event: ActivityEvent = {
        id: "test-3",
        type: "confluence-page",
        content,
        timestamp: "2024-01-15T10:00:00Z",
        source: "confluence",
        actor: "test@example.com",
        metadata: {},
      };

      const result: FeatureVector = extractor.extractFeatures(event);

      expect(result.features.word_count).toBeGreaterThan(20);
      expect(result.features.code_block_count).toBe(1);
      expect(result.features.link_count).toBe(1);
      expect(result.features.list_count).toBe(3);
      expect(result.features.technical_term_density).toBeGreaterThan(0);
    });
  });

  describe("Activity Pattern Features", () => {
    test("should identify different activity types", () => {
      const confluenceEvent: ActivityEvent = {
        id: "conf-1",
        type: "confluence-page",
        content: "Page content",
        timestamp: "2024-01-15T10:00:00Z",
        source: "confluence",
        actor: "test@example.com",
        metadata: {},
      };

      const result = extractor.extractFeatures(confluenceEvent);
      expect(result.features.is_confluence_page).toBe(1);
      expect(result.features.is_pr_review).toBe(0);
      expect(result.features.is_commit).toBe(0);
      expect(result.features.is_jira_ticket).toBe(0);
    });

    test("should calculate review depth for PR reviews", () => {
      const prEvent: ActivityEvent = {
        id: "pr-1",
        type: "pull-request-review",
        content: "LGTM, but consider refactoring this section.",
        timestamp: "2024-01-15T10:00:00Z",
        source: "git",
        actor: "reviewer@example.com",
        metadata: {
          comments: 5,
          suggestions: 2,
          approvals: 1,
        },
      };

      const result = extractor.extractFeatures(prEvent);
      expect(result.features.is_pr_review).toBe(1);
      expect(result.features.review_comments).toBe(5);
      expect(result.features.review_depth).toBeGreaterThan(0);
    });

    test("should calculate collaboration score", () => {
      const collaborativeEvent: ActivityEvent = {
        id: "collab-1",
        type: "confluence-page",
        content: "Collaborative document",
        timestamp: "2024-01-15T10:00:00Z",
        source: "confluence",
        actor: "author@example.com",
        metadata: {
          collaborators: [
            "user1@example.com",
            "user2@example.com",
            "user3@example.com",
          ],
          discussion_length: 50,
          reviewers: ["reviewer1@example.com", "reviewer2@example.com"],
        },
      };

      const result = extractor.extractFeatures(collaborativeEvent);
      expect(result.features.collaboration_score).toBeGreaterThan(0);
      expect(result.features.collaboration_score).toBeLessThanOrEqual(1.0);
    });
  });

  describe("Temporal Features", () => {
    test("should extract time-based features", () => {
      const now = new Date();
      const recentTimestamp = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago

      const event: ActivityEvent = {
        id: "temporal-1",
        type: "confluence-page",
        content: "Recent content",
        timestamp: recentTimestamp.toISOString(),
        source: "confluence",
        actor: "test@example.com",
        metadata: {},
      };

      const result = extractor.extractFeatures(event);
      expect(result.features.hours_since_event).toBeGreaterThan(1);
      expect(result.features.hours_since_event).toBeLessThan(3);
      expect(result.features.is_recent_activity).toBe(1);
      expect(result.features.is_medium_term).toBe(1);
      expect(result.features.is_long_term).toBe(1);
    });

    test("should detect weekend and business hours", () => {
      // Saturday 2 PM
      const weekendEvent: ActivityEvent = {
        id: "weekend-1",
        type: "confluence-page",
        content: "Weekend work",
        timestamp: "2024-01-20T14:00:00Z", // Saturday
        source: "confluence",
        actor: "test@example.com",
        metadata: {},
      };

      // Tuesday 10 AM UTC (clearly business hours)
      const businessHoursEvent: ActivityEvent = {
        id: "business-1",
        type: "confluence-page",
        content: "Business hours work",
        timestamp: "2024-01-16T02:00:00Z", // 2 AM UTC = 10 AM AEST (business hours)
        source: "confluence",
        actor: "test@example.com",
        metadata: {},
      };

      const weekendResult = extractor.extractFeatures(weekendEvent);
      const businessResult = extractor.extractFeatures(businessHoursEvent);

      console.log(
        "Business hours test timestamp:",
        businessHoursEvent.timestamp
      );
      console.log(
        "Business hours test hour:",
        new Date(businessHoursEvent.timestamp).getHours()
      );
      console.log(
        "Business hours feature:",
        businessResult.features.is_business_hours
      );

      expect(weekendResult.features.is_weekend).toBe(1);
      expect(weekendResult.features.is_business_hours).toBe(0);

      expect(businessResult.features.is_weekend).toBe(0);
      expect(businessResult.features.is_business_hours).toBe(1);
    });
  });

  describe("Metadata Features", () => {
    test("should extract metadata richness features", () => {
      const event: ActivityEvent = {
        id: "metadata-1",
        type: "confluence-page",
        content: "Content with rich metadata",
        timestamp: "2024-01-15T10:00:00Z",
        source: "confluence",
        actor: "test@example.com",
        metadata: {
          title: "Technical Guide",
          space: "DEV",
          labels: ["architecture", "api", "security"],
          version: 3,
          collaborators: ["user1@example.com"],
        },
      };

      const result = extractor.extractFeatures(event);
      expect(result.features.metadata_field_count).toBe(5);
      expect(result.features.has_labels).toBe(1);
      expect(result.features.label_count).toBe(3);
    });

    test("should identify source types correctly", () => {
      const confluenceEvent: ActivityEvent = {
        id: "source-conf",
        type: "confluence-page",
        content: "Content",
        timestamp: "2024-01-15T10:00:00Z",
        source: "confluence",
        actor: "test@example.com",
        metadata: {},
      };

      const result = extractor.extractFeatures(confluenceEvent);
      expect(result.features.is_confluence_source).toBe(1);
      expect(result.features.is_github_source).toBe(0);
      expect(result.features.is_jira_source).toBe(0);
      expect(result.features.is_bitbucket_source).toBe(0);
    });
  });

  describe("Batch Processing", () => {
    test("should process multiple events efficiently", () => {
      const events: ActivityEvent[] = [
        {
          id: "batch-1",
          type: "confluence-page",
          content: "First page",
          timestamp: "2024-01-15T10:00:00Z",
          source: "confluence",
          actor: "user1@example.com",
          metadata: {},
        },
        {
          id: "batch-2",
          type: "pull-request-review",
          content: "Review comments",
          timestamp: "2024-01-15T11:00:00Z",
          source: "git",
          actor: "user2@example.com",
          metadata: { comments: 3 },
        },
        {
          id: "batch-3",
          type: "jira-ticket",
          content: "Ticket description",
          timestamp: "2024-01-15T12:00:00Z",
          source: "jira",
          actor: "user3@example.com",
          metadata: {},
        },
      ];

      const results: FeatureVector[] = extractor.extractFeaturesBatch(events);

      expect(results).toHaveLength(3);
      expect(results[0].id).toBe("batch-1");
      expect(results[1].id).toBe("batch-2");
      expect(results[2].id).toBe("batch-3");

      // Verify different event types are detected
      expect(results[0].features.is_confluence_page).toBe(1);
      expect(results[1].features.is_pr_review).toBe(1);
      expect(results[2].features.is_jira_ticket).toBe(1);
    });
  });

  describe("Feature Vector Consistency", () => {
    test("should produce consistent feature vectors", () => {
      const event: ActivityEvent = {
        id: "consistency-1",
        type: "confluence-page",
        content: "Test content for consistency",
        timestamp: "2024-01-15T10:00:00Z",
        source: "confluence",
        actor: "test@example.com",
        metadata: {},
      };

      const result1 = extractor.extractFeatures(event);
      const result2 = extractor.extractFeatures(event);

      expect(result1.vector).toEqual(result2.vector);
      expect(result1.features).toEqual(result2.features);
    });

    test("should produce vectors with consistent length", () => {
      const events: ActivityEvent[] = [
        {
          id: "vector-test-1",
          type: "confluence-page",
          content: "Simple content",
          timestamp: "2024-01-15T10:00:00Z",
          source: "confluence",
          actor: "test@example.com",
          metadata: {},
        },
        {
          id: "vector-test-2",
          type: "pull-request-review",
          content:
            "Complex review with lots of technical details about API design, database architecture, and security considerations.",
          timestamp: "2024-01-15T11:00:00Z",
          source: "git",
          actor: "reviewer@example.com",
          metadata: {
            comments: 10,
            suggestions: 5,
            collaborators: ["user1", "user2"],
          },
        },
      ];

      const results = extractor.extractFeaturesBatch(events);

      expect(results[0].vector.length).toBe(results[1].vector.length);
      expect(results[0].vector.length).toBe(31); // Expected number of features
    });
  });

  describe("Semantic Complexity", () => {
    test("should calculate higher complexity for technical content", () => {
      const simpleEvent: ActivityEvent = {
        id: "simple-1",
        type: "confluence-page",
        content: "This is a simple document with basic information.",
        timestamp: "2024-01-15T10:00:00Z",
        source: "confluence",
        actor: "test@example.com",
        metadata: {},
      };

      const complexEvent: ActivityEvent = {
        id: "complex-1",
        type: "confluence-page",
        content: `
          This technical document covers API architecture patterns, database optimization strategies,
          and security implementation guidelines. The code example shows how to implement a microservice
          using Docker containers and Kubernetes deployment. See https://example.com/api-docs for more details.
          
          Implementation checklist:
          - Set up CI/CD pipeline
          - Configure monitoring and logging
          - Implement proper error handling
          - Add comprehensive testing
        `,
        timestamp: "2024-01-15T10:00:00Z",
        source: "confluence",
        actor: "test@example.com",
        metadata: {},
      };

      const simpleResult = extractor.extractFeatures(simpleEvent);
      const complexResult = extractor.extractFeatures(complexEvent);

      expect(complexResult.features.semantic_complexity).toBeGreaterThan(
        simpleResult.features.semantic_complexity
      );
      expect(complexResult.features.technical_term_density).toBeGreaterThan(
        simpleResult.features.technical_term_density
      );
    });
  });
});
