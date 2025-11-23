# Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   
   Create a `.env.local` file in the root directory with:
   ```env
   NEXT_PUBLIC_ELEVENLABS_API_KEY=your_api_key_here
   NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id_here
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Open Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Getting ElevenLabs Credentials

1. Sign up at [https://elevenlabs.io](https://elevenlabs.io)
2. Create an agent in your dashboard
3. Copy your API key from account settings
4. Copy your Agent ID from the agent configuration

## Verification Checklist

- [ ] Node.js 18+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` file created with API credentials
- [ ] Development server starts without errors
- [ ] Home page loads correctly
- [ ] Can navigate to all pages
- [ ] Microphone permissions work (for voice features)

## Troubleshooting

### Build Errors
- Ensure TypeScript is properly installed: `npm install typescript @types/react @types/node`
- Check for syntax errors: `npm run build`

### Environment Variables Not Working
- Ensure file is named `.env.local` (not `.env`)
- Restart the development server after adding variables
- Check that variables start with `NEXT_PUBLIC_` prefix

### Microphone Not Working
- Check browser permissions
- Ensure HTTPS (required for microphone access in production)
- Test in Chrome or Edge (best Web Speech API support)

### ElevenLabs Connection Issues
- Verify API key is correct
- Check Agent ID matches your dashboard
- Ensure you have API credits/quota available

## Next Steps

1. Replace placeholder icons with your designs
2. Add your CSS styling
3. Test the ElevenLabs integration with your agent
4. Customize gamification settings if needed
5. Deploy to production

