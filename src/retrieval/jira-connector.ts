import axios, { AxiosInstance } from 'axios';
import { ActivityEvent, JiraActivityEvent, JiraEventMetadata, JIRA_EVENT_TYPES } from '../types/activity';
import { ArtifactStore } from '../types/artifact';

export interface JiraConfig {
  baseUrl: string;
  username: string;
  apiToken: string;
}

export interface JiraRetrievalOptions {
  since?: Date;
  projects?: string[];
  issueTypes?: string[];
  limit?: number;
}

interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description?: string;
    issuetype: {
      name: string;
    };
    status: {
      name: string;
    };
    priority: {
      name: string;
    };
    assignee?: {
      emailAddress: string;
      displayName: string;
    };
    reporter: {
      emailAddress: string;
      displayName: string;
    };
    project: {
      key: string;
      name: string;
    };
    created: string;
    updated: string;
    resolutiondate?: string;
    comment?: {
      comments: Array<{
        id: string;
        author: {
          emailAddress: string;
          displayName: string;
        };
        body: string;
        created: string;
        updated: string;
      }>;
    };
    changelog?: {
      histories: Array<{
        id: string;
        author: {
          emailAddress: string;
          displayName: string;
        };
        created: string;
        items: Array<{
          field: string;
          from: string;
          fromString?: string;
          to: string;
          toString?: string;
        }>;
      }>;
    };
    worklog?: {
      worklogs: Array<{
        id: string;
        author: {
          emailAddress: string;
          displayName: string;
        };
        timeSpentSeconds: number;
        comment?: string;
        created: string;
        updated: string;
      }>;
    };
  };
}

export class JiraConnector {
  private client: AxiosInstance;
  private artifactStore: ArtifactStore;

  constructor(config: JiraConfig, artifactStore: ArtifactStore) {
    this.client = axios.create({
      baseURL: config.baseUrl,
      auth: {
        username: config.username,
        password: config.apiToken,
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    this.artifactStore = artifactStore;
  }

  async retrieveIssues(options: JiraRetrievalOptions = {}): Promise<ActivityEvent[]> {
    const events: ActivityEvent[] = [];
    const { since, projects, issueTypes, limit = 100 } = options;

    // Build JQL query
    const jqlParts: string[] = [];
    
    if (since) {
      jqlParts.push(`updated >= "${since.toISOString()}"`);
    }
    
    if (projects && projects.length > 0) {
      jqlParts.push(`project in (${projects.map(p => `"${p}"`).join(', ')})`);
    }
    
    if (issueTypes && issueTypes.length > 0) {
      jqlParts.push(`issuetype in (${issueTypes.map(t => `"${t}"`).join(', ')})`);
    }

    const jql = jqlParts.length > 0 ? jqlParts.join(' AND ') : '';

    // Retrieve issues using JQL
    const searchResponse = await this.client.get('/rest/api/3/search', {
      params: {
        jql,
        fields: [
          'summary', 'description', 'issuetype', 'status', 'priority',
          'assignee', 'reporter', 'project', 'created', 'updated', 
          'resolutiondate', 'comment', 'changelog', 'worklog'
        ].join(','),
        expand: 'changelog,worklog',
        maxResults: limit,
      },
    });

    const issues: JiraIssue[] = searchResponse.data.issues || [];

    for (const issue of issues) {
      // Store raw issue data as artifact
      const artifactKey = `jira/issues/${issue.key}`;
      const jsonString = JSON.stringify(issue, null, 2);
      await this.artifactStore.put(artifactKey, jsonString, {
        contentType: 'application/json',
        source: 'jira',
        timestamp: new Date(issue.fields.updated),
      });

      // Create issue creation event
      events.push(this.createIssueEvent(issue, JIRA_EVENT_TYPES.ISSUE_CREATED, issue.fields.created));

      // Create issue update event
      if (issue.fields.updated !== issue.fields.created) {
        events.push(this.createIssueEvent(issue, JIRA_EVENT_TYPES.ISSUE_UPDATED, issue.fields.updated));
      }

      // Create assignment events
      if (issue.fields.assignee) {
        events.push(this.createIssueEvent(issue, JIRA_EVENT_TYPES.ISSUE_ASSIGNED, issue.fields.updated));
      }

      // Process comments
      if (issue.fields.comment?.comments) {
        for (const comment of issue.fields.comment.comments) {
          events.push(this.createCommentEvent(issue, comment));
        }
      }

      // Process changelog
      if (issue.fields.changelog?.histories) {
        for (const history of issue.fields.changelog.histories) {
          for (const item of history.items) {
            if (item.field === 'status') {
              events.push(this.createStatusChangeEvent(issue, history, item));
            } else if (item.field === 'resolution') {
              events.push(this.createResolutionChangeEvent(issue, history, item));
            }
          }
        }
      }

      // Process worklogs
      if (issue.fields.worklog?.worklogs) {
        for (const worklog of issue.fields.worklog.worklogs) {
          events.push(this.createWorklogEvent(issue, worklog));
        }
      }
    }

    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  private createIssueEvent(issue: JiraIssue, eventType: string, timestamp: string): JiraActivityEvent {
    const metadata: JiraEventMetadata = {
      issueKey: issue.key,
      issueType: issue.fields.issuetype.name,
      status: issue.fields.status.name,
      priority: issue.fields.priority.name,
      assignee: issue.fields.assignee?.emailAddress,
      reporter: issue.fields.reporter.emailAddress,
      project: issue.fields.project.key,
      summary: issue.fields.summary,
      description: issue.fields.description,
    };

    return {
      id: `jira-${issue.key}-${eventType}-${Date.now()}`,
      source: 'jira',
      timestamp,
      actor: issue.fields.reporter.emailAddress,
      type: eventType,
      metadata,
      content: `${issue.fields.summary}\n\n${issue.fields.description || ''}`,
    };
  }

  private createCommentEvent(issue: JiraIssue, comment: any): JiraActivityEvent {
    const metadata: JiraEventMetadata = {
      issueKey: issue.key,
      issueType: issue.fields.issuetype.name,
      status: issue.fields.status.name,
      project: issue.fields.project.key,
      summary: issue.fields.summary,
      commentId: comment.id,
    };

    return {
      id: `jira-${issue.key}-comment-${comment.id}`,
      source: 'jira',
      timestamp: comment.created,
      actor: comment.author.emailAddress,
      type: JIRA_EVENT_TYPES.COMMENT_ADDED,
      metadata,
      content: comment.body,
    };
  }

  private createStatusChangeEvent(issue: JiraIssue, history: any, item: any): JiraActivityEvent {
    const metadata: JiraEventMetadata = {
      issueKey: issue.key,
      issueType: issue.fields.issuetype.name,
      status: item.toString || item.to,
      project: issue.fields.project.key,
      summary: issue.fields.summary,
      changelog: [{
        field: item.field,
        from: item.fromString || item.from,
        to: item.toString || item.to,
      }],
    };

    return {
      id: `jira-${issue.key}-status-${history.id}-${item.field}`,
      source: 'jira',
      timestamp: history.created,
      actor: history.author.emailAddress,
      type: JIRA_EVENT_TYPES.STATUS_CHANGED,
      metadata,
    };
  }

  private createResolutionChangeEvent(issue: JiraIssue, history: any, item: any): JiraActivityEvent {
    const metadata: JiraEventMetadata = {
      issueKey: issue.key,
      issueType: issue.fields.issuetype.name,
      status: issue.fields.status.name,
      project: issue.fields.project.key,
      summary: issue.fields.summary,
      changelog: [{
        field: item.field,
        from: item.fromString || item.from,
        to: item.toString || item.to,
      }],
    };

    return {
      id: `jira-${issue.key}-resolution-${history.id}-${item.field}`,
      source: 'jira',
      timestamp: history.created,
      actor: history.author.emailAddress,
      type: JIRA_EVENT_TYPES.RESOLUTION_CHANGED,
      metadata,
    };
  }

  private createWorklogEvent(issue: JiraIssue, worklog: any): JiraActivityEvent {
    const metadata: JiraEventMetadata = {
      issueKey: issue.key,
      issueType: issue.fields.issuetype.name,
      status: issue.fields.status.name,
      project: issue.fields.project.key,
      summary: issue.fields.summary,
      worklog: {
        timeSpent: worklog.timeSpentSeconds,
        comment: worklog.comment,
      },
    };

    return {
      id: `jira-${issue.key}-worklog-${worklog.id}`,
      source: 'jira',
      timestamp: worklog.created,
      actor: worklog.author.emailAddress,
      type: JIRA_EVENT_TYPES.WORKLOG_ADDED,
      metadata,
      content: worklog.comment || '',
    };
  }

  /**
   * Test the connection to Jira
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/rest/api/3/myself');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get available projects
   */
  async getProjects(): Promise<Array<{ key: string; name: string }>> {
    try {
      const response = await this.client.get('/rest/api/3/project');
      return response.data.map((project: any) => ({
        key: project.key,
        name: project.name,
      }));
    } catch (error) {
      throw new Error(`Failed to retrieve projects: ${error}`);
    }
  }
}
