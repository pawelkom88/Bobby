# Bobby - Testing Guide

## Manual Testing Checklist

### Setup
- [ ] Install dependencies: `npm install`
- [ ] Create `.env.local` with ElevenLabs API key and Agent ID
- [ ] Run dev server: `npm run dev`
- [ ] Open browser to `http://localhost:3000`

### Home Page (`/`)
- [ ] Page loads without errors
- [ ] Welcome message displays
- [ ] "Get Started" button is visible and clickable
- [ ] Layout is responsive on mobile/tablet/desktop
- [ ] Accessibility: keyboard navigation works
- [ ] Accessibility: screen reader can read all content

### App Flow (`/app`)

#### Welcome Screen
- [ ] Welcome screen displays on first visit
- [ ] Level progress bar displays current level
- [ ] XP amount is displayed correctly
- [ ] Badge display shows earned badges
- [ ] "Call Bobby" button is visible and clickable

#### Age Selection
- [ ] Three age tier buttons display (4-6, 7-10, 11-13)
- [ ] Buttons are keyboard accessible
- [ ] Selected button shows visual feedback
- [ ] Clicking selects age tier and advances to next screen

#### Situation Selection
- [ ] Three situation tiles display (Fire, Ambulance, Police)
- [ ] Tiles are keyboard accessible
- [ ] Selected tile shows visual feedback
- [ ] Clicking selects situation and advances to next screen

#### Dial Pad
- [ ] Number pad displays 10 buttons (0-9)
- [ ] Backspace button works
- [ ] Numbers appear as user enters them
- [ ] Correct number (999) advances to next screen
- [ ] Incorrect numbers show error state (red)
- [ ] Error clears when user starts typing again

#### Voice Conversation
- [ ] Microphone permission request appears
- [ ] User can grant or deny permission
- [ ] If denied, error message explains why it's needed
- [ ] If granted, "Start Conversation" button appears
- [ ] Clicking starts speech recognition
- [ ] Loading spinner appears while connecting
- [ ] User can speak and see interim transcripts
- [ ] Agent responses appear in conversation
- [ ] "Stop Conversation" button works
- [ ] Conversation history displays correctly

#### Completion Screen
- [ ] Congratulations message appears
- [ ] Confetti animation plays
- [ ] XP earned is displayed
- [ ] Level up message appears if applicable
- [ ] New badge displays if earned
- [ ] "Continue" button returns to welcome screen
- [ ] Level 10 special message appears when reached

### Achievements Page (`/achievements`)
- [ ] Page loads without errors
- [ ] Current level and XP display
- [ ] Progress bar shows progress to next level
- [ ] All earned badges display
- [ ] Locked badges show as locked
- [ ] Conversation history shows all completed scenarios
- [ ] Filtering/sorting works if implemented

### FAQ Page (`/faq`)
- [ ] All FAQ items display
- [ ] Expandable questions work
- [ ] Answers are clear and accurate
- [ ] Keyboard navigation works

### Contact Page (`/contact`)
- [ ] Page displays contact information
- [ ] Contact form fields are present (if applicable)
- [ ] Form submission works (if applicable)
- [ ] Success/error messages appear

### Settings Page (`/settings`)
- [ ] All settings controls display
- [ ] Subtitles toggle works
- [ ] Slowed speech toggle works
- [ ] Reduced sensory mode toggle works
- [ ] Font size options work
- [ ] Color contrast toggle works
- [ ] Dyslexia font toggle works
- [ ] Settings persist after page refresh
- [ ] "Reset Progress" button works
- [ ] Reset confirmation appears

### Accessibility Testing

#### Keyboard Navigation
- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical
- [ ] Focus indicators are visible
- [ ] Escape key works where appropriate

#### Screen Reader
- [ ] All images have alt text/aria-labels
- [ ] Buttons have descriptive labels
- [ ] Form inputs have labels
- [ ] Error messages are announced
- [ ] Loading states are announced

#### Color & Contrast
- [ ] Text has sufficient contrast ratio (4.5:1+)
- [ ] Color is not the only way to convey information
- [ ] High contrast mode is readable
- [ ] Dyslexia font is readable

#### Touch Targets
- [ ] All buttons are at least 44x44px
- [ ] Touch targets have adequate spacing
- [ ] Mobile experience is usable

### Data Persistence Testing

- [ ] User progress saves after each session
- [ ] Level and XP persist correctly
- [ ] Badges are saved and restored
- [ ] Conversation history persists
- [ ] Settings are saved and restored
- [ ] Reset progress clears all data
- [ ] New user starts with default data

### Error Handling Testing

- [ ] Missing API key shows appropriate error
- [ ] Network errors are handled gracefully
- [ ] Microphone errors are handled gracefully
- [ ] Invalid input is rejected with error message
- [ ] Error boundary catches React errors
- [ ] Errors have "Try Again" option where applicable

### Performance Testing

- [ ] Home page loads quickly
- [ ] App flow transitions smoothly
- [ ] No console errors on navigation
- [ ] localStorage operations are fast
- [ ] Large conversation histories load smoothly
- [ ] Memory usage doesn't grow excessively

### Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Mobile Testing

- [ ] Responsive layout on all screen sizes
- [ ] Touch interactions work smoothly
- [ ] Keyboard appears for text input
- [ ] Microphone permissions work
- [ ] Speech recognition works
- [ ] Confetti animation performs well

## Automated Testing Setup (Optional)

### Unit Tests
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

Create `__tests__` directory and test files for:
- `lib/storage.ts`
- `lib/gamification.ts`
- `lib/validation.ts`
- `lib/ageTiers.ts`

### Integration Tests
Test component interactions:
- DialPad validation
- VoiceConversation flow
- CompletionScreen rewards

### E2E Tests
Test complete user flows using Cypress or Playwright:
- Full training session
- Level up and badge earning
- Settings persistence

## Testing Notes

- Test on real devices when possible
- Test with screen readers (NVDA, JAWS, VoiceOver)
- Test with keyboard only (no mouse)
- Test with high contrast mode enabled
- Test with reduced motion settings
- Monitor browser console for warnings/errors
- Check memory leaks with DevTools

## Known Issues & Limitations

- ElevenLabs integration is a placeholder (needs actual SDK implementation)
- CSS styling not included (user will add)
- Icons are placeholders (user will replace)
- Speech recognition may vary by browser
- Microphone access requires HTTPS in production

