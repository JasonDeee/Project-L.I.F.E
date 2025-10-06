/**
 * Summary Manager for Daily_summary.json files
 * Handles separate summary storage as per file structure requirements
 */

const fs = require("fs-extra");
const path = require("path");
const { PATHS } = require("../config/paths");
const { COMPRESSION_CONFIG } = require("../config/compression");

class SummaryManager {
  constructor() {
    this.currentDate = new Date();
  }

  /**
   * Get or create daily summary file structure
   */
  async getDailySummaryData(date = new Date()) {
    const filePath = this.getDailySummaryPath(date);

    try {
      // Ensure directory exists
      await fs.ensureDir(path.dirname(filePath));

      // Check if file exists
      if (await fs.pathExists(filePath)) {
        const data = await fs.readJson(filePath);
        return data;
      } else {
        // Create new daily summary file
        const newData = {
          version: "1.0",
          date: date.toISOString().split("T")[0], // YYYY-MM-DD
          prompt_version: COMPRESSION_CONFIG.PROMPT_VERSION,
          created_at: new Date().toISOString(),
          last_updated: new Date().toISOString(),
          summaries: [],
        };

        await fs.writeJson(filePath, newData, { spaces: 2 });
        console.log(`📝 Created new daily summary file: ${filePath}`);
        return newData;
      }
    } catch (error) {
      console.error("❌ Error managing daily summary file:", error);
      throw error;
    }
  }

  /**
   * Add compression summary to daily summary file
   */
  async addCompressionSummary(compressionResult, date = new Date()) {
    try {
      const filePath = this.getDailySummaryPath(date);

      // Get current summary data
      const summaryData = await this.getDailySummaryData(date);

      // Add new summary
      summaryData.summaries.push(compressionResult);
      summaryData.last_updated = new Date().toISOString();

      // Save file
      await fs.writeJson(filePath, summaryData, { spaces: 2 });

      console.log(`📋 Added compression summary to: ${filePath}`);
      console.log(
        `📊 Total summaries in file: ${summaryData.summaries.length}`
      );

      return true;
    } catch (error) {
      console.error("❌ Error adding compression summary:", error);
      return false;
    }
  }

  /**
   * Get all summaries for a date
   */
  async getDailySummaries(date = new Date()) {
    try {
      const summaryData = await this.getDailySummaryData(date);
      return summaryData.summaries;
    } catch (error) {
      console.error("❌ Error getting daily summaries:", error);
      return [];
    }
  }

  /**
   * Build context from summaries for LLM
   */
  async buildSummaryContext(date = new Date()) {
    try {
      const summaries = await this.getDailySummaries(date);

      if (summaries.length === 0) {
        return "";
      }

      // Build context string from summaries (newest first for better context)
      const contextParts = summaries
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map((summary) => summary.summary_content);

      return contextParts.join(" ");
    } catch (error) {
      console.error("❌ Error building summary context:", error);
      return "";
    }
  }

  /**
   * Get file path for daily summary
   */
  getDailySummaryPath(date = new Date()) {
    const dailyPath = PATHS.getDailyPath(date);
    return path.join(dailyPath, "Daily_summary.json");
  }

  /**
   * Get summary statistics
   */
  async getSummaryStats(date = new Date()) {
    try {
      const summaryData = await this.getDailySummaryData(date);

      const stats = {
        totalSummaries: summaryData.summaries.length,
        totalOriginalMessages: 0,
        totalEstimatedTokensSaved: 0,
        averageCompressionRatio: 0,
        oldestSummary: null,
        newestSummary: null,
      };

      if (summaryData.summaries.length > 0) {
        // Calculate aggregated stats
        summaryData.summaries.forEach((summary) => {
          stats.totalOriginalMessages += summary.original_messages.count;
          if (
            summary.compression_metadata.original_estimated_tokens &&
            summary.compression_metadata.summary_estimated_tokens
          ) {
            stats.totalEstimatedTokensSaved +=
              summary.compression_metadata.original_estimated_tokens -
              summary.compression_metadata.summary_estimated_tokens;
          }
        });

        // Calculate average compression ratio
        const ratios = summaryData.summaries
          .filter((s) => s.compression_metadata.compression_ratio)
          .map((s) => s.compression_metadata.compression_ratio);

        if (ratios.length > 0) {
          stats.averageCompressionRatio =
            ratios.reduce((a, b) => a + b, 0) / ratios.length;
        }

        // Get oldest and newest
        const sorted = summaryData.summaries.sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
        stats.oldestSummary = sorted[0].created_at;
        stats.newestSummary = sorted[sorted.length - 1].created_at;
      }

      return stats;
    } catch (error) {
      console.error("❌ Error getting summary stats:", error);
      return null;
    }
  }
}

// Create and export singleton instance
const summaryManager = new SummaryManager();
module.exports = summaryManager;
