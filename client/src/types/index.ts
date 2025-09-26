// Message Types
export interface Message {
  id: string;
  timestamp: string;
  type: "user" | "assistant" | "system";
  content: string;
  assistant?: "wendy" | "jason";
  metadata?: {
    response_time_ms?: number;
    tokens_used?: number;
    model?: string;
    temperature?: number;
    streaming?: boolean;
    triggered_by?: string;
    escalation_reason?: string;
    ip_address?: string;
    user_agent?: string;
    session_id?: string;
  };
}

// Assistant Types
export interface Assistant {
  name: "wendy" | "jason";
  displayName: string;
  description: string;
  model: string;
  endpoint: string;
  isActive: boolean;
  responseTimeAvg: number;
  characteristics: string[];
}

// Chat State Types
export interface ChatState {
  messages: Message[];
  isConnected: boolean;
  isTyping: boolean;
  currentAssistant: "wendy" | "jason";
  connectionStatus: "connected" | "disconnected" | "checking";
}

// Socket Event Types
export interface SocketEvents {
  // Client to Server
  user_message: (data: { content: string; timestamp: string }) => void;
  connection_test: () => void;
  typing_start: () => void;
  typing_stop: () => void;

  // Server to Client
  assistant_message: (data: Message) => void;
  assistant_typing: (data: { assistant: "wendy" | "jason" }) => void;
  connection_status: (data: {
    status: "connected" | "disconnected";
    message?: string;
  }) => void;
  error: (data: { message: string; code?: string }) => void;
}

// Settings Types
export interface Settings {
  apiUrl: string;
  theme: "light" | "dark";
  notifications: {
    sound: boolean;
    desktop: boolean;
  };
  assistants: {
    wendy: {
      endpoint: string;
      temperature: number;
      maxTokens: number;
    };
    jason: {
      endpoint: string;
      temperature: number;
      maxTokens: number;
    };
  };
}

// Component Props Types
export interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

export interface StreamingMessageProps {
  content: string;
  assistant: "wendy" | "jason";
  onComplete?: () => void;
}

export interface ConnectionStatusProps {
  status: "connected" | "disconnected" | "checking" | "handshaking";
  onTest?: () => void;
}
