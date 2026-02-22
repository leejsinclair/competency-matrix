import { promises as fs, createReadStream, createWriteStream } from 'fs';
import * as path from 'path';
import { promisify } from 'util';

// Use require for stream to avoid TypeScript module resolution issues
const { pipeline } = require('stream');
const pipelineAsync = promisify(pipeline);

import { ArtifactStore, ArtifactMetadata, ArtifactResult, ListOptions, ListResult } from '../types/artifact';

export class LocalFsArtifactStore implements ArtifactStore {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = path.resolve(basePath);
  }

  private getFilePath(key: string): string {
    // Sanitize key to prevent directory traversal
    const sanitizedKey = key.replace(/\.\./g, '').replace(/\\/g, '/');
    return path.join(this.basePath, sanitizedKey);
  }

  private getMetadataPath(key: string): string {
    return this.getFilePath(`${key}.meta`);
  }

  private async ensureDirectoryExists(filePath: string): Promise<void> {
    const dir = path.dirname(filePath);
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async put(key: string, data: Uint8Array | any, metadata?: ArtifactMetadata): Promise<void> {
    const filePath = this.getFilePath(key);
    await this.ensureDirectoryExists(filePath);

    if (data instanceof Uint8Array) {
      await fs.writeFile(filePath, data);
    } else {
      // Assume it's a readable stream
      await pipelineAsync(data, createWriteStream(filePath));
    }

    // Store metadata if provided
    if (metadata) {
      const metadataPath = this.getMetadataPath(key);
      const metadataWithStats = {
        ...metadata,
        size: data instanceof Uint8Array ? data.length : undefined,
        timestamp: new Date().toISOString(),
      };
      await fs.writeFile(metadataPath, JSON.stringify(metadataWithStats, null, 2));
    }
  }

  async get(key: string): Promise<ArtifactResult | null> {
    const filePath = this.getFilePath(key);
    
    try {
      await fs.access(filePath);
    } catch {
      return null;
    }

    const stream = createReadStream(filePath);
    const metadata = await this.getMetadata(key);

    return {
      key,
      stream,
      metadata: metadata || undefined,
    };
  }

  async delete(key: string): Promise<void> {
    const filePath = this.getFilePath(key);
    const metadataPath = this.getMetadataPath(key);

    try {
      await fs.unlink(filePath);
    } catch (error) {
      // Ignore file not found errors
      if ((error as any).code !== 'ENOENT') {
        throw error;
      }
    }

    try {
      await fs.unlink(metadataPath);
    } catch (error) {
      // Ignore file not found errors
      if ((error as any).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async list(options?: ListOptions): Promise<ListResult> {
    const { prefix = '', limit = 1000 } = options || {};
    
    const items: ListResult['items'] = [];
    let processedCount = 0;
    let hasMore = false;

    const scanDirectory = async (dir: string, currentPath = ''): Promise<void> => {
      if (processedCount >= limit) {
        hasMore = true;
        return;
      }

      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          if (processedCount >= limit) break;

          const fullPath = path.join(dir, entry.name);
          const relativePath = currentPath ? path.join(currentPath, entry.name) : entry.name;

          if (entry.isDirectory()) {
            await scanDirectory(fullPath, relativePath);
          } else if (!entry.name.endsWith('.meta')) {
            // This is a data file, not a metadata file
            const key = relativePath.replace(/\\/g, '/');
            
            if (key.startsWith(prefix)) {
              try {
                const stats = await fs.stat(fullPath);
                const metadata = await this.getMetadata(key);
                
                items.push({
                  key,
                  size: stats.size,
                  lastModified: stats.mtime,
                  metadata: metadata || undefined,
                });
                
                processedCount++;
              } catch (error) {
                // Skip files that can't be accessed
                continue;
              }
            }
          }
        }
      } catch (error) {
        // Skip directories that can't be accessed
        return;
      }
    };

    await scanDirectory(this.basePath);

    const result: ListResult = {
      items,
    };
    
    if (hasMore && items.length > 0) {
      result.continuationToken = items[items.length - 1].key;
    }
    
    return result;
  }

  async exists(key: string): Promise<boolean> {
    const filePath = this.getFilePath(key);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getMetadata(key: string): Promise<ArtifactMetadata | null> {
    const metadataPath = this.getMetadataPath(key);
    
    try {
      const data = await fs.readFile(metadataPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  /**
   * Clean up old artifacts based on retention policy
   */
  async cleanup(maxAgeDays: number): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

    const scanDirectory = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            await scanDirectory(fullPath);
            // Try to remove empty directories
            try {
              await fs.rmdir(fullPath);
            } catch {
              // Directory not empty, ignore
            }
          } else if (!entry.name.endsWith('.meta')) {
            try {
              const stats = await fs.stat(fullPath);
              if (stats.mtime < cutoffDate) {
                const key = path.relative(this.basePath, fullPath).replace(/\\/g, '/');
                await this.delete(key);
              }
            } catch {
              // Skip files that can't be accessed
              continue;
            }
          }
        }
      } catch {
        // Skip directories that can't be accessed
        return;
      }
    };

    await scanDirectory(this.basePath);
  }
}
