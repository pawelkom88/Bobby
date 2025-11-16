# Bobby Emergency Training Web App - Implementation Plan & Progress Tracker

## Overview

A Next.js 16 web app designed to help children practice and simulate conversations with a fictional 999-style operator in the UK. Uses ElevenLabs voice technology to guide kids through realistic, calm, and supportive emergency or non-emergency scenarios.

**Tech Stack:**
- Next.js 16 (App Router)
- ElevenLabs SDK (client-side)
- Web Speech API
- localStorage for data persistence
- Pure CSS confetti (no external libraries)

---

## Project Structure

```
bobby/
├── app/
│   ├── page.js                    # Home page (Welcome screen)
│   ├── app/
│   │   └── page.js                # Main training flow
│   ├── achievements/
│   │   └── page.js                # Badge display and level progress
│   ├── contact/
│   │   └── page.js                # Contact form/info
│   ├── faq/
│   │   └── page.js                # FAQ section
│   └── settings/
│       └── page.js                # Settings with reset progress
├── components/
│   ├── AgeSelector.js
│   ├── SituationSelector.js
│   ├── DialPad.js
│   ├── VoiceConversation.js
│   ├── BadgeDisplay.js
│   ├── LevelProgress.js
│   ├── Confetti.js
│   ├── AccessibilityControls.js
│   └── CompletionScreen.js
├── lib/
│   ├── elevenlabs.js
│   ├── storage.js
│   ├── speech.js
│   ├── ageTiers.js
│   └── gamification.js
└── public/
    └── (assets - icons will be placeholders)
```

---

## Core Pages & Routes

1. **Home Page** (`app/page.js`) - Welcome screen with Bobby character
2. **App Flow** (`app/app/page.js`) - Main training flow
3. **Achievements** (`app/achievements/page.js`) - Badge display and level progress
4. **Contact** (`app/contact/page.js`) - Contact form/info
5. **FAQ** (`app/faq/page.js`) - FAQ section
6. **Settings** (`app/settings/page.js`) - Settings with reset progress

---

## App Flow Implementation (`app/app/page.js`)

### Step 1: Welcome Screen
- [ ] Display "Welcome back" message
- [ ] Show user progress (level, XP, progress bar) from localStorage
- [ ] Display earned badges
- [ ] "Call Bobby" CTA button (full width)
- [ ] Navigate to age selection on click

### Step 2: Age Selection
- [ ] Three tier buttons: 4-6 years, 7-10 years, 11-13 years
- [ ] Store selected tier in component state
- [ ] Navigate to situation selection

### Step 3: Situation Selection
- [ ] Heading: "WHAT HAPPENED"
- [ ] Supporting text: "Choose situation"
- [ ] Three situation tiles (single selection):
  - Fire emergency
  - Ambulance
  - Police
- [ ] Store selected situation
- [ ] Navigate to number dialing

### Step 4: Emergency Number Dialing
- [ ] Large on-screen keyboard component
- [ ] User must dial: 999 (or 111 based on design images)
- [ ] Error handling:
  - Red color for incorrect numbers
  - Turn entire keyboard red on error
  - Clear error state when user starts typing again
  - Age-appropriate error messages
- [ ] On correct input (999), navigate to voice conversation

### Step 5: Voice Conversation
- [ ] Request microphone permissions
- [ ] Handle denial: Display clear error message explaining microphone is required
- [ ] If granted:
  - [ ] Web Speech API for speech-to-text
  - [ ] ElevenLabs SDK integration for agent conversation
  - [ ] Real-time audio processing
  - [ ] Display subtitles/captions
  - [ ] Conversation state management
  - [ ] Voice-only interaction (no typing alternative)

### Step 6: Completion & Rewards
- [ ] Congratulations screen with custom CSS confetti animation
- [ ] Award XP based on performance
- [ ] Check for level up (calculate new level from XP)
- [ ] Award badge if level milestone reached (levels 3, 6, 9)
- [ ] Service-specific completion tracking
- [ ] Save to localStorage
- [ ] If level 10 reached: Show special completion message with uplifting text
- [ ] Option to return home or try another scenario

---

## Gamification System

### Level & XP System
- **Max Level:** 10
- **XP per Scenario:** Variable based on performance (e.g., 50-100 XP)
- **Level Requirements:**
  - Level 1: 0 XP (starting)
  - Level 2: 100 XP
  - Level 3: 250 XP (Badge 1)
  - Level 4: 450 XP
  - Level 5: 700 XP
  - Level 6: 1000 XP (Badge 2)
  - Level 7: 1350 XP
  - Level 8: 1750 XP
  - Level 9: 2200 XP (Badge 3)
  - Level 10: 2700 XP (No badge - special completion message)

### Badge System
- **Badge 1:** Level 3 - "First Steps Hero"
- **Badge 2:** Level 6 - "Confident Communicator"
- **Badge 3:** Level 9 - "Emergency Expert"

### Level 10 Completion
- Special congratulations screen (no badge awarded)
- Message: "Training Complete! You've mastered emergency calls!"
- Uplifting messages about being prepared and confident
- Option to continue practicing or view achievements

---

## Key Components

### `components/AgeSelector.js`
- [ ] Three age tier buttons (4-6, 7-10, 11-13)
- [ ] Accessible, large buttons
- [ ] Visual feedback on selection
- [ ] Placeholder icons for each age group

### `components/SituationSelector.js`
- [ ] Three situation tiles (Fire, Ambulance, Police)
- [ ] Single selection logic
- [ ] Pictogram support with placeholder icons

### `components/DialPad.js`
- [ ] Large, accessible number pad
- [ ] Error state handling (red theme)
- [ ] Clear visual feedback
- [ ] Support for 999 or 111 (configurable)

### `components/VoiceConversation.js`
- [ ] Microphone permission handling
- [ ] Web Speech API integration
- [ ] ElevenLabs agent connection
- [ ] Real-time subtitle display
- [ ] Conversation state management
- [ ] Voice-only (no typing alternative)

### `components/BadgeDisplay.js`
- [ ] Display earned badges in tile format
- [ ] Badge icons (placeholders)
- [ ] Level-based badge unlocking
- [ ] Progress indicators

### `components/LevelProgress.js`
- [ ] Display current level
- [ ] XP progress bar
- [ ] XP to next level calculation
- [ ] Level up animations

### `components/Confetti.js`
- [ ] Pure CSS confetti animation
- [ ] Triggered on scenario completion and level ups
- [ ] Multiple colored particles
- [ ] Smooth animation with CSS keyframes

### `components/AccessibilityControls.js`
- [ ] Subtitles toggle
- [ ] Slowed speech mode
- [ ] Reduced sensory mode
- [ ] Font size controls
- [ ] Color contrast options
- [ ] Dyslexia-friendly font toggle

### `components/CompletionScreen.js`
- [ ] Standard completion (levels 1-9)
- [ ] Special level 10 completion with unique message
- [ ] Confetti animation
- [ ] Badge award display
- [ ] Navigation options

---

## Services & Utilities

### `lib/elevenlabs.js`
- [ ] ElevenLabs SDK initialization
- [ ] API key validation and client-side safety checks
- [ ] Agent connection and conversation handling
- [ ] Audio stream processing
- [ ] Error handling for API failures

### `lib/storage.js`
- [ ] `saveConversation(timestamp, service, ageTier, xpEarned)`
- [ ] `addXP(amount)` - Add XP and check for level up
- [ ] `getLevel()` - Calculate current level from total XP
- [ ] `getXP()` - Get total XP
- [ ] `getXPToNextLevel()` - Calculate XP needed for next level
- [ ] `getBadges()` - Get earned badges
- [ ] `checkLevelUp()` - Check if level up occurred, award badge if milestone
- [ ] `getConversations()`
- [ ] `getUserProgress()`
- [ ] `resetProgress()`

### `lib/speech.js`
- [ ] Web Speech API wrapper
- [ ] Speech-to-text functionality
- [ ] Error handling
- [ ] Microphone permission management

### `lib/ageTiers.js`
- [ ] Age tier configuration
- [ ] Language complexity settings
- [ ] Scenario variations per tier

### `lib/gamification.js`
- [ ] XP calculation based on performance
- [ ] Level calculation from XP
- [ ] Badge unlocking logic
- [ ] Level requirements constants

---

## Data Structure (localStorage)

```javascript
{
  userName: string,
  totalXP: number,
  level: number, // calculated from XP, but cached
  conversations: [
    {
      timestamp: string,
      service: 'fire' | 'ambulance' | 'police',
      ageTier: number,
      xpEarned: number
    }
  ],
  badges: [
    {
      id: string,
      name: string,
      levelEarned: number,
      timestamp: string
    }
  ],
  settings: {
    subtitles: boolean,
    slowedSpeech: boolean,
    reducedSensory: boolean,
    fontSize: string,
    colorMode: string,
    dyslexiaFont: boolean
  }
}
```

---

## Accessibility Features

1. [ ] **Subtitles/Captions** - Real-time display during voice conversation
2. [ ] **Large Buttons** - Minimum 44x44px touch targets
3. [ ] **Slowed Speech Mode** - Adjustable speech rate
4. [ ] **Pictograms** - Visual icons for situations (placeholders)
5. [ ] **Reduced Sensory Mode** - Simplified animations and effects
6. [ ] **Dyslexia-Friendly Font** - OpenDyslexic or similar option
7. [ ] **Color-Safe Design** - High contrast, colorblind-friendly
8. [ ] **Keyboard Navigation** - Full keyboard accessibility
9. [ ] **ARIA Labels** - Proper semantic HTML and ARIA attributes
10. [ ] **Screen Reader Support** - Proper heading hierarchy and landmarks

---

## API Key Security

### Client-Side Safety Measures
- [ ] Use `NEXT_PUBLIC_` prefix for environment variables (exposed to client)
- [ ] Document security considerations in code comments
- [ ] Implement rate limiting considerations
- [ ] Add API key validation before making requests
- [ ] Handle API errors gracefully
- [ ] Consider future migration to API route proxy if needed

---

## Environment Variables

- `NEXT_PUBLIC_ELEVENLABS_API_KEY` - ElevenLabs API key (client-side)
- `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` - Agent ID (if required)

---

## Dependencies

- `next@16` - Next.js framework
- `@elevenlabs/sdk` or `elevenlabs` - ElevenLabs SDK
- Web Speech API (browser native)

---

## Implementation Notes

- All HTML should be semantic and accessible
- Use Next.js client components (`'use client'`) for interactive features
- Implement proper error boundaries
- Handle loading states throughout
- Ensure mobile responsiveness
- No CSS styling needed (user will handle)
- Focus on functionality and accessibility
- Use placeholder icons (user will replace)
- Custom CSS confetti (no external library)
- Voice-only interaction (no typing alternative)
- Complex gamification with levels, XP, and milestone badges

---

## Implementation Todo List

### Phase 1: Project Setup & Core Utilities
- [ ] **setup-nextjs** - Initialize Next.js 16 project with App Router structure and install dependencies (@elevenlabs/sdk)
- [ ] **create-storage-utils** - Create localStorage utility functions in lib/storage.js for conversations, XP, levels, badges, and settings
- [ ] **create-gamification-logic** - Create gamification logic in lib/gamification.js for XP calculation, level requirements, and badge unlocking (badges at levels 3, 6, 9)
- [ ] **create-elevenlabs-service** - Create ElevenLabs service in lib/elevenlabs.js with SDK integration, API key validation, and client-side safety checks
- [ ] **create-speech-service** - Create Web Speech API wrapper in lib/speech.js for speech-to-text functionality (voice-only, no typing)
- [ ] **create-age-tier-config** - Create age tier configuration in lib/ageTiers.js with language and scenario settings

### Phase 2: Core Components
- [ ] **build-confetti-component** - Build custom CSS confetti component (Confetti.js) with pure CSS animations for completion and level up celebrations
- [ ] **build-level-progress** - Build LevelProgress component to display current level, XP, progress bar, and XP to next level
- [ ] **build-age-selector** - Build AgeSelector component with three tier buttons (4-6, 7-10, 11-13) and placeholder icons
- [ ] **build-situation-selector** - Build SituationSelector component with three situation tiles (Fire, Ambulance, Police) and placeholder icons
- [ ] **build-dialpad** - Build DialPad component with large keyboard, 999 validation, and error handling with red theme
- [ ] **build-voice-conversation** - Build VoiceConversation component with microphone permissions, Web Speech API, ElevenLabs integration, and real-time subtitles (voice-only, no typing)
- [ ] **build-badge-display** - Build BadgeDisplay component for showing earned badges in tile format with placeholder icons
- [ ] **build-completion-screen** - Build CompletionScreen component with standard completion, special level 10 completion message, confetti, badge awards, and navigation
- [ ] **build-accessibility-controls** - Build AccessibilityControls component with subtitles, slowed speech, reduced sensory, font size, color, and dyslexia font options

### Phase 3: Pages & Integration
- [ ] **implement-app-flow** - Implement main app flow page (app/app/page.js) with all steps: welcome, age selection, situation selection, dialing, voice conversation, completion with XP/level system
- [ ] **create-achievements-page** - Create achievements page (app/achievements/page.js) displaying badges, level progress, XP, and conversation history in tile format
- [ ] **create-contact-page** - Create contact page (app/contact/page.js) with contact form or information (matching design)
- [ ] **create-faq-page** - Create FAQ page (app/faq/page.js) with expandable questions and answers (matching design)
- [ ] **create-settings-page** - Create settings page (app/settings/page.js) with reset progress functionality and accessibility controls

### Phase 4: Accessibility & Polish
- [ ] **add-accessibility-features** - Add accessibility features throughout: ARIA labels, keyboard navigation, semantic HTML, color-safe design, dyslexia-friendly font option, screen reader support

---

## Progress Tracking

**Last Updated:** [Date will be updated as work progresses]

**Current Phase:** Not Started

**Completed Items:** 0 / 21

**Notes:**
- Use this document to track progress
- Check off items as they are completed
- Update "Last Updated" date when making progress
- Add notes about any blockers or decisions made

---

## Quick Reference

### Badge Milestones
- Level 3 (250 XP) → "First Steps Hero"
- Level 6 (1000 XP) → "Confident Communicator"
- Level 9 (2200 XP) → "Emergency Expert"
- Level 10 (2700 XP) → Special completion message (no badge)

### Emergency Numbers
- Primary: 999 (UK emergency)
- Alternative: 111 (non-emergency, based on design images)

### Age Tiers
- Tier 1: 4-6 years (extremely simple language, very short scenarios, more pictograms)
- Tier 2: 7-10 years (more realistic conversation, full-sentence encouragement)
- Tier 3: 11-13 years (near-realistic operator flow, introduce 111 vs 999 difference)

