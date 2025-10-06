class ChatApp {
  constructor() {
    // Auto-detect protocol and use Cloudflare tunnel domain
    this.serverUrl = this.getServerUrl();
    this.conversationHistory = [];
    this.isConnected = false;
    this.isTyping = false;
    this.socket = null;
    this.messageSeq = 0;

    // Streaming state
    this.currentStreamingMessage = null;
    this.currentStreamingMessageId = null;

    this.initializeElements();
    this.bindEvents();
    this.checkConnection();
    // const socket = io();
  }

  getServerUrl() {
    // Check if running on HTTPS (production) or HTTP (local dev)
    const isHTTPS = window.location.protocol === "https:";
    const isProduction = window.location.hostname === "chat.vanced.site";

    if (isProduction) {
      // Production: Use Cloudflare tunnel domain with HTTPS
      return "https://api.vanced.site"; // Use HTTPS, Socket.io will auto-upgrade to WSS
    } else {
      // Local development: Use localhost
      return "http://localhost:9000";
    }
  }

  initializeElements() {
    this.ipInput = document.getElementById("ip-input");
    this.testConnectionBtn = document.getElementById("test-connection");
    this.connectionStatus = document.getElementById("connection-status");
    this.chatMessages = document.getElementById("chat-messages");
    this.messageInput = document.getElementById("message-input");
    this.sendButton = document.getElementById("send-button");
    // Debug panel elements
    this.debugPanel = document.getElementById("debug-panel");
    this.debugConn = document.getElementById("debug-conn");
    this.debugSocket = document.getElementById("debug-socket");
    this.debugServer = document.getElementById("debug-server");
    this.debugLast = document.getElementById("debug-last");
    this.debugLog = document.getElementById("debug-log");
  }

  bindEvents() {
    // Sự kiện cho input IP
    this.ipInput.addEventListener("input", () => {
      this.updateApiUrl();
    });

    this.testConnectionBtn.addEventListener("click", () => {
      this.checkConnection();
    });

    // Sự kiện cho tin nhắn
    this.messageInput.addEventListener("input", () => {
      this.adjustTextareaHeight();
      this.toggleSendButton();
    });

    this.messageInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    this.sendButton.addEventListener("click", () => {
      this.sendMessage();
    });

    // Toggle debug panel collapse
    const toggleBtn = document.getElementById("debug-toggle");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        const collapsed = this.debugPanel.classList.toggle("collapsed");
        toggleBtn.textContent = collapsed ? "▸" : "▾";
        toggleBtn.title = collapsed ? "Mở rộng" : "Thu gọn";
        try {
          localStorage.setItem("debug_collapsed", collapsed ? "1" : "0");
        } catch (_) {}
      });
    }
  }

  updateApiUrl() {
    const ipValue = this.ipInput.value.trim();
    if (ipValue) {
      this.serverUrl = ipValue.startsWith("http")
        ? ipValue
        : `http://${ipValue}`;
    }
  }

  async checkConnection() {
    this.updateConnectionStatus("checking");
    this.testConnectionBtn.disabled = true;
    this.testConnectionBtn.textContent = "Đang kiểm tra...";

    try {
      await this.connectSocket();
      this.updateConnectionStatus("connected");
      this.addSystemMessage("Kết nối WebSocket thành công!");
      // Restore debug collapsed state
      try {
        const collapsed = localStorage.getItem("debug_collapsed") === "1";
        if (collapsed) {
          this.debugPanel.classList.add("collapsed");
          const toggleBtn = document.getElementById("debug-toggle");
          if (toggleBtn) {
            toggleBtn.textContent = "▸";
            toggleBtn.title = "Mở rộng";
          }
        }
      } catch (_) {}
    } catch (error) {
      this.updateConnectionStatus("disconnected");
      this.addSystemMessage(`Lỗi kết nối WebSocket: ${error.message}`);
    } finally {
      this.testConnectionBtn.disabled = false;
      this.testConnectionBtn.textContent = "Kiểm tra kết nối";
    }
  }

  updateConnectionStatus(status) {
    this.connectionStatus.className = `status-indicator ${status}`;
    // Badge on debug panel
    this.debugConn.className = `badge ${status}`;
    this.debugConn.textContent = status.toUpperCase();

    switch (status) {
      case "connected":
        this.connectionStatus.title = "Đã kết nối";
        this.debugLogLine("Kết nối: connected", "ok");
        break;
      case "disconnected":
        this.connectionStatus.title = "Mất kết nối";
        this.debugLogLine("Kết nối: disconnected", "err");
        break;
      case "checking":
        this.connectionStatus.title = "Đang kiểm tra...";
        this.debugLogLine("Kết nối: checking");
        break;
    }
    this.debugLast.textContent = new Date().toLocaleTimeString("vi-VN");
  }

  adjustTextareaHeight() {
    this.messageInput.style.height = "auto";
    this.messageInput.style.height =
      Math.min(this.messageInput.scrollHeight, 120) + "px";
  }

  toggleSendButton() {
    const hasText = this.messageInput.value.trim().length > 0;
    this.sendButton.disabled = !hasText || this.isTyping || !this.isConnected;
  }

  async sendMessage() {
    const message = this.messageInput.value.trim();
    if (!message || this.isTyping || !this.isConnected) return;

    // Thêm tin nhắn của user
    this.addMessage(message, "user");
    this.messageInput.value = "";
    this.adjustTextareaHeight();
    this.toggleSendButton();

    // Gửi tới server qua WebSocket
    const outgoing = {
      content: message,
      timestamp: new Date().toISOString(),
      messageId: ++this.messageSeq,
    };

    try {
      this.socket.emit("user_message", outgoing, (ack) => {
        if (ack && ack.ok) {
          this.debugLogLine(`✅ ACK message #${ack.messageId}`, "ok");
        } else {
          this.debugLogLine("❌ Server không xác nhận tin nhắn", "err");
        }
      });
      this.debugLogLine(`📤 Sent #${outgoing.messageId}: ${message}`);
    } catch (error) {
      this.debugLogLine(`Lỗi gửi tin: ${error.message}`, "err");
    }
  }
  // ===== WebSocket (Socket.IO) =====
  async connectSocket() {
    return new Promise((resolve, reject) => {
      try {
        if (this.socket && this.socket.connected) {
          this.isConnected = true;
          this.toggleSendButton();
          return resolve();
        }

        console.log(`🔌 Attempting to connect to: ${this.serverUrl}`);
        this.debugLogLine(`Connecting to: ${this.serverUrl}`);

        this.socket = io(this.serverUrl, {
          transports: ["websocket"],
          timeout: 5000,
          forceNew: true,
          upgrade: true,
          secure: true, // Force secure connection for HTTPS
        });

        this.setupSocketEvents(resolve, reject);
      } catch (err) {
        reject(err);
      }
    });
  }

  setupSocketEvents(resolve, reject) {
    this.socket.on("connect", () => {
      this.isConnected = true;
      this.toggleSendButton();
      this.debugSocket.textContent = this.socket.id;
      this.debugServer.textContent = this.serverUrl;
      this.debugLogLine(`Connected. Socket ID: ${this.socket.id}`, "ok");

      // Handshake
      this.socket.emit("client_handshake", {
        clientDate: new Date().toISOString(),
        userAgent: navigator.userAgent,
        sessionId: this.socket.id,
      });

      if (resolve) resolve();
    });

    this.socket.on("disconnect", (reason) => {
      this.isConnected = false;
      this.toggleSendButton();
      this.debugSocket.textContent = "-";
      this.debugLogLine(`Disconnected: ${reason}`, "err");
    });

    this.socket.on("connect_error", (error) => {
      this.isConnected = false;
      this.toggleSendButton();
      this.debugLogLine(`Connect error: ${error.message}`, "err");
      if (reject) reject(error);
    });

    // Handshake response → load history
    this.socket.on("handshake_response", (data) => {
      if (data?.success) {
        this.debugLogLine(`Handshake OK: ${data.message || "success"}`, "ok");
        const list = Array.isArray(data.chatHistory) ? data.chatHistory : [];
        if (list.length > 0) {
          list.forEach((m) => {
            const role =
              m.type === "assistant"
                ? "assistant"
                : m.type === "user"
                ? "user"
                : "system";
            this.addMessage(m.content, role);
          });
          this.debugLogLine(`Loaded history: ${list.length} messages`);
        }
      } else {
        this.debugLogLine(`Handshake lỗi: ${data?.error || "Unknown"}`, "err");
      }
    });

    // Confirmations & status
    this.socket.on("message_confirmed", (data) => {
      this.debugLogLine(`✅ Confirmed #${data?.messageId ?? "?"}`, "ok");
    });

    this.socket.on("message_logged", (data) => {
      this.debugLogLine(`📝 Logged: ${data?.type || "unknown"}`);
    });

    this.socket.on("connection_status", (data) => {
      if (data?.message) this.debugLogLine(`📡 ${data.message}`);
    });

    // Assistant streaming events
    this.socket.on("assistant_stream_start", (data) => {
      this.debugLogLine(
        `🎬 Stream started for message #${data.messageId}`,
        "ok"
      );
      // Create streaming message element
      this.currentStreamingMessage = this.createStreamingMessage();
      this.currentStreamingMessageId = data.messageId;
    });

    this.socket.on("assistant_chunk", (data) => {
      if (!data || !this.currentStreamingMessage) return;

      this.debugLogLine(`📦 Chunk #${data.chunkIndex}: "${data.content}"`);
      this.updateStreamingMessage(this.currentStreamingMessage, data.content);
    });

    this.socket.on("assistant_stream_complete", (data) => {
      if (!data || !this.currentStreamingMessage) return;
      // console.log("LM Data:", data.raw);
      this.debugLogLine(
        `✅ Stream completed: ${data.metadata?.character_count} chars in ${data.metadata?.chunk_count} chunks`,
        "ok"
      );
      this.finalizeStreamingMessage(this.currentStreamingMessage);
      this.currentStreamingMessage = null;
      this.currentStreamingMessageId = null;
    });

    this.socket.on("assistant_stream_error", (data) => {
      this.debugLogLine(`❌ Stream error: ${data.error}`, "err");
      if (this.currentStreamingMessage) {
        this.removeStreamingMessage(this.currentStreamingMessage);
        this.currentStreamingMessage = null;
        this.currentStreamingMessageId = null;
      }
    });

    // Legacy assistant message (fallback)
    this.socket.on("assistant_message", (data) => {
      if (!data) return;
      const content = data.content ?? "";
      this.addMessage(content, "assistant");
    });

    // Compression status updates
    this.socket.on("compression_status_response", (data) => {
      this.debugLogLine(
        `🔄 Compression Status: ${data.isCompressing ? "Active" : "Idle"}`
      );
      if (data.stats) {
        this.debugLogLine(
          `📊 Total compressions: ${data.stats.totalCompressions}`
        );
      }
    });
  }

  addMessage(content, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}`;

    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";

    if (sender === "system") {
      contentDiv.innerHTML = `<strong>Hệ thống:</strong> ${this.escapeHtml(
        content
      )}`;
    } else {
      contentDiv.textContent = content;
    }

    const timeDiv = document.createElement("div");
    timeDiv.className = "message-time";
    timeDiv.textContent = new Date().toLocaleTimeString("vi-VN");

    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeDiv);
    this.chatMessages.appendChild(messageDiv);

    this.scrollToBottom();
  }

  addSystemMessage(content) {
    // Không đẩy vào chat nữa; hiển thị ở debug panel
    this.debugLogLine(content);
  }

  createStreamingMessage() {
    const messageDiv = document.createElement("div");
    messageDiv.className = "message assistant streaming";

    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";
    // Tách phần text và cursor để tránh bị ghi đè khi cập nhật
    const textSpan = document.createElement("span");
    textSpan.className = "streaming-text";
    textSpan.textContent = "";

    // Thêm cursor nhấp nháy để hiển thị đang gõ
    const cursor = document.createElement("span");
    cursor.className = "streaming-cursor";
    cursor.textContent = "▋";
    contentDiv.appendChild(textSpan);
    contentDiv.appendChild(cursor);

    const timeDiv = document.createElement("div");
    timeDiv.className = "message-time";
    timeDiv.textContent = new Date().toLocaleTimeString("vi-VN");

    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeDiv);
    this.chatMessages.appendChild(messageDiv);

    this.scrollToBottom();
    return messageDiv;
  }

  updateStreamingMessage(messageElement, content) {
    const contentDiv = messageElement.querySelector(".message-content");
    const textSpan = contentDiv.querySelector(".streaming-text");
    if (!textSpan) {
      // Fallback để không bị mất cursor
      const fallback = document.createElement("span");
      fallback.className = "streaming-text";
      contentDiv.insertBefore(
        fallback,
        contentDiv.querySelector(".streaming-cursor")
      );
      fallback.textContent = "";
    }
    const target = contentDiv.querySelector(".streaming-text");
    // Ghép nối chunk mới vào cuối
    target.textContent += content;

    this.scrollToBottom();
  }

  finalizeStreamingMessage(messageElement) {
    // Xóa cursor và class streaming
    const contentDiv = messageElement.querySelector(".message-content");
    const cursor = contentDiv.querySelector(".streaming-cursor");
    if (cursor) {
      cursor.remove();
    }

    messageElement.classList.remove("streaming");

    // Cập nhật timestamp
    const timeDiv = messageElement.querySelector(".message-time");
    timeDiv.textContent = new Date().toLocaleTimeString("vi-VN");
  }

  removeStreamingMessage(messageElement) {
    if (messageElement && messageElement.parentNode) {
      messageElement.parentNode.removeChild(messageElement);
    }
  }

  scrollToBottom() {
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // ===== Debug helpers =====
  debugLogLine(text, level = "") {
    if (!this.debugLog) return;
    const line = document.createElement("div");
    line.className = `line ${level}`.trim();
    const ts = document.createElement("span");
    ts.className = "ts";
    ts.textContent = `[${new Date().toLocaleTimeString("vi-VN")}]`;
    const msg = document.createElement("span");
    msg.textContent = ` ${text}`;
    line.appendChild(ts);
    line.appendChild(msg);
    this.debugLog.appendChild(line);
    this.debugLog.scrollTop = this.debugLog.scrollHeight;
    this.debugLast.textContent = new Date().toLocaleTimeString("vi-VN");
  }
}

// Khởi tạo ứng dụng khi trang web được tải
document.addEventListener("DOMContentLoaded", () => {
  new ChatApp();
});
