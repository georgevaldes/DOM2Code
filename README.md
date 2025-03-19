# DOM2Code

DOM2Code is a Visual Studio Code extension that allows developers to select HTML elements from a rendered webpage and inject the corresponding HTML markup into their active editor. This creates a seamless bridge between visual UI elements and their code representation.

[DOM2Code Demo - Watch Video](https://www.loom.com/share/9374d2920d374302867fc49eeb2775d7)

[![Watch Video](https://cdn.loom.com/sessions/thumbnails/9374d2920d374302867fc49eeb2775d7-85c0c94025a366ed-full-play.gif)](https://www.loom.com/share/9374d2920d374302867fc49eeb2775d7)


## Features

- **Static HTML Selection**: Choose from a gallery of pre-defined HTML components
- **Localhost URL Integration**: View and select elements from your running localhost application
- **Chrome Extension Integration**: Select elements directly in Chrome using the companion extension
- **HTML Formatting Options**: Inject HTML with your preferred formatting style (pretty, minified, or raw)
- **Visual Selection**: Intuitively point and click to select the elements you want

## Installation

You can install this extension from the VS Code marketplace:

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "DOM2Code"
4. Click Install

### Chrome Extension Installation

For the best experience, install the companion Chrome extension:

1. Open the command palette (Ctrl+Shift+P)
2. Type "DOM2Code: Install Chrome Extension"
3. Follow the instructions to install the Chrome extension
4. Once installed, click the extension icon in Chrome to connect to VS Code

## Usage

### Static HTML Selection

1. Open the command palette (Ctrl+Shift+P)
2. Type "DOM2Code: Open Element Selector"
3. Click on any element in the gallery to inject its HTML into your editor

### Localhost URL Integration

1. Start your web application locally (e.g., on http://localhost:3000)
2. Open the command palette (Ctrl+Shift+P)
3. Type "DOM2Code: Open With Localhost URL"
4. Enter your localhost URL when prompted
5. Click "Enable Selection" in the toolbar
6. Click on any element in the rendered page to inject its HTML into your editor

### Chrome Extension Method (Recommended)

1. Make sure both the VS Code extension and Chrome extension are installed
2. Open VS Code with a file where you want to inject HTML
3. Open Chrome and navigate to the webpage you want to extract elements from
4. Click the DOM2Code extension icon in Chrome
5. Click "Connect to VS Code" to establish a connection
6. Click "Enable Selection Mode"
7. Hover over elements on the page to see them highlighted
8. Click an element to send its HTML directly to VS Code
9. Alternatively, right-click on any element and select "Send to VS Code"

## Extension Settings

This extension contributes the following settings:

* `dom2code.defaultLocalhostUrl`: Default localhost URL to open (default: "http://localhost:3000")
* `dom2code.htmlFormatting`: HTML formatting style for injected code (options: "pretty", "minified", "raw")
* `dom2code.selectionHighlightColor`: Color used for highlighting selected elements (default: "#007bff")
* `dom2code.portMappings`: Port mappings for localhost connections
* `dom2code.serverPort`: Port for Chrome extension WebSocket communication (default: 54321)

## Known Issues

- Some websites block iframe access for security reasons, which may prevent the localhost viewer from working properly
- Complex HTML structures may not always format perfectly in the injected code
- Current workflow requires multiple clicks between browser and editor - we're working on streamlining this process
- Success confirmations for element selection and code injection could be more visible and informative
- Chrome extension interface could benefit from improved visual feedback and more intuitive controls

## Troubleshooting

### Cannot access iframe content

If you see the error "Cannot access iframe content", this is likely due to the website's Content Security Policy (CSP) blocking iframe access. Try using the Chrome Extension method instead, or modify your local application's CSP settings.

### Chrome extension not connecting

If the Chrome extension cannot connect to VS Code:
1. Make sure VS Code is running with the DOM2Code extension installed
2. Check that the WebSocket server is started (visible in the status bar)
3. Verify both extensions are using the same port (default: 54321)
4. Temporarily disable any firewalls or security software that might block WebSocket connections

### HTML formatting issues

If the injected HTML doesn't look right, try changing the HTML formatting option in the extension settings.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Release Notes

### 1.0.0

Major update with Chrome extension integration:
- Added companion Chrome extension for direct HTML selection
- WebSocket server for real-time communication
- Improved element selection and highlighting
- Better HTML formatting options

### 0.1.0

Initial release of DOM2Code with basic functionality:
- Static HTML selection
- Localhost URL integration
- HTML formatting options 
