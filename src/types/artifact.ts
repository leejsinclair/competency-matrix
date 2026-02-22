export interface ArtifactMetadata {
  contentType?: string;
  size?: number;
  source?: string;
  timestamp?: Date;
  [key: string]: any;
}

export interface ArtifactResult {
  key: string;
  stream: any; // Readable stream
  metadata?: ArtifactMetadata | undefined;
}

export interface ListOptions {
  prefix?: string;
  limit?: number;
  continuationToken?: string;
}

export interface ListResult {
  items: Array<{
    key: string;
    size?: number | undefined;
    lastModified?: Date | undefined;
    metadata?: ArtifactMetadata | undefined;
  }>;
  continuationToken?: string | undefined;
}

export interface ArtifactStore {
  /**
   * Store an artifact with the given key
   */
  put(key: string, data: Uint8Array | any, metadata?: ArtifactMetadata): Promise<void>;
  
  /**
   * Retrieve an artifact by key
   */
  get(key: string): Promise<ArtifactResult | null>;
  
  /**
   * Delete an artifact by key
   */
  delete(key: string): Promise<void>;
  
  /**
   * List artifacts with optional prefix filtering
   */
  list(options?: ListOptions): Promise<ListResult>;
  
  /**
   * Check if an artifact exists
   */
  exists(key: string): Promise<boolean>;
  
  /**
   * Get metadata for an artifact without retrieving the content
   */
  getMetadata(key: string): Promise<ArtifactMetadata | null>;
}
