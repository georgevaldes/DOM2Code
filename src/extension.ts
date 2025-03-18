import * as vscode from "vscode";
import { WebviewManager } from "./webviewManager";
import { SettingsManager } from "./settingsManager";
import { HtmlProcessor } from "./htmlProcessor";
import { VSCodeServer } from "./vsCodeServer";
import * as cp from 'child_process';
import * as os from 'os';
import * as path from 'path';

// Create output channel for debugging
let outputChannel: vscode.OutputChannel;

/**
 * This method is called when the extension is activated.
 * @param context The extension context provided by VS Code
 */
export function activate(context: vscode.ExtensionContext): void {
  // Initialize output channel
  outputChannel = vscode.window.createOutputChannel("DOM2Code Debug");
  context.subscriptions.push(outputChannel);

  const settingsManager = new SettingsManager();
  const htmlProcessor = new HtmlProcessor(settingsManager);
  const webviewManager = new WebviewManager(context, settingsManager);
  const vsCodeServer = new VSCodeServer(context, settingsManager, htmlProcessor);
  
  // Start the server automatically
  vsCodeServer.start();
  
  // Register command to toggle the server
  context.subscriptions.push(
    vscode.commands.registerCommand("dom2code.toggleServer", () => {
      vsCodeServer.toggle();
    })
  );
  
  // Register command to open static HTML selector
  context.subscriptions.push(
    vscode.commands.registerCommand("dom2code.openSelector", () => {
      webviewManager.openStaticHtmlSelector();
    })
  );
  
  // Register command to open localhost viewer
  context.subscriptions.push(
    vscode.commands.registerCommand("dom2code.openWithUrl", async () => {
      const url = await vscode.window.showInputBox({
        prompt: "Enter localhost URL",
        placeHolder: "http://localhost:3000",
        value: settingsManager.getDefaultLocalhostUrl()
      });
      
      if (url) {
        webviewManager.openWithUrl(url);
      }
    })
  );
  
  // Add a direct view command for troubleshooting
  context.subscriptions.push(
    vscode.commands.registerCommand("dom2code.openDirectView", async () => {
      const url = await vscode.window.showInputBox({
        prompt: "Enter localhost URL for direct view (no iframe)",
        placeHolder: "http://localhost:3000",
        value: settingsManager.getDefaultLocalhostUrl()
      });
      
      if (url) {
        webviewManager.openDirectView(url);
      }
    })
  );
  
  // Add a command to open URL in system browser
  context.subscriptions.push(
    vscode.commands.registerCommand("dom2code.openInBrowser", async () => {
      const url = await vscode.window.showInputBox({
        prompt: "Enter URL to open in your system browser",
        placeHolder: "http://localhost:3000",
        value: settingsManager.getDefaultLocalhostUrl()
      });
      
      if (url) {
        vscode.env.openExternal(vscode.Uri.parse(url));
        vscode.window.showInformationMessage(`Opened ${url} in your default browser. To use DOM2Code, copy HTML from elements and paste it into your editor.`);
      }
    })
  );
  
  // Add a command to open Chrome with DevTools for element inspection
  context.subscriptions.push(
    vscode.commands.registerCommand("dom2code.openChromeDevTools", async () => {
      const url = await vscode.window.showInputBox({
        prompt: "Enter URL to open in Chrome with DevTools",
        placeHolder: "http://localhost:3000",
        value: settingsManager.getDefaultLocalhostUrl()
      });
      
      if (url) {
        const tempDir = path.join(os.tmpdir(), 'dom2code_chrome_profile');
        const platform = os.platform();
        let command = '';
        
        if (platform === 'darwin') {
          // macOS
          command = `open -a "Google Chrome" --args --auto-open-devtools-for-tabs --disable-web-security --user-data-dir="${tempDir}" "${url}"`;
        } else if (platform === 'win32') {
          // Windows
          command = `start chrome --auto-open-devtools-for-tabs --disable-web-security --user-data-dir="${tempDir}" "${url}"`;
        } else {
          // Linux
          command = `google-chrome --auto-open-devtools-for-tabs --disable-web-security --user-data-dir="${tempDir}" "${url}"`;
        }
        
        try {
          cp.exec(command);
          
          // Show instructions for copying elements
          const panel = vscode.window.createWebviewPanel(
            'domInspectorHelp',
            'DOM Inspector Instructions',
            vscode.ViewColumn.Beside,
            { enableScripts: true }
          );
          
          panel.webview.html = `<!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>DOM Inspector Instructions</title>
            <style>
              body {
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                line-height: 1.5;
                padding: 20px;
                max-width: 800px;
                margin: 0 auto;
              }
              h1 { color: #007acc; }
              .step {
                margin-bottom: 20px;
                padding: 15px;
                background: #f3f3f3;
                border-radius: 5px;
              }
              .step h3 {
                margin-top: 0;
              }
              code {
                background: #e0e0e0;
                padding: 2px 4px;
                border-radius: 3px;
                font-family: Consolas, 'Courier New', monospace;
              }
              img {
                max-width: 100%;
                border: 1px solid #ddd;
                border-radius: 4px;
                margin: 10px 0;
              }
              .tip {
                background: #fffde7;
                border-left: 4px solid #ffd600;
                padding: 10px 15px;
                margin: 15px 0;
              }
            </style>
          </head>
          <body>
            <h1>How to Copy HTML Elements</h1>
            <p>Chrome DevTools has been opened with web security disabled to help you inspect and copy HTML elements.</p>
            
            <div class="step">
              <h3>Step 1: Inspect an Element</h3>
              <p>Right-click on any element you want and select <code>Inspect</code>, or use the Elements panel in DevTools.</p>
            </div>
            
            <div class="step">
              <h3>Step 2: Copy the HTML</h3>
              <p>In the Elements panel of DevTools:</p>
              <ol>
                <li>Right-click on the highlighted element</li>
                <li>Select <code>Copy</code> → <code>Copy outerHTML</code></li>
              </ol>
            </div>
            
            <div class="step">
              <h3>Step 3: Paste into VS Code</h3>
              <p>Switch back to VS Code and paste the HTML where you need it.</p>
            </div>
            
            <div class="tip">
              <strong>Tip:</strong> You can also use <code>Copy selector</code> to get a CSS selector for the element.
            </div>
            
            <div class="tip">
              <strong>Advanced:</strong> Use the Console to get specific parts of elements:
              <code>copy($0.outerHTML)</code> - Copy the selected element's HTML
            </div>
          </body>
          </html>`;
          
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to open Chrome: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    })
  );
  
  // Add a command to install Chrome extension
  context.subscriptions.push(
    vscode.commands.registerCommand("dom2code.installChromeExtension", async () => {
      // This would typically point to the Chrome Web Store URL once published
      const extensionUrl = "https://github.com/yourusername/DOM2Code-Chrome-Extension";
      
      vscode.env.openExternal(vscode.Uri.parse(extensionUrl));
      
      vscode.window.showInformationMessage(
        "Opening DOM2Code Chrome extension repository. Follow the README instructions to install the extension."
      );
    })
  );

  // Add a command to inspect Cursor's chat input
  context.subscriptions.push(
    vscode.commands.registerCommand("dom2code.inspectCursorChat", async () => {
      // Clear previous output and show channel
      outputChannel.clear();
      outputChannel.show(true);

      outputChannel.appendLine('🔍 DOM2Code Debug Output');
      outputChannel.appendLine('============================');
      
      // Log all available commands to help identify Cursor's chat commands
      const commands = await vscode.commands.getCommands(true);
      const chatCommands = commands.filter(cmd => 
        cmd.toLowerCase().includes('chat') || 
        cmd.toLowerCase().includes('cursor') ||
        cmd.toLowerCase().includes('input')
      );
      
      outputChannel.appendLine('\n📋 Available Chat-Related Commands:');
      chatCommands.forEach(cmd => outputChannel.appendLine(`- ${cmd}`));

      // Try to find active text inputs
      const webviews = vscode.window.visibleTextEditors;
      outputChannel.appendLine('\n📑 Active Editors:');
      webviews.forEach(editor => {
        outputChannel.appendLine(JSON.stringify({
          document: editor.document.uri.toString(),
          viewColumn: editor.viewColumn,
          scheme: editor.document.uri.scheme,
          languageId: editor.document.languageId
        }, null, 2));
      });

      // Try to find webview panels
      outputChannel.appendLine('\n🌐 Active Webview Panels:');
      // @ts-ignore - Using internal API to inspect webviews
      const allWebviews = (vscode.window as any).visibleWebviewPanels || [];
      allWebviews.forEach((panel: vscode.WebviewPanel) => {
        outputChannel.appendLine(JSON.stringify({
          viewType: panel.viewType,
          viewColumn: panel.viewColumn,
          title: panel.title
        }, null, 2));
      });

      // Show notification with instructions
      vscode.window.showInformationMessage(
        'Inspecting Cursor chat input. Check the "DOM2Code Debug" output channel for details.'
      );
    })
  );

  // Register debug command
  let inspectCommand = vscode.commands.registerCommand('dom2code.inspectCommands', async () => {
    outputChannel.appendLine('\n🔍 Inspecting available commands:');
    
    // Get all available commands
    const commands = await vscode.commands.getCommands();
    
    // Filter and log composer commands
    const composerCommands = commands.filter(cmd => cmd.toLowerCase().includes('composer')).sort();
    outputChannel.appendLine('\n🎭 Composer commands:');
    composerCommands.forEach(cmd => outputChannel.appendLine(`- ${cmd}`));
    
    // Filter and log chat commands
    const chatCommands = commands.filter(cmd => 
      cmd.toLowerCase().includes('chat') || 
      cmd.toLowerCase().includes('cursor') ||
      cmd.toLowerCase().includes('aichat')
    ).sort();
    outputChannel.appendLine('\n💬 Chat/Cursor commands:');
    chatCommands.forEach(cmd => outputChannel.appendLine(`- ${cmd}`));
    
    // Log active editor info
    const activeEditor = vscode.window.activeTextEditor;
    outputChannel.appendLine('\n📄 Active editor info:');
    if (activeEditor) {
      outputChannel.appendLine(`- Scheme: ${activeEditor.document.uri.scheme}`);
      outputChannel.appendLine(`- Language ID: ${activeEditor.document.languageId}`);
      outputChannel.appendLine(`- File name: ${activeEditor.document.fileName}`);
    } else {
      outputChannel.appendLine('No active text editor');
    }
    
    // Get all visible text editors
    const visibleEditors = vscode.window.visibleTextEditors;
    outputChannel.appendLine('\n👁 Visible editors:');
    visibleEditors.forEach(editor => {
      outputChannel.appendLine(`- Scheme: ${editor.document.uri.scheme}, Language: ${editor.document.languageId}`);
    });
    
    // Show notification to check output
    vscode.window.showInformationMessage('Check DOM2Code Debug output for command inspection results');
  });
  
  context.subscriptions.push(inspectCommand);
}

/**
 * This method is called when the extension is deactivated
 */
export function deactivate(): void {
  // Clean up resources
} 