import { ActivityEvent } from "../types/activity";
import { Rule, RuleCondition, RuleAction, Label, FeatureVector } from "./types";

export class RuleEngine {
  private rules: Rule[] = [];

  constructor(rules: Rule[] = []) {
    this.rules = rules.sort((a, b) => b.priority - a.priority);
  }

  addRule(rule: Rule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  removeRule(ruleId: string): void {
    this.rules = this.rules.filter((rule) => rule.id !== ruleId);
  }

  updateRule(ruleId: string, updates: Partial<Rule>): void {
    const index = this.rules.findIndex((rule) => rule.id === ruleId);
    if (index !== -1) {
      this.rules[index] = { ...this.rules[index], ...updates };
      this.rules.sort((a, b) => b.priority - a.priority);
    }
  }

  processEvent(event: ActivityEvent): {
    labels: Label[];
    features: FeatureVector[];
  } {
    const labels: Label[] = [];
    const features: FeatureVector[] = [];

    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      if (this.evaluateConditions(rule.conditions, event)) {
        const result = this.executeAction(rule.action, event, rule);

        if (result.labels) labels.push(...result.labels);
        if (result.features) features.push(...result.features);
      }
    }

    return { labels, features };
  }

  private evaluateConditions(
    conditions: RuleCondition[],
    event: ActivityEvent
  ): boolean {
    if (conditions.length === 0) return true;

    return conditions.every((condition) =>
      this.evaluateCondition(condition, event)
    );
  }

  private evaluateCondition(
    condition: RuleCondition,
    event: ActivityEvent
  ): boolean {
    const fieldValue = this.getFieldValue(event, condition.field);
    const conditionValue = condition.value;

    switch (condition.operator) {
      case "equals":
        return (
          this.compareValues(
            fieldValue,
            conditionValue,
            condition.caseSensitive
          ) === 0
        );

      case "contains":
        const fieldStr = String(fieldValue || "");
        const condStr = String(conditionValue || "");
        return condition.caseSensitive
          ? fieldStr.includes(condStr)
          : fieldStr.toLowerCase().includes(condStr.toLowerCase());

      case "regex":
        const regex = new RegExp(
          conditionValue,
          condition.caseSensitive ? "g" : "gi"
        );
        return regex.test(String(fieldValue || ""));

      case "gt":
        return Number(fieldValue) > Number(conditionValue);

      case "lt":
        return Number(fieldValue) < Number(conditionValue);

      case "gte":
        return Number(fieldValue) >= Number(conditionValue);

      case "lte":
        return Number(fieldValue) <= Number(conditionValue);

      case "in":
        return (
          Array.isArray(conditionValue) && conditionValue.includes(fieldValue)
        );

      case "not_in":
        return (
          Array.isArray(conditionValue) && !conditionValue.includes(fieldValue)
        );

      default:
        return false;
    }
  }

  private getFieldValue(event: ActivityEvent, field: string): any {
    const parts = field.split(".");
    let value: any = event;

    for (const part of parts) {
      if (value && typeof value === "object" && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  private compareValues(
    value1: any,
    value2: any,
    caseSensitive: boolean = true
  ): number {
    const str1 = caseSensitive
      ? String(value1 || "")
      : String(value1 || "").toLowerCase();
    const str2 = caseSensitive
      ? String(value2 || "")
      : String(value2 || "").toLowerCase();

    if (str1 < str2) return -1;
    if (str1 > str2) return 1;
    return 0;
  }

  private executeAction(
    action: RuleAction,
    event: ActivityEvent,
    rule: Rule
  ): { labels?: Label[]; features?: FeatureVector[] } {
    switch (action.type) {
      case "label":
        return {
          labels: [this.createLabel(action.params, event, rule)],
        };

      case "feature":
        return {
          features: [this.createFeature(action.params, event, rule)],
        };

      case "transform":
        // Transform actions modify the event itself
        this.transformEvent(action.params, event);
        return {};

      default:
        return {};
    }
  }

  private createLabel(params: any, event: ActivityEvent, rule: Rule): Label {
    return {
      id: `rule-${rule.id}-${event.id}`,
      eventId: event.id,
      competencyCategory: params.competencyCategory || "general",
      competencyRow: params.competencyRow || "unknown",
      level: params.level || {
        level: 1,
        name: "Beginner",
        description: "",
        criteria: [],
      },
      confidence: params.confidence || 0.8,
      source: "rule",
      evidence:
        params.evidence || `Rule "${rule.name}" matched event ${event.id}`,
      createdAt: new Date(),
    };
  }

  private createFeature(
    params: any,
    event: ActivityEvent,
    rule: Rule
  ): FeatureVector {
    const features: Record<string, number> = {};

    // Extract features based on params configuration
    if (params.features) {
      for (const featureConfig of params.features) {
        const value = this.extractFeatureValue(event, featureConfig);
        features[featureConfig.name] = value;
      }
    }

    // Create vector representation
    const vector = Object.values(features);

    return {
      id: `feature-${rule.id}-${event.id}`,
      eventId: event.id,
      features,
      vector,
      algorithm: "rule-based",
      version: "1.0",
      createdAt: new Date(),
    };
  }

  private extractFeatureValue(
    event: ActivityEvent,
    featureConfig: any
  ): number {
    const { field, type = "count" } = featureConfig;
    const value = this.getFieldValue(event, field);

    switch (type) {
      case "count":
        return Array.isArray(value) ? value.length : value ? 1 : 0;

      case "length":
        return typeof value === "string" ? value.length : 0;

      case "sum":
        return Array.isArray(value)
          ? value.reduce((sum, item) => sum + Number(item || 0), 0)
          : Number(value || 0);

      case "avg":
        return Array.isArray(value)
          ? value.reduce((sum, item) => sum + Number(item || 0), 0) /
              value.length
          : Number(value || 0);

      case "exists":
        return value ? 1 : 0;

      default:
        return Number(value) || 0;
    }
  }

  private transformEvent(params: any, event: ActivityEvent): void {
    // Apply transformations to the event
    if (params.transformations) {
      for (const transformation of params.transformations) {
        this.applyTransformation(event, transformation);
      }
    }
  }

  private applyTransformation(event: ActivityEvent, transformation: any): void {
    const { field, operation, value } = transformation;
    const currentValue = this.getFieldValue(event, field);

    switch (operation) {
      case "set":
        this.setFieldValue(event, field, value);
        break;

      case "append":
        this.setFieldValue(
          event,
          field,
          String(currentValue || "") + String(value || "")
        );
        break;

      case "prepend":
        this.setFieldValue(
          event,
          field,
          String(value || "") + String(currentValue || "")
        );
        break;

      case "replace":
        const regex = new RegExp(value.pattern, value.flags || "g");
        const newValue = String(currentValue || "").replace(
          regex,
          value.replacement
        );
        this.setFieldValue(event, field, newValue);
        break;
    }
  }

  private setFieldValue(event: ActivityEvent, field: string, value: any): void {
    const parts = field.split(".");
    let current: any = event;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part] || typeof current[part] !== "object") {
        current[part] = {};
      }
      current = current[part];
    }

    current[parts[parts.length - 1]] = value;
  }

  getRules(): Rule[] {
    return [...this.rules];
  }

  getRulesByCategory(category: string): Rule[] {
    return this.rules.filter((rule) => rule.category === category);
  }

  enableRule(ruleId: string): void {
    const rule = this.rules.find((r) => r.id === ruleId);
    if (rule) {
      rule.enabled = true;
    }
  }

  disableRule(ruleId: string): void {
    const rule = this.rules.find((r) => r.id === ruleId);
    if (rule) {
      rule.enabled = false;
    }
  }
}
