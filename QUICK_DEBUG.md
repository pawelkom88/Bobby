# ⚡ Quick Debug Reference

## 🔴 Error: "Error starting conversation {}"

**Quick Fix**:

1. **Open DevTools**: `F12`
2. **Check Console** for detailed error
3. **Follow the specific error below**

---

## Most Common Issues

### ❌ "Agent ID not configured"
```env
# ADD TO .env.local
NEXT_PUBLIC_ELEVEN_LABS_AGENT_ID=your_agent_id
```
Then restart: `npm run dev`

### ❌ "API key not configured"
```env
# ADD TO .env.local
ELEVEN_LABS_API_KEY=sk_your_api_key
```
Then restart: `npm run dev`

### ❌ "Origin not allowed"
```env
# ADD TO .env.local
ALLOWED_ORIGINS=http://localhost:3000
```
Then restart: `npm run dev`

### ❌ "No signed URL in response"
- Verify API key at: https://elevenlabs.io/app/settings/api-keys
- Verify agent ID at: https://elevenlabs.io/app/agents
- Try creating a new API key

### ❌ "Microphone permission denied"
- Allow microphone in browser settings
- Refresh page
- Try different browser

### ❌ "WebSocket connection failed"
- Check Network tab (DevTools → Network)
- Look for WebSocket connection to `wss://api.elevenlabs.io/...`
- Verify signed URL format

---

## 🔍 Quick Debugging Checklist

✅ **Do this first**:
- [ ] Restart dev server: `npm run dev`
- [ ] Clear browser cache: `Ctrl+Shift+Delete` (or `Cmd+Shift+Delete`)
- [ ] Refresh page: `F5` or `Cmd+R`

✅ **Check these**:
- [ ] `.env.local` exists in project root
- [ ] `ELEVEN_LABS_API_KEY=sk_...` is set
- [ ] `ELEVEN_LABS_AGENT_ID=agent-...` is set
- [ ] `NEXT_PUBLIC_ELEVEN_LABS_AGENT_ID=agent-...` is set

✅ **In DevTools**:
- [ ] Console tab: Look for error message
- [ ] Network tab: Check `/api/get-signed-url` response
- [ ] Application tab: Check environment variables

---

## 🧪 Test the API Endpoint

In browser console (DevTools → Console):

```javascript
fetch('/api/get-signed-url', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' }
})
  .then(r => r.json())
  .then(d => console.log(d))
  .catch(e => console.error(e))
```

**Expected response**: `{ signed_url: "wss://..." }`

---

## 📞 Need Help?

See full guide: [DEBUG_GUIDE.md](./DEBUG_GUIDE.md)

---

## ⚡ TL;DR

1. Open DevTools: `F12`
2. Restart dev: `npm run dev`
3. Check `.env.local` for all 3 vars
4. Look at Console error message
5. Match error to fix above
6. Reload page

Most issues are **.env.local** related! 🎯

