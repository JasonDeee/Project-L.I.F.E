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
}

type ChatAction =
  | { type: "ADD_USER_MESSAGE"; payload: string }
  | { type: "ADD_ASSISTANT_MESSAGE"; payload: string }
  | { type: "SET_LOADING"; payload: boolean }
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

    case "ADD_ASSISTANT_MESSAGE":
      return {
        ...state,
        messages: [
          ...state.messages,
          createAssistantMessage(action.payload, "wendy"),
        ],
        isLoading: false,
        error: null,
      };

    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
        error: null,
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        isLoading: false,
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

  // Handle AI responses
  useEffect(() => {
    if (!socket) return;

    // Handle AI response
    const handleAssistantMessage = (data: any) => {
      console.log("🎉 AI response received:", data.content?.length + " chars");
      dispatch({
        type: "ADD_ASSISTANT_MESSAGE",
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

    socket.on("assistant_message", handleAssistantMessage);
    socket.on("error", handleServerError);
    socket.on("message_logged", handleMessageLogged);

    return () => {
      socket.off("assistant_message", handleAssistantMessage);
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

    // Set loading state
    dispatch({ type: "SET_LOADING", payload: true });

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
