export interface CompetencyTestContent {
  id: string;
  category: string;
  subcategory?: string;
  competencyLevel: number; // 1-5 scale
  content: string;
  source: "jira" | "git" | "confluence" | "bitbucket" | "slack";
  metadata: Record<string, any>;
  expectedLabels: string[];
  difficulty: "easy" | "medium" | "hard";
  context: string;
}

export const competencyTestContent: CompetencyTestContent[] = [
  // Writing Code
  {
    id: "writing-code-1",
    category: "Writing code",
    subcategory: "implementation",
    competencyLevel: 2,
    content:
      "Just finished implementing the user authentication module. Used JWT tokens for session management and added proper validation for email formats and password strength. Had to refactor the existing login component to work with the new auth service, but everything seems to be working now. Need to add unit tests tomorrow.",
    source: "git",
    metadata: {
      repository: "frontend",
      branch: "feature/auth",
      filesChanged: ["src/auth.js", "src/middleware.js"],
      additions: 120,
      deletions: 15,
    },
    expectedLabels: ["code-quality", "implementation"],
    difficulty: "easy",
    context: "Basic feature implementation",
  },
  {
    id: "writing-code-2",
    category: "Writing code",
    subcategory: "refactoring",
    competencyLevel: 4,
    content:
      "Spent the last two weeks refactoring our legacy payment processing system. The original code was a monolithic nightmare with tight coupling everywhere. I broke it down into microservices, implemented proper error boundaries, and added circuit breakers. The team was skeptical at first, but after seeing the improved testability and how much easier it is to deploy changes independently, they're on board. Still need to migrate the remaining legacy endpoints next sprint.",
    source: "git",
    metadata: {
      repository: "backend",
      branch: "refactor/payment",
      filesChanged: ["src/payment/", "src/services/"],
      additions: 450,
      deletions: 280,
    },
    expectedLabels: ["architecture", "code-quality", "refactoring"],
    difficulty: "hard",
    context: "Complex refactoring with architectural implications",
  },

  // Testing
  {
    id: "testing-1",
    category: "Testing",
    subcategory: "unit-testing",
    competencyLevel: 2,
    content:
      "Finally got around to adding unit tests for the user validation functions. Been putting this off for a while, but after that bug in production last week, I figured I should be more diligent. Used Jest and made sure to cover all the edge cases for email formats and password requirements. Found a couple of issues I didn't even know about!",
    source: "git",
    metadata: {
      repository: "frontend",
      testCoverage: 85,
      testType: "unit",
    },
    expectedLabels: ["testing", "code-quality"],
    difficulty: "easy",
    context: "Basic unit test implementation",
  },
  {
    id: "testing-2",
    category: "Testing",
    subcategory: "integration-testing",
    competencyLevel: 4,
    content:
      "This was a beast - spent the whole week setting up integration tests for our microservices communication. Used TestContainers to spin up real databases and message queues. Had to figure out how to properly clean up everything between tests so they don't interfere with each other. The team was impressed when I showed them how we can now test API contracts and database transactions end-to-end. Definitely worth the effort.",
    source: "confluence",
    metadata: {
      pageType: "documentation",
      testFramework: "TestContainers + Jest",
      servicesTested: 5,
    },
    expectedLabels: ["testing", "architecture", "reliability"],
    difficulty: "hard",
    context: "Complex integration testing strategy",
  },

  // Debugging
  {
    id: "debugging-1",
    category: "Debugging",
    subcategory: "troubleshooting",
    competencyLevel: 3,
    content:
      "Got paged at 2 AM because the frontend was crashing in production. Spent hours analyzing heap dumps and finally found the issue - circular references in our React components were causing memory leaks. Fixed it by adding proper cleanup in useEffect hooks. The team was relieved when I deployed the fix and the crashes stopped. Need to add better memory monitoring to catch this earlier next time.",
    source: "jira",
    metadata: {
      issueType: "bug",
      priority: "high",
      environment: "production",
      tools: ["Chrome DevTools", "heapdump analysis"],
    },
    expectedLabels: ["debugging", "performance", "reliability"],
    difficulty: "medium",
    context: "Production debugging with performance analysis",
  },
  {
    id: "debugging-2",
    category: "Debugging",
    subcategory: "root-cause-analysis",
    competencyLevel: 5,
    content:
      "This was the worst week ever - intermittent database connection failures were bringing down multiple services. The errors were so sporadic that it was impossible to reproduce locally. Finally traced it back to a race condition in the connection pool configuration. Implemented exponential backoff retry logic and set up better monitoring. Wrote up a detailed incident report so we don't get caught by this again. The whole team learned a lot from this one.",
    source: "jira",
    metadata: {
      issueType: "incident",
      severity: "critical",
      impact: "customer-facing",
      timeline: "3 days",
    },
    expectedLabels: ["debugging", "reliability", "architecture", "leadership"],
    difficulty: "hard",
    context: "Complex incident investigation with system-wide impact",
  },

  // Observability
  {
    id: "observability-1",
    category: "Observability",
    subcategory: "monitoring",
    competencyLevel: 3,
    content:
      "Implemented Prometheus metrics for API endpoints, tracking request rates, error rates, and response times with proper labels for service identification",
    source: "git",
    metadata: {
      repository: "backend",
      monitoringTool: "Prometheus",
      metricsCount: 15,
    },
    expectedLabels: ["observability", "monitoring", "reliability"],
    difficulty: "medium",
    context: "Basic monitoring implementation",
  },
  {
    id: "observability-2",
    category: "Observability",
    subcategory: "distributed-tracing",
    competencyLevel: 4,
    content:
      "Designed and implemented distributed tracing using Jaeger across microservices, enabling end-to-end request tracking and performance bottleneck identification with proper context propagation",
    source: "confluence",
    metadata: {
      architecture: "microservices",
      tracingTool: "Jaeger",
      servicesInstrumented: 8,
    },
    expectedLabels: ["observability", "architecture", "performance"],
    difficulty: "hard",
    context: "Advanced distributed tracing implementation",
  },

  // Understanding Code
  {
    id: "understanding-code-1",
    category: "Understanding Code",
    subcategory: "code-comprehension",
    competencyLevel: 2,
    content:
      "Reviewed and understood existing authentication flow to add new social login providers, identifying key integration points and potential security considerations",
    source: "jira",
    metadata: {
      taskType: "feature",
      complexity: "medium",
      filesAnalyzed: 8,
    },
    expectedLabels: ["code-review", "security"],
    difficulty: "easy",
    context: "Code comprehension for feature implementation",
  },
  {
    id: "understanding-code-2",
    category: "Understanding Code",
    subcategory: "legacy-system-analysis",
    competencyLevel: 4,
    content:
      "Analyzed complex legacy billing system with multiple interconnected modules to identify data flow and business logic before migration. Created comprehensive documentation of current state and dependencies",
    source: "confluence",
    metadata: {
      analysisType: "legacy-migration",
      modulesDocumented: 12,
      complexity: "high",
    },
    expectedLabels: ["architecture", "documentation", "business-acumen"],
    difficulty: "hard",
    context: "Complex legacy system analysis",
  },

  // Software Architecture
  {
    id: "architecture-1",
    category: "Software Architecture",
    subcategory: "system-design",
    competencyLevel: 3,
    content:
      "Designed RESTful API for new notification service with proper separation of concerns, implementing repository pattern and service layer for maintainability",
    source: "confluence",
    metadata: {
      designType: "API-design",
      patterns: ["repository", "service-layer"],
      components: 4,
    },
    expectedLabels: ["architecture", "system-design"],
    difficulty: "medium",
    context: "API service design",
  },
  {
    id: "architecture-2",
    category: "Software Architecture",
    subcategory: "enterprise-architecture",
    competencyLevel: 5,
    content:
      "Led architectural decision-making for company-wide migration to event-driven architecture, defining standards for message formats, event sourcing patterns, and eventual consistency guarantees across 15+ services",
    source: "confluence",
    metadata: {
      scope: "enterprise",
      architectureType: "event-driven",
      servicesAffected: 15,
      decisionFramework: "ADR",
    },
    expectedLabels: ["architecture", "strategic-work", "leadership"],
    difficulty: "hard",
    context: "Enterprise-level architecture decisions",
  },

  // Security
  {
    id: "security-1",
    category: "Security",
    subcategory: "application-security",
    competencyLevel: 3,
    content:
      "Implemented OAuth 2.0 authentication with proper token validation, refresh token rotation, and secure storage of credentials using environment variables",
    source: "git",
    metadata: {
      securityStandard: "OAuth 2.0",
      vulnerabilitiesFixed: 3,
      securityTools: ["OWASP guidelines"],
    },
    expectedLabels: ["security", "implementation"],
    difficulty: "medium",
    context: "Authentication security implementation",
  },
  {
    id: "security-2",
    category: "Security",
    subcategory: "security-architecture",
    competencyLevel: 4,
    content:
      "Designed zero-trust security model for microservices including mTLS, service mesh integration, and secret management with automatic rotation and audit logging",
    source: "confluence",
    metadata: {
      securityModel: "zero-trust",
      technologies: ["Istio", "Vault", "mTLS"],
      scope: "infrastructure",
    },
    expectedLabels: ["security", "architecture", "reliability"],
    difficulty: "hard",
    context: "Advanced security architecture design",
  },

  // Work Breakdown
  {
    id: "work-breakdown-1",
    category: "Work breakdown",
    subcategory: "task-estimation",
    competencyLevel: 2,
    content:
      "Broke down user story for dashboard feature into technical tasks, estimated effort using story points, and identified dependencies on API team",
    source: "jira",
    metadata: {
      storyPoints: 8,
      tasksCreated: 5,
      dependencies: 2,
    },
    expectedLabels: ["planning", "estimation"],
    difficulty: "easy",
    context: "Basic task breakdown and estimation",
  },
  {
    id: "work-breakdown-2",
    category: "Work breakdown",
    subcategory: "project-planning",
    competencyLevel: 4,
    content:
      "Led work breakdown session for complex platform migration, creating detailed project plan with 50+ tasks, identifying critical path, resource allocation, and risk mitigation strategies",
    source: "confluence",
    metadata: {
      projectScope: "platform-migration",
      tasksCount: 52,
      teamSize: 8,
      timeline: "6 months",
    },
    expectedLabels: ["planning", "project-management", "leadership"],
    difficulty: "hard",
    context: "Complex project planning and coordination",
  },

  // Prioritisation, dependencies
  {
    id: "prioritisation-1",
    category: "Prioritisation, dependencies",
    subcategory: "feature-prioritisation",
    competencyLevel: 3,
    content:
      "Evaluated and prioritised backlog items based on business value, technical effort, and dependencies, creating roadmap for next two sprints",
    source: "jira",
    metadata: {
      prioritisationFramework: "RICE",
      itemsEvaluated: 15,
      businessImpact: "high",
    },
    expectedLabels: ["prioritisation", "business-acumen"],
    difficulty: "medium",
    context: "Backlog prioritisation",
  },
  {
    id: "prioritisation-2",
    category: "Prioritisation, dependencies",
    subcategory: "dependency-management",
    competencyLevel: 4,
    content:
      "Managed cross-team dependencies for product launch, coordinating between frontend, backend, and DevOps teams to resolve blocking issues and adjust timelines",
    source: "jira",
    metadata: {
      dependencyType: "cross-team",
      teamsInvolved: 3,
      criticalPath: "launch",
    },
    expectedLabels: [
      "coordination",
      "dependency-management",
      "delivery-accountability",
    ],
    difficulty: "hard",
    context: "Complex dependency coordination",
  },

  // Dealing with ambiguity
  {
    id: "ambiguity-1",
    category: "Dealing with ambiguity",
    subcategory: "requirements-clarification",
    competencyLevel: 3,
    content:
      "Facilitated requirements gathering sessions with stakeholders to clarify ambiguous business requirements, creating user stories with clear acceptance criteria",
    source: "confluence",
    metadata: {
      workshopsFacilitated: 3,
      stakeholdersInvolved: 8,
      requirementsClarified: 12,
    },
    expectedLabels: ["communication", "requirements-analysis"],
    difficulty: "medium",
    context: "Requirements clarification and facilitation",
  },
  {
    id: "ambiguity-2",
    category: "Dealing with ambiguity",
    subcategory: "adaptive-planning",
    competencyLevel: 4,
    content:
      "Navigated uncertain project requirements by implementing iterative approach with regular stakeholder feedback, adjusting architecture decisions as requirements evolved",
    source: "jira",
    metadata: {
      approach: "iterative",
      uncertaintyLevel: "high",
      adaptations: 6,
    },
    expectedLabels: [
      "adaptability",
      "stakeholder-management",
      "process-thinking",
    ],
    difficulty: "hard",
    context: "Managing uncertainty in complex project",
  },

  // Reliability, delivery accountability
  {
    id: "reliability-1",
    category: "Reliability, delivery accountability",
    subcategory: "delivery-commitment",
    competencyLevel: 3,
    content:
      "Took ownership of critical bug fix, delivering solution ahead of deadline with comprehensive testing and documentation to prevent regression",
    source: "jira",
    metadata: {
      commitmentType: "bug-fix",
      deadline: "met-early",
      qualityMeasures: ["testing", "documentation"],
    },
    expectedLabels: ["reliability", "delivery-accountability", "code-quality"],
    difficulty: "medium",
    context: "Delivery commitment with quality focus",
  },
  {
    id: "reliability-2",
    category: "Reliability, delivery accountability",
    subcategory: "production-ownership",
    competencyLevel: 4,
    content:
      "Established on-call rotation and incident response procedures for production services, implementing proper monitoring, alerting, and post-incident review processes",
    source: "confluence",
    metadata: {
      ownershipScope: "production",
      proceduresCreated: 5,
      teamSize: 4,
    },
    expectedLabels: ["reliability", "operations", "leadership"],
    difficulty: "hard",
    context: "Production ownership and process establishment",
  },

  // Economic thinking
  {
    id: "economic-thinking-1",
    category: "Economic thinking",
    subcategory: "cost-optimisation",
    competencyLevel: 3,
    content:
      "Analyzed cloud infrastructure costs and identified optimisation opportunities, implementing auto-scaling policies and resource scheduling to reduce monthly spend by 25%",
    source: "jira",
    metadata: {
      costReduction: "25%",
      analysisTools: ["AWS Cost Explorer"],
      optimisations: ["auto-scaling", "scheduling"],
    },
    expectedLabels: ["economic-thinking", "optimisation"],
    difficulty: "medium",
    context: "Cost optimisation analysis",
  },
  {
    id: "economic-thinking-2",
    category: "Economic thinking",
    subcategory: "roi-analysis",
    competencyLevel: 4,
    content:
      "Conducted ROI analysis for proposed architecture migration, quantifying development costs, operational savings, and business benefits to secure executive approval",
    source: "confluence",
    metadata: {
      analysisType: "ROI",
      investmentAmount: "$250k",
      projectedSavings: "$120k/year",
      timeframe: "18 months",
    },
    expectedLabels: ["economic-thinking", "business-acumen", "strategic-work"],
    difficulty: "hard",
    context: "Business case development and financial analysis",
  },

  // Delivering Feedback
  {
    id: "feedback-delivery-1",
    category: "Delivering Feedback",
    subcategory: "code-review",
    competencyLevel: 3,
    content:
      "Provided constructive code review feedback focusing on security vulnerabilities and performance improvements, suggesting specific refactoring approaches with examples",
    source: "bitbucket",
    metadata: {
      reviewType: "pull-request",
      feedbackPoints: 6,
      tone: "constructive",
    },
    expectedLabels: ["code-review", "communication", "mentoring"],
    difficulty: "medium",
    context: "Constructive code review feedback",
  },
  {
    id: "feedback-delivery-2",
    category: "Delivering Feedback",
    subcategory: "performance-feedback",
    competencyLevel: 4,
    content:
      "Led performance review process for team member, providing specific examples of achievements and areas for improvement with actionable development plan",
    source: "confluence",
    metadata: {
      feedbackType: "performance-review",
      preparationTime: "4 hours",
      developmentPlan: true,
    },
    expectedLabels: ["mentoring", "leadership", "communication"],
    difficulty: "hard",
    context: "Formal performance feedback and development",
  },

  // Seeking and receiving feedback
  {
    id: "feedback-seeking-1",
    category: "Seeking and receiving feedback",
    subcategory: "code-review-request",
    competencyLevel: 2,
    content:
      "Requested code review on complex feature implementation, asking specific questions about architecture decisions and potential improvements",
    source: "bitbucket",
    metadata: {
      reviewType: "pull-request",
      questionsAsked: 4,
      opennessLevel: "high",
    },
    expectedLabels: ["learning", "collaboration"],
    difficulty: "easy",
    context: "Proactive feedback seeking",
  },
  {
    id: "feedback-seeking-2",
    category: "Seeking and receiving feedback",
    subcategory: "360-degree-feedback",
    competencyLevel: 3,
    content:
      "Solicited comprehensive feedback from peers and manager on technical leadership and communication style, creating personal development plan based on insights",
    source: "confluence",
    metadata: {
      feedbackType: "360-degree",
      feedbackProviders: 8,
      developmentAreas: 3,
    },
    expectedLabels: [
      "self-development",
      "leadership",
      "emotional-intelligence",
    ],
    difficulty: "medium",
    context: "Comprehensive feedback seeking and action",
  },

  // Effective communication
  {
    id: "communication-1",
    category: "Effective communication",
    subcategory: "technical-documentation",
    competencyLevel: 3,
    content:
      "Created comprehensive API documentation with clear examples, error handling guides, and integration patterns for external partners",
    source: "confluence",
    metadata: {
      documentationType: "API-docs",
      audience: "external-partners",
      examples: 15,
    },
    expectedLabels: ["documentation", "communication"],
    difficulty: "medium",
    context: "Technical documentation for external audience",
  },
  {
    id: "communication-2",
    category: "Effective communication",
    subcategory: "stakeholder-communication",
    competencyLevel: 4,
    content:
      "Presented complex technical migration plan to non-technical executives, translating technical concepts into business impact and risk assessment",
    source: "confluence",
    metadata: {
      presentationType: "executive-summary",
      audience: "C-level",
      complexity: "high",
    },
    expectedLabels: [
      "communication",
      "business-acumen",
      "stakeholder-management",
    ],
    difficulty: "hard",
    context: "Executive communication of technical concepts",
  },

  // Knowledge Sharing
  {
    id: "knowledge-sharing-1",
    category: "Knowledge Sharing",
    subcategory: "team-learning",
    competencyLevel: 3,
    content:
      "Conducted lunch-and-learn session on React performance optimisation, sharing practical techniques and real-world examples with team",
    source: "confluence",
    metadata: {
      sharingFormat: "lunch-and-learn",
      topic: "React-performance",
      attendees: 12,
    },
    expectedLabels: ["knowledge-sharing", "mentoring"],
    difficulty: "medium",
    context: "Informal knowledge sharing session",
  },
  {
    id: "knowledge-sharing-2",
    category: "Knowledge Sharing",
    subcategory: "documentation",
    competencyLevel: 4,
    content:
      "Created comprehensive onboarding documentation for microservices architecture, including setup guides, common patterns, and troubleshooting procedures",
    source: "confluence",
    metadata: {
      documentationType: "onboarding",
      scope: "microservices",
      pagesCreated: 8,
    },
    expectedLabels: ["documentation", "knowledge-sharing", "architecture"],
    difficulty: "hard",
    context: "Comprehensive knowledge documentation",
  },

  // Teamwork
  {
    id: "teamwork-1",
    category: "Teamwork",
    subcategory: "collaboration",
    competencyLevel: 3,
    content:
      "Had a great collaboration session with the frontend team today. We were trying to figure out the API contract for the new notification service, and after a few rounds of back-and-forth, we finally got something that works for both sides. It's amazing how much time you save when you actually talk to each other instead of just making assumptions.",
    source: "jira",
    metadata: {
      collaborationType: "cross-functional",
      teamsInvolved: 2,
      iterations: 4,
    },
    expectedLabels: ["collaboration", "communication"],
    difficulty: "medium",
    context: "Cross-functional team collaboration",
  },
  {
    id: "teamwork-2",
    category: "Teamwork",
    subcategory: "team-support",
    competencyLevel: 4,
    content:
      'Sarah was really struggling with that complex authentication task, so I spent a couple of days pair programming with her. We worked through the OAuth implementation together, and I think she learned a lot. It\'s always rewarding to see someone have that "aha!" moment when something finally clicks. She got it working by the end of the day!',
    source: "slack",
    metadata: {
      supportType: "pair-programming",
      duration: "2 days",
      outcome: "successful",
    },
    expectedLabels: ["teamwork", "mentoring", "collaboration"],
    difficulty: "medium",
    context: "Peer support and knowledge transfer",
  },

  // Mentoring
  {
    id: "mentoring-1",
    category: "Mentoring",
    subcategory: "technical-mentoring",
    competencyLevel: 3,
    content:
      "Been working with James on his first feature implementation. He's new to the team but really eager to learn. Showed him how to structure the code, write proper tests, and navigate our code review process. He's picking things up quickly - already asking good questions about architecture and best practices. Reminds me of when I first started!",
    source: "slack",
    metadata: {
      mentoringType: "technical-guidance",
      duration: "2 weeks",
      outcomes: ["feature-completed", "skills-developed"],
    },
    expectedLabels: ["mentoring", "knowledge-transfer"],
    difficulty: "medium",
    context: "Technical mentoring of junior developer",
  },
  {
    id: "mentoring-2",
    category: "Mentoring",
    subcategory: "career-mentoring",
    competencyLevel: 4,
    content:
      "Had my quarterly career development chat with Maria today. She's ready to take on more leadership responsibilities, so we put together a 6-month plan with some stretch assignments. She's going to lead the next feature team and also take ownership of our technical documentation. Excited to see how she grows with this opportunity.",
    source: "confluence",
    metadata: {
      mentoringType: "career-development",
      planDuration: "6 months",
      focusAreas: ["technical-skills", "leadership"],
    },
    expectedLabels: ["mentoring", "leadership", "career-development"],
    difficulty: "hard",
    context: "Career development mentoring",
  },

  // Business acumen
  {
    id: "business-acumen-1",
    category: "Business acumen",
    subcategory: "market-understanding",
    competencyLevel: 3,
    content:
      "Analyzed competitor features and market trends to inform product roadmap, identifying opportunities for differentiation",
    source: "confluence",
    metadata: {
      analysisType: "competitive-analysis",
      competitorsAnalyzed: 5,
      opportunitiesIdentified: 3,
    },
    expectedLabels: ["business-acumen", "market-analysis"],
    difficulty: "medium",
    context: "Market and competitive analysis",
  },
  {
    id: "business-acumen-2",
    category: "Business acumen",
    subcategory: "financial-literacy",
    competencyLevel: 4,
    content:
      "Developed business case for new feature investment, projecting revenue impact and ROI to secure funding approval",
    source: "confluence",
    metadata: {
      businessCaseType: "investment-proposal",
      investmentAmount: "$150k",
      projectedROI: "200%",
    },
    expectedLabels: ["business-acumen", "financial-literacy", "strategic-work"],
    difficulty: "hard",
    context: "Financial business case development",
  },

  // Strategic work
  {
    id: "strategic-work-1",
    category: "Strategic work",
    subcategory: "technical-strategy",
    competencyLevel: 4,
    content:
      "Developed 3-year technical strategy for platform evolution, considering technology trends, scalability requirements, and business goals",
    source: "confluence",
    metadata: {
      strategyType: "technical-roadmap",
      timeframe: "3 years",
      scope: "platform-wide",
    },
    expectedLabels: ["strategic-work", "architecture", "planning"],
    difficulty: "hard",
    context: "Long-term technical strategy development",
  },
  {
    id: "strategic-work-2",
    category: "Strategic work",
    subcategory: "innovation",
    competencyLevel: 4,
    content:
      "Researched and proposed emerging technology adoption (GraphQL) to improve API performance and developer experience, creating proof of concept",
    source: "confluence",
    metadata: {
      innovationType: "technology-adoption",
      technology: "GraphQL",
      businessValue: "performance-improvement",
    },
    expectedLabels: ["strategic-work", "innovation", "research"],
    difficulty: "hard",
    context: "Technology innovation and adoption",
  },

  // Product Thinking
  {
    id: "product-thinking-1",
    category: "Product Thinking",
    subcategory: "user-empathy",
    competencyLevel: 3,
    content:
      "Conducted user research to understand pain points with current feature, translating insights into technical requirements for improvement",
    source: "confluence",
    metadata: {
      researchType: "user-interviews",
      usersInterviewed: 12,
      insightsIdentified: 8,
    },
    expectedLabels: ["product-thinking", "user-empathy", "research"],
    difficulty: "medium",
    context: "User research and empathy building",
  },
  {
    id: "product-thinking-2",
    category: "Product Thinking",
    subcategory: "product-strategy",
    competencyLevel: 4,
    content:
      "Contributed to product strategy by analysing user behaviour data and identifying opportunities for feature improvements and new product directions",
    source: "confluence",
    metadata: {
      analysisType: "product-analytics",
      dataSources: ["user-analytics", "feedback"],
      recommendations: 5,
    },
    expectedLabels: ["product-thinking", "data-analysis", "strategy"],
    difficulty: "hard",
    context: "Data-driven product strategy contribution",
  },
];

// Helper functions for test content management
export function getTestContentByCategory(
  category: string
): CompetencyTestContent[] {
  return competencyTestContent.filter((item) => item.category === category);
}

export function getTestContentByLevel(level: number): CompetencyTestContent[] {
  return competencyTestContent.filter((item) => item.competencyLevel === level);
}

export function getTestContentByDifficulty(
  difficulty: "easy" | "medium" | "hard"
): CompetencyTestContent[] {
  return competencyTestContent.filter((item) => item.difficulty === difficulty);
}

export function getRandomTestContent(
  count: number = 10
): CompetencyTestContent[] {
  const shuffled = [...competencyTestContent].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export const competencyCategories = [
  "Writing code",
  "Testing",
  "Debugging",
  "Observability",
  "Understanding Code",
  "Software Architecture",
  "Security",
  "Work breakdown",
  "Prioritisation, dependencies",
  "Dealing with ambiguity",
  "Reliability, delivery accountability",
  "Economic thinking",
  "Delivering Feedback",
  "Seeking and receiving feedback",
  "Effective communication",
  "Knowledge Sharing",
  "Teamwork",
  "Relationship building",
  "Handling disagreement",
  "Decision making",
  "Driving alignment",
  "Process thinking",
  "Facilitation",
  "Mentoring",
  "Business acumen",
  "Strategic work",
  "Product Thinking",
];
