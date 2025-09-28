let socket = null;
let messageId = 0;

function updateStatus(status, message) {
  const statusEl = document.getElementById("status");
  statusEl.className = `status ${status}`;
  statusEl.textContent = message;
  document.getElementById("lastActivity").textContent =
    new Date().toLocaleTimeString();
}

function formatTime(ts) {
  return (ts ? new Date(ts) : new Date()).toLocaleTimeString();
}

function renderBubble(role, text, ts) {
  const messagesEl = document.getElementById("messages");
  const wrapper = document.createElement("div");
  // role: 'user' | 'assistant' | 'system'
  wrapper.className = `message ${role === "system" ? "system-message" : role}`;

  const bubble = document.createElement("div");
  bubble.className = "message-content";
  bubble.textContent = text;

  const time = document.createElement("div");
  time.className = "message-time";
  time.textContent = formatTime(ts);

  wrapper.appendChild(bubble);
  wrapper.appendChild(time);
  messagesEl.appendChild(wrapper);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function connect() {
  if (socket && socket.connected) {
    addMessage("system", "Already connected!");
    return;
  }

  updateStatus("connecting", "🔄 Connecting...");
  addMessage("system", "Connecting to server...");

  socket = io("http://localhost:8000", {
    transports: ["websocket"],
    timeout: 5000,
    forceNew: true,
  });

  // Connection events
  socket.on("connect", () => {
    updateStatus("connected", "✅ Connected");
    renderBubble("system", `Connected! Socket ID: ${socket.id}`);
    document.getElementById("socketId").textContent = socket.id;

    // Enable controls
    document.getElementById("connectBtn").disabled = true;
    document.getElementById("disconnectBtn").disabled = false;
    document.getElementById("testBtn").disabled = false;
    document.getElementById("sendBtn").disabled = false;
    document.getElementById("messageInput").disabled = false;
  });

  socket.on("disconnect", (reason) => {
    updateStatus("disconnected", "❌ Disconnected");
    renderBubble("system", `Disconnected: ${reason}`);
    document.getElementById("socketId").textContent = "-";

    // Disable controls
    document.getElementById("connectBtn").disabled = false;
    document.getElementById("disconnectBtn").disabled = true;
    document.getElementById("testBtn").disabled = true;
    document.getElementById("sendBtn").disabled = true;
    document.getElementById("messageInput").disabled = true;
  });

  socket.on("connect_error", (error) => {
    updateStatus("disconnected", "❌ Connection Error");
    renderBubble("system", `Connection error: ${error.message}`);
  });

  // Handshake events
  socket.on("handshake_response", (data) => {
    renderBubble("system", `Handshake: ${data.message}`);
    if (data.success) {
      renderBubble("system", `Server date: ${data.serverDate}`);
      const count = data.chatHistory?.length || 0;
      renderBubble("system", `Chat history: ${count} messages`);
      // Render history as assistant/user bubbles if present
      if (count > 0) {
        data.chatHistory.forEach((msg) => {
          const role =
            msg.type === "assistant"
              ? "assistant"
              : msg.type === "user"
              ? "user"
              : "system";
          renderBubble(role, msg.content, msg.timestamp);
        });
      }
    } else {
      renderBubble("system", `Handshake failed: ${data.error}`);
    }
  });

  // Message events
  socket.on("message_confirmed", (data) => {
    renderBubble("system", `✅ Message confirmed: ${data.messageId}`);
  });

  socket.on("message_logged", (data) => {
    renderBubble("system", `📝 Message logged: ${data.type}`);
  });

  socket.on("assistant_message", (data) => {
    // Expecting shape: { content, timestamp? }
    renderBubble("assistant", data.content, data.timestamp);
  });

  socket.on("error", (data) => {
    renderBubble("system", `❌ Server error: ${data.message}`);
  });

  socket.on("connection_status", (data) => {
    renderBubble("system", `📡 ${data.message}`);
  });

  // Start handshake
  socket.emit("client_handshake", {
    clientDate: new Date().toISOString(),
    userAgent: navigator.userAgent,
    sessionId: socket.id || "pending",
  });
}

function disconnect() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

function testConnection() {
  if (socket && socket.connected) {
    socket.emit("connection_test");
    addMessage("system", "Testing connection...");
  }
}

function sendMessage() {
  const input = document.getElementById("messageInput");
  const message = input.value.trim();

  if (!message) {
    renderBubble("system", "Please enter a message");
    return;
  }

  if (!socket || !socket.connected) {
    renderBubble("system", "Not connected to server");
    return;
  }

  const messageData = {
    content: message,
    timestamp: new Date().toISOString(),
    messageId: ++messageId,
  };

  renderBubble("user", message);
  input.value = "";

  // Send with acknowledgment
  socket.emit("user_message", messageData, (ack) => {
    if (ack && ack.ok) {
      renderBubble("system", `✅ Server acknowledged message ${ack.messageId}`);
    } else {
      renderBubble("system", "❌ Server did not acknowledge message");
    }
  });

  renderBubble("system", `📤 Sending message ${messageId}...`);
}

function clearMessages() {
  document.getElementById("messages").innerHTML = "";
}

// Enter key to send message
document.getElementById("messageInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});

// Auto-connect on page load
window.addEventListener("load", () => {
  renderBubble("system", "Page loaded. Click Connect to start.");
});
