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

// CircleCI Engineering Competency Matrix structure - Updated to match detailed taxonomy
export const COMPETENCY_CATEGORIES = {
  "Software Engineering": {
    displayName: "Software Engineering",
    rows: [
      {
        id: "Software Engineering > Programming Languages",
        displayName: "Programming Languages",
        description:
          "Proficiency in various programming languages and software development fundamentals",
      },
      {
        id: "Software Engineering > Architecture & Design",
        displayName: "Architecture & Design",
        description:
          "Understanding of software architecture patterns, design principles, and system design",
      },
      {
        id: "Software Engineering > Testing & Quality",
        displayName: "Testing & Quality",
        description:
          "Knowledge of testing methodologies, quality assurance, and code quality practices",
      },
    ],
  },
  "Web Development": {
    displayName: "Web Development",
    rows: [
      {
        id: "Web Development > Frontend",
        displayName: "Frontend",
        description:
          "Frontend web development skills including HTML, CSS, JavaScript, and modern frameworks",
      },
      {
        id: "Web Development > Backend",
        displayName: "Backend",
        description:
          "Backend web development skills including APIs, server-side programming, and databases",
      },
    ],
  },
  "DevOps & Platform Engineering": {
    displayName: "DevOps & Platform Engineering",
    rows: [
      {
        id: "DevOps & Platform Engineering > CI/CD",
        displayName: "CI/CD",
        description:
          "Continuous integration and continuous deployment practices and tools",
      },
      {
        id: "DevOps & Platform Engineering > Observability",
        displayName: "Observability",
        description:
          "Monitoring, logging, tracing, and observability practices",
      },
    ],
  },
  "Infrastructure & Cloud": {
    displayName: "Infrastructure & Cloud",
    rows: [
      {
        id: "Infrastructure & Cloud > Compute",
        displayName: "Compute",
        description:
          "Cloud computing services, virtualization, and serverless computing",
      },
      {
        id: "Infrastructure & Cloud > Networking",
        displayName: "Networking",
        description:
          "Network infrastructure, VPC, load balancing, and network security",
      },
      {
        id: "Infrastructure & Cloud > Storage & Databases",
        displayName: "Storage & Databases",
        description:
          "Storage solutions, database management, and data persistence",
      },
      {
        id: "Infrastructure & Cloud > Messaging & Eventing",
        displayName: "Messaging & Eventing",
        description:
          "Message queuing, event streaming, and asynchronous communication",
      },
    ],
  },
  "Containers & Orchestration": {
    displayName: "Containers & Orchestration",
    rows: [
      {
        id: "Containers & Orchestration > Docker",
        displayName: "Docker",
        description:
          "Containerization using Docker, Dockerfiles, and container management",
      },
      {
        id: "Containers & Orchestration > Kubernetes",
        displayName: "Kubernetes",
        description:
          "Container orchestration using Kubernetes and related ecosystem tools",
      },
    ],
  },
  "AWS Services": {
    displayName: "AWS Services",
    rows: [
      {
        id: "AWS Services > Compute",
        displayName: "Compute",
        description:
          "AWS compute services including EC2, ECS, EKS, Lambda, and Fargate",
      },
      {
        id: "AWS Services > Storage & Databases",
        displayName: "Storage & Databases",
        description:
          "AWS storage and database services including S3, RDS, Aurora, and DynamoDB",
      },
      {
        id: "AWS Services > Networking & Delivery",
        displayName: "Networking & Delivery",
        description:
          "AWS networking services including VPC, Route 53, and load balancing",
      },
      {
        id: "AWS Services > Security & Secrets",
        displayName: "Security & Secrets",
        description:
          "AWS security services including IAM, KMS, and Secrets Manager",
      },
      {
        id: "AWS Services > Messaging & Integration",
        displayName: "Messaging & Integration",
        description:
          "AWS messaging services including SQS, SNS, and EventBridge",
      },
      {
        id: "AWS Services > DevOps & Management",
        displayName: "DevOps & Management",
        description:
          "AWS DevOps and management services including CloudFormation, CDK, and CloudWatch",
      },
    ],
  },
  Atlassian: {
    displayName: "Atlassian",
    rows: [
      {
        id: "Atlassian > Jira",
        displayName: "Jira",
        description:
          "Jira project management, issue tracking, and workflow management",
      },
      {
        id: "Atlassian > Bitbucket",
        displayName: "Bitbucket",
        description:
          "Bitbucket Git repositories, pull requests, and code collaboration",
      },
      {
        id: "Atlassian > Confluence",
        displayName: "Confluence",
        description:
          "Confluence documentation, knowledge management, and collaboration",
      },
    ],
  },
  "Collaboration & Process": {
    displayName: "Collaboration & Process",
    rows: [
      {
        id: "Collaboration & Process > Git & Version Control",
        displayName: "Git & Version Control",
        description:
          "Git version control, branching strategies, and code collaboration workflows",
      },
      {
        id: "Collaboration & Process > Agile & Delivery",
        displayName: "Agile & Delivery",
        description:
          "Agile methodologies, Scrum, Kanban, and software delivery practices",
      },
    ],
  },
};

export function getLevelName(level: number): string {
  switch (level) {
    case 1:
      return "L1 - Fundamental";
    case 2:
      return "L2 - Working";
    case 3:
      return "L3 - Strong";
    case 4:
      return "L4 - Expert";
    default:
      return `L${level}`;
  }
}

export function formatConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return "text-green-600";
  if (confidence >= 0.6) return "text-yellow-600";
  if (confidence >= 0.4) return "text-orange-600";
  return "text-red-600";
}

export function formatConfidenceColorBg(confidence: number): string {
  if (confidence >= 0.8) return "bg-green-100";
  if (confidence >= 0.6) return "bg-yellow-100";
  if (confidence >= 0.4) return "bg-orange-100";
  return "bg-red-100";
}

// Competency levels for matrix display
export const COMPETENCY_LEVELS = {
  1: {
    name: "L1 - Fundamental",
    description: "Basic awareness and capability",
    color: "bg-red-100",
  },
  2: {
    name: "L2 - Working",
    description: "Working capability with supervision",
    color: "bg-orange-100",
  },
  3: {
    name: "L3 - Strong",
    description: "Strong capability without supervision",
    color: "bg-yellow-100",
  },
  4: {
    name: "L4 - Expert",
    description: "Expert capability and can teach others",
    color: "bg-green-100",
  },
};

export function getLevelColor(level: number): string {
  switch (level) {
    case 1:
      return "bg-red-100";
    case 2:
      return "bg-orange-100";
    case 3:
      return "bg-yellow-100";
    case 4:
      return "bg-green-100";
    default:
      return "bg-gray-100";
  }
}
