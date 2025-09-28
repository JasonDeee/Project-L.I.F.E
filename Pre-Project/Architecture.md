# Architecture - Project L.I.F.E

## 🏗️ Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────┐
│                  CLIENT (HTML/JS)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Chat UI     │  │ Socket.IO   │  │ Chat Logic  │     │
│  │ (HTML/CSS)  │  │ Client      │  │ (Vanilla JS)│     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
                              │
                    WebSocket Connection
                              │
┌─────────────────────────────────────────────────────────┐
│                  SERVER (Node.js)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Express     │  │ Socket.io   │  │ File System │     │
│  │ Server      │  │ WebSocket   │  │ Manager     │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                              │                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ WENDY       │  │ JASON       │  │ LLM Tools   │     │
│  │ Service     │  │ Service     │  │ & Services  │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
                              │
                    HTTP/WebSocket APIs
                              │
┌─────────────────────────────────────────────────────────┐
│                 LM STUDIO SERVERS                       │
│  ┌─────────────┐              ┌─────────────┐           │
│  │ WENDY LLM   │              │ JASON LLM   │           │
│  │ (Fast/Small)│              │ (Smart/Big) │           │
│  │ Port: 1234  │              │ Port: 1235  │           │
│  └─────────────┘              └─────────────┘           │
└─────────────────────────────────────────────────────────┘
```

## 🎭 Assistant Behavior Model

### WENDY (Primary Assistant)

```javascript
Role: "Default responder, quick and friendly"
Trigger: "Any user message by default"
Characteristics:
- Fast response time
- Casual conversation
- Basic questions
- Can call JASON for help
```

### JASON (Secondary Assistant)

```javascript
Role: "Deep thinker, reasoning expert"
Trigger:
- Direct mention: "@Jason" or "Jason, ..."
- WENDY escalation: "Let me ask Jason about this..."
- Complex reasoning needed
Characteristics:
- Detailed analysis
- Problem solving
- Technical expertise
- Slower but thorough
```

## 📁 Data Storage Architecture

### File System Structure

```
/server
  /data
    /chat-history
      /2024
        /09-september
          /25-09-2024.json        # Daily chat logs
          /26-09-2024.json
        /10-october
          /01-10-2024.json
    /summaries
      /2024-09-summary.json       # Monthly summaries
    /user-settings
      /preferences.json           # User configurations
    /assistant-logs
      /wendy-activity.json        # Assistant-specific logs
      /jason-activity.json
```

### JSON Schema Examples

#### Daily Chat Log Format

```json
{
  "date": "2024-09-25",
  "messages": [
    {
      "id": "msg_001",
      "timestamp": "2024-09-25T10:30:00Z",
      "type": "user",
      "content": "Hello there!",
      "metadata": {}
    },
    {
      "id": "msg_002",
      "timestamp": "2024-09-25T10:30:02Z",
      "type": "assistant",
      "assistant": "wendy",
      "content": "Hi! How can I help you today?",
      "metadata": {
        "response_time": "2.1s",
        "tokens": 45
      }
    }
  ],
  "summary": "Brief conversation about...",
  "assistant_activity": {
    "wendy_messages": 15,
    "jason_messages": 3,
    "total_tokens": 2840
  }
}
```

## 🔄 Communication Flow

### Standard Flow (WENDY)

```
User Message → WebSocket → Server → WENDY Service → LM Studio → Response → WebSocket → Client
```

### Escalation Flow (JASON)

```
User "@Jason" → Server → JASON Service → LM Studio → Response → WebSocket → Client
```

### WENDY → JASON Handoff

```
User Question → WENDY → "I need Jason's help" → JASON Service → Combined Response → Client
```

## 🛠️ Technology Stack Details

### Frontend (HTML/JS)

```
- Vanilla HTML/CSS/JavaScript
- Socket.io-client (WebSocket)
- Modern CSS (Flexbox, Grid)
- Simple state management (class-based)
```

### Backend (Node.js)

```
- Express.js (HTTP server)
- Socket.io (WebSocket server)
- File System APIs (fs/promises)
- LM Studio HTTP clients
```

### Development Tools

```
- Nodemon (auto-restart)
- Concurrently (run both servers)
- ESLint + Prettier
- WebSocket debugging tools
```

## 🔒 Security & Performance

### Security Considerations

- Input sanitization
- Rate limiting
- File path validation
- Error handling

### Performance Optimization

- Message batching
- File compression
- Memory management
- Connection pooling

## 🚀 Deployment Strategy

### Phase 1: Development

```
- Local HTML client (file:// or simple server)
- Local Node.js server (port 8000)
- Local LM Studio instances
```

### Phase 2: Production Ready

```
- Docker containers
- Environment configurations
- Process management (PM2)
- Logging & monitoring
```
