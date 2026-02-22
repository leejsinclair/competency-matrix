export type ActivitySource = 'jira' | 'confluence' | 'bitbucket' | 'git';

export interface ActivityEvent {
  id: string;
  source: ActivitySource;
  timestamp: string; // ISO 8601 timestamp
  actor: string; // User identifier (email or username)
  type: string; // Event type specific to source
  metadata: Record<string, any>; // Source-specific metadata
  content?: string; // Text content for NLP/keyword analysis
}

// Jira-specific event types and metadata
export interface JiraEventMetadata {
  issueKey?: string;
  issueType?: string;
  status?: string;
  priority?: string;
  assignee?: string | undefined;
  reporter?: string;
  project?: string;
  summary?: string;
  description?: string | undefined;
  commentId?: string;
  changelog?: Array<{
    field: string;
    from: string;
    to: string;
  }>;
  worklog?: {
    timeSpent: number;
    comment?: string;
  };
}

// Confluence-specific event types and metadata
export interface ConfluenceEventMetadata {
  pageId?: string;
  spaceKey?: string;
  title?: string;
  version?: number;
  commentId?: string;
  contentType?: 'page' | 'comment' | 'attachment';
  parentPageId?: string | undefined;
  labels?: string[];
}

// Bitbucket-specific event types and metadata
export interface BitbucketEventMetadata {
  repository?: string;
  project?: string;
  pullRequestId?: number;
  pullRequestTitle?: string;
  sourceBranch?: string;
  destinationBranch?: string;
  state?: 'OPEN' | 'MERGED' | 'DECLINED' | 'SUPERSEDED';
  commentId?: string;
  pipelineUuid?: string;
  pipelineState?: string;
  commitHash?: string | undefined;
  author?: string;
  reviewers?: string[];
}

// Git-specific event types and metadata
export interface GitEventMetadata {
  repository?: string;
  commitHash?: string;
  branch?: string;
  filesChanged?: string[];
  additions?: number;
  deletions?: number;
  message?: string;
  authorName?: string;
  authorEmail?: string;
  coAuthors?: string[] | undefined;
  modules?: string[]; // Detected modules/packages affected
}

// Extended ActivityEvent with source-specific metadata
export type JiraActivityEvent = ActivityEvent & {
  source: 'jira';
  metadata: JiraEventMetadata;
};

export type ConfluenceActivityEvent = ActivityEvent & {
  source: 'confluence';
  metadata: ConfluenceEventMetadata;
};

export type BitbucketActivityEvent = ActivityEvent & {
  source: 'bitbucket';
  metadata: BitbucketEventMetadata;
};

export type GitActivityEvent = ActivityEvent & {
  source: 'git';
  metadata: GitEventMetadata;
};

export type TypedActivityEvent = 
  | JiraActivityEvent 
  | ConfluenceActivityEvent 
  | BitbucketActivityEvent 
  | GitActivityEvent;

// Event type constants for each source
export const JIRA_EVENT_TYPES = {
  ISSUE_CREATED: 'issue_created',
  ISSUE_UPDATED: 'issue_updated',
  ISSUE_ASSIGNED: 'issue_assigned',
  COMMENT_ADDED: 'comment_added',
  STATUS_CHANGED: 'status_changed',
  WORKLOG_ADDED: 'worklog_added',
  RESOLUTION_CHANGED: 'resolution_changed',
} as const;

export const CONFLUENCE_EVENT_TYPES = {
  PAGE_CREATED: 'page_created',
  PAGE_UPDATED: 'page_updated',
  COMMENT_ADDED: 'comment_added',
  ATTACHMENT_ADDED: 'attachment_added',
  LABEL_ADDED: 'label_added',
} as const;

export const BITBUCKET_EVENT_TYPES = {
  PULL_REQUEST_CREATED: 'pull_request_created',
  PULL_REQUEST_UPDATED: 'pull_request_updated',
  PULL_REQUEST_MERGED: 'pull_request_merged',
  PULL_REQUEST_DECLINED: 'pull_request_declined',
  COMMENT_ADDED: 'comment_added',
  APPROVAL_GRANTED: 'approval_granted',
  PIPELINE_COMPLETED: 'pipeline_completed',
  COMMIT_PUSHED: 'commit_pushed',
} as const;

export const GIT_EVENT_TYPES = {
  COMMIT_CREATED: 'commit_created',
  BRANCH_CREATED: 'branch_created',
  BRANCH_MERGED: 'branch_merged',
  TAG_CREATED: 'tag_created',
} as const;

// Utility functions for type guards
export function isJiraEvent(event: ActivityEvent): event is JiraActivityEvent {
  return event.source === 'jira';
}

export function isConfluenceEvent(event: ActivityEvent): event is ConfluenceActivityEvent {
  return event.source === 'confluence';
}

export function isBitbucketEvent(event: ActivityEvent): event is BitbucketActivityEvent {
  return event.source === 'bitbucket';
}

export function isGitEvent(event: ActivityEvent): event is GitActivityEvent {
  return event.source === 'git';
}
