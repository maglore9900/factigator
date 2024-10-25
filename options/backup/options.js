// let browser = (typeof chrome !== 'undefined') ? chrome : (typeof browser !== 'undefined') ? browser : null;

// function saveOptions(e) {
//   e.preventDefault();

//   const openaiApiKey = document.getElementById("openai-api-key").value;
//   const llmType = document.getElementById("llm-type").value;
//   const openaiModel = document.getElementById("openai-model").value;
//   const ollamaEndpoint = document.getElementById("ollama-endpoint").value;
//   const ollamaModel = document.getElementById("ollama-model").value;

//   const status = document.getElementById("status");
  
//   // Save options to local storage
//   browser.storage.local.set({
//     openaiApiKey,
//     llmType,
//     openaiModel,
//     ollamaEndpoint,
//     ollamaModel
//   }, () => {
//     status.textContent = "Options saved successfully!";
//     setTimeout(() => {
//       status.textContent = "";
//     }, 2000);
//   });
// }

// function restoreOptions() {
//   browser.storage.local.get({
//     openaiApiKey: "",
//     llmType: "openai",
//     openaiModel: "gpt-4o-mini",
//     ollamaEndpoint: "http://localhost:11434",
//     ollamaModel: "llama3.2:3b"
//   }, (result) => {
//     document.getElementById("openai-api-key").value = result.openaiApiKey;
//     document.getElementById("llm-type").value = result.llmType;
//     document.getElementById("openai-model").value = result.openaiModel;
//     document.getElementById("ollama-endpoint").value = result.ollamaEndpoint;
//     document.getElementById("ollama-model").value = result.ollamaModel;
    
//     toggleOllamaFields(result.llmType);
//   });
// }

// function toggleOllamaFields(llmType) {
//   const ollamaFields = document.getElementById("ollama-fields");
//   const openaiModelGroup = document.getElementById("openai-model-group");
  
//   if (llmType === "ollama") {
//     ollamaFields.style.display = "block";
//     openaiModelGroup.style.display = "none";
//   } else {
//     ollamaFields.style.display = "none";
//     openaiModelGroup.style.display = "block";
//   }
// }

// document.addEventListener("DOMContentLoaded", restoreOptions);
// document.getElementById("settings-form").addEventListener("submit", saveOptions);
// document.getElementById("llm-type").addEventListener("change", (e) => {
//   toggleOllamaFields(e.target.value);
// });

let browser = (typeof chrome !== 'undefined') ? chrome : (typeof browser !== 'undefined') ? browser : null;

document.addEventListener("DOMContentLoaded", () => {
    restoreOptions();
    setupEventHandlers();
});

function setupEventHandlers() {
    document.getElementById("llm-type").addEventListener("change", (e) => {
        toggleLLMFields(e.target.value);
        saveOptions(); // Save whenever LLM type changes
    });

    document.getElementById("settings-form").addEventListener("submit", saveOptions);

    // Add a change event listener for all checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
        checkbox.addEventListener("change", saveOptions); // Save when checkboxes change
    });

    document.getElementById("add-rss-feed").addEventListener("click", () => addEntry('rss-feed-list', 'RSS Feed'));
    document.getElementById("add-url").addEventListener("click", () => addEntry('url-list', 'URL'));

    // Add event to unmask OpenAI API key for editing
    const openaiApiKeyInput = document.getElementById("openai-api-key");
    openaiApiKeyInput.addEventListener("focus", () => unmaskApiKey(openaiApiKeyInput));
}

function toggleLLMFields(llmType) {
    const openaiKeyGroup = document.getElementById("openai-key-group");
    const openaiModelGroup = document.getElementById("openai-model-group");
    const ollamaFields = document.getElementById("ollama-fields");

    if (llmType === "ollama") {
        openaiKeyGroup.style.display = "none";
        openaiModelGroup.style.display = "none";
        ollamaFields.style.display = "block";
    } else {
        openaiKeyGroup.style.display = "block";
        openaiModelGroup.style.display = "block";
        ollamaFields.style.display = "none";
    }
}

function addEntry(listId, placeholder) {
    const list = document.getElementById(listId);
    const entryDiv = document.createElement('div');
    entryDiv.className = 'input-group';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    entryDiv.appendChild(checkbox);

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'dynamic-input';
    input.placeholder = `Enter ${placeholder}`;
    entryDiv.appendChild(input);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'btn delete-btn';
    deleteBtn.addEventListener('click', () => list.removeChild(entryDiv));
    entryDiv.appendChild(deleteBtn);

    list.appendChild(entryDiv);
}

function getEnabledItems(listId) {
  const enabledItems = [];
  document.querySelectorAll(`#${listId} .input-group`).forEach(div => {
      const input = div.querySelector('input[type="text"]');
      const checkbox = div.querySelector('input[type="checkbox"]');

      if (checkbox.checked) {
          enabledItems.push(input.value); // Add the value only if the checkbox is checked
      }
  });
  return enabledItems;
}

function saveOptions(e) {
  if (e) e.preventDefault(); // Prevent default only if called by form submission

  const llmType = document.getElementById("llm-type").value;
  let openaiApiKey = document.getElementById("openai-api-key").value;
  const openaiModel = document.getElementById("openai-model").value;
  const ollamaEndpoint = document.getElementById("ollama-endpoint").value;
  const ollamaModel = document.getElementById("ollama-model").value;

  const googleFactCheckerEnabled = document.getElementById("google-fact-checker").checked;

  // Get only enabled RSS feeds and URLs
  const enabledRssFeeds = getEnabledItems('rss-feed-list');
  const enabledUrls = getEnabledItems('url-list');

  // Only save the API key if it is not masked (to prevent saving masked value)
  if (openaiApiKey === "********") {
      openaiApiKey = null; // Don't overwrite the saved key with masked value
  }

  // Save to local storage
  browser.storage.local.set({
      llmType,
      openaiApiKey,
      openaiModel,
      ollamaEndpoint,
      ollamaModel,
      googleFactCheckerEnabled,
      enabledRssFeeds,  // Save only enabled RSS feeds
      enabledUrls       // Save only enabled URLs
  }, () => {
      const status = document.getElementById("status");
      status.textContent = "Options saved successfully!";
      setTimeout(() => { status.textContent = ""; }, 2000);

      // Mask the OpenAI API key after saving
      if (openaiApiKey) {
          maskApiKey();
      }
  });
}


function maskApiKey() {
    const apiKeyInput = document.getElementById("openai-api-key");
    apiKeyInput.type = "password";
    apiKeyInput.value = "********";
    apiKeyInput.setAttribute("readonly", true);
}

function unmaskApiKey(inputElement) {
    if (inputElement.value === "********") {
        inputElement.type = "text";
        inputElement.value = ""; // Clear the field for user input
        inputElement.removeAttribute("readonly");
    }
}

function restoreOptions() {
  browser.storage.local.get({
      llmType: "openai",
      openaiApiKey: "",
      openaiModel: "gpt-4o-mini",
      ollamaEndpoint: "http://localhost:11434",
      ollamaModel: "llama3.2:3b",
      googleFactCheckerEnabled: true,
      enabledRssFeeds: [],
      enabledUrls: []
  }, (result) => {
      document.getElementById("llm-type").value = result.llmType;
      document.getElementById("openai-model").value = result.openaiModel;
      document.getElementById("ollama-endpoint").value = result.ollamaEndpoint;
      document.getElementById("ollama-model").value = result.ollamaModel;

      // Restore OpenAI API key
      if (result.openaiApiKey) {
          document.getElementById("openai-api-key").value = "********";
          maskApiKey();
      }

      document.getElementById("google-fact-checker").checked = result.googleFactCheckerEnabled;

      // Clear and restore enabled RSS feeds
      const rssFeedList = document.getElementById('rss-feed-list');
      rssFeedList.innerHTML = '';
      result.enabledRssFeeds.forEach(feed => addExistingEntry(rssFeedList, feed, true));

      // Clear and restore enabled URLs
      const urlList = document.getElementById('url-list');
      urlList.innerHTML = '';
      result.enabledUrls.forEach(url => addExistingEntry(urlList, url, true));

      toggleLLMFields(result.llmType);
  });
}


function addExistingEntry(list, value, enabled) {
    const entryDiv = document.createElement('div');
    entryDiv.className = 'input-group';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = enabled;
    entryDiv.appendChild(checkbox);

    const input = document.createElement('input');
    input.type = 'text';
    input.value = value;
    input.className = 'dynamic-input';
    entryDiv.appendChild(input);

    list.appendChild(entryDiv);
}



