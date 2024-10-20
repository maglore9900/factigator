let browser = (typeof chrome !== 'undefined') ? chrome : (typeof browser !== 'undefined') ? browser : null;

function saveOptions(e) {
  e.preventDefault();

  const openaiApiKey = document.getElementById("openai-api-key").value;
  const llmType = document.getElementById("llm-type").value;
  const openaiModel = document.getElementById("openai-model").value;
  const ollamaEndpoint = document.getElementById("ollama-endpoint").value;
  const ollamaModel = document.getElementById("ollama-model").value;

  const status = document.getElementById("status");

  // Save options to local storage
  browser.storage.local.set({
    openaiApiKey,
    llmType,
    openaiModel,
    ollamaEndpoint,
    ollamaModel
  }, () => {
    status.textContent = "Options saved successfully!";
    setTimeout(() => {
      status.textContent = "";
    }, 2000);
    
    // Clear the API key field after saving
    document.getElementById("openai-api-key").value = '';
  });
}

function restoreOptions() {
  browser.storage.local.get({
    openaiApiKey: "",
    llmType: "openai",
    openaiModel: "gpt-4o-mini",
    ollamaEndpoint: "http://localhost:11434",
    ollamaModel: "llama3.2:3b"
  }, (result) => {
    // Set placeholder for API key without revealing it
    if (result.openaiApiKey) {
      document.getElementById("openai-api-key").placeholder = "••••••••";
    }
    document.getElementById("llm-type").value = result.llmType;
    document.getElementById("openai-model").value = result.openaiModel;
    document.getElementById("ollama-endpoint").value = result.ollamaEndpoint;
    document.getElementById("ollama-model").value = result.ollamaModel;
    
    toggleOllamaFields(result.llmType);
  });
}

function toggleOllamaFields(llmType) {
  const ollamaFields = document.getElementById("ollama-fields");
  const openaiModelGroup = document.getElementById("openai-model-group");
  
  if (llmType === "ollama") {
    ollamaFields.style.display = "block";
    openaiModelGroup.style.display = "none";
  } else {
    ollamaFields.style.display = "none";
    openaiModelGroup.style.display = "block";
  }
}

// Add event listeners
document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("settings-form").addEventListener("submit", saveOptions);
document.getElementById("llm-type").addEventListener("change", (e) => {
  toggleOllamaFields(e.target.value);
});
