// Get UI elements
const commandInput = document.getElementById('commandInput');
const submitBtn = document.getElementById('submitBtn');

let position = { x: 0, y: 0 };
let selectedElement = null;

// Initialize position from URL parameters
function initializePosition() {
  const urlParams = new URLSearchParams(window.location.search);
  position.x = parseInt(urlParams.get('x') || '0');
  position.y = parseInt(urlParams.get('y') || '0');
  
  // Adjust position to ensure menu stays in viewport
  const rect = document.body.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  if (position.x + rect.width > viewportWidth) {
    position.x = viewportWidth - rect.width - 10;
  }
  
  if (position.y + rect.height > viewportHeight) {
    position.y = viewportHeight - rect.height - 10;
  }
  
  // Position the menu
  document.body.style.position = 'fixed';
  document.body.style.left = `${position.x}px`;
  document.body.style.top = `${position.y}px`;
}

// Handle input submission
function handleSubmit() {
  const command = commandInput.value.trim();
  if (!command) return;
  
  // Send message to background script
  chrome.runtime.sendMessage({
    command: 'sendHTML',
    html: selectedElement?.outerHTML || '',
    metadata: {
      command,
      position
    }
  }, (response) => {
    if (response.success) {
      showSuccess('Sent to Cursor');
      setTimeout(() => window.close(), 1000);
    } else {
      showError('Failed to send to Cursor');
    }
  });
}

// Handle keyboard events
function handleKeyDown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSubmit();
  } else if (e.key === 'Escape') {
    window.close();
  }
}

// Show error message
function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);
  setTimeout(() => errorDiv.remove(), 3000);
}

// Show success message
function showSuccess(message) {
  const successDiv = document.createElement('div');
  successDiv.className = 'success-message';
  successDiv.textContent = message;
  document.body.appendChild(successDiv);
  setTimeout(() => successDiv.remove(), 3000);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initializePosition();
  
  // Get selected element from background script
  chrome.runtime.sendMessage({ command: 'getSelectedElement' }, (response) => {
    if (response && response.element) {
      selectedElement = response.element;
    }
  });
  
  // Add event listeners
  commandInput.addEventListener('keydown', handleKeyDown);
  submitBtn.addEventListener('click', handleSubmit);
  
  // Focus input
  commandInput.focus();
});

// Handle click outside to close
document.addEventListener('click', (e) => {
  if (!e.target.closest('.container')) {
    window.close();
  }
}); 