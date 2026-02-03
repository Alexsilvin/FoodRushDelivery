# Mock Data System - Offline Testing Guide

## Overview

The app now includes a comprehensive mock data system that allows you to test the dashboard UI and card layouts even when the backend is unavailable (503 errors) or when testing offline functionality.

**Created:** 2024-12-19
**Status:** Active - Automatically engages when API calls fail

---

## How It Works

### Automatic Fallback System

When the backend API is unavailable or returns an error, the app automatically falls back to mock data:

1. **Deliveries** - Mock delivery data in [useMyDeliveries hook](src/hooks/useDeliveries.ts#L20)
2. **Analytics** - Mock earnings/summary data in [analyticsService](src/services/analyticsService.ts#L30)
3. **Balance** - Mock balance data in [analyticsService](src/services/analyticsService.ts#L100)

**Flow:**
```
Try API Call → API Fails/Offline → Catch Block → Return Mock Data → UI Renders
```

---

## Mock Data Files

### [src/data/mockData.ts](src/data/mockData.ts)

Central file containing all mock datasets:

#### `MOCK_DELIVERIES` (8 deliveries)

Array of realistic delivery objects with different statuses to showcase all card states:

| Delivery | Status | Distance | Time | Payment | Restaurant |
|----------|--------|----------|------|---------|------------|
| order-001 | pending | 2.3 km | 15 min | XAF 5,500 | Pizza Palace |
| order-002 | accepted | 1.8 km | 12 min | XAF 4,200 | Café Central |
| order-003 | accepted | 3.5 km | 22 min | XAF 6,800 | Burger King |
| order-004 | picked_up | 4.2 km | 28 min | XAF 8,900 | Restaurant Français |
| order-005 | delivering | 1.5 km | 8 min | XAF 3,900 | Taco Fiesta |
| order-006 | pending | 5.1 km | 32 min | XAF 7,200 | Jollof Express |
| order-007 | completed | 2.8 km | 18 min | XAF 9,500 | Seafood Paradise |
| order-008 | pending | 3.3 km | 20 min | XAF 5,800 | Lebanese Kitchen |

**Fields included:**
- id, customerName, customerPhone
- restaurant name, address, coordinates (lat/lng)
- status (pending, accepted, picked_up, delivering, completed)
- distance, estimatedTime, payment
- order details (subtotal, deliveryFee, coordinates)

#### `MOCK_ANALYTICS`

Daily earnings summary:
```typescript
{
  todayEarnings: 38_900,      // XAF
  completedDeliveries: 5,
  rating: 4.8,
  totalOrders: 12,
  acceptanceRate: 92,
}
```

#### `MOCK_BALANCE`

Rider balance information:
```typescript
{
  balance: 125_450,           // XAF
  currency: 'XAF',
}
```

---

## Integration Points

### 1. [useMyDeliveries Hook](src/hooks/useDeliveries.ts#L20)

```typescript
export const useMyDeliveries = (params?: {...}) => {
  return useQuery({
    queryKey: deliveryKeys.my(params),
    queryFn: async () => {
      try {
        return await deliveryService.getMyDeliveries();
      } catch (error) {
        console.log('Using mock delivery data (API unavailable)');
        return MOCK_DELIVERIES;  // ← Fallback here
      }
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};
```

**Impact:** Dashboard receives mock deliveries when `getMyDeliveries()` fails

### 2. [analyticsService](src/services/analyticsService.ts)

#### getRiderSummary()
When API fails, returns:
- `todayEarnings`: 38,900 XAF (from MOCK_ANALYTICS)
- `completedDeliveries`: 5
- `rating`: 4.8
- `completionRate`: 100%
- `totalEarnings`: 450,000 XAF
- `weeklyEarnings`: 180,000 XAF
- `monthlyEarnings`: 750,000 XAF

#### getRiderBalance()
When API fails, returns:
- `balance`: 125,450 XAF (from MOCK_BALANCE)
- `currency`: 'XAF'
- `credits`: 125,450 XAF
- `debits`: 45,000 XAF
- `pendingEarnings`: 15,000 XAF
- `availableForWithdrawal`: 110,450 XAF

---

## Testing Scenarios

### Scenario 1: Test Dashboard with Mock Data

**Current Setup:**
- `BYPASS_AUTH = true` in AuthContext (logs in immediately)
- Backend returns 503 error
- Mock data system activates automatically

**Test Steps:**
1. Run the app: `npm start`
2. App logs in with mock user (driver@test.com)
3. Dashboard loads with 8 mock deliveries
4. Stats cards show mock analytics:
   - Today: XAF 38,900
   - Completed: 5 deliveries
   - Rating: 4.8
   - Balance: XAF 125,450

**Expected UI:**
- Delivery cards render with different statuses (pending, accepted, picked_up, delivering, completed)
- Cards include gradients, shadows, and modern glassmorphic effects
- Action buttons visible (Accept, Navigate, etc.)

### Scenario 2: Offline Testing

**Setup:**
1. Enable airplane mode on device
2. Run app with auth bypass enabled
3. Mock data system automatically provides data

### Scenario 3: Real Backend Testing

**To re-enable real API calls:**
1. Set `BYPASS_AUTH = false` in [AuthContext.tsx](src/contexts/AuthContext.tsx#L6)
2. Ensure backend is running and accessible
3. Log in with real credentials
4. API will be called; mock data only used if API fails

---

## Console Logging

When mock data is used, the app logs:

```
Using mock delivery data (API unavailable)
Using mock analytics data (API unavailable)
Using mock balance data (API unavailable)
```

**How to view:**
- Android: `adb logcat | grep "mock"`
- iOS: Xcode Console
- Expo: Press `j` in Metro terminal for logs

---

## Data Flow Diagram

```
DashboardScreen
├── useMyDeliveries()
│   ├── queryFn: deliveryService.getMyDeliveries()
│   ├── ✅ Success → Return API deliveries
│   └── ❌ Fail → Return MOCK_DELIVERIES (8 items)
│
├── useRiderSummary()
│   ├── queryFn: analyticsService.getRiderSummary()
│   ├── ✅ Success → Return API analytics
│   └── ❌ Fail → Return MOCK_ANALYTICS data
│
└── useRiderBalance()
    ├── queryFn: analyticsService.getRiderBalance()
    ├── ✅ Success → Return API balance
    └── ❌ Fail → Return MOCK_BALANCE data
```

---

## Modifying Mock Data

### Adding More Deliveries

Edit [src/data/mockData.ts](src/data/mockData.ts):

```typescript
export const MOCK_DELIVERIES: Delivery[] = [
  // ... existing deliveries ...
  {
    id: 'delivery-009',
    customerName: 'New Customer',
    restaurant: 'New Restaurant',
    status: 'pending',
    // ... other fields
  } as Delivery,
];
```

### Adjusting Earnings

Edit [src/data/mockData.ts](src/data/mockData.ts):

```typescript
export const MOCK_ANALYTICS = {
  todayEarnings: 50_000,      // Change to desired amount
  completedDeliveries: 7,
  rating: 4.9,
  totalOrders: 15,
  acceptanceRate: 95,
};
```

### Changing Balance

Edit [src/data/mockData.ts](src/data/mockData.ts):

```typescript
export const MOCK_BALANCE = {
  balance: 200_000,  // New balance in XAF
  currency: 'XAF',
};
```

---

## Delivery Status Descriptions

Mock data includes all possible delivery statuses for comprehensive UI testing:

| Status | Card State | User Actions Available |
|--------|-----------|------------------------|
| `pending` | Needs action | Accept / Decline |
| `accepted` | In progress | Navigate to restaurant, Mark picked up |
| `picked_up` | At restaurant | Mark out for delivery |
| `delivering` | On route to customer | Mark as delivered |
| `completed` | Finished | View details, Leave tip, Rate |

---

## Integration with UI Enhancements

Mock data works perfectly with the modern UI updates:

- **Gradient Cards** - All mock deliveries render with gradient backgrounds
- **Glass Effects** - Cards include blur and glassmorphic styling
- **Shadows & Depth** - Enhanced shadows on all delivery cards
- **Status Indicators** - Color-coded status badges match design system
- **Action Buttons** - Gradient buttons on each card with hover effects

---

## Cache Behavior

The mock data respects React Query cache settings:

```typescript
queryFn: async () => {
  try {
    return await deliveryService.getMyDeliveries();
  } catch (error) {
    return MOCK_DELIVERIES;  // Cached for 2 minutes (staleTime)
  }
},
staleTime: 2 * 60 * 1000,   // Don't refetch within 2 minutes
gcTime: 5 * 60 * 1000,      // Keep in cache for 5 minutes
```

---

## Troubleshooting

### Mock data not appearing?

1. **Check API is actually failing:**
   - Open DevTools / Xcode Console
   - Look for API error logs
   - Verify "Using mock data" message appears

2. **Verify BYPASS_AUTH is enabled:**
   - Check [AuthContext.tsx](src/contexts/AuthContext.tsx#L6)
   - Ensure `BYPASS_AUTH = true`

3. **Clear cache:**
   ```bash
   npm start -- --clear
   ```

4. **Check file imports:**
   - Ensure [mockData.ts](src/data/mockData.ts) exists
   - Verify imports in useDeliveries.ts and analyticsService.ts

### Cards not rendering properly?

1. Check that Delivery type matches MOCK_DELIVERIES structure
2. Verify delivery fields include all required properties
3. Check console for TypeScript errors
4. Clear node_modules: `rm -rf node_modules && npm install`

---

## Next Steps

After testing with mock data:

1. **Re-enable real API:** Set `BYPASS_AUTH = false` in AuthContext
2. **Fix backend:** Restart food-rush-be server
3. **Test real data:** Verify API integration works
4. **Phase 2:** Apply UI enhancements to other screens (Map, Chat, Profile)
5. **Clean mock data:** Remove when backend is stable (optional - can leave as fallback)

---

## Related Files

- [AuthContext.tsx](src/contexts/AuthContext.tsx) - Auth bypass flag
- [useDeliveries.ts](src/hooks/useDeliveries.ts) - Delivery fetching logic
- [useAnalytics.ts](src/hooks/useAnalytics.ts) - Analytics hook  
- [analyticsService.ts](src/services/analyticsService.ts) - Analytics API calls
- [DashboardScreen.tsx](src/screens/main/DashboardScreen.tsx) - Dashboard that uses mock data
- [mockData.ts](src/data/mockData.ts) - Central mock data repository

---

**Last Updated:** 2024-12-19
**Status:** ✅ Complete and tested
