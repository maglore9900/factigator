// Main.js: Converted from Python to JavaScript

import Adapter from './adapter.js';
import FactCheckExplorer from './factcheckexplorer.js';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

(async () => {
  // Initialize environment variables from .env file
  const env = process.env;

  const adapter = new Adapter(env);
  const factCheckExplorer = new FactCheckExplorer(env.API_KEY, env.FACT_CHECK_BASE_URL);

  rl.question("Enter a claim to validate: ", async (claim) => {
    const extractPrompt = `Extract the keywords from the following text: ${claim}. These keywords will be used to search for information in a database. Only return the key words. Do not include any other text.`;
    const validatePrompt = `Validate the following claim: ${claim} based on the following information: {report}.
Answer the claim, if the claim is not a question, but keywords, then review the data and determine if the claim subject is true or false.
When responding provide sources where possible so that the user can verify the information.`;
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
      console.log(`Extracted key words: ${keyWords}`);

      while (true) {
        const report = await factCheckExplorer.process(keyWords);
        if (report.length === 0) {
          if (!keyWords) {
            console.log("No keywords extracted. Exiting.");
            break;
          } else {
            let reducedKeyWordsResponse = await adapter.chat(reducePrompt.replace('{keyWords}', keyWords));
            keyWords = cleanKeywords(reducedKeyWordsResponse);
            console.log(`Initial search returned 0 results, retrying with reduced key words: ${keyWords}`);
          }
        } else {
          const validatePromptWithReport = validatePrompt.replace('{report}', JSON.stringify(report));
          let validateResponse = await adapter.chat(validatePromptWithReport);
          console.log(`Validation Result: ${JSON.stringify(validateResponse)}`);
          return { result: validateResponse, sources: report };
          
        }
      }
    } catch (error) {
      console.error('Error in main process:', error);
    } finally {
      rl.close();
    }
  });
})();
