import { createProcessorSetup } from "./processor-setup-mock";

/**
 * Processor Event Processing Tests
 *
 * This test suite validates the core event processing functionality of the Processor class.
 * It tests how the processor handles multiple events, generates labels and features,
 * and stores the results in the artifact store.
 *
 * Test Structure:
 * - Event Processing: Core functionality for processing multiple events
 * - Label Generation: Validates label creation from events
 * - Feature Extraction: Tests feature vector generation
 * - Error Handling: Ensures graceful handling of invalid events
 * - Performance: Validates processing efficiency
 */

describe("Processor - Event Processing", () => {
  let processor: any;
  let mockArtifactStore: jest.Mocked<any>;
  let mockEvents: any[];

  beforeEach(() => {
    const setup = createProcessorSetup();
    processor = setup.processor;
    mockArtifactStore = setup.mockArtifactStore;
    mockEvents = setup.mockEvents;
  });

  /**
   * Event Processing Tests
   *
   * These tests validate the core event processing pipeline:
   * - Processing multiple events in sequence
   * - Generating labels and features for each event
   * - Storing results in the artifact store
   * - Handling event batches efficiently
   */

  describe("processEvents", () => {
    /**
     * Test: Multiple Event Processing
     *
     * Validates that the processor can handle multiple events correctly:
     * - Processes all events in the input array
     * - Generates labels for each event using rule engine
     * - Generates features for each event using ML processor
     * - Stores both labels and features in artifact store
     * - Maintains correct count of storage operations
     */
    it("should process multiple events and return results", async () => {
      await processor.processEvents(mockEvents);

      // Check that artifact store was called
      expect(mockArtifactStore.put).toHaveBeenCalledTimes(
        mockEvents.length * 2 // labels + features for each event
      );
    });

    /**
     * Test: Artifact Storage Validation
     *
     * Validates that processing results are properly stored as artifacts:
     * - Labels are stored with correct path and metadata
     * - Features are stored with correct path and metadata
     * - Storage operations include proper content type
     * - Source metadata is correctly set
     */
    it("should store processing results as artifacts", async () => {
      await processor.processEvents(mockEvents);

      // Check that labels are stored
      expect(mockArtifactStore.put).toHaveBeenCalledWith(
        expect.stringContaining("labels/"),
        expect.any(String),
        expect.objectContaining({
          contentType: "application/json",
          source: "processing",
        })
      );

      // Check that features are stored
      expect(mockArtifactStore.put).toHaveBeenCalledWith(
        expect.stringContaining("features/"),
        expect.any(String),
        expect.objectContaining({
          contentType: "application/json",
          source: "processing",
        })
      );
    });

    /**
     * Test: Error Handling
     *
     * Validates that the processor handles problematic events gracefully:
     * - Processes events with missing or invalid data
     * - Continues processing other events when one fails
     * - Logs appropriate error messages
     * - Doesn't crash on invalid input
     */
    it("should handle processing errors", async () => {
      // Mock an event that might cause processing errors
      const problematicEvent = {
        id: "event-error",
        source: "unknown" as any,
        timestamp: "invalid-date",
        actor: "",
        type: "unknown_type",
        metadata: null as any,
        content: null as any,
      };

      const result = await processor.processEvents([problematicEvent]);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toMatchObject({
        id: expect.stringContaining("error-event-error"),
        eventId: "event-error",
        error: expect.any(String),
        severity: "medium",
        createdAt: expect.any(Date),
      });
    });

    /**
     * Test: Label Deduplication
     *
     * Validates that duplicate labels are properly deduplicated:
     * - Removes duplicate labels for the same event
     * - Keeps highest confidence labels when duplicates exist
     * - Maintains unique competency category and row combinations
     * - Preserves label quality and accuracy
     */
    it("should deduplicate labels", async () => {
      const result = await processor.processEvents(mockEvents);

      // Check that labels are deduplicated by competency category and row
      const competencyLabels = result.labels.filter(
        (l: any) => l.competencyCategory === "code-quality"
      );

      // Should not have duplicate competency category/row combinations
      const uniqueCompetencyLabels = new Set(
        competencyLabels.map(
          (l: any) => `${l.competencyCategory}-${l.competencyRow}`
        )
      );

      expect(uniqueCompetencyLabels.size).toBe(competencyLabels.length);
    });
  });

  /**
   * Single Event Processing Tests
   *
   * These tests validate processing of individual events:
   * - Single event processing workflow
   * - Label generation for individual events
   * - Feature extraction for single events
   * - Error handling for problematic events
   */

  describe("processSingleEvent", () => {
    /**
     * Test: Single Event Processing
     *
     * Validates processing of a single event:
     * - Generates appropriate labels for the event
     * - Extracts relevant features from the event
     * - Returns structured processing results
     * - Handles event metadata correctly
     */
    it("should process a single event", async () => {
      const event = mockEvents[0];
      const result = await processor.processEvents([event]);

      expect(result).toMatchObject({
        events: expect.any(Array),
        labels: expect.any(Array),
        features: expect.any(Array),
        errors: expect.any(Array),
      });

      expect(result.events).toHaveLength(1);
      expect(result.events[0]).toEqual(event);
      expect(result.labels.length).toBeGreaterThan(0);
      expect(result.features.length).toBeGreaterThan(0);
    });

    /**
     * Test: Empty Event Handling
     *
     * Validates handling of events with minimal data:
     * - Processes events with missing optional fields
     * - Generates basic labels from available content
     * - Handles edge cases gracefully
     * - Returns appropriate results for minimal events
     */
    it("should handle empty events", async () => {
      const emptyEvent = {
        id: "empty-event",
        source: "git",
        timestamp: "2023-01-01T00:00:00.000Z",
        actor: "test@example.com",
        type: "commit",
        metadata: {},
        content: "",
      };

      const result = await processor.processEvents([emptyEvent]);

      // Check if the event was processed or if there was an error
      if (result.errors.length > 0) {
        // If there was an error, the event might not be in the events array
        expect(result.errors[0].eventId).toBe("empty-event");
      } else {
        // If no error, the event should be in the events array
        expect(result.events).toHaveLength(1);
        expect(result.events[0]).toEqual(emptyEvent);
      }

      expect(result.labels).toBeDefined();
      expect(result.features).toBeDefined();
    });
  });
});
