import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { SOCKET_EVENTS, API_CONFIG } from "../utils/constants";
import { Message } from "../types";
import { directLMStudioService } from "../services/directLMStudioService";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionStatus: "connected" | "disconnected" | "checking" | "handshaking";
  connect: (url?: string) => void;
  disconnect: () => void;
  sendMessage: (content: string) => void;
  testConnection: () => void;
  serverHandshakeComplete: boolean;
  chatHistoryLoaded: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected" | "checking" | "handshaking"
  >("disconnected");
  const [directConnectionWorking, setDirectConnectionWorking] = useState(false);
  const [serverHandshakeComplete, setServerHandshakeComplete] = useState(false);
  const [chatHistoryLoaded, setChatHistoryLoaded] = useState(false);

  const connect = (url: string = API_CONFIG.WEBSOCKET_URL) => {
    console.log("🔌 Attempting WebSocket connection for backend logging...");

    console.log("🔗 Attempting WebSocket connection to:", url);

    if (socket) {
      console.log("🔌 Disconnecting existing socket");
      socket.disconnect();
    }

    const newSocket = io(url, {
      transports: ["websocket"],
      timeout: API_CONFIG.TIMEOUT.CONNECTION_TEST,
      retries: 1, // Reduced retries since we have direct API fallback
      forceNew: true, // Force new connection
    });

    console.log("📡 WebSocket instance created with options:", {
      url,
      transports: ["websocket"],
      timeout: API_CONFIG.TIMEOUT.CONNECTION_TEST,
      retries: 1,
    });

    // Connection event handlers
    newSocket.on("connect", () => {
      console.log("🎉 WebSocket connected to backend server");
      setIsConnected(true);
      setConnectionStatus("handshaking");

      // Start handshake process
      console.log("🤝 Starting handshake with server...");
      newSocket.emit("client_handshake", {
        clientDate: new Date().toISOString(),
        userAgent: navigator.userAgent,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    });

    // Handle handshake response
    newSocket.on("handshake_response", (data) => {
      console.log("🤝 Handshake response received:", data);

      if (data.success) {
        setServerHandshakeComplete(true);
        setConnectionStatus("connected");
        setChatHistoryLoaded(true);

        if (data.isNewFile) {
          console.log("🆕 New chat bundle created on server");
          console.log(`📂 File path: ${data.filePath}`);
        } else {
          console.log(
            `📚 Loaded ${data.chatHistory.length} messages from history`
          );
          // TODO: Load chat history into ChatContext
        }

        console.log("✅ Server handshake completed successfully");
      } else {
        console.error("❌ Server handshake failed:", data.error);
        setConnectionStatus("disconnected");
        setServerHandshakeComplete(false);
      }
    });

    newSocket.on("disconnect", (reason) => {
      console.log("❌ WebSocket disconnected:", reason);
      setServerHandshakeComplete(false);
      setChatHistoryLoaded(false);

      // Keep connected status if we have direct API connection
      if (!directConnectionWorking) {
        setIsConnected(false);
        setConnectionStatus("disconnected");
      } else {
        console.log("⚠️ WebSocket disconnected but Direct API still working");
        setConnectionStatus("connected"); // Keep connected for UI
      }
    });

    newSocket.on("connect_error", (error) => {
      console.error("🔴 WebSocket connection error:", error);
      setServerHandshakeComplete(false);
      setChatHistoryLoaded(false);

      // Don't set disconnected if we have direct API connection
      if (!directConnectionWorking) {
        setIsConnected(false);
        setConnectionStatus("disconnected");
      } else {
        console.log("⚠️ WebSocket failed but Direct API still working");
        setConnectionStatus("connected"); // Keep connected for UI
      }
    });

    // Message event handlers
    newSocket.on(SOCKET_EVENTS.ASSISTANT_MESSAGE, (message: Message) => {
      console.log("📨 Received assistant message:", message);
      // This will be handled by ChatContext
    });

    newSocket.on(SOCKET_EVENTS.ASSISTANT_TYPING, (data) => {
      console.log("⌨️ Assistant typing:", data);
      // This will be handled by ChatContext
    });

    newSocket.on(SOCKET_EVENTS.CONNECTION_STATUS, (data) => {
      console.log("🔗 Connection status update:", data);
      setConnectionStatus(data.status);
    });

    newSocket.on(SOCKET_EVENTS.ERROR, (error) => {
      console.error("❗ Socket error:", error);
      // This will be handled by ChatContext for error display
    });

    setSocket(newSocket);
  };

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setConnectionStatus("disconnected");
    }
  };

  const sendMessage = (content: string) => {
    if (socket && isConnected) {
      const messageData = {
        content,
        timestamp: new Date().toISOString(),
      };

      socket.emit(SOCKET_EVENTS.USER_MESSAGE, messageData);
      console.log("📤 Sent message:", messageData);
    } else {
      console.warn("⚠️ Cannot send message: Socket not connected");
    }
  };

  const testConnection = async () => {
    console.log(
      "🧪 Manual connection test - Socket:",
      !!socket,
      "Connected:",
      isConnected,
      "Direct working:",
      directConnectionWorking
    );

    // Always test LM Studio API first
    setConnectionStatus("checking");
    const lmStudioUrl =
      localStorage.getItem("life_api_url") || "http://192.168.1.3:1234";
    directLMStudioService.updateApiUrl(lmStudioUrl);

    const result = await directLMStudioService.testConnection();

    if (result.success) {
      console.log("🎉 Manual test: Direct API connection working");
      setDirectConnectionWorking(true);
      setConnectionStatus("connected");
      setIsConnected(true);
      return;
    } else {
      console.error(
        "❌ Manual test: LM Studio connection failed:",
        result.error
      );
      setDirectConnectionWorking(false);
    }

    // If direct connection failed, try WebSocket (when backend is available)
    if (socket && socket.connected) {
      setConnectionStatus("checking");
      console.log("📤 Testing existing WebSocket connection");
      socket.emit("connection_test");
    } else {
      console.warn("⚠️ No working connections found");
      setConnectionStatus("disconnected");
      setIsConnected(false);
    }
  };

  // Auto-connect on mount
  useEffect(() => {
    console.log("🚀 SocketProvider mounted, attempting auto-connect");

    // Try direct LM Studio connection first
    const initConnection = async () => {
      setConnectionStatus("checking");
      const lmStudioUrl =
        localStorage.getItem("life_api_url") || "http://192.168.1.3:1234";
      directLMStudioService.updateApiUrl(lmStudioUrl);

      const result = await directLMStudioService.testConnection();

      if (result.success) {
        console.log("🎉 Direct API connection working");
        setDirectConnectionWorking(true);
        console.log("📋 Direct API Summary:", {
          type: "Direct LM Studio API",
          url: lmStudioUrl,
          models: result.data?.data?.length || 0,
          status: "✅ Ready",
        });

        // ALWAYS try WebSocket for backend logging, regardless of direct API status
        console.log(
          "🔄 Direct API working, now connecting to backend server for logging..."
        );
        connect();
      } else {
        console.error("❌ LM Studio connection failed:", result.error);
        setDirectConnectionWorking(false);
        console.log(
          "🔄 Direct connection failed, trying WebSocket as backup for both API and logging"
        );
        connect();
      }
    };

    initConnection();

    return () => {
      console.log("🧹 SocketProvider unmounting");
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  const value: SocketContextType = {
    socket,
    isConnected,
    connectionStatus,
    connect,
    disconnect,
    sendMessage,
    testConnection,
    serverHandshakeComplete,
    chatHistoryLoaded,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

// Custom hook to use socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
