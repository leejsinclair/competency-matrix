import { ReactNode } from "react";

export interface ConnectorConfig {
  id: number;
  connector_type: "jira" | "confluence" | "bitbucket";
  name: string;
  config: string; // JSON string
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface JiraConfig {
  url: string;
  username: string;
  apiToken: string;
  boards: string[];
}

export interface ConfluenceConfig {
  baseUrl: string;
  username: string;
  apiToken: string;
  spaces: string[];
}

export interface BitbucketConfig {
  baseUrl: string;
  username: string;
  appPassword: string;
  repositories: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ConnectorListResponse {
  success: boolean;
  data: ConnectorConfig[];
  count: number;
}

export interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
}
