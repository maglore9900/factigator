async function retryWithKeywordsAsync(fns, keywords) {
    // Store previously reduced keyword sets
    const reducedKeywordsList = [keywords];
    const results = new Array(fns.length).fill(null); // Store results for each function
  
    // Helper function to generate reduced sets of keywords
    function generateReducedKeywords(currentKeywords) {
      const newReducedKeywords = [];
  
      // Generate all possible reductions by removing one keyword
      for (let i = 0; i < currentKeywords.length; i++) {
        const reducedSet = [
          ...currentKeywords.slice(0, i),
          ...currentKeywords.slice(i + 1)
        ];
  
        // Add only unique reduced sets to the list
        if (!reducedKeywordsList.some(set => JSON.stringify(set) === JSON.stringify(reducedSet))) {
          newReducedKeywords.push(reducedSet);
        }
      }
  
      // Add new reduced sets to the main list and return them
      reducedKeywordsList.push(...newReducedKeywords);
      return newReducedKeywords;
    }
  
    // Main logic for trying functions with keywords
    let keywordsIndex = 0;
  
    while (keywordsIndex < reducedKeywordsList.length) {
      const currentKeywords = reducedKeywordsList[keywordsIndex];
  
      // Create an array of asynchronous function calls
      const asyncCalls = fns.map(async (fn, index) => {
        // Skip if this function has already succeeded
        if (results[index] !== null) return;
  
        // Call the function asynchronously with the current keywords
        const result = await fn(currentKeywords);
  
        // Store result if successful
        if (result) {
          results[index] = result;
        }
      });
  
      // Wait for all function attempts to complete for the current keyword set
      await Promise.all(asyncCalls);
  
      // If not all functions have succeeded and keywords can be further reduced
      if (results.includes(null) && currentKeywords.length > 1) {
        generateReducedKeywords(currentKeywords);
      }
  
      // Move to the next set of keywords
      keywordsIndex++;
    }
  
    // Return the results for all functions
    return results;
  }
  
  // Example async functions to test with
  async function function1(keywords) {
    console.log(`Function 1 trying with: ${keywords.join(', ')}`);
    if (keywords.includes('Microsoft') && keywords.includes('American') && keywords.includes('Corporation')) return 'Match 1';
    return null;
  }
  
  async function function2(keywords) {
    console.log(`Function 2 trying with: ${keywords.join(', ')}`);
    if (keywords.includes('Microsoft') && keywords.includes('Corporation')) return 'Match 2';
    return null;
  }
  
  async function function3(keywords) {
    console.log(`Function 3 trying with: ${keywords.join(', ')}`);
    if (keywords.includes('American')) return 'Match 3';
    return null;
  }
  
  async function function4(keywords) {
    console.log(`Function 4 trying with: ${keywords.join(', ')}`);
    if (keywords.includes('Multinational')) return 'Match 4';
    return null;
  }
  
  // Test the asynchronous higher-order function
  const functions = [function1, function2, function3, function4];
  const keywords = ['Microsoft', 'American', 'Multinational', 'Corporation'];
  
  (async () => {
    const results = await retryWithKeywordsAsync(functions, keywords);
    console.log(`Final results: ${results}`);
  })();
  