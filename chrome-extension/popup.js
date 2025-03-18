// Popup UI Logic
document.addEventListener('DOMContentLoaded', () => {
  const statusIndicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');
  const connectButton = document.getElementById('connectButton');
  const toggleButton = document.getElementById('toggleButton');
  const highlightColorInput = document.getElementById('highlightColor');
  const serverPortInput = document.getElementById('serverPort');
  const autoFormatCheckbox = document.getElementById('autoFormat');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  
  let isConnected = false;
  let isSelectionModeActive = false;
  
  // Initialize UI
  function updateUI() {
    updateConnectionStatus();
    updateToggleButton();
  }
  
  // Update connection status UI
  function updateConnectionStatus() {
    statusIndicator.className = isConnected ? "status-indicator connected" : "status-indicator";
    connectButton.textContent = isConnected ? "Disconnect from Cursor" : "Connect to Cursor";
    connectButton.className = isConnected ? "button disconnect" : "button connect";
    toggleButton.disabled = !isConnected;
  }
  
  // Update toggle button state
  function updateToggleButton() {
    if (!isConnected) {
      toggleButton.disabled = true;
      toggleButton.className = "button disabled";
      isSelectionModeActive = false;
    } else {
      toggleButton.disabled = false;
      toggleButton.className = isSelectionModeActive ? "button active" : "button";
    }
    toggleButton.textContent = isSelectionModeActive ? "Disable Selection Mode" : "Enable Selection Mode";
  }
  
  // Load current state
  chrome.runtime.sendMessage({ command: 'getState' }, (response) => {
    if (response) {
      isConnected = response.isConnected;
      isSelectionModeActive = response.isSelectionModeActive;
      
      if (response.settings) {
        highlightColorInput.value = response.settings.highlightColor || '#0f172a';
        serverPortInput.value = response.settings.serverPort || 54321;
        autoFormatCheckbox.checked = response.settings.autoFormat !== false;
      }
      
      updateUI();
    }
  });
  
  // Handle connect button click
  connectButton.addEventListener('click', async () => {
    if (isConnected) {
      // Disconnect
      chrome.runtime.sendMessage({ command: 'disconnect' }, (response) => {
        if (response.success) {
          isConnected = false;
          isSelectionModeActive = false;
          updateUI();
        }
      });
    } else {
      // Connect
      chrome.runtime.sendMessage({ command: 'connect' }, (response) => {
        if (response.success) {
          isConnected = true;
          updateUI();
        } else {
          showError('Failed to connect to Cursor');
        }
      });
    }
  });
  
  // Handle toggle button click
  toggleButton.addEventListener('click', () => {
    if (!isConnected) {
      showError('Please connect to Cursor first');
      return;
    }
    
    const newState = !isSelectionModeActive;
    chrome.runtime.sendMessage({ 
      command: 'toggleSelectionMode',
      value: newState
    }, (response) => {
      if (response.success) {
        isSelectionModeActive = newState;
        updateToggleButton();
      } else {
        showError(response.error || 'Failed to toggle selection mode');
      }
    });
  });
  
  // Save settings
  saveSettingsBtn.addEventListener('click', () => {
    const settings = {
      highlightColor: highlightColorInput.value,
      serverPort: parseInt(serverPortInput.value, 10),
      autoFormat: autoFormatCheckbox.checked
    };
    
    chrome.runtime.sendMessage({
      command: 'updateSettings',
      settings
    }, (response) => {
      if (response.success) {
        showSuccess('Settings saved');
      } else {
        showError('Failed to save settings');
      }
    });
  });
  
  // Listen for state changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.isConnected) {
      isConnected = changes.isConnected.newValue;
    }
    if (changes.isSelectionModeActive) {
      isSelectionModeActive = changes.isSelectionModeActive.newValue;
    }
    if (changes.settings) {
      const settings = changes.settings.newValue;
      highlightColorInput.value = settings.highlightColor;
      serverPortInput.value = settings.serverPort;
      autoFormatCheckbox.checked = settings.autoFormat;
    }
    updateUI();
  });
});

// Helper functions
function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);
  setTimeout(() => errorDiv.remove(), 3000);
}

function showSuccess(message) {
  const successDiv = document.createElement('div');
  successDiv.className = 'success-message';
  successDiv.textContent = message;
  document.body.appendChild(successDiv);
  setTimeout(() => successDiv.remove(), 3000);
} 