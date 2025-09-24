class ChatApp {
  constructor() {
    this.apiUrl = "http://192.168.1.3:1234";
    this.conversationHistory = [];
    this.isConnected = false;
    this.isTyping = false;

    this.initializeElements();
    this.bindEvents();
    this.checkConnection();
  }

  initializeElements() {
    this.ipInput = document.getElementById("ip-input");
    this.testConnectionBtn = document.getElementById("test-connection");
    this.connectionStatus = document.getElementById("connection-status");
    this.chatMessages = document.getElementById("chat-messages");
    this.messageInput = document.getElementById("message-input");
    this.sendButton = document.getElementById("send-button");
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
  }

  updateApiUrl() {
    const ipValue = this.ipInput.value.trim();
    if (ipValue) {
      this.apiUrl = ipValue.startsWith("http") ? ipValue : `http://${ipValue}`;
    }
  }

  async checkConnection() {
    this.updateConnectionStatus("checking");
    this.testConnectionBtn.disabled = true;
    this.testConnectionBtn.textContent = "Đang kiểm tra...";

    try {
      const response = await fetch(`${this.apiUrl}/v1/models`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(5000), // 5 giây timeout
      });

      if (response.ok) {
        const data = await response.json();
        this.isConnected = true;
        this.updateConnectionStatus("connected");
        this.addSystemMessage(
          `Kết nối thành công! Tìm thấy ${data.data?.length || 0} model.`
        );
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      this.isConnected = false;
      this.updateConnectionStatus("disconnected");
      this.addSystemMessage(`Lỗi kết nối: ${error.message}`);
    } finally {
      this.testConnectionBtn.disabled = false;
      this.testConnectionBtn.textContent = "Kiểm tra kết nối";
    }
  }

  updateConnectionStatus(status) {
    this.connectionStatus.className = `status-indicator ${status}`;

    switch (status) {
      case "connected":
        this.connectionStatus.title = "Đã kết nối";
        break;
      case "disconnected":
        this.connectionStatus.title = "Mất kết nối";
        break;
      case "checking":
        this.connectionStatus.title = "Đang kiểm tra...";
        break;
    }
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

    // Thêm tin nhắn vào lịch sử hội thoại
    this.conversationHistory.push({
      role: "user",
      content: message,
    });

    // Tạo tin nhắn trống cho assistant để stream vào
    const assistantMessageElement = this.createStreamingMessage();

    try {
      await this.callStreamingAPI(assistantMessageElement);
    } catch (error) {
      this.removeStreamingMessage(assistantMessageElement);

      // Nếu streaming không hoạt động, thử gọi API thông thường
      if (
        error.message.includes("streaming") ||
        error.message.includes("parse")
      ) {
        console.warn("Streaming failed, falling back to regular API:", error);
        try {
          await this.callRegularAPI();
        } catch (fallbackError) {
          this.addMessage(`Lỗi: ${fallbackError.message}`, "system");
          console.error("Fallback API Error:", fallbackError);
        }
      } else {
        this.addMessage(`Lỗi: ${error.message}`, "system");
        console.error("API Error:", error);
      }
    }
  }

  async callStreamingAPI(messageElement) {
    this.isTyping = true;
    this.toggleSendButton();

    const requestBody = {
      model: "local-model", // LM Studio thường dùng tên này
      messages: [
        {
          role: "system",
          content:
            "Bạn là một trợ lý AI hữu ích. Hãy trả lời bằng tiếng Việt một cách thân thiện và chính xác.",
        },
        ...this.conversationHistory,
      ],
      temperature: 0.7,
      max_tokens: 2000,
      stream: true, // Enable streaming
    };

    const response = await fetch(`${this.apiUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(60000), // 60 giây timeout cho streaming
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          const trimmedLine = line.trim();

          if (trimmedLine === "" || trimmedLine === "data: [DONE]") {
            continue;
          }

          if (trimmedLine.startsWith("data: ")) {
            try {
              const jsonStr = trimmedLine.slice(6); // Remove 'data: ' prefix
              const data = JSON.parse(jsonStr);

              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                this.updateStreamingMessage(messageElement, fullContent);
              }
            } catch (parseError) {
              console.warn("Failed to parse streaming chunk:", parseError);
            }
          }
        }
      }

      // Thêm phản hồi hoàn chỉnh vào lịch sử hội thoại
      this.conversationHistory.push({
        role: "assistant",
        content: fullContent || "Xin lỗi, tôi không thể trả lời câu hỏi này.",
      });

      // Cập nhật timestamp cho tin nhắn cuối cùng
      this.finalizeStreamingMessage(messageElement);
    } catch (error) {
      throw error;
    } finally {
      this.isTyping = false;
      this.toggleSendButton();
      reader.releaseLock();
    }
  }

  async callRegularAPI() {
    this.isTyping = true;
    this.toggleSendButton();

    try {
      const requestBody = {
        model: "local-model", // LM Studio thường dùng tên này
        messages: [
          {
            role: "system",
            content:
              "Bạn là một trợ lý AI hữu ích. Hãy trả lời bằng tiếng Việt một cách thân thiện và chính xác.",
          },
          ...this.conversationHistory,
        ],
        temperature: 0.7,
        max_tokens: 2000,
        stream: false, // Disable streaming for fallback
      };

      const response = await fetch(`${this.apiUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30000), // 30 giây timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const assistantMessage =
        data.choices?.[0]?.message?.content ||
        "Xin lỗi, tôi không thể trả lời câu hỏi này.";

      this.conversationHistory.push({
        role: "assistant",
        content: assistantMessage,
      });

      this.addMessage(assistantMessage, "assistant");
    } finally {
      this.isTyping = false;
      this.toggleSendButton();
    }
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
    this.addMessage(content, "system");
  }

  createStreamingMessage() {
    const messageDiv = document.createElement("div");
    messageDiv.className = "message assistant streaming";

    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";
    contentDiv.textContent = "";

    // Thêm cursor nhấp nháy để hiển thị đang gõ
    const cursor = document.createElement("span");
    cursor.className = "streaming-cursor";
    cursor.textContent = "▋";
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
    const cursor = contentDiv.querySelector(".streaming-cursor");

    // Xóa nội dung cũ và thêm nội dung mới
    contentDiv.textContent = content;

    // Thêm lại cursor
    contentDiv.appendChild(cursor);

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
}

// Khởi tạo ứng dụng khi trang web được tải
document.addEventListener("DOMContentLoaded", () => {
  new ChatApp();
});
