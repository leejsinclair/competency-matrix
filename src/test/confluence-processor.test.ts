import { ConfluenceContentProcessor } from '../processors/confluence-content-processor';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

describe('Confluence Content Processor', () => {
  let processor: ConfluenceContentProcessor;
  let testDir: string;

  beforeEach(() => {
    processor = new ConfluenceContentProcessor();
    testDir = join(__dirname, '../../test-data/confluence');
    
    // Create test directory structure
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
  });

  test('should process sample confluence content', async () => {
    // Create sample page
    const samplePage = {
      id: '12345',
      title: 'Java Microservices Architecture Guide',
      space: 'ABT',
      content: 'This guide covers building microservices using Java and Spring Boot. We explore Docker containerization and Kubernetes deployment strategies. The architecture follows domain-driven design principles with event-driven patterns. We also cover testing strategies including unit testing and integration testing approaches.',
      author: 'john.doe@company.com',
      created: '2024-01-15T10:00:00Z',
      updated: '2024-01-20T15:30:00Z',
      labels: ['architecture', 'java', 'microservices'],
      version: 5
    };

    // Write sample page
    const pagePath = join(testDir, 'sample-page.json');
    writeFileSync(pagePath, JSON.stringify(samplePage, null, 2));

    // Create space directory listing
    const spaceListPath = join(testDir, '..', 'confluence-spaces.txt');
    writeFileSync(spaceListPath, 'ABT\nTEST\n');

    // Process the content
    const outputDir = join(testDir, 'processed');
    await processor.processConfluenceContent(testDir, outputDir);

    // Verify results
    const processedPagesPath = join(outputDir, 'processed-pages.json');
    const processedPages = JSON.parse(require('fs').readFileSync(processedPagesPath, 'utf8'));

    expect(processedPages).toHaveLength(1);
    expect(processedPages[0].original.title).toBe('Java Microservices Architecture Guide');
    expect(processedPages[0].classification.labels).toHaveLength(5); // Java, microservices, Docker, Kubernetes, testing
    expect(processedPages[0].contributorProfile.author).toBe('john.doe@company.com');
    expect(processedPages[0].contributorProfile.totalCompetencies).toBeGreaterThan(0);

    // Check specific classifications
    const labels = processedPages[0].classification.labels;
    const categories = labels.map((label: any) => label.competencyCategory);
    expect(categories).toContain('programming-languages'); // Java
    expect(categories).toContain('architecture-design'); // microservices, domain-driven design
    expect(categories).toContain('containers-orchestration'); // Docker, Kubernetes
    expect(categories).toContain('testing-quality'); // unit testing, integration testing
  });
});
