# Firestore Migration Guide

This document describes the migration from localStorage to Cloud Firestore for user data storage.

## Overview

The Bobby app has been migrated from using browser localStorage to Cloud Firestore for storing user-specific data. This provides:

- **Cloud-backed storage**: Data persists across devices and browsers
- **Real-time sync**: Changes are automatically synced across all user sessions
- **Better security**: Firestore security rules ensure users can only access their own data
- **Scalability**: Ready for production use with proper authentication

## Architecture

### Data Structure

All user data is stored in Firestore under the `/users/{uid}` collection, where `{uid}` is the authenticated user's Firebase UID.

Each user document contains:

```typescript
interface UserData {
  userName: string;           // User's display name
  totalXP: number;            // Total experience points earned
  level: number;              // Current user level (calculated from XP)
  conversations: Conversation[]; // Array of completed conversations
  badges: Badge[];            // Array of earned achievement badges
  settings: UserSettings;     // User accessibility & preference settings
  journey?: JourneyState;     // Temporary journey selection state (optional)
  createdAt: Timestamp;       // Document creation timestamp
  updatedAt: Timestamp;       // Last update timestamp
}
```

### Key Components

1. **lib/firestore-storage.ts**: Core Firestore operations
   - All CRUD operations for user data
   - Real-time subscription support
   - Async functions that require user UID

2. **context/UserDataContext.tsx**: React Context Provider
   - Manages user data state
   - Provides hooks for components to access/update data
   - Handles real-time synchronization
   - Automatically initializes user documents

3. **firestore.rules**: Security Rules
   - Users can only read/write their own data
   - Prevents unauthorized access
   - Prevents accidental deletion

## Security Rules

The Firestore security rules ensure that:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // User data - users can only read/write their own data
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
      allow delete: if false; // Prevent accidental deletion
    }
  }
}
```

**Important**: Deploy these rules to Firebase using:
```bash
firebase deploy --only firestore:rules
```

## Usage

### Using the UserData Context

All components should use the `useUserData` hook to access and modify user data:

```typescript
import { useUserData } from '@/context/UserDataContext';

function MyComponent() {
  const {
    userData,           // Current user data state
    loading,            // Loading state
    addXP,              // Add XP to user
    saveConversation,   // Save a conversation
    updateSettings,     // Update user settings
    // ... other functions
  } = useUserData();

  // Access data
  const level = userData.level;
  const badges = userData.badges;

  // Update data
  const handleAddXP = async () => {
    const result = await addXP(100);
    if (result.leveledUp) {
      logger.log('Level up!', result.newLevel);
    }
  };

  return <div>Level: {level}</div>;
}
```

### Available Functions

The `useUserData` hook provides:

**Data Operations:**
- `saveConversation(timestamp, service, ageTier, xpEarned, score?, feedback?)`
- `addXP(amount)` - Returns `LevelUpResult`
- `updateSettings(newSettings)`
- `setUserName(name)`
- `setSelectedAgeTier(ageTier)`
- `setSelectedService(service)`
- `awardScoreBadge(score)` - Returns `Badge | null`
- `resetProgress()`

**Getters (synchronous, from state):**
- `getLevel()` - Returns current level
- `getXP()` - Returns total XP
- `getBadges()` - Returns earned badges
- `getConversations()` - Returns conversation history
- `getSettings()` - Returns user settings
- `getJourneyState()` - Returns journey state
- `getUserProgress()` - Returns complete progress summary

## Migration Checklist

✅ **Completed:**
- [x] Created `lib/firestore-storage.ts` with all storage functions
- [x] Created `context/UserDataContext.tsx` for state management
- [x] Updated Firestore security rules
- [x] Added UserDataProvider to app layout
- [x] Updated all components to use context:
  - [x] CompletionScreen
  - [x] BadgeDisplay
  - [x] LevelProgress
  - [x] AccessibilitySection
  - [x] VoiceConversation
  - [x] AchievementsPage
  - [x] SettingsPage
  - [x] YourAgePage
  - [x] ChooseEmergencyPage
  - [x] ConversationPage

## Testing

### Manual Testing Steps

1. **Authentication Flow**
   - Sign up a new user
   - Verify user document is created in Firestore
   - Check that default data is initialized

2. **Data Persistence**
   - Complete a conversation
   - Verify XP and conversation are saved to Firestore
   - Refresh the page - data should persist
   - Sign out and sign back in - data should still be there

3. **Real-time Sync**
   - Open the app in two browser tabs
   - Make changes in one tab (e.g., update settings)
   - Verify changes appear in the other tab automatically

4. **Settings**
   - Change accessibility settings
   - Verify they persist after refresh
   - Verify they sync across tabs

5. **Progress**
   - Earn XP and level up
   - Earn badges
   - Verify all progress is saved
   - Test reset progress functionality

6. **Journey State**
   - Select age tier and emergency type
   - Verify selections are saved
   - Navigate through the flow

### Security Testing

1. **Access Control**
   - Try to access another user's data (should fail)
   - Verify unauthenticated users cannot read/write data
   - Verify users can only access their own documents

2. **Data Validation**
   - Test with invalid data types
   - Verify validation functions work correctly

## Deployment

### Prerequisites

1. Firebase project is set up
2. Firestore is enabled
3. Authentication is configured
4. Environment variables are set

### Deploy Security Rules

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Verify rules in Firebase Console
# Go to Firestore Database > Rules
```

### Deploy Application

```bash
# Build the application
npm run build

# Deploy to your hosting platform
# (Vercel, Netlify, etc.)
```

## Troubleshooting

### Issue: "User must be authenticated" errors

**Solution**: Ensure the user is signed in before accessing user data functions. The context automatically handles this, but direct calls to firestore-storage functions require a valid user UID.

### Issue: Data not syncing in real-time

**Solution**: 
- Check that the UserDataProvider is properly wrapped around your app
- Verify Firestore rules allow read access
- Check browser console for Firestore errors

### Issue: "Permission denied" errors

**Solution**:
- Verify Firestore security rules are deployed
- Ensure user is authenticated
- Check that the user UID matches the document ID

### Issue: Duplicate XP awards

**Solution**: The app uses session storage to track processed completions. If issues persist:
- Clear browser cache and session storage
- Check the completion ID logic in CompletionScreen

## Performance Considerations

1. **Offline Support**: Firestore SDK includes built-in offline support. Data is cached locally and synced when online.

2. **Real-time Listeners**: The app uses a single real-time listener per user session. This is efficient and provides instant updates.

3. **Batch Operations**: For multiple updates, consider using Firestore batch writes (not currently implemented but can be added).

4. **Indexes**: No custom indexes are required for the current data structure.

## Future Enhancements

Potential improvements:

1. **Data Migration Tool**: Create a tool to migrate existing localStorage data to Firestore for existing users
2. **Backup/Export**: Add functionality to export user data
3. **Analytics**: Track user progress and engagement metrics
4. **Leaderboards**: Add global or friend leaderboards using Firestore queries
5. **Offline Mode**: Enhance offline capabilities with better conflict resolution

## Support

For issues or questions:
- Check the Firebase Console for Firestore errors
- Review the browser console for client-side errors
- Verify security rules are correctly deployed
- Ensure all environment variables are set correctly

