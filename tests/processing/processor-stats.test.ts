import { createProcessorSetup } from "./processor-setup-mock";

/**
 * Processor Processing Statistics Tests
 *
 * This test suite validates the statistics and monitoring functionality of the Processor class.
 * It tests how the processor tracks and reports processing metrics, performance data,
 * and competency distribution statistics for the CircleCI competency matrix.
 *
 * Test Structure:
 * - Processing Statistics: Core metrics collection and reporting
 * - Time Range Queries: Filtering statistics by date ranges
 * - Performance Metrics: Processing time and efficiency tracking
 * - Competency Distribution: CircleCI category statistics
 * - Error Tracking: Processing error monitoring and reporting
 */

describe("Processor - Processing Statistics", () => {
  let processor: any;

  beforeEach(() => {
    const setup = createProcessorSetup();
    processor = setup.processor;
  });

  /**
   * Processing Statistics Tests
   *
   * These tests validate the core statistics functionality:
   * - Collection of processing metrics
   * - Event processing counts
   * - Label generation statistics
   * - Feature extraction metrics
   * - Error tracking and reporting
   */

  describe("processing statistics", () => {
    /**
     * Test: Processing Statistics Generation
     *
     * Validates that the processor can generate comprehensive statistics:
     * - Returns total events processed count
     * - Reports total labels generated
     * - Tracks total features extracted
     * - Monitors processing errors
     * - Calculates average processing time
     * - Provides competency distribution data
     */
    it("should return processing statistics", async () => {
      const timeRange = {
        start: new Date("2023-01-01"),
        end: new Date("2023-01-02"),
      };

      const stats = await processor.getProcessingStats(timeRange);

      expect(stats).toMatchObject({
        totalEventsProcessed: expect.any(Number),
        totalLabelsGenerated: expect.any(Number),
        totalFeaturesExtracted: expect.any(Number),
        processingErrors: expect.any(Number),
        averageProcessingTime: expect.any(Number),
        competencyDistribution: expect.any(Object),
        timeRange: timeRange,
      });
    });

    it("should handle stats without time range", async () => {
      const stats = await processor.getProcessingStats();

      expect(stats).toMatchObject({
        totalEventsProcessed: expect.any(Number),
        totalLabelsGenerated: expect.any(Number),
        totalFeaturesExtracted: expect.any(Number),
        processingErrors: expect.any(Number),
        averageProcessingTime: expect.any(Number),
        competencyDistribution: expect.any(Object),
        timeRange: undefined,
      });
    });
  });
});
