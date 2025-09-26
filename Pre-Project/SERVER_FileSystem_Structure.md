# SERVER File System Structure - Project L.I.F.E

```
Owner chính là user của ứng dụng này!
```

## 📁 Cấu trúc lưu trữ dữ liệu chi tiết

### Config & Setting của Ứng dụng này sẽ lưu trữ trên cloud để tránh mất dữ liệu

Root cloud Directory: https://jasondeee.github.io/Project-L.I.F.E/SERVER_Config/... /

_Thư mục "/SERVER_Config" trong dự án này tự push và back up lên cloud_

```
.../SERVER_Config/
├── path.json #cấu trúc đường dẫn của SERVER
├── Owner_setting.json #cài đặt của ứng dụng
├── Versioning.md #thông tin phiên bản của ứng dụng
├── System_PromtRules.json # quy tắc của Model

```

### Root Data Directory (chính là cấu trúc lưu trong path.json trên cloud)

```

/server/
├── Offline_Config/
│ ├── path.json #cấu trúc đường dẫn của SERVER
│ ├── Owner_setting.json #cài đặt của ứng dụng
│ ├── System_PromtRules.json # quy tắc, cách ứng xử, tính cách của Model LLM
├── chat-history/ # Lịch sử chat theo ngày
├── system-logs/ # Log hệ thống

```

## 💬 Chat History Structure: Dạng "bundle", mõi ngày sẽ là một bundle (chat, summary, assistant-logs, images, etc)

### Yearly → Monthly → Daily Organization

```
/server/chat-history/
├── 2024/
│ ├── 01-january/
│ │ ├── Monthly_summary.json # Tóm tắt theo tháng
│ │ ├── 01.01.2024/ # Ngày 1/1/2024
│ │ ├── ├── img/ # Ảnh được gửi
│ │ ├── ├── ├── [file_name]-[timestamp].jpg # Ảnh được gửi
│ │ ├── ├── ├── [file_name]-[timestamp].json # Các RICH Data về Ảnh được gửi (OCR, Image Recognition, etc)
│ │ ├── ├── ├── ...
│ │ ├── ├── Daily_chat.json # Lịch sử chat
│ │ ├── ├── Daily_summary.json # Tóm tắt theo ngày
│ │ ├── ├── assistant-logs.json # Log hoạt động của assistants, các task đã hoàn thành mỗi ngày
│ │ ├── 02.01.2024/ # Ngày 1/1/2024
│ │ ├── ...
│ ├── 02-january/
│ │ ├── ...
│ ├── ...
│ ├── 12-december/
│ │ ├── ...
│ ├── ...
│ ├── 2025/
│ │ ├── ...
│ ├── ...
│ ├── Yearly_summary.json # Tóm tắt theo năm
```

## 📋 JSON Schema Definitions

### Daily Chat Log Schema `Daily_chat.json`

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
      "timestamp": "2024-09-25T10:30:15Z",
      "type": "user",
      "content": "Here's a screenshot of my error",
      "attachments": [
        {
          "type": "image",
          "filename": "error_screenshot-20240925_103015.jpg",
          "rich_data_file": "error_screenshot-20240925_103015.json",
          "file_size": 245760,
          "mime_type": "image/jpeg"
        }
      ],
      "metadata": {
        "session_id": "sess_abc123",
        "has_attachments": true
      }
    },
    {
      "id": "msg_20240925_004",
      "timestamp": "2024-09-25T10:35:15Z",
      "type": "assistant",
      "assistant": "jason",
      "content": "Let me analyze this error screenshot for you...",
      "metadata": {
        "response_time_ms": 8500,
        "tokens_used": 150,
        "model": "jason-reasoning-13b",
        "triggered_by": "wendy_escalation",
        "escalation_reason": "image_analysis_needed",
        "referenced_attachments": ["error_screenshot-20240925_103015.json"]
      }
    },
    {
      "id": "msg_20240925_005",
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
    "images_shared": 8,
    "total_tokens": 15420,
    "conversation_duration_hours": 8.5,
    "peak_activity_hour": "14:00-15:00"
  }
}
```

### Daily Summary Schema `Daily_summary.json`

```json
{
  "version": "1.0",
  "date": "2024-09-25",
  "created_at": "2024-09-25T23:55:00Z",
  "generation_method": "auto_llm_summarization",
  "source_chat_file": "Daily_chat.json",
  "summary": {
    "overview": "Productive day working on Project L.I.F.E with mobile optimization focus. User uploaded error screenshots which triggered JASON analysis for image processing discussion.",
    "main_topics": [
      {
        "topic": "mobile_optimization",
        "frequency": 15,
        "importance": "high",
        "key_points": [
          "Responsive design implementation",
          "Touch target optimization",
          "iOS Safari zoom prevention"
        ]
      },
      {
        "topic": "error_debugging",
        "frequency": 8,
        "importance": "medium",
        "key_points": [
          "Screenshot analysis",
          "Console error interpretation",
          "Solution implementation"
        ]
      }
    ],
    "decisions_made": [
      {
        "decision": "Use 16px font-size for mobile inputs",
        "reasoning": "Prevents zoom on iOS Safari",
        "timestamp": "2024-09-25T14:30:00Z",
        "participants": ["user", "wendy"]
      },
      {
        "decision": "Implement RICH data for images",
        "reasoning": "Enable OCR and image analysis features",
        "timestamp": "2024-09-25T16:15:00Z",
        "participants": ["user", "jason"]
      }
    ],
    "action_items": [
      {
        "task": "Implement image upload functionality",
        "assignee": "user",
        "priority": "high",
        "due_date": "2024-09-26",
        "status": "pending"
      },
      {
        "task": "Add OCR processing for uploaded images",
        "assignee": "jason",
        "priority": "medium",
        "due_date": "2024-09-27",
        "status": "pending"
      }
    ],
    "mood_analysis": {
      "overall_sentiment": "positive_productive",
      "user_satisfaction": "high",
      "collaboration_quality": "excellent",
      "stress_indicators": ["minor_debugging_frustration"],
      "energy_level": "sustained_high"
    },
    "notable_events": [
      {
        "event": "First image upload and analysis",
        "timestamp": "2024-09-25T10:30:15Z",
        "significance": "milestone",
        "description": "User shared error screenshot, triggering JASON's image analysis capabilities"
      },
      {
        "event": "Mobile optimization completion",
        "timestamp": "2024-09-25T18:45:00Z",
        "significance": "major_completion",
        "description": "Completed comprehensive mobile responsive design implementation"
      }
    ]
  },
  "assistant_performance": {
    "wendy": {
      "response_count": 65,
      "avg_response_time_ms": 2100,
      "escalations_to_jason": 5,
      "user_satisfaction_score": 4.2,
      "primary_contributions": [
        "quick_responses",
        "initial_guidance",
        "basic_troubleshooting"
      ]
    },
    "jason": {
      "response_count": 12,
      "avg_response_time_ms": 8500,
      "direct_invocations": 7,
      "user_satisfaction_score": 4.8,
      "primary_contributions": [
        "complex_analysis",
        "image_processing",
        "architectural_decisions"
      ]
    }
  },
  "multimedia_summary": {
    "images_processed": 3,
    "ocr_extractions": 2,
    "image_analysis_insights": [
      "Error stack trace identified in screenshot",
      "UI mockup elements recognized",
      "Code snippet extracted from IDE screenshot"
    ]
  },
  "knowledge_gained": [
    "Mobile viewport optimization techniques",
    "iOS Safari-specific behavioral quirks",
    "Image processing integration patterns",
    "Error debugging through visual analysis"
  ],
  "follow_up_needed": [
    "Test mobile optimizations on real devices",
    "Implement automated image processing pipeline",
    "Create image upload UI component"
  ]
}
```

### Monthly Summary Schema `Monthly_summary.json`

```json
{
  "version": "1.0",
  "month": "2024-09",
  "created_at": "2024-10-01T00:00:00Z",
  "generation_method": "auto_aggregation_from_daily_summaries",
  "source_files": [
    "01.09.2024/Daily_summary.json",
    "02.09.2024/Daily_summary.json",
    "..."
  ],
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
    "images_shared": 145,
    "total_tokens": 425000,
    "average_daily_messages": 125,
    "peak_day": "2024-09-15",
    "most_active_hour": "15:00-16:00"
  },
  "topic_analysis": {
    "main_categories": [
      {
        "topic": "project_development",
        "percentage": 45,
        "trend": "increasing"
      },
      { "topic": "technical_discussions", "percentage": 30, "trend": "stable" },
      { "topic": "planning_strategy", "percentage": 15, "trend": "decreasing" },
      { "topic": "general_chat", "percentage": 10, "trend": "stable" }
    ],
    "trending_keywords": [
      "react",
      "nodejs",
      "assistant",
      "llm",
      "socket.io",
      "mobile",
      "responsive"
    ],
    "sentiment_trend": "positive_productive",
    "emerging_topics": [
      "image_processing",
      "mobile_optimization",
      "OCR_integration"
    ]
  },
  "assistant_performance": {
    "wendy": {
      "response_time_avg_ms": 2300,
      "escalations_to_jason": 45,
      "user_satisfaction_avg": 4.2,
      "most_handled_topics": ["quick_questions", "casual_chat", "basic_coding"],
      "improvement_areas": ["complex_reasoning", "image_analysis"]
    },
    "jason": {
      "response_time_avg_ms": 7800,
      "direct_invocations": 125,
      "escalation_responses": 45,
      "user_satisfaction_avg": 4.8,
      "most_handled_topics": [
        "complex_reasoning",
        "architecture",
        "planning",
        "image_analysis"
      ],
      "specialization_growth": ["OCR_processing", "visual_debugging"]
    }
  },
  "key_milestones": [
    {
      "milestone": "Project L.I.F.E planning completed",
      "date": "2024-09-05",
      "significance": "foundation"
    },
    {
      "milestone": "Technology stack finalized",
      "date": "2024-09-12",
      "significance": "technical"
    },
    {
      "milestone": "Mobile optimization completed",
      "date": "2024-09-25",
      "significance": "user_experience"
    },
    {
      "milestone": "Image processing integration",
      "date": "2024-09-28",
      "significance": "feature_expansion"
    }
  ],
  "multimedia_insights": {
    "total_images_processed": 145,
    "ocr_success_rate": 92,
    "common_image_types": [
      "screenshots",
      "diagrams",
      "code_snippets",
      "ui_mockups"
    ],
    "image_analysis_value": "high",
    "automation_opportunities": [
      "batch_ocr",
      "auto_categorization",
      "duplicate_detection"
    ]
  },
  "knowledge_evolution": {
    "new_concepts_learned": 23,
    "skills_developed": [
      "mobile_development",
      "responsive_design",
      "image_processing"
    ],
    "problem_solving_patterns": ["visual_debugging", "iterative_optimization"],
    "collaboration_improvements": [
      "faster_escalation",
      "better_context_sharing"
    ]
  },
  "compressed_conversations": [
    {
      "date_range": "2024-09-01 to 2024-09-07",
      "summary": "Initial project conceptualization and requirements gathering. Established dual assistant architecture and technical foundation.",
      "key_points": [
        "dual assistant concept",
        "realtime chat needs",
        "file structure planning"
      ],
      "original_messages": 420,
      "compression_ratio": "90%"
    },
    {
      "date_range": "2024-09-15 to 2024-09-21",
      "summary": "React frontend development and direct API integration. Solved connection issues and implemented streaming.",
      "key_points": [
        "React implementation",
        "API debugging",
        "streaming responses"
      ],
      "original_messages": 680,
      "compression_ratio": "88%"
    },
    {
      "date_range": "2024-09-22 to 2024-09-30",
      "summary": "Mobile optimization focus and image processing integration. Comprehensive responsive design implementation.",
      "key_points": [
        "mobile responsive design",
        "touch optimization",
        "image upload features"
      ],
      "original_messages": 890,
      "compression_ratio": "85%"
    }
  ]
}
```

### Yearly Summary Schema `Yearly_summary.json`

```json
{
  "version": "1.0",
  "year": 2024,
  "created_at": "2025-01-01T00:00:00Z",
  "generation_method": "comprehensive_analysis_from_monthly_summaries",
  "source_files": [
    "01-january/Monthly_summary.json",
    "02-february/Monthly_summary.json",
    "..."
  ],
  "period": {
    "start_date": "2024-01-01",
    "end_date": "2024-12-31",
    "total_days": 366,
    "active_days": 298
  },
  "annual_statistics": {
    "total_messages": 45000,
    "user_messages": 15000,
    "wendy_messages": 22500,
    "jason_messages": 6000,
    "system_messages": 1500,
    "images_shared": 1250,
    "total_tokens": 5500000,
    "average_monthly_messages": 3750,
    "peak_month": "2024-09",
    "productivity_score": 8.7
  },
  "yearly_evolution": {
    "project_phases": [
      {
        "phase": "Conceptualization",
        "period": "Q1 2024",
        "focus": "Planning and architecture design",
        "completion": "100%"
      },
      {
        "phase": "Foundation Development",
        "period": "Q2 2024",
        "focus": "Core infrastructure and basic features",
        "completion": "100%"
      },
      {
        "phase": "Feature Expansion",
        "period": "Q3 2024",
        "focus": "Mobile optimization and multimedia integration",
        "completion": "100%"
      },
      {
        "phase": "Advanced Features",
        "period": "Q4 2024",
        "focus": "AI enhancement and automation",
        "completion": "85%"
      }
    ],
    "skill_progression": {
      "technical_skills": [
        "React",
        "Node.js",
        "Socket.io",
        "Mobile Optimization",
        "Image Processing",
        "AI Integration"
      ],
      "soft_skills": [
        "Project Management",
        "Problem Solving",
        "Collaboration",
        "Documentation"
      ],
      "domain_expertise": [
        "Full-stack Development",
        "Real-time Communication",
        "Responsive Design",
        "AI-Assistant Interaction"
      ]
    },
    "assistant_evolution": {
      "wendy": {
        "initial_capabilities": ["basic_chat", "quick_responses"],
        "final_capabilities": [
          "context_awareness",
          "escalation_intelligence",
          "multimedia_handling"
        ],
        "performance_improvement": "+45%"
      },
      "jason": {
        "initial_capabilities": ["complex_reasoning", "technical_analysis"],
        "final_capabilities": [
          "image_analysis",
          "architectural_guidance",
          "strategic_planning",
          "OCR_processing"
        ],
        "performance_improvement": "+60%"
      }
    }
  },
  "major_achievements": [
    {
      "achievement": "Project L.I.F.E Complete Architecture",
      "quarter": "Q1",
      "impact": "Foundation for all future development"
    },
    {
      "achievement": "Real-time Chat System",
      "quarter": "Q2",
      "impact": "Core functionality established"
    },
    {
      "achievement": "Mobile-First Responsive Design",
      "quarter": "Q3",
      "impact": "Universal device accessibility"
    },
    {
      "achievement": "Intelligent Image Processing",
      "quarter": "Q3",
      "impact": "Enhanced user interaction capabilities"
    },
    {
      "achievement": "Dual-Assistant Optimization",
      "quarter": "Q4",
      "impact": "Superior AI collaboration model"
    }
  ],
  "technology_adoption": {
    "frontend": {
      "primary": "React 18 + TypeScript",
      "styling": "CSS Modules + Responsive Design",
      "state_management": "Context API",
      "performance": "Optimized for mobile"
    },
    "backend": {
      "runtime": "Node.js",
      "real_time": "Socket.io",
      "ai_integration": "Direct LM Studio API",
      "data_storage": "JSON-based file system"
    },
    "ai_models": {
      "wendy": "Fast 7B parameter model",
      "jason": "Reasoning 13B parameter model",
      "capabilities": ["Chat", "Analysis", "OCR", "Image Recognition"]
    }
  },
  "knowledge_repository": {
    "total_concepts_learned": 156,
    "problem_patterns_identified": 78,
    "best_practices_established": 45,
    "reusable_solutions": 89,
    "documentation_quality": "comprehensive"
  },
  "future_roadmap": {
    "immediate_priorities": [
      "Backend server implementation",
      "Advanced image processing",
      "Voice interaction integration"
    ],
    "medium_term_goals": [
      "Multi-user support",
      "Cloud synchronization",
      "Advanced AI model integration"
    ],
    "long_term_vision": [
      "Personal AI ecosystem",
      "Cross-platform availability",
      "Enterprise-grade features"
    ]
  },
  "success_metrics": {
    "user_satisfaction": 4.6,
    "system_reliability": 98.5,
    "response_time_optimization": "+40%",
    "feature_completion_rate": 92,
    "knowledge_retention": "excellent"
  }
}
```

### Image RICH Data Schema `[filename]-[timestamp].json`

```json
{
  "version": "1.0",
  "image_info": {
    "original_filename": "error_screenshot-20240925_103015.jpg",
    "upload_timestamp": "2024-09-25T10:30:15Z",
    "file_size": 245760,
    "mime_type": "image/jpeg",
    "dimensions": {
      "width": 1920,
      "height": 1080
    },
    "hash": "sha256:a1b2c3d4e5f6...",
    "user_session": "sess_abc123"
  },
  "processing_results": {
    "ocr_extraction": {
      "method": "tesseract_v5",
      "confidence": 0.92,
      "language": "eng",
      "text_blocks": [
        {
          "text": "TypeError: Cannot read property 'map' of undefined",
          "confidence": 0.95,
          "bounding_box": {
            "x": 245,
            "y": 156,
            "width": 420,
            "height": 24
          },
          "type": "error_message"
        },
        {
          "text": "at ChatContainer.jsx:42",
          "confidence": 0.89,
          "bounding_box": {
            "x": 245,
            "y": 180,
            "width": 180,
            "height": 18
          },
          "type": "stack_trace"
        }
      ],
      "full_text": "TypeError: Cannot read property 'map' of undefined\nat ChatContainer.jsx:42\nat renderMessages...",
      "processing_time_ms": 1250
    },
    "image_analysis": {
      "method": "computer_vision_api",
      "categories": [
        {
          "name": "code_editor",
          "confidence": 0.97,
          "description": "Screenshot of code editor or IDE"
        },
        {
          "name": "error_console",
          "confidence": 0.93,
          "description": "Browser developer console showing errors"
        }
      ],
      "objects_detected": [
        {
          "object": "browser_window",
          "confidence": 0.95,
          "bounding_box": { "x": 0, "y": 0, "width": 1920, "height": 1080 }
        },
        {
          "object": "console_panel",
          "confidence": 0.91,
          "bounding_box": { "x": 200, "y": 120, "width": 1500, "height": 400 }
        },
        {
          "object": "error_text",
          "confidence": 0.88,
          "bounding_box": { "x": 245, "y": 156, "width": 420, "height": 24 }
        }
      ],
      "colors": {
        "dominant": ["#1e1e1e", "#ff6b6b", "#ffffff"],
        "background": "#1e1e1e",
        "error_highlight": "#ff6b6b"
      },
      "processing_time_ms": 850
    },
    "metadata_extraction": {
      "browser_info": {
        "detected": true,
        "browser": "Chrome",
        "version": "estimated_118+",
        "dev_tools_open": true
      },
      "code_context": {
        "framework": "React",
        "filename": "ChatContainer.jsx",
        "line_number": 42,
        "error_type": "TypeError",
        "likely_cause": "undefined_array_access"
      },
      "ui_elements": {
        "window_type": "developer_console",
        "theme": "dark",
        "layout": "horizontal_split"
      }
    }
  },
  "ai_insights": {
    "error_analysis": {
      "severity": "medium",
      "category": "runtime_error",
      "likely_fixes": [
        "Add null/undefined check before .map()",
        "Initialize empty array as default",
        "Add optional chaining operator (?.)"
      ],
      "related_concepts": [
        "array_methods",
        "null_safety",
        "defensive_programming"
      ]
    },
    "context_understanding": {
      "scenario": "User debugging React component",
      "user_intent": "Solve TypeError in ChatContainer component",
      "assistance_type": "error_diagnosis_and_solution"
    },
    "automation_suggestions": [
      "Auto-detect similar error patterns",
      "Suggest code fixes based on error type",
      "Link to relevant documentation"
    ]
  },
  "usage_tracking": {
    "referenced_in_messages": ["msg_20240925_004"],
    "analysis_count": 1,
    "shared_with_assistants": ["jason"],
    "user_feedback": {
      "helpful": true,
      "accuracy_rating": 4.5,
      "comments": "OCR correctly identified the error message"
    }
  },
  "enhancement_data": {
    "tags": ["error", "react", "debugging", "console", "screenshot"],
    "searchable_content": "TypeError Cannot read property map undefined ChatContainer.jsx React debugging",
    "related_files": ["ChatContainer.jsx", "Daily_chat.json"],
    "learning_value": "high",
    "reusability": "medium"
  },
  "processing_log": [
    {
      "step": "upload_received",
      "timestamp": "2024-09-25T10:30:15Z",
      "duration_ms": 50
    },
    {
      "step": "file_validation",
      "timestamp": "2024-09-25T10:30:15Z",
      "duration_ms": 25
    },
    {
      "step": "ocr_processing",
      "timestamp": "2024-09-25T10:30:16Z",
      "duration_ms": 1250
    },
    {
      "step": "image_analysis",
      "timestamp": "2024-09-25T10:30:17Z",
      "duration_ms": 850
    },
    {
      "step": "ai_insights_generation",
      "timestamp": "2024-09-25T10:30:18Z",
      "duration_ms": 2100
    },
    {
      "step": "rich_data_saved",
      "timestamp": "2024-09-25T10:30:20Z",
      "duration_ms": 75
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
