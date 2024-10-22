// Function to create the sidebar structure
function createSidebarElements() {
  const sidebar = document.getElementById('sidebar-content');

  if (!sidebar) {
    console.error('Sidebar container not found!');
    return;
  }

  // Claim element
  const claimElement = document.createElement('div');
  claimElement.id = 'claim-text';
  claimElement.innerHTML = '<strong>Claim:</strong> Loading...';
  sidebar.appendChild(claimElement);

  // Summary element
  const summaryElement = document.createElement('div');
  summaryElement.id = 'summary-text';
  summaryElement.innerHTML = '<strong>Summary:</strong> [Pending...]';
  sidebar.appendChild(summaryElement);

  // Status element
  const statusElement = document.createElement('div');
  statusElement.id = 'status-text';
  statusElement.innerHTML = '<strong>Status:</strong> Loading...';
  sidebar.appendChild(statusElement);

  // Sources element
  const sourcesElement = document.createElement('div');
  sourcesElement.id = 'sources-text';
  sourcesElement.innerHTML = '<strong>Data Points:</strong> Pending sources...';
  sidebar.appendChild(sourcesElement);
}

// Function to update the sidebar elements dynamically
function updateSidebarContent(data) {
  // Select sidebar elements
  const claimElement = document.getElementById('claim-text');
  const summaryElement = document.getElementById('summary-text');
  const statusElement = document.getElementById('status-text');
  const sourcesElement = document.getElementById('sources-text');

  // Update claim
  if (claimElement) {
    claimElement.innerHTML = `<strong>Claim:</strong> ${data.claim || 'No claim provided.'}`;
  } else {
    console.error('Claim element not found.');
  }

  // Update summary if available
  if (summaryElement) {
    const formattedSummary = data.summary ? data.summary.replace(/^"|"$/g, '').replace(/\\n/g, '\n') : '[Pending...]';
    if (typeof marked !== 'undefined') {
      summaryElement.innerHTML = `<strong>Summary:</strong><br>${marked.parse(formattedSummary)}`;
    } else {
      summaryElement.innerHTML = `<strong>Summary:</strong><br>${formattedSummary}`;
    }
  } else {
    console.error('Summary element not found.');
  }

  // Update status
  if (statusElement) {
    statusElement.innerHTML = `<strong>Status:</strong> ${data.status || 'No status available.'}`;
  } else {
    console.error('Status element not found.');
  }

  // Update sources if available
  if (sourcesElement) {
    const sourcesList = data.sources && data.sources.length > 0
      ? data.sources.map(src => {
          const sourceName = src['Source Name'] || 'Unknown Source';
          const sourceUrl = src['Source URL'] || '#';
          const claim = src['Claim'] || 'No claim provided';
          return `<li><strong>Claim:</strong> ${claim}<br><strong>Source:</strong> <a href="${sourceUrl}" target="_blank">${sourceName}</a></li>`;
        }).join('')
      : 'No sources available.';
    sourcesElement.innerHTML = `<strong>Data Points:</strong><ul>${sourcesList}</ul>`;
  } else {
    console.error('Sources element not found.');
  }
}

// Listen for messages from index.js
window.addEventListener('message', (event) => {
  if (event.data.action === 'displaySummary') {
    console.log("Received data in sidebar:", event.data.data);  // Log the received data
    updateSidebarContent(event.data.data);
  }
});

// Initialize the sidebar once the page loads
document.addEventListener('DOMContentLoaded', () => {
  const sidebarContainer = document.createElement('div');
  sidebarContainer.id = 'sidebar-content';
  sidebarContainer.style.cssText = `
    padding: 10px;
    font-family: Arial, sans-serif;
    font-size: 14px;
  `;
  document.body.appendChild(sidebarContainer);

  // Create the sidebar elements
  createSidebarElements();
});
