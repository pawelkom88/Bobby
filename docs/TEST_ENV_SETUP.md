# 🧪 Bobby - Testing with ElevenLabs Environment Variables

Quick setup guide to test Bobby with your ElevenLabs credentials.

## ✅ Environment Variables

The app now uses the following environment variables:

### 1. **Server-Side (Secret - Never expose)**
```env
# Your ElevenLabs API Key
ELEVEN_LABS_API_KEY=sk_xxxxx

# Your ElevenLabs Agent ID (for signed URL generation)
ELEVEN_LABS_AGENT_ID=your_agent_id_here
```

### 2. **Client-Side (Safe to expose)**
```env
# Your ElevenLabs Agent ID (visible to client, used for UI)
NEXT_PUBLIC_ELEVEN_LABS_AGENT_ID=your_agent_id_here
```

### 3. **Security**
```env
# Allowed origins for signed URL requests (comma-separated)
ALLOWED_ORIGINS=http://localhost:3000
```

## 🚀 Quick Setup

### Step 1: Get Credentials

1. **Get API Key**: https://elevenlabs.io/app/settings/api-keys
   - Click "Create API Key"
   - Name: "Bobby Testing"
   - Copy the key: `sk_xxxxx`

2. **Get Agent ID**: https://elevenlabs.io/app/agents
   - Select your agent (create one if needed)
   - Copy the Agent ID

3. **Example Credentials** (for reference):
   ```
   API Key: sk_1234567890abcdefg
   Agent ID: agent-xyz-123
   ```

### Step 2: Create `.env.local`

Create a file `.env.local` in the project root:

```env
# Server-side (SECURE)
ELEVEN_LABS_API_KEY=sk_your_api_key_here
ELEVEN_LABS_AGENT_ID=your_agent_id_here

# Client-side (SAFE)
NEXT_PUBLIC_ELEVEN_LABS_AGENT_ID=your_agent_id_here

# Security
ALLOWED_ORIGINS=http://localhost:3000
```

### Step 3: Start Development Server

```bash
npm run dev
```

Output should show:
```
  ▲ Next.js 16.0.3
  - Local:        http://localhost:3000
  ✓ Ready in 1.2s
```

### Step 4: Test the App

1. **Open Browser**: http://localhost:3000
2. **Click**: "Start Training" or go to `/app`
3. **Select**: Age tier (4-6, 7-10, or 11-13)
4. **Select**: Emergency situation
5. **Click**: "Dial 999" button
6. **Click**: "Start Conversation" button
7. **Speak**: Into your microphone!

## 🧪 Testing Checklist

- [ ] App starts without errors
- [ ] API endpoint `/api/get-signed-url` is accessible
- [ ] Can request signed URL (check Network tab in DevTools)
- [ ] Microphone permission prompt appears
- [ ] WebSocket connection establishes (check DevTools)
- [ ] Agent responds to your voice
- [ ] Conversation appears in message history
- [ ] Can end conversation
- [ ] Can start new conversations

## 🐛 Troubleshooting

### "ELEVEN_LABS_API_KEY not configured"
**Problem**: Environment variables not loaded
**Solution**:
1. Verify `.env.local` exists in project root
2. Restart dev server: `npm run dev`
3. Check that you copied the API key correctly

### "ELEVEN_LABS_AGENT_ID not configured"
**Problem**: Agent ID not set
**Solution**:
1. Go to https://elevenlabs.io/app/agents
2. Copy your agent ID (not agent name)
3. Add to `.env.local`
4. Restart dev server

### "Origin not allowed"
**Problem**: Can't request signed URL
**Solution**:
1. Check `ALLOWED_ORIGINS` includes `http://localhost:3000`
2. Verify domain matches exactly
3. Restart dev server

### "Failed to get signed URL"
**Problem**: API call failed
**Solution**:
1. Check console for error message
2. Verify API key is valid and not expired
3. Check ElevenLabs API status
4. Try creating new API key

### Microphone not working
**Problem**: No audio input
**Solution**:
1. Check browser permissions (allow microphone)
2. Test microphone with system settings
3. Try different browser
4. Check DevTools console for errors

## 🔍 Debugging

### Check Network Tab
1. Open DevTools: `F12`
2. Go to "Network" tab
3. Start conversation
4. Look for:
   - `POST /api/get-signed-url` - should return 200 with `signed_url`
   - WebSocket connection to `wss://api.elevenlabs.io/...`

### Check Console
1. Open DevTools: `F12`
2. Go to "Console" tab
3. Look for logs from Bobby:
   ```
   [INFO] Starting agent conversation
   [INFO] Requesting signed URL from backend
   [INFO] Signed URL received, initiating connection
   ```

### Test API Endpoint

```bash
# Test signed URL generation
curl -X POST http://localhost:3000/api/get-signed-url \
  -H "Origin: http://localhost:3000" \
  -H "Content-Type: application/json"

# Should return:
# {"signed_url": "wss://api.elevenlabs.io/v1/convai/conversation?agent_id=..."}
```

## 📝 Environment Variable Reference

| Variable | Type | Required | Example |
|----------|------|----------|---------|
| `ELEVEN_LABS_API_KEY` | Server | ✅ | `sk_1234567890abcd` |
| `ELEVEN_LABS_AGENT_ID` | Server | ✅ | `agent-xyz-123` |
| `NEXT_PUBLIC_ELEVEN_LABS_AGENT_ID` | Client | ✅ | `agent-xyz-123` |
| `ALLOWED_ORIGINS` | Server | ❌ | `http://localhost:3000` |
| `NODE_ENV` | Server | ❌ | `development` |

## 🎓 What's Happening Behind the Scenes

1. **User clicks "Start Conversation"**
   - Frontend checks if agent ID is configured

2. **Frontend requests signed URL**
   - Calls `POST /api/get-signed-url`

3. **Backend validates and generates**
   - Checks API key exists (`ELEVEN_LABS_API_KEY`)
   - Checks agent ID exists (`ELEVEN_LABS_AGENT_ID`)
   - Validates origin against whitelist
   - Calls ElevenLabs API with API key
   - Returns short-lived signed URL (15 min expiration)

4. **Frontend receives signed URL**
   - Establishes WebSocket connection using signed URL
   - Requests microphone permission
   - Starts speech-to-text capture

5. **Conversation begins**
   - Your speech → Web Speech API → Text
   - Text → Sent to agent
   - Agent → Responds with voice
   - Voice plays through speakers

## 📚 Resources

- [ElevenLabs Quickstart](https://elevenlabs.io/docs/quickstart)
- [ElevenLabs Authentication](https://elevenlabs.io/docs/agents-platform/customization/authentication)
- [Create API Key](https://elevenlabs.io/app/settings/api-keys)
- [Create Agent](https://elevenlabs.io/app/agents)

## ✅ You're Ready!

All set to test Bobby! 🎉

```bash
npm run dev
```

Then open: http://localhost:3000/app

---

**Happy Testing!** 🚀

If you have any issues, check the troubleshooting section or review the console logs in DevTools.

