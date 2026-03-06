import taxonomy from "../../taxonomy/tech-taxonomy.json";
import { Rule } from "../processing/types";

export class RuleService {
  private rules: Rule[] = [];

  constructor() {
    this.loadRules();
  }

  private loadRules(): void {
    try {
      // Load rule configuration
      const rulesConfig = require("../../config/rules.json");

      if (rulesConfig && rulesConfig.rules) {
        this.rules = rulesConfig.rules.map((ruleConfig: any) => ({
          id: ruleConfig.id,
          name: ruleConfig.name,
          category: ruleConfig.category,
          enabled: ruleConfig.enabled,
          priority: ruleConfig.priority,
          conditions: ruleConfig.conditions,
          action: ruleConfig.action,
        }));
      }

      console.log(`Loaded ${this.rules.length} classification rules`);
    } catch (error) {
      console.error("Failed to load rules:", error);
      this.rules = [];
    }
  }

  getRules(): Rule[] {
    return [...this.rules];
  }

  getRulesByCategory(category: string): Rule[] {
    return this.rules.filter((rule) => rule.category === category);
  }

  getEnabledRules(): Rule[] {
    return this.rules.filter((rule) => rule.enabled);
  }

  /**
   * Enhanced rule matching using taxonomy terms
   * Expands simple contains matches to include taxonomy variants
   */
  expandRuleWithTaxonomy(rule: Rule): Rule {
    const expandedRule = { ...rule };

    // Expand conditions to include taxonomy variants
    if (expandedRule.conditions) {
      expandedRule.conditions = expandedRule.conditions.map((condition) => {
        if (
          condition.operator === "contains" &&
          typeof condition.value === "string"
        ) {
          const taxonomyTerms = this.findTaxonomyTerms(condition.value);
          if (taxonomyTerms.length > 0) {
            // Create regex pattern to match any variant
            const variants = [condition.value, ...taxonomyTerms];
            const pattern = variants
              .map((term) => term.replace(/[.*+?^${}]/g, "\\$&"))
              .join("|");

            return {
              ...condition,
              operator: "regex",
              value: {
                pattern: `(${pattern})`,
                flags: "gi", // Case insensitive
              },
            };
          }
        }
        return condition;
      });
    }

    return expandedRule;
  }

  /**
   * Find taxonomy terms for a given canonical term
   */
  private findTaxonomyTerms(canonicalTerm: string): string[] {
    const terms: string[] = [];

    const searchInCategory = (category: any): void => {
      if (category && category.terms) {
        for (const term of category.terms) {
          if (term.canonical === canonicalTerm) {
            terms.push(...(term.variants || []));
          }
        }
      }
      if (category && category.children) {
        for (const child of category.children) {
          searchInCategory(child);
        }
      }
    };

    // Search through the entire taxonomy
    for (const category of taxonomy.children) {
      const categoryTerms: string[] = [];
      (searchInCategory as any)(category);
      terms.push(...categoryTerms);
    }

    return terms;
  }

  /**
   * Get all unique canonical terms from taxonomy
   */
  getAllTaxonomyTerms(): string[] {
    const terms: string[] = [];

    const collectTerms = (category: any) => {
      if (category.terms) {
        for (const term of category.terms) {
          terms.push(term.canonical);
        }
      }
      if (category.children) {
        for (const child of category.children) {
          collectTerms(child);
        }
      }
    };

    for (const category of taxonomy.children) {
      collectTerms(category);
    }

    return [...new Set(terms)];
  }

  /**
   * Validate rule against taxonomy
   */
  validateRule(rule: Rule): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const allTaxonomyTerms = this.getAllTaxonomyTerms();

    // Check if rule references valid taxonomy terms
    if (rule.conditions) {
      for (const condition of rule.conditions) {
        if (
          condition.operator === "contains" &&
          typeof condition.value === "string"
        ) {
          if (!allTaxonomyTerms.includes(condition.value)) {
            errors.push(
              `Condition value "${condition.value}" is not a valid taxonomy term`
            );
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Reload rules from configuration
   */
  reloadRules(): void {
    this.loadRules();
  }
}
