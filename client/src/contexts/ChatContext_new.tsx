import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import { useSocket } from "./SocketContext";
import { Message } from "../types";
import {
  createUserMessage,
  createAssistantMessage,
  createSystemMessage,
} from "../utils/messageUtils";

// Chat State Types
interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  streamingMessage: Message | null;
}

type ChatAction =
  | { type: "ADD_USER_MESSAGE"; payload: string }
  | { type: "START_STREAMING"; payload: Message }
  | { type: "UPDATE_STREAMING"; payload: string }
  | { type: "COMPLETE_STREAMING"; payload: string }
  | { type: "STOP_STREAMING" }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "LOAD_CHAT_HISTORY"; payload: Message[] }
  | { type: "CLEAR_MESSAGES" };

// Chat Context Type
interface ChatContextType {
  state: ChatState;
  sendMessage: (content: string) => void;
  clearMessages: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};

// Chat Reducer
const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case "ADD_USER_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, createUserMessage(action.payload)],
        error: null,
      };

    case "START_STREAMING":
      return {
        ...state,
        streamingMessage: action.payload,
        isLoading: true,
        error: null,
      };

    case "UPDATE_STREAMING":
      return {
        ...state,
        streamingMessage: state.streamingMessage
          ? { ...state.streamingMessage, content: action.payload }
          : null,
      };

    case "COMPLETE_STREAMING":
      return {
        ...state,
        messages: state.streamingMessage
          ? [
              ...state.messages,
              { ...state.streamingMessage, content: action.payload },
            ]
          : state.messages,
        streamingMessage: null,
        isLoading: false,
      };

    case "STOP_STREAMING":
      return {
        ...state,
        streamingMessage: null,
        isLoading: false,
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        isLoading: false,
        streamingMessage: null,
      };

    case "LOAD_CHAT_HISTORY":
      return {
        ...state,
        messages: action.payload,
        error: null,
      };

    case "CLEAR_MESSAGES":
      return {
        ...state,
        messages: [],
        error: null,
        streamingMessage: null,
        isLoading: false,
      };

    default:
      return state;
  }
};

// Initial State
const initialState: ChatState = {
  messages: [],
  isLoading: false,
  error: null,
  streamingMessage: null,
};

// Chat Provider Props
interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { socket, isConnected, serverHandshakeComplete, chatHistoryLoaded } =
    useSocket();

  // Load chat history when handshake completes
  useEffect(() => {
    if (!socket || !chatHistoryLoaded) return;

    const handleHandshakeResponse = (data: any) => {
      if (data.success && data.chatHistory && Array.isArray(data.chatHistory)) {
        console.log(
          `📚 Loading ${data.chatHistory.length} messages from server`
        );

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

        dispatch({ type: "LOAD_CHAT_HISTORY", payload: loadedMessages });
        console.log("✅ Chat history loaded into state");
      }
    };

    socket.on("handshake_response", handleHandshakeResponse);

    return () => {
      socket.off("handshake_response", handleHandshakeResponse);
    };
  }, [socket, chatHistoryLoaded]);

  // Handle streaming AI responses
  useEffect(() => {
    if (!socket) return;

    // Handle streaming chunks
    const handleStreamingChunk = (data: any) => {
      console.log(
        "📨 Received streaming chunk:",
        data.content?.slice(0, 30) + "..."
      );
      dispatch({
        type: "UPDATE_STREAMING",
        payload: data.fullResponse,
      });
    };

    // Handle completed AI response
    const handleStreamingComplete = (data: any) => {
      console.log("🎉 AI response completed:", data.content?.length + " chars");
      dispatch({
        type: "COMPLETE_STREAMING",
        payload: data.content,
      });
    };

    // Handle errors
    const handleServerError = (data: any) => {
      console.error("🔴 Server error:", data);
      dispatch({
        type: "SET_ERROR",
        payload: data.message || "Server error occurred",
      });
    };

    // Handle message logging confirmations
    const handleMessageLogged = (data: any) => {
      console.log("✅ Message logged to server:", data.type);
    };

    socket.on("assistant_message_chunk", handleStreamingChunk);
    socket.on("assistant_message_complete", handleStreamingComplete);
    socket.on("error", handleServerError);
    socket.on("message_logged", handleMessageLogged);

    return () => {
      socket.off("assistant_message_chunk", handleStreamingChunk);
      socket.off("assistant_message_complete", handleStreamingComplete);
      socket.off("error", handleServerError);
      socket.off("message_logged", handleMessageLogged);
    };
  }, [socket]);

  // Send message function
  const sendMessage = (content: string) => {
    if (!content.trim()) {
      console.warn("⚠️ Cannot send empty message");
      return;
    }

    console.log("💬 Sending message:", content.slice(0, 50) + "...");

    // Add user message to UI immediately
    dispatch({ type: "ADD_USER_MESSAGE", payload: content });

    // Clear any previous errors
    dispatch({ type: "SET_ERROR", payload: null });

    // Debug connection status
    console.log("🔍 Connection debug:", {
      isConnected,
      hasSocket: !!socket,
      serverHandshakeComplete,
    });

    // Send message to backend (server handles everything)
    if (isConnected && socket && serverHandshakeComplete) {
      console.log("📤 Sending message to server for processing");
      socket.emit("user_message", {
        content,
        timestamp: new Date().toISOString(),
      });

      // Start streaming message placeholder
      const streamingMessage = createAssistantMessage("", "wendy");
      dispatch({
        type: "START_STREAMING",
        payload: streamingMessage,
      });
    } else if (isConnected && socket && !serverHandshakeComplete) {
      console.log("⏳ Waiting for server handshake before sending message");
      dispatch({
        type: "SET_ERROR",
        payload: "Đang kết nối với server...",
      });
    } else {
      console.log("❌ No connection to backend server");
      dispatch({
        type: "SET_ERROR",
        payload: "Không có kết nối đến server",
      });
    }
  };

  // Clear messages function
  const clearMessages = () => {
    console.log("🗑️ Clearing all messages");
    dispatch({ type: "CLEAR_MESSAGES" });
  };

  const value: ChatContextType = {
    state,
    sendMessage,
    clearMessages,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
