/**
 * Direct LM Studio API Service
 * Temporary service to communicate directly with LM Studio
 * Will be replaced with WebSocket backend later
 */

import { Message } from "../types";
import {
  createAssistantMessage,
  createSystemMessage,
} from "../utils/messageUtils";

export class DirectLMStudioService {
  private apiUrl: string;

  constructor(apiUrl: string = "http://192.168.1.3:1234") {
    this.apiUrl = apiUrl;
  }

  updateApiUrl(url: string) {
    this.apiUrl = url;
    console.log("🔄 Updated LM Studio API URL to:", url);
  }

  async testConnection(): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      console.log("🧪 Testing direct connection to LM Studio:", this.apiUrl);

      const response = await fetch(`${this.apiUrl}/v1/models`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ LM Studio connection successful:", data);
        return { success: true, data };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error("❌ LM Studio connection failed:", error);
      return {
        success: false,
        error: error.message || "Connection failed",
      };
    }
  }

  async sendMessage(
    content: string,
    onChunk?: (chunk: string) => void,
    onComplete?: (fullResponse: string) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    try {
      console.log("📤 Sending message to LM Studio:", content);

      const requestBody = {
        model: "local-model",
        messages: [
          {
            role: "system",
            content:
              "Bạn là WENDY - một trợ lý AI nhanh nhẹn và thân thiện. Hãy trả lời bằng tiếng Việt một cách ngắn gọn và hữu ích.",
          },
          {
            role: "user",
            content: content,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
        stream: true, // Enable streaming
      };

      const response = await fetch(`${this.apiUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(60000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body reader available");
      }

      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          const trimmedLine = line.trim();

          if (trimmedLine === "" || trimmedLine === "data: [DONE]") {
            continue;
          }

          if (trimmedLine.startsWith("data: ")) {
            try {
              const jsonStr = trimmedLine.slice(6); // Remove 'data: ' prefix
              const data = JSON.parse(jsonStr);

              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                onChunk?.(fullContent);
              }
            } catch (parseError) {
              console.warn("Failed to parse streaming chunk:", parseError);
            }
          }
        }
      }

      reader.releaseLock();
      onComplete?.(
        fullContent || "Xin lỗi, tôi không thể trả lời câu hỏi này."
      );
    } catch (error: any) {
      console.error("❌ Send message error:", error);
      onError?.(error.message || "Không thể gửi tin nhắn");
    }
  }
}

// Singleton instance
export const directLMStudioService = new DirectLMStudioService();
