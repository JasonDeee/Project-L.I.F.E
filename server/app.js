const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const { ensureDirectories } = require("./config/paths");
const ChatLogger = require("./utils/chatLogger");

/**
 * Project L.I.F.E - Simple Backend Server
 * Basic chat history logging to Daily_chat.json files
 */

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Configure CORS
const corsOptions = {
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  methods: ["GET", "POST"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Initialize Socket.io with CORS
const io = socketIo(server, {
  cors: corsOptions,
});

// Initialize Chat Logger
const chatLogger = new ChatLogger();

// Basic health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Project L.I.F.E Backend Server",
    timestamp: new Date().toISOString(),
    chatLogPath: chatLogger.getTodaysFilePath(),
  });
});

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  console.log(`📍 Client IP: ${socket.handshake.address}`);
  console.log(
    `🌐 User Agent: ${socket.handshake.headers["user-agent"]?.substring(
      0,
      50
    )}...`
  );

  // Send welcome message
  socket.emit("connection_status", {
    status: "connected",
    message: "Kết nối thành công với backend server",
    serverId: socket.id,
  });

  // Handle client handshake with date sync
  socket.on("client_handshake", async (data) => {
    console.log(`🤝 Handshake request from ${socket.id}:`, data);

    try {
      const clientDate = new Date(data.clientDate);
      const serverDate = new Date();

      console.log(`📅 Client date: ${clientDate.toISOString()}`);
      console.log(`📅 Server date: ${serverDate.toISOString()}`);

      // Check if dates are close (within 24 hours)
      const timeDiff = Math.abs(serverDate.getTime() - clientDate.getTime());
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      if (hoursDiff > 24) {
        console.log(
          `⚠️ Date mismatch! Difference: ${hoursDiff.toFixed(2)} hours`
        );
        socket.emit("handshake_response", {
          success: false,
          error: "Date mismatch",
          serverDate: serverDate.toISOString(),
          clientDate: clientDate.toISOString(),
          hoursDiff: hoursDiff.toFixed(2),
        });
        return;
      }

      // Use server date for file operations
      const workingDate = serverDate;
      const filePath = chatLogger.getTodaysFilePath();
      console.log(`📂 Checking file path: ${filePath}`);

      // Check if today's chat file exists
      const chatData = await chatLogger.getDailyChatData(workingDate);
      const isNewFile = chatData.messages.length === 0;

      if (isNewFile) {
        console.log(
          `🆕 Created new daily chat bundle for ${workingDate.toDateString()}`
        );
        socket.emit("handshake_response", {
          success: true,
          isNewFile: true,
          serverDate: serverDate.toISOString(),
          filePath: filePath,
          message: "Tạo bundle chat mới thành công",
          chatHistory: [],
        });
      } else {
        console.log(
          `📚 Loading existing chat history: ${chatData.messages.length} messages`
        );
        socket.emit("handshake_response", {
          success: true,
          isNewFile: false,
          serverDate: serverDate.toISOString(),
          filePath: filePath,
          message: "Đã tải lịch sử chat",
          chatHistory: chatData.messages,
        });
      }

      console.log(`✅ Handshake completed successfully for ${socket.id}`);
    } catch (error) {
      console.error(`❌ Handshake error for ${socket.id}:`, error);
      socket.emit("handshake_response", {
        success: false,
        error: error.message,
        serverDate: new Date().toISOString(),
      });
    }
  });

  // Handle user messages
  socket.on("user_message", async (data) => {
    console.log(`📨 Received user message from ${socket.id}:`, data);

    try {
      // Log user message
      const success = await chatLogger.logUserMessage(data.content, {
        session_id: socket.id,
        timestamp: data.timestamp,
        ip_address: socket.handshake.address,
        user_agent: socket.handshake.headers["user-agent"],
      });

      if (success) {
        // Acknowledge message received and logged
        socket.emit("message_logged", {
          type: "user",
          content: data.content,
          timestamp: new Date().toISOString(),
          logged: true,
        });

        console.log("✅ User message logged successfully");
      } else {
        throw new Error("Failed to log message");
      }
    } catch (error) {
      console.error("❌ Error handling user message:", error);
      socket.emit("error", {
        message: "Không thể lưu tin nhắn",
        code: "LOG_ERROR",
      });
    }
  });

  // Handle assistant messages (from React direct API responses)
  socket.on("assistant_message", async (data) => {
    console.log(`🤖 Received assistant message from ${socket.id}:`, data);

    try {
      const success = await chatLogger.logAssistantMessage(
        data.content,
        data.assistant || "wendy",
        {
          session_id: socket.id,
          response_time_ms: data.response_time_ms,
          tokens_used: data.tokens_used,
          model: data.model,
          streaming: data.streaming,
        }
      );

      if (success) {
        socket.emit("message_logged", {
          type: "assistant",
          assistant: data.assistant || "wendy",
          content: data.content,
          timestamp: new Date().toISOString(),
          logged: true,
        });

        console.log(
          `✅ ${data.assistant || "wendy"} message logged successfully`
        );
      } else {
        throw new Error("Failed to log assistant message");
      }
    } catch (error) {
      console.error("❌ Error handling assistant message:", error);
      socket.emit("error", {
        message: "Không thể lưu phản hồi assistant",
        code: "LOG_ERROR",
      });
    }
  });

  // Handle connection test
  socket.on("connection_test", () => {
    console.log(`🧪 Connection test from ${socket.id}`);
    socket.emit("connection_status", {
      status: "connected",
      message: "Backend server đang hoạt động bình thường",
      timestamp: new Date().toISOString(),
    });
  });

  // Handle disconnect
  socket.on("disconnect", (reason) => {
    console.log(`❌ Client disconnected: ${socket.id}, reason: ${reason}`);
  });

  // Handle errors
  socket.on("error", (error) => {
    console.error(`🔴 Socket error from ${socket.id}:`, error);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Express error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

// Server startup
async function startServer() {
  try {
    // Ensure directories exist
    await ensureDirectories();

    // Start server
    const PORT = process.env.PORT || 8000;
    server.listen(PORT, () => {
      console.log("🚀 Project L.I.F.E Backend Server Started");
      console.log(`📍 Server running on port ${PORT}`);
      console.log(`🌐 CORS enabled for: http://localhost:3000`);
      console.log(
        `💾 Chat logs will be saved to: ${chatLogger.getTodaysFilePath()}`
      );
      console.log("✅ Server ready to receive connections");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down server gracefully...");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

// Start the server
startServer();
