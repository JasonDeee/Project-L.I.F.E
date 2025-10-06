/**
 * Compression Configuration for Context Management
 * Based on Daily_Summarize_Instruction.md requirements
 */

const COMPRESSION_CONFIG = {
  // Token thresholds (easy to modify)
  TOKEN_FLOOR: 3000, // Target after compression (~25% of context)
  TOKEN_CEILING: 7800, // Trigger compression (~65% of 12k context)

  // Message preservation rules
  KEEP_RECENT_MESSAGES: 8, // Always keep 8 newest messages (per instruction)
  PRESERVE_FIRST_MESSAGES: 0, // No early preservation (focus on recent)

  // Compression settings
  COMPRESSION_MODEL: "wendy", // Use WENDY for summarization
  COMPRESSION_QUALITY: "balanced", // balanced/aggressive/conservative

  // Background processing
  ENABLE_BACKGROUND_COMPRESSION: true,
  COMPRESSION_DELAY_MS: 2000, // Wait 2s after response before compressing

  // File structure (separate files as per instruction)
  SEPARATE_SUMMARY_FILE: true, // Daily_summary.json separate from Daily_chat.json
  PROMPT_VERSION: "1.0",

  // UI feedback
  SHOW_COMPRESSION_STATUS: true,
  BLOCK_DURING_COMPRESSION: true, // Block new requests during compression

  // Performance monitoring
  LOG_COMPRESSION_STATS: true,
  ESTIMATE_COMPRESSION_RATIO: 0.25, // Expect ~25% of original size after compression
};

// Summarization prompt template
const SUMMARIZATION_PROMPT = `Bạn là WENDY, hãy tóm tắt đoạn chat history sau theo format:

[*Thời gian*] Mô tả ngắn gọn những gì đã xảy ra, quyết định quan trọng, và context cần thiết cho cuộc trò chuyện tiếp theo.

Quy tắc:
- Giữ lại thông tin quan trọng cho context
- Tóm gọn nhưng đầy đủ ý nghĩa  
- Focus vào decisions, actions, và key information
- Dùng ngôn ngữ tự nhiên, không formal
- Theo format: [*Hiện tại*] Boss đang làm gì, đã thảo luận về gì, quyết định gì

Messages cần tóm tắt:
{messages_to_compress}

Tóm tắt:`;

module.exports = {
  COMPRESSION_CONFIG,
  SUMMARIZATION_PROMPT,
};
