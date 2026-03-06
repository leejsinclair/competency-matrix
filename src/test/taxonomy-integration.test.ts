import { RuleEngine } from "../processing/rule-engine";
import { RuleService } from "../services/rule-service";
import { ActivityEvent } from "../types/activity";

describe("Taxonomy Integration", () => {
  let ruleEngine: RuleEngine;
  let ruleService: RuleService;

  beforeEach(() => {
    ruleService = new RuleService();
    ruleEngine = new RuleEngine();
  });

  describe("Taxonomy-based rule expansion", () => {
    test("should expand Java detection to include variants", () => {
      const rules = ruleService.getRules();
      const javaRule = rules.find(
        (r) => r.id === "programming-language-detection"
      );

      expect(javaRule).toBeDefined();
      expect(javaRule!.conditions).toHaveLength(1);

      const condition = javaRule!.conditions[0];
      expect(condition.operator).toBe("regex");
      expect(condition.value.pattern).toContain("Java");
      expect(condition.value.pattern).toContain("java");
    });

    test("should expand React detection to include variants", () => {
      const rules = ruleService.getRules();
      const reactRule = rules.find((r) => r.id === "react-detection");

      expect(reactRule).toBeDefined();
      if (reactRule && reactRule.conditions) {
        const condition = reactRule.conditions[0];
        expect(condition.operator).toBe("regex");
        expect(condition.value.pattern).toContain("React");
        expect(condition.value.pattern).toContain("react");
      }
    });

    test("should expand Docker detection to include variants", () => {
      const rules = ruleService.getRules();
      const dockerRule = rules.find((r) => r.id === "docker-detection");

      expect(dockerRule).toBeDefined();
      if (dockerRule && dockerRule.conditions) {
        const condition = dockerRule.conditions[0];
        expect(condition.operator).toBe("regex");
        expect(condition.value.pattern).toContain("Docker");
        expect(condition.value.pattern).toContain("docker");
      }
    });

    test("should expand Kubernetes detection to include variants", () => {
      const rules = ruleService.getRules();
      const k8sRule = rules.find((r) => r.id === "kubernetes-detection");

      expect(k8sRule).toBeDefined();
      if (k8sRule && k8sRule.conditions) {
        const condition = k8sRule.conditions[0];
        expect(condition.operator).toBe("regex");
        expect(condition.value.pattern).toContain("Kubernetes");
        expect(condition.value.pattern).toContain("kubernetes");
        expect(condition.value.pattern).toContain("k8s");
      }
    });
  });

  describe("Content classification with taxonomy", () => {
    test("should classify Java content correctly", () => {
      const event: ActivityEvent = {
        id: "test-1",
        type: "code",
        content: "I wrote some Java code today",
        timestamp: new Date().toISOString(),
        source: "jira" as const,
        actor: "test-user",
        metadata: {},
      };

      const result = ruleEngine.processEvent(event);

      expect(result.labels).toHaveLength(1);
      expect(result.labels[0].competencyCategory).toBe("programming-languages");
      expect(result.labels[0].competencyRow).toBe("software-engineering");
    });

    test("should classify React content correctly", () => {
      const event: ActivityEvent = {
        id: "test-2",
        type: "code",
        content: "Built a React component with hooks",
        timestamp: new Date().toISOString(),
        source: "github" as any, // This might need to be added to ActivitySource
        metadata: {},
      };

      const result = ruleEngine.processEvent(event);

      expect(result.labels).toHaveLength(1);
      expect(result.labels[0].competencyCategory).toBe("web-development");
      expect(result.labels[0].competencyRow).toBe("frontend");
    });

    test("should classify Docker content correctly", () => {
      const event: ActivityEvent = {
        id: "test-3",
        type: "infrastructure",
        content: "Deployed Docker containers to production",
        timestamp: new Date().toISOString(),
        source: "ci-cd" as any,
        metadata: {},
      };

      const result = ruleEngine.processEvent(event);

      expect(result.labels).toHaveLength(1);
      expect(result.labels[0].competencyCategory).toBe(
        "containers-orchestration"
      );
      expect(result.labels[0].competencyRow).toBe(
        "devops-platform-engineering"
      );
    });

    test("should classify Kubernetes content correctly", () => {
      const event: ActivityEvent = {
        id: "test-4",
        type: "infrastructure",
        content: "Managed Kubernetes cluster with deployments",
        timestamp: new Date().toISOString(),
        source: "kubectl" as any,
        metadata: {},
      };

      const result = ruleEngine.processEvent(event);

      expect(result.labels).toHaveLength(1);
      expect(result.labels[0].competencyCategory).toBe(
        "containers-orchestration"
      );
      expect(result.labels[0].competencyRow).toBe(
        "devops-platform-engineering"
      );
    });

    test("should classify Jira content correctly", () => {
      const event: ActivityEvent = {
        id: "test-5",
        type: "collaboration",
        content: "Created Jira ticket for the new feature",
        timestamp: new Date().toISOString(),
        source: "jira" as const,
        metadata: {},
      };

      const result = ruleEngine.processEvent(event);

      expect(result.labels).toHaveLength(1);
      expect(result.labels[0].competencyCategory).toBe("collaboration-tools");
      expect(result.labels[0].competencyRow).toBe("atlassian");
    });

    test("should classify Git content correctly", () => {
      const event: ActivityEvent = {
        id: "test-6",
        type: "version-control",
        content: "Pushed changes to Git repository",
        timestamp: new Date().toISOString(),
        source: "git" as const,
        metadata: {},
      };

      const result = ruleEngine.processEvent(event);

      expect(result.labels).toHaveLength(1);
      expect(result.labels[0].competencyCategory).toBe("collaboration-process");
      expect(result.labels[0].competencyRow).toBe("git-version-control");
    });
  });
});
