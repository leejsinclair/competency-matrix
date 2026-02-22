#!/usr/bin/env ts-node

/**
 * Competency Assessment Runner
 *
 * Usage:
 * npm run assessment:full          - Run full assessment of all categories
 * npm run assessment:category <name> - Run assessment for specific category
 * npm run assessment:level <1-5>    - Run assessment for specific competency level
 */

import { runAssessmentCommand } from "./assessment-runner-simple";

async function main() {
  const args = process.argv.slice(2);
  const type = args[0];
  const target = args[1];

  if (!type || !["full", "category", "level"].includes(type)) {
    console.log(`
Usage: npm run assessment <type> [target]

Types:
  full                    - Run complete assessment of all categories
  category <name>         - Run assessment for specific category
  level <1-5>            - Run assessment for specific competency level

Examples:
  npm run assessment full
  npm run assessment category "Writing code"
  npm run assessment level 3
    `);
    process.exit(1);
  }

  if (type === "category" && !target) {
    console.error("Category name is required for category assessment");
    process.exit(1);
  }

  if (
    type === "level" &&
    (!target ||
      isNaN(parseInt(target)) ||
      parseInt(target) < 1 ||
      parseInt(target) > 5)
  ) {
    console.error(
      "Level must be a number between 1 and 5 for level assessment"
    );
    process.exit(1);
  }

  try {
    await runAssessmentCommand(type as "full" | "category" | "level", target);
  } catch (error) {
    console.error("Assessment failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
