import axios, { AxiosInstance } from "axios";
import { JiraConfig } from "../config/connector-config";
import { ActivityEvent } from "../types/activity";

export interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description: string;
    status: {
      name: string;
    };
    priority: {
      name: string;
    };
    assignee?: {
      displayName: string;
      emailAddress: string;
    };
    reporter: {
      displayName: string;
      emailAddress: string;
    };
    created: string;
    updated: string;
    project: {
      key: string;
      name: string;
    };
    issuetype: {
      name: string;
    };
  };
}

export interface JiraBoard {
  id: number;
  name: string;
  type: string;
}

export class JiraConnectorEnhanced {
  private client: AxiosInstance;
  private config: JiraConfig;

  constructor(config: JiraConfig) {
    this.config = config;

    this.client = axios.create({
      baseURL: config.url,
      auth: {
        username: config.username,
        password: config.apiToken,
      },
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get("/rest/api/3/myself");
      return response.status === 200;
    } catch (error) {
      console.error("Jira connection test failed:", (error as Error).message);
      return false;
    }
  }

  async getBoards(): Promise<JiraBoard[]> {
    try {
      const response = await this.client.get("/rest/agile/1.0/board");
      return response.data.values || [];
    } catch (error) {
      console.error("Failed to fetch Jira boards:", (error as Error).message);
      throw error;
    }
  }

  async getIssuesFromBoard(
    boardId: string,
    maxResults: number = 100
  ): Promise<JiraIssue[]> {
    try {
      const response = await this.client.get(
        `/rest/agile/1.0/board/${boardId}/issue`,
        {
          params: {
            maxResults,
            fields:
              "summary,description,status,priority,assignee,reporter,created,updated,project,issuetype",
          },
        }
      );
      return response.data.issues || [];
    } catch (error) {
      console.error(
        `Failed to fetch issues from board ${boardId}:`,
        (error as Error).message
      );
      throw error;
    }
  }

  async getIssuesFromProjects(
    projectKeys: string[],
    maxResults: number = 100
  ): Promise<JiraIssue[]> {
    try {
      const jql = `project in (${projectKeys.join(",")}) ORDER BY created DESC`;
      const response = await this.client.get("/rest/api/3/search", {
        params: {
          jql,
          maxResults,
          fields:
            "summary,description,status,priority,assignee,reporter,created,updated,project,issuetype",
        },
      });
      return response.data.issues || [];
    } catch (error) {
      console.error(
        "Failed to fetch issues from projects:",
        (error as Error).message
      );
      throw error;
    }
  }

  async getActivityEvents(): Promise<ActivityEvent[]> {
    const events: ActivityEvent[] = [];

    try {
      // Get issues from configured boards
      for (const boardId of this.config.boards) {
        const issues = await this.getIssuesFromBoard(boardId);

        for (const issue of issues) {
          const event = this.convertIssueToActivityEvent(issue);
          if (event) {
            events.push(event);
          }
        }
      }

      console.log(`Retrieved ${events.length} events from Jira`);
      return events;
    } catch (error) {
      console.error(
        "Failed to retrieve Jira activity events:",
        (error as Error).message
      );
      throw error;
    }
  }

  public convertIssueToActivityEvent(issue: JiraIssue): ActivityEvent | null {
    try {
      const actor =
        issue.fields.assignee?.emailAddress ||
        issue.fields.reporter.emailAddress;

      if (!actor) {
        console.warn(`Issue ${issue.key} has no valid actor`);
        return null;
      }

      return {
        id: `jira-${issue.id}`,
        source: "jira",
        timestamp: issue.fields.created,
        actor,
        type: "issue_created",
        metadata: {
          issueKey: issue.key,
          status: issue.fields.status.name,
          priority: issue.fields.priority.name,
          project: issue.fields.project.key,
          projectName: issue.fields.project.name,
          issueType: issue.fields.issuetype.name,
          assignee: issue.fields.assignee?.displayName,
          reporter: issue.fields.reporter.displayName,
        },
        content: `${issue.fields.summary}\n\n${issue.fields.description || ""}`,
      };
    } catch (error) {
      console.error(
        `Failed to convert issue ${issue.key} to activity event:`,
        error
      );
      return null;
    }
  }

  async getIssueComments(issueKey: string): Promise<any[]> {
    try {
      const response = await this.client.get(
        `/rest/api/3/issue/${issueKey}/comment`
      );
      return response.data.comments || [];
    } catch (error) {
      console.error(
        `Failed to fetch comments for issue ${issueKey}:`,
        (error as Error).message
      );
      return [];
    }
  }

  async getIssueWorklogs(issueKey: string): Promise<any[]> {
    try {
      const response = await this.client.get(
        `/rest/api/3/issue/${issueKey}/worklog`
      );
      return response.data.worklogs || [];
    } catch (error) {
      console.error(
        `Failed to fetch worklogs for issue ${issueKey}:`,
        (error as Error).message
      );
      return [];
    }
  }

  async getProjectComponents(projectKey: string): Promise<any[]> {
    try {
      const response = await this.client.get(
        `/rest/api/3/project/${projectKey}/components`
      );
      return response.data || [];
    } catch (error) {
      console.error(
        `Failed to fetch components for project ${projectKey}:`,
        error
      );
      return [];
    }
  }

  async searchUsers(query: string, maxResults: number = 50): Promise<any[]> {
    try {
      const response = await this.client.get("/rest/api/3/user/search", {
        params: {
          query,
          maxResults,
        },
      });
      return response.data || [];
    } catch (error) {
      console.error(`Failed to search users:`, (error as Error).message);
      return [];
    }
  }
}

export default JiraConnectorEnhanced;
