# Bobby - Emergency Training for Kids

A Next.js 16 web application designed to help children practice and simulate conversations with a fictional 999-style operator in the UK. Uses ElevenLabs voice technology to guide kids through realistic, calm, and supportive emergency or non-emergency scenarios.

## Features

- **Age-Tiered Training**: Three age groups (4-6, 7-10, 11-13) with appropriate language complexity
- **Voice-Only Interaction**: Uses Web Speech API and ElevenLabs for realistic conversations
- **Gamification System**: 
  - 10 levels with XP progression
  - 3 badges earned at levels 3, 6, and 9
  - Special completion message at level 10
- **Accessibility First**: 
  - Subtitles/captions
  - Large buttons (44x44px minimum)
  - Slowed speech mode
  - Reduced sensory mode
  - Dyslexia-friendly font option
  - High contrast mode
  - Full keyboard navigation
- **Multiple Scenarios**: Fire, Ambulance, and Police emergency situations
- **Progress Tracking**: Local storage for XP, badges, and conversation history

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Voice**: ElevenLabs SDK + Web Speech API
- **Storage**: localStorage
- **Styling**: CSS (user-provided)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- ElevenLabs API key and Agent ID

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd bobby
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```bash
cp .env.example .env.local
```

4. Add your ElevenLabs credentials to `.env.local`:
```env
NEXT_PUBLIC_ELEVENLABS_API_KEY=your_api_key_here
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id_here
```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

Create a production build:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## Project Structure

```
bobby/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home page
│   ├── app/               # Main training flow
│   ├── achievements/      # Badge display
│   ├── contact/           # Contact page
│   ├── faq/               # FAQ page
│   └── settings/          # Settings page
├── components/            # React components
│   ├── AgeSelector.tsx
│   ├── SituationSelector.tsx
│   ├── DialPad.tsx
│   ├── VoiceConversation.tsx
│   ├── CompletionScreen.tsx
│   ├── BadgeDisplay.tsx
│   ├── LevelProgress.tsx
│   ├── Confetti.tsx
│   └── AccessibilityControls.tsx
├── lib/                   # Utilities and services
│   ├── storage.ts         # localStorage management
│   ├── gamification.ts    # XP, levels, badges
│   ├── elevenlabs.ts      # ElevenLabs integration
│   ├── speech.ts          # Web Speech API wrapper
│   └── ageTiers.ts        # Age tier configuration
├── types/                 # TypeScript type definitions
│   └── index.ts
└── public/                # Static assets
```

## Configuration

### Environment Variables

- `NEXT_PUBLIC_ELEVENLABS_API_KEY`: Your ElevenLabs API key (required)
- `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`: Your ElevenLabs Agent ID (required)

**Note**: These are client-side variables (NEXT_PUBLIC_ prefix). The API key will be visible in the browser. Consider implementing a proxy API route for production.

### Gamification Settings

Level and XP requirements are defined in `lib/gamification.ts`:
- Level 1: 0 XP
- Level 2: 100 XP
- Level 3: 250 XP (Badge: First Steps Hero)
- Level 4: 450 XP
- Level 5: 700 XP
- Level 6: 1000 XP (Badge: Confident Communicator)
- Level 7: 1350 XP
- Level 8: 1750 XP
- Level 9: 2200 XP (Badge: Emergency Expert)
- Level 10: 2700 XP (Max level, special completion message)

## Usage

1. **Home Page**: Welcome screen with progress and badges
2. **Call Bobby**: Start a training session
3. **Age Selection**: Choose age tier (4-6, 7-10, 11-13)
4. **Situation Selection**: Choose emergency type (Fire, Ambulance, Police)
5. **Dial Number**: Enter 999 on the dial pad
6. **Voice Conversation**: Practice with Bobby using voice
7. **Completion**: Earn XP, level up, and unlock badges

## Accessibility

The app includes comprehensive accessibility features:
- ARIA labels throughout
- Keyboard navigation support
- Screen reader compatibility
- Adjustable font sizes
- High contrast mode
- Dyslexia-friendly font option
- Reduced sensory mode (minimizes animations)

## Data Storage

All data is stored locally in the browser using localStorage:
- User progress (level, XP)
- Earned badges
- Conversation history
- Accessibility settings

To reset progress, use the Settings page.

## Development Notes

- **Icons**: Placeholder icons are used throughout. Replace with your own icon set.
- **Styling**: CSS styling is not included. Add your own styles to `app/globals.css` or use a CSS framework.
- **ElevenLabs Integration**: The SDK integration is a placeholder structure. Update `lib/elevenlabs.ts` based on the actual ElevenLabs agent SDK API.

## Security Considerations

- API keys are exposed client-side (NEXT_PUBLIC_ prefix)
- Consider implementing rate limiting on your ElevenLabs account
- Monitor API usage for abuse
- For production, consider migrating to an API route proxy

## License

[Your License Here]

## Support

For questions or issues, please contact support or check the FAQ page in the app.

