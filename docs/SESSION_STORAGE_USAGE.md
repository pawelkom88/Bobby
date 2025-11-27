# sessionStorage Usage in Bobby App

## Overview

The Bobby app uses **sessionStorage** (not localStorage or Firestore) for temporary, session-specific flow control data. This is separate from the Firestore migration and serves a different purpose.

## Why sessionStorage?

sessionStorage is the correct choice for this use case because:

1. **Temporary Data**: The data only needs to exist during the conversation flow
2. **Session-Specific**: Data should be cleared when the browser is closed
3. **Flow Control**: Used to manage navigation and prevent duplicate operations
4. **Fast**: No network calls, instant access
5. **Appropriate Scope**: Data doesn't need to persist across sessions or devices

## What sessionStorage Stores

### 1. `conversationComplete` (boolean flag)
- **Set by**: `app/conversation/page.tsx` (line 92)
- **Read by**: `app/conversation/page.tsx` (line 30)
- **Cleared by**: Multiple pages when starting new flow
- **Purpose**: Prevents users from navigating back to a completed conversation

### 2. `lastAssessment` (JSON object)
- **Set by**: `app/conversation/page.tsx` (line 76-82)
- **Read by**: `app/completion/page.tsx` (line 32)
- **Cleared by**: Multiple pages when starting new flow
- **Purpose**: Passes assessment data from conversation page to completion page
- **Contains**: `{ assessment, passed }`

### 3. `completionId` (unique string)
- **Set by**: `app/conversation/page.tsx` (line 75, 83)
- **Read by**: `app/completion/page.tsx` (line 33), `components/CompletionScreen.tsx` (line 54)
- **Cleared by**: Multiple pages when starting new flow
- **Purpose**: Unique identifier to prevent duplicate XP awards on page refresh
- **Format**: `completion-{timestamp}-{random}`

### 4. `processedCompletionId` (string)
- **Set by**: `components/CompletionScreen.tsx` (line 147)
- **Read by**: `components/CompletionScreen.tsx` (line 55)
- **Cleared by**: Multiple pages when starting new flow
- **Purpose**: Tracks which completion has been processed to prevent duplicate XP

## Flow Diagram

```
User Journey:
1. /your-age → Clear sessionStorage
2. /choose-emergency → Clear sessionStorage
3. /dial → Clear sessionStorage
4. /conversation → Set lastAssessment, completionId, conversationComplete
5. /completion → Read sessionStorage, award XP once, set processedCompletionId
6. (User refreshes) → Read sessionStorage, skip XP award (already processed)
7. /app (home) → Clear sessionStorage
```

## Pages That Clear sessionStorage

These pages clear sessionStorage when starting a new conversation flow:

1. **app/app/page.tsx** (lines 14-20) - Home page
2. **app/app/your-age/page.tsx** (lines 20-26) - Age selection
3. **app/app/choose-emergency/page.tsx** (lines 45-51) - Emergency selection
4. **app/app/dial/page.tsx** (lines 12-18) - Dial pad
5. **components/CompletionScreen.tsx** (lines 170-176) - When continuing

## Preventing Duplicate XP Awards

The app uses a multi-layered approach to prevent duplicate XP awards:

### Layer 1: completionId Check
```typescript
const completionId = sessionStorage.getItem('completionId');
const processedId = sessionStorage.getItem('processedCompletionId');

if (completionId === processedId) {
  // Already processed, skip XP award
  return;
}
```

### Layer 2: Missing completionId Check
```typescript
if (assessmentData && !completionId) {
  // Page refresh without completionId, skip XP award
  return;
}
```

### Layer 3: Firestore (Implicit)
- Conversations are saved to Firestore with timestamps
- Firestore provides the source of truth for user progress
- If somehow duplicate XP was awarded, it would be visible in Firestore

## Changes Made During Firestore Migration

### ✅ Removed
- **localStorage `processedCompletions` array** - This was redundant with Firestore
  - Previously stored in `localStorage.getItem('processedCompletions')`
  - Used as an additional safeguard to survive page refreshes
  - No longer needed since Firestore is the source of truth

### ✅ Kept
- **All sessionStorage logic** - Still needed for flow control
- **completionId mechanism** - Prevents duplicate XP on refresh
- **Session clearing on new flow** - Resets state when starting new conversation

### ✅ Updated
- **app/completion/page.tsx** - Now uses `useUserData` hook for journey state instead of old localStorage

## Why Not Use Firestore for This?

We could theoretically use Firestore to track processed completions, but:

1. **Latency**: Network calls would slow down the flow
2. **Complexity**: Would need to query Firestore on every page load
3. **Overkill**: sessionStorage is perfect for temporary session data
4. **Cost**: Extra Firestore reads for data that doesn't need to persist
5. **Offline**: sessionStorage works offline, Firestore might not

## Why Not Use URL Parameters?

We could pass data via URL params, but:

1. **Security**: Assessment data would be visible in URL
2. **Size**: Assessment objects are too large for URLs
3. **Bookmarking**: Users could bookmark completion URLs with stale data
4. **Complexity**: Would need to serialize/deserialize complex objects

## Best Practices

### ✅ Good Uses of sessionStorage
- Temporary flow control data
- Preventing duplicate operations within a session
- Passing data between pages in a flow
- Session-specific flags and state

### ❌ Bad Uses of sessionStorage
- User profile data (use Firestore)
- Settings that should persist (use Firestore)
- Data that needs to sync across devices (use Firestore)
- Long-term storage (use Firestore)

## Testing sessionStorage Logic

### Test Case 1: Normal Flow
1. Complete a conversation
2. Land on completion page
3. Verify XP is awarded once
4. Verify conversation is saved to Firestore

### Test Case 2: Page Refresh
1. Complete a conversation
2. Land on completion page
3. Refresh the page
4. Verify XP is NOT awarded again
5. Verify UI still shows correct data

### Test Case 3: Back Navigation
1. Complete a conversation
2. Land on completion page
3. Try to navigate back to conversation page
4. Verify redirect to home page

### Test Case 4: New Conversation
1. Complete a conversation
2. Click "Continue" or "Start New"
3. Verify sessionStorage is cleared
4. Complete another conversation
5. Verify XP is awarded for the new conversation

## Summary

- **sessionStorage is NOT part of the localStorage → Firestore migration**
- **sessionStorage is used for temporary, session-specific flow control**
- **This is the correct architectural choice for this use case**
- **We removed the redundant localStorage `processedCompletions` array**
- **All sessionStorage logic remains and is necessary**

The sessionStorage usage is clean, appropriate, and follows web development best practices for temporary session data.

