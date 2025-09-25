import React from "react";
import { ASSISTANTS } from "../../utils/constants";
import "./TypingIndicator.css";

interface TypingIndicatorProps {
  assistant: "wendy" | "jason";
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ assistant }) => {
  const assistantInfo =
    assistant === "wendy" ? ASSISTANTS.WENDY : ASSISTANTS.JASON;

  return (
    <div className="message assistant typing-message">
      <div className="message-content">
        <div className="assistant-header">
          <span className={`assistant-name ${assistant}`}>
            {assistantInfo.displayName}
          </span>
          <span className="typing-status">đang gõ...</span>
        </div>
        <div className="typing-indicator">
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;

