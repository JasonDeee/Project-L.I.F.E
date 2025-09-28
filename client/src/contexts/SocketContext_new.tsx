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

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionStatus: "connected" | "disconnected" | "checking" | "handshaking";
  connect: (url?: string) => void;
  disconnect: () => void;
  testConnection: () => Promise<boolean>;
  serverHandshakeComplete: boolean;
  chatHistoryLoaded: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected" | "checking" | "handshaking"
  >("disconnected");
  const [serverHandshakeComplete, setServerHandshakeComplete] = useState(false);
  const [chatHistoryLoaded, setChatHistoryLoaded] = useState(false);

  const connect = (url: string = API_CONFIG.WEBSOCKET_URL) => {
    console.log("🔗 Connecting to backend server:", url);

    if (socket) {
      console.log("🔌 Disconnecting existing socket");
      socket.disconnect();
    }

    setConnectionStatus("checking");

    const newSocket = io(url, {
      transports: ["websocket"],
      timeout: 5000,
      retries: 3,
    });

    console.log("📡 Socket instance created with options:", {
      url,
      transports: ["websocket"],
      timeout: 5000,
      retries: 3,
    });

    // Connection events
    newSocket.on("connect", () => {
      console.log("🎉 WebSocket connected to backend server");
      setSocket(newSocket);
      setIsConnected(true);
      setConnectionStatus("handshaking");

      // Start handshake process
      console.log("🤝 Starting handshake with server...");
      newSocket.emit("client_handshake", {
        clientDate: new Date().toISOString(),
        userAgent: navigator.userAgent,
        sessionId: newSocket.id,
      });
    });

    newSocket.on("handshake_response", (data) => {
      console.log("🤝 Handshake response received:", data);

      if (data.success) {
        setServerHandshakeComplete(true);
        setConnectionStatus("connected");

        if (data.isNewFile) {
          console.log("🆕 New chat bundle created on server");
          setChatHistoryLoaded(true);
        } else if (data.chatHistory) {
          console.log(
            `📚 Loaded ${data.chatHistory.length} messages from server`
          );
          setChatHistoryLoaded(true);
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
      setIsConnected(false);
      setConnectionStatus("disconnected");
      setServerHandshakeComplete(false);
      setChatHistoryLoaded(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("🔴 WebSocket connection error:", error);
      setIsConnected(false);
      setConnectionStatus("disconnected");
      setServerHandshakeComplete(false);
      setChatHistoryLoaded(false);
    });

    // AI Response event handlers
    newSocket.on("assistant_message_chunk", (data) => {
      console.log("📨 Received AI chunk:", data.content?.slice(0, 50) + "...");
      // This will be handled by ChatContext
    });

    newSocket.on("assistant_message_complete", (data) => {
      console.log("🎉 AI response complete:", data.content?.length + " chars");
      // This will be handled by ChatContext
    });

    newSocket.on("message_logged", (data) => {
      console.log("✅ Message logged to server:", data);
    });

    newSocket.on("error", (data) => {
      console.error("🔴 Server error:", data);
    });

    // Connection test response
    newSocket.on("connection_status", (data) => {
      console.log("📊 Connection test response:", data);
      if (data.status === "ok") {
        setIsConnected(true);
        setConnectionStatus("connected");
      }
    });

    setSocket(newSocket);
  };

  const disconnect = () => {
    if (socket) {
      console.log("🔌 Manually disconnecting socket");
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setConnectionStatus("disconnected");
      setServerHandshakeComplete(false);
      setChatHistoryLoaded(false);
    }
  };

  const testConnection = async (): Promise<boolean> => {
    setConnectionStatus("checking");
    console.log(
      "🧪 Testing WebSocket connection - Socket:",
      !!socket,
      "Connected:",
      isConnected
    );

    // Check WebSocket connection
    if (socket?.connected && serverHandshakeComplete) {
      setIsConnected(true);
      setConnectionStatus("connected");
      console.log("✅ WebSocket connection working with handshake complete");
      return true;
    } else if (socket?.connected) {
      setConnectionStatus("handshaking");
      console.log("⏳ WebSocket connected but handshake incomplete");
      return false;
    } else {
      setIsConnected(false);
      setConnectionStatus("disconnected");
      console.log("❌ WebSocket not connected");
      return false;
    }
  };

  // Auto-connect on mount
  useEffect(() => {
    console.log("🚀 SocketProvider mounted, attempting auto-connect");

    const initConnection = () => {
      setConnectionStatus("checking");
      console.log("🔄 Connecting to backend server...");
      connect();
    };

    initConnection();

    return () => {
      console.log("🧹 SocketProvider unmounting");
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const value: SocketContextType = {
    socket,
    isConnected,
    connectionStatus,
    connect,
    disconnect,
    testConnection,
    serverHandshakeComplete,
    chatHistoryLoaded,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
