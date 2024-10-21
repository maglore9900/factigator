

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "factCheck",
    title: "Fact Check",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "factCheck" && info.selectionText) {
    // Inject the correct bundled file
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        files: ['dist/content.bundle.js']  // Use content.bundle.js instead of content.js
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error("Script injection failed:", chrome.runtime.lastError.message);
        } else {
          console.log("Script injected successfully.");
          sendMessageToContentScript(tab.id, info.selectionText);
        }
      }
    );
  }
});

  function sendMessageToContentScript(tabId, selectedText) {
    chrome.storage.local.set({ query: selectedText });
  
    // Send message to the content script
    chrome.tabs.sendMessage(tabId, { action: "factCheck", query: selectedText }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Message sending failed:", chrome.runtime.lastError.message);
      } else {
        console.log("Received response:", response);
      }
    });
  }
  