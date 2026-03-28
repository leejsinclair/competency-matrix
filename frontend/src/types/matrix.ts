export interface MatrixCell {
  category: string;
  row: string;
  level: number;
  confidence: number;
  evidenceCount: number;
  lastUpdated: string;
}

export interface MatrixRow {
  row: string;
  displayName: string;
  levels: {
    [level: number]: MatrixCell | null;
  };
}

export interface MatrixCategory {
  category: string;
  displayName: string;
  rows: MatrixRow[];
  summary: {
    totalScores: number;
    averageConfidence: number;
    averageLevel: number;
  };
}

export interface DeveloperMatrix {
  actor: string;
  categories: MatrixCategory[];
  summary: {
    totalScores: number;
    averageConfidence: number;
    averageLevel: number;
    levelDistribution: Record<number, number>;
  };
  generatedAt: string;
}

export interface TeamMatrix {
  developers: DeveloperMatrix[];
  totalDevelopers: number;
  totalScores: number;
  categories: string[];
  generatedAt: string;
}

export interface MatrixOverview {
  summary: {
    totalScores: number;
    totalDevelopers: number;
    totalCategories: number;
    averageConfidence: number;
    averageLevel: number;
  };
  categoryBreakdown: Array<{
    competency_category: string;
    score_count: number;
    avg_confidence: number;
    avg_level: number;
    developer_count: number;
  }>;
  levelDistribution: Array<{
    level: number;
    count: number;
    developer_count: number;
  }>;
  generatedAt: string;
}

// CircleCI Engineering Competency Matrix structure
export const COMPETENCY_CATEGORIES = {
  "programming-languages": {
    displayName: "Programming Languages",
    rows: [
      {
        id: "software-engineering",
        displayName: "Software Engineering",
        description:
          "Designs, develops, and maintains software systems following best practices and architectural principles",
      },
      {
        id: "language-fundamentals",
        displayName: "Language Fundamentals",
        description:
          "Understanding of core programming concepts, data structures, algorithms, and language-specific features",
      },
      {
        id: "advanced-concepts",
        displayName: "Advanced Concepts",
        description:
          "Knowledge of design patterns, architectural patterns, performance optimization, and advanced language features",
      },
    ],
  },
  databases: {
    displayName: "Databases",
    rows: [
      {
        id: "database-management",
        displayName: "Database Management",
        description:
          "Ability to design, implement, and maintain database systems with proper indexing and optimization",
      },
      {
        id: "query-optimization",
        displayName: "Query Optimization",
        description:
          "Skills in analyzing and optimizing database queries for performance and efficiency",
      },
      {
        id: "data-modeling",
        displayName: "Data Modeling",
        description:
          "Designing effective database schemas, relationships, and data structures for scalability and performance",
      },
    ],
  },
  "containers-orchestration": {
    displayName: "Containers & Orchestration",
    rows: [
      {
        id: "devops-platform-engineering",
        displayName: "DevOps Platform Engineering",
        description:
          "Building and maintaining CI/CD pipelines, infrastructure as code, and deployment automation",
      },
      {
        id: "containerization",
        displayName: "Containerization",
        description:
          "Packaging applications in containers, managing container lifecycles, and ensuring portability",
      },
      {
        id: "kubernetes",
        displayName: "Kubernetes",
        description:
          "Managing containerized applications at scale, including orchestration, scaling, and self-healing",
      },
    ],
  },
  testing: {
    displayName: "Testing",
    rows: [
      {
        id: "quality-assurance",
        displayName: "Quality Assurance",
        description:
          "Ensuring software quality through comprehensive testing strategies and quality metrics",
      },
      {
        id: "test-automation",
        displayName: "Test Automation",
        description:
          "Creating and maintaining automated test suites, including unit, integration, and end-to-end tests",
      },
      {
        id: "performance-testing",
        displayName: "Performance Testing",
        description:
          "Analyzing and optimizing application performance, including load testing and bottleneck identification",
      },
    ],
  },
  "collaboration-process": {
    displayName: "Collaboration & Process",
    rows: [
      {
        id: "git-version-control",
        displayName: "Git Version Control",
        description:
          "Managing source code with Git, including branching strategies, merge conflicts, and repository management",
      },
      {
        id: "code-review",
        displayName: "Code Review",
        description:
          "Conducting thorough code reviews, providing constructive feedback, and maintaining code quality standards",
      },
      {
        id: "documentation",
        displayName: "Documentation",
        description:
          "Creating and maintaining comprehensive technical documentation for code, systems, and processes",
      },
    ],
  },
};

export const COMPETENCY_LEVELS: Record<
  number,
  { name: string; color: string; description: string }
> = {
  1: {
    name: "Beginner",
    color: "#ef4444",
    description: "Basic understanding and limited application",
  },
  2: {
    name: "Intermediate",
    color: "#f59e0b",
    description: "Competent with moderate experience",
  },
  3: {
    name: "Advanced",
    color: "#10b981",
    description: "Skilled with extensive experience",
  },
  4: {
    name: "Expert",
    color: "#8b5cf6",
    description: "Mastery and can teach others",
  },
};

export function formatConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return "#10b981"; // High confidence - green
  if (confidence >= 0.6) return "#f59e0b"; // Medium confidence - amber
  if (confidence >= 0.4) return "#f97316"; // Low confidence - orange
  return "#ef4444"; // Very low confidence - red
}

export function getLevelColor(level: number): string {
  return COMPETENCY_LEVELS[level]?.color || "#6b7280";
}

export function getLevelName(level: number): string {
  return COMPETENCY_LEVELS[level]?.name || "Unknown";
}
