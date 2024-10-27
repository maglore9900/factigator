let browser = (typeof chrome !== 'undefined') ? chrome : (typeof browser !== 'undefined') ? browser : null;
import Adapter from '../adapter.js';
import FactCheckExplorer from '../data_collection/factcheckexplorer.js';
import RSSreader from '../data_collection/rss_search.js';

let globalClaim = '';
let globalFactKeywords = '';
let globalFactDataPoints = '';
let globalResult = 'Gathering Data..';
let global_keywords = [];

let adapter;
let factCheckExplorer;
let rssReader;
// console.log("Content script loaded.");


// Load LLM settings from Chrome storage
function loadLLMSettings() {
    return new Promise((resolve) => {
      browser.storage.local.get(
        {
          openaiApiKey: "",
          llmType: "openai",
          openaiModel: "gpt-4o-mini",
          ollamaEndpoint: "http://localhost:11434",
          ollamaModel: "llama3.2:3b",
          googleFactCheckerEnabled: true,
          rssFeeds: [],  // Include RSS feeds
          urls: [] 
        },
        (settings) => {
          resolve(settings);
        }
      );
    });
  }

async function initializeSettings() {
  const settings = await loadLLMSettings(); // Wait for settings to load
  // console.log(`Settings loaded: ${JSON.stringify(settings)}`);
  // console.log(`factCheckExplorer: ${settings.factCheckExplorer}`);
  adapter = new Adapter(settings);
  factCheckExplorer = new FactCheckExplorer(settings); // Ensure settings are passed
  rssReader = new RSSreader(settings);
  // console.log('Initialization complete.');
}

initializeSettings().catch(error => {
  console.error('Failed to initialize settings:', error);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "factCheck") {
    // console.log("Fact check request received:", request.query);

    globalClaim = request.query; // Store the claim globally
    injectSidebar(globalClaim); // Inject the sidebar with the initial claim

    // Perform the fact-check asynchronously
    performFactCheck(request.query)
      .then(result => {
        // console.log("Fact-check result:", result);  // Log the result object

        // Update the sidebar with the final data
        updateSidebar(result);
        
        sendResponse({ status: "success", data: result });
      })
      .catch(error => {
        // console.error("Fact-check error:", error);
        sendResponse({ status: "error", error: error.message });
      });

    return true; // Keep message channel open for async response
  }
});


// Injects the sidebar with the initial claim
function injectSidebar(claim) {
  const existingSidebar = document.getElementById('sidebar-frame');
  if (existingSidebar) {
    // console.log("Sidebar is already injected.");
    return;
  }

  const sidebarFrame = document.createElement('iframe');
  sidebarFrame.id = 'sidebar-frame';
  sidebarFrame.src = chrome.runtime.getURL('sidebar/sidebar.html');
  sidebarFrame.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 300px;
    height: 100%;
    border: none;
    z-index: 9999;
    background-color: white;
  `;

  document.body.appendChild(sidebarFrame);
  document.body.style.marginLeft = '300px'; // Adjust main content

  sidebarFrame.onload = () => {
    // console.log("Sidebar loaded with initial claim.");
    sidebarFrame.contentWindow.postMessage({
      action: 'displaySummary',
      data: {
        claim: claim,
        summary: '[Pending...]',
        status: 'Loading...',
        sources: []
      }
    }, '*');
  };
}

// Updates the sidebar with the final fact-check result
function updateSidebar(result) {
  const sidebarFrame = document.getElementById('sidebar-frame');
  if (sidebarFrame) {
    // console.log("Updating sidebar with final data:", result);
    sidebarFrame.contentWindow.postMessage({
      action: 'displaySummary',
      data: {
        claim: globalClaim,
        summary: result.result, // Update with final summary text
        status: 'Completed',
        sources: result.sources
      }
    }, '*');
  } else {
    // console.error('Sidebar iframe not found.');
  }
}
    

async function retryWithKeywordsAsync(fns) {
  // Initialize results array
  const results = new Array(fns.length).fill(null);

  // Helper function to generate reduced sets of keywords
  async function generateReducedKeywords(currentKeywords) {
    const reducePrompt = `The following keywords: '{keyWords}' are too broad. Remove the least relevant keyword. Return the keywords only.`;
    const newReducedKeywordsResponse = await adapter.chat(reducePrompt.replace('{keyWords}', currentKeywords.join(' ')));
    return cleanKeywords(newReducedKeywordsResponse);
  }

  // Process each function independently
  await Promise.all(
    fns.map(async (fn, index) => {
      let iterationCount = 0;

      // Loop until result is found or keywords are exhausted
      while (true) {
        // Check if the number of iterations is less than the number of lists in global_keywords
        // console.log(`current keyword length: ${global_keywords[global_keywords.length - 1]} and length: ${global_keywords[global_keywords.length - 1].length} on i: ${iterationCount}, keyword lists count ${global_keywords.length}`);
        if (iterationCount < global_keywords.length) {
          const currentKeywords = global_keywords[global_keywords.length - 1];
          // Attempt the function with the current set of keywords
          const result = await fn(currentKeywords);

          // If a result is found, store it and break out of the loop
          if (result && result.length > 0) {
            results[index] = result;
            break;
          }
        } 
        // If iterations match global list length and the last list has more than one keyword, reduce keywords
          
        else if (global_keywords[global_keywords.length - 1].length > 1) {
          const reducedKeywords = await generateReducedKeywords(global_keywords[global_keywords.length - 1]);
          global_keywords.push(reducedKeywords);
        } 
        // If only one keyword remains, exit loop without finding a result
        else {
          // console.log(`No results found for function ${index} with reduced keywords.`);
          break;
        }

        // Increment iteration count
        iterationCount++;
      }
    })
  );

  return results;
}

function cleanKeywords(keyWords) {
  if (typeof keyWords !== 'string') {
    throw new Error('Keywords must be a string');
  }

  // Clean the string by removing non-alphanumeric characters (excluding spaces)
  const cleanedString = keyWords.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  // Split by spaces and trim each resulting part
  return cleanedString.split(/\s+/).filter(word => word);
}
  
async function performFactCheck(claim) {  
    const extractPrompt = `Extract the keywords from the following text: ${claim}. These keywords will be used to search for information in a database. Only return up to 5 key words. Do not include any other text.`;
    const validatePrompt = `Validate the following claim: ${claim} based on the following information: {report}.
  Answer the claim, if the claim is not a question, but keywords, then review the data and determine if the claim subject is true or false.
  When responding provide sources where possible so that the user can verify the information.
  Answer in the following format using Markdown:
  Verdict: <Verdict> (Acceptable values: True/False/Unverified)
  
  <Explanation>
  
  <Sources> (OPTIONAL: sources to verify the information ONLY USE VALID SOURCES/URLS/WEBSITES, if you dont know, dont include it)`;
  
    try {
      // Extract initial keywords from the claim
      let keyWordsResponse = await adapter.chat(extractPrompt);
      let keyWords = cleanKeywords(keyWordsResponse);
      global_keywords = [[...keyWords]]; // Initialize global_keywords with the initial list
  
      // Fetch the report using the current keywords
      const report = await retryWithKeywordsAsync(
        [factCheckExplorer.process.bind(factCheckExplorer), rssReader.searchMultipleFeeds.bind(rssReader)]
      );

      // Check if results are found
      if (report.some(r => r && Object.keys(r).length > 0)) {
        // Filter and aggregate valid reports
        const validReports = report.filter(r => r && Object.keys(r).length > 0);
        const validatePromptWithReport = validatePrompt.replace('{report}', JSON.stringify(validReports));
        const validateResponse = await adapter.chat(validatePromptWithReport);
        globalFactDataPoints = validReports.length;
        return { result: validateResponse };
      } else {
        return { result: 'No information found on this topic.' };
      }
    } catch (error) {
      throw new Error(`Error during fact-checking: ${error.message}`);
  }
}