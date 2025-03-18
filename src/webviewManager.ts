import * as vscode from "vscode";
import { HtmlProcessor } from "./htmlProcessor";
import { SettingsManager } from "./settingsManager";
import { getWebviewScripts } from "./utils/domUtils";
import { getTransformedLocalhostUrl, ensureProtocol, isValidUrl } from "./utils/uriUtils";

/**
 * Manages the creation and lifecycle of webviews for HTML selection
 */
export class WebviewManager {
  private context: vscode.ExtensionContext;
  private settingsManager: SettingsManager;
  private htmlProcessor: HtmlProcessor;
  
  /**
   * Creates a new instance of WebviewManager
   * @param context The extension context
   * @param settingsManager The settings manager instance
   */
  constructor(context: vscode.ExtensionContext, settingsManager: SettingsManager) {
    this.context = context;
    this.settingsManager = settingsManager;
    this.htmlProcessor = new HtmlProcessor(settingsManager);
  }
  
  /**
   * Opens a webview with static HTML content for element selection
   */
  public async openStaticHtmlSelector(): Promise<void> {
    const panel = this.createWebviewPanel("staticHtmlSelector", "DOM2Code: HTML Selector");
    panel.webview.html = this.getStaticHtmlContent(panel.webview);
    this.setupMessageHandling(panel);
  }
  
  /**
   * Opens a webview with content from a specified URL
   * @param url The URL to load in the webview
   */
  public async openWithUrl(url: string): Promise<void> {
    // Validate URL
    if (!url || !isValidUrl(ensureProtocol(url))) {
      vscode.window.showErrorMessage("Invalid URL format. Please enter a valid URL.");
      return;
    }
    
    const formattedUrl = ensureProtocol(url);
    console.log("Opening with URL:", formattedUrl);
    
    const panel = this.createWebviewPanel("localhostViewer", `DOM2Code: ${formattedUrl}`);
    
    try {
      // Transform the URL for webview access
      const transformedUrl = await getTransformedLocalhostUrl(formattedUrl);
      console.log("Transformed URL:", transformedUrl);
      
      panel.webview.html = this.getLocalhostContent(transformedUrl, panel.webview);
      this.setupMessageHandling(panel);
      
      // Log when the webview is ready
      panel.webview.onDidReceiveMessage(
        message => {
          if (message.command === "webviewReady") {
            console.log("Webview ready, iframe should be loading content from:", transformedUrl);
          }
        }
      );
    } catch (error) {
      console.error("Failed to load URL:", error);
      vscode.window.showErrorMessage(`Failed to load URL: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Opens a direct view of a URL (not in an iframe) for troubleshooting
   * @param url The URL to load directly in the webview
   */
  public async openDirectView(url: string): Promise<void> {
    // Validate URL
    if (!url || !isValidUrl(ensureProtocol(url))) {
      vscode.window.showErrorMessage("Invalid URL format. Please enter a valid URL.");
      return;
    }
    
    const formattedUrl = ensureProtocol(url);
    console.log("Opening direct view with URL:", formattedUrl);
    
    const panel = this.createWebviewPanel("directViewer", `DOM2Code Direct: ${formattedUrl}`);
    
    try {
      // Transform the URL for webview access
      const transformedUrl = await getTransformedLocalhostUrl(formattedUrl);
      console.log("Transformed URL for direct view:", transformedUrl);
      
      // Instead of loading in an iframe, redirect the entire webview to the URL
      panel.webview.html = this.getDirectViewContent(transformedUrl);
      
      // Inform the user about the direct view mode
      vscode.window.showInformationMessage(
        "Direct view mode: HTML selection is not available. This mode is for troubleshooting only."
      );
    } catch (error) {
      console.error("Failed to load URL:", error);
      vscode.window.showErrorMessage(`Failed to load URL: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Creates a webview panel with appropriate configuration
   * @param viewType The type of webview
   * @param title The title of the webview panel
   * @returns The created webview panel
   */
  private createWebviewPanel(viewType: string, title: string): vscode.WebviewPanel {
    // Get all the port mappings from settings
    const portMappings = this.settingsManager.getActivePortMappings();
    
    console.log("Using port mappings:", JSON.stringify(portMappings));
    
    return vscode.window.createWebviewPanel(
      viewType,
      title,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(this.context.extensionUri, "media")
        ],
        portMapping: portMappings,
        // Added specific configuration to allow localhost access
        enableCommandUris: true,
        enableFindWidget: true
      }
    );
  }
  
  /**
   * Sets up message handling for the webview
   * @param panel The webview panel
   */
  private setupMessageHandling(panel: vscode.WebviewPanel): void {
    panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case "injectHTML":
            await this.injectHtml(message.html);
            break;
          case "showNotification":
            vscode.window.showInformationMessage(message.text);
            break;
        }
      },
      undefined,
      this.context.subscriptions
    );
  }
  
  /**
   * Injects HTML into the active editor
   * @param html The HTML to inject
   */
  private async injectHtml(html: string): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      // Process HTML before injection (formatting, etc.)
      const processedHtml = this.htmlProcessor.process(html);
      
      await editor.edit(editBuilder => {
        editBuilder.insert(editor.selection.active, processedHtml);
      });
      
      vscode.window.showInformationMessage("HTML injected successfully");
    } else {
      vscode.window.showErrorMessage("No active editor found");
    }
  }
  
  /**
   * Gets the stylesheet URI for webview content
   * @param webview The webview to get the URI for
   * @returns The URI of the stylesheet
   */
  private getStylesheetUri(webview: vscode.Webview): string {
    const styleUri = vscode.Uri.joinPath(this.context.extensionUri, "media", "styles.css");
    return webview.asWebviewUri(styleUri).toString();
  }
  
  /**
   * Returns the HTML content for the static HTML selector
   * @param webview The webview to generate content for
   * @returns HTML content as a string
   */
  private getStaticHtmlContent(webview: vscode.Webview): string {
    const styleUri = this.getStylesheetUri(webview);
    const highlightColor = this.settingsManager.getSelectionHighlightColor();
    
    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>HTML Selector</title>
        <link rel="stylesheet" href="${styleUri}">
        <style>
          .highlight { outline: 2px solid ${highlightColor} !important; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>DOM2Code HTML Selector</h1>
          <p>Click on any element below to select and inject its HTML</p>
        </div>
        
        <div class="selection-area">
          <!-- Sample elements for selection -->
          <h2>Sample Components</h2>
          <button class="btn">Button</button>
          <div class="card">
            <h3>Card Title</h3>
            <p>Card content goes here...</p>
          </div>
          <ul class="list">
            <li>Item 1</li>
            <li>Item 2</li>
            <li>Item 3</li>
          </ul>
          
          <div class="form-group">
            <label for="input">Input Field</label>
            <input type="text" id="input" placeholder="Enter text here">
          </div>
          
          <div class="alert">
            <strong>Alert!</strong> This is an alert message.
          </div>
        </div>
        
        ${getWebviewScripts()}
      </body>
      </html>`;
  }
  
  /**
   * Returns the HTML content for the localhost viewer
   * @param url The URL to embed in an iframe
   * @param webview The webview to generate content for
   * @returns HTML content as a string
   */
  private getLocalhostContent(url: string, webview: vscode.Webview): string {
    const styleUri = this.getStylesheetUri(webview);
    const highlightColor = this.settingsManager.getSelectionHighlightColor();
    
    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Localhost Viewer</title>
        <link rel="stylesheet" href="${styleUri}">
        <style>
          .error-container {
            padding: 20px;
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
            border-radius: 4px;
            margin: 20px 0;
            display: none;
          }
          .debug-info {
            background-color: #f8f9fa;
            border: 1px solid #ddd;
            padding: 10px;
            margin-top: 10px;
            font-family: monospace;
            font-size: 12px;
            white-space: pre-wrap;
            overflow: auto;
            max-height: 100px;
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; height: 100vh; overflow: hidden;">
        <div class="toolbar">
          <button id="toggle-selection">Enable Selection</button>
          <span id="selection-status">Selection disabled</span>
          <span id="loading-status" style="margin-left: auto;">Loading...</span>
        </div>
        
        <div class="error-container" id="error-container">
          <h3>Error Loading Content</h3>
          <p id="error-message"></p>
          <div class="debug-info">
            <strong>URL:</strong> ${url}
          </div>
        </div>
        
        <iframe src="${url}" id="content-frame"></iframe>
        
        <script>
          const vscode = acquireVsCodeApi();
          const toggleBtn = document.getElementById("toggle-selection");
          const status = document.getElementById("selection-status");
          const loadingStatus = document.getElementById("loading-status");
          const iframe = document.getElementById("content-frame");
          const errorContainer = document.getElementById("error-container");
          const errorMessage = document.getElementById("error-message");
          let selectionEnabled = false;
          
          // Send a message that the webview is ready
          vscode.postMessage({ command: "webviewReady" });
          
          // Handle iframe loading events
          iframe.onload = () => {
            loadingStatus.textContent = "Loaded";
            loadingStatus.style.color = "green";
            
            try {
              // Check if we can access the iframe content
              const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
              // If we got here, we can access the iframe content
            } catch (error) {
              showError("Cannot access iframe content due to security restrictions. This typically happens with Cross-Origin Resource Sharing (CORS) policies.");
            }
          };
          
          iframe.onerror = (error) => {
            showError("Failed to load content: " + error.message);
          };
          
          // Handle load failures
          setTimeout(() => {
            if (loadingStatus.textContent === "Loading...") {
              // If still loading after 5 seconds, show a message
              loadingStatus.textContent = "Slow to load...";
              loadingStatus.style.color = "orange";
            }
          }, 5000);
          
          function showError(message) {
            errorContainer.style.display = "block";
            errorMessage.textContent = message;
            loadingStatus.textContent = "Error";
            loadingStatus.style.color = "red";
          }
          
          toggleBtn.addEventListener("click", () => {
            selectionEnabled = !selectionEnabled;
            status.textContent = selectionEnabled ? "Selection enabled" : "Selection disabled";
            toggleBtn.textContent = selectionEnabled ? "Disable Selection" : "Enable Selection";
            
            if (selectionEnabled) {
              setupIframeSelection();
            } else {
              removeIframeSelection();
            }
          });
          
          function setupIframeSelection() {
            try {
              const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
              
              // Add click event listener to the iframe's document
              iframeDoc.addEventListener("click", handleElementSelection);
              
              // Add hover highlight effect
              const style = iframeDoc.createElement("style");
              style.id = "dom2code-styles";
              style.textContent = '*:hover { outline: 2px dashed ${highlightColor} !important; }';
              iframeDoc.head.appendChild(style);
              
              vscode.postMessage({
                command: "showNotification",
                text: "Selection mode enabled. Click on any element to select it."
              });
            } catch (error) {
              showError("Cannot access iframe content. This is typically due to Cross-Origin Resource Sharing (CORS) restrictions. Try accessing a page that allows iframe embedding.");
              vscode.postMessage({
                command: "showNotification",
                text: "Error: Cannot access iframe content. Site may block frame access."
              });
            }
          }
          
          function removeIframeSelection() {
            try {
              const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
              iframeDoc.removeEventListener("click", handleElementSelection);
              
              const style = iframeDoc.getElementById("dom2code-styles");
              if (style) {
                style.remove();
              }
            } catch (error) {
              // Ignore errors when removing
            }
          }
          
          function handleElementSelection(event) {
            if (!selectionEnabled) return;
            
            event.preventDefault();
            event.stopPropagation();
            
            const selectedHTML = event.target.outerHTML;
            
            vscode.postMessage({
              command: "injectHTML",
              html: selectedHTML
            });
            
            return false;
          }
        </script>
      </body>
      </html>`;
  }
  
  /**
   * Returns the HTML content for the direct viewer
   * @param url The URL to redirect to
   * @returns HTML content as a string
   */
  private getDirectViewContent(url: string): string {
    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Direct View</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            text-align: center;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .info {
            margin: 20px auto;
            max-width: 600px;
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .redirect {
            margin-top: 20px;
            font-size: 1.2em;
          }
          .url {
            font-family: monospace;
            background-color: #f5f5f5;
            padding: 5px 10px;
            border-radius: 4px;
            word-break: break-all;
          }
        </style>
      </head>
      <body>
        <div class="info">
          <h1>DOM2Code Direct View</h1>
          <p>This is a direct view mode for troubleshooting localhost connections.</p>
          <p>You will be redirected to the URL:</p>
          <p class="url">${url}</p>
          <p class="redirect">Redirecting in <span id="countdown">3</span> seconds...</p>
        </div>
        
        <script>
          // Countdown for redirection
          let count = 3;
          const countdownEl = document.getElementById('countdown');
          
          const interval = setInterval(() => {
            count--;
            countdownEl.textContent = count;
            
            if (count <= 0) {
              clearInterval(interval);
              window.location.href = "${url}";
            }
          }, 1000);
        </script>
      </body>
      </html>`;
  }
} 