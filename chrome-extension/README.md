# DOM2Code Chrome Extension

This Chrome extension allows you to visually select HTML elements from any webpage and directly inject them into VS Code or Cursor.

## Features

- Visual element selection with live highlighting
- Right-click context menu for quick selection
- Direct integration with VS Code via WebSocket
- Configuration options for highlight color and more
- Auto-formatting of HTML before injection

## Installation

### Development Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `chrome-extension` folder
5. The DOM2Code extension should now appear in your Chrome toolbar

### VS Code Extension

For this Chrome extension to work, you must also install the DOM2Code VS Code extension:

1. Install from VS Code Marketplace or install manually with `.vsix` file
2. After installation, the VS Code extension will automatically start a WebSocket server

## Usage

1. Click the DOM2Code icon in your Chrome toolbar
2. Ensure VS Code is running with the DOM2Code extension installed
3. Click "Connect to VS Code" in the popup
4. Once connected, click "Enable Selection Mode"
5. Hover over elements on the page to see them highlighted
6. Click on an element to send its HTML to VS Code
7. Alternatively, right-click on any element and select "Send to VS Code"

## Configuration

You can configure the extension through the popup:

- **Highlight Color**: Change the color used for element highlighting
- **WebSocket Port**: Change the port used to connect to VS Code (must match VS Code settings)
- **Auto-format HTML**: Enable/disable automatic HTML formatting

## Development

This extension uses plain JavaScript and Chrome's extension APIs.

### Building

No build step is required for development. For production:

1. Edit `manifest.json` with your production details
2. Zip the entire `chrome-extension` folder
3. Submit to Chrome Web Store

## License

[MIT License](LICENSE) 