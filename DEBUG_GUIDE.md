# 🐛 Bobby - Debugging Guide

This guide helps you troubleshoot errors when starting conversations.

## 📍 Common Error: "Error starting conversation {}"

If you see this error in the console, follow these steps:

### Step 1: Open Browser DevTools

**Chrome/Edge**: `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
**Firefox**: `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)

### Step 2: Check Console Tab

Go to the **Console** tab and look for detailed error messages:

```
Error starting conversation: {
  message: "...",
  stack: "...",
  error: {...}
}
```

### Step 3: Identify the Error Type

#### **"Agent ID not configured"**

**Cause**: `NEXT_PUBLIC_ELEVEN_LABS_AGENT_ID` not set

**Fix**:
1. Create `.env.local` in project root
2. Add: `NEXT_PUBLIC_ELEVEN_LABS_AGENT_ID=your_agent_id`
3. Restart dev server: `npm run dev`

```env
# .env.local
NEXT_PUBLIC_ELEVEN_LABS_AGENT_ID=agent-xyz-123
ELEVEN_LABS_API_KEY=sk_xxxxx
ELEVEN_LABS_AGENT_ID=agent-xyz-123
```

#### **"Failed to get signed URL"**

**Cause**: Backend API call failed

**Debug Steps**:
1. Open **Network** tab in DevTools
2. Start conversation
3. Look for `POST /api/get-signed-url` request
4. Check the response:
   - ✅ Status 200: Success - check response body
   - ❌ Status 500: Server error - check response error message
   - ❌ Status 403: Origin not allowed - check `ALLOWED_ORIGINS`

**Common responses**:

```json
// ✅ SUCCESS
{ "signed_url": "wss://api.elevenlabs.io/..." }

// ❌ API KEY NOT SET
{ "error": "ElevenLabs API key not configured" }

// ❌ AGENT ID NOT SET
{ "error": "ElevenLabs agent ID not configured" }

// ❌ ORIGIN NOT ALLOWED
{ "error": "Origin not allowed" }

// ❌ ELEVENLABS API ERROR
{ 
  "error": "Failed to generate signed URL: ...",
  "details": "..."
}
```

#### **"No signed URL received from backend"**

**Cause**: API returned empty signed URL

**Fix**:
1. Verify your API key is valid at https://elevenlabs.io/app/settings/api-keys
2. Verify your agent exists at https://elevenlabs.io/app/agents
3. Check backend logs: `npm run dev` console output

#### **Microphone Permission Error**

**Error**: "Microphone permission denied"

**Fix**:
1. Check browser permission prompt
2. Or: Settings → Privacy → Microphone → Allow localhost:3000
3. Reload page

#### **WebSocket Connection Error**

**Error**: "WebSocket connection failed"

**Cause**: Signed URL or connection issue

**Debug**:
1. Check **Network** tab
2. Look for WebSocket connection to `wss://api.elevenlabs.io/...`
3. Check if it connects or fails
4. Verify signed URL format in response

## 🔍 Multi-Layer Debugging

### Layer 1: Environment Variables

Check what's actually loaded:

```bash
# In browser console (DevTools)
console.log("Agent ID:", process.env.NEXT_PUBLIC_ELEVEN_LABS_AGENT_ID)
```

### Layer 2: API Route

Check if the signed URL endpoint works:

```bash
# Test the API manually
curl -X POST http://localhost:3000/api/get-signed-url \
  -H "Origin: http://localhost:3000" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{ "signed_url": "wss://api.elevenlabs.io/..." }
```

Error response:
```json
{ "error": "Failed to generate signed URL: ...", "details": "..." }
```

### Layer 3: Browser Network Activity

1. Open DevTools → **Network** tab
2. Start a conversation
3. Look for these requests (in order):

**Request 1: Get Signed URL**
```
POST /api/get-signed-url
Status: 200
Response: { "signed_url": "wss://..." }
```

**Request 2: WebSocket Connection**
```
wss://api.elevenlabs.io/v1/convai/conversation?agent_id=...&conversation_signature=...
Status: 101 Switching Protocols (WebSocket upgrade)
```

### Layer 4: Browser Console Logs

The app logs detailed information. Look for:

```
[2025-11-16T...] INFO: Starting agent conversation
[2025-11-16T...] INFO: Requesting signed URL from backend
[2025-11-16T...] INFO: Signed URL received, initiating connection
[2025-11-16T...] INFO: Agent conversation started successfully
```

Or if error:

```
[2025-11-16T...] ERROR: Error starting conversation { message: "...", stack: "..." }
```

## 📋 Full Debugging Checklist

- [ ] `.env.local` file exists in project root
- [ ] `ELEVEN_LABS_API_KEY` is set (secret)
- [ ] `ELEVEN_LABS_AGENT_ID` is set
- [ ] `NEXT_PUBLIC_ELEVEN_LABS_AGENT_ID` is set
- [ ] Dev server restarted after changes (`npm run dev`)
- [ ] Agent ID is correct (check https://elevenlabs.io/app/agents)
- [ ] API key is valid (check https://elevenlabs.io/app/settings/api-keys)
- [ ] Microphone permissions granted
- [ ] No browser console errors before clicking "Start Conversation"
- [ ] `/api/get-signed-url` returns `signed_url` (check Network tab)
- [ ] WebSocket connection shows in Network tab
- [ ] No CORS errors in console

## 🔧 Advanced Debugging

### Check All Environment Variables

In your `.env.local`:

```bash
# Server-side (MUST be set)
ELEVEN_LABS_API_KEY=sk_xxxxx        # ← Check this is not empty
ELEVEN_LABS_AGENT_ID=agent-xyz-123  # ← Check this is not empty

# Client-side (MUST be set)
NEXT_PUBLIC_ELEVEN_LABS_AGENT_ID=agent-xyz-123  # ← Check this is not empty

# Security (optional but recommended)
ALLOWED_ORIGINS=http://localhost:3000
NODE_ENV=development
```

### Check API Key Format

Your API key should look like:
```
sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Not:
```
xxx (too short)
[sk_...] (with brackets)
ELEVEN_LABS_API_KEY=sk_... (showing the env var name)
```

### Test Signed URL Endpoint Directly

```bash
# Option 1: Using curl
curl -X POST http://localhost:3000/api/get-signed-url \
  -H "Origin: http://localhost:3000" \
  -H "Content-Type: application/json" \
  -v

# Option 2: Using browser fetch in DevTools console
fetch('/api/get-signed-url', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Origin': 'http://localhost:3000'
  }
})
  .then(r => r.json())
  .then(d => console.log('Response:', d))
  .catch(e => console.error('Error:', e))
```

### Enable Verbose Logging

In DevTools console, you can see all logs:

```javascript
// Import the logger
import { logger } from '@/lib/logger';

// Get all logs
console.log(logger.getLogs())

// Export logs to file
const logs = logger.exportLogs();
console.save(logs, 'bobby-logs.json');
```

## 🐛 Still Having Issues?

If you're still stuck, provide:

1. **The full error message** from console
2. **Screenshot of Network tab** showing `/api/get-signed-url` response
3. **Your `.env.local`** (with API key redacted)
4. **DevTools console logs** (screenshot or copy-paste)
5. **Browser used** (Chrome, Firefox, Safari, etc.)

## 📚 Resources

- [ElevenLabs API Keys](https://elevenlabs.io/app/settings/api-keys)
- [ElevenLabs Agents](https://elevenlabs.io/app/agents)
- [ElevenLabs Authentication](https://elevenlabs.io/docs/agents-platform/customization/authentication)
- [Browser DevTools Guide](https://developer.chrome.com/docs/devtools/)

---

**Need help?** Check the error type above and follow the specific fix. Most issues are environment variable related!

