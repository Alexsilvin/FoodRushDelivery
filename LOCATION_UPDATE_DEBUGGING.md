# Location Update Validation Error - Debugging Guide

## Problem
The app is getting location successfully but failing to send updates to the backend API with error:
```
ERROR  🚨 API Error: AxiosError: Request failed with status code 400 - Validation failed
```

## What This Means
- ✅ GPS/Location services are working correctly
- ✅ App is getting valid coordinates from the device
- ❌ Backend API is rejecting the data (400 = Bad Request with validation error)

## Changes Made for Better Debugging

### 1. Added Coordinate Validation Before Sending
**File**: `src/services/locationService.ts`

```typescript
// Validate coordinates before sending
if (!coordinates.latitude || !coordinates.longitude) {
  console.error('❌ Invalid coordinates:', coordinates);
  return;
}

// Ensure coordinates are valid numbers
const lat = Number(coordinates.latitude);
const lng = Number(coordinates.longitude);

if (isNaN(lat) || isNaN(lng)) {
  console.error('❌ Coordinates are not valid numbers:', { lat, lng, original: coordinates });
  return;
}

// Validate coordinate ranges
if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
  console.error('❌ Coordinates out of valid range:', { lat, lng });
  return;
}
```

### 2. Enhanced Error Logging
Now logs complete error details including:
- Response status code
- Validation error messages
- Backend error data
- Coordinates being sent

```typescript
const errorInfo = {
  status: error?.response?.status,
  message: error?.response?.data?.message || error.message,
  validationErrors: error?.response?.data?.errors || error?.response?.data?.error,
  data: error?.response?.data,
  attempt: attempt + 1,
  maxRetries: this.maxRetries
};

console.error('❌ Location update error details:', JSON.stringify(errorInfo, null, 2));
```

### 3. Added Success Logging
```typescript
console.log(`📤 Sending location update (attempt ${attempt + 1}):`, { latitude: lat, longitude: lng });
// ... send request ...
console.log('✅ Location update successful');
```

## Next Steps to Debug

### Step 1: Run the App and Check Logs
Build and run the app to see the new detailed error logs:

```bash
npx expo start
```

Look for these log messages:
1. `📤 Sending location update (attempt X)` - Shows what coordinates are being sent
2. `❌ Location update error details` - Shows the complete backend response with validation errors

### Step 2: Common Validation Issues

#### Possible Issue 1: Rider Not Approved
The backend might require the rider to be in "APPROVED" or "ACTIVE" status to send location updates.

**Solution**: Check rider status in the database or backend admin panel.

#### Possible Issue 2: Missing Required Fields
The `UpdateLocationDto` schema might require additional fields beyond just latitude/longitude.

**Potential fix**: Check if backend expects additional fields like:
- `timestamp`
- `accuracy`
- `heading`
- `speed`

#### Possible Issue 3: Number Format
Backend might expect specific number format (string vs number).

**Current code sends**: `{ latitude: number, longitude: number }`

**If backend expects strings**, update `riderService.ts`:
```typescript
updateMyLocation: async (latitude: number, longitude: number): Promise<{ message: string }> => {
  const response = await apiClient.patch<ApiResponse<{ message: string }>>('/riders/my/location', {
    latitude: latitude.toString(),
    longitude: longitude.toString()
  });
  return response.data.data!;
},
```

#### Possible Issue 4: Endpoint Mismatch
Current code uses: `/riders/my/location`
Documentation shows: `PATCH /api/v1/riders/my/location`

The `apiClient` should already prepend `/api/v1`, but if not, update the endpoint:
```typescript
// Change from:
await apiClient.patch('/riders/my/location', { ... });
// To:
await apiClient.patch('/api/v1/riders/my/location', { ... });
```

### Step 3: Check Backend Documentation

Visit the backend API docs and find the `UpdateLocationDto` schema:
https://foodrush-be.onrender.com/api/v1/docs

Look for the schema definition to see:
- Required fields
- Data types expected
- Validation rules
- Examples

### Step 4: Test with curl/Postman

Get your auth token from the app and test the endpoint directly:

```bash
# Get the token from app logs or AsyncStorage
# Then test:
curl -X PATCH https://foodrush-be.onrender.com/api/v1/riders/my/location \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"latitude": 9.0820, "longitude": 8.6753}'
```

This will show the exact validation error from the backend.

### Step 5: Check Authentication

The error might be related to authentication/authorization:
- Token might be expired
- Rider account might not have permission to update location
- Rider might not be approved yet

**Check**: Look for 401 (Unauthorized) or 403 (Forbidden) status codes in the new detailed logs.

## Temporary Workaround

If location updates keep failing but don't want to block the app, you can temporarily disable automatic location updates:

**File**: `src/contexts/LocationContext.tsx`

Comment out the location tracking start:
```typescript
// if (isActive) {
//   const trackingStarted = await locationService.startTracking();
//   setIsLocationTracking(trackingStarted);
// }
```

This will allow the app to function while you debug the backend validation issue.

## Related Files
- `src/services/locationService.ts` - Location tracking and update logic
- `src/services/riderService.ts` - API call to update location
- `src/services/apiClient.ts` - HTTP client configuration
- `src/contexts/LocationContext.tsx` - Location state management

## Expected Next Run Output

When you run the app again, you should see logs like:

```
📤 Sending location update (attempt 1): { latitude: 9.0820, longitude: 8.6753 }
❌ Location update error details: {
  "status": 400,
  "message": "Validation failed",
  "validationErrors": {
    "latitude": "must be a valid number",
    // OR
    "riderId": "is required",
    // OR whatever the actual validation error is
  },
  "data": { ...full backend response... },
  "attempt": 1,
  "maxRetries": 3
}
```

This will tell you exactly what the backend is expecting!
