import { ChatOpenAI } from '@langchain/openai';
import { ChatOllama } from "@langchain/ollama";
import { ChatPromptTemplate } from '@langchain/core/prompts';


// Updated Adapter class
class Adapter {
  constructor(settings) {
    this.settings = settings;
    this.llmText = settings.llmType.toLowerCase();
    this.openAIApiKey = settings.openaiApiKey;
    this.openaiModel = settings.openaiModel;
    this.ollamaEndpoint = settings.ollamaEndpoint;
    this.ollamaModel = settings.ollamaModel;
  }

  async init() {
    // Load settings from Chrome's local storage
    // const settings = await this.loadSettings();

    if (!this.settings || !this.settings.llmType) {
      throw new Error('LLM_TYPE is not defined in local storage');
    }
    // this.llmText = settings.llmType.toLowerCase();

    if (this.llmText === 'openai') {
      this.prompt = ChatPromptTemplate.fromTemplate('answer the following request: {topic}');
      this.llmChat = new ChatOpenAI({
        temperature: 0.3,
        model: this.openaiModel,
        openAIApiKey: this.openAIApiKey
      });
    } else if (this.llmText === 'ollama') {
      if (!this.settings.ollamaModel || !this.settings.ollamaEndpoint) {
        throw new Error('OLLAMA_MODEL and OLLAMA_URL must be defined in local storage');
      }
      this.prompt = ChatPromptTemplate.fromTemplate('answer the following request: {topic}');
      this.llmChat = new ChatOllama({
        baseUrl: this.ollamaEndpoint,
        model: this.ollamaModel,
        num_ctx: 8000,
      });

    } else {
      throw new Error('Invalid LLM_TYPE specified in local storage');
    }
  }

  async chat(query) {
    console.log('Entering adapter.chat() method')
    if (!this.llmChat) {
      await this.init(); // Ensure initialization
    }
    try {
      console.log(`Sending query to LLM: ${query}`);
      const result = await this.llmChat.invoke(query);
      console.log(`Received response from LLM: ${JSON.stringify(result.content)}`);
      return JSON.stringify(result.content);
    } catch (error) {
      console.error(`Error in adapter.chat(): ${error.message}`);
      throw error; // Re-throw to catch it in performFactCheck
    }
  }
}

export default Adapter;

// //create example of usage of this class
//lets set up some code to test the functions

// const lsettings = {
//   "ollamaEndpoint": "http://localhost:11434",
//   "ollamaModel": "granite3-moe:3b-instruct-q8_0",
//   "llmType": "ollama"
// }

// const ad = new Adapter(lsettings);

//  ad.chat("What is 2+2?").then((result) => {console.log(result)})