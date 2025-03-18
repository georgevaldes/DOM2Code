import * as vscode from "vscode";
import { runTests } from "./extension.test";

/**
 * Main entry point for running tests
 */
export async function main(): Promise<void> {
  try {
    // Run the extension tests
    await runTests();
  } catch (err) {
    console.error("Failed to run tests:", err);
    process.exit(1);
  }
}

// Run the main function if this script is executed directly
if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
} 