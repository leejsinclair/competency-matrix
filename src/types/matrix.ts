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
  'programming-languages': {
    displayName: 'Programming Languages',
    rows: [
      { id: 'software-engineering', displayName: 'Software Engineering' },
      { id: 'language-fundamentals', displayName: 'Language Fundamentals' },
      { id: 'advanced-concepts', displayName: 'Advanced Concepts' }
    ]
  },
  'databases': {
    displayName: 'Databases',
    rows: [
      { id: 'database-management', displayName: 'Database Management' },
      { id: 'query-optimization', displayName: 'Query Optimization' },
      { id: 'data-modeling', displayName: 'Data Modeling' }
    ]
  },
  'containers-orchestration': {
    displayName: 'Containers & Orchestration',
    rows: [
      { id: 'devops-platform-engineering', displayName: 'DevOps Platform Engineering' },
      { id: 'containerization', displayName: 'Containerization' },
      { id: 'kubernetes', displayName: 'Kubernetes' }
    ]
  },
  'testing': {
    displayName: 'Testing',
    rows: [
      { id: 'quality-assurance', displayName: 'Quality Assurance' },
      { id: 'test-automation', displayName: 'Test Automation' },
      { id: 'performance-testing', displayName: 'Performance Testing' }
    ]
  },
  'collaboration-process': {
    displayName: 'Collaboration & Process',
    rows: [
      { id: 'git-version-control', displayName: 'Git Version Control' },
      { id: 'code-review', displayName: 'Code Review' },
      { id: 'documentation', displayName: 'Documentation' }
    ]
  }
};

export const COMPETENCY_LEVELS = {
  1: { name: 'Beginner', color: '#ef4444', description: 'Basic understanding and limited application' },
  2: { name: 'Intermediate', color: '#f59e0b', description: 'Competent with moderate experience' },
  3: { name: 'Advanced', color: '#10b981', description: 'Skilled with extensive experience' },
  4: { name: 'Expert', color: '#8b5cf6', description: 'Mastery and can teach others' }
};

export function formatConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return '#10b981'; // High confidence - green
  if (confidence >= 0.6) return '#f59e0b'; // Medium confidence - amber
  if (confidence >= 0.4) return '#f97316'; // Low confidence - orange
  return '#ef4444'; // Very low confidence - red
}

export function getLevelColor(level: number): string {
  return COMPETENCY_LEVELS[level]?.color || '#6b7280';
}

export function getLevelName(level: number): string {
  return COMPETENCY_LEVELS[level]?.name || 'Unknown';
}
