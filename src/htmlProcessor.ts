import { SettingsManager } from "./settingsManager";

/**
 * Processes HTML content before it is injected into the editor
 */
export class HtmlProcessor {
  private settingsManager: SettingsManager;
  
  /**
   * Creates a new instance of HtmlProcessor
   * @param settingsManager The settings manager instance
   */
  constructor(settingsManager: SettingsManager) {
    this.settingsManager = settingsManager;
  }
  
  /**
   * Processes HTML according to user formatting preferences
   * @param html The raw HTML to process
   * @returns Processed HTML according to formatting preferences
   */
  public process(html: string): string {
    const formatOption = this.settingsManager.getHtmlFormatOption();
    
    switch (formatOption) {
      case "pretty":
        return this.formatHtml(html);
      case "minified":
        return this.minifyHtml(html);
      case "raw":
      default:
        return html;
    }
  }
  
  /**
   * Formats HTML with proper indentation
   * @param html The HTML to format
   * @returns Formatted HTML with proper indentation
   */
  private formatHtml(html: string): string {
    // Simple HTML formatting logic
    // In a real implementation, use a proper HTML formatter library
    let formatted = "";
    let indent = 0;
    
    // Split by < to get tags and content
    const parts = html.split("<");
    
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] === "") continue;
      
      const isSelfClosing = parts[i].indexOf("/>") !== -1;
      const isClosingTag = parts[i].indexOf("/") === 0;
      
      // Adjust indent based on tag type
      if (isClosingTag) {
        indent -= 2;
      }
      
      // Add indentation
      formatted += " ".repeat(Math.max(0, indent)) + "<" + parts[i];
      
      // Add newline if not a self-closing tag and not the last part
      if (i < parts.length - 1) {
        formatted += "\n";
      }
      
      // Adjust indent for next tag
      if (!isClosingTag && !isSelfClosing) {
        indent += 2;
      }
    }
    
    return formatted;
  }
  
  /**
   * Minifies HTML by removing unnecessary whitespace
   * @param html The HTML to minify
   * @returns Minified HTML
   */
  private minifyHtml(html: string): string {
    // Simple minification
    // Remove whitespace between tags
    return html
      .replace(/>\s+</g, "><")
      .replace(/\s{2,}/g, " ")
      .trim();
  }
} 