import axios from "axios";
import {
  ApiResponse,
  BitbucketConfig,
  ConfluenceConfig,
  ConnectorConfig,
  ConnectorListResponse,
  JiraConfig,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const connectorApi = {
  // Get all connector configurations
  getAll: async (): Promise<ConnectorListResponse> => {
    const response = await api.get("/api/connector-configs");
    return response.data;
  },

  // Get connector by ID
  getById: async (id: number): Promise<ApiResponse<ConnectorConfig>> => {
    const response = await api.get(`/api/connector-configs/${id}`);
    return response.data;
  },

  // Get connectors by type
  getByType: async (
    type: "jira" | "confluence" | "bitbucket"
  ): Promise<ConnectorListResponse> => {
    const response = await api.get(`/api/connector-configs/type/${type}`);
    return response.data;
  },

  // Create new connector configuration
  create: async (config: {
    connectorType: "jira" | "confluence" | "bitbucket";
    name: string;
    config: JiraConfig | ConfluenceConfig | BitbucketConfig;
  }): Promise<ApiResponse<ConnectorConfig>> => {
    const response = await api.post("/api/connector-configs", config);
    return response.data;
  },

  // Update connector configuration
  update: async (
    id: number,
    updates: Partial<{
      name: string;
      config: JiraConfig | ConfluenceConfig | BitbucketConfig;
      is_active: boolean;
    }>
  ): Promise<ApiResponse<ConnectorConfig>> => {
    const response = await api.put(`/api/connector-configs/${id}`, updates);
    return response.data;
  },

  // Delete connector configuration
  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/api/connector-configs/${id}`);
    return response.data;
  },

  // Toggle connector status
  toggle: async (
    id: number,
    isActive: boolean
  ): Promise<ApiResponse<ConnectorConfig>> => {
    const response = await api.patch(`/api/connector-configs/${id}/toggle`, {
      is_active: isActive,
    });
    return response.data;
  },

  // Test connector configuration
  test: async (
    id: number
  ): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    const response = await api.post(`/api/connector-configs/${id}/test`);
    return response.data;
  },

  // Generic GET method for other endpoints
  get: async (url: string): Promise<any> => {
    const response = await api.get(url);
    return response.data;
  },

  // Generic POST method for other endpoints
  post: async (url: string, data?: any): Promise<any> => {
    const response = await api.post(url, data);
    return response.data;
  },
};

export const healthApi = {
  check: async (): Promise<{ status: string; timestamp: string }> => {
    const response = await api.get("/health");
    return response.data;
  },
};
