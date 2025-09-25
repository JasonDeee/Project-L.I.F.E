import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Log error to external service here if needed
    // Example: logErrorToService(error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <h1>Oops! Có lỗi xảy ra</h1>
          <p>
            Ứng dụng đã gặp lỗi không mong muốn. Vui lòng thử tải lại trang.
          </p>

          {process.env.NODE_ENV === "development" && this.state.error && (
            <details
              style={{
                marginTop: "20px",
                padding: "10px",
                background: "#f5f5f5",
                borderRadius: "4px",
                textAlign: "left",
                maxWidth: "800px",
              }}
            >
              <summary style={{ cursor: "pointer", marginBottom: "10px" }}>
                Chi tiết lỗi (Development Mode)
              </summary>
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  fontSize: "12px",
                  color: "#d32f2f",
                  overflow: "auto",
                }}
              >
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}

          <button onClick={this.handleReload}>Tải lại trang</button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

