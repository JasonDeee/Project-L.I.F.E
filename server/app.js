const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const { ensureDirectories } = require("./config/paths");
const ChatLogger = require("./utils/chatLogger");
const lmStudioService = require("./services/lmStudioService");

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
  console.log(`🔌 ===== NEW CLIENT CONNECTION =====`);
  console.log(`🆔 Socket ID: ${socket.id}`);
  console.log(`📍 Client IP: ${socket.handshake.address}`);
  console.log(
    `🌐 User Agent: ${socket.handshake.headers["user-agent"]?.substring(
      0,
      50
    )}...`
  );
  console.log(`🔌 ===== CONNECTION ESTABLISHED =====`);

  // Debug any incoming event names and payloads
  socket.onAny((event, ...args) => {
    try {
      const preview = JSON.stringify(args[0])?.slice(0, 200);
      console.log(
        `📥 onAny → Event: '${event}' from ${socket.id} | Payload preview:`,
        preview
      );
    } catch (e) {
      console.log(
        `📥 onAny → Event: '${event}' from ${socket.id} | (non-serializable payload)`
      );
    }
  });

  // Debug: Log total active connections
  const activeConnections = io.sockets.sockets.size;
  console.log(`📊 Total active connections: ${activeConnections}`);

  // Force single connection - disconnect others if more than 1
  if (activeConnections > 1) {
    console.log(`⚠️ Multiple connections detected! Disconnecting others...`);
    const allSockets = Array.from(io.sockets.sockets.values());
    allSockets.forEach((s) => {
      if (s.id !== socket.id) {
        console.log(`🔌 Disconnecting socket: ${s.id}`);
        s.disconnect(true);
      }
    });
    console.log(`✅ Forced single connection: ${socket.id}`);
  }

  // Send welcome message
  socket.emit("connection_status", {
    status: "connected",
    message: "Kết nối thành công với backend server",
    serverId: socket.id,
  });

  // Debug: Log all event listeners being set up
  console.log(`🎧 Setting up event listeners for socket: ${socket.id}`);
  console.log(
    `📡 Events to listen for: client_handshake, user_message, connection_test, disconnect, error`
  );

  // Handle user messages and trigger AI response FIRST
  socket.on("user_message", async (data, ack) => {
    console.log(`📨 ===== USER MESSAGE RECEIVED =====`);
    console.log(`🆔 Socket ID: ${socket.id}`);
    console.log(`📦 Message data:`, data);
    console.log(`📝 Content:`, data?.content);
    console.log(`⏰ Timestamp:`, data?.timestamp);
    console.log(`🆔 Message ID:`, data?.messageId);
    console.log(`📨 ===== PROCESSING MESSAGE =====`);

    // Immediate low-latency ack
    if (typeof ack === "function") {
      try {
        ack({ ok: true, received: true, messageId: data?.messageId });
        console.log(`✅ Ack sent for messageId:`, data?.messageId);
      } catch (_) {}
    }

    // Debug: Log all active socket IDs
    const allSocketIds = Array.from(io.sockets.sockets.keys());
    console.log(`🔍 All active socket IDs:`, allSocketIds);
    console.log(`🎯 Message received by socket: ${socket.id}`);

    // Send confirmation back to client (event-based)
    socket.emit("message_confirmed", {
      messageId: data?.messageId,
      received: true,
      timestamp: new Date().toISOString(),
    });
    console.log(`✅ Message confirmation sent to client`);

    // Debug: Log listener count after setup
    console.log(
      `🔍 'user_message' listener count:`,
      socket.listenerCount("user_message")
    );

    try {
      // 1. Log user message first
      const userLogSuccess = await chatLogger.logUserMessage(data.content, {
        session_id: socket.id,
        timestamp: data.timestamp,
        ip_address: socket.handshake.address,
        user_agent: socket.handshake.headers["user-agent"],
      });

      if (!userLogSuccess) {
        throw new Error("Failed to log user message");
      }

      // 2. Acknowledge user message logged
      socket.emit("message_logged", {
        type: "user",
        content: data.content,
        timestamp: new Date().toISOString(),
        logged: true,
      });

      console.log("✅ User message logged successfully");

      // 3. Get chat history for context
      const chatHistory = await chatLogger.getTodaysChatHistory();
      const recentHistory = chatHistory.slice(-10); // Last 10 messages for context

      console.log(
        `🧠 Getting AI response with ${recentHistory.length} context messages...`
      );

      // 4. Get AI response from LM Studio (non-streaming)
      const aiResponse = await lmStudioService.sendChatCompletion(
        data.content,
        recentHistory,
        {
          temperature: 0.7,
          maxTokens: 2048,
        }
      );

      if (aiResponse.success) {
        // 5. Log AI response
        const aiLogSuccess = await chatLogger.logAssistantMessage(
          aiResponse.fullResponse,
          {
            session_id: socket.id,
            assistant: "wendy",
            model: aiResponse.metadata?.model || "unknown",
            response_time_ms: aiResponse.metadata?.response_time_ms,
            streaming: aiResponse.metadata?.streaming,
          }
        );

        // 6. Send AI response to client
        socket.emit("assistant_message", {
          type: "assistant",
          content: aiResponse.fullResponse,
          assistant: "wendy",
          timestamp: new Date().toISOString(),
          logged: aiLogSuccess,
          metadata: aiResponse.metadata,
        });

        console.log(
          `🤖 AI response completed and logged: ${aiResponse.fullResponse.length} chars`
        );
      } else {
        throw new Error(`AI response failed: ${aiResponse.error}`);
      }
    } catch (error) {
      console.error("❌ Error handling user message:", error);
      socket.emit("error", {
        message: "Không thể xử lý tin nhắn",
        code: "PROCESSING_ERROR",
        details: error.message,
      });
    }
  });

  // Debug: Test event listener setup
  console.log(`🧪 Testing event listener setup for socket: ${socket.id}`);
  console.log(
    `🔍 Socket has 'user_message' listener:`,
    socket.listenerCount("user_message")
  );

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

  // NOTE: assistant_message handler removed - AI responses now processed in user_message handler

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
    server.listen(PORT, async () => {
      console.log("🚀 Project L.I.F.E Backend Server Started");
      console.log(`📍 Server running on port ${PORT}`);
      console.log(`🌐 CORS enabled for: http://localhost:3000`);
      console.log(
        `💾 Chat logs will be saved to: ${chatLogger.getTodaysFilePath()}`
      );
      console.log("✅ Server ready to receive connections");

      // Initialize LM Studio on startup
      console.log(`🤖 Initializing LM Studio...`);
      try {
        const initResult = await lmStudioService.initialize();
        if (initResult.success) {
          console.log(`✅ LM Studio ready for chat requests`);
        } else {
          console.error(
            `❌ LM Studio initialization failed: ${initResult.error}`
          );
        }
      } catch (error) {
        console.error(`❌ LM Studio startup error:`, error.message);
      }
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
