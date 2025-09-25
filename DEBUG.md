# Debug Guide - Project L.I.F.E

## 🐛 Debug Giao Diện Chat với LM Studio

### Vấn đề phổ biến và cách khắc phục

#### 1. Không kết nối được với LM Studio API

**Triệu chứng:**

- Connection status hiển thị "Mất kết nối"
- Không thể gửi tin nhắn
- Console hiển thị lỗi kết nối

**Cách debug:**

1. **Mở Developer Console** (F12) và xem logs:

   ```
   🔗 Attempting to connect to: http://192.168.1.3:1234
   🎯 Testing LM Studio direct connection to: http://192.168.1.3:1234
   ❌ LM Studio connection failed: [Error message]
   ```

2. **Kiểm tra LM Studio:**

   - Đảm bảo LM Studio đang chạy
   - Kiểm tra model đã được load
   - Xác nhận server đang listen trên port 1234

3. **Kiểm tra network:**

   ```bash
   # Test kết nối bằng curl
   curl http://192.168.1.3:1234/v1/models
   ```

4. **Kiểm tra CORS:**
   - LM Studio cần enable CORS cho requests từ browser
   - Kiểm tra settings trong LM Studio

#### 2. Lỗi CORS (Cross-Origin Resource Sharing)

**Triệu chứng:**

```
Access to fetch at 'http://192.168.1.3:1234/v1/models' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Cách khắc phục:**

1. Trong LM Studio settings, enable CORS
2. Hoặc run React app với proxy:
   ```json
   // package.json
   "proxy": "http://192.168.1.3:1234"
   ```

#### 3. WebSocket Connection Failed

**Triệu chứng:**

```
🔴 Socket connection error: Error: xhr poll error
⚠️ Cannot test WebSocket: Socket not connected
```

**Giải thích:**

- Đây là behavior bình thường
- App hiện đang dùng direct HTTP API với LM Studio
- WebSocket sẽ hoạt động khi có Node.js backend

#### 4. Streaming Response không hoạt động

**Debug logs cần tìm:**

```
📤 Sending message to LM Studio: [message]
📡 WebSocket not connected, using direct LM Studio API
✅ Message sent successfully via direct API
```

**Nếu thấy lỗi:**

```
❌ Send message error: [error details]
```

**Cách khắc phục:**

1. Kiểm tra model trong LM Studio có hỗ trợ streaming
2. Verify API endpoint `/v1/chat/completions`
3. Check request format

### Console Logs Cần Xem

#### Khi app khởi động:

```
🚀 SocketProvider mounted, attempting auto-connect
🔗 Attempting to connect to: http://localhost:8000
📡 Socket instance created with options: {...}
🎯 Testing LM Studio direct connection to: http://192.168.1.3:1234
✅ LM Studio direct connection successful: {...}
```

#### Khi gửi tin nhắn:

```
📤 Sending message to LM Studio: Hello
📡 WebSocket not connected, using direct LM Studio API
🔄 Updated LM Studio API URL to: http://192.168.1.3:1234
✅ Message sent successfully via direct API
```

#### Khi test connection:

```
🧪 Testing connection - Socket: false Connected: false
🎯 Testing LM Studio direct connection to: http://192.168.1.3:1234
✅ LM Studio connection successful: {...}
```

### Kiểm tra Configuration

#### 1. API URL trong localStorage:

```javascript
// Mở console và check
localStorage.getItem("life_api_url");
// Should return: "http://192.168.1.3:1234"
```

#### 2. LM Studio Models:

```bash
curl http://192.168.1.3:1234/v1/models
# Should return JSON with available models
```

#### 3. Test chat endpoint:

```bash
curl -X POST http://192.168.1.3:1234/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "local-model",
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": false
  }'
```

### Common Fixes

#### 1. Reset API URL:

```javascript
// Trong console
localStorage.setItem("life_api_url", "http://192.168.1.3:1234");
location.reload();
```

#### 2. Clear cache:

```javascript
// Clear all app data
localStorage.clear();
sessionStorage.clear();
location.reload();
```

#### 3. Check Network Tab:

- Mở DevTools > Network
- Thực hiện test connection
- Xem request/response details

### Troubleshooting Steps

1. **Verify LM Studio is running:**

   - Open LM Studio
   - Load a model
   - Check server is started

2. **Test direct connection:**

   - Go to http://192.168.1.3:1234/v1/models in browser
   - Should see JSON response

3. **Check console logs:**

   - F12 > Console
   - Look for error messages
   - Verify connection flow

4. **Test message sending:**
   - Type a message in chat
   - Watch console for logs
   - Check for streaming response

### Expected Behavior

✅ **Normal flow:**

```
User types message
  ↓
App tries WebSocket (fails - no backend)
  ↓
App falls back to direct LM Studio API
  ↓
Streaming response appears in chat
  ↓
Message completed successfully
```

❌ **Error flow:**

```
User types message
  ↓
Direct API call fails
  ↓
Error message appears in chat
  ↓
Check console for specific error
```

### Contact & Support

Nếu vẫn gặp lỗi sau khi thử các bước trên:

1. Copy console logs
2. Note LM Studio version
3. Describe steps to reproduce
4. Include error messages

### Development Notes

- App hiện dùng **direct HTTP API** với LM Studio
- **WebSocket** sẽ được implement trong Node.js backend
- **Dual assistant** (JASON) sẽ hoạt động khi có backend
- Current architecture: **React → Direct API → LM Studio**
