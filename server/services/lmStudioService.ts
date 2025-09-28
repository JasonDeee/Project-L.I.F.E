/**
 * LM Studio Service - Server side integration using SDK
 * Handles all communication with LM Studio API from backend
 */

import { LMStudioClient } from "@lmstudio/sdk";

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
      this.model = await this.client.llm.model();

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
   * Send chat completion request (non-streaming for now)
   */
  async sendChatCompletion(
    message: string,
    chatHistory: ChatMessage[] = [],
    options: { temperature?: number; maxTokens?: number } = {}
  ): Promise<LMStudioResponse> {
    try {
      const { temperature = 0.7, maxTokens = 2048 } = options;

      if (!this.isInitialized) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          return initResult;
        }
      }

      // Prepare messages array for SDK
      const messages = [
        {
          role: "system",
          content:
            "You are WENDY, a helpful AI assistant. Respond in Vietnamese when the user speaks Vietnamese.",
        },
        ...chatHistory.map((msg) => ({
          role: msg.type === "user" ? "user" : "assistant",
          content: msg.content,
        })),
        {
          role: "user",
          content: message,
        },
      ];

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
