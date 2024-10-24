

class FactCheckExplorer {
  constructor(language = null, num_results = 20) {
    this.language = language;
    this.num_results = num_results;
    this.filepath = "results/";
    this.url = 'https://toolbox.google.com/factcheck/api/search';
    this.params = {
      num_results: String(this.num_results),
      force: 'false',
      offset: '0',
    };

    if (language && language.toLowerCase() !== 'all') {
      this.params.hl = language;
    }

    this.headers = {
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'application/json, text/plain, */*',
    };
  }

  _sanitizeQueryForFilename(query) {
    return query.replace(/\W+/g, '_');
  }

async fetchFactCheckData(query) {
    const baseUrl = 'https://toolbox.google.com/factcheck/api/search';
    const params = new URLSearchParams(this.params);
    params.append('query', query);
  
    // Construct the encoded URL
    const encodedUrl = encodeURIComponent(`${baseUrl}?${params.toString()}`);
  
    try {
      // Call the All Origins API
      // const response = await fetch(`https://api.allorigins.win/get?url=${encodedUrl}`);
      const response = await this.fetchFromBackground(`https://api.allorigins.win/get?url=${encodedUrl}`);
      console.log('Received Data')
      // const data = await response.json();
      const data = response
      console.log('Raw API response:', data);
  
      // Remove the prefix ")]}'" from the response contents
      const cleanedContent = data.contents.replace(/^\)\]\}\'\n/, '');
  
      // Parse the cleaned JSON content
      const parsedData = JSON.parse(cleanedContent);
      console.log('Parsed API response:', parsedData);

      return parsedData;
    } catch (error) {
      console.error("Failed to parse JSON from response:", error);
      return null;
    }
  }

  fetchFromBackground(url) {
    console.log(`Fetching from background: ${url}`);
    return new Promise((resolve, reject) => {
      // Send message to the background script with the URL
      chrome.runtime.sendMessage(
        { action: "fetchFactCheckData", url: url },
        response => {
          if (chrome.runtime.lastError) {
            console.error(`Runtime error: ${chrome.runtime.lastError.message}`);
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
  
          if (response && response.success) {
            // Return the raw JSON data
            console.log('Response data:', response.data);
            resolve(response.data);

          } else {
            const errorMessage = response ? response.error : 'No response from background script';
            console.error(`Fetch failed: ${errorMessage}`);
            reject(new Error(errorMessage));
          }
        }
      );
    });
  }
  
  
  
static cleanJson(rawJson) {
    try {
      // Check if rawJson is a string
      if (typeof rawJson !== 'string') {
        console.error('rawJson is not a string, returning empty array');
        return [];
      }
      return JSON.parse(rawJson.replace(/^\)\]\}\'\n/, ''));
    } catch (error) {
      console.error(`JSON decoding failed: ${error}`);
      return [];
    }
  }
  
extractInfo(data) {
    if (!data || !Array.isArray(data) || !data[0]) {
      console.error('Unexpected data format:', data);
      return [];
    }
  
    const parsedClaims = [];
    
    try {
      const claimsData = data[0][1];  // Assuming the claims data is at this index
      const tagMapping = Object.fromEntries(data[0][2] || []);  // Safely handle tag mapping
  
      if (!Array.isArray(claimsData) || claimsData.length === 0) {
        console.error('No claims found in data:', data);
        return [];
      }
  
      // Iterate through each claim and extract relevant information
      for (const claim of claimsData) {
        const claimDetails = FactCheckExplorer._parseClaim(claim, tagMapping);
        if (claimDetails) {
          parsedClaims.push(claimDetails);
        }
      }
      
      return parsedClaims;
    } catch (error) {
      console.error('Error extracting info:', error);
      return [];
    }
  }
  

  static _parseClaim(claim, tagMapping) {
    try {
      const claimText = claim[0] ? claim[0][0] : null;
      const sourceDetails = claim[0] && claim[0][3] ? claim[0][3][0] : null;
      const sourceName = sourceDetails && sourceDetails[0] ? sourceDetails[0][0] : null;
      const sourceUrl = sourceDetails ? sourceDetails[1] : null;
      const verdict = sourceDetails ? sourceDetails[3] : null;
      let reviewPublicationDate = (sourceDetails && sourceDetails.length > 11) ? sourceDetails[11] : null;
      // const imageUrl = (claim.length > 1) ? claim[1] : null;
      // const claimTags = (claim[0] && claim[0].length > 8 && claim[0][8]) ? claim[0][8] : [];
      // const tags = claimTags.map(tag => tagMapping[tag[0]]).filter(tag => tag !== undefined);

      if (reviewPublicationDate) {
        reviewPublicationDate = new Date(reviewPublicationDate * 1000).toISOString().replace('T', ' ').slice(0, 19);
      }

      return {
        "Claim": claimText,
        "Verdict": verdict,
        "Source Name": sourceName,
        "Source URL": sourceUrl,
        "Review Publication Date": reviewPublicationDate,
        // "Image URL": imageUrl,
        // "Tags": tags
      };
    } catch (error) {
      console.error(`Error parsing claim: ${error}`);
      return null;
    }
  }


  async process(query) {
    try {
      const rawJson = await this.fetchFactCheckData(query);
      if (!rawJson) {
        throw new Error('No data returned from fetchData');
      }
      const extractedInfo = this.extractInfo(rawJson);
      if (extractedInfo.length === 0) {
        console.error('No results extracted');
      }
      return extractedInfo;
    } catch (error) {
      console.error(`Error during fact-checking: ${error}`);
      return [];
    }
  }

 
  
  // fetchFromBackground(query) {
  //   return new Promise((resolve, reject) => {
  //     // Base URL for the fact-checking API
  //     const baseUrl = 'https://toolbox.google.com/factcheck/api/search';
  //     const params = new URLSearchParams(this.params);
  //     params.append('query', query);
  
  //     // Construct the encoded URL with parameters
  //     const targetUrl = `${baseUrl}?${params.toString()}`;
  //     const encodedUrl = encodeURIComponent(targetUrl);
  
  //     // Send message to background script
  //     chrome.runtime.sendMessage(
  //       { action: "fetchFactCheckData", url: `https://api.allorigins.win/get?url=${encodedUrl}` },
  //       response => {
  //         if (chrome.runtime.lastError) {
  //           console.error(`Runtime error: ${chrome.runtime.lastError.message}`);
  //           reject(new Error(chrome.runtime.lastError.message));
  //           return;
  //         }
  
  //         if (response && response.success) {
  //           try {
  //             // Check if response.data exists and parse it
  //             let parsedResponse;
  //             if (typeof response.data === 'string') {
  //               parsedResponse = JSON.parse(response.data);
  //             } else {
  //               parsedResponse = response.data;
  //             }
  
  //             // Check if 'contents' exists and clean it
  //             if (parsedResponse.contents) {
  //               const cleanedContent = parsedResponse.contents.replace(/^\)\]\}'\n\n/, '');
  //               parsedResponse = JSON.parse(cleanedContent);
  //             }
  
  //             // Check if the parsed data is an array
  //             if (Array.isArray(parsedResponse) && parsedResponse.length > 0) {
  //               console.log('Parsed API response:', parsedResponse);
  //               resolve(parsedResponse[0]); // Return the first element
  //             } else {
  //               console.error('Unexpected response format or empty array');
  //               reject(new Error('No valid data found in response'));
  //             }
  //           } catch (parseError) {
  //             console.error(`Error parsing data: ${parseError.message}`);
  //             reject(new Error('Failed to parse response data'));
  //           }
  //         } else {
  //           const errorMessage = response ? response.error : 'No response from background script';
  //           console.error(`Fetch failed: ${errorMessage}`);
  //           reject(new Error(errorMessage));
  //         }
  //       }
  //     );
  //   });
  // }
  
  
  
  
  
  
  
  
}

module.exports = FactCheckExplorer;

