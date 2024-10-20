import { OpenAI, ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { ChatOllama } from "@langchain/ollama";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { ChatPromptTemplate } from '@langchain/core/prompts';

// Updated Adapter class
class Adapter {
  constructor() {
    this.llm = null;
    this.prompt = null;
    this.llmChat = null;
  }

  async init() {
    // Load settings from Chrome's local storage
    const settings = await this.loadSettings();

    if (!settings || !settings.llmType) {
      throw new Error('LLM_TYPE is not defined in local storage');
    }
    this.llmText = settings.llmType.toLowerCase();

    if (this.llmText === 'openai') {
      this.prompt = ChatPromptTemplate.fromTemplate('answer the following request: {topic}');
      this.llmChat = new ChatOpenAI({
        temperature: 0.3,
        model: settings.openaiModel,
        openAIApiKey: settings.openaiApiKey
      });
    } else if (this.llmText === 'ollama') {
      if (!settings.ollamaModel || !settings.ollamaEndpoint) {
        throw new Error('OLLAMA_MODEL and OLLAMA_URL must be defined in local storage');
      }
      const llmModel = settings.ollamaModel;
      this.prompt = ChatPromptTemplate.fromTemplate('answer the following request: {topic}');
      this.llmChat = new ChatOllama({
        baseUrl: settings.ollamaEndpoint,
        model: llmModel
      });

    } else {
      throw new Error('Invalid LLM_TYPE specified in local storage');
    }
  }

  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(
        {
          openaiApiKey: "",
          llmType: "openai",
          openaiModel: "gpt-4o-mini",
          ollamaEndpoint: "http://localhost:11434",
          ollamaModel: "llama3.2:3b"
        },
        (settings) => {
          resolve(settings);
        }
      );
    });
  }

  async chat(query) {
    if (!this.llmChat) {
      await this.init(); // Ensure initialization
    }
    console.log(`Adapter query: ${query}`);
    const result = await this.llmChat.invoke(query);
    console.log(`Adapter response: ${JSON.stringify(result.content)}`);
    return JSON.stringify(result.content);
  }
}

export default Adapter;
