import { DOMParser } from 'xmldom';
import fetch from 'node-fetch';
import { htmlToText } from 'html-to-text';

class RSSreader {
  constructor(settings) {
    this.settings = settings;
    this.results = {}; // Store the final JSON results here
    this.rssUrls = [];
    this.getContent = 0; // Counter for fetched content

    this.initFunction(); // Call the initialization function
  }

  initFunction() {
    this.getDomain(this.settings.rssFeeds); // Call getDomain with provided URLs
    console.log(this.rssUrls);
  }

  async getDomain(urls) {
    for (const url of urls) {
      const parts = url.split('.');
      const domain = `${parts[1]}.${parts[2]}`; // Get the second element
      this.rssUrls.push({ url: url, domain: domain });
    }
  }

  async fetchRSSData(url) {
    const baseUrl = encodeURIComponent(url); // Ensure URL is encoded
    try {
      // Fetch the RSS feed through the proxy
      const response = await fetch(`https://api.allorigins.win/get?url=${baseUrl}`);
      
      // Check if the response is ok
      if (!response.ok) {
        console.error("Failed to fetch RSS feed:", response.statusText);
        return null;
      }
  
      // Parse the JSON response from AllOrigins
      const data = await response.json();
  
      // Extract the contents from the 'contents' property
      if (data.contents) {
        return data.contents; // Return the RSS content as text
      } else {
        console.error("No contents found in response");
        return null;
      }
    } catch (error) {
      console.error("Failed to fetch or parse RSS feed:", error);
      return null;
    }
  }
  
  async searchRSSFeed(url, searchTerm) {
    try {
      // Fetch the RSS feed
      let rssText = null;

      if (this.getContent < this.rssUrls.length) {
        rssText = await this.fetchRSSData(url);
        this.getContent += 1
      }
      // const rssText = await this.fetchData(url);
  
      // Check if rssText is null or empty
      if (!rssText) {
        // console.error(`Failed to fetch RSS feed from ${url}`);
        return [];
      }
      if (rssText.startsWith('data:application/rss+xml; charset=UTF-8;base64,')) {
        const base64Data = rssText.split(',')[1]; // Get the Base64 content after the comma
        const decodedText = Buffer.from(base64Data, 'base64').toString('utf-8');
        rssText = decodedText;
      }
      // console.log(`Readable text ${rssText}`);
      // Parse the XML response using xmldom
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(rssText, 'application/xml');
  
      // Check for parsing errors
      const parseError = xmlDoc.getElementsByTagName('parsererror')[0];
      if (parseError) {
        // console.error(`Error parsing RSS feed from ${url}`);
        return [];
      }
  
      // Get all <item> elements in the feed
      const items = xmlDoc.getElementsByTagName('item');
  
      // Search for the term in the title or description of each item
      const searchResults = Array.from(items).filter(item => {
        const title = item.getElementsByTagName('title')[0]?.textContent || '';
        const description = item.getElementsByTagName('description')[0]?.textContent || '';
        return (
          title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }).map(item => {
        const title = item.getElementsByTagName('title')[0]?.textContent || 'No title';
        const link = item.getElementsByTagName('link')[0]?.textContent || 'No link';
        return { title, link };
      });
      // console.log(`Found results in ${url}, with keyword "${searchTerm}":`);
      return searchResults;
    } catch (error) {
      // console.error(`Error fetching or parsing RSS feed from ${url}:`, error);
      return [];
    }
  }
  

  // Method to get content from a URL and convert it to plain text
  async getUrlContent(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      }
      const htmlContent = await response.text();
      const plainText = htmlToText(htmlContent, {
        wordwrap: 130,
        ignoreHref: true,
        ignoreImage: true
      });

      return plainText;
    } catch (error) {
      // console.error(`Error fetching or parsing URL content from ${url}:`, error);
      return '';
    }
  }

  async searchMultipleFeeds(searchTerm) {
    let foundResults = false; // To check if any results are found
  
    // Create an array of promises for concurrent feed searches
    const feedPromises = this.rssUrls.map(async ({ url, domain }) => {
      console.log(`\nSearching RSS feed at: ${url} (${domain})`);
  
      // Search the RSS feed for the given term
      const searchResults = await this.searchRSSFeed(url, searchTerm);
  
      if (searchResults.length > 0) {
        foundResults = true; // Mark that results are found
        // console.log(`Found results in ${url}:`, searchResults);
  
        // Initialize the result array for the identifier if it doesn't exist
        if (!this.results[domain]) {
          this.results[domain] = [];
        }
  
        // Append search results to the results array for the identifier
        this.results[domain].push(...searchResults);
      } else {
        // console.log(`No results found for "${searchTerm}" in ${identifier}`);
      }
    });
  
    // Run all feed searches concurrently
    await Promise.all(feedPromises);
  
    // Return the results or an empty object
    return foundResults ? this.results : {};
  }
  
  

  // Get the results as JSON
  getResultsAsJson() {
    return JSON.stringify(this.results, null, 2); // Pretty-print JSON
    // return {
    //   json: JSON.stringify(this.results, null, 2), // Pretty-printed JSON string
    //   domains: Object.keys(this.results) // List of the domains
    // };
  }
}

export default RSSreader;


// Example usage
// (async () => {
//   const settings = {
//     rssFeeds: [
//       'https://www.factcheck.org/feed/',
//       'https://www.politifact.com/rss/factchecks/'
//     ]
//   };

//   let rssReader = new RSSreader(settings);
//   let results = await rssReader.searchMultipleFeeds('kamala');
//   console.log(results); // Output the results as JSON
// })();