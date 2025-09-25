# SERVER File System Structure - Project L.I.F.E

## 📁 Cấu trúc lưu trữ dữ liệu chi tiết

### Root Data Directory

```
/server/data/
├── chat-history/           # Lịch sử chat theo ngày
├── summaries/             # Tóm tắt theo tháng/năm
├── assistant-logs/        # Log hoạt động của assistants
├── user-settings/         # Cài đặt người dùng
├── system-logs/          # Log hệ thống
└── backups/              # Backup tự động
```

## 💬 Chat History Structure

### Yearly → Monthly → Daily Organization

```
/data/chat-history/
├── 2024/
│   ├── 01-january/
│   │   ├── 01-01-2024.json        # Ngày 1/1/2024
│   │   ├── 02-01-2024.json        # Ngày 2/1/2024
│   │   ├── ...
│   │   └── 31-01-2024.json        # Ngày 31/1/2024
│   ├── 02-february/
│   │   ├── 01-02-2024.json
│   │   ├── ...
│   │   └── 29-02-2024.json
│   ├── ...
│   └── 12-december/
├── 2025/
│   ├── 01-january/
│   └── ...
└── README.md                      # Hướng dẫn cấu trúc
```

## 📋 JSON Schema Definitions

### Daily Chat Log Schema

```json
{
  "version": "1.0",
  "date": "2024-09-25",
  "created_at": "2024-09-25T00:00:00Z",
  "last_updated": "2024-09-25T23:59:59Z",
  "messages": [
    {
      "id": "msg_20240925_001",
      "timestamp": "2024-09-25T10:30:00Z",
      "type": "user",
      "content": "Hello WENDY!",
      "metadata": {
        "ip_address": "192.168.1.100",
        "user_agent": "Mozilla/5.0...",
        "session_id": "sess_abc123"
      }
    },
    {
      "id": "msg_20240925_002",
      "timestamp": "2024-09-25T10:30:02Z",
      "type": "assistant",
      "assistant": "wendy",
      "content": "Hi there! How can I help you today?",
      "metadata": {
        "response_time_ms": 2100,
        "tokens_used": 45,
        "model": "wendy-fast-7b",
        "temperature": 0.7,
        "streaming": true
      }
    },
    {
      "id": "msg_20240925_003",
      "timestamp": "2024-09-25T10:35:15Z",
      "type": "assistant",
      "assistant": "jason",
      "content": "Let me provide a deeper analysis...",
      "metadata": {
        "response_time_ms": 8500,
        "tokens_used": 150,
        "model": "jason-reasoning-13b",
        "triggered_by": "wendy_escalation",
        "escalation_reason": "complex_reasoning_needed"
      }
    },
    {
      "id": "msg_20240925_004",
      "timestamp": "2024-09-25T10:40:00Z",
      "type": "system",
      "content": "Chat summarized and compressed",
      "metadata": {
        "action": "auto_summarization",
        "messages_compressed": 50,
        "compression_ratio": "85%"
      }
    }
  ],
  "statistics": {
    "total_messages": 125,
    "user_messages": 45,
    "wendy_messages": 65,
    "jason_messages": 12,
    "system_messages": 3,
    "total_tokens": 15420,
    "conversation_duration_hours": 8.5,
    "peak_activity_hour": "14:00-15:00"
  },
  "daily_summary": {
    "main_topics": ["coding help", "project planning", "technical discussion"],
    "key_decisions": ["chose React for frontend", "decided on JSON storage"],
    "action_items": ["setup Node.js server", "create React app"],
    "mood_analysis": "productive, collaborative",
    "notable_events": ["JASON escalation for architecture discussion"]
  }
}
```

### Monthly Summary Schema

```json
{
  "version": "1.0",
  "month": "2024-09",
  "created_at": "2024-10-01T00:00:00Z",
  "period": {
    "start_date": "2024-09-01",
    "end_date": "2024-09-30",
    "total_days": 30,
    "active_days": 25
  },
  "statistics": {
    "total_messages": 3750,
    "user_messages": 1200,
    "wendy_messages": 2100,
    "jason_messages": 380,
    "system_messages": 70,
    "total_tokens": 425000,
    "average_daily_messages": 125,
    "peak_day": "2024-09-15",
    "most_active_hour": "15:00-16:00"
  },
  "topic_analysis": {
    "main_categories": [
      { "topic": "project_development", "percentage": 45 },
      { "topic": "technical_discussions", "percentage": 30 },
      { "topic": "planning_strategy", "percentage": 15 },
      { "topic": "general_chat", "percentage": 10 }
    ],
    "trending_keywords": ["react", "nodejs", "assistant", "llm", "socket.io"],
    "sentiment_trend": "positive_productive"
  },
  "assistant_performance": {
    "wendy": {
      "response_time_avg_ms": 2300,
      "escalations_to_jason": 45,
      "user_satisfaction": "high",
      "most_handled_topics": ["quick_questions", "casual_chat", "basic_coding"]
    },
    "jason": {
      "response_time_avg_ms": 7800,
      "direct_invocations": 125,
      "escalation_responses": 45,
      "user_satisfaction": "very_high",
      "most_handled_topics": ["complex_reasoning", "architecture", "planning"]
    }
  },
  "key_milestones": [
    "Project L.I.F.E planning completed",
    "Technology stack finalized",
    "Architecture design approved",
    "Development phase initiated"
  ],
  "compressed_conversations": [
    {
      "date_range": "2024-09-01 to 2024-09-07",
      "summary": "Initial project conceptualization and requirements gathering...",
      "key_points": ["dual assistant concept", "realtime chat needs"],
      "original_messages": 420,
      "compression_ratio": "90%"
    }
  ]
}
```

## 🤖 Assistant Activity Logs

### WENDY Activity Log Schema

```json
{
  "assistant": "wendy",
  "date": "2024-09-25",
  "performance_metrics": {
    "total_responses": 65,
    "avg_response_time_ms": 2100,
    "successful_responses": 63,
    "failed_responses": 2,
    "escalations_to_jason": 5,
    "tokens_generated": 8500,
    "uptime_percentage": 99.2
  },
  "interaction_patterns": {
    "most_active_hours": ["09:00-10:00", "14:00-15:00", "19:00-20:00"],
    "common_question_types": ["general_chat", "quick_help", "basic_coding"],
    "escalation_triggers": [
      "complex_logic",
      "architecture_questions",
      "user_mentions_jason"
    ]
  },
  "errors_and_issues": [
    {
      "timestamp": "2024-09-25T15:30:00Z",
      "error_type": "llm_timeout",
      "description": "LM Studio connection timeout",
      "resolution": "automatic_retry_successful",
      "impact": "2_second_delay"
    }
  ]
}
```

### JASON Activity Log Schema

```json
{
  "assistant": "jason",
  "date": "2024-09-25",
  "performance_metrics": {
    "total_responses": 12,
    "avg_response_time_ms": 8500,
    "successful_responses": 12,
    "failed_responses": 0,
    "direct_invocations": 7,
    "wendy_escalations": 5,
    "tokens_generated": 3200,
    "uptime_percentage": 100
  },
  "reasoning_complexity": {
    "simple_analysis": 2,
    "moderate_reasoning": 5,
    "complex_problem_solving": 4,
    "architectural_discussions": 1
  },
  "specialization_areas": [
    "system_architecture",
    "complex_problem_solving",
    "technical_deep_dives",
    "strategic_planning"
  ]
}
```

## ⚙️ User Settings Schema

```json
{
  "user_id": "default_user",
  "preferences": {
    "ui_theme": "dark",
    "notification_settings": {
      "sound_enabled": true,
      "desktop_notifications": false,
      "email_summaries": true
    },
    "assistant_preferences": {
      "default_assistant": "wendy",
      "jason_auto_trigger": true,
      "response_style": "friendly",
      "technical_level": "intermediate"
    },
    "chat_settings": {
      "message_history_limit": 1000,
      "auto_summarization": true,
      "summarization_trigger": "daily",
      "backup_frequency": "weekly"
    }
  },
  "llm_configurations": {
    "wendy": {
      "model_name": "wendy-fast-7b",
      "temperature": 0.7,
      "max_tokens": 500,
      "endpoint": "http://localhost:1234"
    },
    "jason": {
      "model_name": "jason-reasoning-13b",
      "temperature": 0.6,
      "max_tokens": 1000,
      "endpoint": "http://localhost:1235"
    }
  },
  "created_at": "2024-09-25T00:00:00Z",
  "last_updated": "2024-09-25T23:59:59Z"
}
```

## 🔄 Backup and Maintenance

### Automatic Backup Strategy

```
/data/backups/
├── daily/
│   ├── 2024-09-25-backup.tar.gz
│   ├── 2024-09-24-backup.tar.gz
│   └── ... (keep last 7 days)
├── weekly/
│   ├── 2024-W39-backup.tar.gz
│   └── ... (keep last 4 weeks)
├── monthly/
│   ├── 2024-09-backup.tar.gz
│   └── ... (keep last 12 months)
└── maintenance_logs/
    ├── cleanup-2024-09-25.log
    └── compression-2024-09-25.log
```

### File Maintenance Rules

- **Daily files:** Keep for 30 days, then compress to monthly summary
- **Monthly summaries:** Keep for 2 years, then archive
- **Assistant logs:** Keep for 90 days, then summarize
- **System logs:** Keep for 30 days, then rotate
- **Backups:** 7 daily + 4 weekly + 12 monthly + yearly archives

## 📊 Storage Estimation

### Daily Storage Requirements

- **Average daily chat:** ~2-5MB (500-1000 messages)
- **Assistant logs:** ~100-500KB per assistant
- **System logs:** ~50-200KB
- **Total daily:** ~3-6MB

### Monthly Storage Requirements

- **Raw daily files:** ~90-180MB
- **Compressed summaries:** ~5-10MB
- **Backups:** ~100-200MB
- **Total monthly:** ~200-400MB

### Yearly Storage Requirements

- **All chat history:** ~2.4-4.8GB
- **Summaries:** ~60-120MB
- **Backups:** ~1.2-2.4GB
- **Total yearly:** ~4-8GB

## 🔒 Security and Access Control

### File Permissions

```bash
/data/
├── chat-history/     # 755 (rwxr-xr-x)
├── summaries/        # 755 (rwxr-xr-x)
├── assistant-logs/   # 750 (rwxr-x---)
├── user-settings/    # 700 (rwx------)
├── system-logs/      # 750 (rwxr-x---)
└── backups/          # 700 (rwx------)
```

### Data Encryption (Future)

- **At rest:** AES-256 for sensitive files
- **In transit:** TLS 1.3 for API communications
- **Backup:** Encrypted archives with password protection
