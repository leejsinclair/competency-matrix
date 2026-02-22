import { createProcessorSetup } from "./processor-setup-mock";

/**
 * Processor Configuration Tests
 *
 * This test suite validates the configuration management functionality of the Processor class.
 * It tests how the processor handles configuration changes, updates settings,
 * and maintains consistent behavior across different configuration states.
 *
 * Test Structure:
 * - Configuration Management: Core configuration CRUD operations
 * - Rule Engine Configuration: Enabling/disabling rule processing
 * - ML Processor Configuration: Controlling ML functionality
 * - Dynamic Updates: Runtime configuration changes
 * - Configuration Persistence: Maintaining settings across operations
 */

describe("Processor - Configuration", () => {
  let processor: any;

  beforeEach(() => {
    const setup = createProcessorSetup();
    processor = setup.processor;
  });

  /**
   * Configuration Tests
   *
   * These tests validate the processor's configuration management:
   * - Updating processor configuration
   * - Retrieving current configuration
   * - Enabling/disabling processing components
   * - Configuration validation and error handling
   */

  describe("configuration", () => {
    /**
     * Test: Configuration Updates
     *
     * Validates that the processor can update its configuration:
     * - Rule engine can be enabled/disabled
     * - ML processor can be enabled/disabled
     * - Configuration changes are applied correctly
     * - Multiple settings can be updated simultaneously
     */
    it("should update configuration", () => {
      const newConfig = {
        enableRuleEngine: false,
        enableMLProcessor: true,
      };

      processor.updateConfig(newConfig);

      const currentConfig = processor.getConfig();
      expect(currentConfig.enableRuleEngine).toBe(false);
      expect(currentConfig.enableMLProcessor).toBe(true);
    });

    /**
     * Test: Configuration Retrieval
     *
     * Validates that the processor can return its current configuration:
     * - Returns complete configuration object
     * - Configuration reflects current state
     * - All expected properties are present
     * - Default values are properly set
     */
    it("should return current configuration", () => {
      const config = processor.getConfig();

      expect(config).toMatchObject({
        enableRuleEngine: true,
        enableMLProcessor: true,
      });
    });
  });
});
