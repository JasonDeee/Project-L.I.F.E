/**
 * Context Builder Service
 * Builds complete context chain for LLM requests
 * Implements the full System Prompt Chain as per Daily_Sumerize_Instruction.md
 */

const { buildSystemPrompt } = require("../config/systemPrompts");
const summaryManager = require("../utils/summaryManager");
const { COMPRESSION_CONFIG } = require("../config/compression");

class ContextBuilder {
  constructor() {
    this.includeTaskManager = false; // Will be enabled in future phase
  }

  /**
   * Build complete context for LLM request
   * Following the chain: Core Prefix + Task Manager + Summarizing + Recent Messages
   */
  async buildLLMContext(userMessage, chatHistory, date = new Date()) {
    try {
      console.log(
        `🏗️ Building LLM context with ${chatHistory.length} total messages...`
      );

      // Step 1: Get recent messages (last 8 as per instruction)
      const recentMessages = chatHistory.slice(
        -COMPRESSION_CONFIG.KEEP_RECENT_MESSAGES
      );
      console.log(`📝 Recent messages: ${recentMessages.length}`);

      // Step 2: Build summary context from compressed data
      const summaryContent = await summaryManager.buildSummaryContext(date);
      console.log(`📋 Summary content length: ${summaryContent.length} chars`);

      // Step 3: Build system prompt with summary
      const systemPrompt = buildSystemPrompt(
        summaryContent,
        this.includeTaskManager
      );
      console.log(`🎯 System prompt built: ${systemPrompt.length} chars`);

      // Step 4: Prepare messages array for LLM
      const messages = [
        {
          role: "system",
          content: systemPrompt,
        },
        // Add recent chat history
        ...recentMessages.map((msg) => ({
          role: msg.type === "user" ? "user" : "assistant",
          content: msg.content,
        })),
        // Add current user message
        {
          role: "user",
          content: userMessage,
        },
      ];

      console.log(`✅ Context built successfully:`, {
        systemPromptLength: systemPrompt.length,
        summaryContentLength: summaryContent.length,
        recentMessagesCount: recentMessages.length,
        totalMessages: messages.length,
        includeTaskManager: this.includeTaskManager,
      });

      return {
        success: true,
        messages,
        metadata: {
          systemPromptLength: systemPrompt.length,
          summaryContentLength: summaryContent.length,
          recentMessagesCount: recentMessages.length,
          totalMessages: messages.length,
          hasSummary: summaryContent.length > 0,
        },
      };
    } catch (error) {
      console.error(`❌ Error building LLM context:`, error.message);

      // Fallback to basic context without summaries
      const fallbackMessages = [
        {
          role: "system",
          content: buildSystemPrompt("", false), // Basic system prompt only
        },
        ...chatHistory.slice(-8).map((msg) => ({
          role: msg.type === "user" ? "user" : "assistant",
          content: msg.content,
        })),
        {
          role: "user",
          content: userMessage,
        },
      ];

      console.log(
        `⚠️ Using fallback context: ${fallbackMessages.length} messages`
      );

      return {
        success: false,
        messages: fallbackMessages,
        error: error.message,
        fallback: true,
        metadata: {
          totalMessages: fallbackMessages.length,
          hasSummary: false,
        },
      };
    }
  }

  /**
   * Build context for summarization requests (no summary context needed)
   */
  buildSummarizationContext(userMessage) {
    const messages = [
      {
        role: "system",
        content: buildSystemPrompt("", false), // Basic prompt for summarization
      },
      {
        role: "user",
        content: userMessage,
      },
    ];

    return {
      success: true,
      messages,
      metadata: {
        totalMessages: messages.length,
        purpose: "summarization",
      },
    };
  }

  /**
   * Enable/disable task manager integration
   */
  setTaskManagerEnabled(enabled) {
    this.includeTaskManager = enabled;
    console.log(
      `🔧 Task Manager ${enabled ? "enabled" : "disabled"} in context builder`
    );
  }

  /**
   * Get context statistics
   */
  async getContextStats(date = new Date()) {
    try {
      const summaryStats = await summaryManager.getSummaryStats(date);

      return {
        summaryStats,
        taskManagerEnabled: this.includeTaskManager,
        recentMessageLimit: COMPRESSION_CONFIG.KEEP_RECENT_MESSAGES,
      };
    } catch (error) {
      console.error(`❌ Error getting context stats:`, error.message);
      return null;
    }
  }
}

// Create and export singleton instance
const contextBuilder = new ContextBuilder();
module.exports = contextBuilder;
