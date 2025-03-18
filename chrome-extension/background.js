// Store WebSocket connection and state
let ws = null;
let isConnected = false;
let isSelectionModeActive = false;
let settings = {
  highlightColor: "#0f172a",
  serverPort: 54321,
  autoFormat: true
};

// Initialize connection state
chrome.runtime.onStartup.addListener(() => {
  // Try to connect on startup
  connectToVSCode();
});

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  if (message.command === 'connect') {
    connectToVSCode().then(success => {
      sendResponse({ success });
    });
    return true;
  }
  else if (message.command === 'disconnect') {
    disconnectFromVSCode();
    // Disable selection mode when disconnecting
    disableSelectionMode();
    sendResponse({ success: true });
  }
  else if (message.command === 'toggleSelectionMode') {
    // Only allow toggling selection mode when connected
    if (!isConnected && message.value) {
      sendResponse({ success: false, error: 'Must be connected to enable selection mode' });
      return;
    }
    
    isSelectionModeActive = message.value;
    // Notify all tabs
    notifyAllTabs({
      command: 'toggleSelectionMode',
      value: isSelectionModeActive
    });
    notifyStateChange();
    sendResponse({ success: true });
  }
  else if (message.command === 'getState') {
    sendResponse({
      isConnected,
      isSelectionModeActive,
      settings
    });
  }
  else if (message.command === 'updateSettings') {
    settings = { ...settings, ...message.settings };
    // If port changed and we're connected, reconnect
    if (message.settings.serverPort && message.settings.serverPort !== settings.serverPort && isConnected) {
      connectToVSCode();
    }
    notifyStateChange();
    sendResponse({ success: true });
  }
  else if (message.command === 'sendToCursor') {
    sendToCursor(message.data)
      .then(response => {
        console.log('Command response:', response);
        sendResponse(response);
      })
      .catch(error => {
        console.error('Error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Will respond asynchronously
  }
});

// Connect to VS Code WebSocket server
async function connectToVSCode() {
  // Close existing connection if any
  if (ws) {
    ws.close();
    ws = null;
  }
  
  return new Promise((resolve) => {
    try {
      console.log('Connecting to WebSocket on port:', settings.serverPort);
      ws = new WebSocket(`ws://localhost:${settings.serverPort}`);
      
      ws.onopen = () => {
        console.log('Connected to VS Code');
        isConnected = true;
        notifyStateChange();
        resolve(true);
      };
      
      ws.onclose = () => {
        console.log('Disconnected from VS Code');
        isConnected = false;
        ws = null;
        // Disable selection mode when connection is lost
        disableSelectionMode();
        notifyStateChange();
        resolve(false);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        isConnected = false;
        ws = null;
        // Disable selection mode on error
        disableSelectionMode();
        notifyStateChange();
        resolve(false);
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      isConnected = false;
      ws = null;
      // Disable selection mode on error
      disableSelectionMode();
      notifyStateChange();
      resolve(false);
    }
  });
}

// Disconnect from VS Code
function disconnectFromVSCode() {
  if (ws) {
    ws.close();
    ws = null;
  }
  isConnected = false;
  notifyStateChange();
}

// Disable selection mode and notify all tabs
function disableSelectionMode() {
  if (isSelectionModeActive) {
    isSelectionModeActive = false;
    notifyAllTabs({
      command: 'toggleSelectionMode',
      value: false
    });
    notifyStateChange();
  }
}

// Notify all tabs about a state change
function notifyAllTabs(message) {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, message).catch(() => {
        // Ignore errors for inactive tabs
      });
    });
  });
}

// Notify state change to all listeners
function notifyStateChange() {
  chrome.storage.local.set({ 
    isConnected,
    isSelectionModeActive,
    settings
  });
}

// Add context menu item
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'sendToVSCode',
    title: 'Send to Cursor',
    contexts: ['page', 'selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'sendToVSCode') {
    if (!isConnected) {
      // Show notification that connection is required
      chrome.tabs.sendMessage(tab.id, {
        command: 'showNotification',
        message: 'Please connect to Cursor first',
        isError: true
      });
      return;
    }
    
    chrome.tabs.sendMessage(tab.id, {
      command: 'getElementAtPoint'
    });
  }
});

// Handle sending messages to Cursor
async function sendToCursor(data) {
  try {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return { success: false, error: 'WebSocket is not connected' };
    }

    // Send the command to Cursor
    ws.send(JSON.stringify({
      type: 'command',
      command: data.command,
      text: data.text || '',
      metadata: {
        ...data.metadata,
        timestamp: Date.now(),
        source: 'dom2code-extension'
      }
    }));

    // Wait for response or timeout
    const response = await Promise.race([
      new Promise((resolve) => {
        const messageHandler = (event) => {
          try {
            const response = JSON.parse(event.data);
            if (response.type === 'commandResponse') {
              ws.removeEventListener('message', messageHandler);
              resolve({ 
                success: response.success, 
                error: response.error,
                command: data.command
              });
            }
          } catch (error) {
            console.error('Error parsing WebSocket response:', error);
          }
        };
        ws.addEventListener('message', messageHandler);
      }),
      new Promise((resolve) => 
        setTimeout(() => resolve({ 
          success: false, 
          error: 'Command timed out',
          command: data.command
        }), 5000)
      )
    ]);

    // Log the response for debugging
    console.log('Command response:', {
      command: data.command,
      success: response.success,
      error: response.error
    });

    return response;
  } catch (error) {
    console.error('Error sending to Cursor:', error);
    return { success: false, error: error.message };
  }
} 