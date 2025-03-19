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
    statusIndicator.className = isConnected ? "status-indicator connected" : "status-indicator disconnected";
    statusText.textContent = isConnected ? "Connected" : "Disconnected";
    connectButton.textContent = isConnected ? "Disconnect" : "Connect";
    connectButton.className = isConnected ? "button button-primary disconnect" : "button button-primary connect";
    toggleButton.disabled = !isConnected;
    
    // Keep title fixed as "DOM2Code" regardless of connection status
    const title = document.querySelector('.title');
    title.textContent = "DOM2Code";
  }
  
  // Update toggle button state
  function updateToggleButton() {
    if (!isConnected) {
      toggleButton.disabled = true;
      toggleButton.className = "button button-secondary disabled";
      isSelectionModeActive = false;
      toggleButton.textContent = "Enable Selection Mode";
    } else {
      toggleButton.disabled = false;
      toggleButton.className = isSelectionModeActive ? "button button-secondary active" : "button button-secondary";
      toggleButton.textContent = isSelectionModeActive ? "Disable Selection Mode" : "Enable Selection Mode";
    }
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
          showSuccess('Disconnected from Cursor');
        } else {
          showError('Failed to disconnect from Cursor');
        }
      });
    } else {
      // Connect
      chrome.runtime.sendMessage({ command: 'connect' }, (response) => {
        if (response.success) {
          isConnected = true;
          updateUI();
          showSuccess('Connected to Cursor');
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
  
  setTimeout(() => {
    errorDiv.classList.add('fade-out');
    setTimeout(() => {
      errorDiv.remove();
    }, 300);
  }, 2700);
}

function showSuccess(message) {
  const successDiv = document.createElement('div');
  successDiv.className = 'success-message';
  successDiv.textContent = message;
  document.body.appendChild(successDiv);
  
  setTimeout(() => {
    successDiv.classList.add('fade-out');
    setTimeout(() => {
      successDiv.remove();
    }, 300);
  }, 2700);
} 