const fetch = require('node-fetch');
const { htmlToText } = require('html-to-text');

async function getUrlContent(url) {
  try {
    // Fetch the content from the given URL
    const response = await fetch(url);

    // Check if the response is OK (status code 200-299)
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    // Get the HTML content as a string
    const htmlContent = await response.text();

    // Convert the HTML to plain text
    const plainText = htmlToText(htmlContent, {
      wordwrap: 130, // Optional: sets the max line width
      ignoreHref: true, // Optional: ignores links
      ignoreImage: true // Optional: ignores images
    });

    return plainText;
  } catch (error) {
    console.error('Error fetching or parsing URL content:', error);
    throw error; // Re-throw the error to handle it outside the function
  }
}
// Example usage:
(async () => {
  const url = 'https://www.factcheck.org/2024/10/harris-makes-unsupported-claim-about-fentanyl-flows/'; // Replace with your URL
  try {
    const content = await getUrlContent(url);
    console.log(content); // Output the content as a string
  } catch (error) {
    console.error('Failed to get content:', error.message);
  }
})();
