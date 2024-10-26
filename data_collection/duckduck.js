import { DuckDuckGoSearch } from "@langchain/community/tools/duckduckgo_search";
import { htmlToText } from "html-to-text";
import { load } from 'cheerio';
import fetch from 'node-fetch';

class DuckDuckGo {
  constructor(settings) {
    this.rawUrls = settings.urls;
    this.webUrls = []; // Initialize webUrls
    this.tool = new DuckDuckGoSearch({ maxResults: 10 });
    this.initFunction(); // Call the initialization function
  }

  initFunction() {
    this.getDomain(this.rawUrls); // Call getDomain with provided URLs
  }
  
  async cleanURL(url) {
    //remove http and https
    url.replace(/^https?:\/\//, '').replace( /www/, '');
    return url.replace(/^https?:\/\//, '');
  }
  
  async getDomain(urls) {
    for (const { enabled, url } of urls) {
      if (enabled) {
        // Extract the domain from the URL
        const parts = url.split('.');
        const domain = `${parts[0]}.${parts[1]}`; // Get the second and third parts
        
        // Push the URL and domain to rssUrls
        let clean_url = await this.cleanURL(url); // Clean the URL
        this.webUrls.push({ url: clean_url, domain: domain });
      }
    }
    console.log(`Websearch URLs: ${JSON.stringify(this.webUrls)}`);
  }
  // Method to get the search result
  async waitForWebUrls(timeout = 5000) {
    const start = Date.now();

    while (this.webUrls.length === 0) {
      if (Date.now() - start > timeout) {
        console.error("Timeout waiting for webUrls to populate.");
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms before retrying
    }
    return true;
  }

  async search(keywords) {
    const ready = await this.waitForWebUrls();
    if (!ready) {
      console.error("Failed to initialize webUrls.");
      return null;
    }
    for (const { url } of this.webUrls) {
      const result = await this.tool.invoke(`${url}: ${keywords}`);
      // Check if the result is a string, and parse it
      let parsedResult;
      if (typeof result === 'string') {
        try {
          parsedResult = JSON.parse(result);
        } catch (error) {
          console.error("Error parsing result:", error);
          return;
        }
      } else {
        parsedResult = result;
      }

      // Check if parsedResult is an array and has elements
      if (Array.isArray(parsedResult) && parsedResult.length > 0) {
        // Destructure the first object in the array
        let { title, link, snippet } = parsedResult[0];

        // Convert HTML snippet to plain text
        snippet = htmlToText(snippet, {
          wordwrap: false,
          preserveNewlines: false
        });

        // Fetch and return the URL content
        const verdict = await this.getUrlContent(link);

        // Return the results as an object
        return {
          title,
          link,
          snippet,
          verdict
        };
      } else {
        console.error("Unexpected result format:", JSON.stringify(parsedResult, null, 2));
        return null;
      }
    }
  }

  // Method to get content from a URL
  async getUrlContent(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      }

      // Get the HTML content
      const htmlContent = await response.text();

      // Load the HTML content into Cheerio
      const $ = load(htmlContent);

      // Extract content from "fact_check_info_wrapper"
      const factCheckInfos = [];
      $('.fact_check_info_wrapper').each((index, element) => {
        let textContent = $(element).text();

        // Clean up: Remove excess newlines and spaces
        textContent = textContent
          .replace(/\s*\n\s*/g, ' ') // Replace newlines surrounded by whitespace with a single space
          .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
          .trim(); // Trim leading and trailing whitespace

        factCheckInfos.push(textContent); // Add cleaned text to the array
      });

      // If "fact_check_info_wrapper" is empty, extract from "rating_title_wrap"
      let content = factCheckInfos;
      if (factCheckInfos.length === 0) {
        const ratingTitles = [];
        $('.rating_title_wrap').each((index, element) => {
          // Get only the direct text content inside "rating_title_wrap"
          let textContent = $(element)
            .contents()
            .filter((_, node) => node.type === 'text')
            .text();

          // Clean up: Remove excess newlines and spaces
          textContent = textContent
            .replace(/\s*\n\s*/g, ' ') // Replace newlines surrounded by whitespace with a single space
            .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
            .trim(); // Trim leading and trailing whitespace

          if (textContent) {
            ratingTitles.push(textContent); // Add cleaned text to the array
          }
        });

        content = ratingTitles; // Set content to ratingTitles if factCheckInfos is empty
      }

      return content; // Return the cleaned plain text content
    } catch (error) {
      console.error(`Error fetching or parsing URL content from ${url}:`, error);
      return [];
    }
  }
}

export default DuckDuckGo;


// const settings = {
//   urls: [
//     { enabled: true, url: 'http://www.snopes.com' },
//   ]
// };
// (async () => {
//   const duckDuckGo = new DuckDuckGo(settings);
//   const searchResult = await duckDuckGo.search("kamala");

//   if (searchResult) {
//     console.log("Search Result:", searchResult);
//   } else {
//     console.error("Failed to get search result.");
//   }
// })();
