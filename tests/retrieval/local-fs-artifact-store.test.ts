import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { LocalFsArtifactStore } from "../../src/storage/local-fs-artifact-store";
import { ArtifactMetadata } from "../../src/types/artifact";

/**
 * Local File System Artifact Store Tests
 *
 * This test suite validates the file-based storage functionality of the LocalFsArtifactStore class.
 * It tests how the artifact store persists and retrieves competency labels, features,
 * and other processing artifacts using the local file system.
 *
 * Test Structure:
 * - Basic Operations: Core CRUD functionality for artifacts
 * - File Management: File creation, reading, updating, and deletion
 * - Metadata Handling: Artifact metadata storage and retrieval
 * - Directory Management: Proper directory structure and cleanup
 * - Error Handling: Graceful failure management for file operations
 */

describe("LocalFsArtifactStore", () => {
  let store: LocalFsArtifactStore;
  let tempDir: string;

  beforeEach(async () => {
    // Create a temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "artifact-store-test-"));
    store = new LocalFsArtifactStore(tempDir);
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  /**
   * Basic Operations Tests
   *
   * These tests validate the core storage functionality:
   * - Storing and retrieving data artifacts
   * - Maintaining data integrity
   * - Handling different data types and sizes
   * - Proper file path management
   */

  describe("put and get", () => {
    /**
     * Test: Store and Retrieve Data
     *
     * Validates that the artifact store can store and retrieve data correctly:
     * - Data is stored with correct content
     * - Retrieved data matches original content
     * - File paths are handled correctly
     * - Data integrity is maintained
     */
    it("should store and retrieve data correctly", async () => {
      const key = "test/data.txt";
      const data = "Hello, World!";
      const metadata: ArtifactMetadata = {
        contentType: "text/plain",
        source: "test",
      };

      await store.put(key, data, metadata);
      const result = await store.get(key);

      expect(result).toBeDefined();
      expect(result?.key).toBe(key);
      expect(result?.metadata).toEqual(expect.objectContaining(metadata));

      // Convert stream to string for comparison
      const chunks: any[] = [];
      for await (const chunk of result?.stream || []) {
        chunks.push(chunk);
      }
      const retrievedData = Buffer.concat(chunks).toString();
      expect(retrievedData).toBe(data);
    });

    it("should return null for non-existent key", async () => {
      const result = await store.get("non-existent");
      expect(result).toBeNull();
    });

    it("should handle binary data", async () => {
      const key = "test/binary.bin";
      const data = new Uint8Array([0x01, 0x02, 0x03, 0x04]);

      await store.put(key, data);
      const result = await store.get(key);

      expect(result).toBeDefined();
      expect(result?.key).toBe(key);
    });
  });

  describe("exists", () => {
    it("should return true for existing key", async () => {
      const key = "test/existing.txt";
      await store.put(key, "data");

      const exists = await store.exists(key);
      expect(exists).toBe(true);
    });

    it("should return false for non-existing key", async () => {
      const exists = await store.exists("non-existing");
      expect(exists).toBe(false);
    });
  });

  describe("delete", () => {
    it("should delete existing key", async () => {
      const key = "test/to-delete.txt";
      await store.put(key, "data");

      await store.delete(key);

      const exists = await store.exists(key);
      expect(exists).toBe(false);
    });

    it("should not throw error when deleting non-existing key", async () => {
      await expect(store.delete("non-existing")).resolves.not.toThrow();
    });
  });

  describe("list", () => {
    beforeEach(async () => {
      // Create test files
      await store.put("dir1/file1.txt", "data1");
      await store.put("dir1/file2.txt", "data2");
      await store.put("dir2/file3.txt", "data3");
      await store.put("root.txt", "data4");
    });

    it("should list all files", async () => {
      const result = await store.list();

      expect(result.items).toHaveLength(4);
      expect(result.items.map((item) => item.key)).toEqual(
        expect.arrayContaining([
          "dir1/file1.txt",
          "dir1/file2.txt",
          "dir2/file3.txt",
          "root.txt",
        ])
      );
    });

    it("should filter by prefix", async () => {
      const result = await store.list({ prefix: "dir1/" });

      expect(result.items).toHaveLength(2);
      expect(result.items.map((item) => item.key)).toEqual(
        expect.arrayContaining(["dir1/file1.txt", "dir1/file2.txt"])
      );
    });

    it("should limit results", async () => {
      const result = await store.list({ limit: 2 });

      expect(result.items.length).toBeLessThanOrEqual(2);
    });
  });

  describe("getMetadata", () => {
    it("should return metadata for existing key", async () => {
      const key = "test/metadata.txt";
      const metadata: ArtifactMetadata = {
        contentType: "text/plain",
        source: "test",
        customField: "custom-value",
      };

      await store.put(key, "data", metadata);
      const retrievedMetadata = await store.getMetadata(key);

      expect(retrievedMetadata).toEqual(expect.objectContaining(metadata));
    });

    it("should return null for non-existing key", async () => {
      const metadata = await store.getMetadata("non-existing");
      expect(metadata).toBeNull();
    });
  });

  describe("cleanup", () => {
    it("should remove old files", async () => {
      const key = "test/old.txt";
      await store.put(key, "data");

      // Mock file modification time to be old
      const filePath = path.join(tempDir, key);
      const oldTime = new Date();
      oldTime.setDate(oldTime.getDate() - 10); // 10 days ago
      await fs.utimes(filePath, oldTime, oldTime);

      await store.cleanup(5); // Clean up files older than 5 days

      const exists = await store.exists(key);
      expect(exists).toBe(false);
    });

    it("should keep recent files", async () => {
      const key = "test/recent.txt";
      await store.put(key, "data");

      await store.cleanup(5); // Clean up files older than 5 days

      const exists = await store.exists(key);
      expect(exists).toBe(true);
    });
  });
});
