const fs = require("fs-extra");
const path = require("path");
const { PATHS } = require("../config/paths");
const compressionService = require("../services/compressionService");
const summaryManager = require("./summaryManager");

/**
 * Simple Chat Logger for Daily_chat.json files
 * Basic implementation focusing only on message logging
 */

class ChatLogger {
  constructor() {
    this.currentDate = new Date();
    this.messageQueue = [];
    this.isProcessing = false;
    this.compressionCheckTimeout = null;
  }

  /**
   * Generate message ID
   */
  generateMessageId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `msg_${timestamp}_${random}`;
  }

  /**
   * Create simple message object (basic version)
   */
  createMessage(type, content, assistant = null, metadata = {}) {
    return {
      id: this.generateMessageId(),
      timestamp: new Date().toISOString(),
      type, // 'user', 'assistant', 'system'
      content,
      ...(assistant && { assistant }), // 'wendy' or 'jason'
      metadata: {
        session_id: metadata.session_id || "default_session",
        ...metadata,
      },
    };
  }

  /**
   * Get or create daily chat file structure
   */
  async getDailyChatData(date = new Date()) {
    const filePath = PATHS.getDailyChatFile(date);

    try {
      // Ensure directory exists
      await fs.ensureDir(path.dirname(filePath));

      // Check if file exists
      if (await fs.pathExists(filePath)) {
        const data = await fs.readJson(filePath);
        return data;
      } else {
        // Create new daily chat file
        const newData = {
          version: "1.0",
          date: date.toISOString().split("T")[0], // YYYY-MM-DD
          created_at: new Date().toISOString(),
          last_updated: new Date().toISOString(),
          messages: [],
        };

        await fs.writeJson(filePath, newData, { spaces: 2 });
        console.log(`📝 Created new daily chat file: ${filePath}`);
        return newData;
      }
    } catch (error) {
      console.error("❌ Error managing daily chat file:", error);
      throw error;
    }
  }

  /**
   * Add message to daily chat file
   */
  async logMessage(message) {
    try {
      const today = new Date();
      const filePath = PATHS.getDailyChatFile(today);

      // Get current file data
      const chatData = await this.getDailyChatData(today);

      // Add message
      chatData.messages.push(message);
      chatData.last_updated = new Date().toISOString();

      // Save file
      await fs.writeJson(filePath, chatData, { spaces: 2 });

      console.log(
        `💬 Logged message (${message.type}): ${message.content.substring(
          0,
          50
        )}${message.content.length > 50 ? "..." : ""}`
      );

      return true;
    } catch (error) {
      console.error("❌ Error logging message:", error);
      return false;
    }
  }

  /**
   * Log user message
   */
  async logUserMessage(content, metadata = {}) {
    const message = this.createMessage("user", content, null, metadata);
    return await this.logMessage(message);
  }

  /**
   * Log assistant message
   */
  async logAssistantMessage(content, assistant = "wendy", metadata = {}) {
    const message = this.createMessage(
      "assistant",
      content,
      assistant,
      metadata
    );
    return await this.logMessage(message);
  }

  /**
   * Log system message
   */
  async logSystemMessage(content, metadata = {}) {
    const message = this.createMessage("system", content, null, metadata);
    return await this.logMessage(message);
  }

  /**
   * Get today's chat history
   */
  async getTodaysChatHistory() {
    try {
      const chatData = await this.getDailyChatData();
      return chatData.messages;
    } catch (error) {
      console.error("❌ Error getting chat history:", error);
      return [];
    }
  }

  /**
   * Schedule compression check (background)
   */
  scheduleCompressionCheck() {
    // Clear existing timeout
    if (this.compressionCheckTimeout) {
      clearTimeout(this.compressionCheckTimeout);
    }

    // Schedule compression check after delay
    this.compressionCheckTimeout = setTimeout(async () => {
      await this.checkAndCompress();
    }, 2000); // 2 second delay as per config
  }

  /**
   * Check if compression is needed and perform it
   */
  async checkAndCompress() {
    try {
      console.log(`🔍 Checking if compression is needed...`);

      // Get current chat history
      const messages = await this.getTodaysChatHistory();

      if (messages.length < 10) {
        console.log(
          `ℹ️ Not enough messages for compression (${messages.length})`
        );
        return false;
      }

      // Check if compression is needed
      const compressionCheck = await compressionService.shouldCompress(
        messages
      );

      if (!compressionCheck.shouldCompress) {
        console.log(`✅ No compression needed: ${compressionCheck.reason}`);
        return false;
      }

      console.log(`🔄 Compression needed: ${compressionCheck.reason}`);
      console.log(
        `📊 Current tokens: ${compressionCheck.currentTokens}, Target: ${compressionCheck.targetTokens}`
      );

      // Perform compression
      const compressionResult = await compressionService.compressHistory(
        messages
      );

      if (!compressionResult.success) {
        console.error(`❌ Compression failed: ${compressionResult.reason}`);
        return false;
      }

      // Save compression summary to Daily_summary.json
      const summaryAdded = await summaryManager.addCompressionSummary(
        compressionResult.compressionResult
      );

      if (summaryAdded) {
        console.log(`✅ Compression completed and summary saved`);
        console.log(`📊 Compression stats:`, compressionResult.stats);
        return true;
      } else {
        console.error(`❌ Failed to save compression summary`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error during compression check:`, error.message);
      return false;
    }
  }

  /**
   * Get compression status
   */
  getCompressionStatus() {
    return {
      isCompressing: compressionService.isCompressionInProgress(),
      stats: compressionService.getCompressionStats(),
      hasScheduledCheck: this.compressionCheckTimeout !== null,
    };
  }

  /**
   * Get file path for today
   */
  getTodaysFilePath() {
    return PATHS.getDailyChatFile();
  }
}

module.exports = ChatLogger;
