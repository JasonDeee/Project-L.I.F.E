// API Configuration
export const API_CONFIG = {
  DEFAULT_URL: "http://192.168.1.3:1234",
  WEBSOCKET_URL: "http://localhost:8000",
  TIMEOUT: {
    CONNECTION_TEST: 5000,
    STREAMING: 60000,
    REGULAR: 30000,
  },
} as const;

// Assistant Configuration
export const ASSISTANTS = {
  WENDY: {
    name: "wendy" as const,
    displayName: "WENDY",
    description: "Fast Response Assistant",
    model: "wendy-fast-7b",
    characteristics: [
      "Quick responses",
      "Casual conversation",
      "Basic questions",
      "Can escalate to JASON",
    ],
    defaultSettings: {
      temperature: 0.7,
      maxTokens: 500,
    },
  },
  JASON: {
    name: "jason" as const,
    displayName: "JASON",
    description: "Deep Reasoning Assistant",
    model: "jason-reasoning-13b",
    characteristics: [
      "Complex analysis",
      "Problem solving",
      "Technical expertise",
      "Detailed responses",
    ],
    defaultSettings: {
      temperature: 0.6,
      maxTokens: 1000,
    },
  },
} as const;

// UI Constants
export const UI_CONFIG = {
  CHAT: {
    MAX_MESSAGE_LENGTH: 4000,
    MAX_MESSAGES_DISPLAY: 100,
    SCROLL_BEHAVIOR: "smooth" as const,
    AUTO_SCROLL_THRESHOLD: 100,
  },
  ANIMATION: {
    TYPING_SPEED: 50,
    FADE_IN_DURATION: 300,
    CURSOR_BLINK_SPEED: 1000,
  },
  THEME: {
    COLORS: {
      PRIMARY: "#667eea",
      SECONDARY: "#764ba2",
      SUCCESS: "#4caf50",
      ERROR: "#f44336",
      WARNING: "#ff9800",
      BACKGROUND: "#f8f9fa",
      TEXT: "#333333",
    },
  },
} as const;

// Message Types
export const MESSAGE_TYPES = {
  USER: "user",
  ASSISTANT: "assistant",
  SYSTEM: "system",
} as const;

// Socket Events
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  CONNECTION_ERROR: "connect_error",

  // Messaging
  USER_MESSAGE: "user_message",
  ASSISTANT_MESSAGE: "assistant_message",
  ASSISTANT_TYPING: "assistant_typing",

  // Status
  CONNECTION_STATUS: "connection_status",
  ERROR: "error",

  // Typing indicators
  TYPING_START: "typing_start",
  TYPING_STOP: "typing_stop",
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  SETTINGS: "life_settings",
  CHAT_HISTORY: "life_chat_history",
  USER_PREFERENCES: "life_user_preferences",
  API_URL: "life_api_url",
  THEME: "life_theme",
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  CONNECTION_FAILED: "Không thể kết nối đến server",
  TIMEOUT: "Yêu cầu bị timeout",
  INVALID_MESSAGE: "Tin nhắn không hợp lệ",
  ASSISTANT_ERROR: "Lỗi từ assistant",
  NETWORK_ERROR: "Lỗi mạng",
  UNKNOWN_ERROR: "Lỗi không xác định",
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  CONNECTED: "Kết nối thành công",
  MESSAGE_SENT: "Tin nhắn đã được gửi",
  SETTINGS_SAVED: "Cài đặt đã được lưu",
} as const;

// Validation Rules
export const VALIDATION = {
  MESSAGE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 4000,
  },
  API_URL: {
    PATTERN: /^https?:\/\/.+/,
  },
} as const;

// Default Settings
export const DEFAULT_SETTINGS = {
  apiUrl: API_CONFIG.DEFAULT_URL,
  theme: "light" as const,
  notifications: {
    sound: true,
    desktop: false,
  },
  assistants: {
    wendy: {
      endpoint: "http://192.168.1.3:1234",
      temperature: 0.7,
      maxTokens: 500,
    },
    jason: {
      endpoint: "http://192.168.1.3:1235",
      temperature: 0.6,
      maxTokens: 1000,
    },
  },
} as const;

