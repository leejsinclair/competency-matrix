export interface ProcessingResult {
  events: ActivityEvent[];
  labels: Label[];
  features: FeatureVector[];
  errors: ProcessingError[];
}

export interface Label {
  id: string;
  eventId: string;
  competencyCategory: string;
  competencyRow: string;
  level: CompetencyLevel;
  confidence: number;
  source: 'rule' | 'ml' | 'manual';
  evidence: string;
  createdAt: Date;
}

export interface FeatureVector {
  id: string;
  eventId: string;
  features: Record<string, number>;
  vector: number[];
  algorithm: string;
  version: string;
  createdAt: Date;
}

export interface ProcessingError {
  id: string;
  eventId: string;
  error: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: Date;
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  category: string;
  conditions: RuleCondition[];
  action: RuleAction;
  enabled: boolean;
  priority: number;
}

export interface RuleCondition {
  field: string;
  operator: 'equals' | 'contains' | 'regex' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not_in';
  value: any;
  caseSensitive?: boolean;
}

export interface RuleAction {
  type: 'label' | 'feature' | 'transform';
  params: Record<string, any>;
}

export interface MLModel {
  id: string;
  name: string;
  version: string;
  type: 'classification' | 'regression' | 'clustering';
  categories: string[];
  features: string[];
  accuracy?: number;
  enabled: boolean;
}

export interface CompetencyLevel {
  level: number;
  name: string;
  description: string;
  criteria: string[];
}

export interface SyntheticTestData {
  id: string;
  competencyCategory: string;
  competencyRow: string;
  level: CompetencyLevel;
  content: string;
  source: 'ai_generated' | 'manual' | 'synthetic';
  expectedLabels: string[];
  metadata: Record<string, any>;
}

import { ActivityEvent } from '../types/activity';
