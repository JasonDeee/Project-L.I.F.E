/**
 * Compression Service for Context Management
 * Handles automatic chat history compression using WENDY
 */

const {
  COMPRESSION_CONFIG,
  SUMMARIZATION_PROMPT,
} = require("../config/compression");
const lmStudioService = require("./lmStudioService.ts");
const fs = require("fs-extra");
const path = require("path");

class CompressionService {
  constructor() {
    this.isCompressing = false;
    this.compressionQueue = [];
    this.compressionStats = {
      totalCompressions: 0,
      totalTokensSaved: 0,
      averageCompressionRatio: 0,
    };
  }

  /**
   * Check if compression is needed based on token count
   */
  async shouldCompress(messages) {
    try {
      // Count tokens in current chat history
      const tokenAnalysis = await lmStudioService.countChatTokens(messages);

      if (!tokenAnalysis.success) {
        console.log(`⚠️ Could not analyze tokens for compression check`);
        return { shouldCompress: false, reason: "token_analysis_failed" };
      }

      const { tokenCount } = tokenAnalysis.data;
      const usagePercentage = (tokenCount / 12288) * 100; // Assuming 12k context

      console.log(`🔍 Compression Check:`, {
        currentTokens: tokenCount,
        ceiling: COMPRESSION_CONFIG.TOKEN_CEILING,
        usagePercentage: `${usagePercentage.toFixed(1)}%`,
        shouldCompress: tokenCount > COMPRESSION_CONFIG.TOKEN_CEILING,
      });

      if (tokenCount > COMPRESSION_CONFIG.TOKEN_CEILING) {
        return {
          shouldCompress: true,
          reason: "token_ceiling_exceeded",
          currentTokens: tokenCount,
          targetTokens: COMPRESSION_CONFIG.TOKEN_FLOOR,
          estimatedSavings: tokenCount - COMPRESSION_CONFIG.TOKEN_FLOOR,
        };
      }

      return {
        shouldCompress: false,
        reason: "within_limits",
        currentTokens: tokenCount,
        usagePercentage,
      };
    } catch (error) {
      console.error(`❌ Error checking compression need:`, error.message);
      return { shouldCompress: false, reason: "error", error: error.message };
    }
  }

  /**
   * Compress chat history by summarizing middle messages
   */
  async compressHistory(messages, options = {}) {
    if (this.isCompressing) {
      console.log(`⏳ Compression already in progress, queuing request`);
      return { success: false, reason: "compression_in_progress" };
    }

    try {
      this.isCompressing = true;
      const startTime = Date.now();

      console.log(`🔄 Starting compression of ${messages.length} messages...`);

      // Step 1: Separate messages into keep/compress groups
      const recentMessages = messages.slice(
        -COMPRESSION_CONFIG.KEEP_RECENT_MESSAGES
      );
      const messagesToCompress = messages.slice(
        0,
        -COMPRESSION_CONFIG.KEEP_RECENT_MESSAGES
      );

      if (messagesToCompress.length === 0) {
        console.log(
          `ℹ️ No messages to compress (only ${messages.length} messages)`
        );
        return { success: false, reason: "insufficient_messages" };
      }

      console.log(`📊 Compression Plan:`, {
        totalMessages: messages.length,
        toCompress: messagesToCompress.length,
        toKeep: recentMessages.length,
      });

      // Step 2: Format messages for summarization
      const messagesText = messagesToCompress
        .map((msg) => {
          const timestamp = new Date(msg.timestamp).toLocaleTimeString("vi-VN");
          const sender =
            msg.type === "user" ? "User" : `${msg.assistant || "Assistant"}`;
          return `[${timestamp}] ${sender}: ${msg.content}`;
        })
        .join("\n\n");

      // Step 3: Create summarization prompt
      const summaryPrompt = SUMMARIZATION_PROMPT.replace(
        "{messages_to_compress}",
        messagesText
      );

      // Step 4: Get summary from WENDY using specialized summarization method
      console.log(`🤖 Requesting summary from WENDY...`);
      const summaryResponse = await lmStudioService.sendSummarizationRequest(
        summaryPrompt,
        {
          temperature: 0.3, // Lower temperature for consistent summaries
          maxTokens: 1000, // Limit summary length
        }
      );

      if (!summaryResponse.success) {
        throw new Error(`Summarization failed: ${summaryResponse.error}`);
      }

      const summary = summaryResponse.fullResponse.trim();
      console.log(`✅ Summary generated: ${summary.length} chars`);

      // Step 5: Create compressed summary object
      const compressionResult = {
        id: `summary_${Date.now()}`,
        created_at: new Date().toISOString(),
        time_range: {
          start: messagesToCompress[0]?.timestamp,
          end: messagesToCompress[messagesToCompress.length - 1]?.timestamp,
        },
        original_messages: {
          count: messagesToCompress.length,
          start_id: messagesToCompress[0]?.id,
          end_id: messagesToCompress[messagesToCompress.length - 1]?.id,
        },
        summary_content: summary,
        compression_metadata: {
          method: "wendy_summarization",
          prompt_version: COMPRESSION_CONFIG.PROMPT_VERSION,
          processing_time_ms: Date.now() - startTime,
          model: "wendy",
        },
      };

      // Step 6: Calculate compression stats
      const originalTokens = await this.estimateTokenCount(messagesText);
      const summaryTokens = await this.estimateTokenCount(summary);
      const compressionRatio = summaryTokens / originalTokens;

      compressionResult.compression_metadata.original_estimated_tokens =
        originalTokens;
      compressionResult.compression_metadata.summary_estimated_tokens =
        summaryTokens;
      compressionResult.compression_metadata.compression_ratio =
        compressionRatio;

      console.log(`📊 Compression Stats:`, {
        originalMessages: messagesToCompress.length,
        estimatedOriginalTokens: originalTokens,
        estimatedSummaryTokens: summaryTokens,
        compressionRatio: `${(compressionRatio * 100).toFixed(1)}%`,
        timeTaken: `${Date.now() - startTime}ms`,
      });

      // Step 7: Update internal stats
      this.compressionStats.totalCompressions++;
      this.compressionStats.totalTokensSaved += originalTokens - summaryTokens;
      this.compressionStats.averageCompressionRatio =
        (this.compressionStats.averageCompressionRatio *
          (this.compressionStats.totalCompressions - 1) +
          compressionRatio) /
        this.compressionStats.totalCompressions;

      return {
        success: true,
        compressionResult,
        recentMessages,
        stats: {
          originalMessages: messagesToCompress.length,
          originalTokens,
          summaryTokens,
          compressionRatio,
          processingTime: Date.now() - startTime,
        },
      };
    } catch (error) {
      console.error(`❌ Compression failed:`, error.message);
      return {
        success: false,
        error: error.message,
        reason: "compression_error",
      };
    } finally {
      this.isCompressing = false;
    }
  }

  /**
   * Estimate token count for text (fallback method)
   */
  async estimateTokenCount(text) {
    try {
      const result = await lmStudioService.countTokens(text);
      return result.success
        ? result.data.tokenCount
        : Math.ceil(text.length / 3.2);
    } catch (error) {
      // Fallback: estimate based on character count (observed ratio: ~3.2 chars/token)
      return Math.ceil(text.length / 3.2);
    }
  }

  /**
   * Get compression statistics
   */
  getCompressionStats() {
    return {
      ...this.compressionStats,
      isCompressing: this.isCompressing,
      queueLength: this.compressionQueue.length,
    };
  }

  /**
   * Check if compression is currently in progress
   */
  isCompressionInProgress() {
    return this.isCompressing;
  }
}

// Create and export singleton instance
const compressionService = new CompressionService();
module.exports = compressionService;
