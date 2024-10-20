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
        console.log("Received data in sidebar:", data);  // Log the received data
  
        // Replace '\n' with actual line breaks for better formatting
        const formattedResult = data.result.replace(/\\n/g, '\n');
  
        // Check if sources exist and format them correctly
        const sourcesList = data.sources && data.sources.length > 0
          ? data.sources.map(src => {
              const sourceName = src['Source Name'] || 'Unknown Source';
              const sourceUrl = src['Source URL'] || '#';
              const claim = src['Claim'] || 'No claim provided';
              return `- **Claim**: ${claim}\n  **Source**: [${sourceName}](${sourceUrl})`;
            }).join('\n')
          : 'No sources available.';
  
        // Generate the Markdown content with the formatted result and sources
        const markdownContent = `# Summary\n\n${formattedResult}\n\n## Sources\n\n${sourcesList}`;
        console.log("Markdown content:", markdownContent);  // Log the generated Markdown content
  
        // Display the content
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