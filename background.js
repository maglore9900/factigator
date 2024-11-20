chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "factCheck",
    title: "Fact Check",
    contexts: ["selection"],
  });
});

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.tabs.create({ url: "./welcome/welcome.html" });
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "factCheck" && info.selectionText) {
    // Inject the correct bundled file
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        files: ["dist/content.bundle.js"], // Use content.bundle.js instead of content.js
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error(
            "Script injection failed:",
            chrome.runtime.lastError.message
          );
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
  chrome.tabs.sendMessage(
    tabId,
    { action: "factCheck", query: selectedText },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error(
          "Message sending failed:",
          chrome.runtime.lastError.message
        );
      } else {
        console.log("Received response:", response);
      }
    }
  );
}

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === "fetchFactCheckData") {
//     (async () => {
//       try {
//         const response = await fetch(request.url);
//         if (!response.ok) {
//           throw new Error(`Network response was not ok: ${response.statusText}`);
//         }

//         // Parse the response as JSON or text (depending on what is expected)
//         const data = await response.json(); // Or use response.text() if needed

//         sendResponse({ success: true, data }); // Send parsed data
//       } catch (error) {
//         sendResponse({ success: false, error: error.message });
//       }
//     })();

//     return true; // Keeps the message channel open for asynchronous response
//   }
// });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchFactCheckData") {
    (async () => {
      try {
        const response = await fetch(request.url, {
          method: "GET", // You can specify the method explicitly if needed
          headers: {
            "User-Agent": "Mozilla/5.0", // Set your custom User-Agent here
            Accept: "application/json, text/plain, */*", // Add other custom headers if necessary, e.g., 'Accept': 'application/json'
          },
        });

        if (!response.ok) {
          throw new Error(
            `Network response was not ok: ${response.statusText}`
          );
        }

        // Parse the response as JSON or text (depending on what is expected)
        const data = await response.text(); // Or use response.text() if needed
        sendResponse({ success: true, data }); // Send parsed data
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();

    return true; // Keeps the message channel open for asynchronous response
  }
});
