let browser = (typeof chrome !== 'undefined') ? chrome : (typeof browser !== 'undefined') ? browser : null;
import Adapter from '../adapter.js';
import FactCheckExplorer from '../data_collection/factcheckexplorer.js';
let globalClaim = '';
let globalFactKeywords = '';
let globalFactDataPoints = '';
let globalResult = 'Gathering Data..';
console.log("Content script loaded.");


// Load LLM settings from Chrome storage
async function loadLLMSettings() {
    return new Promise((resolve) => {
      browser.storage.local.get(
        {
          openaiApiKey: "",
          llmType: "openai",
          openaiModel: "gpt-4o-mini",
          ollamaEndpoint: "http://localhost:11434",
          ollamaModel: "llama3.2:3b"
        },
        (settings) => {
          resolve(settings);
        }
      );
    });
  }

// function injectSidebar() {
//   const existingSidebar = document.getElementById('sidebar-frame');
//   if (existingSidebar) {
//     console.log("Sidebar is already injected.");
//     existingSidebar.style.display = 'block'; // Ensure visibility
//     return;
//   }

//   // Create an iframe for the sidebar
//   const sidebarFrame = document.createElement('iframe');
//   sidebarFrame.id = 'sidebar-frame';
//   sidebarFrame.src = chrome.runtime.getURL('sidebar/sidebar.html');
  
//   // Sidebar styles
//   sidebarFrame.style.position = 'fixed';
//   sidebarFrame.style.top = '0';
//   sidebarFrame.style.left = '0';
//   sidebarFrame.style.width = '300px';
//   sidebarFrame.style.height = '100%';
//   sidebarFrame.style.border = 'none';
//   sidebarFrame.style.zIndex = '9999';
//   sidebarFrame.style.backgroundColor = 'white';

//   // Append the sidebar iframe to the body
//   document.body.appendChild(sidebarFrame);

//   // Adjust main content to the right to make space for the sidebar
//   document.body.style.marginLeft = '300px'; // Push content to the right by 300px
// }


// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === "factCheck") {
//     console.log("Fact check request received:", request.query);
//     globalClaim = request.query; // Store the claim globally
//     performFactCheck(request.query)
//       .then(result => {
//         console.log("Fact-check result:", result);  // Log the result object

//         injectSidebar(); // Inject the sidebar as an iframe

//         // Send data to the iframe via postMessage
//         const sidebarFrame = document.getElementById('sidebar-frame');
//         if (sidebarFrame) {
//           sidebarFrame.onload = () => {
//             console.log("Sending data to sidebar:", result); // Log the data being sent
//             sidebarFrame.contentWindow.postMessage({
//               action: 'displaySummary',
//               data: {
//                 ...result,
//                 claim: globalClaim // Include globalClaim
//               }
//             }, '*');
//           };
//         } else {
//           console.error('Sidebar iframe not found.');
//         }

//         sendResponse({ status: "success", data: result });
//       })
//       .catch(error => {
//         console.error("Fact-check error:", error);
//         sendResponse({ status: "error", error: error.message });
//       });

//     return true; // Keep the message channel open for async response
//   }
// });


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "factCheck") {
    console.log("Fact check request received:", request.query);

    globalClaim = request.query; // Store the claim globally
    injectSidebar(globalClaim); // Inject the sidebar with the initial claim

    // Perform the fact-check asynchronously
    performFactCheck(request.query)
      .then(result => {
        console.log("Fact-check result:", result);  // Log the result object

        // Update the sidebar with the final data
        updateSidebar(result);
        
        sendResponse({ status: "success", data: result });
      })
      .catch(error => {
        console.error("Fact-check error:", error);
        sendResponse({ status: "error", error: error.message });
      });

    return true; // Keep message channel open for async response
  }
});

// Injects the sidebar with the initial claim
function injectSidebar(claim) {
  const existingSidebar = document.getElementById('sidebar-frame');
  if (existingSidebar) {
    console.log("Sidebar is already injected.");
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
    console.log("Sidebar loaded with initial claim.");
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
    console.log("Updating sidebar with final data:", result);
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
    console.error('Sidebar iframe not found.');
  }
}


  
  async function performFactCheck(claim) {
    const adapter = new Adapter();
    const factCheckExplorer = new FactCheckExplorer();
    const extractPrompt = `Extract the keywords from the following text: ${claim}. These keywords will be used to search for information in a database. Only return the key words. Do not include any other text.`;
    const validatePrompt = `Validate the following claim: ${claim} based on the following information: {report}.
  Answer the claim, if the claim is not a question, but keywords, then review the data and determine if the claim subject is true or false.
  When responding provide sources where possible so that the user can verify the information.
  Answer in the following format using Markdown:
  Verdict: <Verdict> (Acceptable values: True/False/Unverified)
  
  <Explanation>
  
  <Sources> (OPTIONAL: sources to verify the information ONLY USE VALID SOURCES/URLS/WEBSITES, if you dont know, dont include it)`;
    const reducePrompt = `The following keywords: '{keyWords}' are too broad. The most important keywords are typically nouns. Remove the least relevant keyword. Return the reduced keywords only.`;
  
      function cleanKeywords(keyWords) {
          if (typeof keyWords !== 'string') {
            throw new Error('Keywords must be a string');
          }
          // Replace all non-alphanumeric characters, excluding spaces
          return keyWords.replace(/[^a-zA-Z0-9\s]/g, '').trim();
        }
    
      try {
        let keyWordsResponse = await adapter.chat(extractPrompt);
        let keyWords = cleanKeywords(keyWordsResponse);
        globalFactKeywords = keyWords;
        console.log(`Extracted key words: ${keyWords}`);
  
        //Google Fact Check API
        while (true) {
          // Fetch the report using the current keywords
          const report = await factCheckExplorer.process(keyWords);
        
          // If results are found, validate and return them
          if (report.length > 0) {
            const validatePromptWithReport = validatePrompt.replace('{report}', JSON.stringify(report));
            const validateResponse = await adapter.chat(validatePromptWithReport);
            console.log(`Validation Result: ${JSON.stringify(validateResponse)}`);
            globalFactDataPoints = report.length
            return { result: validateResponse};
          }
        
          // If no results and only one keyword left, exit
          if (keyWords.length === 1) {
            console.log("Only one keyword left with no results. Exiting.");
            break;  // This ensures the loop exits when there's only one keyword left and no results
          }
        
          // Reduce the keywords if there are no results and more than one keyword
          console.log(`Initial search returned 0 results, retrying with reduced keywords: ${keyWords}`);
          const reducedKeyWordsResponse = await adapter.chat(reducePrompt.replace('{keyWords}', keyWords));
          const newKeyWords = cleanKeywords(reducedKeyWordsResponse);
          globalFactKeywords = newKeyWords;
        
          // If reducing keywords results in no change, break to prevent infinite loop
          if (newKeyWords === keyWords || !newKeyWords) {
            console.log("No further reduction possible or no keywords left. Exiting.");
            break;
          }
        
          // Update keywords for the next iteration
          keyWords = newKeyWords;
        }
        
                
    } catch (error) {
        throw new Error(`Error during fact-checking: ${error.message}`);
      }
    }