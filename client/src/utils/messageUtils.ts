import { Message } from "../types";

// Generate unique message ID
export const generateMessageId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `msg_${timestamp}_${random}`;
};

// Format timestamp for display
export const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// Format date for display
export const formatDate = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Check if message is from today
export const isToday = (timestamp: string): boolean => {
  const messageDate = new Date(timestamp);
  const today = new Date();

  return (
    messageDate.getDate() === today.getDate() &&
    messageDate.getMonth() === today.getMonth() &&
    messageDate.getFullYear() === today.getFullYear()
  );
};

// Validate message content
export const validateMessage = (
  content: string
): { isValid: boolean; error?: string } => {
  if (!content || content.trim().length === 0) {
    return { isValid: false, error: "Tin nhắn không được để trống" };
  }

  if (content.length > 4000) {
    return { isValid: false, error: "Tin nhắn quá dài (tối đa 4000 ký tự)" };
  }

  return { isValid: true };
};

// Create user message
export const createUserMessage = (
  content: string,
  timestamp?: string
): Message => {
  return {
    id: generateMessageId(),
    timestamp: timestamp || new Date().toISOString(),
    type: "user",
    content: content.trim(),
    metadata: {
      session_id: getSessionId(),
      user_agent: navigator.userAgent,
    },
  };
};

// Create assistant message
export const createAssistantMessage = (
  content: string,
  assistant: "wendy" | "jason",
  metadata?: Partial<Message["metadata"]>
): Message => {
  return {
    id: generateMessageId(),
    timestamp: new Date().toISOString(),
    type: "assistant",
    assistant,
    content: content.trim(),
    metadata: {
      ...metadata,
      session_id: getSessionId(),
    },
  };
};

// Create system message
export const createSystemMessage = (
  content: string,
  timestamp?: string
): Message => {
  return {
    id: generateMessageId(),
    timestamp: timestamp || new Date().toISOString(),
    type: "system",
    content,
    metadata: {
      session_id: getSessionId(),
    },
  };
};

// Get or create session ID
export const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem("life_session_id");
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem("life_session_id", sessionId);
  }
  return sessionId;
};

// Check if message mentions Jason
export const mentionsJason = (content: string): boolean => {
  const patterns = [
    /@jason/i,
    /jason[,\s]/i,
    /\bjason\b/i,
    /gọi jason/i,
    /hỏi jason/i,
    /jason ơi/i,
  ];

  return patterns.some((pattern) => pattern.test(content));
};

// Extract assistant name from message content
export const extractAssistantMention = (
  content: string
): "wendy" | "jason" | null => {
  if (mentionsJason(content)) {
    return "jason";
  }

  const wendyPatterns = [
    /@wendy/i,
    /wendy[,\s]/i,
    /\bwendy\b/i,
    /gọi wendy/i,
    /hỏi wendy/i,
    /wendy ơi/i,
  ];

  if (wendyPatterns.some((pattern) => pattern.test(content))) {
    return "wendy";
  }

  return null;
};

// Escape HTML in message content
export const escapeHtml = (text: string): string => {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
};

// Sanitize message content
export const sanitizeMessage = (content: string): string => {
  return content
    .trim()
    .replace(/\s+/g, " ") // Normalize whitespace
    .substring(0, 4000); // Limit length
};

// Group messages by date
export const groupMessagesByDate = (
  messages: Message[]
): { [date: string]: Message[] } => {
  return messages.reduce((groups, message) => {
    const date = formatDate(message.timestamp);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as { [date: string]: Message[] });
};

// Calculate response time display
export const formatResponseTime = (responseTimeMs?: number): string => {
  if (!responseTimeMs) return "";

  if (responseTimeMs < 1000) {
    return `${responseTimeMs}ms`;
  } else {
    return `${(responseTimeMs / 1000).toFixed(1)}s`;
  }
};

// Get message summary for notifications
export const getMessageSummary = (
  content: string,
  maxLength: number = 50
): string => {
  if (content.length <= maxLength) {
    return content;
  }

  return content.substring(0, maxLength - 3) + "...";
};
