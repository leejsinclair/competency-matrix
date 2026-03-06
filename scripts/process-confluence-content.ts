#!/usr/bin/env node

import { ConfluenceContentProcessor } from "../src/processors/confluence-content-processor";

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log("Usage: npm run process:confluence <input-dir> <output-dir>");
    console.log(
      "Example: npm run process:confluence _content/confluence _content/confluence/processed"
    );
    process.exit(1);
  }

  const inputDir = args[0];
  const outputDir = args[1];

  console.log("🚀 Starting Confluence content processing...");

  const processor = new ConfluenceContentProcessor();

  try {
    await processor.processConfluenceContent(inputDir, outputDir);
    console.log("✅ Processing completed successfully!");
  } catch (error) {
    console.error("❌ Processing failed:", error);
    process.exit(1);
  }
}

main();
