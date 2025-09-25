import React from "react";
import { Message } from "../../types";
import { formatTimestamp, formatResponseTime } from "../../utils/messageUtils";
import { ASSISTANTS } from "../../utils/constants";
import "./ChatMessage.css";

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isStreaming = false,
}) => {
  const getMessageClass = () => {
    let className = "message";

    if (message.type === "user") {
      className += " user";
    } else if (message.type === "assistant") {
      className += " assistant";
    } else if (message.type === "system") {
      className += " system-message";
    }

    if (isStreaming) {
      className += " streaming";
    }

    return className;
  };

  const getAssistantDisplayName = () => {
    if (message.assistant === "wendy") {
      return ASSISTANTS.WENDY.displayName;
    } else if (message.assistant === "jason") {
      return ASSISTANTS.JASON.displayName;
    }
    return "Assistant";
  };

  const renderMessageContent = () => {
    if (message.type === "system") {
      return (
        <div className="message-content">
          <strong>Hệ thống:</strong> {message.content}
        </div>
      );
    }

    if (message.type === "assistant" && message.assistant) {
      return (
        <div className="message-content">
          <div className="assistant-header">
            <span className={`assistant-name ${message.assistant}`}>
              {getAssistantDisplayName()}
            </span>
            {message.metadata?.response_time_ms && (
              <span className="response-time">
                {formatResponseTime(message.metadata.response_time_ms)}
              </span>
            )}
          </div>
          <div className="assistant-content">
            {message.content}
            {isStreaming && <span className="streaming-cursor">▋</span>}
          </div>
        </div>
      );
    }

    return <div className="message-content">{message.content}</div>;
  };

  const renderMetadata = () => {
    if (message.type === "system") {
      return null;
    }

    return (
      <div className="message-time">
        {formatTimestamp(message.timestamp)}
        {message.metadata?.tokens_used && (
          <span className="token-count">
            {message.metadata.tokens_used} tokens
          </span>
        )}
      </div>
    );
  };

  return (
    <div className={getMessageClass()}>
      {renderMessageContent()}
      {renderMetadata()}
    </div>
  );
};

export default ChatMessage;

