import { createProcessorSetup } from "./processor-setup-mock";

/**
 * Processor Synthetic Data Generation Tests
 *
 * This test suite validates the synthetic data generation functionality of the Processor class.
 * It tests how the processor creates realistic test data for CircleCI competency categories,
 * ensuring adequate test coverage and training data for the ML components.
 *
 * Test Structure:
 * - Synthetic Data Generation: Core test data creation functionality
 * - Category Coverage: Ensuring all CircleCI categories are represented
 * - Data Quality: Validating synthetic data realism and appropriateness
 * - Level Distribution: Testing competency level generation
 * - Content Generation: Validating realistic content creation
 */

describe("Processor - Synthetic Data Generation", () => {
  let processor: any;

  beforeEach(() => {
    const setup = createProcessorSetup();
    processor = setup.processor;
  });

  /**
   * Synthetic Test Data Generation Tests
   *
   * These tests validate the processor's ability to generate test data:
   * - Creating synthetic data for multiple categories
   * - Generating appropriate content for competency levels
   * - Maintaining data quality and realism
   * - Supporting ML model training and testing
   */

  describe("synthetic test data generation", () => {
    /**
     * Test: Synthetic Data Generation
     *
     * Validates that the processor can generate realistic synthetic test data:
     * - Creates specified number of test items per category
     * - Generates appropriate IDs for synthetic data
     * - Assigns correct competency categories
     * - Creates realistic content for testing
     * - Sets proper metadata and source information
     * - Generates appropriate competency levels
     */
    it("should generate synthetic test data", async () => {
      const categories = ["code-quality", "testing", "documentation"];
      const testData = await processor.generateSyntheticTestData(categories, 3);

      expect(testData).toHaveLength(9); // 3 categories × 3 items each

      testData.forEach((data: any) => {
        expect(data).toMatchObject({
          id: expect.stringContaining("synthetic-"),
          competencyCategory: expect.stringMatching(
            /code-quality|testing|documentation/
          ),
          competencyRow: "generated",
          source: "ai_generated",
          expectedLabels: expect.any(Array),
          content: expect.any(String),
          level: expect.objectContaining({
            level: expect.any(Number),
            name: expect.any(String),
          }),
          metadata: expect.objectContaining({
            generatedAt: expect.any(Date),
            model: "gpt-4",
          }),
        });
      });
    });
  });
});
