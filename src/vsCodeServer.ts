import * as vscode from "vscode";
import * as WebSocket from "ws";
import { HtmlProcessor } from "./htmlProcessor";
import { SettingsManager } from "./settingsManager";

// Create output channel for debugging
let outputChannel: vscode.OutputChannel;

/**
 * Manages WebSocket server communication with the Chrome extension
 */
export class VSCodeServer {
  private server: WebSocket.Server | null = null;
  private connections: WebSocket[] = [];
  private statusBarItem: vscode.StatusBarItem;
  private settingsManager: SettingsManager;
  private htmlProcessor: HtmlProcessor;
  private disposables: vscode.Disposable[] = [];

  /**
   * Creates a new instance of VSCodeServer
   * @param context The extension context
   * @param settingsManager The settings manager instance
   * @param htmlProcessor The HTML processor instance
   */
  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
    htmlProcessor: HtmlProcessor
  ) {
    this.settingsManager = settingsManager;
    this.htmlProcessor = htmlProcessor;
    
    // Initialize output channel if not already initialized
    if (!outputChannel) {
      outputChannel = vscode.window.createOutputChannel("DOM2Code Debug");
      context.subscriptions.push(outputChannel);
    }
    
    // Create status bar item
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.text = "$(chrome) DOM2Code: Disconnected";
    this.statusBarItem.tooltip = "Click to start/stop Chrome connection";
    this.statusBarItem.command = "dom2code.toggleServer";
    
    context.subscriptions.push(this.statusBarItem);
    this.statusBarItem.show();

    // Setup event listeners for logging
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for logging Cursor actions
   */
  private setupEventListeners(): void {
    // Log active editor changes
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
          const timestamp = new Date().toISOString();
          outputChannel.appendLine(`[${timestamp}] Active Editor Changed: ${editor.document.fileName}`);
        }
      })
    );

    // Log text selection changes
    this.disposables.push(
      vscode.window.onDidChangeTextEditorSelection(event => {
        const timestamp = new Date().toISOString();
        const selection = event.selections[0];
        outputChannel.appendLine(`[${timestamp}] Selection Changed: Line ${selection.start.line + 1}, Column ${selection.start.character + 1}`);
      })
    );

    // Log window state changes (focus)
    this.disposables.push(
      vscode.window.onDidChangeWindowState(event => {
        const timestamp = new Date().toISOString();
        outputChannel.appendLine(`[${timestamp}] Window State Changed: ${event.focused ? 'Focused' : 'Unfocused'}`);
      })
    );

    // Log visible editors changes
    this.disposables.push(
      vscode.window.onDidChangeVisibleTextEditors(editors => {
        const timestamp = new Date().toISOString();
        outputChannel.appendLine(`[${timestamp}] Visible Editors Changed: ${editors.length} editors visible`);
      })
    );
  }

  /**
   * Start the WebSocket server
   */
  public start(): void {
    if (this.server) {
      this.stop();
    }
    
    const port = this.settingsManager.getServerPort();
    
    try {
      this.server = new WebSocket.Server({ port });
      
      this.server.on("connection", (socket: WebSocket) => {
        this.connections.push(socket);
        this.updateStatusBar();
        
        socket.on("message", (message: WebSocket.Data) => {
          this.handleWebSocketMessage(socket, message.toString());
        });
        
        socket.on("close", () => {
          this.connections = this.connections.filter(conn => conn !== socket);
          this.updateStatusBar();
        });
      });
      
      this.server.on("error", (error) => {
        vscode.window.showErrorMessage(`DOM2Code server error: ${error.message}`);
        this.stop();
      });
      
      vscode.window.showInformationMessage(
        `DOM2Code server started on port ${port}. Connect Chrome extension to use.`
      );
      
      this.updateStatusBar();
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to start DOM2Code server: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Stop the WebSocket server
   */
  public stop(): void {
    if (this.server) {
      for (const connection of this.connections) {
        connection.close();
      }
      
      this.server.close();
      this.server = null;
      this.connections = [];
      this.updateStatusBar();
      
      // Clean up event listeners
      this.disposables.forEach(d => d.dispose());
      this.disposables = [];
      
      vscode.window.showInformationMessage("DOM2Code server stopped");
    }
  }

  /**
   * Toggle the server state
   */
  public toggle(): void {
    if (this.server) {
      this.stop();
    } else {
      this.start();
    }
  }

  /**
   * Handle message from Chrome extension
   */
  private handleWebSocketMessage(ws: WebSocket, message: string) {
    try {
      const data = JSON.parse(message);
      outputChannel.appendLine(`Received message: ${JSON.stringify(data, null, 2)}`);

      if (data.type === "command") {
        // Validate HTML content
        if (!data.text || typeof data.text !== "string") {
          outputChannel.appendLine("❌ Error: Missing or invalid HTML content");
          const response = {
            type: "commandResponse",
            success: false,
            error: "Missing or invalid HTML content"
          };
          ws.send(JSON.stringify(response));
          return;
        }

        // Log the actual HTML content for debugging
        outputChannel.appendLine("Received HTML content:");
        outputChannel.appendLine("----------------------------------------");
        outputChannel.appendLine(data.text);
        outputChannel.appendLine("----------------------------------------");

        this.injectHTML(data.text)
          .then(success => {
            const response = {
              type: "commandResponse",
              success,
              error: success ? undefined : "Failed to execute command"
            };
            ws.send(JSON.stringify(response));
          })
          .catch(error => {
            outputChannel.appendLine(`❌ Error in injectHTML: ${error instanceof Error ? error.message : String(error)}`);
            const response = {
              type: "commandResponse",
              success: false,
              error: error instanceof Error ? error.message : String(error)
            };
            ws.send(JSON.stringify(response));
          });
      }
    } catch (error) {
      outputChannel.appendLine(`Error handling WebSocket message: ${error instanceof Error ? error.message : String(error)}`);
      const response = {
        type: "commandResponse",
        success: false,
        error: "Invalid message format"
      };
      ws.send(JSON.stringify(response));
    }
  }

  /**
   * Execute a command with retries
   */
  private async executeCommandWithRetry(command: string, maxRetries: number = 3): Promise<boolean> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        outputChannel.appendLine(`Attempting to execute command: ${command} (attempt ${i + 1}/${maxRetries})`);
        await vscode.commands.executeCommand(command);
        outputChannel.appendLine(`✅ Command executed successfully: ${command}`);
        return true;
      } catch (error) {
        outputChannel.appendLine(`❌ Command execution failed: ${command} (attempt ${i + 1}/${maxRetries})`);
        outputChannel.appendLine(`Error: ${error instanceof Error ? error.message : String(error)}`);
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    return false;
  }

  /**
   * Send HTML to Cursor chat input
   */
  private async injectHTML(html: string): Promise<boolean> {
    try {
      outputChannel.appendLine(`\n🔄 Attempting to inject content into chat`);
      
      // Validate HTML content
      if (!html.trim()) {
        throw new Error("HTML content is empty");
      }

      // Log the content being processed
      outputChannel.appendLine("Processing HTML content:");
      outputChannel.appendLine("----------------------------------------");
      outputChannel.appendLine(html);
      outputChannel.appendLine("----------------------------------------");

      // Step 1: Create new chat
      outputChannel.appendLine('Step 1: Creating new chat');
      const chatCreated = await this.executeCommandWithRetry('aichat.newchataction');
      if (!chatCreated) {
        outputChannel.appendLine('❌ Failed to create new chat after multiple attempts');
        return false;
      }
      
      // Wait for the chat to initialize
      outputChannel.appendLine('Waiting for chat to initialize...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Step 2: Focus chat pane
      outputChannel.appendLine('Step 2: Focusing chat pane');
      const focusSuccess = await this.executeCommandWithRetry('aichat.focuschatpaneaction');
      if (!focusSuccess) {
        outputChannel.appendLine('❌ Failed to focus chat pane after multiple attempts');
        return false;
      }
      
      // Wait for focus to take effect
      outputChannel.appendLine('Waiting for focus to take effect...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 3: Copy content to clipboard (only the HTML)
      const content = `\`\`\`html\n${html}\n\`\`\``;
      outputChannel.appendLine('Step 3: Copying content to clipboard');
      await vscode.env.clipboard.writeText(content);
      outputChannel.appendLine('✅ Content copied to clipboard');
      
      // Step 4: Try to insert content using clipboard paste
      outputChannel.appendLine('Step 4: Pasting content from clipboard');
      
      // Try to ensure we're in the chat context
      outputChannel.appendLine('Ensuring chat context...');
      await this.executeCommandWithRetry('workbench.action.focusPanel');
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.executeCommandWithRetry('aichat.focuschatpaneaction');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Log the active editor for debugging
      const activeEditor = vscode.window.activeTextEditor;
      outputChannel.appendLine(`Active editor: ${activeEditor?.document.uri.scheme} - ${activeEditor?.document.fileName}`);
      
      const pasteSuccess = await this.executeCommandWithRetry('editor.action.clipboardPasteAction');
      if (!pasteSuccess) {
        outputChannel.appendLine('❌ Failed to paste content after multiple attempts');
        return false;
      }
      outputChannel.appendLine('✅ Content pasted successfully');
      
      outputChannel.appendLine('✅ Content insertion completed');
      return true;
    } catch (error) {
      outputChannel.appendLine(`❌ Error injecting content: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Update the status bar item
   */
  private updateStatusBar(): void {
    if (this.server && this.connections.length > 0) {
      this.statusBarItem.text = `$(chrome) DOM2Code: ${this.connections.length} Connected`;
      this.statusBarItem.backgroundColor = new vscode.ThemeColor("statusBarItem.warningBackground");
    } else if (this.server) {
      this.statusBarItem.text = "$(chrome) DOM2Code: Waiting";
      this.statusBarItem.backgroundColor = undefined;
    } else {
      this.statusBarItem.text = "$(chrome) DOM2Code: Disconnected";
      this.statusBarItem.backgroundColor = undefined;
    }
  }

  /**
   * Send a message to all connected Chrome extensions
   */
  public broadcast(message: any): void {
    if (this.connections.length === 0) return;
    
    const messageString = JSON.stringify(message);
    
    for (const connection of this.connections) {
      if (connection.readyState === WebSocket.OPEN) {
        connection.send(messageString);
      }
    }
  }
} 