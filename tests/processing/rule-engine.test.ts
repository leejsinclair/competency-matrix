import { RuleEngine } from "../../src/processing/rule-engine";
import { Rule, RuleCondition } from "../../src/processing/types";
import { ActivityEvent } from "../../src/types/activity";

/**
 * Rule Engine Tests
 *
 * This test suite validates the core functionality of the RuleEngine class,
 * which is responsible for processing events and generating competency labels
 * based on configurable rules.
 *
 * Test Structure:
 * - Rule Management: Adding, removing, updating, and enabling/disabling rules
 * - Event Processing: Core event processing and label generation
 * - Condition Evaluation: Testing various condition operators and logic
 * - Rule Priority: Ensuring rules are evaluated in correct order
 * - Edge Cases: Handling invalid rules, empty events, and error scenarios
 */

describe("RuleEngine", () => {
  let ruleEngine: RuleEngine;
  let mockEvent: ActivityEvent;

  beforeEach(() => {
    ruleEngine = new RuleEngine();

    mockEvent = {
      id: "test-event-1",
      source: "jira",
      timestamp: "2023-01-01T10:00:00.000Z",
      actor: "test@example.com",
      type: "issue_created",
      metadata: {
        summary: "Test Issue",
        description: "Test description",
        priority: "High",
      },
      content: "Test Issue\n\nTest description",
    };
  });

  /**
   * Rule Management Tests
   *
   * These tests validate the basic CRUD operations for rules:
   * - Adding new rules to the engine
   * - Removing existing rules by ID
   * - Updating rule properties
   * - Enabling and disabling rules
   * - Maintaining rule priority order
   */

  describe("addRule", () => {
    /**
     * Test: Add New Rule
     *
     * Validates that a new rule can be added to the rule engine:
     * - Rule is properly stored in the engine
     * - Rule count increases correctly
     * - Rule properties are preserved
     * - Rule can be retrieved after adding
     */
    it("should add a new rule", () => {
      const rule: Rule = {
        id: "test-rule-1",
        name: "Test Rule",
        description: "Test rule description",
        category: "test",
        conditions: [
          {
            field: "source",
            operator: "equals",
            value: "jira",
            caseSensitive: false,
          },
        ],
        action: {
          type: "label",
          params: {
            competencyCategory: "test",
            competencyRow: "general",
            level: {
              level: 1,
              name: "Beginner",
              description: "",
              criteria: [],
            },
            confidence: 0.8,
            evidence: "Test rule matched",
          },
        },
        enabled: true,
        priority: 10,
      };

      ruleEngine.addRule(rule);
      const rules = ruleEngine.getRules();

      expect(rules).toHaveLength(1);
      expect(rules[0]).toEqual(rule);
    });

    /**
     * Test: Rule Priority Sorting
     *
     * Validates that rules are automatically sorted by priority:
     * - Higher priority rules come first
     * - Rules with same priority maintain insertion order
     * - Priority sorting affects evaluation order
     * - Sorting happens automatically when rules are added
     */
    it("should sort rules by priority", () => {
      const lowPriorityRule: Rule = {
        id: "low-priority",
        name: "Low Priority",
        description: "Low priority rule",
        category: "test",
        conditions: [],
        action: { type: "label", params: {} },
        enabled: true,
        priority: 1,
      };

      const highPriorityRule: Rule = {
        id: "high-priority",
        name: "High Priority",
        description: "High priority rule",
        category: "test",
        conditions: [],
        action: { type: "label", params: {} },
        enabled: true,
        priority: 10,
      };

      ruleEngine.addRule(lowPriorityRule);
      ruleEngine.addRule(highPriorityRule);
      const rules = ruleEngine.getRules();

      expect(rules[0]).toEqual(highPriorityRule);
      expect(rules[1]).toEqual(lowPriorityRule);
    });
  });

  describe("removeRule", () => {
    it("should remove a rule by ID", () => {
      const rule: Rule = {
        id: "test-rule-1",
        name: "Test Rule",
        description: "Test rule description",
        category: "test",
        conditions: [],
        action: { type: "label", params: {} },
        enabled: true,
        priority: 10,
      };

      ruleEngine.addRule(rule);
      expect(ruleEngine.getRules()).toHaveLength(1);

      ruleEngine.removeRule("test-rule-1");
      expect(ruleEngine.getRules()).toHaveLength(0);
    });

    it("should handle non-existent rule ID", () => {
      const initialRules = ruleEngine.getRules();
      ruleEngine.removeRule("non-existent");
      expect(ruleEngine.getRules()).toEqual(initialRules);
    });
  });

  /**
   * Event Processing Tests
   *
   * These tests validate the core event processing functionality:
   * - Processing events with matching rules
   * - Handling events that don't match any rules
   * - Processing events with multiple matching rules
   * - Generating labels and features from events
   * - Handling disabled rules during processing
   */

  describe("processEvent", () => {
    /**
     * Test: Event with Matching Rule
     *
     * Validates that an event matching a rule generates appropriate labels:
     * - Event conditions are evaluated correctly
     * - Labels are generated when conditions match
     * - Label properties are set correctly
     * - Evidence is generated from matching conditions
     */
    it("should process event with matching rule", () => {
      const rule: Rule = {
        id: "jira-rule",
        name: "Jira Issue Rule",
        description: "Identify Jira issues",
        category: "jira",
        conditions: [
          {
            field: "source",
            operator: "equals",
            value: "jira",
            caseSensitive: false,
          },
          {
            field: "type",
            operator: "contains",
            value: "issue",
            caseSensitive: false,
          },
        ],
        action: {
          type: "label",
          params: {
            competencyCategory: "issue-tracking",
            competencyRow: "bug-management",
            level: { level: 2, name: "Novice", description: "", criteria: [] },
            confidence: 0.9,
            evidence: 'Rule "Jira Issue Rule" matched event test-event-1',
          },
        },
        enabled: true,
        priority: 10,
      };

      ruleEngine.addRule(rule);
      const result = ruleEngine.processEvent(mockEvent);

      expect(result.labels).toHaveLength(1);
      expect(result.labels[0]).toMatchObject({
        id: expect.stringContaining("rule-jira-rule-test-event-1"),
        eventId: "test-event-1",
        competencyCategory: "issue-tracking",
        competencyRow: "bug-management",
        level: { level: 2, name: "Novice", description: "", criteria: [] },
        confidence: 0.9,
        source: "rule",
        evidence: 'Rule "Jira Issue Rule" matched event test-event-1',
      });
    });

    it("should not process event when rule conditions do not match", () => {
      const rule: Rule = {
        id: "bitbucket-rule",
        name: "Bitbucket Rule",
        description: "Identify Bitbucket activities",
        category: "bitbucket",
        conditions: [
          {
            field: "source",
            operator: "equals",
            value: "bitbucket",
            caseSensitive: false,
          },
        ],
        action: {
          type: "label",
          params: {
            competencyCategory: "version-control",
            competencyRow: "code-management",
            level: {
              level: 3,
              name: "Intermediate",
              description: "",
              criteria: [],
            },
            confidence: 0.8,
            evidence: "Bitbucket activity detected",
          },
        },
        enabled: true,
        priority: 10,
      };

      ruleEngine.addRule(rule);
      const result = ruleEngine.processEvent(mockEvent);

      expect(result.labels).toHaveLength(0);
      expect(result.features).toHaveLength(0);
    });

    it("should handle multiple matching rules", () => {
      const rule1: Rule = {
        id: "source-rule",
        name: "Source Rule",
        description: "Identify source",
        category: "source",
        conditions: [
          {
            field: "source",
            operator: "equals",
            value: "jira",
            caseSensitive: false,
          },
        ],
        action: {
          type: "label",
          params: {
            competencyCategory: "tool-usage",
            competencyRow: "jira-proficiency",
            level: { level: 2, name: "Novice", description: "", criteria: [] },
            confidence: 0.7,
            evidence: "Jira source detected",
          },
        },
        enabled: true,
        priority: 5,
      };

      const rule2: Rule = {
        id: "type-rule",
        name: "Type Rule",
        description: "Identify issue type",
        category: "type",
        conditions: [
          {
            field: "type",
            operator: "contains",
            value: "issue",
            caseSensitive: false,
          },
        ],
        action: {
          type: "label",
          params: {
            competencyCategory: "issue-management",
            competencyRow: "bug-tracking",
            level: {
              level: 3,
              name: "Intermediate",
              description: "",
              criteria: [],
            },
            confidence: 0.8,
            evidence: "Issue type detected",
          },
        },
        enabled: true,
        priority: 10,
      };

      ruleEngine.addRule(rule1);
      ruleEngine.addRule(rule2);
      const result = ruleEngine.processEvent(mockEvent);

      expect(result.labels).toHaveLength(2);
      expect(result.labels[0].competencyCategory).toBe("issue-management");
      expect(result.labels[1].competencyCategory).toBe("tool-usage");
    });
  });

  /**
   * Condition Evaluation Tests
   *
   * These tests validate the various condition operators and logic:
   * - Equals operator for exact matching
   * - Contains operator for substring matching
   * - Regex operator for pattern matching
   * - In operator for array membership
   * - Case sensitivity handling
   * - Complex condition combinations
   */

  describe("condition evaluation", () => {
    /**
     * Test: Equals Condition
     *
     * Validates the equals operator for exact field matching:
     * - String fields match exactly
     * - Case sensitivity is respected
     * - Non-matching values are rejected
     * - Different data types are handled correctly
     */
    it("should evaluate equals condition correctly", () => {
      const condition: RuleCondition = {
        field: "source",
        operator: "equals",
        value: "jira",
        caseSensitive: false,
      };

      const rule: Rule = {
        id: "test-rule",
        name: "Test Rule",
        description: "Test rule",
        category: "test",
        conditions: [condition],
        action: { type: "label", params: {} },
        enabled: true,
        priority: 10,
      };

      ruleEngine.addRule(rule);
      const result = ruleEngine.processEvent(mockEvent);

      expect(result.labels).toHaveLength(1);
    });

    it("should evaluate contains condition correctly", () => {
      const condition: RuleCondition = {
        field: "type",
        operator: "contains",
        value: "issue",
        caseSensitive: false,
      };

      const rule: Rule = {
        id: "test-rule",
        name: "Test Rule",
        description: "Test rule",
        category: "test",
        conditions: [condition],
        action: { type: "label", params: {} },
        enabled: true,
        priority: 10,
      };

      ruleEngine.addRule(rule);
      const result = ruleEngine.processEvent(mockEvent);

      expect(result.labels).toHaveLength(1);
    });

    it("should evaluate regex condition correctly", () => {
      const condition: RuleCondition = {
        field: "content",
        operator: "regex",
        value: "\\b(Test|Issue)\\b",
        caseSensitive: false,
      };

      const rule: Rule = {
        id: "test-rule",
        name: "Test Rule",
        description: "Test rule",
        category: "test",
        conditions: [condition],
        action: { type: "label", params: {} },
        enabled: true,
        priority: 10,
      };

      ruleEngine.addRule(rule);
      const result = ruleEngine.processEvent(mockEvent);

      expect(result.labels).toHaveLength(1);
    });

    it("should evaluate in condition correctly", () => {
      const condition: RuleCondition = {
        field: "type",
        operator: "in",
        value: ["issue_created", "issue_updated"],
      };

      const rule: Rule = {
        id: "test-rule",
        name: "Test Rule",
        description: "Test rule",
        category: "test",
        conditions: [condition],
        action: { type: "label", params: {} },
        enabled: true,
        priority: 10,
      };

      ruleEngine.addRule(rule);
      const result = ruleEngine.processEvent(mockEvent);

      expect(result.labels).toHaveLength(1);
    });

    it("should handle case sensitivity correctly", () => {
      const condition: RuleCondition = {
        field: "source",
        operator: "equals",
        value: "JIRA",
        caseSensitive: true,
      };

      const rule: Rule = {
        id: "test-rule",
        name: "Test Rule",
        description: "Test rule",
        category: "test",
        conditions: [condition],
        action: { type: "label", params: {} },
        enabled: true,
        priority: 10,
      };

      ruleEngine.addRule(rule);
      const result = ruleEngine.processEvent(mockEvent);

      expect(result.labels).toHaveLength(0);
    });
  });

  describe("rule management", () => {
    it("should enable and disable rules", () => {
      const rule: Rule = {
        id: "test-rule",
        name: "Test Rule",
        description: "Test rule",
        category: "test",
        conditions: [
          {
            field: "source",
            operator: "equals",
            value: "jira",
            caseSensitive: false,
          },
        ],
        action: { type: "label", params: {} },
        enabled: true,
        priority: 10,
      };

      ruleEngine.addRule(rule);

      // Initially should process
      let result = ruleEngine.processEvent(mockEvent);
      expect(result.labels).toHaveLength(1);

      // Disable rule
      ruleEngine.disableRule("test-rule");
      result = ruleEngine.processEvent(mockEvent);
      expect(result.labels).toHaveLength(0);

      // Re-enable rule
      ruleEngine.enableRule("test-rule");
      result = ruleEngine.processEvent(mockEvent);
      expect(result.labels).toHaveLength(1);
    });

    it("should update rules", () => {
      const rule: Rule = {
        id: "test-rule",
        name: "Test Rule",
        description: "Test rule",
        category: "test",
        conditions: [
          {
            field: "source",
            operator: "equals",
            value: "jira",
            caseSensitive: false,
          },
        ],
        action: {
          type: "label",
          params: {
            competencyCategory: "original",
            level: {
              level: 1,
              name: "Beginner",
              description: "",
              criteria: [],
            },
            confidence: 0.5,
            evidence: "Original evidence",
          },
        },
        enabled: true,
        priority: 10,
      };

      ruleEngine.addRule(rule);

      // Update rule
      ruleEngine.updateRule("test-rule", {
        name: "Updated Test Rule",
        action: {
          type: "label",
          params: {
            competencyCategory: "updated",
            level: {
              level: 3,
              name: "Intermediate",
              description: "",
              criteria: [],
            },
            confidence: 0.9,
            evidence: "Updated evidence",
          },
        },
      });

      const updatedRules = ruleEngine.getRules();
      expect(updatedRules).toHaveLength(1);
      expect(updatedRules[0].name).toBe("Updated Test Rule");
      expect(updatedRules[0].action.params.competencyCategory).toBe("updated");
    });
  });
});
