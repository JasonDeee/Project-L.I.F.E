# Project L.I.F.E - Dual Assistant Chat System

## 📋 Tổng quan dự án

**Tên dự án:** L.I.F.E (Living Intelligence Framework Environment)  
**Loại:** Node.js Realtime Chat System với Dual AI Assistants  
**Mục tiêu:** Tạo hệ thống chat thông minh với 2 AI assistants hoạt động song song, có khả năng lưu trữ và quản lý lịch sử vô hạn

## 🤖 Kiến trúc AI Assistants

### WENDY (Primary Assistant - Fast Response)

- **Đặc điểm:** LLM nhỏ, tốc độ phản hồi cực nhanh
- **Vai trò:** Trợ lý chính, xử lý mọi câu hỏi mặc định
- **Tính năng:** Quick answers, casual conversation, immediate response
- **Trigger:** Mọi tin nhắn của user (default behavior)
- **Escalation:** Có thể gọi JASON hỗ trợ khi cần

### JASON (Secondary Assistant - Deep Reasoning)

- **Đặc điểm:** LLM lớn hơn, khả năng suy luận cao
- **Vai trò:** Chuyên gia tư vấn, xử lý logic phức tạp
- **Tính năng:** Deep reasoning, complex analysis, detailed solutions
- **Trigger:**
  - Direct mention (@Jason, "Jason...")
  - WENDY escalation request
  - Complex reasoning needed
- **Behavior:** Slower but more thorough responses

## 🏗️ Kiến trúc hệ thống

### SERVER (Personal Computer)

- **Vai trò:** Máy chủ chính lưu trữ và xử lý
- **Chức năng:**
  - Quản lý realtime chat
  - Lưu trữ lịch sử theo ngày
  - Xử lý compression/summarization
  - API gateway cho các LLM tools

### ROOM CHAT Features

- **Realtime messaging:** WebSocket/Socket.io
- **Infinite chat history:** Tự động nén lịch sử cũ bằng summarization
- **Dual assistant mode:** 2 AI hoạt động đồng thời
- **Smart routing:** Phân chia công việc giữa WENDY và JASON

## 🛠️ Technology Stack (Dự kiến)

### Backend

- **Node.js + Express:** Main server framework
- **Socket.io:** Realtime communication
- **File System:** Structured data storage
- **LM Studio Integration:** Local LLM connections

### Frontend

- **React 18+:** Main UI framework (migrated from HTML/CSS/JS)
- **Socket.io-client:** WebSocket client for realtime updates
- **Context API:** State management
- **Responsive Design:** Cross-device support
- **Streaming UI:** Real-time response rendering

### AI/LLM Tools

- **LM Studio:** Primary LLM hosting
- **Summarization Service:** Chat compression
- **Task Management:** Checklist & todo features
- **Data Retrieval:** Server history access

## 📁 Cấu trúc lưu trữ dữ liệu

```
/data
  /chat-history
    /2024
      /01-january
        /01-01-2024.json
        /01-02-2024.json
      /02-february
        ...
  /summaries
    /2024-01-summary.json
  /user-preferences
    /settings.json
```

## 🎯 Tính năng core

1. **Dual Assistant Chat:** WENDY + JASON hoạt động song song
2. **Realtime Communication:** Instant messaging
3. **Infinite History:** Smart compression system
4. **Daily Storage:** Organized by date structure
5. **LLM Tool Integration:** Specialized services
6. **Task Management:** Built-in productivity tools
7. **Smart Routing:** Intelligent request distribution

## 🚀 Roadmap Implementation

### Phase 1: Foundation

- [ ] Node.js server setup + Express + Socket.io
- [ ] React application creation
- [ ] WebSocket connection (Client ↔ Server)
- [ ] File storage structure setup
- [ ] WENDY service integration

### Phase 2: Core Features

- [ ] Chat history management (JSON files)
- [ ] Daily storage rotation
- [ ] Streaming response UI
- [ ] Message persistence
- [ ] React chat interface completion

### Phase 3: JASON Integration

- [ ] JASON service implementation
- [ ] Dual assistant logic (@mention system)
- [ ] WENDY → JASON escalation mechanism
- [ ] Advanced assistant coordination

### Phase 4: Advanced Features

- [ ] Chat summarization system
- [ ] Task management tools
- [ ] Advanced LLM integrations
- [ ] Performance optimization
- [ ] UI/UX enhancements

---

**Ngày khởi tạo:** 25/09/2024  
**Trạng thái:** Planning Complete - Ready for Development  
**Tech Stack:** Node.js + React + Socket.io + JSON Storage  
**Môi trường phát triển:** Windows 10, VS Code, LM Studio
