import axios, { AxiosInstance } from "axios";
import {
  ActivityEvent,
  BITBUCKET_EVENT_TYPES,
  BitbucketActivityEvent,
  BitbucketEventMetadata,
} from "../types/activity";
import { ArtifactStore } from "../types/artifact";

export interface BitbucketConfig {
  baseUrl: string;
  username: string;
  apiToken: string; // Changed from appPassword to apiToken for clarity
  workspace?: string; // Added workspace for better organization
}

export interface BitbucketRetrievalOptions {
  since?: Date;
  repositories?: string[];
  limit?: number;
}

interface BitbucketRepository {
  uuid: string;
  name: string;
  full_name: string;
  description: string;
  project: {
    key: string;
    name: string;
  };
  links: {
    html: {
      href: string;
    };
  };
  created_on: string;
  updated_on: string;
}

interface BitbucketPullRequest {
  id: number;
  title: string;
  description: string;
  state: "OPEN" | "MERGED" | "DECLINED" | "SUPERSEDED";
  author: {
    display_name: string;
    nickname: string;
    account_id: string;
  };
  source: {
    branch: {
      name: string;
    };
    commit: {
      hash: string;
    };
    repository: {
      full_name: string;
    };
  };
  destination: {
    branch: {
      name: string;
    };
    commit: {
      hash: string;
    };
    repository: {
      full_name: string;
    };
  };
  participants: Array<{
    user: {
      display_name: string;
      nickname: string;
      account_id: string;
    };
    role: string;
    approved: boolean;
  }>;
  reviewers: Array<{
    display_name: string;
    nickname: string;
    account_id: string;
  }>;
  created_on: string;
  updated_on: string;
  merge_commit?: {
    hash: string;
  };
  closed_by?: {
    display_name: string;
    nickname: string;
    account_id: string;
  };
}

interface BitbucketComment {
  id: number;
  content: {
    raw: string;
    html: string;
    markup: string;
  };
  user: {
    display_name: string;
    nickname: string;
    account_id: string;
  };
  created_on: string;
  updated_on: string;
  deleted: boolean;
  pullrequest?: {
    id: number;
    title: string;
  };
  commit?: {
    hash: string;
  };
}

interface BitbucketPipeline {
  uuid: string;
  state: {
    name: string;
    result?: {
      name: string;
    };
  };
  target: {
    ref_type: string;
    ref_name: string;
    commit?: {
      hash: string;
    };
  };
  build_seconds_used?: number;
  created_on: string;
  completed_on?: string;
}

export class BitbucketConnector {
  private client: AxiosInstance;
  private artifactStore: ArtifactStore;

  constructor(config: BitbucketConfig, artifactStore: ArtifactStore) {
    // Create Basic Auth header with base64 encoding for API token
    const authHeader =
      "Basic " +
      Buffer.from(`${config.username}:${config.apiToken}`).toString("base64");

    console.log("🔧 Bitbucket config:", {
      username: config.username,
      baseUrl: config.baseUrl,
      workspace: config.workspace,
      hasApiToken: !!config.apiToken,
    });
    console.log(`🔑 Bitbucket Auth header: ${authHeader}`);

    this.client = axios.create({
      baseURL: config.baseUrl,
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    this.artifactStore = artifactStore;
  }

  async retrievePullRequests(
    options: BitbucketRetrievalOptions = {}
  ): Promise<ActivityEvent[]> {
    const events: ActivityEvent[] = [];
    const { since, repositories } = options;

    const repos = repositories ? repositories : await this.getRepositories();

    for (const repo of repos) {
      try {
        const pullRequests = await this.getRepositoryPullRequests(repo, since);

        for (const pr of pullRequests) {
          // Store raw PR data as artifact
          const artifactKey = `bitbucket/pullrequests/${repo}/${pr.id}`;
          const jsonString = JSON.stringify(pr, null, 2);
          await this.artifactStore.put(artifactKey, jsonString, {
            contentType: "application/json",
            source: "bitbucket",
            timestamp: new Date(pr.created_on),
          });

          // Create PR creation event
          events.push(
            this.createPullRequestEvent(
              repo,
              pr,
              BITBUCKET_EVENT_TYPES.PULL_REQUEST_CREATED,
              pr.created_on
            )
          );

          // Create PR update event
          if (pr.updated_on !== pr.created_on) {
            events.push(
              this.createPullRequestEvent(
                repo,
                pr,
                BITBUCKET_EVENT_TYPES.PULL_REQUEST_UPDATED,
                pr.updated_on
              )
            );
          }

          // Create PR merge/decline events
          if (pr.state === "MERGED") {
            events.push(
              this.createPullRequestEvent(
                repo,
                pr,
                BITBUCKET_EVENT_TYPES.PULL_REQUEST_MERGED,
                pr.updated_on
              )
            );
          } else if (pr.state === "DECLINED") {
            events.push(
              this.createPullRequestEvent(
                repo,
                pr,
                BITBUCKET_EVENT_TYPES.PULL_REQUEST_DECLINED,
                pr.updated_on
              )
            );
          }

          // Get comments for this PR
          const comments = await this.getPullRequestComments(repo, pr.id);
          for (const comment of comments) {
            events.push(this.createCommentEvent(repo, pr, comment));
          }

          // Process approvals
          for (const participant of pr.participants) {
            if (participant.approved) {
              events.push(this.createApprovalEvent(repo, pr, participant));
            }
          }
        }

        // Get pipelines for the repository
        const pipelines = await this.getRepositoryPipelines(repo, since);
        for (const pipeline of pipelines) {
          events.push(this.createPipelineEvent(repo, pipeline));
        }
      } catch (error) {
        // Continue with other repositories if one fails
        continue;
      }
    }

    return events.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  private async getRepositories(): Promise<string[]> {
    try {
      const response = await this.client.get("/repositories", {
        params: {
          role: "member",
          pagelen: 100,
        },
      });

      return response.data.values.map((repo: any) => repo.full_name);
    } catch (error) {
      throw new Error(`Failed to retrieve repositories: ${error}`);
    }
  }

  private async getRepositoryPullRequests(
    repo: string,
    since?: Date
  ): Promise<BitbucketPullRequest[]> {
    try {
      const params: any = {
        state: "all",
        pagelen: 100,
      };

      if (since) {
        params.q = `updated_on >= ${since.toISOString()}`;
      }

      const response = await this.client.get(
        `/repositories/${repo}/pullrequests`,
        {
          params,
        }
      );

      return response.data.values || [];
    } catch (error) {
      throw new Error(`Failed to retrieve pull requests for ${repo}: ${error}`);
    }
  }

  private async getPullRequestComments(
    repo: string,
    prId: number
  ): Promise<BitbucketComment[]> {
    try {
      const response = await this.client.get(
        `/repositories/${repo}/pullrequests/${prId}/comments`,
        {
          params: {
            pagelen: 100,
          },
        }
      );

      return response.data.values || [];
    } catch (error) {
      return [];
    }
  }

  private async getRepositoryPipelines(
    repo: string,
    since?: Date
  ): Promise<BitbucketPipeline[]> {
    try {
      const params: any = {
        pagelen: 100,
      };

      if (since) {
        params.q = `created_on >= ${since.toISOString()}`;
      }

      const response = await this.client.get(
        `/repositories/${repo}/pipelines`,
        {
          params,
        }
      );

      return response.data.values || [];
    } catch (error) {
      return [];
    }
  }

  private createPullRequestEvent(
    repo: string,
    pr: BitbucketPullRequest,
    eventType: string,
    timestamp: string
  ): BitbucketActivityEvent {
    const metadata: BitbucketEventMetadata = {
      repository: repo,
      project: repo.split("/")[0],
      pullRequestId: pr.id,
      pullRequestTitle: pr.title,
      sourceBranch: pr.source.branch.name,
      destinationBranch: pr.destination.branch.name,
      state: pr.state,
      commitHash: pr.source.commit.hash,
      author: pr.author.nickname,
      reviewers: pr.reviewers.map((r) => r.nickname),
    };

    return {
      id: `bitbucket-${repo}-pr-${pr.id}-${eventType}-${Date.now()}`,
      source: "bitbucket",
      timestamp,
      actor: pr.author.nickname,
      type: eventType,
      metadata,
      content: `${pr.title}\n\n${pr.description}`,
    };
  }

  private createCommentEvent(
    repo: string,
    pr: BitbucketPullRequest,
    comment: BitbucketComment
  ): BitbucketActivityEvent {
    const metadata: BitbucketEventMetadata = {
      repository: repo,
      project: repo.split("/")[0],
      pullRequestId: pr.id,
      pullRequestTitle: pr.title,
      commentId: comment.id.toString(),
      commitHash: pr.source.commit.hash,
      author: comment.user.nickname,
    };

    return {
      id: `bitbucket-${repo}-pr-${pr.id}-comment-${comment.id}`,
      source: "bitbucket",
      timestamp: comment.created_on,
      actor: comment.user.nickname,
      type: BITBUCKET_EVENT_TYPES.COMMENT_ADDED,
      metadata,
      content: comment.content.raw,
    };
  }

  private createApprovalEvent(
    repo: string,
    pr: BitbucketPullRequest,
    participant: any
  ): BitbucketActivityEvent {
    const metadata: BitbucketEventMetadata = {
      repository: repo,
      project: repo.split("/")[0],
      pullRequestId: pr.id,
      pullRequestTitle: pr.title,
      commitHash: pr.source.commit.hash,
      author: participant.user.nickname,
      reviewers: [participant.user.nickname],
    };

    return {
      id: `bitbucket-${repo}-pr-${pr.id}-approval-${participant.user.account_id}`,
      source: "bitbucket",
      timestamp: pr.updated_on, // Use PR update time as approval time
      actor: participant.user.nickname,
      type: BITBUCKET_EVENT_TYPES.APPROVAL_GRANTED,
      metadata,
    };
  }

  private createPipelineEvent(
    repo: string,
    pipeline: BitbucketPipeline
  ): BitbucketActivityEvent {
    const metadata: BitbucketEventMetadata = {
      repository: repo,
      project: repo.split("/")[0],
      pipelineUuid: pipeline.uuid,
      pipelineState: pipeline.state.name,
      commitHash: pipeline.target.commit?.hash,
    };

    return {
      id: `bitbucket-${repo}-pipeline-${pipeline.uuid}`,
      source: "bitbucket",
      timestamp: pipeline.created_on,
      actor: "system", // Pipelines are typically automated
      type: BITBUCKET_EVENT_TYPES.PIPELINE_COMPLETED,
      metadata,
    };
  }

  /**
   * Test the connection to Bitbucket
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get("/user");
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get repositories for the authenticated user
   */
  async getUserRepositories(): Promise<BitbucketRepository[]> {
    try {
      const response = await this.client.get("/repositories", {
        params: {
          role: "member",
          pagelen: 100,
        },
      });

      return response.data.values || [];
    } catch (error) {
      throw new Error(`Failed to retrieve user repositories: ${error}`);
    }
  }

  /**
   * Get commits for a repository
   */
  async getRepositoryCommits(
    repo: string,
    since?: Date
  ): Promise<ActivityEvent[]> {
    try {
      const params: any = {
        pagelen: 100,
      };

      if (since) {
        params.q = `date >= ${since.toISOString()}`;
      }

      const response = await this.client.get(`/repositories/${repo}/commits`, {
        params,
      });

      const commits = response.data.values || [];
      const events: ActivityEvent[] = [];

      for (const commit of commits) {
        const metadata: BitbucketEventMetadata = {
          repository: repo,
          project: repo.split("/")[0],
          commitHash: commit.hash,
          author: commit.author?.user?.nickname || commit.author?.raw,
        };

        events.push({
          id: `bitbucket-${repo}-commit-${commit.hash}`,
          source: "bitbucket",
          timestamp: commit.date,
          actor: commit.author?.user?.nickname || commit.author?.raw,
          type: BITBUCKET_EVENT_TYPES.COMMIT_PUSHED,
          metadata,
          content: commit.message,
        });
      }

      return events;
    } catch (error) {
      throw new Error(`Failed to retrieve commits for ${repo}: ${error}`);
    }
  }
}
