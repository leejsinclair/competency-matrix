import { RuleService } from "../services/rule-service";

describe("Basic Taxonomy Integration", () => {
  let ruleService: RuleService;

  beforeEach(() => {
    ruleService = new RuleService();
  });

  test("should load rules from configuration", () => {
    const rules = ruleService.getRules();

    expect(rules).toBeDefined();
    expect(rules.length).toBeGreaterThan(0);

    // Check if programming language rules exist
    const javaRule = rules.find(
      (r) => r.id === "programming-language-detection"
    );
    expect(javaRule).toBeDefined();
    expect(javaRule!.name).toBe("Programming Language Detection");
  });

  test("should find taxonomy terms for Java", () => {
    const terms = (ruleService as any).findTaxonomyTerms("Java");

    expect(terms).toContain("Java");
    expect(terms).toContain("java");
    expect(terms).toContain("Java SE");
    expect(terms).toContain("Java EE");
  });

  test("should expand rules with taxonomy variants", () => {
    const rules = ruleService.getRules();
    const javaRule = rules.find(
      (r) => r.id === "programming-language-detection"
    );

    if (javaRule) {
      const expandedRule = (ruleService as any).expandRuleWithTaxonomy(
        javaRule
      );

      expect(expandedRule.conditions).toHaveLength(1);
      const condition = expandedRule.conditions[0];
      expect(condition.operator).toBe("regex");
      expect(condition.value.pattern).toContain("Java");
      expect(condition.value.pattern).toContain("java");
    }
  });
});
