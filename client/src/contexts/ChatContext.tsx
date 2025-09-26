import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import { Message } from "../types";
import {
  createUserMessage,
  createSystemMessage,
  createAssistantMessage,
} from "../utils/messageUtils";
import { useSocket } from "./SocketContext";
import { SOCKET_EVENTS, ERROR_MESSAGES } from "../utils/constants";
import { directLMStudioService } from "../services/directLMStudioService";

interface ChatState {
  messages: Message[];
  isTyping: boolean;
  typingAssistant: "wendy" | "jason" | null;
  streamingMessage: Message | null;
  error: string | null;
}

type ChatAction =
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "ADD_USER_MESSAGE"; payload: string }
  | { type: "START_STREAMING"; payload: { assistant: "wendy" | "jason" } }
  | { type: "UPDATE_STREAMING"; payload: string }
  | { type: "COMPLETE_STREAMING" }
  | {
      type: "SET_TYPING";
      payload: { isTyping: boolean; assistant?: "wendy" | "jason" };
    }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "CLEAR_MESSAGES" }
  | { type: "LOAD_MESSAGES"; payload: Message[] }
  | { type: "LOAD_CHAT_HISTORY"; payload: Message[] };

interface ChatContextType extends ChatState {
  sendMessage: (content: string) => void;
  clearMessages: () => void;
  loadMessages: (messages: Message[]) => void;
  clearError: () => void;
}

const initialState: ChatState = {
  messages: [
    createSystemMessage(
      "Chào mừng! Hãy nhập tin nhắn để bắt đầu trò chuyện với AI assistants."
    ),
  ],
  isTyping: false,
  typingAssistant: null,
  streamingMessage: null,
  error: null,
};

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case "ADD_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, action.payload],
        error: null,
      };

    case "ADD_USER_MESSAGE":
      const userMessage = createUserMessage(action.payload);
      return {
        ...state,
        messages: [...state.messages, userMessage],
        error: null,
      };

    case "START_STREAMING":
      const streamingMessage = createAssistantMessage(
        "",
        action.payload.assistant
      );
      return {
        ...state,
        streamingMessage,
        isTyping: true,
        typingAssistant: action.payload.assistant,
      };

    case "UPDATE_STREAMING":
      if (!state.streamingMessage) return state;

      return {
        ...state,
        streamingMessage: {
          ...state.streamingMessage,
          content: action.payload,
        },
      };

    case "COMPLETE_STREAMING":
      if (!state.streamingMessage) return state;

      return {
        ...state,
        messages: [...state.messages, state.streamingMessage],
        streamingMessage: null,
        isTyping: false,
        typingAssistant: null,
      };

    case "SET_TYPING":
      return {
        ...state,
        isTyping: action.payload.isTyping,
        typingAssistant: action.payload.assistant || null,
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        isTyping: false,
        typingAssistant: null,
        streamingMessage: null,
      };

    case "CLEAR_MESSAGES":
      return {
        ...state,
        messages: [createSystemMessage("Lịch sử chat đã được xóa.")],
        streamingMessage: null,
        isTyping: false,
        typingAssistant: null,
        error: null,
      };

    case "LOAD_MESSAGES":
      return {
        ...state,
        messages: action.payload,
        error: null,
      };

    case "LOAD_CHAT_HISTORY":
      return {
        ...state,
        messages: [...action.payload, ...state.messages],
        error: null,
      };

    default:
      return state;
  }
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const {
    socket,
    isConnected,
    sendMessage: socketSendMessage,
    serverHandshakeComplete,
  } = useSocket();

  // Handle handshake response with chat history
  useEffect(() => {
    if (!socket) return;

    // Listen for handshake response with chat history
    socket.on("handshake_response", (data) => {
      if (data.success && data.chatHistory && data.chatHistory.length > 0) {
        console.log(
          `📚 Loading ${data.chatHistory.length} messages from server history`
        );

        // Convert server messages to local format
        const loadedMessages: Message[] = data.chatHistory.map((msg: any) => {
          if (msg.type === "user") {
            return createUserMessage(msg.content, msg.timestamp);
          } else if (msg.type === "assistant") {
            return createAssistantMessage(
              msg.content,
              msg.assistant || "wendy",
              msg.timestamp
            );
          } else {
            return createSystemMessage(msg.content, msg.timestamp);
          }
        });

        // Load messages into state
        dispatch({ type: "LOAD_CHAT_HISTORY", payload: loadedMessages });
        console.log("✅ Chat history loaded into frontend");
      }
    });

    return () => {
      socket.off("handshake_response");
    };
  }, [socket]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Handle assistant messages
    socket.on(SOCKET_EVENTS.ASSISTANT_MESSAGE, (message: Message) => {
      dispatch({ type: "ADD_MESSAGE", payload: message });
    });

    // Handle assistant typing
    socket.on(
      SOCKET_EVENTS.ASSISTANT_TYPING,
      (data: { assistant: "wendy" | "jason" }) => {
        dispatch({
          type: "SET_TYPING",
          payload: { isTyping: true, assistant: data.assistant },
        });
      }
    );

    // Handle streaming start
    socket.on("streaming_start", (data: { assistant: "wendy" | "jason" }) => {
      dispatch({
        type: "START_STREAMING",
        payload: { assistant: data.assistant },
      });
    });

    // Handle streaming chunks
    socket.on("streaming_chunk", (data: { content: string }) => {
      dispatch({ type: "UPDATE_STREAMING", payload: data.content });
    });

    // Handle streaming complete
    socket.on("streaming_complete", () => {
      dispatch({ type: "COMPLETE_STREAMING" });
    });

    // Handle errors
    socket.on(
      SOCKET_EVENTS.ERROR,
      (error: { message: string; code?: string }) => {
        dispatch({ type: "SET_ERROR", payload: error.message });

        // Add error as system message
        const errorMessage = createSystemMessage(`Lỗi: ${error.message}`);
        dispatch({ type: "ADD_MESSAGE", payload: errorMessage });
      }
    );

    // Handle connection status
    socket.on(
      SOCKET_EVENTS.CONNECTION_STATUS,
      (data: { status: string; message?: string }) => {
        if (data.message) {
          const statusMessage = createSystemMessage(data.message);
          dispatch({ type: "ADD_MESSAGE", payload: statusMessage });
        }
      }
    );

    // Handle message logged confirmation
    socket.on(
      "message_logged",
      (data: { type: string; content: string; logged: boolean }) => {
        console.log("✅ Message logged to backend:", data);
      }
    );

    // Cleanup listeners on unmount
    return () => {
      socket.off(SOCKET_EVENTS.ASSISTANT_MESSAGE);
      socket.off(SOCKET_EVENTS.ASSISTANT_TYPING);
      socket.off("streaming_start");
      socket.off("streaming_chunk");
      socket.off("streaming_complete");
      socket.off(SOCKET_EVENTS.ERROR);
      socket.off(SOCKET_EVENTS.CONNECTION_STATUS);
      socket.off("message_logged");
    };
  }, [socket]);

  const sendMessage = async (content: string) => {
    // Add user message to chat first
    dispatch({ type: "ADD_USER_MESSAGE", payload: content });

    // Clear any previous errors
    dispatch({ type: "SET_ERROR", payload: null });

    // Debug connection status
    console.log("🔍 Connection debug:", {
      isConnected,
      hasSocket: !!socket,
      serverHandshakeComplete,
    });

    // Send user message to backend for logging (if connected and handshake complete)
    if (isConnected && socket && serverHandshakeComplete) {
      console.log("📤 Logging user message to backend");
      socket.emit("user_message", {
        content,
        timestamp: new Date().toISOString(),
      });
    } else if (isConnected && socket && !serverHandshakeComplete) {
      console.log("⏳ Waiting for server handshake before logging");
    } else if (!isConnected || !socket) {
      console.log("❌ No WebSocket connection to backend server");
    }

    // Get AI response via direct API (keep current functionality)
    console.log("📡 Getting AI response via direct LM Studio API");

    // Update API URL from localStorage if available
    const savedUrl = localStorage.getItem("life_api_url");
    if (savedUrl) {
      directLMStudioService.updateApiUrl(savedUrl);
    }

    // Start streaming message
    const streamingMessage = createAssistantMessage("", "wendy");
    dispatch({
      type: "START_STREAMING",
      payload: { assistant: "wendy" },
    });

    try {
      const startTime = Date.now();

      await directLMStudioService.sendMessage(
        content,
        (chunk) => {
          // Update streaming content
          dispatch({ type: "UPDATE_STREAMING", payload: chunk });
        },
        (fullResponse) => {
          // Complete streaming
          dispatch({ type: "COMPLETE_STREAMING" });

          const endTime = Date.now();
          const responseTime = endTime - startTime;

          console.log("✅ Message sent successfully via direct API");

          // Send assistant response to backend for logging (if connected and handshake complete)
          if (isConnected && socket && serverHandshakeComplete) {
            console.log("📤 Logging assistant response to backend");
            socket.emit("assistant_message", {
              content: fullResponse,
              assistant: "wendy",
              response_time_ms: responseTime,
              model: "wendy-fast-7b",
              streaming: true,
              timestamp: new Date().toISOString(),
            });
          }
        },
        (error) => {
          // Handle error
          dispatch({ type: "SET_ERROR", payload: error });
          dispatch({ type: "COMPLETE_STREAMING" });

          const errorMessage = createSystemMessage(`Lỗi: ${error}`);
          dispatch({ type: "ADD_MESSAGE", payload: errorMessage });
        }
      );
    } catch (error: any) {
      console.error("❌ Direct API error:", error);
      dispatch({ type: "SET_ERROR", payload: error.message });
    }
  };

  const clearMessages = () => {
    dispatch({ type: "CLEAR_MESSAGES" });
  };

  const loadMessages = (messages: Message[]) => {
    dispatch({ type: "LOAD_MESSAGES", payload: messages });
  };

  const clearError = () => {
    dispatch({ type: "SET_ERROR", payload: null });
  };

  const value: ChatContextType = {
    ...state,
    sendMessage,
    clearMessages,
    loadMessages,
    clearError,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// Custom hook to use chat context
export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
