const path = require("path");
const fs = require("fs-extra");

/**
 * Path configuration for Project L.I.F.E
 * Reads from ../SERVER_Config/Path.json
 */

// Read path configuration from SERVER_Config
let pathConfig;
try {
  const configPath = path.join(__dirname, "../../SERVER_Config/Path.json");
  pathConfig = require(configPath);
  console.log("📁 Loaded path configuration:", pathConfig);
} catch (error) {
  console.error("❌ Failed to load path configuration:", error.message);
  // Fallback to default
  pathConfig = {
    homePath: "E:/server",
    ChatHistoryPath: "E:/server/ChatHistory",
  };
  console.log("📁 Using default path configuration:", pathConfig);
}

// Normalize paths
const PATHS = {
  HOME: path.normalize(pathConfig.homePath),
  CHAT_HISTORY: path.normalize(pathConfig.ChatHistoryPath),

  // Helper functions
  getDailyPath: (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const monthNames = [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ];
    const monthName = monthNames[date.getMonth()];
    const day = String(date.getDate()).padStart(2, "0");
    const formattedDate = `${day}.${month}.${year}`;

    return path.join(
      pathConfig.ChatHistoryPath,
      String(year),
      `${month}-${monthName}`,
      formattedDate
    );
  },

  getDailyChatFile: (date = new Date()) => {
    const dailyPath = PATHS.getDailyPath(date);
    return path.join(dailyPath, "Daily_chat.json");
  },
};

// Ensure directories exist
async function ensureDirectories() {
  try {
    await fs.ensureDir(PATHS.HOME);
    await fs.ensureDir(PATHS.CHAT_HISTORY);
    console.log("✅ Base directories ensured");
  } catch (error) {
    console.error("❌ Failed to ensure base directories:", error.message);
  }
}

module.exports = {
  PATHS,
  ensureDirectories,
};
