import fs from "fs/promises";
import path from "path";
import { ProcessingConfig, Processor } from "../processing/processor";
import { ProcessingResult } from "../processing/types";
import { LocalFsArtifactStore } from "../storage/local-fs-artifact-store";
import { ActivityEvent } from "../types/activity";

export interface LocalProcessingOptions {
  dataSource: "confluence" | "jira" | "bitbucket";
  dataPath?: string;
  enableRuleEngine?: boolean;
  enableMLProcessor?: boolean;
}

export class LocalDataProcessor {
  private processor: Processor;
  private artifactStore: LocalFsArtifactStore;

  constructor() {
    this.artifactStore = new LocalFsArtifactStore("./artifacts");

    const config: ProcessingConfig = {
      enableRuleEngine: true,
      enableMLProcessor: false,
    };

    this.processor = new Processor(config, this.artifactStore);
  }

  async processLocalData(options: LocalProcessingOptions): Promise<{
    summary: any;
    results: ProcessingResult[];
    events: ActivityEvent[];
  }> {
    console.log(`🔄 Processing local ${options.dataSource} data...`);

    let events: ActivityEvent[] = [];
    let allResults: ProcessingResult[] = [];

    switch (options.dataSource) {
      case "confluence":
        events = await this.loadConfluenceData(options.dataPath);
        break;
      case "jira":
        events = await this.loadJiraData(options.dataPath);
        break;
      case "bitbucket":
        events = await this.loadBitbucketData(options.dataPath);
        break;
      default:
        throw new Error(`Unsupported data source: ${options.dataSource}`);
    }

    console.log(`📊 Loaded ${events.length} events from local data`);

    // Process events in batches to avoid memory issues
    const batchSize = 50;
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      console.log(
        `🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(events.length / batchSize)} (${batch.length} events)`
      );

      const result = await this.processor.processEvents(batch);
      allResults.push(result);
    }

    // Aggregate all results
    const aggregatedResults = this.aggregateResults(allResults);

    const summary = {
      dataSource: options.dataSource,
      totalEvents: events.length,
      processedEvents: events.length,
      labelsGenerated: aggregatedResults.labels.length,
      errors: aggregatedResults.errors.length,
      processingTime: Date.now(),
      competencyCategories: [
        ...new Set(aggregatedResults.labels.map((l) => l.competencyCategory)),
      ],
      topCompetencyAreas: this.getTopCompetencyAreas(aggregatedResults.labels),
      contributors: this.getContributorStats(events, aggregatedResults.labels),
    };

    return {
      summary,
      results: allResults,
      events,
    };
  }

  private async loadConfluenceData(
    dataPath?: string
  ): Promise<ActivityEvent[]> {
    const defaultPath = "./_content/confluence";
    const basePath = dataPath || defaultPath;

    const events: ActivityEvent[] = [];

    try {
      // Load processed pages from the real Confluence data
      const pagesPath = path.join(basePath, "processed/processed-pages.json");
      const pagesData = await fs.readFile(pagesPath, "utf-8");
      const pages = JSON.parse(pagesData);

      console.log(`📚 Loading ${pages.length} Confluence pages...`);

      if (Array.isArray(pages) && pages.length > 0) {
        for (const page of pages) {
          if (page.original && page.original.content) {
            const event: ActivityEvent = {
              id: `confluence-${page.original.id}`,
              source: "confluence",
              timestamp:
                page.original.createdAt ||
                page.original.updatedAt ||
                new Date().toISOString(),
              actor:
                page.original.author?.displayName ||
                page.original.author?.accountId ||
                "unknown",
              type: "page_updated",
              metadata: {
                pageId: page.original.id,
                title: page.original.title,
                space: page.original.space?.key || "UNKNOWN",
                labels: page.original.metadata?.labels || [],
                version: page.original.version?.number || 1,
                url: page.original._links?.webui || "",
              },
              content: page.original.content || "",
            };

            events.push(event);
          }
        }
      }

      console.log(`✅ Successfully loaded ${events.length} Confluence events`);
    } catch (error) {
      console.error("Failed to load Confluence data:", error);
      throw new Error(`Failed to load Confluence data from ${basePath}`);
    }

    return events;
  }

  private async loadJiraData(_dataPath?: string): Promise<ActivityEvent[]> {
    // TODO: Implement Jira data loading
    console.log("Jira data loading not yet implemented");
    return [];
  }

  private async loadBitbucketData(
    _dataPath?: string
  ): Promise<ActivityEvent[]> {
    // TODO: Implement Bitbucket data loading
    console.log("Bitbucket data loading not yet implemented");
    return [];
  }

  private aggregateResults(results: ProcessingResult[]): ProcessingResult {
    const aggregated: ProcessingResult = {
      events: [],
      labels: [],
      features: [],
      errors: [],
    };

    for (const result of results) {
      aggregated.events.push(...result.events);
      aggregated.labels.push(...result.labels);
      aggregated.features.push(...result.features);
      aggregated.errors.push(...result.errors);
    }

    // Deduplicate labels
    aggregated.labels = this.deduplicateLabels(aggregated.labels);

    return aggregated;
  }

  private deduplicateLabels(labels: any[]): any[] {
    const seen = new Set();
    return labels.filter((label) => {
      const key = `${label.eventId}-${label.competencyCategory}-${label.competencyRow}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private getTopCompetencyAreas(labels: any[]): any[] {
    const categoryCounts: Record<string, number> = {};

    for (const label of labels) {
      categoryCounts[label.competencyCategory] =
        (categoryCounts[label.competencyCategory] || 0) + 1;
    }

    return Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));
  }

  private getContributorStats(events: ActivityEvent[], labels: any[]): any[] {
    const contributorStats: Record<string, any> = {};

    // Initialize contributors from events
    for (const event of events) {
      const actor = event.actor || "unknown";
      if (!contributorStats[actor]) {
        contributorStats[actor] = {
          actor: actor,
          events: 0,
          labels: [],
          competencyAreas: new Set(),
        };
      }
      contributorStats[actor].events++;
    }

    // Add labels to contributors
    for (const label of labels) {
      const event = events.find((e) => e.id === label.eventId);
      if (event) {
        const actor = event.actor || "unknown";
        if (contributorStats[actor]) {
          contributorStats[actor].labels.push(label);
          contributorStats[actor].competencyAreas.add(label.competencyCategory);
        }
      }
    }

    // Convert Sets to Arrays and calculate scores
    return Object.values(contributorStats)
      .map((stat: any) => ({
        actor: stat.actor,
        events: stat.events,
        labelsGenerated: stat.labels.length,
        competencyAreas: Array.from(stat.competencyAreas),
        averageConfidence:
          stat.labels.length > 0
            ? stat.labels.reduce(
                (sum: number, l: any) => sum + l.confidence,
                0
              ) / stat.labels.length
            : 0,
        topCompetency: this.getTopCompetencyForContributor(stat.labels),
      }))
      .sort((a, b) => b.labelsGenerated - a.labelsGenerated);
  }

  private getTopCompetencyForContributor(labels: any[]): string {
    const categoryCounts: Record<string, number> = {};

    for (const label of labels) {
      categoryCounts[label.competencyCategory] =
        (categoryCounts[label.competencyCategory] || 0) + 1;
    }

    const top = Object.entries(categoryCounts).sort(([, a], [, b]) => b - a)[0];
    return top ? top[0] : "None";
  }

  async saveProcessingResults(
    results: any,
    outputPath: string = "./test-data/processed-results.json"
  ): Promise<void> {
    try {
      await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
      console.log(`💾 Processing results saved to ${outputPath}`);
    } catch (error) {
      console.error("Failed to save processing results:", error);
    }
  }
}
