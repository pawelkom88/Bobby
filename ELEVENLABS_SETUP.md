# ElevenLabs Integration Setup Instructions

## ⚠️ Important: Install Dependencies First

The ElevenLabs Agents Platform integration requires the `@elevenlabs/client` package to be installed.

### Step 1: Install Package

```bash
npm install @elevenlabs/client
```

If you encounter peer dependency warnings:

```bash
npm install @elevenlabs/client --legacy-peer-deps
```

Or use yarn:

```bash
yarn add @elevenlabs/client
```

### Step 2: Verify Installation

```bash
npm list @elevenlabs/client
```

You should see something like:
```
bobby@1.0.0 /path/to/bobby
└── @elevenlabs/client@0.5.0
```

### Step 3: Create Agent on ElevenLabs

1. Visit [ElevenLabs Dashboard](https://elevenlabs.io/dashboard)
2. Sign in to your account
3. Navigate to "Agents" section
4. Click "Create Agent"
5. Configure your agent:
   - **Name**: "Bobby Emergency Operator"
   - **System Prompt**: Define the agent's role and behavior
   - **Voice**: Select a clear, calm voice suitable for children
   - **Language**: English (or your preferred language)
6. Click "Create"
7. Copy the Agent ID from the agent details

### Step 4: Configure Environment

1. Copy the environment template:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your Agent ID:
   ```env
   NEXT_PUBLIC_ELEVENLABS_AGENT_ID=YOUR_AGENT_ID_HERE
   ```

### Step 5: Test the Integration

```bash
npm run dev
```

1. Open http://localhost:3000/app
2. Click "Call Bobby"
3. Select age tier
4. Choose situation
5. Dial 999
6. Click "Start Conversation"
7. Allow microphone access when prompted
8. Speak and test the voice interaction

## 🎯 What Changes Were Made

### New Files

- **`lib/elevenlabs-agent.ts`** - Real-time agent conversation SDK
- **`ELEVENLABS_INTEGRATION.md`** - Comprehensive integration guide
- **`.env.local.example`** - Environment template

### Modified Files

- **`package.json`** - Changed SDK from `@elevenlabs/elevenlabs-js` to `@elevenlabs/client`
- **`components/VoiceConversation.tsx`** - Updated to use Agents Platform SDK

### Removed

- Web Speech API speech-to-text (now handled by agent)
- Old placeholder ElevenLabs functions

## 🔧 Key Components

### `lib/elevenlabs-agent.ts`

Main integration file with functions:

- `startAgentConversation(agentId)` - Start WebSocket connection
- `onAgentResponse(conversation, callback)` - Listen for agent responses
- `endAgentConversation(conversation)` - Properly close connection
- `checkMicrophonePermission()` - Verify microphone access
- `getInputFrequencyData(conversation)` - Get input audio frequency
- `getOutputFrequencyData(conversation)` - Get output audio frequency
- `handleElevenLabsError(error)` - Convert errors to user messages

### `components/VoiceConversation.tsx`

Updated component that:

- Integrates with ElevenLabs Agents Platform
- Handles real-time voice streaming
- Manages microphone permissions
- Displays agent responses in conversation
- Provides proper error handling and cleanup

## 📊 How It Works

```
┌─────────────┐
│  Browser    │
│  Microphone │
└──────┬──────┘
       │ (audio stream)
       ▼
┌──────────────────────┐
│ ElevenLabs SDK       │
│ (@elevenlabs/client) │
└──────┬───────────────┘
       │ (WebSocket)
       ▼
┌──────────────────────┐
│ ElevenLabs Agents    │
│ Platform (Server)    │
└──────┬───────────────┘
       │ (text/audio response)
       ▼
┌─────────────────┐
│ Browser Speaker │
│ & Chat Display  │
└─────────────────┘
```

## ✅ Build and Run

After installing `@elevenlabs/client`:

```bash
# Build
npm run build

# Run development server
npm run dev

# Test at http://localhost:3000/app
```

## 🐛 Troubleshooting

### Module Not Found Error

```
Cannot find module '@elevenlabs/client'
```

**Solution**: Install the package

```bash
npm install @elevenlabs/client
```

### Build Still Fails

```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Microphone Permission Denied

1. Check browser microphone settings
2. Grant permission for the website
3. Try a different browser
4. Restart browser if necessary

### Agent Not Responding

1. Verify Agent ID in `.env.local`
2. Check agent is published in ElevenLabs dashboard
3. Verify internet connection
4. Check ElevenLabs service status

### No Audio Output

1. Check speaker/headphone connection
2. Verify browser volume is not muted
3. Check system volume settings
4. Verify agent has voice configured

## 📚 References

Based on official documentation:

- [ElevenLabs Agents Platform Overview](https://elevenlabs.io/docs/agents-platform/overview)
- [JavaScript SDK Documentation](https://elevenlabs.io/docs/agents-platform/libraries/java-script)
- [@elevenlabs/client GitHub](https://github.com/elevenlabs/elevenlabs-js)
- [ElevenLabs Dashboard](https://elevenlabs.io/dashboard)

## 🚀 Next Steps

1. ✅ Install `@elevenlabs/client`
2. ✅ Create agent on ElevenLabs
3. ✅ Add Agent ID to `.env.local`
4. ✅ Run `npm run dev`
5. ✅ Test voice conversation
6. ✅ Deploy to production

## 📝 Notes

- The integration uses the browser SDK (`@elevenlabs/client`)
- Real-time audio streaming via WebSocket
- Microphone permission required
- No Web Speech API for transcription (handled by agent)
- Audio output handled automatically by SDK
- Comprehensive error handling included

---

**Last Updated**: November 2024
**SDK Package**: @elevenlabs/client ^0.5.0
**Status**: ✅ Ready to Use

