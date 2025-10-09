# Navigation Implementation for User State Handling

## Overview

This implementation ensures that users with rider account states other than "READY" or "ACTIVE" are automatically redirected to the awaiting approval screen after successful login or registration.

## Implementation Details

### 1. RootNavigator Changes (`src/navigation/RootNavigator.tsx`)

**Purpose**: Determines whether to show the main app or authentication stack based on user state.

**Key Logic**:
- Checks if user exists and is authenticated
- Normalizes user state (handles hyphens, spaces, case variations)
- Only allows access to main app if state is "READY", "ACTIVE", or "APPROVED"
- All other states redirect to AuthStack

```typescript
const isUserReady = () => {
  if (!isAuthenticated || !user) return false;
  
  const userState = normalizeState(user.state || user.status);
  return userState === 'READY' || userState === 'ACTIVE' || userState === 'APPROVED';
};
```

### 2. AuthStack Changes (`src/navigation/AuthStack.tsx`)

**Purpose**: Handles navigation within the authentication flow based on user state.

**Key Features**:
- Auto-navigation effect that triggers when user state changes
- Dynamic initial route determination based on user state
- Handles REJECTED users → RejectedScreen
- Handles all other non-ready states → WaitingScreen

```typescript
useEffect(() => {
  if (user) {
    const userState = normalizeState(user.state || user.status);
    
    if (userState === 'REJECTED') {
      navigation.navigate('Rejected');
    } else if (userState !== 'READY' && userState !== 'ACTIVE' && userState !== 'APPROVED') {
      navigation.navigate('Waiting');
    }
  }
}, [user, navigation]);
```

### 3. Enhanced WaitingScreen (`src/screens/auth/WaitingScreen.tsx`)

**Purpose**: Provides a better user experience for users awaiting approval.

**New Features**:
- State-specific messaging based on user's current state
- Refresh functionality to check status updates
- User information display
- Logout option
- Different icons and messages for different states

**Supported States**:
- `PENDING_DOCUMENTS`: Documents under review
- `PENDING_VERIFICATION`: Email verification needed
- `PENDING_APPROVAL`/`PENDING`: General approval pending
- `UNDER_REVIEW`: Application being reviewed
- Default: Generic pending message

### 4. Simplified Login/Register Screens

**Changes Made**:
- Removed manual navigation logic from both screens
- Let the navigation system handle routing automatically
- Simplified success handling

## State Normalization

The implementation includes a robust state normalization function that handles various formats:

```typescript
const normalizeState = (state: string | undefined) => {
  if (!state) return '';
  return state.replace(/\s+/g, '_').replace(/-/g, '_').replace(/\W/g, '').toUpperCase();
};
```

**Examples**:
- "pending-documents" → "PENDING_DOCUMENTS"
- "pending documents" → "PENDING_DOCUMENTS"
- "PENDING_VERIFICATION" → "PENDING_VERIFICATION"

## Flow Diagram

```
User Login/Register
        ↓
   AuthContext Updates
        ↓
   RootNavigator Checks User State
        ↓
┌─────────────────────────────────┐
│ Is state READY/ACTIVE/APPROVED? │
└─────────────────────────────────┘
        ↓                    ↓
       YES                  NO
        ↓                    ↓
   Show MainStack      Show AuthStack
                            ↓
                   AuthStack Checks State
                            ↓
                ┌─────────────────────┐
                │ Is state REJECTED?  │
                └─────────────────────┘
                        ↓        ↓
                       YES      NO
                        ↓        ↓
                RejectedScreen  WaitingScreen
```

## API Response Handling

Based on the provided API response structure:

```json
{
  "data": {
    "riderAccount": {
      "state": "PENDING_DOCUMENTS"
    }
  }
}
```

**Flow**:
1. User logs in successfully
2. AuthContext stores user with state "PENDING_DOCUMENTS"
3. RootNavigator checks: "PENDING_DOCUMENTS" ≠ "READY/ACTIVE/APPROVED" → Show AuthStack
4. AuthStack checks: "PENDING_DOCUMENTS" ≠ "REJECTED" → Show WaitingScreen
5. WaitingScreen displays "Documents Under Review" message

## Benefits

1. **Centralized Logic**: All navigation decisions are made in navigation components
2. **Automatic Handling**: No manual navigation needed in screens
3. **Consistent Behavior**: Same logic applies to login and registration
4. **State Flexibility**: Handles various state formats and naming conventions
5. **Better UX**: Specific messaging and refresh functionality for waiting users
6. **Maintainable**: Easy to add new states or modify behavior

## Testing

The implementation handles these test cases correctly:

- ✅ PENDING_DOCUMENTS → WaitingScreen
- ✅ ACTIVE → MainStack
- ✅ READY → MainStack  
- ✅ APPROVED → MainStack
- ✅ REJECTED → RejectedScreen
- ✅ PENDING_VERIFICATION → WaitingScreen
- ✅ Various state formats (hyphens, spaces, case)

## Future Enhancements

1. **Push Notifications**: Notify users when state changes
2. **Polling**: Automatic status checking at intervals
3. **Deep Linking**: Handle state changes from external notifications
4. **Analytics**: Track user state transitions