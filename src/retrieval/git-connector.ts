import simpleGit, { SimpleGit } from 'simple-git';
import * as path from 'path';
import * as fs from 'fs/promises';
import { ActivityEvent, GitActivityEvent, GitEventMetadata, GIT_EVENT_TYPES } from '../types/activity';
import { ArtifactStore } from '../types/artifact';

export interface GitConfig {
  repositoryPath: string;
}

export interface GitRetrievalOptions {
  since?: Date;
  branch?: string;
  limit?: number;
}

interface GitCommitFile {
  status: 'A' | 'M' | 'D' | 'R' | 'C';
  file: string;
}

interface GitCommit {
  hash: string;
  authorName: string;
  authorEmail: string;
  authorDate: string;
  message: string;
  body?: string;
  files: GitCommitFile[];
  stats: {
    additions: number;
    deletions: number;
    files: number;
  };
  branches: string[];
  tags: string[];
  coAuthors?: string[];
}

export class GitConnector {
  private repositoryPath: string;
  private git: SimpleGit;
  private artifactStore: ArtifactStore;

  constructor(config: GitConfig, artifactStore: ArtifactStore) {
    this.repositoryPath = path.resolve(config.repositoryPath);
    this.git = simpleGit({ baseDir: this.repositoryPath });
    this.artifactStore = artifactStore;
  }

  async validateRepository(): Promise<void> {
    try {
      await fs.access(this.repositoryPath);
      await fs.access(path.join(this.repositoryPath, '.git'));
    } catch {
      throw new Error(`Invalid repository path: ${this.repositoryPath}`);
    }
  }

  async getCommits(branch: string, since?: Date, limit?: number): Promise<GitCommit[]> {
    try {
      const records = await this.readCommitRecords(branch, since, limit);
      const commits: GitCommit[] = [];

      for (const record of records) {
        const files = await this.getCommitFiles(record.hash);
        const stats = await this.getCommitStats(record.hash);
        const branches = await this.getCommitBranches(record.hash);
        const tags = await this.getCommitTags(record.hash);
        const coAuthors = this.extractCoAuthors(record.body);

        commits.push({
          hash: record.hash,
          authorName: record.authorName,
          authorEmail: record.authorEmail,
          authorDate: record.authorDate,
          message: record.message,
          body: record.body,
          files,
          stats,
          branches,
          tags,
          coAuthors,
        });
      }

      return commits;
    } catch (error) {
      throw new Error(`Failed to retrieve commits: ${String(error)}`);
    }
  }

  private async readCommitRecords(
    branch: string,
    since?: Date,
    limit?: number,
  ): Promise<Array<Pick<GitCommit, 'hash' | 'authorName' | 'authorEmail' | 'authorDate' | 'message' | 'body'>>> {
    const args = [
      'log',
      branch,
      '--date=iso-strict',
      '--pretty=format:%H%x1f%an%x1f%ae%x1f%ad%x1f%s%x1f%b%x1e',
    ];

    if (since) {
      args.push(`--since=${since.toISOString()}`);
    }

    if (limit && limit > 0) {
      args.push(`--max-count=${limit}`);
    }

    const output = await this.git.raw(args);
    const commits: Array<Pick<GitCommit, 'hash' | 'authorName' | 'authorEmail' | 'authorDate' | 'message' | 'body'>> = [];

    const rows = output
      .split('\x1e')
      .map((row) => row.trim())
      .filter(Boolean);

    for (const row of rows) {
      const [hash, authorName, authorEmail, authorDate, message, body = ''] = row.split('\x1f');

      if (!hash || !authorName || !authorEmail || !authorDate || !message) {
        continue;
      }

      commits.push({
        hash,
        authorName,
        authorEmail,
        authorDate,
        message,
        body: body.trim() || undefined,
      });
    }

    return commits;
  }

  private async getCommitFiles(hash: string): Promise<GitCommitFile[]> {
    try {
      const output = await this.git.raw(['show', '--name-status', '--format=', hash]);
      const files: GitCommitFile[] = [];

      for (const line of output.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed) {
          continue;
        }

        const parts = trimmed.split('\t');
        const rawStatus = parts[0] || '';
        const normalizedStatus = rawStatus.charAt(0) as GitCommitFile['status'];

        if (!['A', 'M', 'D', 'R', 'C'].includes(normalizedStatus)) {
          continue;
        }

        const file =
          normalizedStatus === 'R' || normalizedStatus === 'C'
            ? parts[2] || parts[1] || ''
            : parts[1] || '';

        if (!file) {
          continue;
        }

        files.push({
          status: normalizedStatus,
          file,
        });
      }

      return files;
    } catch (error) {
      throw new Error(`Failed to get file changes for ${hash}: ${String(error)}`);
    }
  }

  private async getCommitStats(hash: string): Promise<GitCommit['stats']> {
    try {
      const output = await this.git.raw(['show', '--shortstat', '--format=', hash]);
      const line = output.split('\n').find((candidate) => candidate.includes('changed')) || '';

      const fileMatch = line.match(/(\d+) files? changed/);
      const insertionMatch = line.match(/(\d+) insertions?\(\+\)/);
      const deletionMatch = line.match(/(\d+) deletions?\(-\)/);

      return {
        files: fileMatch ? Number.parseInt(fileMatch[1], 10) : 0,
        additions: insertionMatch ? Number.parseInt(insertionMatch[1], 10) : 0,
        deletions: deletionMatch ? Number.parseInt(deletionMatch[1], 10) : 0,
      };
    } catch {
      return { additions: 0, deletions: 0, files: 0 };
    }
  }

  private async getCommitBranches(hash: string): Promise<string[]> {
    try {
      const output = await this.git.raw(['branch', '--contains', hash]);
      return output
        .split('\n')
        .map((line) => line.replace('*', '').trim())
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  private async getCommitTags(hash: string): Promise<string[]> {
    try {
      const output = await this.git.raw(['tag', '--points-at', hash]);
      return output
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  private extractCoAuthors(body?: string): string[] {
    if (!body) {
      return [];
    }

    const coAuthors: string[] = [];
    const regex = /Co-authored-by:\s*(.+)/gi;
    let match = regex.exec(body);

    while (match) {
      coAuthors.push(match[1].trim());
      match = regex.exec(body);
    }

    return coAuthors;
  }

  private detectModules(files: GitCommitFile[]): string[] {
    const modules = new Set<string>();

    for (const file of files) {
      if (file.status !== 'A' && file.status !== 'M') {
        continue;
      }

      const modulePath = file.file.split('/')[0];
      if (modulePath) {
        modules.add(modulePath);
      }
    }

    return Array.from(modules);
  }

  private createCommitEvent(commit: GitCommit): GitActivityEvent {
    const metadata: GitEventMetadata = {
      repository: path.basename(this.repositoryPath),
      commitHash: commit.hash,
      branch: commit.branches[0],
      filesChanged: commit.files.map((file) => file.file),
      additions: commit.stats.additions,
      deletions: commit.stats.deletions,
      message: commit.message,
      authorName: commit.authorName,
      authorEmail: commit.authorEmail,
      coAuthors: commit.coAuthors,
      modules: this.detectModules(commit.files),
    };

    return {
      id: `git-${commit.hash}`,
      source: 'git',
      timestamp: commit.authorDate,
      actor: commit.authorEmail,
      type: GIT_EVENT_TYPES.COMMIT_CREATED,
      metadata,
      content: `${commit.message}\n\n${commit.body || ''}`,
    };
  }

  private createModuleOwnershipEvent(commit: GitCommit, modules: string[]): GitActivityEvent {
    const metadata: GitEventMetadata = {
      repository: path.basename(this.repositoryPath),
      commitHash: commit.hash,
      branch: commit.branches[0],
      modules,
      authorName: commit.authorName,
      authorEmail: commit.authorEmail,
      coAuthors: commit.coAuthors,
    };

    return {
      id: `git-${commit.hash}-modules`,
      source: 'git',
      timestamp: commit.authorDate,
      actor: commit.authorEmail,
      type: 'module_ownership_detected',
      metadata,
      content: `Module ownership detected: ${modules.join(', ')}`,
    };
  }

  async retrieveCommits(options: GitRetrievalOptions = {}): Promise<ActivityEvent[]> {
    const events: ActivityEvent[] = [];
    const { since, branch = 'main', limit = 100 } = options;

    await this.validateRepository();
    const commits = await this.getCommits(branch, since, limit);

    for (const commit of commits) {
      const artifactKey = `git/commits/${commit.hash}`;
      const jsonString = JSON.stringify(commit, null, 2);

      await this.artifactStore.put(artifactKey, jsonString, {
        contentType: 'application/json',
        source: 'git',
        timestamp: new Date(commit.authorDate),
      });

      events.push(this.createCommitEvent(commit));

      const modules = this.detectModules(commit.files);
      if (modules.length > 0) {
        events.push(this.createModuleOwnershipEvent(commit, modules));
      }
    }

    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
}
