import React, { useEffect } from "react";
import { SocketProvider } from "./contexts/SocketContext";
import { ChatProvider } from "./contexts/ChatContext";
import Header from "./components/UI/Header";
import ChatContainer from "./components/Chat/ChatContainer";
import "./App.css";

const App: React.FC = () => {
  useEffect(() => {
    // Load saved API URL from localStorage
    const savedApiUrl = localStorage.getItem("life_api_url");
    if (savedApiUrl) {
      console.log("Loaded saved API URL:", savedApiUrl);
    }

    // Set page title
    document.title = "Project L.I.F.E - Chat Interface";
  }, []);

  return (
    <div className="App">
      <SocketProvider>
        <ChatProvider>
          <div className="app-container">
            <Header />
            <main className="main-content">
              <ChatContainer />
            </main>
          </div>
        </ChatProvider>
      </SocketProvider>
    </div>
  );
};

export default App;
