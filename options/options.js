let browser = (typeof chrome !== 'undefined') ? chrome : (typeof browser !== 'undefined') ? browser : null;

document.addEventListener("DOMContentLoaded", () => {
    restoreOptions();
    setupEventHandlers();
});

function setupEventHandlers() {
    document.getElementById("llm-type").addEventListener("change", (e) => {
        toggleLLMFields(e.target.value);
    });
    document.getElementById("settings-form").addEventListener("submit", saveOptions);
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

function saveOptions(e) {
    e.preventDefault();

    const llmType = document.getElementById("llm-type").value;
    let openaiApiKey = document.getElementById("openai-api-key").value;
    const openaiModel = document.getElementById("openai-model").value;
    const ollamaEndpoint = document.getElementById("ollama-endpoint").value;
    const ollamaModel = document.getElementById("ollama-model").value;

    const googleFactCheckerEnabled = document.getElementById("google-fact-checker").checked;

    const rssFeeds = [];
    document.querySelectorAll('#rss-feed-list .input-group').forEach(div => {
        const label = div.querySelector('label').textContent;
        const checkbox = div.querySelector('input[type="checkbox"]');
        rssFeeds.push({ url: label, enabled: checkbox.checked });
    });

    const urls = [];
    document.querySelectorAll('#url-list .input-group').forEach(div => {
        const label = div.querySelector('label').textContent;
        const checkbox = div.querySelector('input[type="checkbox"]');
        urls.push({ url: label, enabled: checkbox.checked });
    });

    // Only save the API key if it is not masked (to prevent saving masked value)
    if (openaiApiKey === "********") {
        openaiApiKey = null; // Don't overwrite the saved key with masked value
    }

    browser.storage.local.set({
        llmType,
        openaiApiKey,
        openaiModel,
        ollamaEndpoint,
        ollamaModel,
        googleFactCheckerEnabled,
        rssFeeds,
        urls
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
        rssFeeds: [
            { url: 'https://www.factcheck.org/feed/', enabled: true },
            { url: 'https://www.politifact.com/rss/factchecks/', enabled: true }
        ],
        urls: [
            { url: 'snopes.com', enabled: true }
        ]
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

        // Clear and restore RSS Feeds
        const rssFeedList = document.getElementById('rss-feed-list');
        rssFeedList.innerHTML = '';
        result.rssFeeds.forEach(feed => addExistingEntry(rssFeedList, feed.url, feed.enabled));

        // Clear and restore URLs
        const urlList = document.getElementById('url-list');
        urlList.innerHTML = '';
        result.urls.forEach(url => addExistingEntry(urlList, url.url, url.enabled));

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

    const label = document.createElement('label');
    label.textContent = value;
    entryDiv.appendChild(label);

    list.appendChild(entryDiv);
}
