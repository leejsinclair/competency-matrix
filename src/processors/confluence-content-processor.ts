import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { RuleEngine } from "../processing/rule-engine";
import { ActivityEvent } from "../types/activity";

export interface ConfluencePage {
  id: string;
  title: string;
  space: string;
  content?: string;
  author: string;
  created: string;
  updated: string;
  labels?: string[];
  versionNumber?: number;
  body?: {
    storage?: {
      value?: string;
    };
  };
  history?: {
    lastUpdated?: {
      by?: {
        type?: string;
        accountId?: string;
        accountType?: string;
        email?: string;
        publicName?: string;
        displayName?: string;
        profilePicture?: any;
      };
      when?: string;
      message?: string;
      number?: number;
    };
    [key: string]: any; // Allow for other history properties
  };
  version?: {
    by?: {
      type?: string;
      accountId?: string;
      accountType?: string;
      email?: string;
      publicName?: string;
      displayName?: string;
      profilePicture?: any;
    };
    when?: string;
    number?: number;
  };
}

export interface ProcessedConfluencePage {
  original: ConfluencePage;
  classification: {
    labels: Array<{
      competencyCategory: string;
      competencyRow: string;
      level: any;
      confidence: number;
      evidence: string;
    }>;
    features: Array<{
      id: string;
      features: Record<string, number>;
      vector: number[];
      algorithm: string;
    }>;
  };
  contributionType: "created" | "edited";
  contributorInfo: {
    email: string;
    displayName?: string;
    contributionType: "created" | "edited";
  };
}

export class ConfluenceContentProcessor {
  private ruleEngine: RuleEngine;

  constructor() {
    this.ruleEngine = new RuleEngine();
  }

  async processConfluenceContent(
    inputDir: string,
    outputDir: string
  ): Promise<void> {
    console.log(`📄 Processing Confluence content from: ${inputDir}`);

    // Ensure output directory exists
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const allProcessedPages: ProcessedConfluencePage[] = [];

    // Check if input is a directory or single file
    if (existsSync(inputDir) && this.isDirectory(inputDir)) {
      // Read all space directories
      const spaceDirs = this.getSpaceDirectories(inputDir);

      for (const spaceDir of spaceDirs) {
        console.log(`📁 Processing space: ${spaceDir}`);
        const spacePages = this.processSpaceDirectory(join(inputDir, spaceDir));
        allProcessedPages.push(...spacePages);
      }
    } else {
      // Process single file
      console.log(`📄 Processing single file: ${inputDir}`);
      try {
        const fileContent = readFileSync(inputDir, { encoding: "utf8" });
        const confluencePage: ConfluencePage = JSON.parse(fileContent);
        const processedPage = this.processPage(confluencePage);
        allProcessedPages.push(processedPage);
      } catch (error) {
        console.error(`Error processing file ${inputDir}:`, error);
      }
    }

    // Generate contributor profiles
    const contributorProfiles =
      this.generateContributorProfiles(allProcessedPages);

    // Write processed pages
    this.writeProcessedPages(allProcessedPages, outputDir);

    // Write contributor profiles
    this.writeContributorProfiles(contributorProfiles, outputDir);

    // Write summary
    this.writeSummary(allProcessedPages, contributorProfiles, outputDir);

    console.log(`✅ Processed ${allProcessedPages.length} pages`);
    console.log(
      `👥 Generated ${contributorProfiles.length} contributor profiles`
    );
  }

  private isDirectory(path: string): boolean {
    try {
      const stats = require("fs").statSync(path);
      return stats.isDirectory();
    } catch (error) {
      return false;
    }
  }

  private getSpaceDirectories(inputDir: string): string[] {
    try {
      // Check if inputDir is a directory
      if (!this.isDirectory(inputDir)) {
        return [];
      }

      // Read directory contents to find space folders
      const fs = require("fs");
      const items = fs.readdirSync(inputDir);

      return items
        .filter((item) => {
          const itemPath = join(inputDir, item);
          const stats = fs.statSync(itemPath);
          return stats.isDirectory() && item !== "processed";
        })
        .filter((item) => !item.startsWith("."));
    } catch (error) {
      console.error("Error reading space directories:", error);
      return [];
    }
  }

  private processSpaceDirectory(spaceDir: string): ProcessedConfluencePage[] {
    const processedPages: ProcessedConfluencePage[] = [];

    try {
      const fs = require("fs");
      const items = fs.readdirSync(spaceDir);

      for (const item of items) {
        try {
          const itemPath = join(spaceDir, item);
          const stats = fs.statSync(itemPath);

          // Only process JSON files
          if (stats.isFile() && item.endsWith(".json")) {
            const fileContent = fs.readFileSync(itemPath, { encoding: "utf8" });
            const confluencePage: ConfluencePage = JSON.parse(fileContent);

            // Extract all contributors from this page
            const contributors = this.extractAllContributors(confluencePage);

            // Create processed page for each contributor
            for (const contributor of contributors) {
              const processedPage = this.createProcessedPageForContributor(
                confluencePage,
                contributor
              );
              processedPages.push(processedPage);
            }
          }
        } catch (error) {
          console.error(`Error processing file ${item}:`, error);
        }
      }
    } catch (error) {
      console.error(`Error reading space directory ${spaceDir}:`, error);
    }

    return processedPages;
  }

  private processPage(page: ConfluencePage): ProcessedConfluencePage {
    // Extract content from body.storage.value if available, otherwise use content field
    const content = page.body?.storage?.value || page.content || "";

    // Extract ALL contributors from history, not just the last one
    const contributors = this.extractAllContributors(page);

    // Create activity events for each contributor
    const processedContributors = contributors.map((contributor) => {
      const event: ActivityEvent = {
        id: page.id,
        type: "confluence-page",
        content: content,
        timestamp: page.updated,
        source: "confluence",
        actor: contributor.email,
        metadata: {
          title: page.title,
          space: page.space,
          labels: page.labels,
          version: page.versionNumber,
        },
      };

      // Classify using rule engine
      const classification = this.ruleEngine.processEvent(event);

      return {
        original: page,
        classification,
        contributionType: contributor.contributionType,
        contributorInfo: {
          email: contributor.email,
          displayName: contributor.displayName,
          contributionType: contributor.contributionType,
        },
      };
    });

    return processedContributors[0]; // Return the first (most recent) contributor for now
  }

  private extractAllContributors(page: ConfluencePage): Array<{
    email: string;
    displayName?: string;
    contributionType: "created" | "edited";
  }> {
    const contributors = new Map<string, any>();

    // Add the page creator
    if (page.author) {
      contributors.set(page.author, {
        email: page.author,
        displayName: page.author.split("@")[0], // Extract name from email
        contributionType: "created" as const,
      });
    }

    // Add contributors from history.lastUpdated
    if (
      page.history &&
      page.history.lastUpdated &&
      page.history.lastUpdated.by
    ) {
      const email =
        page.history.lastUpdated.by.email ||
        page.history.lastUpdated.by.publicName ||
        "unknown@example.com";
      const displayName =
        page.history.lastUpdated.by.displayName ||
        page.history.lastUpdated.by.publicName ||
        email?.split("@")[0] ||
        "Unknown";

      // Determine contribution type (if not the original creator, it's an edit)
      const contributionType = contributors.has(email) ? "edited" : "created";

      contributors.set(email, {
        email,
        displayName,
        contributionType,
      });
    }

    // Add the last updater from version info
    if (page.version && page.version.by) {
      const email =
        page.version.by.email ||
        page.version.by.publicName ||
        "unknown@example.com";
      const displayName =
        page.version.by.displayName ||
        page.version.by.publicName ||
        email?.split("@")[0] ||
        "Unknown";
      const contributionType = contributors.has(email) ? "edited" : "created";

      contributors.set(email, {
        email,
        displayName,
        contributionType,
      });
    }

    return Array.from(contributors.values());
  }

  private createProcessedPageForContributor(
    page: ConfluencePage,
    contributor: {
      email: string;
      displayName?: string;
      contributionType: "created" | "edited";
    }
  ): ProcessedConfluencePage {
    // Extract content from body.storage.value if available, otherwise use content field
    const content = page.body?.storage?.value || page.content || "";

    // Create activity event for classification
    const event: ActivityEvent = {
      id: page.id,
      type: "confluence-page",
      content: content,
      timestamp: page.updated,
      source: "confluence",
      actor: contributor.email,
      metadata: {
        title: page.title,
        space: page.space,
        labels: page.labels,
        version: page.versionNumber,
      },
    };

    // Classify using rule engine
    const classification = this.ruleEngine.processEvent(event);

    return {
      original: page,
      classification,
      contributionType: contributor.contributionType,
      contributorInfo: {
        email: contributor.email,
        displayName: contributor.displayName,
        contributionType: contributor.contributionType,
      },
    };
  }

  private generateContributorProfiles(pages: ProcessedConfluencePage[]): Array<{
    email: string;
    displayName?: string;
    competencyAreas: Array<{
      category: string;
      row: string;
      level: string;
      confidence: number;
      evidence: string;
    }>;
    totalCompetencies: number;
    topAreas: Array<{
      area: string;
      count: number;
      percentage: number;
    }>;
    contributionsByType: {
      created: number;
      edited: number;
    };
  }> {
    const profiles = new Map<string, any>();

    // Group by contributor email
    for (const page of pages) {
      const email = page.contributorInfo.email;
      const displayName = page.contributorInfo.displayName;

      if (!profiles.has(email)) {
        profiles.set(email, {
          email,
          displayName,
          competencyAreas: [],
          totalCompetencies: 0,
          topAreas: [],
          contributionsByType: {
            created: 0,
            edited: 0,
          },
        });
      }

      const profile = profiles.get(email);

      // Track contribution types
      if (page.contributionType === "created") {
        profile.contributionsByType.created++;
      } else {
        profile.contributionsByType.edited++;
      }

      // Add classification results
      for (const label of page.classification.labels) {
        const competencyArea = {
          category: label.competencyCategory,
          row: label.competencyRow,
          level: label.level.name || "Unknown",
          confidence: label.confidence,
          evidence: label.evidence,
        };

        // Avoid duplicates
        const exists = profile.competencyAreas.some(
          (area) =>
            area.category === competencyArea.category &&
            area.row === competencyArea.row
        );

        if (!exists) {
          profile.competencyAreas.push(competencyArea);
          profile.totalCompetencies++;
        }
      }
    }

    // Calculate top areas for each profile
    for (const profile of profiles.values()) {
      const areaCounts = new Map<string, number>();

      for (const area of profile.competencyAreas) {
        const key = `${area.category}/${area.row}`;
        areaCounts.set(key, (areaCounts.get(key) || 0) + 1);
      }

      profile.topAreas = Array.from(areaCounts.entries())
        .map(([area, count]) => ({
          area,
          count,
          percentage: (count / profile.totalCompetencies) * 100,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    }

    return Array.from(profiles.values());
  }

  private writeProcessedPages(
    pages: ProcessedConfluencePage[],
    outputDir: string
  ): void {
    const outputPath = join(outputDir, "processed-pages.json");
    const data = JSON.stringify(pages, null, 2);
    writeFileSync(outputPath, data);
    console.log(`📄 Wrote processed pages to: ${outputPath}`);
  }

  private writeContributorProfiles(profiles: any[], outputDir: string): void {
    const outputPath = join(outputDir, "contributor-profiles.json");
    writeFileSync(outputPath, JSON.stringify(profiles, null, 2));
    console.log(`👥 Wrote contributor profiles to: ${outputPath}`);
  }

  private writeSummary(
    pages: ProcessedConfluencePage[],
    profiles: any[],
    outputDir: string
  ): void {
    const summary = {
      generatedAt: new Date().toISOString(),
      totalPages: pages.length,
      totalContributors: profiles.length,
      totalClassifications: pages.reduce(
        (sum, page) => sum + page.classification.labels.length,
        0
      ),
      topCompetencyAreas: this.getTopCompetencyAreas(pages),
      averageCompetenciesPerContributor:
        profiles.length > 0
          ? profiles.reduce(
              (sum, profile) => sum + profile.totalCompetencies,
              0
            ) / profiles.length
          : 0,
      contributorsByContributionType: profiles
        .map((profile) => ({
          email: profile.email,
          displayName: profile.displayName,
          totalCompetencies: profile.totalCompetencies,
          contributionsByType: profile.contributionsByType,
          topAreas: profile.topAreas.slice(0, 3),
        }))
        .sort((a, b) => b.totalCompetencies - a.totalCompetencies)
        .slice(0, 10),
    };

    const outputPath = join(outputDir, "processing-summary.json");
    writeFileSync(outputPath, JSON.stringify(summary, null, 2));
    console.log(`📊 Wrote summary to: ${outputPath}`);
  }

  private getTopCompetencyAreas(pages: ProcessedConfluencePage[]): Array<{
    area: string;
    count: number;
    category: string;
    row: string;
  }> {
    const areaCounts = new Map<
      string,
      { count: number; category: string; row: string }
    >();

    for (const page of pages) {
      for (const label of page.classification.labels) {
        const key = `${label.competencyCategory}/${label.competencyRow}`;
        const current = areaCounts.get(key) || {
          count: 0,
          category: label.competencyCategory,
          row: label.competencyRow,
        };
        current.count++;
        areaCounts.set(key, current);
      }
    }

    return Array.from(areaCounts.entries())
      .map(([area, data]) => ({
        area,
        count: data.count,
        category: data.category,
        row: data.row,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }
}
