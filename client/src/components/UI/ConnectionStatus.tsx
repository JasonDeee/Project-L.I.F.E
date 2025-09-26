import React from "react";
import { ConnectionStatusProps } from "../../types";
import "./ConnectionStatus.css";

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  status,
  onTest,
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case "connected":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        );
      case "checking":
        return (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="spinning"
          >
            <path
              d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z"
              opacity=".25"
            />
            <path d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z" />
          </svg>
        );
      case "disconnected":
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM13 17h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
        );
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "connected":
        return "Kết nối LM Studio";
      case "checking":
        return "Đang kiểm tra...";
      case "handshaking":
        return "Đang đồng bộ với server...";
      case "disconnected":
      default:
        return "Mất kết nối";
    }
  };

  const getStatusClass = () => {
    return `connection-status ${status}`;
  };

  return (
    <div className={getStatusClass()}>
      <div className="status-indicator">{getStatusIcon()}</div>
      <span className="status-text">{getStatusText()}</span>
      {onTest && (
        <button
          onClick={onTest}
          className="status-test-btn"
          disabled={status === "checking"}
          title="Kiểm tra lại kết nối"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 8 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default ConnectionStatus;
