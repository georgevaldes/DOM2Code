import * as vscode from "vscode";

/**
 * Manages extension configuration settings
 */
export class SettingsManager {
  /**
   * Gets the default localhost URL from user settings
   * @returns The configured default localhost URL or http://localhost:3000 if not set
   */
  public getDefaultLocalhostUrl(): string {
    return vscode.workspace
      .getConfiguration("dom2code")
      .get("defaultLocalhostUrl", "http://localhost:3000");
  }
  
  /**
   * Gets the HTML formatting option from user settings
   * @returns The HTML formatting style preference
   */
  public getHtmlFormatOption(): "pretty" | "minified" | "raw" {
    return vscode.workspace
      .getConfiguration("dom2code")
      .get("htmlFormatting", "pretty");
  }
  
  /**
   * Gets the selection highlight color from user settings
   * @returns The configured highlight color or default blue
   */
  public getSelectionHighlightColor(): string {
    return vscode.workspace
      .getConfiguration("dom2code")
      .get("selectionHighlightColor", "#007bff");
  }
  
  /**
   * Gets the configured port mappings for localhost connections
   * @returns Array of port mapping objects
   */
  public getActivePortMappings(): Array<{ webviewPort: number; extensionHostPort: number }> {
    return vscode.workspace
      .getConfiguration("dom2code")
      .get("portMappings", [
        { webviewPort: 3000, extensionHostPort: 3000 },
        { webviewPort: 8080, extensionHostPort: 8080 }
      ]);
  }
  
  /**
   * Gets the WebSocket server port
   * @returns The configured server port or default
   */
  public getServerPort(): number {
    return vscode.workspace
      .getConfiguration("dom2code")
      .get("serverPort", 54321);
  }
  
  /**
   * Updates extension settings
   * @param key The setting key
   * @param value The new setting value
   */
  public async updateSetting(key: string, value: any): Promise<void> {
    await vscode.workspace
      .getConfiguration("dom2code")
      .update(key, value, vscode.ConfigurationTarget.Global);
  }
} 