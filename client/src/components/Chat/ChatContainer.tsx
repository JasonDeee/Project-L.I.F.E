import React, { useEffect, useRef } from "react";
import { useChat } from "../../contexts/ChatContext";
import ChatMessage from "./ChatMessage";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";
import "./ChatContainer.css";

const ChatContainer: React.FC = () => {
  const { state } = useChat();
  const { messages, isLoading, error } = state;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle scroll behavior
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.target as HTMLDivElement;
    const isAtBottom =
      element.scrollHeight - element.scrollTop === element.clientHeight;

    // Add shadow when not at bottom for visual feedback
    if (isAtBottom) {
      element.classList.remove("has-scroll-shadow");
    } else {
      element.classList.add("has-scroll-shadow");
    }
  };

  const renderMessages = () => {
    return messages.map((message) => (
      <ChatMessage key={message.id} message={message} isStreaming={false} />
    ));
  };

  const renderTypingIndicator = () => {
    if (!isLoading) return null;

    return <TypingIndicator assistant="wendy" />;
  };

  const renderError = () => {
    if (!error) return null;

    return (
      <div className="chat-error">
        <div className="error-content">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          <span>{error}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="chat-container">
      {/* Messages Area */}
      <div className="chat-messages" onScroll={handleScroll}>
        <div className="messages-content">
          {renderMessages()}
          {renderTypingIndicator()}
          {renderError()}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <MessageInput />
    </div>
  );
};

export default ChatContainer;
