/**
 * LM Studio Service - Server side integration using SDK
 * Handles all communication with LM Studio API from backend
 */

import { LMStudioClient } from "@lmstudio/sdk";
const contextBuilder = require("./contextBuilder");

interface LMStudioResponse {
  success: boolean;
  data?: any;
  error?: string;
  fullResponse?: string;
  metadata?: {
    model: string;
    response_time_ms: number;
    streaming: boolean;
    character_count: number;
    purpose?: string;
  };
}

interface ChatMessage {
  type: string;
  content: string;
  timestamp?: string;
  assistant?: string;
}

class LMStudioService {
  private client: LMStudioClient;
  private model: any;
  private isInitialized: boolean;

  constructor() {
    this.client = new LMStudioClient();
    this.model = null;
    this.isInitialized = false;
  }

  /**
   * Initialize LM Studio client and get model
   */
  async initialize(): Promise<LMStudioResponse> {
    try {
      console.log("🚀 Initializing LM Studio client...");

      // Get the first available model
      this.model = await this.client.llm.model("qwen/qwen3-4b-2507");

      if (!this.model) {
        throw new Error("No models available in LM Studio");
      }

      console.log(
        `✅ LM Studio initialized with model: ${this.model.id || "default"}`
      );
      this.isInitialized = true;

      return {
        success: true,
      };
    } catch (error: any) {
      console.error("❌ LM Studio initialization failed:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Test connection to LM Studio
   */
  async testConnection(): Promise<LMStudioResponse> {
    try {
      console.log("🧪 Testing LM Studio connection...");

      if (!this.isInitialized) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          return initResult;
        }
      }

      // Test with a simple completion
      const testResponse = await this.model.respond("Hello", {
        maxTokens: 5,
        temperature: 0.1,
      });

      let responseText = "";
      for await (const fragment of testResponse) {
        responseText += fragment.content;
      }

      console.log(`✅ LM Studio connection successful: "${responseText}"`);

      return {
        success: true,
        data: {
          model: this.model.id || "default",
          testResponse: responseText,
        },
      };
    } catch (error: any) {
      console.error("❌ LM Studio connection test failed:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send chat completion request (non-streaming) with full context chain
   */
  async sendChatCompletion(
    message: string,
    chatHistory: ChatMessage[] = [],
    options: { temperature?: number; maxTokens?: number } = {}
  ): Promise<LMStudioResponse> {
    try {
      const { temperature = 0.7, maxTokens = 10240 } = options;

      if (!this.isInitialized) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          return initResult;
        }
      }

      // 🏗️ BUILD COMPLETE CONTEXT CHAIN using ContextBuilder
      console.log(`🏗️ Building complete context chain for non-streaming...`);
      const contextResult = await contextBuilder.buildLLMContext(
        message,
        chatHistory
      );

      if (!contextResult.success && !contextResult.fallback) {
        return {
          success: false,
          error: `Context building failed: ${contextResult.error}`,
        };
      }

      const messages = contextResult.messages;

      console.log(`🎯 Context chain built for completion:`, {
        success: contextResult.success,
        fallback: contextResult.fallback || false,
        ...contextResult.metadata,
      });

      console.log(`📤 Sending chat completion request:`, {
        model: this.model.id || "default",
        messageCount: messages.length,
        temperature,
        maxTokens,
      });

      const startTime = Date.now();

      // Use SDK's respond method
      const prediction = this.model.respond(messages, {
        temperature,
        maxTokens,
      });

      // Collect the full response
      let fullResponse = "";
      for await (const fragment of prediction) {
        fullResponse += fragment.content;
      }

      const totalTime = Date.now() - startTime;
      console.log(
        `🎉 Chat completion successful: ${fullResponse.length} chars in ${totalTime}ms`
      );

      return {
        success: true,
        fullResponse: fullResponse,
        metadata: {
          model: this.model.id || "default",
          response_time_ms: totalTime,
          streaming: false,
          character_count: fullResponse.length,
        },
      };
    } catch (error: any) {
      console.error("❌ Chat completion failed:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Stream chat completion request (streaming) with full context chain
   */
  async *streamChatCompletion(
    message: string,
    chatHistory: ChatMessage[] = [],
    options: { temperature?: number; maxTokens?: number } = {}
  ): AsyncGenerator<string, void, unknown> {
    try {
      const { temperature = 0.7, maxTokens = 10240 } = options;

      if (!this.isInitialized) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          throw new Error(`Initialization failed: ${initResult.error}`);
        }
      }

      // 🏗️ BUILD COMPLETE CONTEXT CHAIN using ContextBuilder
      console.log(`🏗️ Building complete context chain...`);
      const contextResult = await contextBuilder.buildLLMContext(
        message,
        chatHistory
      );

      if (!contextResult.success && !contextResult.fallback) {
        throw new Error(`Context building failed: ${contextResult.error}`);
      }

      const messages = contextResult.messages;

      console.log(`🎯 Context chain built:`, {
        success: contextResult.success,
        fallback: contextResult.fallback || false,
        ...contextResult.metadata,
      });

      console.log(`📤 Starting streaming chat completion:`, {
        model: this.model.id || "default",
        messageCount: messages.length,
        temperature,
        maxTokens,
      });

      // 🔍 COUNT INPUT TOKENS BEFORE STREAMING
      try {
        const { Chat } = await import("@lmstudio/sdk");
        const chat = Chat.from(
          messages.map((msg: any) => ({
            ...msg,
            role: msg.role as "system" | "user" | "assistant",
          }))
        );
        const formatted = await this.model.applyPromptTemplate(chat);
        const inputTokens = await this.model.countTokens(formatted);
        const contextLength = await this.model.getContextLength();

        console.log(`🔢 INPUT TOKEN ANALYSIS:`, {
          inputTokens,
          contextLength,
          usagePercentage: `${((inputTokens / contextLength) * 100).toFixed(
            1
          )}%`,
          remainingTokens: contextLength - inputTokens,
          formattedPromptLength: formatted.length,
        });
      } catch (tokenError: any) {
        console.log(`⚠️ Could not analyze input tokens:`, tokenError.message);
      }

      const startTime = Date.now();

      // Use SDK's respond method for streaming
      const prediction = this.model.respond(messages, {
        temperature,
        maxTokens,
      });

      let fullResponse = "";
      let chunkCount = 0;

      // Stream each fragment
      for await (const fragment of prediction) {
        if (fragment.content) {
          fullResponse += fragment.content;
          chunkCount++;
          console.log(
            `📦 Streaming chunk #${chunkCount}: "${fragment.content}"`
          );

          // 🔍 LOG RAW FRAGMENT DATA FOR TOKEN ANALYSIS
          console.log(
            `🔍 RAW FRAGMENT DATA:`,
            JSON.stringify(fragment, null, 2)
          );

          yield fragment.content;
        }
      }

      // 🔍 TRY TO ACCESS PREDICTION STATS AFTER COMPLETION
      try {
        console.log(`🔍 POST-STREAMING PREDICTION STATS:`, {
          predictionType: typeof prediction,
          predictionConstructor: prediction.constructor?.name,
          predictionKeys: Object.keys(prediction),
          predictionMethods: Object.getOwnPropertyNames(
            Object.getPrototypeOf(prediction)
          ),
        });

        // Try common token-related properties
        if ("stats" in prediction)
          console.log(`🔍 STREAMING PREDICTION.STATS:`, prediction.stats);
        if ("usage" in prediction)
          console.log(`🔍 STREAMING PREDICTION.USAGE:`, prediction.usage);
        if ("tokens" in prediction)
          console.log(`🔍 STREAMING PREDICTION.TOKENS:`, prediction.tokens);
        if ("metadata" in prediction)
          console.log(`🔍 STREAMING PREDICTION.METADATA:`, prediction.metadata);

        // Try to count output tokens
        if (fullResponse) {
          const outputTokens = await this.model.countTokens(fullResponse);
          console.log(
            `🔢 OUTPUT TOKEN COUNT: ${outputTokens} tokens for ${fullResponse.length} chars`
          );
        }
      } catch (error: any) {
        console.log(
          `⚠️ Could not access streaming prediction stats:`,
          error.message
        );
      }

      const totalTime = Date.now() - startTime;
      console.log(`🎉 Streaming completed in ${totalTime}ms`);
    } catch (error: any) {
      console.error("❌ Streaming chat completion failed:", error.message);
      throw error;
    }
  }

  /**
   * Count tokens in a string
   */
  async countTokens(text: string): Promise<LMStudioResponse> {
    try {
      if (!this.isInitialized) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          return initResult;
        }
      }

      const tokenCount = await this.model.countTokens(text);
      console.log(
        `🔢 Token count for text (${text.length} chars): ${tokenCount} tokens`
      );

      return {
        success: true,
        data: {
          tokenCount: tokenCount,
          characterCount: text.length,
          ratio: (tokenCount / text.length).toFixed(3),
        },
      };
    } catch (error: any) {
      console.error("❌ Token counting failed:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Count tokens in chat messages array
   */
  async countChatTokens(messages: ChatMessage[]): Promise<LMStudioResponse> {
    try {
      if (!this.isInitialized) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          return initResult;
        }
      }

      // Import Chat class
      const { Chat } = await import("@lmstudio/sdk");

      // Convert messages to Chat format
      const chat = Chat.from(
        messages.map((msg) => ({
          role: msg.type === "user" ? "user" : "assistant",
          content: msg.content,
        }))
      );

      // Apply prompt template and count tokens
      const formatted = await this.model.applyPromptTemplate(chat);
      const tokenCount = await this.model.countTokens(formatted);

      console.log(
        `🔢 Chat token count (${messages.length} messages): ${tokenCount} tokens`
      );
      console.log(`📝 Formatted prompt length: ${formatted.length} chars`);

      return {
        success: true,
        data: {
          tokenCount: tokenCount,
          messageCount: messages.length,
          formattedLength: formatted.length,
          formattedPrompt: formatted, // For debugging
        },
      };
    } catch (error: any) {
      console.error("❌ Chat token counting failed:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Check if chat fits in context
   */
  async doesChatFitInContext(
    messages: ChatMessage[]
  ): Promise<LMStudioResponse> {
    try {
      if (!this.isInitialized) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          return initResult;
        }
      }

      const { Chat } = await import("@lmstudio/sdk");

      // Convert messages to Chat format
      const chat = Chat.from(
        messages.map((msg) => ({
          role: msg.type === "user" ? "user" : "assistant",
          content: msg.content,
        }))
      );

      // Get formatted prompt and count tokens
      const formatted = await this.model.applyPromptTemplate(chat);
      const tokenCount = await this.model.countTokens(formatted);

      // Get context length
      const contextLength = await this.model.getContextLength();

      const fitsInContext = tokenCount < contextLength;
      const usagePercentage = ((tokenCount / contextLength) * 100).toFixed(1);

      console.log(`🎯 Context Analysis:`, {
        tokenCount,
        contextLength,
        fitsInContext,
        usagePercentage: `${usagePercentage}%`,
        remainingTokens: contextLength - tokenCount,
      });

      return {
        success: true,
        data: {
          fitsInContext,
          tokenCount,
          contextLength,
          usagePercentage: parseFloat(usagePercentage),
          remainingTokens: contextLength - tokenCount,
        },
      };
    } catch (error: any) {
      console.error("❌ Context analysis failed:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send summarization request (special case - no context chain needed)
   */
  async sendSummarizationRequest(
    message: string,
    options: { temperature?: number; maxTokens?: number } = {}
  ): Promise<LMStudioResponse> {
    try {
      const { temperature = 0.3, maxTokens = 1000 } = options;

      if (!this.isInitialized) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          return initResult;
        }
      }

      // 🏗️ BUILD SUMMARIZATION CONTEXT (no chat history needed)
      console.log(`🏗️ Building summarization context...`);
      const contextResult = contextBuilder.buildSummarizationContext(message);
      const messages = contextResult.messages;

      console.log(`🎯 Summarization context built:`, contextResult.metadata);

      console.log(`📤 Sending summarization request:`, {
        model: this.model.id || "default",
        messageCount: messages.length,
        temperature,
        maxTokens,
      });

      const startTime = Date.now();

      // Use SDK's respond method
      const prediction = this.model.respond(messages, {
        temperature,
        maxTokens,
      });

      // Collect the full response
      let fullResponse = "";
      for await (const fragment of prediction) {
        fullResponse += fragment.content;
      }

      const totalTime = Date.now() - startTime;
      console.log(
        `🎉 Summarization completed: ${fullResponse.length} chars in ${totalTime}ms`
      );

      return {
        success: true,
        fullResponse: fullResponse,
        metadata: {
          model: this.model.id || "default",
          response_time_ms: totalTime,
          streaming: false,
          character_count: fullResponse.length,
          purpose: "summarization",
        },
      };
    } catch (error: any) {
      console.error("❌ Summarization failed:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get available models
   */
  async getModels(): Promise<LMStudioResponse> {
    try {
      console.log("🔍 Getting available models...");

      if (!this.isInitialized) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          return initResult;
        }
      }

      // Get model info
      const modelInfo = {
        id: this.model.id || "default",
        displayName: this.model.displayName || "Default Model",
      };

      console.log(`📋 Retrieved model: ${modelInfo.displayName}`);

      return {
        success: true,
        data: {
          models: [modelInfo],
        },
      };
    } catch (error: any) {
      console.error("❌ Failed to get models:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Create and export singleton instance
const lmStudioService = new LMStudioService();
module.exports = lmStudioService;
