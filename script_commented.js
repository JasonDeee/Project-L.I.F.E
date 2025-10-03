class ChatApp {
  // Định nghĩa class ChatApp để quản lý ứng dụng chat
  constructor() {
    // Constructor - khởi tạo app khi class được tạo
    // Auto-detect protocol and use Cloudflare tunnel domain
    this.serverUrl = this.getServerUrl(); // Lấy URL server phù hợp với môi trường hiện tại
    console.log("Loaded Server URL: ", this.serverUrl);
    this.conversationHistory = []; // Mảng lưu lịch sử cuộc trò chuyện
    this.isConnected = false; // Trạng thái kết nối WebSocket (false = chưa kết nối)
    this.isTyping = false; // Trạng thái đang gõ tin nhắn (để disable UI)
    this.socket = null; // Đối tượng Socket.IO connection
    this.messageSeq = 0; // Bộ đếm sequence cho tin nhắn (để tracking)

    // Streaming state
    this.currentStreamingMessage = null; // Tham chiếu đến tin nhắn đang streaming từ assistant
    this.currentStreamingMessageId = null; // ID của tin nhắn đang streaming

    this.initializeElements();
    this.bindEvents();
    this.checkConnection();
    // const socket = io();
  } // Kết thúc block code

  getServerUrl() {
    // Phương thức xác định URL server dựa vào môi trường (production/development)
    // Check if running on HTTPS (production) or HTTP (local dev)
    const isHTTPS = window.location.protocol === "https:"; // Kiểm tra protocol hiện tại (HTTPS = production)
    const isProduction = window.location.hostname === "chat.vanced.site"; // Kiểm tra domain production
    console.log("HostName:", window.location.hostname);

    if (isProduction) {
      // Bắt đầu block code
      // Production: Use Cloudflare tunnel domain with HTTPS
      return "https://api.vanced.site"; // Use HTTPS, Socket.io will auto-upgrade to WSS // URL API production với Cloudflare tunnel
    } else {
      // Bắt đầu block code
      // Local development: Use localhost
      return "http://localhost:9000"; // URL API development (localhost)
    } // Kết thúc block code
  } // Kết thúc block code

  initializeElements() {
    // Khởi tạo tham chiếu đến các DOM element cần thiết
    this.ipInput = document.getElementById("ip-input"); // Lấy tham chiếu DOM element #ip-input
    this.testConnectionBtn = document.getElementById("test-connection"); // Lấy tham chiếu DOM element #test-connection
    this.connectionStatus = document.getElementById("connection-status"); // Lấy tham chiếu DOM element #connection-status
    this.chatMessages = document.getElementById("chat-messages"); // Lấy tham chiếu DOM element #chat-messages
    this.messageInput = document.getElementById("message-input"); // Lấy tham chiếu DOM element #message-input
    this.sendButton = document.getElementById("send-button"); // Lấy tham chiếu DOM element #send-button
    // Debug panel elements
    this.debugPanel = document.getElementById("debug-panel"); // Lấy tham chiếu DOM element #debug-panel
    this.debugConn = document.getElementById("debug-conn"); // Lấy tham chiếu DOM element #debug-conn
    this.debugSocket = document.getElementById("debug-socket"); // Lấy tham chiếu DOM element #debug-socket
    this.debugServer = document.getElementById("debug-server"); // Lấy tham chiếu DOM element #debug-server
    this.debugLast = document.getElementById("debug-last"); // Lấy tham chiếu DOM element #debug-last
    this.debugLog = document.getElementById("debug-log"); // Lấy tham chiếu DOM element #debug-log
  } // Kết thúc block code

  bindEvents() {
    // Đăng ký các event listener cho UI interactions
    // Sự kiện cho input IP
    // this.ipInput.addEventListener("input", () => {
    //   // Đăng ký event listener cho sự kiện input
    //   this.updateApiUrl();
    // }); // Kết thúc block code

    this.testConnectionBtn.addEventListener("click", () => {
      // Đăng ký event listener cho sự kiện click
      this.checkConnection();
    }); // Kết thúc block code

    // Sự kiện cho tin nhắn
    this.messageInput.addEventListener("input", () => {
      // Đăng ký event listener cho sự kiện input
      this.adjustTextareaHeight();
      this.toggleSendButton();
    }); // Kết thúc block code

    this.messageInput.addEventListener("keydown", (e) => {
      // Đăng ký event listener cho sự kiện keydown
      if (e.key === "Enter" && !e.shiftKey) {
        // Bắt đầu block code
        e.preventDefault(); // Ngăn hành vi mặc định của sự kiện
        this.sendMessage(); // Gọi hàm gửi tin nhắn
      } // Kết thúc block code
    }); // Kết thúc block code

    this.sendButton.addEventListener("click", () => {
      // Đăng ký event listener cho sự kiện click
      this.sendMessage(); // Gọi hàm gửi tin nhắn
    }); // Kết thúc block code

    // Toggle debug panel collapse
    const toggleBtn = document.getElementById("debug-toggle"); // Lấy tham chiếu DOM element #debug-toggle
    if (toggleBtn) {
      // Bắt đầu block code
      toggleBtn.addEventListener("click", () => {
        // Đăng ký event listener cho sự kiện click
        const collapsed = this.debugPanel.classList.toggle("collapsed");
        toggleBtn.textContent = collapsed ? "▸" : "▾"; // Gán nội dung text cho element
        toggleBtn.title = collapsed ? "Mở rộng" : "Thu gọn";
        try {
          // Bắt đầu block code
          localStorage.setItem("debug_collapsed", collapsed ? "1" : "0"); // Lưu trạng thái vào localStorage
        } catch (_) {} // Bắt đầu block code
      }); // Kết thúc block code
    } // Kết thúc block code
  } // Kết thúc block code

  updateApiUrl() {
    // Cập nhật URL API khi user thay đổi IP input
    const ipValue = this.ipInput.value.trim(); // Loại bỏ khoảng trắng đầu/cuối chuỗi
    if (ipValue) {
      // Bắt đầu block code
      this.serverUrl = ipValue.startsWith("http") // Kiểm tra URL có bắt đầu bằng http không
        ? ipValue
        : `http://${ipValue}`; // Bắt đầu block code
    } // Kết thúc block code
  } // Kết thúc block code

  async checkConnection() {
    // Bắt đầu block code
    this.updateConnectionStatus("checking"); // Cập nhật UI với trạng thái kết nối: checking
    this.testConnectionBtn.disabled = true; // Vô hiệu hóa/kích hoạt nút test connection
    this.testConnectionBtn.textContent = "Đang kiểm tra..."; // Gán nội dung text cho element

    try {
      // Bắt đầu block code
      await this.connectSocket(); // Chờ kết nối WebSocket hoàn tất (async)
      this.updateConnectionStatus("connected"); // Cập nhật UI với trạng thái kết nối: connected
      this.addSystemMessage("Kết nối WebSocket thành công!"); // Hiển thị thông báo hệ thống
      // Restore debug collapsed state
      try {
        // Bắt đầu block code
        const collapsed = localStorage.getItem("debug_collapsed") === "1"; // Đọc trạng thái từ localStorage
        if (collapsed) {
          // Bắt đầu block code
          this.debugPanel.classList.add("collapsed"); // Thêm class "collapsed" để thu gọn debug panel
          const toggleBtn = document.getElementById("debug-toggle"); // Lấy tham chiếu DOM element #debug-toggle
          if (toggleBtn) {
            // Bắt đầu block code
            toggleBtn.textContent = "▸"; // Gán nội dung text cho element
            toggleBtn.title = "Mở rộng";
          } // Kết thúc block code
        } // Kết thúc block code
      } catch (_) {} // Bắt đầu block code
    } catch (error) {
      // Bắt đầu block code
      this.updateConnectionStatus("disconnected"); // Cập nhật UI với trạng thái kết nối: disconnected
      this.addSystemMessage(`Lỗi kết nối WebSocket: ${error.message}`); // Hiển thị thông báo hệ thống
    } finally {
      // Bắt đầu block code
      this.testConnectionBtn.disabled = false; // Vô hiệu hóa/kích hoạt nút test connection
      this.testConnectionBtn.textContent = "Kiểm tra kết nối"; // Gán nội dung text cho element
    } // Kết thúc block code
  } // Kết thúc block code

  updateConnectionStatus(status) {
    // Cập nhật trạng thái kết nối trên UI và debug panel
    this.connectionStatus.className = `status-indicator ${status}`; // Gán CSS class cho element
    // Badge on debug panel
    this.debugConn.className = `badge ${status}`; // Gán CSS class cho element
    this.debugConn.textContent = status.toUpperCase(); // Gán nội dung text cho element

    switch (
      status // Bắt đầu block code
    ) {
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
    } // Kết thúc block code
    this.debugLast.textContent = new Date().toLocaleTimeString("vi-VN"); // Lấy thời gian hiện tại theo format Việt Nam
  } // Kết thúc block code

  adjustTextareaHeight() {
    // Tự động điều chỉnh chiều cao textarea theo nội dung
    this.messageInput.style.height = "auto"; // Reset height để tính toán lại scrollHeight
    this.messageInput.style.height =
      Math.min(this.messageInput.scrollHeight, 120) + "px"; // Giới hạn chiều cao tối đa 120px
  } // Kết thúc block code

  toggleSendButton() {
    // Bật/tắt nút gửi dựa trên điều kiện (có text, đã kết nối, không đang typing)
    const hasText = this.messageInput.value.trim().length > 0; // Loại bỏ khoảng trắng đầu/cuối chuỗi
    this.sendButton.disabled = !hasText || this.isTyping || !this.isConnected; // Vô hiệu hóa nút gửi khi không thỏa điều kiện
  } // Kết thúc block code

  async sendMessage() {
    // Bắt đầu block code
    const message = this.messageInput.value.trim(); // Loại bỏ khoảng trắng đầu/cuối chuỗi
    if (!message || this.isTyping || !this.isConnected) return;

    // Thêm tin nhắn của user
    this.addMessage(message, "user"); // Thêm tin nhắn user vào giao diện
    this.messageInput.value = ""; // Xóa nội dung input sau khi gửi
    this.adjustTextareaHeight();
    this.toggleSendButton();

    // Gửi tới server qua WebSocket
    const outgoing = {
      // Bắt đầu block code
      content: message,
      timestamp: new Date().toISOString(), // Lấy timestamp ISO format
      messageId: ++this.messageSeq, // Tăng sequence number cho tin nhắn mới
    }; // Kết thúc block code

    try {
      // Bắt đầu block code
      this.socket.emit("user_message", outgoing, (ack) => {
        // Gửi event "user_message" qua WebSocket
        if (ack && ack.ok) {
          // Bắt đầu block code
          this.debugLogLine(`✅ ACK message #${ack.messageId}`, "ok"); // Bắt đầu block code
        } else {
          // Bắt đầu block code
          this.debugLogLine("❌ Server không xác nhận tin nhắn", "err");
        } // Kết thúc block code
      }); // Kết thúc block code
      this.debugLogLine(`📤 Sent #${outgoing.messageId}: ${message}`); // Bắt đầu block code
    } catch (error) {
      // Bắt đầu block code
      this.debugLogLine(`Lỗi gửi tin: ${error.message}`, "err"); // Bắt đầu block code
    } // Kết thúc block code
  } // Kết thúc block code
  // ===== WebSocket (Socket.IO) =====
  async connectSocket() {
    // Bắt đầu block code
    return new Promise((resolve, reject) => {
      // Bắt đầu block code
      try {
        // Bắt đầu block code
        if (this.socket && this.socket.connected) {
          // Bắt đầu block code
          this.isConnected = true;
          this.toggleSendButton();
          return resolve();
        } // Kết thúc block code

        console.log(`🔌 Attempting to connect to: ${this.serverUrl}`); // Bắt đầu block code
        this.debugLogLine(`Connecting to: ${this.serverUrl}`); // Bắt đầu block code

        this.socket = io(this.serverUrl, {
          // Khởi tạo Socket.IO connection
          transports: ["websocket"], // Chỉ sử dụng WebSocket transport
          timeout: 5000, // Timeout kết nối 5 giây
          forceNew: true, // Buộc tạo connection mới
          upgrade: true,
          secure: true, // Force secure connection for HTTPS // Sử dụng kết nối bảo mật (WSS)
        }); // Kết thúc block code

        this.setupSocketEvents(resolve, reject);
      } catch (err) {
        // Bắt đầu block code
        reject(err);
      } // Kết thúc block code
    }); // Kết thúc block code
  } // Kết thúc block code

  setupSocketEvents(resolve, reject) {
    // Đăng ký các event handler cho Socket.IO events
    this.socket.on("connect", () => {
      // Event handler khi kết nối thành công
      this.isConnected = true;
      this.toggleSendButton();
      this.debugSocket.textContent = this.socket.id; // ID duy nhất của socket connection
      this.debugServer.textContent = this.serverUrl; // Gán nội dung text cho element
      this.debugLogLine(`Connected. Socket ID: ${this.socket.id}`, "ok"); // ID duy nhất của socket connection

      // Handshake
      this.socket.emit("client_handshake", {
        // Gửi event "client_handshake" qua WebSocket
        clientDate: new Date().toISOString(), // Lấy timestamp ISO format
        userAgent: navigator.userAgent, // Thông tin trình duyệt client
        sessionId: this.socket.id, // ID duy nhất của socket connection
      }); // Kết thúc block code

      if (resolve) resolve();
    }); // Kết thúc block code

    this.socket.on("disconnect", (reason) => {
      // Event handler khi mất kết nối
      this.isConnected = false; // Trạng thái kết nối WebSocket (false = chưa kết nối)
      this.toggleSendButton();
      this.debugSocket.textContent = "-"; // Gán nội dung text cho element
      this.debugLogLine(`Disconnected: ${reason}`, "err"); // Bắt đầu block code
    }); // Kết thúc block code

    this.socket.on("connect_error", (error) => {
      // Event handler khi có lỗi kết nối
      this.isConnected = false; // Trạng thái kết nối WebSocket (false = chưa kết nối)
      this.toggleSendButton();
      this.debugLogLine(`Connect error: ${error.message}`, "err"); // Bắt đầu block code
      if (reject) reject(error);
    }); // Kết thúc block code

    // Handshake response → load history
    this.socket.on("handshake_response", (data) => {
      // Bắt đầu block code
      if (data?.success) {
        // Bắt đầu block code
        this.debugLogLine(`Handshake OK: ${data.message || "success"}`, "ok"); // Bắt đầu block code
        const list = Array.isArray(data.chatHistory) ? data.chatHistory : []; // Kiểm tra có phải mảng không
        if (list.length > 0) {
          // Bắt đầu block code
          list.forEach((m) => {
            // Lặp qua từng phần tử trong mảng
            const role =
              m.type === "assistant"
                ? "assistant"
                : m.type === "user"
                ? "user"
                : "system";
            this.addMessage(m.content, role);
          }); // Kết thúc block code
          this.debugLogLine(`Loaded history: ${list.length} messages`); // Bắt đầu block code
        } // Kết thúc block code
      } else {
        // Bắt đầu block code
        this.debugLogLine(`Handshake lỗi: ${data?.error || "Unknown"}`, "err"); // Bắt đầu block code
      } // Kết thúc block code
    }); // Kết thúc block code

    // Confirmations & status
    this.socket.on("message_confirmed", (data) => {
      // Bắt đầu block code
      this.debugLogLine(`✅ Confirmed #${data?.messageId ?? "?"}`, "ok"); // Bắt đầu block code
    }); // Kết thúc block code

    this.socket.on("message_logged", (data) => {
      // Bắt đầu block code
      this.debugLogLine(`📝 Logged: ${data?.type || "unknown"}`); // Bắt đầu block code
    }); // Kết thúc block code

    this.socket.on("connection_status", (data) => {
      // Bắt đầu block code
      if (data?.message) this.debugLogLine(`📡 ${data.message}`); // Bắt đầu block code
    }); // Kết thúc block code

    // Assistant streaming events
    this.socket.on("assistant_stream_start", (data) => {
      // Bắt đầu block code
      this.debugLogLine(
        `🎬 Stream started for message #${data.messageId}`, // Bắt đầu block code
        "ok"
      );
      // Create streaming message element
      this.currentStreamingMessage = this.createStreamingMessage();
      this.currentStreamingMessageId = data.messageId;
    }); // Kết thúc block code

    this.socket.on("assistant_chunk", (data) => {
      // Bắt đầu block code
      if (!data || !this.currentStreamingMessage) return;

      this.debugLogLine(`📦 Chunk #${data.chunkIndex}: "${data.content}"`); // Bắt đầu block code
      this.updateStreamingMessage(this.currentStreamingMessage, data.content);
    }); // Kết thúc block code

    this.socket.on("assistant_stream_complete", (data) => {
      // Bắt đầu block code
      if (!data || !this.currentStreamingMessage) return;

      this.debugLogLine(
        `✅ Stream completed: ${data.metadata?.character_count} chars in ${data.metadata?.chunk_count} chunks`, // Bắt đầu block code
        "ok"
      );
      this.finalizeStreamingMessage(this.currentStreamingMessage);
      this.currentStreamingMessage = null; // Tham chiếu đến tin nhắn đang streaming từ assistant
      this.currentStreamingMessageId = null; // ID của tin nhắn đang streaming
    }); // Kết thúc block code

    this.socket.on("assistant_stream_error", (data) => {
      // Bắt đầu block code
      this.debugLogLine(`❌ Stream error: ${data.error}`, "err"); // Bắt đầu block code
      if (this.currentStreamingMessage) {
        // Bắt đầu block code
        this.removeStreamingMessage(this.currentStreamingMessage);
        this.currentStreamingMessage = null; // Tham chiếu đến tin nhắn đang streaming từ assistant
        this.currentStreamingMessageId = null; // ID của tin nhắn đang streaming
      } // Kết thúc block code
    }); // Kết thúc block code

    // Legacy assistant message (fallback)
    this.socket.on("assistant_message", (data) => {
      // Bắt đầu block code
      if (!data) return;
      const content = data.content ?? "";
      this.addMessage(content, "assistant");
    }); // Kết thúc block code
  } // Kết thúc block code

  addMessage(content, sender) {
    // Thêm tin nhắn mới vào giao diện chat
    const messageDiv = document.createElement("div"); // Tạo element HTML mới: <div>
    messageDiv.className = `message ${sender}`; // Gán CSS class cho element

    const contentDiv = document.createElement("div"); // Tạo element HTML mới: <div>
    contentDiv.className = "message-content"; // Gán CSS class cho element

    if (sender === "system") {
      // Bắt đầu block code
      contentDiv.innerHTML = `<strong>Hệ thống:</strong> ${this.escapeHtml(
        // Bắt đầu block code
        content
      )}`; // Kết thúc block code
    } else {
      // Bắt đầu block code
      contentDiv.textContent = content; // Gán nội dung text cho element
    } // Kết thúc block code

    const timeDiv = document.createElement("div"); // Tạo element HTML mới: <div>
    timeDiv.className = "message-time"; // Gán CSS class cho element
    timeDiv.textContent = new Date().toLocaleTimeString("vi-VN"); // Lấy thời gian hiện tại theo format Việt Nam

    messageDiv.appendChild(contentDiv); // Thêm element con vào element cha
    messageDiv.appendChild(timeDiv); // Thêm element con vào element cha
    this.chatMessages.appendChild(messageDiv); // Thêm element con vào element cha

    this.scrollToBottom();
  } // Kết thúc block code

  addSystemMessage(content) {
    // Thêm tin nhắn hệ thống vào debug log
    // Không đẩy vào chat nữa; hiển thị ở debug panel
    this.debugLogLine(content);
  } // Kết thúc block code

  createStreamingMessage() {
    // Tạo element tin nhắn với streaming cursor cho assistant response
    const messageDiv = document.createElement("div"); // Tạo element HTML mới: <div>
    messageDiv.className = "message assistant streaming"; // Gán CSS class cho element

    const contentDiv = document.createElement("div"); // Tạo element HTML mới: <div>
    contentDiv.className = "message-content"; // Gán CSS class cho element
    // Tách phần text và cursor để tránh bị ghi đè khi cập nhật
    const textSpan = document.createElement("span"); // Tạo element HTML mới: <span>
    textSpan.className = "streaming-text"; // Gán CSS class cho element
    textSpan.textContent = ""; // Gán nội dung text cho element

    // Thêm cursor nhấp nháy để hiển thị đang gõ
    const cursor = document.createElement("span"); // Tạo element HTML mới: <span>
    cursor.className = "streaming-cursor"; // Gán CSS class cho element
    cursor.textContent = "▋"; // Gán nội dung text cho element
    contentDiv.appendChild(textSpan); // Thêm element con vào element cha
    contentDiv.appendChild(cursor); // Thêm element con vào element cha

    const timeDiv = document.createElement("div"); // Tạo element HTML mới: <div>
    timeDiv.className = "message-time"; // Gán CSS class cho element
    timeDiv.textContent = new Date().toLocaleTimeString("vi-VN"); // Lấy thời gian hiện tại theo format Việt Nam

    messageDiv.appendChild(contentDiv); // Thêm element con vào element cha
    messageDiv.appendChild(timeDiv); // Thêm element con vào element cha
    this.chatMessages.appendChild(messageDiv); // Thêm element con vào element cha

    this.scrollToBottom();
    return messageDiv;
  } // Kết thúc block code

  updateStreamingMessage(messageElement, content) {
    // Cập nhật nội dung tin nhắn streaming khi nhận chunk mới
    const contentDiv = messageElement.querySelector(".message-content");
    const textSpan = contentDiv.querySelector(".streaming-text");
    if (!textSpan) {
      // Bắt đầu block code
      // Fallback để không bị mất cursor
      const fallback = document.createElement("span"); // Tạo element HTML mới: <span>
      fallback.className = "streaming-text"; // Gán CSS class cho element
      contentDiv.insertBefore(
        fallback,
        contentDiv.querySelector(".streaming-cursor")
      );
      fallback.textContent = ""; // Gán nội dung text cho element
    } // Kết thúc block code
    const target = contentDiv.querySelector(".streaming-text");
    // Ghép nối chunk mới vào cuối
    target.textContent += content;

    this.scrollToBottom();
  } // Kết thúc block code

  finalizeStreamingMessage(messageElement) {
    // Hoàn thiện tin nhắn streaming (xóa cursor, update time)
    // Xóa cursor và class streaming
    const contentDiv = messageElement.querySelector(".message-content");
    const cursor = contentDiv.querySelector(".streaming-cursor");
    if (cursor) {
      // Bắt đầu block code
      cursor.remove(); // Xóa element khỏi DOM
    } // Kết thúc block code

    messageElement.classList.remove("streaming");

    // Cập nhật timestamp
    const timeDiv = messageElement.querySelector(".message-time");
    timeDiv.textContent = new Date().toLocaleTimeString("vi-VN"); // Lấy thời gian hiện tại theo format Việt Nam
  } // Kết thúc block code

  removeStreamingMessage(messageElement) {
    // Xóa tin nhắn streaming khi có lỗi
    if (messageElement && messageElement.parentNode) {
      // Bắt đầu block code
      messageElement.parentNode.removeChild(messageElement); // Xóa element con khỏi element cha
    } // Kết thúc block code
  } // Kết thúc block code

  scrollToBottom() {
    // Cuộn chat container xuống tin nhắn mới nhất
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight; // Cuộn chat container xuống cuối
  } // Kết thúc block code

  escapeHtml(text) {
    // Escape HTML characters để tránh XSS
    const div = document.createElement("div"); // Tạo element HTML mới: <div>
    div.textContent = text; // Gán nội dung text cho element
    return div.innerHTML; // Lấy HTML đã escape
  } // Kết thúc block code

  // ===== Debug helpers =====
  debugLogLine(text, level = "") {
    // Thêm dòng log mới vào debug panel với timestamp
    if (!this.debugLog) return;
    const line = document.createElement("div"); // Tạo element HTML mới: <div>
    line.className = `line ${level}`.trim(); // Loại bỏ khoảng trắng đầu/cuối chuỗi
    const ts = document.createElement("span"); // Tạo element HTML mới: <span>
    ts.className = "ts"; // Gán CSS class cho element
    ts.textContent = `[${new Date().toLocaleTimeString("vi-VN")}]`; // Lấy thời gian hiện tại theo format Việt Nam
    const msg = document.createElement("span"); // Tạo element HTML mới: <span>
    msg.textContent = ` ${text}`; // Gán nội dung text cho element
    line.appendChild(ts); // Thêm element con vào element cha
    line.appendChild(msg); // Thêm element con vào element cha
    this.debugLog.appendChild(line); // Thêm element con vào element cha
    this.debugLog.scrollTop = this.debugLog.scrollHeight;
    this.debugLast.textContent = new Date().toLocaleTimeString("vi-VN"); // Lấy thời gian hiện tại theo format Việt Nam
  } // Kết thúc block code
} // Kết thúc block code

// Khởi tạo ứng dụng khi trang web được tải
document.addEventListener("DOMContentLoaded", () => {
  // Đăng ký event listener cho sự kiện DOMContentLoaded
  new ChatApp(); // Tạo instance mới của ChatApp để khởi động ứng dụng
}); // Kết thúc block code
