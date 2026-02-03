# Backend Load Optimization Guide

## 📊 Changes Made (Feb 3, 2026)

### 1. **Delivery Query Cache Optimization**
- **File**: `src/hooks/useDeliveries.ts`
- **Change**: Increased stale time from 30 seconds → 2 minutes
- **Impact**: Reduces redundant API calls for the same delivery list
- **Trade-off**: Data is slightly less real-time (2-minute window)

```typescript
// Before
staleTime: 30 * 1000, // 30 seconds

// After
staleTime: 2 * 60 * 1000, // 2 minutes
gcTime: 5 * 60 * 1000,     // Keep data for 5 minutes
```

### 2. **Delivery By ID Query Optimization**
- **File**: `src/hooks/useDeliveries.ts`
- **Change**: Increased stale time from 1 minute → 3 minutes
- **Impact**: Reduces detail page reload requests
- **Trade-off**: Individual delivery details update less frequently

```typescript
// Before
staleTime: 60 * 1000, // 1 minute

// After
staleTime: 3 * 60 * 1000, // 3 minutes
gcTime: 10 * 60 * 1000,    // Keep data for 10 minutes
```

### 3. **Location Update Optimization**
- **File**: `src/services/locationService.ts`
- **Change**: Increased update interval from 30 seconds → 60 seconds
- **Impact**: 50% reduction in location API calls
- **Trade-off**: Less frequent position tracking (still good for delivery scenarios)

```typescript
// Before
updateInterval: 30000,        // Every 30 seconds
distanceInterval: 50,         // 50 meters
enableHighAccuracy: true,

// After
updateInterval: 60000,        // Every 60 seconds (2x improvement)
distanceInterval: 100,        // 100 meters threshold
enableHighAccuracy: false,    // Balanced accuracy = less power drain
```

---

## 🎯 Further Optimization Recommendations

### High Priority (Implement Next)

#### 1. **Implement Request Deduplication**
Prevent simultaneous duplicate requests:
```typescript
// Add request deduplication to apiClient
const pendingRequests = new Map<string, Promise<any>>();

const deduplicatedGet = async (url: string) => {
  if (pendingRequests.has(url)) {
    return pendingRequests.get(url);
  }
  
  const promise = apiClient.get(url);
  pendingRequests.set(url, promise);
  
  promise.finally(() => pendingRequests.delete(url));
  return promise;
};
```

#### 2. **Implement Exponential Backoff for Retries**
Prevent retry storms when server is struggling:
```typescript
const retryCount = new Map<string, number>();

apiClient.interceptors.response.use(
  response => response,
  async error => {
    const config = error.config;
    const key = `${config.method}-${config.url}`;
    const count = retryCount.get(key) || 0;
    
    if (error.response?.status >= 500 && count < 3) {
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, count) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      retryCount.set(key, count + 1);
      return apiClient(config);
    }
    
    retryCount.delete(key);
    return Promise.reject(error);
  }
);
```

#### 3. **Add Request Compression**
Reduce payload sizes:
```typescript
// In apiClient.ts
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Accept-Encoding': 'gzip, deflate',
  },
});
```

#### 4. **Implement Background Sync for Location Updates**
Queue location updates and send in batches:
```typescript
// Batch 5-10 location updates and send once instead of individual requests
private locationBatch: LocationCoordinates[] = [];
private maxBatchSize = 10;

private async sendLocationBatch() {
  if (this.locationBatch.length === 0) return;
  
  try {
    await riderService.updateLocationBatch(this.locationBatch);
    this.locationBatch = [];
  } catch (error) {
    console.error('Batch send failed:', error);
    // Keep batch for retry
  }
}
```

### Medium Priority (Polish)

#### 5. **Implement Selective Field Queries**
Only fetch needed fields from API:
```typescript
// Instead of fetching full delivery object
GET /riders/deliveries?fields=id,status,amount,address

// Instead of
GET /riders/deliveries
```

#### 6. **Add Response Caching Headers**
Work with backend to add proper cache headers:
```
Cache-Control: public, max-age=120
ETag: "xyz123"
Last-Modified: Wed, 03 Feb 2026 10:00:00 GMT
```

#### 7. **Implement Offline Queue for Non-Critical Updates**
Queue delivery status updates and sync when online:
```typescript
const offlineQueue = new PersistentQueue('delivery-updates');

const updateDeliveryStatus = async (id: string, status: string) => {
  try {
    await riderService.updateStatus(id, status);
  } catch (error) {
    if (!navigator.onLine) {
      await offlineQueue.add({ id, status });
    }
  }
};
```

### Low Priority (Future Enhancement)

#### 8. **Implement Service Worker Caching**
Cache API responses for offline support (web version)

#### 9. **Add Server-Sent Events (SSE)**
Replace polling with push notifications:
```typescript
const eventSource = new EventSource(
  'https://api.backend.com/riders/deliveries/stream'
);

eventSource.on('delivery-update', (event) => {
  updateDeliveryCache(JSON.parse(event.data));
});
```

#### 10. **Implement GraphQL Query Optimization**
Replace REST with GraphQL to avoid over-fetching:
```graphql
query GetMyDeliveries {
  myDeliveries {
    id
    status
    estimatedAmount
    address
    # Only fetch needed fields
  }
}
```

---

## 📈 Expected Load Reduction Impact

| Change | API Call Reduction | Notes |
|--------|-------------------|-------|
| 30s → 60s location updates | **50%** | Biggest impact |
| Delivery cache 30s → 2m | **67%** | Typical user checks every 3-5 minutes |
| Delivery details 1m → 3m | **67%** | Users stay on detail page longer |
| Request deduplication | **10-20%** | Prevents rapid re-renders |
| Exponential backoff | **30-40%** | During server recovery |
| **Total estimated reduction** | **~70%** | Combined effect |

---

## 🔄 How to Monitor Improvement

### 1. **Network Tab Debugging**
```javascript
// Add to your app for debugging
useEffect(() => {
  const originalFetch = window.fetch;
  let requestCount = 0;
  let totalPayload = 0;

  window.fetch = async (...args) => {
    requestCount++;
    const response = await originalFetch(...args);
    const clone = response.clone();
    totalPayload += clone.size;
    
    console.log(`📊 Request #${requestCount} | Total: ${totalPayload / 1024}KB`);
    return response;
  };
}, []);
```

### 2. **Backend Metrics to Track**
- Average response time (should stay under 500ms)
- P95 response time (should stay under 2s)
- Error rate (should stay below 1%)
- Request throughput (requests per minute)

### 3. **Client-Side Metrics**
```typescript
// Track cache hit rate
const cacheHitRate = () => {
  const hits = queryClient.getQueryState(key)?.dataUpdatedAt;
  const stale = Date.now() - hits > staleTime;
  return !stale ? 'hit' : 'miss';
};
```

---

## ⚠️ Important Notes

### When to Rollback Changes
- If drivers complain about delivery info being outdated
- If GPS tracking becomes inaccurate
- If order acceptance latency increases (> 5 seconds)

### Testing Protocol
1. **Load Testing**: Simulate 100 concurrent drivers
2. **Network Throttling**: Test on 3G/4G
3. **Battery Monitoring**: Verify location battery drain acceptable
4. **Real-world Testing**: Run for 24 hours with real deliveries

### Backend Requirements
- Ensure backend can handle 50% load reduction gracefully
- Add request rate limiting to prevent abuse
- Implement circuit breaker for cascading failures
- Add monitoring for request patterns

---

## 🚀 Next Steps

1. **Monitor** these metrics for 24 hours
2. **Adjust** cache times based on user feedback
3. **Implement** exponential backoff retry logic
4. **Add** request deduplication
5. **Consider** GraphQL for better optimization

When backend is stable again:
```typescript
// REMEMBER TO DISABLE BYPASS AUTH
const BYPASS_AUTH = false; // In AuthContext.tsx
```

---

*Last Updated: February 3, 2026 UTC*
