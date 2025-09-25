# Project L.I.F.E - React Client

## 🚀 Overview

React frontend application cho Project L.I.F.E (Living Intelligence Framework Environment) - một hệ thống chat với dual AI assistants.

## 🏗️ Architecture

### Components Structure

```
src/
├── components/
│   ├── Chat/              # Chat related components
│   │   ├── ChatContainer.tsx    # Main chat container
│   │   ├── ChatMessage.tsx      # Individual message component
│   │   ├── MessageInput.tsx     # Message input component
│   │   └── TypingIndicator.tsx  # Typing animation
│   ├── UI/               # UI components
│   │   ├── Header.tsx           # App header with API config
│   │   └── ConnectionStatus.tsx # Connection status indicator
│   └── Common/           # Shared components
│       └── ErrorBoundary.tsx    # Error boundary wrapper
├── contexts/             # React contexts
│   ├── ChatContext.tsx          # Chat state management
│   └── SocketContext.tsx        # WebSocket management
├── types/               # TypeScript definitions
├── utils/               # Utility functions
└── styles/              # CSS styles
```

## 🤖 AI Assistants

### WENDY (Primary Assistant)

- **Role**: Fast response, default handler
- **Characteristics**: Quick answers, casual conversation
- **Trigger**: All messages by default

### JASON (Secondary Assistant)

- **Role**: Deep reasoning, complex analysis
- **Characteristics**: Detailed responses, problem solving
- **Trigger**: Direct mention (@Jason) or WENDY escalation

## 🔌 Features

### Real-time Communication

- **WebSocket**: Socket.io client for real-time messaging
- **Streaming**: Live response streaming from AI
- **Connection Management**: Auto-reconnect and status tracking

### Chat Interface

- **Message Types**: User, Assistant, System messages
- **Typing Indicators**: Visual feedback when AI is responding
- **Message History**: Persistent chat history
- **Responsive Design**: Mobile-friendly interface

### Assistant Integration

- **Dual Assistant**: WENDY and JASON working together
- **Smart Routing**: Automatic message routing to appropriate assistant
- **Escalation**: WENDY can call JASON for complex queries

## 🛠️ Development

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

### Environment Configuration

Create `.env` file:

```env
REACT_APP_WEBSOCKET_URL=http://localhost:8000
REACT_APP_API_URL=http://192.168.1.3:1234
```

## 📡 API Integration

### WebSocket Events

#### Client → Server

- `user_message`: Send user message
- `connection_test`: Test server connection
- `typing_start/stop`: Typing indicators

#### Server → Client

- `assistant_message`: Receive AI response
- `assistant_typing`: AI typing notification
- `connection_status`: Connection updates
- `error`: Error notifications

### Streaming Response

```typescript
// Streaming events
socket.on("streaming_start", (data) => {
  // Start streaming UI
});

socket.on("streaming_chunk", (data) => {
  // Update message content
});

socket.on("streaming_complete", () => {
  // Finalize message
});
```

## 🎨 Styling

### CSS Architecture

- **Component Styles**: Each component has its own CSS file
- **Global Styles**: App.css for global styles
- **Responsive Design**: Mobile-first approach
- **Dark Theme**: System preference support

### Design System

- **Colors**: Blue gradient primary theme
- **Typography**: Segoe UI font family
- **Animations**: Smooth transitions and fade effects
- **Accessibility**: WCAG 2.1 compliant

## 🔄 State Management

### Context Providers

```tsx
<SocketProvider>
  <ChatProvider>
    <App />
  </ChatProvider>
</SocketProvider>
```

### Chat State

- Messages array
- Typing indicators
- Streaming message state
- Error handling

### Socket State

- Connection status
- WebSocket instance
- Connection management

## 🧪 Testing Strategy

### Unit Tests

- Component rendering
- State management
- Utility functions

### Integration Tests

- WebSocket communication
- Context providers
- User interactions

### E2E Tests

- Full chat flow
- Assistant interactions
- Error scenarios

## 📱 Responsive Design

### Breakpoints

- Desktop: 1024px+
- Tablet: 768px - 1023px
- Mobile: < 768px

### Mobile Optimizations

- Touch-friendly interfaces
- Optimized scrolling
- Condensed layouts
- Swipe gestures

## ♿ Accessibility

### Features

- Keyboard navigation
- Screen reader support
- High contrast mode
- Reduced motion support

### Standards

- WCAG 2.1 AA compliance
- Semantic HTML
- ARIA labels
- Focus management

## 🚀 Deployment

### Build Process

```bash
npm run build
```

### Static Hosting

- Optimized for static hosting
- Service worker support
- Progressive Web App features

## 🔧 Configuration

### Available Scripts

- `npm start`: Development server
- `npm build`: Production build
- `npm test`: Run tests
- `npm eject`: Eject from CRA

### Build Configuration

- TypeScript support
- CSS modules
- Code splitting
- Tree shaking

## 📋 TODO

### Immediate

- [ ] Add message search
- [ ] Implement message reactions
- [ ] Add file upload support
- [ ] Create settings panel

### Future

- [ ] PWA features
- [ ] Offline support
- [ ] Voice input
- [ ] Multi-language support

## 🐛 Known Issues

1. **WebSocket Reconnection**: May need manual refresh in some cases
2. **Mobile Keyboard**: Input height adjustment on iOS
3. **Streaming Performance**: Large responses may cause lag

## 📞 Support

- **Issues**: GitHub Issues
- **Documentation**: `/docs` folder
- **Examples**: `/examples` folder

---

**Built with**: React 18, TypeScript, Socket.io-client  
**Last Updated**: September 25, 2024
