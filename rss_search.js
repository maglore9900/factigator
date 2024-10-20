const { DOMParser } = require('xmldom');
const fetch = require('node-fetch');
const { htmlToText } = require('html-to-text');

class RSSreader {
  constructor() {
    this.results = {}; // Store the final JSON results here
  }

  // Method to search through the RSS feed
  async searchRSSFeed(url, searchTerm) {
    try {
      // Fetch the RSS feed
      const response = await fetch(url);
      const rssText = await response.text();

      // Parse the XML response using xmldom
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(rssText, 'application/xml');

      // Check for parsing errors
      const parseError = xmlDoc.getElementsByTagName('parsererror')[0];
      if (parseError) {
        console.error(`Error parsing RSS feed from ${url}`);
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

      return searchResults;
    } catch (error) {
      console.error(`Error fetching or parsing RSS feed from ${url}:`, error);
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
      console.error(`Error fetching or parsing URL content from ${url}:`, error);
      return '';
    }
  }

  // Method to iterate through URLs, search each feed, and store results
  async searchMultipleFeeds(urls, searchTerm) {
    for (const url of urls) {
      console.log(`\nSearching RSS feed at: ${url}`);
      const searchResults = await this.searchRSSFeed(url, searchTerm);

      if (searchResults.length > 0) {
        for (const result of searchResults) {
          const { title, link } = result;

          // Fetch and store the content of the link
          const content = await this.getUrlContent(link);

          // Append the result to the JSON structure
          if (!this.results[url]) {
            this.results[url] = [];
          }

          this.results[url].push({
            title,
            link,
            content
          });
        }
      } else {
        console.log(`No results found for "${searchTerm}" in ${url}`);
      }
    }
  }

  // Get the results as JSON
  getResultsAsJson() {
    return JSON.stringify(this.results, null, 2); // Pretty-print JSON
  }
}

// Example usage
(async () => {
  const rssReader = new RSSreader();

  // List of RSS feed URLs
  const rssUrls = [
    'https://www.factcheck.org/feed/',
    'https://www.politifact.com/rss/factchecks/'
    // Add more URLs as needed
  ];

  const searchTerm = 'openai'; // Replace with your search term
  
  // Search through multiple feeds and store results
  await rssReader.searchMultipleFeeds(rssUrls, searchTerm);

  // Get the results as JSON
  const resultsJson = rssReader.getResultsAsJson();
  console.log(resultsJson); // Output the results as JSON
})();
