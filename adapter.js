import { ChatOpenAI } from '@langchain/openai';
import { ChatOllama } from "@langchain/ollama";
import { ChatPromptTemplate } from '@langchain/core/prompts';


// Updated Adapter class
class Adapter {
  constructor(settings) {
    this.settings = settings;
    this.llmText = settings.llmType.toLowerCase();
    console.log('LLM Type:', this.llmText)
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
      if (!this.ollamaModel || !this.ollamaEndpoint) {
        throw new Error('OLLAMA_MODEL and OLLAMA_URL must be defined in local storage');
      }
      this.prompt = ChatPromptTemplate.fromTemplate('answer the following request: {topic}');
      this.llmChat = new ChatOllama({
        baseUrl: this.ollamaEndpoint,
        model: this.ollamaModel
      });

    } else {
      throw new Error('Invalid LLM_TYPE specified in local storage');
    }
  }

  async chat(query) {
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

// (async () => {
//   const settings = {
//     llmType: 'ollama', // or 'ollama'
//     openaiApiKey: 'your_openai_api_key',
//     openaiModel: 'text-davinci-003',
//     ollamaEndpoint: 'http://localhost:11434',
//     ollamaModel: 'llama3.2:3b'
//   };

//   const adapter = new Adapter(settings);

//   try {
//     await adapter.init();
//     const response = await adapter.chat('What is the weather today?');
//     console.log('Chat response:', response);
//   } catch (error) {
//     console.error('An error occurred:', error);
//   }
// })();
