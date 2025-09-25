import React, { useState, useEffect } from "react";
import { useSocket } from "../../contexts/SocketContext";
import ConnectionStatus from "./ConnectionStatus";
import "./Header.css";

const Header: React.FC = () => {
  const [apiUrl, setApiUrl] = useState("192.168.1.3:1234");
  const [isEditing, setIsEditing] = useState(false);
  const { connect, testConnection, connectionStatus } = useSocket();

  // Load saved API URL on mount
  useEffect(() => {
    const savedUrl = localStorage.getItem("life_api_url");
    if (savedUrl) {
      console.log("📱 Loading saved API URL:", savedUrl);
      setApiUrl(savedUrl.replace("http://", "").replace("https://", ""));
    }
  }, []);

  const handleApiUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiUrl(e.target.value);
  };

  const handleApiUrlSubmit = () => {
    if (apiUrl.trim()) {
      const formattedUrl = apiUrl.startsWith("http")
        ? apiUrl
        : `http://${apiUrl}`;

      console.log("💾 Saving API URL:", formattedUrl);
      localStorage.setItem("life_api_url", formattedUrl);
      setIsEditing(false);

      // Test connection with new URL
      console.log("🔄 Testing connection with new URL");
      testConnection();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleApiUrlSubmit();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      // Reset to previous value
      const savedUrl = localStorage.getItem("life_api_url");
      if (savedUrl) {
        setApiUrl(savedUrl.replace("http://", ""));
      }
    }
  };

  const handleTestConnection = () => {
    testConnection();
  };

  return (
    <header className="header">
      <div className="header-content">
        {/* Left side - API Configuration */}
        <div className="api-config">
          <label htmlFor="api-url-input" className="api-label">
            Địa chỉ LM Studio:
          </label>

          {isEditing ? (
            <div className="api-input-container">
              <input
                id="api-url-input"
                type="text"
                value={apiUrl}
                onChange={handleApiUrlChange}
                onKeyDown={handleKeyPress}
                onBlur={handleApiUrlSubmit}
                placeholder="192.168.1.3:1234"
                className="api-input"
                autoFocus
              />
              <div className="input-hint">Enter để lưu, Escape để hủy</div>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="api-display"
              title="Click để chỉnh sửa"
            >
              {apiUrl}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                  fill="currentColor"
                />
              </svg>
            </button>
          )}

          <button
            onClick={handleTestConnection}
            disabled={connectionStatus === "checking"}
            className="test-connection-btn"
          >
            {connectionStatus === "checking"
              ? "Đang kiểm tra..."
              : "Kiểm tra kết nối"}
          </button>
        </div>

        {/* Center - Project Title */}
        <div className="project-title">
          <h1>Project L.I.F.E</h1>
          <span className="subtitle">
            Living Intelligence Framework Environment
          </span>
        </div>

        {/* Right side - Connection Status */}
        <div className="status-section">
          <ConnectionStatus status={connectionStatus} />
        </div>
      </div>
    </header>
  );
};

export default Header;
