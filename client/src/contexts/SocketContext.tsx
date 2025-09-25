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
  connectionStatus: "connected" | "disconnected" | "checking";
  connect: (url?: string) => void;
  disconnect: () => void;
  sendMessage: (content: string) => void;
  testConnection: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected" | "checking"
  >("disconnected");
  const [directConnectionWorking, setDirectConnectionWorking] = useState(false);

  const connect = (url: string = API_CONFIG.WEBSOCKET_URL) => {
    // Skip WebSocket if direct connection is already working
    if (directConnectionWorking) {
      console.log(
        "⏭️ Skipping WebSocket connection - Direct API already working"
      );
      return;
    }

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
      console.log("✅ WebSocket connected");
      setIsConnected(true);
      setConnectionStatus("connected");
    });

    newSocket.on("disconnect", (reason) => {
      console.log("❌ WebSocket disconnected:", reason);
      // Don't set disconnected if we have direct API connection
      if (!directConnectionWorking) {
        setIsConnected(false);
        setConnectionStatus("disconnected");
      }
    });

    newSocket.on("connect_error", (error) => {
      console.error("🔴 WebSocket connection error:", error);
      // Don't set disconnected if we have direct API connection
      if (!directConnectionWorking) {
        setIsConnected(false);
        setConnectionStatus("disconnected");
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
        setConnectionStatus("connected");
        setIsConnected(true);
        console.log("✅ Direct connection working, skipping WebSocket");
        console.log("📋 Connection Summary:", {
          type: "Direct LM Studio API",
          url: lmStudioUrl,
          models: result.data?.data?.length || 0,
          status: "✅ Ready",
        });
      } else {
        console.error("❌ LM Studio connection failed:", result.error);
        setDirectConnectionWorking(false);
        console.log("🔄 Direct connection failed, trying WebSocket as backup");
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
