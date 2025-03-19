// DOM2Code Content Script - Element selection and highlighting

// State management
const state = {
  isSelectionModeActive: false,
  isConnected: false,
  highlightColor: "#0f172a",
  hoveredElement: null,
  selectedElement: null,
  isExtensionValid: true,
  lastMouseX: 0,
  lastMouseY: 0
};

// Styles for highlighting
const highlightStyles = {
  outline: "2px dashed",
  outlineOffset: "1px",
  cursor: "pointer",
  transition: "outline-color 0.2s ease"
};

// Create tooltip element
let tooltip = null;

function createTooltip() {
  if (tooltip) return;
  
  tooltip = document.createElement("div");
  tooltip.style.cssText = `
    position: fixed;
    padding: 4px 8px;
    background: #0f172a;
    color: white;
    border-radius: 4px;
    font-size: 12px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    pointer-events: none;
    z-index: 2147483647;
    opacity: 0;
    transition: opacity 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  `;
  document.body.appendChild(tooltip);
}

// Create context menu element
let contextMenu = null;

function createContextMenu() {
  if (contextMenu) return;
  
  contextMenu = document.createElement('div');
  contextMenu.className = 'dom2code-context-menu';
  contextMenu.innerHTML = `
    <div class="container">
      <div class="input-container">
        <input
          type="text"
          class="input"
          id="commandInput"
          placeholder="Suggest edit here"
          autofocus
        />
      </div>
      
      <div class="footer">
        <button class="submit-btn" id="submitBtn">
          submit →
        </button>
      </div>
    </div>
  `;
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .dom2code-context-menu {
      position: fixed;
      z-index: 2147483647;
      width: 320px;
    }
    
    .dom2code-context-menu .container {
      background: rgba(24, 24, 27, 0.95);
      border: 1px solid rgb(39, 39, 42);
      border-radius: 8px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
    }
    
    .dom2code-context-menu .input-container {
      padding: 12px;
    }
    
    .dom2code-context-menu .input {
      width: 100%;
      background: transparent;
      color: rgb(212, 212, 216);
      border: none;
      outline: none;
      font-size: 14px;
    }
    
    .dom2code-context-menu .input::placeholder {
      color: rgb(113, 113, 122);
    }
    
    .dom2code-context-menu .footer {
      padding: 8px 12px;
      border-top: 1px solid rgb(39, 39, 42);
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }
    
    .dom2code-context-menu .submit-btn {
      background: rgb(39, 39, 42);
      color: rgb(212, 212, 216);
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 12px;
      cursor: pointer;
    }
    
    .dom2code-context-menu .submit-btn:hover {
      background: rgb(63, 63, 70);
    }
  `;
  
  document.head.appendChild(style);
}

// Position context menu
function positionContextMenu(x, y) {
  if (!contextMenu) return;
  
  const rect = contextMenu.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // Adjust position to keep menu in viewport
  let posX = x;
  let posY = y;
  
  if (x + rect.width > viewportWidth) {
    posX = viewportWidth - rect.width - 10;
  }
  
  if (y + rect.height > viewportHeight) {
    posY = viewportHeight - rect.height - 10;
  }
  
  contextMenu.style.left = `${posX}px`;
  contextMenu.style.top = `${posY}px`;
}

// Show context menu
function showContextMenu(element, x, y) {
  state.selectedElement = element;
  
  // Hide any existing context menu
  hideContextMenu();
  
  // Create new context menu
  createContextMenu();
  
  // Position and show menu
  document.body.appendChild(contextMenu);
  positionContextMenu(x, y);
  
  // Setup event listeners
  const input = contextMenu.querySelector('#commandInput');
  const submitBtn = contextMenu.querySelector('#submitBtn');
  
  input.focus();
  
  // Flag to prevent duplicate submissions
  let isSubmitting = false;
  
  async function handleSubmit() {
    const command = input.value.trim();
    if (!command || isSubmitting) return;
    
    try {
      isSubmitting = true;
      submitBtn.disabled = true;
      input.disabled = true;
      
      // Get element metadata
      const elementData = {
        tagName: state.selectedElement.tagName.toLowerCase(),
        id: state.selectedElement.id,
        classes: Array.from(state.selectedElement.classList),
        attributes: Array.from(state.selectedElement.attributes).map(attr => ({
          name: attr.name,
          value: attr.value
        })),
        html: state.selectedElement.outerHTML,
        text: state.selectedElement.textContent.trim(),
        rect: state.selectedElement.getBoundingClientRect().toJSON()
      };

      // Send only one command with all the data
      const response = await new Promise(resolve => {
        chrome.runtime.sendMessage({
          command: 'sendToCursor',
          data: {
            command: 'editor.action.clipboardPasteAction',
            text: `${command}\nPlease apply the previous instructions to the following component: \`\`\`html\n${state.selectedElement.outerHTML}\n\`\`\``,
            metadata: elementData,
            shouldWait: false
          }
        }, resolve);
      });

      if (response && response.success) {
        showNotification('Successfully sent to Cursor');
        setTimeout(() => hideContextMenu(), 1000);
      } else {
        showNotification('Failed to send to Cursor', true);
        submitBtn.disabled = false;
        input.disabled = false;
      }
    } catch (error) {
      console.error('Error sending to Cursor:', error);
      showNotification('Failed to send to Cursor', true);
      submitBtn.disabled = false;
      input.disabled = false;
    } finally {
      isSubmitting = false;
    }
  }
  
  // Handle Enter key
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  });
  
  // Handle submit button click
  submitBtn.addEventListener('click', handleSubmit);
}

// Hide context menu
function hideContextMenu() {
  if (contextMenu) {
    if (contextMenu.cleanup) {
      contextMenu.cleanup();
    }
    if (contextMenu.parentNode) {
      contextMenu.parentNode.removeChild(contextMenu);
    }
    contextMenu = null;
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.command === 'toggleSelectionMode') {
    state.isSelectionModeActive = message.value;
    if (!state.isSelectionModeActive) {
      removeHighlight();
      hideContextMenu();
    }
    showNotification(state.isSelectionModeActive ? 'Selection mode enabled' : 'Selection mode disabled');
  } else if (message.command === 'connectionStateChanged') {
    state.isConnected = message.isConnected;
    if (!state.isConnected) {
      // Disable selection mode and clean up UI
      state.isSelectionModeActive = false;
      removeHighlight();
      hideContextMenu();
      showNotification('Connection lost. Selection mode disabled.', true);
    }
  } else if (message.command === 'getElementAtPoint') {
    if (!state.isConnected) {
      showNotification('Please connect to Cursor first', true);
      return;
    }
    const element = document.elementFromPoint(state.lastMouseX, state.lastMouseY);
    if (element && !isElementExcluded(element)) {
      showContextMenu(element, state.lastMouseX, state.lastMouseY);
    }
  } else if (message.command === 'showNotification') {
    showNotification(message.message, message.isError);
  } else if (message.command === 'commandResult') {
    const { success, error, command } = message.data;
    if (success) {
      showNotification('Successfully sent to Cursor');
      setTimeout(() => hideContextMenu(), 1000);
    } else {
      showNotification(error || 'Failed to send to Cursor', true);
    }
  }
});

// Handle mouse movement
function handleMouseMove(e) {
  if (!state.isSelectionModeActive || !state.isConnected) return;
  
  // Don't process if we're interacting with our own UI
  if (e.target.closest('.dom2code-context-menu') || e.target.classList.contains('dom2code-notification')) {
    return;
  }
  
  state.lastMouseX = e.clientX;
  state.lastMouseY = e.clientY;
  
  const element = document.elementFromPoint(e.clientX, e.clientY);
  if (element === state.hoveredElement) return;
  
  removeHighlight();
  
  if (element && !isElementExcluded(element)) {
    highlightElement(element);
    showTooltip(element, e.clientX, e.clientY);
    state.hoveredElement = element;
  } else {
    hideTooltip();
    state.hoveredElement = null;
  }
}

// Handle element click
function handleClick(e) {
  if (!state.isSelectionModeActive || !state.isConnected) return;
  
  // Don't process if we're interacting with our own UI
  if (e.target.closest('.dom2code-context-menu') || e.target.classList.contains('dom2code-notification')) {
    return;
  }
  
  e.preventDefault();
  e.stopPropagation();
  
  const element = document.elementFromPoint(e.clientX, e.clientY);
  if (element && !isElementExcluded(element)) {
    showContextMenu(element, e.clientX, e.clientY);
  }
}

// Event listener management
function setupEventListeners() {
  try {
    // Remove any existing listeners first
    cleanup();
    
    // Add new listeners
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("click", handleClick, true);
    
    // Listen for extension unload
    window.addEventListener('unload', cleanup);
  } catch (error) {
    console.error('Error setting up event listeners:', error);
    handleError(error);
  }
}

function cleanup() {
  try {
    // Remove event listeners
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("click", handleClick, true);
    window.removeEventListener('unload', cleanup);
    
    // Clean up UI elements
    if (tooltip && tooltip.parentNode) {
      tooltip.parentNode.removeChild(tooltip);
      tooltip = null;
    }
    
    hideContextMenu();
    removeHighlight();
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

// Helper functions
function highlightElement(element) {
  if (!element || element === document.documentElement || element === document.body) return;
  
  try {
    // Store original styles
    element.dataset.prevOutline = element.style.outline;
    element.dataset.prevOutlineOffset = element.style.outlineOffset;
    element.dataset.prevCursor = element.style.cursor;
    
    // Apply highlight styles
    Object.assign(element.style, highlightStyles, {
      outlineColor: state.highlightColor
    });
  } catch (error) {
    console.error('Error highlighting element:', error);
    handleError(error);
  }
}

function removeHighlight() {
  if (state.hoveredElement) {
    try {
      state.hoveredElement.style.outline = state.hoveredElement.dataset.prevOutline || '';
      state.hoveredElement.style.outlineOffset = state.hoveredElement.dataset.prevOutlineOffset || '';
      state.hoveredElement.style.cursor = state.hoveredElement.dataset.prevCursor || '';
    } catch (error) {
      console.error('Error removing highlight:', error);
    }
    state.hoveredElement = null;
  }
  hideTooltip();
}

function showTooltip(element, x, y) {
  if (!tooltip || !element || element === document.documentElement || element === document.body) return;
  
  try {
    const tag = element.tagName.toLowerCase();
    const classes = element.className ? `.${element.className.split(" ").join(".")}` : "";
    const id = element.id ? `#${element.id}` : "";
    
    tooltip.textContent = `${tag}${id}${classes}`;
    tooltip.style.left = `${x + 10}px`;
    tooltip.style.top = `${y + 10}px`;
    tooltip.style.opacity = "1";
  } catch (error) {
    console.error('Error showing tooltip:', error);
  }
}

function hideTooltip() {
  if (tooltip) {
    tooltip.style.opacity = "0";
  }
}

function isElementExcluded(element) {
  return !element ||
         element === tooltip ||
         element === contextMenu ||
         element.closest('.dom2code-context-menu') || // Exclude context menu and all its children
         element === document.documentElement ||
         element === document.body ||
         element.closest("[class*='chrome-extension']") ||
         element.tagName === "SCRIPT" ||
         element.tagName === "STYLE" ||
         element.tagName === "META" ||
         element.tagName === "LINK" ||
         element.tagName === "TITLE" ||
         element.classList.contains('dom2code-notification'); // Also exclude notifications
}

function handleElementSelection(element) {
  if (!state.isExtensionValid) {
    showNotification('Extension needs to be reloaded. Please refresh the page.', true);
    return;
  }

  if (isElementExcluded(element)) return;
  
  try {
    state.selectedElement = element;
    console.log('Selected element:', element);
    
    // Create dialog data
    const dialogData = {
      tagName: element.tagName.toLowerCase(),
      id: element.id,
      classes: Array.from(element.classList),
      attributes: Array.from(element.attributes).map(attr => ({
        name: attr.name,
        value: attr.value
      })),
      html: element.outerHTML,
      text: element.textContent.trim()
    };
    
    console.log('Sending dialog data:', dialogData);
    
    chrome.runtime.sendMessage({
      command: "openDialog",
      element: dialogData
    }, response => {
      if (chrome.runtime.lastError) {
        handleError(new Error(chrome.runtime.lastError.message));
        return;
      }
      
      if (response && response.success) {
        showNotification('Opening customization dialog...');
      } else {
        showNotification('Failed to open dialog', true);
      }
    });
  } catch (error) {
    console.error('Error handling element selection:', error);
    handleError(error);
  }
}

function handleError(error) {
  if (error.message.includes('Extension context invalidated')) {
    state.isExtensionValid = false;
    cleanup();
    showNotification('Extension needs to be reloaded. Please refresh the page.', true);
  } else {
    showNotification(`Error: ${error.message}`, true);
  }
}

// Show notification with improved styling and timing
function showNotification(message, isError = false, duration = 3000) {
  // Remove any existing notification
  const existingNotification = document.querySelector('.dom2code-notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  // Create notification element
  const notification = document.createElement('div');
  notification.className = `dom2code-notification ${isError ? 'error' : 'success'}`;
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${isError ? '#ef4444' : '#22c55e'};
    color: white;
    border-radius: 6px;
    font-size: 14px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    z-index: 2147483647;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.3s ease;
  `;
  
  // Add icon
  const icon = document.createElement('span');
  icon.style.marginRight = '8px';
  icon.innerHTML = isError ? '❌' : '✅';
  notification.appendChild(icon);
  
  // Add message
  const text = document.createElement('span');
  text.textContent = message;
  notification.appendChild(text);
  
  document.body.appendChild(notification);
  
  // Trigger animation
  requestAnimationFrame(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateY(0)';
  });
  
  // Remove after duration
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(20px)';
    setTimeout(() => notification.remove(), 300);
  }, duration);
}

// Initialize
function initialize() {
  try {
    createTooltip();
    setupEventListeners();
    
    // Check current state
    chrome.runtime.sendMessage({ command: 'getState' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error getting state:', chrome.runtime.lastError);
        return;
      }
      
      console.log('Initial state:', response);
      
      if (response) {
        state.isConnected = response.isConnected;
        state.isSelectionModeActive = response.isSelectionModeActive;
        
        if (state.isSelectionModeActive && !state.isConnected) {
          // If selection mode is active but we're not connected, disable it
          state.isSelectionModeActive = false;
          showNotification('Connection lost. Selection mode disabled.', true);
        } else if (state.isSelectionModeActive) {
          showNotification('Selection mode enabled');
        }
        
        if (response.settings && response.settings.highlightColor) {
          state.highlightColor = response.settings.highlightColor;
        }
      }
    });
  } catch (error) {
    console.error('Error initializing content script:', error);
    handleError(error);
  }
}

// Start the extension
initialize(); 