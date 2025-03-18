/**
 * Provides utility functions for DOM manipulation
 */

/**
 * Returns the client-side JavaScript for element selection and highlighting
 * @returns String containing the JavaScript to be injected into the webview
 */
export function getWebviewScripts(): string {
  return `<script>
    const vscode = acquireVsCodeApi();
    let currentHighlight = null;
    
    // Add event listeners to all elements in the selection area
    document.querySelector('.selection-area').addEventListener('mouseover', (event) => {
      if (event.target.classList.contains('selection-area')) return;
      
      // Remove previous highlight
      if (currentHighlight) {
        currentHighlight.classList.remove('highlight');
      }
      
      // Add highlight to current element
      event.target.classList.add('highlight');
      currentHighlight = event.target;
    });
    
    // Handle click events for element selection
    document.querySelector('.selection-area').addEventListener('click', (event) => {
      if (event.target.classList.contains('selection-area')) return;
      
      event.preventDefault();
      event.stopPropagation();
      
      const selectedHTML = event.target.outerHTML;
      
      vscode.postMessage({
        command: 'injectHTML',
        html: selectedHTML
      });
      
      return false;
    });
    
    // Remove highlight when leaving selection area
    document.querySelector('.selection-area').addEventListener('mouseleave', () => {
      if (currentHighlight) {
        currentHighlight.classList.remove('highlight');
        currentHighlight = null;
      }
    });
  </script>`;
} 