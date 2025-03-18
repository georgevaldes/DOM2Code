// Store element data
let elementData = null;

// Initialize UI
document.addEventListener('DOMContentLoaded', () => {
  // Get element data from background script
  chrome.runtime.onMessage.addListener((message) => {
    if (message.command === 'showDialog') {
      elementData = message.element;
      initializeDialog();
    }
  });

  // Tab handling
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      
      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Show active content
      const contents = document.querySelectorAll('.tab-content');
      contents.forEach(content => {
        if (content.dataset.tab === tabName) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
    });
  });

  // Button handlers
  document.getElementById('sendButton').addEventListener('click', handleSend);
  document.getElementById('cancelButton').addEventListener('click', () => window.close());

  // Input handlers
  document.getElementById('customId').addEventListener('input', updatePreview);
  document.getElementById('customClasses').addEventListener('input', updatePreview);
  document.getElementById('customAttributes').addEventListener('input', updatePreview);
  document.getElementById('htmlCode').addEventListener('input', () => {
    const htmlCode = document.getElementById('htmlCode').value;
    try {
      // Parse HTML to validate
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlCode, 'text/html');
      if (doc.body.firstChild) {
        elementData.html = htmlCode;
        updatePreview();
      }
    } catch (error) {
      showError('Invalid HTML');
    }
  });
});

// Initialize dialog with element data
function initializeDialog() {
  if (!elementData) return;

  // Set element info
  document.getElementById('elementTag').textContent = elementData.tagName;
  document.getElementById('elementId').textContent = elementData.id || 'No ID';
  
  // Set classes
  const classesContainer = document.getElementById('elementClasses');
  classesContainer.innerHTML = '';
  if (elementData.classes.length > 0) {
    elementData.classes.forEach(className => {
      const badge = createBadge(className);
      classesContainer.appendChild(badge);
    });
  } else {
    classesContainer.textContent = 'No classes';
  }
  
  // Set attributes
  const attributesContainer = document.getElementById('elementAttributes');
  attributesContainer.innerHTML = '';
  if (elementData.attributes.length > 0) {
    elementData.attributes.forEach(attr => {
      if (attr.name !== 'class' && attr.name !== 'id') {
        const badge = createBadge(`${attr.name}="${attr.value}"`);
        attributesContainer.appendChild(badge);
      }
    });
  } else {
    attributesContainer.textContent = 'No additional attributes';
  }
  
  // Set form values
  document.getElementById('customId').value = elementData.id || '';
  document.getElementById('customClasses').value = elementData.classes.join(' ');
  document.getElementById('htmlCode').value = formatHTML(elementData.html);
  
  // Update preview
  updatePreview();
}

// Create a badge element
function createBadge(text) {
  const badge = document.createElement('span');
  badge.className = 'badge';
  badge.textContent = text;
  return badge;
}

// Update preview based on customizations
function updatePreview() {
  const customId = document.getElementById('customId').value;
  const customClasses = document.getElementById('customClasses').value;
  const customAttributes = document.getElementById('customAttributes').value;
  
  // Create temporary element to modify
  const temp = document.createElement('div');
  temp.innerHTML = elementData.html;
  const element = temp.firstChild;
  
  // Update ID
  if (customId) {
    element.id = customId;
  } else {
    element.removeAttribute('id');
  }
  
  // Update classes
  element.className = customClasses;
  
  // Update attributes
  if (customAttributes) {
    const attrs = customAttributes.split(' ');
    attrs.forEach(attr => {
      const [name, value] = attr.split('=');
      if (name && value) {
        element.setAttribute(name, value.replace(/['"]/g, ''));
      }
    });
  }
  
  // Update HTML code
  document.getElementById('htmlCode').value = formatHTML(temp.innerHTML);
}

// Format HTML with proper indentation
function formatHTML(html) {
  const tab = '  ';
  let result = '';
  let indent = '';
  
  html.split(/>\s*</).forEach(element => {
    if (element.match(/^\/\w/)) {
      indent = indent.substring(tab.length);
    }
    
    result += indent + '<' + element + '>\n';
    
    if (element.match(/^<?\w[^>]*[^\/]$/) && !element.startsWith('input')) {
      indent += tab;
    }
  });
  
  return result.substring(1, result.length - 2);
}

// Handle send button click
function handleSend() {
  const html = document.getElementById('htmlCode').value;
  
  // Send HTML to background script
  chrome.runtime.sendMessage({
    command: 'sendHTML',
    html: html,
    metadata: {
      tagName: elementData.tagName,
      id: document.getElementById('customId').value,
      classes: document.getElementById('customClasses').value.split(' ').filter(Boolean),
      text: elementData.text
    }
  }, (response) => {
    if (response && response.success) {
      showSuccess();
      setTimeout(() => window.close(), 1500);
    } else {
      showError();
    }
  });
}

// Show success message
function showSuccess() {
  const message = document.getElementById('successMessage');
  message.classList.add('visible');
  setTimeout(() => message.classList.remove('visible'), 3000);
}

// Show error message
function showError(text = 'Failed to send HTML. Please try again.') {
  const message = document.getElementById('errorMessage');
  message.textContent = text;
  message.classList.add('visible');
  setTimeout(() => message.classList.remove('visible'), 3000);
} 