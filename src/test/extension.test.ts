import * as assert from "assert";
import * as vscode from "vscode";
import { HtmlProcessor } from "../htmlProcessor";
import { SettingsManager } from "../settingsManager";

// Sample HTML for testing
const sampleHtml = `<div class="container"><h1>Title</h1><p>Paragraph content</p></div>`;

/**
 * Simple function to run all extension tests
 */
export async function runTests(): Promise<void> {
  try {
    await testExtensionPresence();
    await testCommandsRegistered();
    testHtmlProcessor();
    
    console.log("All tests passed!");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

/**
 * Verifies that the extension is present
 */
async function testExtensionPresence(): Promise<void> {
  const extension = vscode.extensions.getExtension("dom2code");
  assert.ok(extension, "Extension should be present");
}

/**
 * Verifies that commands are registered
 */
async function testCommandsRegistered(): Promise<void> {
  const commands = await vscode.commands.getCommands();
  assert.ok(commands.includes("dom2code.openSelector"), "openSelector command should be registered");
  assert.ok(commands.includes("dom2code.openWithUrl"), "openWithUrl command should be registered");
}

/**
 * Tests the HTML Processor
 */
function testHtmlProcessor(): void {
  const settingsManager = new SettingsManager();
  const htmlProcessor = new HtmlProcessor(settingsManager);
  
  // Test the process method with default settings
  const processedHtml = htmlProcessor.process(sampleHtml);
  assert.ok(processedHtml.includes("<div"), "Processed HTML should include div tag");
  assert.ok(processedHtml.includes("<h1>"), "Processed HTML should include h1 tag");
  assert.ok(processedHtml.includes("<p>"), "Processed HTML should include p tag");
} 