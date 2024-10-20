// FactCheckExplorer.js: Converted from Python to JavaScript
const axios = require('axios');

class FactCheckExplorer {
  constructor(language = null, num_results = 100) {
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

//   async fetchData(query) {
//     try {
//       const params = { ...this.params, query };
//       const response = await axios.get(this.url, { params, headers: this.headers });
//       return response.data;
//     } catch (error) {
//       console.error(`Error fetching data: ${error}`);
//       return null;
//     }
//   }
async fetchData(query) {
    const baseUrl = 'https://toolbox.google.com/factcheck/api/search';
    const params = new URLSearchParams({
      num_results: 5,
      force: 'false',
      offset: 0,
      query: query
    });
  
    // Construct the encoded URL
    const encodedUrl = encodeURIComponent(`${baseUrl}?${params.toString()}`);
  
    try {
      // Call the All Origins API
      const response = await fetch(`https://api.allorigins.win/get?url=${encodedUrl}`);
      const data = await response.json();
  
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
  

  
  
  
  
  
  
//   static cleanJson(rawJson) {
//     try {
//       return JSON.parse(rawJson.replace(/^\)\]\}\'\n/, ''));
//     } catch (error) {
//       console.error(`JSON decoding failed: ${error}`);
//       return [];
//     }
//   }
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
  
  

//   extractInfo(data) {
//     if (!data || !Array.isArray(data) || !data[0]) {
//       return [];
//     }

//     const parsedClaims = [];
//     try {
//       const tagMapping = Object.fromEntries(data[0][2]);

//       for (const claim of data[0][1]) {
//         const claimDetails = FactCheckExplorer._parseClaim(claim, tagMapping);
//         if (claimDetails) {
//           parsedClaims.push(claimDetails);
//         }
//       }
//       return parsedClaims;
//     } catch (error) {
//       return [];
//     }
//   }
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
      const imageUrl = (claim.length > 1) ? claim[1] : null;
      const claimTags = (claim[0] && claim[0].length > 8 && claim[0][8]) ? claim[0][8] : [];
      const tags = claimTags.map(tag => tagMapping[tag[0]]).filter(tag => tag !== undefined);

      if (reviewPublicationDate) {
        reviewPublicationDate = new Date(reviewPublicationDate * 1000).toISOString().replace('T', ' ').slice(0, 19);
      }

      return {
        "Claim": claimText,
        "Source Name": sourceName,
        "Source URL": sourceUrl,
        "Verdict": verdict,
        "Review Publication Date": reviewPublicationDate,
        "Image URL": imageUrl,
        "Tags": tags
      };
    } catch (error) {
      console.error(`Error parsing claim: ${error}`);
      return null;
    }
  }


  async process(query) {
    try {
      const rawJson = await this.fetchData(query);
  
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
  
}

module.exports = FactCheckExplorer;
// Example usage:
// const factCheckExplorer = new FactCheckExplorer('en');
// factCheckExplorer.process('climate change is false').then(console.log);
