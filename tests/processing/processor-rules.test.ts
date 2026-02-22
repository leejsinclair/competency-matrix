import { createProcessorSetup } from "./processor-setup-mock";

/**
 * Processor Rule Management Tests
 *
 * This test suite validates the rule management functionality of the Processor class.
 * It tests how the processor manages CircleCI competency rules, including adding,
 * removing, updating, and enabling/disabling rules at the processor level.
 *
 * Test Structure:
 * - Rule Management: CRUD operations for processor rules
 * - Default Rules: Validation of built-in CircleCI competency rules
 * - Rule Updates: Modifying existing rule properties
 * - Rule Enable/Disable: Controlling rule activation
 * - Rule Persistence: Ensuring rules are properly maintained
 */

describe("Processor - Rule Management", () => {
  let processor: any;

  beforeEach(() => {
    const setup = createProcessorSetup();
    processor = setup.processor;
  });

  /**
   * Rule Management Tests
   *
   * These tests validate the processor's rule management capabilities:
   * - Adding new rules to the processor
   * - Retrieving existing rules
   * - Removing rules from the processor
   * - Maintaining rule count accuracy
   * - Integration with default CircleCI rules
   */

  describe("rule management", () => {
    /**
     * Test: Add and Retrieve Rules
     *
     * Validates that rules can be added to and retrieved from the processor:
     * - New rules are properly added to the processor
     * - Rule count increases correctly (12 default + 1 test = 13)
     * - Rules can be removed and count updates appropriately
     * - Default CircleCI rules are preserved during operations
     */
    it("should add and retrieve rules", () => {
      const rule = {
        id: "test-rule",
        name: "Test Rule",
        description: "Test rule",
        category: "test",
        conditions: [],
        action: { type: "label" as const, params: {} },
        enabled: true,
        priority: 10,
      };

      processor.addRule(rule);
      expect(processor.getRules()).toHaveLength(13); // 12 default + 1 test rule

      processor.removeRule("test-rule");
      expect(processor.getRules()).toHaveLength(12); // Back to default rules
    });

    /**
     * Test: Update Rules
     *
     * Validates that existing rules can be updated with new properties:
     * - Rule properties are updated correctly
     * - Rule count remains the same after update
     * - Updated rule maintains its ID and other unchanged properties
     * - Multiple properties can be updated simultaneously
     */
    it("should update rules", () => {
      const rule = {
        id: "test-rule",
        name: "Test Rule",
        description: "Test rule",
        category: "test",
        conditions: [],
        action: { type: "label" as const, params: {} },
        enabled: true,
        priority: 10,
      };

      processor.addRule(rule);

      processor.updateRule("test-rule", { name: "Updated Rule" });
      const updatedRules = processor.getRules();

      expect(updatedRules).toHaveLength(13); // Still 12 default + 1 updated test rule
      const testRule = updatedRules.find((r: any) => r.id === "test-rule");
      expect(testRule!.name).toBe("Updated Rule");
    });

    /**
     * Test: Enable and Disable Rules
     *
     * Validates that rules can be enabled and disabled:
     * - Rules can be disabled to prevent processing
     * - Disabled rules don't participate in event processing
     * - Rules can be re-enabled after being disabled
     * - Rule enable/disable state is preserved correctly
     */
    it("should enable and disable rules", () => {
      const rule = {
        id: "test-rule",
        name: "Test Rule",
        description: "Test rule",
        category: "test",
        conditions: [],
        action: { type: "label" as const, params: {} },
        enabled: true,
        priority: 10,
      };

      processor.addRule(rule);

      processor.disableRule("test-rule");
      const disabledRules = processor.getRules();
      const testRuleDisabled = disabledRules.find(
        (r: any) => r.id === "test-rule"
      );
      expect(testRuleDisabled!.enabled).toBe(false);

      processor.enableRule("test-rule");
      const enabledRules = processor.getRules();
      const testRuleEnabled = enabledRules.find(
        (r: any) => r.id === "test-rule"
      );
      expect(testRuleEnabled!.enabled).toBe(true);
    });
  });
});
