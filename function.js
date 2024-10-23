function retryWithKeywords(fn, keywords) {
  // Helper function to try running the main function with the current keywords
  function tryWithKeywords(keywords) {
    if (keywords.length === 0) return null;

    // Call the original function with the current set of keywords
    const result = fn(keywords);

    // If there's a result, return it; otherwise, try again with one less keyword
    if (result) {
      return result;
    } else if (keywords.length > 1) {
      // Remove one keyword and try again
      for (let i = 0; i < keywords.length; i++) {
        const newKeywords = [...keywords.slice(0, i), ...keywords.slice(i + 1)];
        const attempt = tryWithKeywords(newKeywords);
        if (attempt) return attempt;
      }
    }

    // If all combinations are exhausted, return null
    return null;
  }

  // Start the process with the full list of keywords
  return tryWithKeywords(keywords);
}

// Example function to test with
function exampleFunction(keywords) {
  console.log(`Trying with keywords: ${keywords.join(', ')}`);
  // Simulating a scenario where only certain keyword combinations work
  if (keywords.includes('apple') && keywords.includes('banana')) {
    return 'Found a match!';
  }
  return null;
}

// Test the higher-order function
const keywords = ['apple', 'banana', 'cherry'];
const result = retryWithKeywords(exampleFunction, keywords);
console.log(`Final result: ${result}`);
