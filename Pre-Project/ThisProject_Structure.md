# This Project Structure - Project L.I.F.E

## 🏗️ Tổng quan cấu trúc dự án

```
Project-L.I.F.E/
├── 📁 client/                    # React Frontend Application
├── 📁 server/                    # Node.js Backend Server
├── 📁 data/                      # JSON Data Storage
├── 📁 docs/                      # Documentation & Planning
├── 📁 scripts/                   # Automation & Build Scripts
├── 📁 tests/                     # Testing Suites
├── 📁 configs/                   # Configuration Files
├── 📄 README.md                  # Project Overview
├── 📄 package.json               # Root Package Configuration
├── 📄 .gitignore                 # Git Ignore Rules
└── 📄 docker-compose.yml         # Container Orchestration (Future)
```

---

## 🖥️ CLIENT Structure (React Frontend)

```
client/
├── 📁 public/
│   ├── index.html
│   ├── favicon.ico
│   └── manifest.json
├── 📁 src/
│   ├── 📁 components/            # Reusable UI Components
│   │   ├── 📁 Chat/
│   │   │   ├── ChatContainer.jsx
│   │   │   ├── ChatMessage.jsx
│   │   │   ├── MessageInput.jsx
│   │   │   ├── TypingIndicator.jsx
│   │   │   └── StreamingMessage.jsx
│   │   ├── 📁 Assistants/
│   │   │   ├── WendyAvatar.jsx
│   │   │   ├── JasonAvatar.jsx
│   │   │   └── AssistantSelector.jsx
│   │   ├── 📁 UI/
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Settings.jsx
│   │   │   └── ConnectionStatus.jsx
│   │   └── 📁 Common/
│   │       ├── LoadingSpinner.jsx
│   │       ├── ErrorBoundary.jsx
│   │       └── Toast.jsx
│   ├── 📁 pages/                 # Page Components
│   │   ├── ChatPage.jsx
│   │   ├── SettingsPage.jsx
│   │   └── HistoryPage.jsx
│   ├── 📁 contexts/              # React Context
│   │   ├── ChatContext.js
│   │   ├── SocketContext.js
│   │   ├── AssistantContext.js
│   │   └── SettingsContext.js
│   ├── 📁 hooks/                 # Custom React Hooks
│   │   ├── useSocket.js
│   │   ├── useChat.js
│   │   ├── useAssistant.js
│   │   └── useLocalStorage.js
│   ├── 📁 services/              # API & External Services
│   │   ├── socketService.js
│   │   ├── apiService.js
│   │   └── storageService.js
│   ├── 📁 utils/                 # Utility Functions
│   │   ├── messageFormatter.js
│   │   ├── dateUtils.js
│   │   ├── validationUtils.js
│   │   └── constants.js
│   ├── 📁 styles/                # CSS & Styling
│   │   ├── 📁 components/
│   │   ├── globals.css
│   │   ├── variables.css
│   │   └── themes.css
│   ├── App.jsx                   # Main App Component
│   ├── index.js                  # React Entry Point
│   └── setupTests.js             # Test Configuration
├── 📄 package.json               # Frontend Dependencies
├── 📄 .env                       # Environment Variables
└── 📄 vite.config.js             # Build Configuration (if using Vite)
```

---

## 🖧 SERVER Structure (Node.js Backend)

```
server/
├── 📁 src/                       # Source Code
│   ├── 📁 controllers/           # Request Controllers
│   │   ├── chatController.js
│   │   ├── assistantController.js
│   │   ├── historyController.js
│   │   └── settingsController.js
│   ├── 📁 services/              # Business Logic Services
│   │   ├── 📁 assistants/
│   │   │   ├── wendyService.js
│   │   │   ├── jasonService.js
│   │   │   └── assistantManager.js
│   │   ├── 📁 llm/
│   │   │   ├── lmStudioClient.js
│   │   │   ├── streamHandler.js
│   │   │   └── modelManager.js
│   │   ├── 📁 storage/
│   │   │   ├── fileManager.js
│   │   │   ├── chatHistoryService.js
│   │   │   ├── summaryService.js
│   │   │   └── backupService.js
│   │   └── 📁 utils/
│   │       ├── messageRouter.js
│   │       ├── compressionService.js
│   │       └── validationService.js
│   ├── 📁 middleware/             # Express Middleware
│   │   ├── authMiddleware.js
│   │   ├── rateLimitMiddleware.js
│   │   ├── validationMiddleware.js
│   │   └── errorMiddleware.js
│   ├── 📁 routes/                # API Routes
│   │   ├── chatRoutes.js
│   │   ├── assistantRoutes.js
│   │   ├── historyRoutes.js
│   │   └── settingsRoutes.js
│   ├── 📁 socket/                # WebSocket Handlers
│   │   ├── socketHandler.js
│   │   ├── chatSocketHandler.js
│   │   ├── assistantSocketHandler.js
│   │   └── systemSocketHandler.js
│   ├── 📁 config/                # Configuration
│   │   ├── database.js
│   │   ├── llmConfig.js
│   │   ├── socketConfig.js
│   │   └── serverConfig.js
│   ├── 📁 schemas/               # Data Validation Schemas
│   │   ├── messageSchema.js
│   │   ├── assistantSchema.js
│   │   └── settingsSchema.js
│   └── 📁 types/                 # TypeScript Types (if used)
│       ├── messageTypes.js
│       ├── assistantTypes.js
│       └── socketTypes.js
├── 📁 data/                      # Data Storage (as per FileSystem doc)
│   ├── 📁 chat-history/
│   ├── 📁 summaries/
│   ├── 📁 assistant-logs/
│   ├── 📁 user-settings/
│   ├── 📁 system-logs/
│   └── 📁 backups/
├── 📁 logs/                      # Application Logs
│   ├── server.log
│   ├── error.log
│   ├── assistant.log
│   └── socket.log
├── 📁 temp/                      # Temporary Files
│   ├── uploads/
│   └── processing/
├── app.js                        # Express App Setup
├── server.js                     # Server Entry Point
├── 📄 package.json               # Backend Dependencies
├── 📄 .env                       # Environment Variables
└── 📄 nodemon.json               # Development Configuration
```

---

## 📚 DOCS Structure (Documentation)

```
docs/
├── 📁 Pre-Project/               # Planning Documents
│   ├── Architecture.md
│   ├── CheckList_&_Progress_&_Future.md
│   ├── SERVER_FileSystem_Structure.md
│   └── ThisProject_Structure.md
├── 📁 api/                       # API Documentation
│   ├── endpoints.md
│   ├── websocket-events.md
│   └── schemas.md
├── 📁 development/               # Development Guides
│   ├── setup-guide.md
│   ├── coding-standards.md
│   ├── testing-guide.md
│   └── deployment-guide.md
├── 📁 user/                      # User Documentation
│   ├── user-manual.md
│   ├── features.md
│   └── troubleshooting.md
├── 📁 assets/                    # Documentation Assets
│   ├── 📁 images/
│   ├── 📁 diagrams/
│   └── 📁 screenshots/
├── README.md                     # Main Documentation
└── CHANGELOG.md                  # Version History
```

---

## 🧪 TESTS Structure (Testing Suites)

```
tests/
├── 📁 unit/                      # Unit Tests
│   ├── 📁 client/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   └── 📁 server/
│       ├── controllers/
│       ├── services/
│       └── utils/
├── 📁 integration/               # Integration Tests
│   ├── api-tests/
│   ├── socket-tests/
│   └── assistant-tests/
├── 📁 e2e/                       # End-to-End Tests
│   ├── chat-flow.test.js
│   ├── assistant-interaction.test.js
│   └── history-management.test.js
├── 📁 performance/               # Performance Tests
│   ├── load-tests/
│   └── stress-tests/
├── 📁 fixtures/                  # Test Data
│   ├── sample-messages.json
│   ├── mock-responses.json
│   └── test-configurations.json
├── 📄 jest.config.js             # Test Configuration
└── 📄 test-setup.js              # Test Setup
```

---

## ⚙️ CONFIGS Structure (Configuration Files)

```
configs/
├── 📁 environments/              # Environment Configs
│   ├── development.json
│   ├── production.json
│   └── testing.json
├── 📁 llm/                       # LLM Configurations
│   ├── wendy-config.json
│   ├── jason-config.json
│   └── model-endpoints.json
├── 📁 deployment/                # Deployment Configs
│   ├── docker/
│   ├── nginx/
│   └── pm2/
├── eslint.config.js              # Linting Rules
├── prettier.config.js            # Code Formatting
└── webpack.config.js             # Build Configuration
```

---

## 🔧 SCRIPTS Structure (Automation Scripts)

```
scripts/
├── 📁 build/                     # Build Scripts
│   ├── build-client.js
│   ├── build-server.js
│   └── build-all.js
├── 📁 deploy/                    # Deployment Scripts
│   ├── deploy-dev.js
│   ├── deploy-prod.js
│   └── rollback.js
├── 📁 maintenance/               # Maintenance Scripts
│   ├── backup-data.js
│   ├── cleanup-logs.js
│   ├── compress-history.js
│   └── health-check.js
├── 📁 development/               # Development Helpers
│   ├── start-dev.js
│   ├── reset-data.js
│   └── seed-data.js
└── 📄 package.json               # Scripts Package Info
```

---

## 🗄️ Root Level Files

### Package.json (Root)

```json
{
  "name": "project-life",
  "version": "1.0.0",
  "description": "Living Intelligence Framework Environment",
  "main": "server/server.js",
  "scripts": {
    "dev": "concurrently \"npm run server:dev\" \"npm run client:dev\"",
    "server:dev": "cd server && npm run dev",
    "client:dev": "cd client && npm start",
    "build": "npm run client:build && npm run server:build",
    "start": "cd server && npm start",
    "test": "npm run test:server && npm run test:client",
    "test:server": "cd server && npm test",
    "test:client": "cd client && npm test"
  },
  "workspaces": ["client", "server"],
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

### .gitignore

```
# Dependencies
node_modules/
*/node_modules/

# Production builds
build/
dist/

# Environment variables
.env
.env.local
.env.production

# Data files (except samples)
/data/chat-history/
/data/summaries/
/data/backups/
!/data/samples/

# Logs
logs/
*.log

# Temporary files
temp/
tmp/

# IDE files
.vscode/settings.json
.idea/

# OS files
.DS_Store
Thumbs.db

# Testing
coverage/
```

---

## 📊 Estimated File Counts & Sizes

### Development Phase Estimates

```
📁 client/                   ~45-60 files    (~2-5MB)
📁 server/                   ~35-50 files    (~1-3MB)
📁 docs/                     ~15-25 files    (~500KB-1MB)
📁 tests/                    ~25-40 files    (~500KB-2MB)
📁 configs/                  ~10-15 files    (~100-200KB)
📁 scripts/                  ~10-15 files    (~200-500KB)
📁 data/ (empty initially)   ~5-10 files     (~10-50KB)

Total Development:          ~145-215 files   (~4-12MB)
```

### Production Estimates (After 1 year)

```
📁 data/                     ~400-800 files  (~4-8GB)
📁 logs/                     ~50-100 files   (~100-500MB)
📁 backups/                  ~50-100 files   (~2-4GB)

Total Production:           ~645-1115 files  (~6-13GB)
```

---

## 🚀 Development Workflow

### Initial Setup Commands

```bash
# 1. Clone/Setup project
git clone <repo> Project-L.I.F.E
cd Project-L.I.F.E

# 2. Install root dependencies
npm install

# 3. Setup client
cd client
npm install
cd ..

# 4. Setup server
cd server
npm install
cd ..

# 5. Create data directories
npm run setup:data

# 6. Start development
npm run dev
```

### Daily Development Flow

```bash
# Start development servers
npm run dev

# Run tests
npm run test

# Build for production
npm run build

# Deploy
npm run deploy:dev
```

---

## 🔄 Maintenance & Scaling

### Regular Maintenance Tasks

- **Daily:** Log rotation, backup verification
- **Weekly:** Data compression, cleanup temp files
- **Monthly:** Archive old data, update dependencies
- **Quarterly:** Performance analysis, security audit

### Scaling Considerations

- **Horizontal:** Multiple server instances
- **Vertical:** Increase server resources
- **Data:** Database migration if JSON becomes insufficient
- **Caching:** Redis for frequently accessed data
- **CDN:** Static asset delivery optimization

