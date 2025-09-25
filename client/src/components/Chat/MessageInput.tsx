import React, { useState, useRef, useEffect } from "react";
import { validateMessage } from "../../utils/messageUtils";
import { useChat } from "../../contexts/ChatContext";
import { useSocket } from "../../contexts/SocketContext";
import "./MessageInput.css";

const MessageInput: React.FC = () => {
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { sendMessage, isTyping } = useChat();
  const { isConnected } = useSocket();

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const trimmedMessage = message.trim();

    // Validate message
    const validation = validateMessage(trimmedMessage);
    if (!validation.isValid) {
      setError(validation.error || "Tin nhắn không hợp lệ");
      return;
    }

    // Check connection
    if (!isConnected) {
      setError("Không có kết nối đến server");
      return;
    }

    // Check if already typing
    if (isTyping) {
      setError("Đang chờ phản hồi từ assistant...");
      return;
    }

    // Send message
    try {
      sendMessage(trimmedMessage);
      setMessage("");
      setError(null);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (err) {
      setError("Không thể gửi tin nhắn");
      console.error("Error sending message:", err);
    }
  };

  const isDisabled = !isConnected || isTyping || !message.trim();

  return (
    <div className="chat-input-container">
      <div className={`input-wrapper ${error ? "error" : ""}`}>
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={
            !isConnected
              ? "Không có kết nối..."
              : isTyping
              ? "Đang chờ phản hồi..."
              : "Nhập tin nhắn của bạn..."
          }
          disabled={!isConnected}
          rows={1}
          maxLength={4000}
          className="message-input"
        />

        <button
          onClick={handleSubmit}
          disabled={isDisabled}
          className="send-button"
          title={
            !isConnected
              ? "Không có kết nối"
              : isTyping
              ? "Đang chờ phản hồi"
              : "Gửi tin nhắn (Enter)"
          }
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor" />
          </svg>
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="input-footer">
        <span className="character-count">{message.length}/4000</span>
        <span className="input-hint">
          Enter để gửi, Shift+Enter để xuống dòng
        </span>
      </div>
    </div>
  );
};

export default MessageInput;

