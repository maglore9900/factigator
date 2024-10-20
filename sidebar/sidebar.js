// Function to create and inject the sidebar
function injectSidebar() {
    // Create the sidebar container
    const sidebar = document.createElement('div');
    sidebar.id = 'fact-check-sidebar';
    sidebar.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      width: 300px;
      height: 100%;
      background: #f0f0f0;
      border-left: 1px solid #ccc;
      z-index: 10000;
      padding: 20px;
      overflow-y: auto;
    `;
  
    // Add a placeholder for content
    const contentContainer = document.createElement('div');
    contentContainer.id = 'sidebar-content';
    sidebar.appendChild(contentContainer);
  
    // Append the sidebar to the body
    document.body.appendChild(sidebar);
  }
  
  // Function to display the summary content using Markdown
  function displaySummary(markdownContent) {
    const contentContainer = document.getElementById('sidebar-content');
    if (contentContainer && typeof marked !== 'undefined') {
      contentContainer.innerHTML = marked.parse(markdownContent);
    } else {
      console.error('Failed to load sidebar content or marked.js not available.');
    }
  }

  (() => {
    // Listen for messages from the parent page
    window.addEventListener('message', (event) => {
      if (event.data.action === 'displaySummary') {
        const { data } = event.data;
        const markdownContent = `# Summary\n\n${data.result}\n\n## Sources\n\n${data.sources.join('\n')}`;
        const contentContainer = document.getElementById('sidebar-content');
        if (contentContainer && typeof marked !== 'undefined') {
          contentContainer.innerHTML = marked.parse(markdownContent);
        } else {
          console.error('Failed to load sidebar content or marked.js not available.');
        }
      }
    });
  })();
  
  window.injectSidebar = injectSidebar;
  window.displaySummary = displaySummary;